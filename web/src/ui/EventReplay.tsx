/**
 * 事件推演 · 单人扮演界面（`?view=event` 的内容组件）
 *
 * 三条在设计里写死的规则，这里逐条落地：
 *
 * 1. **沉浸式信息隔离**：推演期间界面不出现任何原作文本，也不显示该角色位在原作中的命运。
 *    原作只在终局由玩家主动展开时、经**独立通道** `replayCanon` 请求，且渲染在终局对照表的
 *    「史实」列里（`er-tag-real`），与模拟层视觉分离。
 * 2. **结构字段必须等完整结果**：`moves[]` 只有在完整结果过了
 *    `validateActAdvanceResult` + `assertWithinVisible` + `assertNoCanonLeak` 之后才可交互；
 *    任一校验不过就转入失败态，绝不允许玩家点到半成品动作。
 * 3. **不判输赢**：只有「代价账本」与关系变化，没有分数、没有成败、没有排名。
 *
 * 版式：v0.2 起按交互原型 `prototypes/event-replay-prototype.html` 的视觉系统落地 ——
 * 顶栏（logo + crumb + 按钮组）+ 三栏（左：事件卡 / 推演路径 / 图层说明；中：舞台；
 * 右：Host 追问 / 我的路径 / 本局数据 / 代价账本）+ 终局遮罩对照表。
 * **只借壳，不借语义**：原型里「多数人占比」「从这里重走」「把分歧点丢进辩论树」属于
 * v0.3 旧形态，本版已废弃（无回溯、与辩论树解耦、无预设结局），故不实现。
 *
 * 依赖注入：`client` 可注入（测试用 mock），默认走 `createHttpEventReplayClient()`。
 */

import { useCallback, useMemo, useRef, useState } from "react";

import { EVENT_LIBRARY_REVIEW_NOTE, eventReplays } from "../data/eventReplays";
import {
  LEDGER_KEYS,
  LEDGER_KEY_LABELS,
  assertNoCanonLeak,
  assertWithinVisible,
  normalizeLedgerKey,
  resolveRelationTarget,
  validateActAdvanceResult,
} from "../domain/eventReplay";
import {
  canChooseMove,
  createInitialReplayState,
  relationGateReason,
  replayReducer,
} from "../domain/eventReplayReducer";
import type {
  EventReplay as EventReplayData,
  LedgerKey,
  Move,
  ReplayAction,
  ReplayState,
} from "../types/eventReplay";
import { createHttpEventReplayClient, type EventReplayClient } from "./event-replay/eventReplayClient";
import "./eventReplay.css";

/**
 * 账本五维的展示顺序与标签 —— 全部取自 domain，避免标签在 UI 与服务端契约两处各写一份
 * （请求体里的 `LedgerEntry.key` 用的就是同一组中文名）。
 */
const LEDGER_LABELS: { key: LedgerKey; label: string }[] = LEDGER_KEYS.map((key) => ({
  key,
  label: LEDGER_KEY_LABELS[key],
}));

/** 账本增量的展示标签：模型给的中文名归一回五维标准词，归一不了就原样展示。 */
function ledgerLabel(rawKey: string): string {
  const key = normalizeLedgerKey(rawKey);
  return key ? LEDGER_KEY_LABELS[key] : rawKey;
}

/** 增量数值带符号（正数补 +），与代价账本的展示口径一致。 */
function fmtDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta);
}

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
          // 关系条目用角色位名做 target，需要整表做 id→名 映射（契约 §0.7）
          positions: eventRef.current.positions,
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
          positions: currentEvent.positions,
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
      <section className="event-replay" aria-label="事件推演">
        <header className="er-header">
          <span className="er-logo">争鸣</span>
          <span className="er-crumb">事件推演</span>
          <span className="er-spacer" />
          <ModuleLinks />
        </header>
        <main className="er-main">
          <div className="er-col-c">
            <p className="er-stage-text">事件库为空。</p>
          </div>
        </main>
      </section>
    );
  }

  const currentAct = activeEvent.acts[Math.min(state.actIndex, activeEvent.acts.length - 1)];
  const narrative = state.pending ? state.streamingOutcome : state.currentScene;
  const endingText = endingDraft || state.ending?.text || "";
  const relationEntries = Object.entries(state.relations).filter(([, value]) => value !== 0);
  const costlySteps = state.history.filter(
    (item) => item.ledgerDeltas.length > 0 || item.relationDeltas.length > 0,
  ).length;
  const lastPlayed = state.history[state.history.length - 1] ?? null;

  return (
    <section className="event-replay" aria-label="事件推演">
      <header className="er-header">
        <span className="er-logo">争鸣</span>
        <span className="er-crumb">
          事件推演 · <b>{activeEvent.header.title}</b>
        </span>
        <span className="er-spacer" />
        <ModuleLinks />
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
          当前结果由服务端启发式降级生成（模拟），不是真实模型输出。
        </p>
      ) : null}

      <main className="er-main">
        {/* ── 左栏：事件卡 / 推演路径 / 图层说明 ── */}
        <div className="er-col-l">
          <div className="er-mcard">
            <div className="er-panel-title">事件卡</div>
            <div className="er-event-title">{activeEvent.header.title}</div>
            <p className="er-event-background">{activeEvent.header.background}</p>
            <div className="er-adapt">
              <b>改编声明</b> · 人物为化名 · 机构已模糊 · 时间粒度到月。本事件改编自公开讨论，
              不对应任何可识别的真实个人。模拟推演 ≠ 真实历史。
            </div>
          </div>

          <div className="er-mcard">
            <div className="er-panel-title">
              推演路径
              <span className="er-tag er-tag-fiction">架空推演</span>
            </div>
            <div className="er-tl">
              {activeEvent.acts.map((act) => {
                const played = state.history.find((item) => item.actIndex === act.index);
                const tlState = played
                  ? "played"
                  : act.index === state.actIndex && !state.ended
                    ? "current"
                    : "todo";
                return (
                  <div key={act.index} className="er-tl-item" data-state={tlState}>
                    <div className="er-tl-dot" />
                    <div className="er-tl-txt">
                      {act.month} · 第 {act.index + 1} 幕
                      {played ? (
                        <>
                          <div className="er-tl-choice">你的决定：{played.moveText}</div>
                          <div className="er-tl-outcome">{played.outcome}</div>
                        </>
                      ) : (
                        <div className="er-tl-outcome">
                          {tlState === "current" ? "进行中" : "尚未走到"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="er-note">本版不回溯：走过的决定会留在账本里，不能撤销。</p>
          </div>

          <div className="er-mcard">
            <div className="er-panel-title">图层说明</div>
            <div className="er-legend">
              <span>
                <i style={{ background: "#f7fbff", border: "1px solid var(--er-blue)" }} />
                模拟层 · 你的推演（架空）
              </span>
              <span>
                <i style={{ background: "var(--er-bg)", border: "1px dashed var(--er-real)" }} />
                事实层 · 现实发展（终局对照时才出现）
              </span>
              <span>
                <i style={{ background: "var(--er-blue)" }} />
                已走过的幕
              </span>
            </div>
            <p className="er-note">{EVENT_LIBRARY_REVIEW_NOTE}</p>
          </div>
        </div>

        {/* ── 中栏：舞台 ── */}
        <div className="er-col-c">
          {!position ? (
            <div className="er-stage">
              <div className="er-stage-time">事件推演</div>
              <div className="er-stage-forkq">选一个角色位进入事件</div>
              <p className="er-lobby-note">
                选角色不是选结局，而是选一个处境：你看到的信息、能动用的资源都不一样。
              </p>
              <ul className="er-opts">
                {activeEvent.positions.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="er-opt"
                      onClick={() => selectPosition(item.id)}
                      aria-label={`以${item.name}进入事件`}
                    >
                      <span className="er-opt-t">{item.name}</span>
                      <dl className="er-position-fields">
                        <dt>在乎什么</dt>
                        <dd>{item.stake}</dd>
                        <dt>知道什么</dt>
                        <dd>{item.visible.join("；")}</dd>
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
          ) : (
            <div className="er-stage">
              <div className="er-stage-time">
                第 {Math.min(state.actIndex, activeEvent.acts.length - 1) + 1} 幕 · {currentAct?.month}
                <span className="er-tag er-tag-lo" title="外部事件由历史时间线锁定，不因你的选择改变">
                  外部事件
                </span>
              </div>
              <p className="er-stage-text">{currentAct?.text}</p>

              {narrative ? (
                <div className="er-conseq">
                  <div className="er-conseq-label">
                    {state.history.length > 0 ? "模拟后果 · 你这一步之后" : "开局处境"}
                    <span className="er-tag er-tag-fiction">架空推演</span>
                  </div>
                  <p data-role="narrative" style={{ margin: 0 }}>
                    {narrative}
                    {state.pending ? <span className="er-caret" aria-hidden="true" /> : null}
                  </p>
                </div>
              ) : null}

              {state.pending ? (
                <p role="status" className="er-status">
                  正在推演这一步…
                </p>
              ) : null}

              {/*
                完整推演路径：把每一幕选过的动作、当时的后果与代价按序铺开。
                与左栏「推演路径」时间轴的区别：这里是**全文版**（不截断后果与代价明细），
                正在推演中的选择也会以「推演中…」占位即时挂进来。
              */}
              {state.history.length > 0 || (state.pending && state.pendingMoveId) ? (
                <div className="er-pathfull" aria-label="推演路径">
                  <div className="er-pathfull-label">
                    推演路径 · 已做过的决定
                    <span className="er-tag er-tag-fiction">架空推演</span>
                  </div>
                  <ol className="er-pathfull-steps">
                    {state.history.map((played, index) => {
                      const act = activeEvent.acts.find((item) => item.index === played.actIndex);
                      return (
                        <li key={played.actIndex} className="er-pathfull-step">
                          <div className="er-pathfull-head">
                            <span className="er-pathfull-no">第 {index + 1} 步</span>
                            <span className="er-pathfull-month">{act?.month ?? ""}</span>
                          </div>
                          <div className="er-pathfull-move">你选择了：{played.moveText}</div>
                          <div className="er-pathfull-outcome">{played.outcome}</div>
                          {played.ledgerDeltas.some((delta) => delta.delta !== 0) ||
                          played.relationDeltas.some((delta) => delta.delta !== 0) ? (
                            <div className="er-pathfull-cost">
                              {played.ledgerDeltas
                                .filter((delta) => delta.delta !== 0)
                                .map((delta, deltaIndex) => (
                                  <span key={`l${deltaIndex}`} className="er-cost-chip">
                                    {ledgerLabel(delta.key)} {fmtDelta(delta.delta)}
                                    {delta.note ? <i>（{delta.note}）</i> : null}
                                  </span>
                                ))}
                              {played.relationDeltas
                                .filter((delta) => delta.delta !== 0)
                                .map((delta, deltaIndex) => {
                                // resolveRelationTarget 返回角色位 id；展示用回名字（解析不了就原样展示）
                                const resolvedId = resolveRelationTarget(
                                  delta.target,
                                  activeEvent.positions,
                                );
                                const name = resolvedId
                                  ? (positionNames.get(resolvedId) ?? resolvedId)
                                  : delta.target;
                                return (
                                  <span key={`r${deltaIndex}`} className="er-cost-chip er-cost-rel">
                                    {name} {fmtDelta(delta.delta)}
                                  </span>
                                );
                              })}
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                    {state.pending && state.pendingMoveId ? (
                      <li className="er-pathfull-step" data-state="pending">
                        <div className="er-pathfull-head">
                          <span className="er-pathfull-no">第 {state.history.length + 1} 步</span>
                          <span className="er-pathfull-month">推演中…</span>
                        </div>
                        <div className="er-pathfull-move">
                          你选择了：
                          {state.currentMoves.find((item) => item.id === state.pendingMoveId)
                            ?.text ?? ""}
                        </div>
                      </li>
                    ) : null}
                  </ol>
                  <p className="er-note">
                    走过的每一步都留在这条路径里——本版不回溯，代价不可撤销。
                  </p>
                </div>
              ) : null}

              {state.pendingError ? (
                <div role="alert" className="er-error">
                  <p>{state.pendingError}</p>
                  {state.streamingOutcome ? (
                    <p className="er-partial">以上文本「未完成」，不会被记入这一局。</p>
                  ) : null}
                  <button type="button" className="er-btn" onClick={retry}>
                    重试这一步
                  </button>
                </div>
              ) : null}

              {!state.pending && !state.ended && state.currentMoves.length > 0 ? (
                <>
                  <div className="er-stage-forkq">换你来做这个决定——</div>
                  <ul className="er-opts" aria-label="可选动作">
                    {state.currentMoves.map((move) => (
                      <MoveCard
                        key={move.id}
                        move={move}
                        disabled={!canChooseMove(state, move)}
                        onChoose={() => chooseMove(move.id)}
                      />
                    ))}
                  </ul>
                </>
              ) : null}

              {state.ended ? (
                <p className="er-status">这一局已收束 —— 终局对照已展开。</p>
              ) : null}
            </div>
          )}
        </div>

        {/* ── 右栏：Host 追问 / 我的路径 / 本局数据 / 代价账本 ── */}
        <div className="er-col-r">
          <div className="er-mcard">
            <div className="er-panel-title">Host · 追问（不评判）</div>
            <div className="er-hint-card">
              <div className="er-hint-head">{position ? "当前这一幕" : "进局之前"}</div>
              <div className="er-hint-body">
                {position
                  ? "外部事件是锁定的节拍，不因你而改变；你真正能决定的是：在这一幕里，你用什么代价换什么。"
                  : "先选一个角色位——你看到的信息与能动用的资源，从这一步开始不同。"}
              </div>
            </div>
            {lastPlayed ? (
              <p className="er-note">上一幕你走的是：{lastPlayed.moveText}</p>
            ) : null}
          </div>

          <div className="er-mcard">
            <div className="er-panel-title">我的路径</div>
            {state.history.length > 0 ? (
              <div>
                {state.history.map((item) => (
                  <span key={item.actIndex} className="er-path-chip">
                    {truncate(item.moveText, 14)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="er-note">还没有做过决定。</p>
            )}
          </div>

          <div className="er-mcard">
            <div className="er-panel-title">本局数据</div>
            <div className="er-stats">
              <div className="er-stat">
                <b>{state.history.length}</b>
                <span>走过的幕</span>
              </div>
              <div className="er-stat">
                <b>{costlySteps}</b>
                <span>动了账本的步</span>
              </div>
              <div className="er-stat">
                <b>{relationEntries.length}</b>
                <span>变化中的关系</span>
              </div>
            </div>
          </div>

          <div className="er-mcard">
            <div className="er-panel-title">代价账本</div>
            <p className="er-note">替代分数的反馈：不评优劣，不判输赢，只记你付出了什么。</p>
            <ul className="er-kv">
              {LEDGER_LABELS.map(({ key, label }) => {
                const value = state.ledger[key];
                return (
                  <li key={key}>
                    <span>{label}</span>
                    <strong data-sign={value > 0 ? "up" : value < 0 ? "down" : "flat"}>
                      {value > 0 ? `+${value}` : value}
                    </strong>
                  </li>
                );
              })}
            </ul>

            {relationEntries.length > 0 ? (
              <>
                <div className="er-panel-title" style={{ marginTop: 12 }}>
                  关系
                </div>
                <ul className="er-kv">
                  {relationEntries.map(([id, value]) => (
                    <li key={id}>
                      <span>{positionNames.get(id) ?? id}</span>
                      <strong data-sign={value > 0 ? "up" : "down"}>
                        {value > 0 ? `+${value}` : value}
                      </strong>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {position ? (
              <>
                <div className="er-panel-title" style={{ marginTop: 12 }}>
                  你现在的处境
                </div>
                <p className="er-position-brief">
                  <strong>{position.name}</strong>
                  <br />
                  在乎：{position.stake}
                  <br />
                  知道：{position.visible.join("；")}
                  <br />
                  能动用：{position.resources}
                </p>
              </>
            ) : null}
          </div>
        </div>
      </main>

      {/* ── 终局遮罩：对照表（原作列只在主动揭示后才进 DOM） ── */}
      {state.ended ? (
        <div className="er-mask" role="dialog" aria-label="终局对照">
          <div className="er-endcard">
            <h2>推演结束 · 终局对照</h2>
            <p className="er-endsub">
              {state.ending?.title ?? "这一局到此为止"} · 你走了 {state.history.length} 幕 ·
              单人扮演，不判输赢，只记代价
            </p>

            {endingStatus === "pending" ? (
              <p role="status" className="er-status">
                正在收束这一局…
              </p>
            ) : null}
            {endingText ? <div className="er-endstory">{endingText}</div> : null}
            {endingStatus === "error" ? (
              <div role="alert" className="er-error">
                <p>{endingError}</p>
                <button
                  type="button"
                  className="er-btn"
                  onClick={() => void requestEnding(stateRef.current)}
                >
                  重试生成结局
                </button>
              </div>
            ) : null}

            <table className="er-cmp">
              <thead>
                <tr>
                  <th style={{ width: "22%" }}>幕</th>
                  <th>你的选择</th>
                  {state.canonRevealed ? <th>现实中后来怎么走</th> : null}
                </tr>
              </thead>
              <tbody>
                {state.history.map((played, index) => {
                  const act = activeEvent.acts.find((item) => item.index === played.actIndex);
                  const entry = state.canon?.find((item) => item.actIndex === played.actIndex) ?? null;
                  return (
                    <tr key={played.actIndex}>
                      <td>
                        幕 {index + 1}
                        <div className="er-note" style={{ margin: 0 }}>
                          {act?.month}
                        </div>
                      </td>
                      <td className="you">{played.moveText}</td>
                      {state.canonRevealed ? (
                        <td className="real">
                          {entry ? (
                            <>
                              <span className="er-tag er-tag-real">史实</span> {entry.development}
                              {entry.sources.map((source) => (
                                <span className="er-src" key={source.url}>
                                  <a href={source.url} target="_blank" rel="noreferrer noopener">
                                    {source.excerpt}
                                  </a>{" "}
                                  · 审核于 {source.reviewedAt}
                                </span>
                              ))}
                            </>
                          ) : (
                            "未有对照材料"
                          )}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!state.canonRevealed ? (
              <div className="er-canon-entry">
                <button
                  type="button"
                  className="er-btn er-btn-primary"
                  onClick={() => void revealCanon()}
                  disabled={canonStatus === "pending"}
                >
                  {canonStatus === "pending" ? "正在读取…" : "历史上实际发生了什么"}
                </button>
                <p>展开后会显示与现实对照的材料；你走的这条线始终是「架空推演」。</p>
                {canonStatus === "error" ? (
                  <div role="alert" className="er-error">
                    <p>{canonError}</p>
                    <button type="button" className="er-btn" onClick={() => void revealCanon()}>
                      重试
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="er-actions">
              <button type="button" className="er-btn" onClick={restart}>
                ↺ 换个角色位重玩
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** 顶栏模块切换（与辩论树 `.dt-nav`、事件推演旧版 `.er-nav` 同形制，靠 `?view=` 跳转）。 */
function ModuleLinks() {
  return (
    <nav className="er-nav" aria-label="模块切换">
      <a className="er-btn" href="?view=debate">
        ← 返回辩论树
      </a>
      <a className="er-btn" href="?view=map">
        争议地图
      </a>
      <a className="er-btn" href="?view=room">
        辩论间
      </a>
    </nav>
  );
}

/** 一个可选动作：原型 `.opt` 形态（动作文本 + 代价 + 折叠的默认前提）。 */
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
    <li>
      <button type="button" className="er-opt" onClick={onChoose} disabled={disabled}>
        <span className="er-opt-t">{move.text}</span>
        <span className="er-opt-meta">代价：{move.costHint}</span>
        {disabled && reason ? <span className="er-opt-locked">{reason}</span> : null}
      </button>
      <details className="er-fold">
        <summary>这一步默认成立的前提</summary>
        <div className="er-fold-body">{move.implicitAssumption}</div>
      </details>
    </li>
  );
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
