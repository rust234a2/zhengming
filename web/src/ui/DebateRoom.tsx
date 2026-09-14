/**
 * 辩论间主界面（桌面端第三个视图 · `?view=room`）
 *
 * 对齐 `prototypes/debate-room-prototype.html` 的三栏结构：
 *   左：本局议题 / 对局阶段 / 席位 / 我的段位 / 本局规则
 *   中：发言流 + 分阶段输入区
 *   右：本场记录 + 图例
 *
 * 与原型的关键差别（ROLLOUT v0.7）：
 *   - 对手由用户明确选择：真人走在线候选池，AI 走标注清楚的 Bot 席位
 *   - Host 走**真实 LLM**（服务端 `/api/host/*` → StepFun），不是选项匹配
 *   - 状态**服务端权威**：本地只暂显“发送中”内容，不推进阶段；最终仍由服务端快照替换
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  BriefItemKey,
  DebateTopic,
  EvidenceStatus,
  FreeType,
  OpeningBrief,
  MatchMode,
  PlayableTopic,
  Reaction,
  RoomAction,
  RoomState,
  SeatId,
} from "../types/debateRoom";
import { forgetCreatedRoom, readCreatedRoom, readRoomFromUrl, rememberCreatedRoom } from "./debate-room/roomStorage";
import { forgetSeatToken, seatLabel } from "../domain/roomClient";
import { briefItems, targetItemsOf } from "../domain/debateRoom";

import { Composer } from "./debate-room/Composer";
import { RoomReportCard } from "./debate-room/RoomReportCard";
import { ProfileRadar } from "./debate-room/ProfileRadar";
import { requestMakeQuestion, requestStructureHint } from "./debate-room/hostClient";
import { briefItemLabel, composerFor, matchUiFor, stageProgress, topicBadges } from "./debateRoomUi";
import { createMatch, useRoom, useTopics } from "./useRoom";

/* ═══════════════ 小件 ═══════════════ */

function TierCard({ report }: { report: RoomState["report"] }) {
  const settlement = report?.settlement;
  const mp = settlement?.mp ?? 0;
  const tier = settlement?.tier ?? "启鸣";
  const next = settlement?.toNext ?? { tier: "锋鸣", remaining: 30 };
  const thresholds: Record<string, number> = { 启鸣: 0, 锋鸣: 30, 争鸣: 80, 共鸣: 180, 和鸣: 350 };
  const floor = thresholds[tier] ?? 0;
  const span = Math.max(1, (thresholds[next.tier] ?? floor + 30) - floor);
  const percent = next.remaining === null ? 100 : Math.min(100, Math.round(((mp - floor) / span) * 100));

  return (
    <div className="dr-card">
      <div className="dr-card-title">我的段位</div>
      <div className="dr-tier">
        <div className="dr-tier-badge">{tier}</div>
        <div className="dr-tier-info">
          <div className="dr-tier-name">{tier}</div>
          <div className="dr-tier-bar">
            <i style={{ width: `${percent}%` }} />
          </div>
          <div className="dr-tier-mp">
            {mp} MP{next.tier ? ` · 距 ${next.tier} ${next.remaining}` : " · 已达最高段"}
          </div>
        </div>
      </div>
      <p className="dr-card-note">段位衡量参与质量与信誉，不评价观点立场。</p>
    </div>
  );
}

function StageBar({ state }: { state: RoomState }) {
  const progress = stageProgress(state);
  return (
    <div className="dr-card">
      <div className="dr-card-title">对局阶段</div>
      <div className="dr-stages" role="list" aria-label="对局阶段">
        {progress.map((stage, index) => (
          <div key={stage.name} className={`dr-stage ${stage.state}`} role="listitem">
            <i>{stage.state === "done" ? "✓" : index + 1}</i>
            <span>{stage.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeatCard({
  state,
  mySide,
}: {
  state: RoomState;
  mySide: SeatId | null;
}) {
  const rows: { side: SeatId; isMe: boolean }[] = [
    { side: "pro", isMe: mySide === "pro" },
    { side: "con", isMe: mySide === "con" },
  ];
  return (
    <div className="dr-card">
      <div className="dr-card-title">席位</div>
      {rows.map(({ side, isMe }) => {
        const seat = state.seats[side];
        const active = state.turnSeat === side;
        return (
          <div key={side} className={`dr-seat ${active ? "active" : ""} ${isMe ? "me" : ""}`}>
            <div className={`dr-avatar ${side}`}>{(seat?.name || seatLabel(side)).slice(0, 1)}</div>
            <div className="dr-seat-info">
              <div className="dr-seat-name">
                {seat ? seat.name : "空席"}
                <span className={`dr-tag ${side}`}>{seatLabel(side)}</span>
                {isMe ? <span className="dr-tag me">我</span> : null}
                {seat && !seat.connected ? <span className="dr-tag off">已离线</span> : null}
                {active ? <span className="dr-tag turn">该他动作</span> : null}
              </div>
              <div className="dr-seat-sub">
                {seat ? (seat.isBot ? "AI 对手 · Bot" : isMe ? "真人辩手 · 你" : "真人对手") : "等对方入席"}
              </div>
            </div>
          </div>
        );
      })}
      <div className="dr-seat host">
        <div className="dr-avatar host">AI</div>
        <div className="dr-seat-info">
          <div className="dr-seat-name">
            Host
            <span className="dr-tag mut">主持</span>
          </div>
          <div className="dr-seat-sub">
            只追问，不裁判{state.host.degraded ? " · 当前为启发式模拟" : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchCard({ state }: { state: RoomState }) {
  const match = matchUiFor(state);
  return (
    <div className="dr-card dr-match-status">
      <div className="dr-card-title">对手方式</div>
      <div className="dr-match-status-line">
        <span className={`dr-tag ${match.isAi ? "ai" : "human"}`}>{match.modeLabel}</span>
        <b>{match.statusLabel}</b>
      </div>
      <p className="dr-card-note">{state.match.reason}</p>
      {match.notice ? <p className="dr-card-note">{match.notice}</p> : null}
    </div>
  );
}

const TURN_KIND_LABEL: Record<string, string> = {
  opening: "开篇立论",
  question: "质询",
  answer: "回答",
  free: "自由对辩",
  closing: "结辩",
  brief: "立论结构",
  sys: "系统",
};

interface PendingFeedback {
  action: RoomAction;
  stateAtSubmit: RoomState | null;
}

function pendingActionView(action: RoomAction): { label: string; text: string; targetItems?: string[] } | null {
  switch (action.kind) {
    case "submitBrief":
      return {
        label: "立论结构",
        text: [action.brief.conclusion, ...action.brief.reasons].filter(Boolean).join(" · "),
      };
    case "submitOpening":
      return { label: "开篇立论", text: action.text };
    case "ask":
      return {
        label: "质询",
        text: action.question,
        targetItems: targetItemsOf(action).map(briefItemLabel),
      };
    case "answer":
      return { label: "回答", text: action.text };
    case "react":
      return {
        label: "质询回应",
        text: action.reaction === "accept" ? "接受回答，结束本轮质询。" : "继续追问。",
      };
    case "freeSpeak":
      return { label: action.freeType, text: action.text };
    case "submitClosing":
      return { label: "结辩", text: action.text };
    default:
      return null;
  }
}

/* ═══════════════ 主组件 ═══════════════ */

type Phase = { kind: "lobby" } | { kind: "room" };

export function DebateRoom() {
  const [phase, setPhase] = useState<Phase>({ kind: "lobby" });
  const [roomId, setRoomId] = useState<string | null>(null);
  const [mySide, setMySide] = useState<SeatId | null>(null);
  const [myName] = useState(() => readOrCreateName());
  const [busy, setBusy] = useState(false);
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const [hostHint, setHostHint] = useState<string | null>(null);
  const [hostHintLoading, setHostHintLoading] = useState(false);
  const [hintDegraded, setHintDegraded] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<PlayableTopic | null>(null);
  const [pendingFeedback, setPendingFeedback] = useState<PendingFeedback | null>(null);

  const { topics, loading: topicsLoading, error: topicsError, hostConfigured, reload } = useTopics();

  const {
    state,
    mySide: connectedSide,
    connection,
    error: socketError,
    errorCode: socketErrorCode,
    aiThinking,
    resumed,
    send,
    leave,
    clearError,
  } = useRoom({
    roomId,
    side: mySide,
    name: myName,
    enabled: phase.kind === "room" && Boolean(roomId),
  });

  const effectiveSide = connectedSide ?? mySide;

  /* ── 邀请链接 / 刷新恢复：URL 里带 room 时直接进房间 ── */
  useEffect(() => {
    const { roomId: urlRoom, side: urlSide } = readRoomFromUrl();
    if (urlRoom) {
      // 邀请链接进来：如果没指定边，默认守对面（服务端会派发空席）
      setRoomId(urlRoom);
      if (urlSide) setMySide(urlSide);
      setPhase({ kind: "room" });
      return;
    }
    const saved = readCreatedRoom();
    if (saved) {
      // 本窗口刚开过房：刷新后自动回到那一局
      setRoomId(saved.roomId);
      setMySide(saved.side);
      setPhase({ kind: "room" });
    }
  }, []);

  useEffect(() => {
    if (state?.phase === "settled" && state.report && !reportOpen && !aiThinking) {
      setReportOpen(true);
    }
  }, [aiThinking, state?.phase, state?.report, reportOpen]);

  useEffect(() => {
    if (!pendingFeedback) return;
    if (socketError || state !== pendingFeedback.stateAtSubmit) setPendingFeedback(null);
  }, [pendingFeedback, socketError, state]);

  /* ── 服务端重启后旧 token 已失效：清理旧局并回到匹配页 ── */
  useEffect(() => {
    if (socketErrorCode !== "INVALID_SEAT_TOKEN" || !roomId) return;

    forgetSeatToken(roomId);
    forgetCreatedRoom();
    clearError();
    setRoomId(null);
    setMySide(null);
    setSelectedTopic(null);
    setHostHint(null);
    setReportOpen(false);
    setLobbyError("席位凭证已失效，已清理旧房间记录，请重新匹配。");
    setPhase({ kind: "lobby" });

    const url = new URL(window.location.href);
    url.searchParams.delete("room");
    url.searchParams.delete("side");
    window.history.replaceState(null, "", url.toString());
  }, [clearError, roomId, socketErrorCode]);

  /* ── 开局：建房 → 入席 ── */
  const startRoom = useCallback(
    async (topic: PlayableTopic, side: SeatId, mode: MatchMode) => {
      setBusy(true);
      setLobbyError(null);
      try {
        const matched = await createMatch({ topicId: topic.questionId, side, mode, name: myName });
        const created = matched.roomId;
        rememberCreatedRoom({ roomId: created, topicId: topic.questionId, side, at: new Date().toISOString() });
        setSelectedTopic(topic);
        setMySide(side);
        setRoomId(created);
        setPhase({ kind: "room" });
      } catch (error) {
        setLobbyError(error instanceof Error ? error.message : "开局失败，请重试。");
      } finally {
        setBusy(false);
      }
    },
    [myName],
  );

  /* ── 加入已有房间（邀请链接 / 另一窗口） ── */
  const joinByRoomId = useCallback(async (target: string, side: SeatId) => {
    setMySide(side);
    setRoomId(target);
    setPhase({ kind: "room" });
  }, []);

  /* ── 动作下发（统一收敛在 send） ── */
  const act = useCallback(
    (action: Parameters<typeof send>[0]) => {
      setHostHint(null);
      setPendingFeedback({ action, stateAtSubmit: state });
      send(action);
    },
    [send, state],
  );

  /* ── Host 结构提示 ── */
  const requestHint = useCallback(
    async (context: string, targetItems?: BriefItemKey[]) => {
      setHostHintLoading(true);
      setHintDegraded(false);
      try {
        if (context.startsWith("question:") || context === "question") {
          const draft = context.startsWith("question:") ? context.slice("question:".length) : "";
          const selectedKeys = targetItems?.length ? targetItems : ["结论" as const];
          const opponentItems = state ? briefItems(state.briefs[opponentsOf(effectiveSide)]) : [];
          const selected = selectedKeys
            .map((key) => opponentItems.find((item) => item.key === key))
            .filter((item): item is { key: BriefItemKey; text: string } => Boolean(item));
          const label = selectedKeys.map(briefItemLabel).join("、");
          const sourceText = selected.map((item) => `${briefItemLabel(item.key)}：${item.text}`).join("\n");
          const claimText = [sourceText || "（对方未提供所选条目原文）", draft ? `已有问题草稿：${draft}` : ""]
            .filter(Boolean)
            .join("\n");
          const result = await requestMakeQuestion({ label, text: claimText || "（对方未提供该条目原文）" });
          setHintDegraded(result.degraded);
          setHostHint(result.ok ? result.result : result.error ?? "Host 暂时给不出提示。");
          return;
        }
        const statement = buildStatementFor(state, effectiveSide, context);
        const result = await requestStructureHint(statement);
        setHintDegraded(result.degraded);
        setHostHint(result.ok ? result.result : result.error ?? "Host 暂时给不出提示。");
      } finally {
        setHostHintLoading(false);
      }
    },
    [state, effectiveSide],
  );

  const spec = useMemo(() => (state ? composerFor(state, effectiveSide) : null), [state, effectiveSide]);
  const topic = state?.topic ?? selectedTopic;
  const pendingView = pendingFeedback ? pendingActionView(pendingFeedback.action) : null;
  const showAiThinking = aiThinking || Boolean(pendingFeedback && state?.match.mode === "ai");

  const turnTargets = useMemo(() => {
    if (!state || !effectiveSide) return undefined;
    const last = state.crossRecords[state.crossRecords.length - 1];
    return last ? targetItemsOf(last) : undefined;
  }, [state, effectiveSide]);

  /* ── 再来一局：清掉本地房间记忆，回启动台重选 ── */
  const restart = useCallback(() => {
    setReportOpen(false);
    forgetCreatedRoom();
    setRoomId(null);
    setMySide(null);
    setSelectedTopic(null);
    setHostHint(null);
    setPhase({ kind: "lobby" });
    // 清掉 URL 上的 room 参数，避免 effect 立刻又跳回旧房间
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("room");
      url.searchParams.delete("side");
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  /* ═══════════ 启动台 ═══════════ */
  if (phase.kind === "lobby") {
    return (
      <Lobby
        topics={topics}
        loading={topicsLoading}
        error={topicsError}
        lobbyError={lobbyError}
        busy={busy}
        hostConfigured={hostConfigured}
        onRetry={reload}
        onStart={startRoom}
        onJoinRoom={joinByRoomId}
      />
    );
  }

  /* ═══════════ 房间 ═══════════ */
  return (
    <main className="debate-app dr-app">
      <header className="dt-topbar">
        <span className="dt-logo">争鸣</span>
        <span className="dt-crumb">
          辩论间 · <b>{topic?.title?.slice(0, 24) ?? "对局中"}</b>
          {topic?.title && topic.title.length > 24 ? "…" : ""}
        </span>
        <span className="dt-spacer" />
        {connection !== "open" ? (
          <span className="dr-conn-bad">{connection === "closed" ? "连接已断开" : "连接中…"}</span>
        ) : (
          <span className="dr-conn-ok">
            <i />
            已连接
          </span>
        )}
        <a className="dt-button ghost" href="?view=debate">
          ← 返回辩论树
        </a>
        {state?.report ? (
          <button type="button" className="dt-button ghost" onClick={() => setReportOpen(true)}>
            查看对局报告
          </button>
        ) : (
          <button type="button" className="dt-button ghost" onClick={() => { leave(); setPhase({ kind: "lobby" }); }}>
            退出本局
          </button>
        )}
      </header>

      {socketError ? (
        <div className="dr-error-bar">
          <span>{socketError}</span>
          <button type="button" onClick={clearError}>
            知道了
          </button>
        </div>
      ) : null}

      <div className="dr-grid">
        {/* ── 左栏 ── */}
        <aside className="dr-col-left">
          <div className="dr-card">
            <div className="dr-card-title">本局议题</div>
            <div className="dr-topic-title">{topic?.title}</div>
            {topic ? (
              <div className="dr-badges">
                {topicBadges(topic as DebateTopic).map((badge, index) => (
                  <span key={`${badge.tone}-${index}`} className={`dr-badge ${badge.tone}`}>
                    {badge.text}
                  </span>
                ))}
              </div>
            ) : null}
            {topic?.url ? (
              <a className="dr-topic-link" href={topic.url} target="_blank" rel="noreferrer noopener">
                查看知乎原问题 →
              </a>
            ) : null}
          </div>

          {state ? <StageBar state={state} /> : null}
          {state ? <MatchCard state={state} /> : null}
          {state ? <SeatCard state={state} mySide={effectiveSide} /> : null}
          {state ? <TierCard report={state.report} /> : null}

          {state && matchUiFor(state).showInvite ? <InviteCard roomId={roomId} mySide={effectiveSide} resumed={resumed} /> : null}

          <div className="dr-card">
            <div className="dr-card-title">本局规则</div>
            <p className="dr-rule">
              <b>轮次制对局（五阶段）：</b>先填<b>立论结构</b>（含可选的关键定义）、开篇立论，然后质询、自由对辩、结辩。
              定义不用提前谈拢——<b>它就是被质询的东西</b>。发言要标注类型，「修正」不丢人。
              <b>不判输赢</b>——终局只出一份对局报告与结构画像；规定轮次走完，对局即完成。
            </p>
          </div>
        </aside>

        {/* ── 中栏 ── */}
        <section className="dr-col-center">
          <div className="dr-stream" role="log" aria-label="发言记录">
            {topic ? (
              <div className="dr-stream-root">
                <span className={`dr-dot ${topic.pro ? "pro" : "con"}`} />
                <div>{topic.title}</div>
              </div>
            ) : null}

            {state?.transcript.length ? (
              state.transcript.map((turn) => {
                const isMine = turn.authorId === effectiveSide;
                const isHost = turn.authorId === "host";
                const seat = isHost ? null : state.seats[turn.authorId as SeatId];
                return (
                  <article key={turn.turnId} className={`dr-turn ${isHost ? "host" : isMine ? "mine" : "theirs"}`}>
                    <div className="dr-turn-head">
                      <b>{isHost ? "Host" : seat?.name ?? (turn.authorId === "pro" ? "正方" : "反方")}</b>
                      {!isHost ? <span className={`dr-tag ${turn.authorId}`}>{seatLabel(turn.authorId as SeatId)}</span> : null}
                      <span className="dr-turn-kind">{TURN_KIND_LABEL[turn.kind] ?? turn.kind}</span>
                      {targetItemsOf(turn).length ? (
                        <span className="dr-turn-target">质询 {targetItemsOf(turn).map(briefItemLabel).join("、")}</span>
                      ) : null}
                      {turn.freeType ? <span className={`dr-turn-free t-${turn.freeType}`}>{turn.freeType}</span> : null}
                      {turn.evidenceStatus ? <span className="dr-turn-ev">{turn.evidenceStatus}</span> : null}
                    </div>
                    <p>{turn.text}</p>
                  </article>
                );
              })
            ) : !pendingView ? (
              <div className="dr-stream-empty">
                {state?.phase === "waiting"
                  ? state.match?.reason || "已进入真人候选池，等待实际在线的相反立场用户。"
                  : "还没有发言记录。"}
              </div>
            ) : null}

            {pendingView ? (
              <article className="dr-turn mine pending" aria-label="待发送发言">
                <div className="dr-turn-head">
                  <b>{state?.seats[effectiveSide ?? "pro"]?.name ?? "我"}</b>
                  {effectiveSide ? <span className={`dr-tag ${effectiveSide}`}>{seatLabel(effectiveSide)}</span> : null}
                  <span className="dr-turn-kind">{pendingView.label}</span>
                  {pendingView.targetItems?.length ? (
                    <span className="dr-turn-target">质询 {pendingView.targetItems.join("、")}</span>
                  ) : null}
                  <span className="dr-pending-label">发送中</span>
                </div>
                <p>{pendingView.text}</p>
              </article>
            ) : null}

            {showAiThinking ? (
              <div className="dr-ai-thinking" role="status" aria-live="polite">
                <span className="dr-thinking-dots" aria-hidden="true"><i /><i /><i /></span>
                <b>AI 正在思考</b>
                <span>完成后会在这里继续输出</span>
              </div>
            ) : null}
          </div>

          {spec ? (
            <Composer
              spec={spec}
              preset={{
                claim: effectiveSide ? (effectiveSide === "pro" ? topic?.pro?.claim : topic?.con?.claim) : undefined,
                author: effectiveSide ? (effectiveSide === "pro" ? topic?.pro?.author : topic?.con?.author) : undefined,
                url: effectiveSide ? (effectiveSide === "pro" ? topic?.pro?.url : topic?.con?.url) : undefined,
              }}
              currentBriefTargets={turnTargets}
              hostHint={hostHint}
              hostHintLoading={hostHintLoading}
              disabled={connection !== "open" || Boolean(pendingFeedback)}
              onBrief={(brief: OpeningBrief) => act({ kind: "submitBrief", brief })}
              onOpening={(text: string) => act({ kind: "submitOpening", text })}
              onAsk={(targetItems, question) => act({ kind: "ask", targetItems, question })}
              onAnswer={(text: string) => act({ kind: "answer", text })}
              onReact={(reaction: Reaction) => act({ kind: "react", reaction })}
              onFree={(freeType: FreeType, text: string, revisedTo?: string) => act({ kind: "freeSpeak", freeType, text, revisedTo })}
              onClosing={(text: string, revision?: { from: string; to: string }) => act({ kind: "submitClosing", text, revision })}
              onRequestHint={requestHint}
            />
          ) : null}

          {hintDegraded && hostHint ? <p className="dr-degraded-note">以上提示来自服务端启发式降级（模拟），非真实模型输出。</p> : null}
        </section>

        {/* ── 右栏 ── */}
        <aside className="dr-col-right">
          <div className="dr-card grow">
            <div className="dr-card-title split">
              本场记录
              <span>{state?.transcript.length ?? 0} 条已登记</span>
            </div>
            <div className="dr-board">
              {state?.briefs.pro || state?.briefs.con ? (
                (["pro", "con"] as SeatId[]).map((seat) => {
                  const brief = state?.briefs[seat];
                  if (!brief) {
                    return (
                      <div key={seat} className={`dr-board-group ${seat}`}>
                        <div className="dr-board-head">
                          <i className={`dr-dot ${seat}`} />
                          {seatLabel(seat)}
                          <em>结构填写中</em>
                        </div>
                      </div>
                    );
                  }
                  // 立论结构互不可见：对方未开篇陈述前只显示条目数，不显示内容
                  const revealed = seat === effectiveSide || state?.transcript.some((turn) => turn.kind === "opening" && turn.authorId === seat);
                  return (
                    <div key={seat} className={`dr-board-group ${seat}`}>
                      <div className="dr-board-head">
                        <i className={`dr-dot ${seat}`} />
                        {seatLabel(seat)}
                        {!revealed ? <em>未公开</em> : null}
                      </div>
                      {revealed ? (
                        briefItems(brief).map((item) => (
                          <div key={item.key} className="dr-board-item">
                            <b>{briefItemLabel(item.key)}</b>
                            <span>{item.text}</span>
                          </div>
                        ))
                      ) : (
                        <div className="dr-board-item muted">{briefItems(brief).length} 个条目（开篇后公开）</div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="dr-board-empty">立论结构提交后会显示在这里。</div>
              )}

              {state?.crossRecords.length ? (
                <div className="dr-board-group cross">
                  <div className="dr-board-head">
                    <i className="dr-dot cross" />
                    质询记录
                  </div>
                  {state.crossRecords.map((record, index) => (
                    <div key={`${record.at}-${index}`} className="dr-board-item">
                      <b>{targetItemsOf(record).map(briefItemLabel).join("、")}</b>
                      <span>{record.question}</span>
                      {record.closedBy === "questionLimit" ? <em className="dr-pressed">达到上限 · 自动结束</em> : null}
                      {record.pressed ? <em className="dr-pressed">追问过</em> : null}
                    </div>
                  ))}
                </div>
              ) : null}

              {state?.revisions.length ? (
                <div className="dr-board-group revise">
                  <div className="dr-board-head">
                    <i className="dr-dot revise" />
                    观点修正
                  </div>
                  {state.revisions.map((record, index) => (
                    <div key={`${record.at}-${index}`} className="dr-board-item">
                      <b>{seatLabel(record.seat)}</b>
                      <span>
                        「{record.from}」→「{record.to}」
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="dr-card">
            <div className="dr-card-title">图例</div>
            <div className="dr-legend">
              <span>
                <i className="dr-dot pro" />正方立论结构
              </span>
              <span>
                <i className="dr-dot con" />反方立论结构
              </span>
              <span>
                <i className="dr-dot cross" />质询记录
              </span>
              <span>
                <i className="dr-dot revise" />观点修正
              </span>
            </div>
          </div>

          {state?.report ? (
            <div className="dr-card">
              <div className="dr-card-title">结构画像</div>
              <ProfileRadar
                size={196}
                series={[
                  { label: "正方", values: state.report.profiles.pro, color: "#056de8" },
                  { label: "反方", values: state.report.profiles.con, color: "#4c586e" },
                ]}
              />
            </div>
          ) : null}
        </aside>
      </div>

      {reportOpen && state?.report ? (
        <RoomReportCard
          report={state.report}
          seatNames={{
            pro: state.seats.pro?.name ?? "正方",
            con: state.seats.con?.name ?? "反方",
          }}
          onClose={() => setReportOpen(false)}
          onRestart={restart}
        />
      ) : null}
    </main>
  );
}

/* ═══════════════ 启动台 ═══════════════ */

function Lobby({
  topics,
  loading,
  error,
  lobbyError,
  busy,
  hostConfigured,
  onRetry,
  onStart,
  onJoinRoom,
}: {
  topics: PlayableTopic[];
  loading: boolean;
  error: string | null;
  lobbyError: string | null;
  busy: boolean;
  hostConfigured: boolean | null;
  onRetry: () => void;
  onStart: (topic: PlayableTopic, side: SeatId, mode: MatchMode) => void;
  onJoinRoom: (roomId: string, side: SeatId) => void;
}) {
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ topicId: string; side: SeatId } | null>(null);
  const [joinId, setJoinId] = useState("");
  const [joinSide, setJoinSide] = useState<SeatId>("con");
  const playable = topics.filter((topic) => topic.playable);

  return (
    <main className="debate-app dr-app">
      <header className="dt-topbar">
        <span className="dt-logo">争鸣</span>
        <span className="dt-crumb">
          辩论间 · <b>选边制撮合 · 轮次制对局（五阶段）</b>
        </span>
        <span className="dt-spacer" />
        <a className="dt-button ghost" href="?view=debate">
          ← 返回辩论树
        </a>
      </header>

      <div className="dr-lobby">
        <div className="dr-lobby-head">
          <h1>开一间辩论间</h1>
          <p>
            挑一个真实知乎议题、选一边守，再明确选择<b>真人匹配</b>或<b>直接与 AI 对辩</b>。
            选自己不信的一边也完全允许；对局按立论、质询、自由对辩、结辩、终局报告五阶段推进。
          </p>
          <div className="dr-lobby-flags">
            {hostConfigured === false ? (
              <span className="dr-flag warn">Host 未配 key · 本场为启发式模拟（服务端设置 STEPFUN_API_KEY 后自动接真实模型）</span>
            ) : hostConfigured === true ? (
              <span className="dr-flag ok">Host 已接 StepFun 真实模型</span>
            ) : null}
            <span className="dr-flag">议题与论点来自争议地图管线（真实作者 / 赞同数 / 知乎原链接）</span>
          </div>
        </div>

        {lobbyError ? <div className="dr-error-bar inline"><span>{lobbyError}</span></div> : null}

        <div className="dr-lobby-body">
          <div className="dr-lobby-topics">
            <div className="dr-lobby-section-title">
              可开局议题
              {loading ? <em>加载中…</em> : <em>{playable.length} / {topics.length} 个可开局</em>}
            </div>

            {error ? (
              <div className="dr-lobby-error">
                <p>{error}</p>
                <button type="button" className="dr-mini" onClick={onRetry}>
                  重试
                </button>
              </div>
            ) : null}

            {!loading && !error && !playable.length ? (
              <p className="dr-lobby-empty">服务端没有返回可开局的议题。确认 zhengming-server 已启动后点重试。</p>
            ) : null}

            {playable.map((topic) => {
              const open = openTopicId === topic.questionId;
              return (
                <article key={topic.questionId} className={`dr-lobby-topic ${open ? "open" : ""}`}>
                  <button type="button" className="dr-lobby-topic-head" onClick={() => {
                    setOpenTopicId(open ? null : topic.questionId);
                    setSelection(null);
                  }}>
                    <h3>{topic.title}</h3>
                    <div className="dr-badges">
                      {topicBadges(topic as unknown as DebateTopic).map((badge, index) => (
                        <span key={`${badge.tone}-${index}`} className={`dr-badge ${badge.tone}`}>
                          {badge.text}
                        </span>
                      ))}
                    </div>
                  </button>

                  {open ? (
                    <div className="dr-lobby-claims">
                      {(["pro", "con"] as SeatId[]).map((side) => {
                        const claim = side === "pro" ? topic.pro : topic.con;
                        return (
                          <div key={side} className={`dr-claim ${side}`}>
                            <div className="dr-claim-head">
                              <span className={`dr-tag ${side}`}>{seatLabel(side)}</span>
                              {claim ? <em>{claim.author} · 赞同 {claim.voteUp}</em> : <em>该侧无预设论点</em>}
                            </div>
                            <p>{claim?.claim ?? "（该议题只有单侧论点——另一边由对手自持立场）"}</p>
                            <div className="dr-claim-actions">
                              {claim?.url ? (
                                <a href={claim.url} target="_blank" rel="noreferrer noopener" className="dr-mini ghost">
                                  看知乎原文
                                </a>
                              ) : null}
                              <button
                                type="button"
                                className="dr-submit"
                                disabled={busy}
                                onClick={() => setSelection({ topicId: topic.questionId, side })}
                              >
                                {`选择${seatLabel(side)}`}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <p className="dr-claim-note">
                        预设论点只会作为你立论结构的草稿参考——必须自己改写，不能跳过立论直接开打。
                      </p>
                      {selection?.topicId === topic.questionId ? (
                        <section className="dr-match-choice" aria-label="选择匹配方式">
                          <div className="dr-match-choice-head">
                            <b>你已选择{seatLabel(selection.side)}</b>
                            <span>接下来选择对手类型</span>
                          </div>
                          <div className="dr-match-options">
                            <button
                              type="button"
                              className="dr-match-option human"
                              disabled={busy}
                              onClick={() => onStart(topic, selection.side, "human")}
                            >
                              <strong>{busy ? "正在进入候选池…" : "真人匹配"}</strong>
                              <span>进入候选池，只匹配实际在线、守相反立场的真人；没有候选时继续等待。</span>
                              <em>真人优先</em>
                            </button>
                            <button
                              type="button"
                              className="dr-match-option ai"
                              disabled={busy}
                              onClick={() => onStart(topic, selection.side, "ai")}
                            >
                              <strong>{busy ? "正在创建对局…" : "直接选择 AI 对辩"}</strong>
                              <span>立即创建明确标注的 AI / Bot 对手，直接进入五阶段对局。</span>
                              <em>立即开始</em>
                            </button>
                          </div>
                        </section>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>

          <aside className="dr-lobby-side">
            <div className="dr-card">
              <div className="dr-card-title">加入已有的房间</div>
              <p className="dr-card-note">对方把房间号发给你时，填在这里；也可用他给的整条链接直接打开。</p>
              <label className="dr-field">
                <span className="dr-field-label">房间号</span>
                <input value={joinId} onChange={(event) => setJoinId(event.target.value)} placeholder="room-xxxxxxxx" />
              </label>
              <div className="dr-join-sides">
                {(["pro", "con"] as SeatId[]).map((side) => (
                  <button key={side} type="button" className={`dr-type ${joinSide === side ? "on" : ""}`} onClick={() => setJoinSide(side)}>
                    {seatLabel(side)}
                  </button>
                ))}
              </div>
              <button type="button" className="dr-submit full" disabled={!joinId.trim()} onClick={() => onJoinRoom(joinId.trim(), joinSide)}>
                入席
              </button>
            </div>

            <div className="dr-card">
              <div className="dr-card-title">怎么两个人一起玩</div>
              <ol className="dr-lobby-steps">
                <li>你选边开局，复制页面里的邀请链接。</li>
                <li>对方<b>在另一个浏览器窗口</b>打开这条链接（推荐用隐身窗口，或另一台设备）。</li>
                <li>对方选另一边入席——双方到齐后自动进入①立论。</li>
              </ol>
              <p className="dr-card-note">
                同一浏览器的两个普通标签页会共用席位令牌；用隐身窗口或不同设备才互不干扰。
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

/* ═══════════════ 邀请卡 ═══════════════ */

function InviteCard({ roomId, mySide, resumed }: { roomId: string | null; mySide: SeatId | null; resumed: boolean }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" && roomId ? `${window.location.origin}${window.location.pathname}?view=room&room=${roomId}` : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* 剪贴板不可用：链接文本仍可手动选中 */
    }
  }

  if (!roomId) return null;

  return (
    <div className="dr-card">
      <div className="dr-card-title">邀请对方</div>
      {resumed ? <p className="dr-card-note ok">已回到你原来的席位。</p> : null}
      <div className="dr-invite">
        <input readOnly value={url} onFocus={(event) => event.currentTarget.select()} />
        <button type="button" className="dr-mini" onClick={copy}>
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <p className="dr-card-note">
        房间号 <code>{roomId}</code>
        {mySide ? ` · 你守${seatLabel(mySide)}` : ""}。对方在隐身窗口或另一台设备打开这条链接，会自动坐到另一个席位。
      </p>
    </div>
  );
}

/* ═══════════════ 工具 ═══════════════ */

const NAME_KEY = "zhengming.room.displayName";

function readOrCreateName(): string {
  try {
    const saved = window.sessionStorage.getItem(NAME_KEY);
    if (saved) return saved;
    const name = `辩手${Math.floor(Math.random() * 900 + 100)}`;
    window.sessionStorage.setItem(NAME_KEY, name);
    return name;
  } catch {
    return "辩手";
  }
}

function opponentsOf(side: SeatId | null): SeatId {
  return side === "pro" ? "con" : "pro";
}

/** 给 Host 的陈述文本（结构提示的入参） */
function buildStatementFor(state: RoomState | null, side: SeatId | null, context: string): string {
  if (!state || !side) return "（尚无内容）";
  const brief = state.briefs[side];
  if (!brief) return "（尚未填写立论结构）";
  const parts: string[] = [];
  if (brief.definition) parts.push(`定义：${brief.definition}`);
  parts.push(`观点：${brief.conclusion}`);
  (brief.reasons ?? []).forEach((reason, index) => parts.push(`理由 ${index + 1}：${reason}`));
  if (brief.evidence) parts.push(`依据：${brief.evidence}`);
  if (context === "answer") {
    const last = state.crossRecords[state.crossRecords.length - 1];
    if (last?.answer) return `对方问：${last.question}\n我的回答：${last.answer}`;
  }
  if (context === "opening") {
    const turn = [...state.transcript].reverse().find((item) => item.kind === "opening" && item.authorId === side);
    if (turn) parts.push(`开篇陈述：${turn.text}`);
  }
  return parts.join("\n");
}
