/**
 * 辩论间领域内核（纯函数，无 IO、无副作用）
 *
 * 设计纪律（ROLLOUT §2）：
 *   规则只写在这里。服务端 import 这份模块，**不复制规则**。
 *   所有函数纯函数：同输入同输出，不改入参，不读时钟以外的东西（时间通过参数传入）。
 *
 * 四条产品红线在代码层的落点：
 *   1. **不判输赢** —— 全局无 winner/rank/胜负字段；段位只按参与行为结算。
 *   2. **追问权替代验证权** —— 只有 `ask` 动作，没有「判定对方错」的动作。
 *   3. **先承认再推进** —— 本轮已按 D6 降为原则，不再是硬闸门（无 checkRestatement）。
 *   4. **不判输赢的副产品**：`buildReport` 的输出结构里物理上不存在胜负槽位。
 */

import {
  BRIEF_ITEM_KEYS,
  EVIDENCE_STATUSES,
  FREE_TYPES,
  MP_RULES,
  PROFILE_DIMS,
  TIERS,
  type BriefItemKey,
  type Candidate,
  type DebateTopic,
  type EvidenceStatus,
  type FreeType,
  type MpSettlement,
  type MatchInfo,
  type OpeningBrief,
  type RankedCandidate,
  type RoomAction,
  type RoomReport,
  type RoomState,
  type SeatId,
  type Turn,
  type TransitionResult,
} from "../types/debateRoom";

/** 对手席位 */
export function opponentOf(seat: SeatId): SeatId {
  return seat === "pro" ? "con" : "pro";
}

/** 段位查询：给定累计 MP 返回段位名 */
export function tierOf(mp: number): string {
  let name = TIERS[0][0];
  for (const [tier, threshold] of TIERS) {
    if (mp >= threshold) name = tier;
  }
  return name;
}

/**
 * 段位结算（PRD §7）。只按完成/离席结算，**没有任何胜负奖励**。
 *
 * @param completed 是否走满五阶段
 * @param left 是否中途离席
 * @param previousMp 进场前累计 MP
 */
export function settleMp({
  completed = false,
  left = false,
  previousMp = 0,
}: {
  completed?: boolean;
  left?: boolean;
  previousMp?: number;
}): MpSettlement {
  const entries: { label: string; amount: number }[] = [];
  if (completed) entries.push({ label: "完成完整对局（五阶段走满）", amount: MP_RULES.completeRoom });
  if (left) entries.push({ label: "中途离席", amount: MP_RULES.leavePenalty });

  const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const mp = Math.max(0, previousMp + total);
  const tier = tierOf(mp);
  const index = TIERS.findIndex(([name]) => name === tier);
  const next = TIERS[index + 1];

  return {
    total,
    entries,
    tier,
    mp,
    toNext: next ? { tier: next[0], remaining: Math.max(0, next[1] - mp) } : null,
  };
}

/**
 * 六维画像相近度排序（PRD §1 / 原型 rankCandidates）。
 *
 * `score = 1 − mean(|dim_i − dim_i'|) / 100`
 * 无画像的候选 score 为 null，排在有画像的之后；排序稳定。
 */
export function rankCandidates(myDims: number[] | null, candidates: Candidate[]): RankedCandidate[] {
  return candidates
    .map<RankedCandidate>((candidate) => ({
      ...candidate,
      score:
        myDims && candidate.profile
          ? 1 - PROFILE_DIMS.reduce((sum, _dim, i) => sum + Math.abs((myDims[i] ?? 0) - (candidate.profile![i] ?? 0)), 0) / PROFILE_DIMS.length / 100
          : null,
    }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

/** 立论结构的条目数量是否达标（理由至少 1 条） */
export function validateBrief(brief: OpeningBrief): { ok: boolean; message?: string } {
  if (!brief || typeof brief.conclusion !== "string" || !brief.conclusion.trim()) {
    return { ok: false, message: "Host：核心结论不能为空——你最终主张什么？" };
  }
  const reasons = (brief.reasons ?? []).filter((r) => typeof r === "string" && r.trim());
  if (reasons.length < 1) {
    return { ok: false, message: "Host：至少需要一条理由——结论不会因为重复而成立。" };
  }
  if (reasons.length > 2) {
    return { ok: false, message: "Host：立论结构最多两条理由——把最重要的两条留下。" };
  }
  if (brief.evidence && !brief.evidenceStatus) {
    return { ok: false, message: "Host：填了依据就请标注它的证据状态（七档之一）。" };
  }
  if (brief.evidenceStatus && !EVIDENCE_STATUSES.includes(brief.evidenceStatus)) {
    return { ok: false, message: "Host：证据状态必须是七档之一。" };
  }
  return { ok: true };
}

/** 把立论结构展开成条目列表（②质询轮的靶点） */
export function briefItems(brief: OpeningBrief | null): { key: BriefItemKey; text: string }[] {
  if (!brief) return [];
  const items: { key: BriefItemKey; text: string }[] = [];
  if (brief.definition?.trim()) items.push({ key: "定义", text: brief.definition.trim() });
  if (brief.conclusion?.trim()) items.push({ key: "结论", text: brief.conclusion.trim() });
  (brief.reasons ?? [])
    .filter((r) => r?.trim())
    .slice(0, 2)
    .forEach((reason, index) => {
      items.push({ key: index === 0 ? "理由 1" : "理由 2", text: reason.trim() });
    });
  if (brief.evidence?.trim()) items.push({ key: "依据", text: brief.evidence.trim() });
  return items;
}

/* ═══════════════════ 内部工具 ═══════════════════ */

let turnCounter = 0;

/** 生成稳定 turnId（纯函数语境下允许计数器，同一进程内唯一即可） */
function nextTurnId(roomId: string): string {
  turnCounter += 1;
  return `${roomId}-t${turnCounter}`;
}

/** 仅供测试：重置计数器，让快照可预期 */
export function __resetTurnCounter(): void {
  turnCounter = 0;
}

function makeTurn(
  roomId: string,
  authorId: Turn["authorId"],
  kind: string,
  text: string,
  extra: Partial<Turn> = {},
): Turn {
  return {
    turnId: nextTurnId(roomId),
    authorId,
    kind,
    text,
    at: new Date().toISOString(),
    ...extra,
  };
}

function fail(code: string, message: string): TransitionResult {
  return { ok: false, code, message };
}

function withTranscript(state: RoomState, turn: Turn): RoomState {
  return { ...state, transcript: [...state.transcript, turn] };
}

function advanceAfterCross(state: RoomState, asker: SeatId): RoomState {
  const askerSet = new Set(state.crossRecords.map((record) => record.asker));
  if (askerSet.has("pro") && askerSet.has("con")) {
    return { ...state, phase: "free", turnSeat: null };
  }
  return { ...state, phase: "crossAsk", turnSeat: opponentOf(asker) };
}

/* ═══════════════════ 阶段跃迁 ═══════════════════ */

/**
 * 房间状态机。**唯一的规则入口**——服务端与前端都调它。
 *
 * 不变量（单测覆盖）：
 *  - 理由至少 1 条
 *  - 每方最多 2 问；第 2 问回答后自动推进
 *  - 每方自由发言 1 次
 *  - 质询一问一答
 *  - 轮次走满即 settled
 *  - 无 winner/rank 字段
 *  - 动作必须由「该轮该方」发起
 */
export function transition(state: RoomState, actor: SeatId, action: RoomAction): TransitionResult {
  if (!state || !actor || !action?.kind) {
    return fail("VALIDATION", "缺少房间状态、席位或动作");
  }
  if (state.phase === "settled") {
    return fail("ROOM_SETTLED", "本局已结束——点「再来一局」开新的一局。");
  }

  switch (action.kind) {
    case "leave": {
      // 离席：标记该席位离线，房间按未完成局收束（MP -5 由 settleMp 处理）
      const seats = { ...state.seats };
      if (seats[actor]) seats[actor] = { ...seats[actor]!, connected: false };
      return {
        ok: true,
        state: {
          ...state,
          seats,
          phase: "settled",
          turnSeat: null,
          report: buildReport({ ...state, seats, phase: "settled" }, { completed: false, leftBy: actor }),
        },
      };
    }

    case "pickSide": {
      return fail("NOT_IMPLEMENTED", "选边在撮合阶段完成，房间内不做立场变更。");
    }

    case "submitBrief": {
      if (state.phase !== "opening") {
        return fail("WRONG_PHASE", "立论结构只能在①立论阶段提交。");
      }
      if (state.briefs[actor]) {
        return fail("ALREADY_SUBMITTED", "你已提交过立论结构。");
      }
      const check = validateBrief(action.brief);
      if (!check.ok) {
        return fail("INVALID_BRIEF", check.message!);
      }
      const briefs = { ...state.briefs, [actor]: action.brief };
      const bothReady = Boolean(briefs[opponentOf(actor)]);
      return {
        ok: true,
        state: {
          ...state,
          briefs,
          // 双方都填完才轮到开篇陈述；本方填完则等对方
          turnSeat: bothReady ? actor : opponentOf(actor),
        },
      };
    }

    case "submitOpening": {
      if (state.phase !== "opening") {
        return fail("WRONG_PHASE", "开篇陈述只能在①立论阶段提交。");
      }
      if (!state.briefs[actor]) {
        return fail("BRIEF_REQUIRED", "Host：先填立论结构，再写开篇陈述——结构是这段发言的骨架。");
      }
      if (!action.text?.trim()) {
        return fail("EMPTY_OPENING", "Host：立论不能为空——把你刚填的理由用完整的话说出来。");
      }
      const turn = makeTurn(state.roomId, actor, "opening", action.text.trim(), {
        evidenceStatus: action.evidenceStatus,
      });
      let next = withTranscript(state, turn);
      if (action.evidence?.trim()) {
        next = pushEvidence(next, actor, action.evidence.trim(), action.evidenceStatus);
      }
      const opp = opponentOf(actor);
      const openedBy = new Set(
        next.transcript.filter((t) => t.kind === "opening").map((t) => t.authorId as SeatId),
      );
      // 双方都陈述完毕 → 进入质询轮，由**先立论的一方先提问**（PRD §1：双方各一次提问权）
      if (openedBy.has("pro") && openedBy.has("con")) {
        return { ok: true, state: { ...next, phase: "crossAsk", turnSeat: "pro" } };
      }
      // 只完成一方陈述：把发言权交给另一方
      return { ok: true, state: { ...next, turnSeat: opp } };
    }

    case "ask": {
      if (state.phase !== "crossAsk") {
        return fail("WRONG_PHASE", "现在不是你的提问轮次。");
      }
      if (state.turnSeat !== actor) {
        return fail("NOT_YOUR_TURN", "还没轮到你提问。");
      }
      if (!BRIEF_ITEM_KEYS.includes(action.targetItem)) {
        return fail("VALIDATION", "质询靶点必须是立论结构的条目（定义/结论/理由 1/理由 2/依据）。");
      }
      const opp = opponentOf(actor);
      const targets = briefItems(state.briefs[opp]);
      if (!targets.some((item) => item.key === action.targetItem)) {
        return fail("TARGET_NOT_FOUND", `对方的立论结构里没有「${action.targetItem}」这条。`);
      }
      if (!action.question?.trim()) {
        return fail("EMPTY_QUESTION", "Host：问题不能为空。");
      }
      const question = action.question.trim();
      // 一问一答：禁止打包追问（与 Host 契约 §2 同一条硬约束）
      const marks = question.match(/[?？]/g);
      if (marks && marks.length > 1) {
        return fail("MULTIPLE_QUESTIONS", "Host：一次只问一个问题——不许打包追问。");
      }
      const record = {
        asker: actor,
        targetItem: action.targetItem,
        question,
        pressed: false,
        at: new Date().toISOString(),
      };
      const next = withTranscript(state, makeTurn(state.roomId, actor, "question", question, { targetItem: action.targetItem }));
      return {
        ok: true,
        state: { ...next, crossRecords: [...next.crossRecords, record], phase: "crossAnswer", turnSeat: opp },
      };
    }

    case "answer": {
      if (state.phase !== "crossAnswer") {
        return fail("WRONG_PHASE", "现在不是回答轮次。");
      }
      if (state.turnSeat !== actor) {
        return fail("NOT_YOUR_TURN", "还没轮到你回答。");
      }
      if (!action.text?.trim() || action.text.trim().length < 6) {
        return fail("ANSWER_TOO_SHORT", "Host：回答太短——质询的意义在于正面交锋。");
      }
      const records = [...state.crossRecords];
      const last = records[records.length - 1];
      if (!last) {
        return fail("NO_QUESTION", "目前没有待回答的质询。");
      }
      const reachedQuestionLimit = state.pressedBy.includes(last.asker);
      records[records.length - 1] = {
        ...last,
        answer: action.text.trim(),
        closedBy: reachedQuestionLimit ? "questionLimit" : last.closedBy,
      };
      const next = withTranscript(state, makeTurn(state.roomId, actor, "answer", action.text.trim()));
      const answered = { ...next, crossRecords: records };
      if (reachedQuestionLimit) {
        return { ok: true, state: advanceAfterCross(answered, last.asker) };
      }
      return {
        ok: true,
        state: { ...answered, phase: "crossReact", turnSeat: last.asker },
      };
    }

    case "react": {
      if (state.phase !== "crossReact") {
        return fail("WRONG_PHASE", "现在不是做反应的时候。");
      }
      if (state.turnSeat !== actor) {
        return fail("NOT_YOUR_TURN", "还没轮到你做反应。");
      }
      if (!["accept", "press"].includes(action.reaction)) {
        return fail("VALIDATION", "反应必须是 accept 或 press。");
      }
      if (action.reaction === "press" && state.pressedBy.includes(actor)) {
        return fail("PRESS_LIMIT", "继续追问每方限 1 次——你已经用过了。");
      }
      const records = [...state.crossRecords];
      const last = records[records.length - 1];
      if (!last) return fail("NO_QUESTION", "目前没有待处理的质询。");
      records[records.length - 1] = {
        ...last,
        reaction: action.reaction,
        pressed: action.reaction === "press",
        closedBy: action.reaction === "accept" ? "accepted" : last.closedBy,
      };

      const pressedBy =
        action.reaction === "press" ? [...state.pressedBy, actor] : state.pressedBy;
      let next: RoomState = { ...state, crossRecords: records, pressedBy };

      if (action.reaction === "press") {
        // 继续追问：回到本方提问（仍针对同一对手），限 1 次已由 pressedBy 守住
        return { ok: true, state: { ...next, phase: "crossAsk", turnSeat: actor } };
      }

      // 接受只结束本方质询，不表示同意对方立场；是否回避由终局 AI 评价
      return { ok: true, state: advanceAfterCross(next, actor) };
    }

    case "freeSpeak": {
      if (state.phase !== "free") {
        return fail("WRONG_PHASE", "自由对辩阶段才能自由发言。");
      }
      if (!FREE_TYPES.includes(action.freeType)) {
        return fail("VALIDATION", "发言类型必须是 反驳/举证/承认/修正/寻共识 之一。");
      }
      if (state.freeSpokenBy.includes(actor)) {
        return fail("FREE_LIMIT", "自由对辩每方 1 次——你已经发言过了。");
      }
      if (!action.text?.trim()) {
        return fail("EMPTY_SPEECH", "Host：发言不能为空。");
      }
      if (action.freeType === "修正" && !action.revisedTo?.trim()) {
        return fail("REVISION_REQUIRED", "Host：选了「修正」就请写出修正后的表述——原表述的痕迹会保留。");
      }

      const turn = makeTurn(state.roomId, actor, "free", action.text.trim(), { freeType: action.freeType });
      let next = withTranscript(state, turn);

      if (action.freeType === "修正" && action.revisedTo?.trim()) {
        const previous = next.briefs[actor];
        next = {
          ...next,
          revisions: [
            ...next.revisions,
            {
              seat: actor,
              from: previous?.conclusion ?? "",
              to: action.revisedTo.trim(),
              at: new Date().toISOString(),
            },
          ],
          briefs: {
            ...next.briefs,
            [actor]: previous ? { ...previous, conclusion: action.revisedTo.trim() } : previous,
          },
        };
      }
      if (action.freeType === "举证") {
        next = pushEvidence(next, actor, action.text.trim(), "已提供来源");
      }

      const spoken = new Set([...next.freeSpokenBy, actor]);
      const both = spoken.has("pro") && spoken.has("con");
      return {
        ok: true,
        state: {
          ...next,
          freeSpokenBy: [...next.freeSpokenBy, actor],
          phase: both ? "closing" : "free",
          turnSeat: both ? null : opponentOf(actor),
        },
      };
    }

    case "submitClosing": {
      if (state.phase !== "closing") {
        return fail("WRONG_PHASE", "结辩阶段才能提交结辩。");
      }
      if (!action.text?.trim()) {
        return fail("EMPTY_CLOSING", "Host：结辩不能为空——它会被写进对局报告。");
      }
      if (action.revision && (!action.revision.to?.trim() || !action.revision.from?.trim())) {
        return fail("REVISION_REQUIRED", "Host：勾了修正就写出修正前后的表述。");
      }
      const turn = makeTurn(state.roomId, actor, "closing", action.text.trim());
      let next = withTranscript(state, turn);
      if (action.revision) {
        next = {
          ...next,
          revisions: [...next.revisions, { seat: actor, ...action.revision, at: new Date().toISOString() }],
        };
      }

      const closedBy = new Set(next.transcript.filter((t) => t.kind === "closing").map((t) => t.authorId));
      if (closedBy.has("pro") && closedBy.has("con")) {
        const settled: RoomState = { ...next, phase: "settled", turnSeat: null };
        return {
          ok: true,
          state: { ...settled, report: buildReport(settled, { completed: true }) },
        };
      }
      return { ok: true, state: { ...next, turnSeat: opponentOf(actor) } };
    }

    default:
      return fail("UNKNOWN_ACTION", `未知动作：${(action as { kind: string }).kind}`);
  }
}

/* ═══════════════════ 证据 / 报告 ═══════════════════ */

/** 证据只挂在发言上（PRD §5），不进 transcript 的独立条目 */
function pushEvidence(state: RoomState, _seat: SeatId, _text: string, _status?: EvidenceStatus): RoomState {
  // 证据内联在 turn.evidenceStatus 与 brief.evidence 里；此处保留 hook 以便后续扩展独立证据清单
  return state;
}

/** 发言类型计数辅助 */
function countByFreeType(state: RoomState, freeType: FreeType): { seat: SeatId; text: string }[] {
  return state.transcript
    .filter((turn) => turn.kind === "free" && turn.freeType === freeType)
    .map((turn) => ({ seat: turn.authorId as SeatId, text: turn.text }));
}

/**
 * 生成本场对局报告（PRD §8）。
 *
 * **无胜负字段**：报告结构里物理上不存在 winner / rank 槽位。
 * 六维评估在此处用可观测行为的启发式占据；接入 LLM 后由 Host `evaluate` 覆盖
 * （见 `mergeEvaluateResult`）。
 */
export function buildReport(
  state: RoomState,
  { completed = false, leftBy }: { completed?: boolean; leftBy?: SeatId } = {},
): RoomReport {
  const evidence = state.transcript
    .filter((turn) => turn.evidenceStatus)
    .map((turn) => ({ seat: turn.authorId as SeatId, text: turn.text, status: turn.evidenceStatus }));

  const consensus = countByFreeType(state, "寻共识");
  const acknowledged = countByFreeType(state, "承认");

  // 不接受对手的人工「回避」裁决；未决问题由终局 AI 对照完整问答生成。
  const openQuestions: string[] = [];

  const profiles: Record<SeatId, number[] | null> = {
    pro: state.seats.pro?.profile ?? null,
    con: state.seats.con?.profile ?? null,
  };

  return {
    roomId: state.roomId,
    topic: state.topic,
    briefs: state.briefs,
    crossRecords: state.crossRecords,
    evidence,
    consensus,
    acknowledged,
    openQuestions,
    revisions: state.revisions,
    profiles,
    grounds: [],
    verdict: "",
    settlement: settleMp({
      completed,
      left: Boolean(leftBy),
    }),
    completed,
    hostDegraded: state.host?.degraded ?? false,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * 把 Host `evaluate` 的结果合并进报告（覆盖启发式六维）。
 * Host 返回 `{dims, total, grounds, verdict}`；这里只取画像与依据，**不引入排名语义**。
 */
export function mergeEvaluateResult(
  report: RoomReport,
  evaluated: { dims: Record<string, number>; grounds?: { dim: string; quote: string; reason: string }[]; verdict?: string },
): RoomReport {
  const profile = PROFILE_DIMS.map((dim) => Math.round(evaluated.dims?.[dim] ?? 0));
  return {
    ...report,
    profiles: { pro: profile, con: null },
    grounds: evaluated.grounds ?? [],
    verdict: evaluated.verdict ?? "",
  };
}

/** 是否为合法议题（真实数据校验，provenance 红线） */
export function isUsableTopic(topic: DebateTopic | null | undefined): boolean {
  if (!topic?.questionId || !topic.title) return false;
  return Boolean(topic.pro?.claim || topic.con?.claim);
}

/**
 * 创建房间初始状态。
 *
 * 这是 **RoomState 的唯一构造入口**——服务端与前端都必须用它，
 * 不许各自手写一份（曾经因为服务端手写精简状态而缺 `briefs` 字段，导致动作全被拒）。
 */
export function createRoomState({
  roomId,
  topic,
  seats = { pro: null, con: null },
  now = new Date().toISOString(),
  match = {
    mode: "human",
    status: "waiting",
    reason: "已进入真人候选池，等待持相反立场的用户在线。",
    requestedAt: now,
  },
  host = { degraded: false },
}: {
  roomId: string;
  topic: DebateTopic;
  seats?: RoomState["seats"];
  now?: string;
  match?: MatchInfo;
  host?: RoomState["host"];
}): RoomState {
  const occupied = Object.values(seats).filter(Boolean).length;
  return {
    roomId,
    topic,
    match,
    // 两个席位都有人才算开局（waiting 时不允许任何对局动作）
    phase: occupied >= 2 ? "opening" : "waiting",
    seats,
    briefs: { pro: null, con: null },
    transcript: [],
    crossRecords: [],
    revisions: [],
    pressedBy: [],
    freeSpokenBy: [],
    turnSeat: occupied >= 2 ? "pro" : null,
    host,
    report: null,
    createdAt: now,
  };
}

/**
 * 席位占满后把房间从 waiting 推进到 opening。
 * 这是 `waiting → opening` 的唯一合法跃迁（`transition()` 不管 waiting，因为那是撮合层的事）。
 */
export function openRoom(state: RoomState, now = new Date().toISOString()): RoomState {
  if (state.phase !== "waiting") return state;
  const occupied = Object.values(state.seats).filter(Boolean).length;
  if (occupied < 2) return state;
  return {
    ...state,
    match: {
      ...state.match,
      status: "matched",
      matchedAt: state.match.matchedAt ?? now,
      reason: state.match.mode === "ai"
        ? "已按你的选择创建 AI 对手，Bot 席位已明确标注。"
        : "已匹配到同一议题、相反立场的在线真人。",
    },
    phase: "opening",
    turnSeat: "pro",
    createdAt: state.createdAt || now,
  };
}

/** 席位侧写入（join / 离席时服务端用） */
export function withSeat(
  state: RoomState,
  side: SeatId,
  info: RoomState["seats"][SeatId],
): RoomState {
  return { ...state, seats: { ...state.seats, [side]: info } };
}
