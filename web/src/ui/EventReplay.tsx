/**
 * 事件推演 · 单人扮演界面（`?view=event` 的内容组件）
 *
 * 三条在设计里写死的规则，这里逐条落地：
 *
 * 1. **沉浸式信息隔离**：推演期间界面不出现任何原作文本，也不显示该角色位在原作中的命运。
 *    原作只在终局由玩家主动展开时、经**独立通道** `replayCanon` 请求，且渲染在独立的灰底「史实」区块里。
 * 2. **结构字段必须等完整结果**：`moves[]` 只有在完整结果过了
 *    `validateActAdvanceResult` + `assertWithinVisible` + `assertNoCanonLeak` 之后才可交互；
 *    任一校验不过就转入失败态，绝不允许玩家点到半成品动作。
 * 3. **不判输赢**：只有「代价账本」与关系变化，没有分数、没有成败、没有排名。
 *
 * 依赖注入：`client` 可注入（测试用 mock），默认走 `createHttpEventReplayClient()`。
 */

import { useCallback, useMemo, useRef, useState } from "react";

import { EVENT_LIBRARY_REVIEW_NOTE, eventReplays } from "../data/eventReplays";
import {
  assertNoCanonLeak,
  assertWithinVisible,
  validateActAdvanceResult,
} from "../domain/eventReplay";
import {
  canChooseMove,
  createInitialReplayState,
  relationGateReason,
  replayReducer,
} from "../domain/eventReplayReducer";
import type { EventReplay as EventReplayData, Move, ReplayAction, ReplayState } from "../types/eventReplay";
import { createHttpEventReplayClient, type EventReplayClient } from "./event-replay/eventReplayClient";
import "./eventReplay.css";

const LEDGER_LABELS: { key: keyof ReplayState["ledger"]; label: string }[] = [
  { key: "time", label: "时间" },
  { key: "money", label: "钱" },
  { key: "relation", label: "关系" },
  { key: "health", label: "健康" },
  { key: "opportunity", label: "机会" },
];

export interface EventReplayProps {
  client?: EventReplayClient;
  events?: EventReplayData[];
  initialEventId?: string | null;
}

export function EventReplay({ client, events = eventReplays, initialEventId = null }: EventReplayProps) {
  const injectedClient = useMemo(() => client ?? createHttpEventReplayClient(), [client]);

  const firstEvent = events[0] ?? eventReplays[0];
  const [eventId, setEventId] = useState<string>(() => initialEventId ?? firstEvent?.header.id ?? "");
  const eventRef = useRef<EventReplayData>(firstEvent);
  const activeEvent =
    events.find((item) => item.header.id === eventId) ?? firstEvent;

  const [state, setState] = useState<ReplayState>(() => createInitialReplayState(firstEvent));
  const stateRef = useRef(state);

  /** 所有状态迁移都走这里：纯 reducer 计算结果 → 同步写 ref → 触发渲染。 */
  const apply = useCallback((action: ReplayAction): ReplayState => {
    const next = replayReducer(eventRef.current, stateRef.current, action);
    stateRef.current = next;
    setState(next);
    return next;
  }, []);

  const [degraded, setDegraded] = useState(false);
  const [endingStatus, setEndingStatus] = useState<"idle" | "pending" | "error">("idle");
  const [endingDraft, setEndingDraft] = useState("");
  const [endingError, setEndingError] = useState<string | null>(null);
  const [canonStatus, setCanonStatus] = useState<"idle" | "pending" | "error">("idle");
  const [canonError, setCanonError] = useState<string | null>(null);
  const lastAttemptRef = useRef<string | null>(null);

  const position = activeEvent?.positions.find((item) => item.id === state.positionId) ?? null;
  const positionNames = useMemo(() => {
    const map = new Map<string, string>();
    (activeEvent?.positions ?? []).forEach((item) => map.set(item.id, item.name));
    return map;
  }, [activeEvent]);

  const requestEnding = useCallback(
    async (base: ReplayState) => {
      const currentPosition = eventRef.current.positions.find((item) => item.id === base.positionId);
      if (!currentPosition) return;
      setEndingStatus("pending");
      setEndingDraft("");
      setEndingError(null);
      const response = await injectedClient.ending(
        {
          position: currentPosition,
          history: base.history,
          ledger: base.ledger,
          relations: base.relations,
        },
        { onDelta: (text) => setEndingDraft((prev) => prev + text) },
      );
      if (!response.ok || !response.result) {
        setEndingStatus("error");
        setEndingError(response.error ?? "结局暂时无法生成");
        return;
      }
      if (response.degraded) setDegraded(true);
      setEndingStatus("idle");
      apply({ type: "ENDING_RECEIVED", ending: response.result });
    },
    [apply, injectedClient],
  );

  /**
   * 请求一幕推进。
   *
   * `base` 是**已经 dispatch 过**的状态（pending=true），请求参数全部取自它——
   * 这样就不会出现"用旧状态发请求"的竞态。
   */
  const requestAdvance = useCallback(
    async (base: ReplayState, chosenMoveId: string | null) => {
      const currentEvent = eventRef.current;
      const currentPosition = currentEvent.positions.find((item) => item.id === base.positionId);
      if (!currentPosition) return;
      lastAttemptRef.current = chosenMoveId;

      const response = await injectedClient.advance(
        {
          header: currentEvent.header,
          position: currentPosition,
          acts: currentEvent.acts,
          actIndex: base.actIndex,
          ledger: base.ledger,
          relations: base.relations,
          history: base.history,
          chosenMoveId,
        },
        { onDelta: (text) => apply({ type: "ADVANCE_STREAM", text }) },
      );

      if (!response.ok || !response.result) {
        apply({ type: "ADVANCE_FAILED", message: response.error ?? "这一步暂时无法推进" });
        return;
      }
      if (response.degraded) setDegraded(true);

      const result = response.result;
      // 结构字段的三道闸门：结构 → 角色位信息范围 → 原作关键词黑名单
      const structural = validateActAdvanceResult(
        result,
        currentEvent.positions.map((item) => item.id),
        base.actIndex,
        currentEvent.header.endingCondition.actCount,
      );
      const visible = assertWithinVisible(result, currentPosition);
      const leaked = assertNoCanonLeak(
        [result.outcome, result.nextScene.text, ...result.moves.map((move) => move.text)].join(" "),
        currentEvent.canon,
      );
      if (!structural.ok || !visible.ok || leaked.length > 0) {
        apply({ type: "ADVANCE_FAILED", message: "这一步暂时无法推进" });
        return;
      }

      const next = apply({ type: "ADVANCE_SUCCEEDED", chosenMoveId, result });
      if (next.ended) void requestEnding(next);
    },
    [apply, injectedClient, requestEnding],
  );

  const selectPosition = useCallback(
    (positionId: string) => {
      const next = apply({ type: "SELECT_POSITION", positionId });
      if (next.pending) void requestAdvance(next, null);
    },
    [apply, requestAdvance],
  );

  const chooseMove = useCallback(
    (moveId: string) => {
      const next = apply({ type: "ACT_CHOSEN", moveId });
      if (next.pending) void requestAdvance(next, moveId);
    },
    [apply, requestAdvance],
  );

  const retry = useCallback(() => {
    const next = apply({ type: "RETRY" });
    if (next.pending) void requestAdvance(next, lastAttemptRef.current);
  }, [apply, requestAdvance]);

  const revealCanon = useCallback(async () => {
    setCanonStatus("pending");
    setCanonError(null);
    const response = await injectedClient.canon(eventRef.current.header.id);
    if (!response.ok || !response.result) {
      setCanonStatus("error");
      setCanonError(response.error ?? "原作暂时无法读取");
      return;
    }
    setCanonStatus("idle");
    apply({ type: "REVEAL_CANON", canon: response.result });
  }, [apply, injectedClient]);

  const switchEvent = useCallback((id: string) => {
    const next = events.find((item) => item.header.id === id);
    if (!next) return;
    eventRef.current = next;
    setEventId(id);
    const fresh = createInitialReplayState(next);
    stateRef.current = fresh;
    setState(fresh);
  }, [events]);

  const restart = useCallback(() => {
    apply({ type: "RESTART" });
    setEndingStatus("idle");
    setEndingDraft("");
    setEndingError(null);
    setCanonStatus("idle");
    setCanonError(null);
  }, [apply]);

  if (!activeEvent) {
    return (
      <section className="event-replay">
        <h1>事件推演</h1>
        <p>事件库为空。</p>
      </section>
    );
  }

  const currentAct = activeEvent.acts[Math.min(state.actIndex, activeEvent.acts.length - 1)];
  const narrative = state.pending ? state.streamingOutcome : state.currentScene;
  const endingText = endingDraft || state.ending?.text || "";

  return (
    <section className="event-replay" aria-label="事件推演">
      <header className="er-topbar">
        <div>
          <h1>事件推演</h1>
          <p className="er-subtitle">单人扮演 · 没有对手 · 不判输赢，只记代价</p>
        </div>
        {events.length > 1 && state.history.length === 0 && !state.pending ? (
          <label className="er-event-picker">
            <span>选择事件</span>
            <select value={eventId} onChange={(event) => switchEvent(event.target.value)}>
              {events.map((item) => (
                <option key={item.header.id} value={item.header.id}>
                  {item.header.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </header>

      {degraded ? (
        <p role="status" className="er-degraded">
          当前结果由服务端**启发式降级**生成（模拟），不是真实模型输出。
        </p>
      ) : null}

      {!position ? (
        <div className="er-lobby">
          <article className="er-card er-event-head">
            <h2>{activeEvent.header.title}</h2>
            <p className="er-background">{activeEvent.header.background}</p>
            <p className="er-adapted">
              改编声明：人物化名 · 机构模糊 · 时间粒度到月。本事件改编自公开讨论，不对应任何可识别的真实个人。
            </p>
          </article>
          <div className="er-lobby-positions">
            <h2>选一个角色位进入事件</h2>
            <p className="er-hint">选角色不是选结局，而是选一个处境：你看到的信息、能动用的资源都不一样。</p>
            <ul className="er-position-list">
              {activeEvent.positions.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="er-position-card"
                    onClick={() => selectPosition(item.id)}
                    aria-label={`以${item.name}进入事件`}
                  >
                    <h3>{item.name}</h3>
                    <dl>
                      <dt>在乎什么</dt>
                      <dd>{item.stake}</dd>
                      <dt>知道什么</dt>
                      <dd>{item.visible}</dd>
                      <dt>能动用什么</dt>
                      <dd>{item.resources}</dd>
                      <dt>能做什么</dt>
                      <dd>{item.canDo.join(" · ")}</dd>
                    </dl>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="er-board">
          <div className="er-main">
            <section className="er-scene" aria-label={`第 ${state.actIndex + 1} 幕`}>
              <div className="er-scene-head">
                <h2>
                  第 {state.actIndex + 1} 幕 · {currentAct?.month}
                </h2>
                <span className="er-tag er-tag-fact" title="外部事件是锁定的，不因你的选择改变">
                  外部事件
                </span>
              </div>
              <p className="er-act-text">{currentAct?.text}</p>

              {narrative ? (
                <p className="er-narrative" data-role="narrative">
                  {narrative}
                  {state.pending ? <span className="er-caret" aria-hidden="true" /> : null}
                </p>
              ) : null}

              {state.pending ? (
                <p role="status" className="er-generating">
                  正在推演这一步…
                </p>
              ) : null}

              {state.pendingError ? (
                <div role="alert" className="er-error">
                  <p>{state.pendingError}</p>
                  {state.streamingOutcome ? (
                    <p className="er-partial">以上文本「未完成」，不会被记入这一局。</p>
                  ) : null}
                  <button type="button" onClick={retry}>
                    重试这一步
                  </button>
                </div>
              ) : null}

              {!state.pending && !state.ended && state.currentMoves.length > 0 ? (
                <ul className="er-move-list" aria-label="可选动作">
                  {state.currentMoves.map((move) => (
                    <MoveCard
                      key={move.id}
                      move={move}
                      disabled={!canChooseMove(state, move)}
                      onChoose={() => chooseMove(move.id)}
                    />
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="er-timeline" aria-label="幕时间线">
              <div className="er-scene-head">
                <h2>你走过的路</h2>
                <span className="er-tag er-tag-fiction">架空推演</span>
              </div>
              <ol>
                {activeEvent.acts.map((act) => {
                  const played = state.history.find((item) => item.actIndex === act.index);
                  const isCurrent = act.index === state.actIndex && !state.ended;
                  return (
                    <li key={act.index} data-current={isCurrent ? "true" : undefined}>
                      <h3>
                        {act.month} · 第 {act.index + 1} 幕
                      </h3>
                      <p className="er-timeline-act">{act.text}</p>
                      {played ? (
                        <div className="er-timeline-played">
                          <p>
                            <strong>你的决定：</strong>
                            {played.moveText}
                          </p>
                          <p>{played.outcome}</p>
                        </div>
                      ) : (
                        <p className="er-timeline-empty">{isCurrent ? "进行中" : "尚未走到"}</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>

            {state.ended ? (
              <section className="er-ending" aria-label="结局">
                <div className="er-scene-head">
                  <h2>{state.ending?.title ?? "这一局到此为止"}</h2>
                  <span className="er-tag er-tag-fiction">架空推演</span>
                </div>
                {endingStatus === "pending" ? <p role="status">正在收束这一局…</p> : null}
                {endingText ? <p className="er-ending-text">{endingText}</p> : null}
                {endingStatus === "error" ? (
                  <div role="alert" className="er-error">
                    <p>{endingError}</p>
                    <button type="button" onClick={() => void requestEnding(stateRef.current)}>
                      重试生成结局
                    </button>
                  </div>
                ) : null}
                <p className="er-ending-note">这里没有胜负判定——只有你付出了什么、得到了什么。</p>
                <button type="button" className="er-restart" onClick={restart}>
                  换个角色位重玩
                </button>

                {!state.canonRevealed ? (
                  <div className="er-canon-entry">
                    <button
                      type="button"
                      onClick={() => void revealCanon()}
                      disabled={canonStatus === "pending"}
                    >
                      {canonStatus === "pending" ? "正在读取…" : "历史上实际发生了什么"}
                    </button>
                    <p className="er-hint">展开后会显示与现实对照的材料；你走的这条线始终是「架空推演」。</p>
                    {canonStatus === "error" ? (
                      <div role="alert" className="er-error">
                        <p>{canonError}</p>
                        <button type="button" onClick={() => void revealCanon()}>
                          重试
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="er-canon" aria-label="原作揭示">
                    <div className="er-scene-head">
                      <h3>现实中后来怎么走</h3>
                      <span className="er-tag er-tag-fact">史实</span>
                    </div>
                    <ol>
                      {state.canon?.map((entry) => (
                        <li key={entry.actIndex}>
                          <h4>
                            {entry.month} · 第 {entry.actIndex + 1} 幕
                          </h4>
                          <p>{entry.development}</p>
                          <ul className="er-sources">
                            {entry.sources.map((source) => (
                              <li key={source.url}>
                                <a href={source.url} target="_blank" rel="noreferrer noopener">
                                  {source.excerpt}
                                </a>
                                <span className="er-source-time">审核于 {source.reviewedAt}</span>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </section>
            ) : null}
          </div>

          <aside className="er-side" aria-label="账本与关系">
            <h2>代价账本</h2>
            <p className="er-hint">替代分数的反馈：不评优劣，只记你付出了什么。</p>
            <ul className="er-ledger">
              {LEDGER_LABELS.map(({ key, label }) => (
                <li key={key}>
                  <span>{label}</span>
                  <strong data-sign={state.ledger[key] > 0 ? "up" : state.ledger[key] < 0 ? "down" : "flat"}>
                    {state.ledger[key] > 0 ? `+${state.ledger[key]}` : state.ledger[key]}
                  </strong>
                </li>
              ))}
            </ul>

            <h2>关系</h2>
            <ul className="er-relations">
              {Object.entries(state.relations).map(([id, value]) => (
                <li key={id}>
                  <span>{positionNames.get(id) ?? id}</span>
                  <strong>{value}</strong>
                </li>
              ))}
            </ul>

            <h2>你现在的处境</h2>
            <p className="er-position-brief">
              <strong>{position.name}</strong>
              <br />
              在乎：{position.stake}
              <br />
              知道：{position.visible}
            </p>
            <p className="er-review-note">{EVENT_LIBRARY_REVIEW_NOTE}</p>
          </aside>
        </div>
      )}
    </section>
  );
}

function MoveCard({
  move,
  disabled,
  onChoose,
}: {
  move: Move;
  disabled: boolean;
  onChoose: () => void;
}) {
  const reason = relationGateReason(move);
  return (
    <li className="er-move">
      <button type="button" className="er-move-button" onClick={onChoose} disabled={disabled}>
        <span className="er-move-text">{move.text}</span>
        <span className="er-move-cost">代价：{move.costHint}</span>
      </button>
      {disabled && reason ? <p className="er-move-locked">{reason}</p> : null}
      <details className="er-assumption">
        <summary>这一步默认成立的前提</summary>
        <p>{move.implicitAssumption}</p>
      </details>
    </li>
  );
}
