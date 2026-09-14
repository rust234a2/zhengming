/**
 * 辩论间 · UI 决策层（纯函数，无 React、无 IO）
 *
 * 为什么把「界面该显示什么」抽出来单独测：
 *   布局会反复调整，但**规则不该被布局带着走**。这里集中回答：
 *   「当前阶段 + 我是谁 → 我该看到哪个输入区 / 是否该等对方」，
 *   以及报告分栏、雷达图坐标这类可计算的东西。
 *
 * 红线：
 *   - 无任何 winner / rank / 胜负 概念；段位只展示参与度。
 *   - 跨议题配对必须显式标注，不得假装是同一议题的正反方。
 */

import {
  PROFILE_DIMS,
  type BriefItemKey,
  type DebateTopic,
  type FreeType,
  type HostTopic,
  type PlayableTopic,
  type Reaction,
  type RoomAction,
  type RoomPhase,
  type RoomReport,
  type RoomState,
  type SeatId,
  type TopicClaim,
} from "../types/debateRoom";
import { briefItems, opponentOf } from "../domain/debateRoom";
import { findBannedWords } from "../domain/roomClient";

/* ═══════════════ 阶段与输入区 ═══════════════ */

export type ComposerKind =
  | "waiting" // 等对手入席
  | "brief" // ① 填立论结构
  | "waitingBrief" // ① 我已交结构，等对方
  | "opening" // ① 开篇陈述
  | "ask" // ② 质询：选题靶 + 提问
  | "answer" // ② 回答
  | "react" // ② 接受回答或继续追问
  | "free" // ③ 自由对辩
  | "closing" // ④ 结辩
  | "waitingTurn" // 等对方动作
  | "settled"; // ⑤ 终局

export interface ReactionOption {
  value: Reaction;
  label: string;
  hint: string;
}

const REACTIONS: ReactionOption[] = [
  { value: "accept", label: "接受回答", hint: "只表示结束本轮，不代表同意对方立场" },
  { value: "press", label: "继续追问", hint: "每方限 1 次，针对同一靶点再问一次" },
];

export interface ComposerSpec {
  kind: ComposerKind;
  /** 是否轮到我动作（决定输入框是否可编辑） */
  canAct: boolean;
  /** 给用户的一句话提示（Host 语气，不代写） */
  hint: string;
  /** 质询靶点（kind=ask 时） */
  targets?: { key: BriefItemKey; text: string }[];
  /** 待回答的问题（kind=answer 时） */
  prompt?: string;
  /** 待回应的问题（kind=react 时） */
  reactingTo?: string;
  /** 追问是否已用掉（kind=react 时，决定选项集合） */
  pressUsed?: boolean;
  /** 可选项（kind=react） */
  reactions?: ReactionOption[];
  /** 可选的发言类型（kind=free） */
  freeTypes?: FreeType[];
  /** 固定文案（waiting / settled） */
  note?: string;
}

const FREE_TYPES: FreeType[] = ["反驳", "举证", "承认", "修正", "寻共识"];

const WAITING_NOTE = "等对方入席。把这一页的链接发给他——他打开后会自动坐到另一个席位。";
const SETTLED_NOTE = "本局已结束。可以查看对局报告，或点「再来一局」开新的一局。";

/**
 * 决定当前该渲染哪个输入区。
 *
 * @param state 服务端权威快照
 * @param me 我的席位（未入席传 null）
 */
export function composerFor(state: RoomState, me: SeatId | null): ComposerSpec {
  if (!me) {
    return { kind: "waiting", canAct: false, hint: "先从上面的议题里选一边入席。" };
  }
  const myTurn = state.turnSeat === me;

  switch (state.phase) {
    case "waiting":
      return { kind: "waiting", canAct: false, hint: WAITING_NOTE, note: WAITING_NOTE };

    case "opening": {
      const myBrief = state.briefs[me];
      const theirBrief = state.briefs[opponentOf(me)];
      if (!myBrief) {
        return {
          kind: "brief",
          canAct: true,
          hint: "先填立论结构——它是你这段发言的骨架，也是对方质询时要瞄准的靶子。",
        };
      }
      if (!theirBrief) {
        return {
          kind: "waitingBrief",
          canAct: false,
          hint: "你的结构已登记，等对方提交后就能开始开篇陈述。",
        };
      }
      return {
        kind: "opening",
        canAct: myTurn || state.transcript.every((turn) => turn.authorId !== me || turn.kind !== "opening"),
        hint: "按「定义 → 结论 → 理由 → 依据 → 判断标准」把立论讲完整。Host 只做结构提示，不代写。",
      };
    }

    case "crossAsk": {
      if (!myTurn) return { kind: "waitingTurn", canAct: false, hint: "等对方提问——轮到你时会自动解锁。" };
      const targets = briefItems(state.briefs[opponentOf(me)]);
      if (!targets.length) {
        return { kind: "waitingTurn", canAct: false, hint: "对方的立论结构里没有可质询的条目。" };
      }
      return {
        kind: "ask",
        canAct: true,
        hint: "选对方立论结构里的一个条目，只问一个问题——不许打包追问。",
        targets,
      };
    }

    case "crossAnswer": {
      if (!myTurn) return { kind: "waitingTurn", canAct: false, hint: "等对方回答。" };
      const last = state.crossRecords[state.crossRecords.length - 1];
      return {
        kind: "answer",
        canAct: true,
        hint: "正面回答这个问题。答得太短不算交锋——Host 会拦下来。",
        prompt: last?.question ?? "",
      };
    }

    case "crossReact": {
      if (!myTurn) return { kind: "waitingTurn", canAct: false, hint: "等对方处理你的质询。" };
      const last = state.crossRecords[state.crossRecords.length - 1];
      const pressUsed = state.pressedBy.includes(me);
      return {
        kind: "react",
        canAct: true,
        hint: "接受回答可提前结束本轮；否则可继续追问 1 次。是否回避由终局 AI 根据问答原文评分。",
        reactingTo: last?.question ?? "",
        pressUsed,
        reactions: pressUsed ? [] : REACTIONS,
      };
    }

    case "free":
      if (state.freeSpokenBy.includes(me)) {
        return { kind: "waitingTurn", canAct: false, hint: "本轮你已发言，等对方。" };
      }
      return {
        kind: "free",
        canAct: true,
        hint: "一次发言机会，先标注类型：反驳 / 举证 / 承认 / 修正 / 寻共识。选「修正」要写出修正后的表述。",
        freeTypes: FREE_TYPES,
      };

    case "closing": {
      const closedByMe = state.transcript.some((turn) => turn.kind === "closing" && turn.authorId === me);
      if (closedByMe) return { kind: "waitingTurn", canAct: false, hint: "你的结辩已提交，等对方。" };
      return {
        kind: "closing",
        canAct: true,
        hint: "做结构化收束：本场在哪里交锋、你保留了哪些、修正了哪些。不要求承认对方，也不要求对方承认你。",
      };
    }

    case "settled":
      return { kind: "settled", canAct: false, hint: SETTLED_NOTE, note: SETTLED_NOTE };

    default:
      return { kind: "waitingTurn", canAct: false, hint: "等待服务端推进阶段。" };
  }
}

/* ═══════════════ 五阶段进度条 ═══════════════ */

export type StageState = "todo" | "active" | "done";

export interface StageItem {
  name: string;
  state: StageState;
}

const STAGES = ["立论", "质询轮", "自由对辩", "结辩", "终局"] as const;

/** 房间相位 → 五阶段索引（质询三个子相位都归到「质询轮」） */
const PHASE_STAGE: Record<RoomPhase, number> = {
  waiting: -1,
  opening: 0,
  crossAsk: 1,
  crossAnswer: 1,
  crossReact: 1,
  free: 2,
  closing: 3,
  settled: 5,
};

export function stageProgress(state: RoomState): StageItem[] {
  const current = PHASE_STAGE[state.phase] ?? -1;
  return STAGES.map((name, index) => ({
    name,
    state: state.phase === "settled" ? "done" : index < current ? "done" : index === current ? "active" : "todo",
  }));
}

/* ═══════════════ 议题徽章 ═══════════════ */

export interface TopicBadge {
  text: string;
  tone: "paired" | "cross" | "single" | "provenance";
}

/**
 * 议题徽章。**跨议题配对必须显式标注**——数据实情是 27 个真实议题里只有 2 个天然成对，
 * 其余是跨议题对撞，不能让用户误以为是同一议题的正反方。
 */
export function topicBadges(topic: DebateTopic): TopicBadge[] {
  const badges: TopicBadge[] = [];
  if (topic.paired) {
    badges.push({ text: "同一议题真实正反方", tone: "paired" });
  } else if (topic.crossPaired) {
    badges.push({ text: "跨议题配对｜两侧论点来自不同议题", tone: "cross" });
  } else {
    badges.push({ text: "单侧议题｜另一边由对手自持立场", tone: "single" });
  }
  if (topic.crossPaired && topic.pairingNote) {
    badges.push({ text: topic.pairingNote, tone: "cross" });
  }
  for (const claim of [topic.pro, topic.con]) {
    if (!claim) continue;
    badges.push({
      text: `${claim.author || "匿名"} · 赞同 ${claim.voteUp}`,
      tone: "provenance",
    });
  }
  return badges;
}

/* ═══════════════ 议题聚合 ═══════════════ */

/** 解析 `/api/topics` 响应，容忍形状差异与脏数据 */
export function parseTopicsResponse(payload: unknown): HostTopic[] {
  if (!payload || typeof payload !== "object") return [];
  const topics = (payload as { topics?: unknown }).topics;
  if (!Array.isArray(topics)) return [];
  return topics.filter(
    (topic): topic is HostTopic =>
      Boolean(topic) && typeof topic === "object" && typeof (topic as HostTopic).questionId === "string",
  );
}

/**
 * 把服务端议题聚合成可开局列表。
 *
 * - 只要**任一侧有真实论点**就可开局（另一侧由真人守）——数据里单侧议题占多数，
 *   如果要求必须天然成对，能开局的会只剩 2 个。
 * - `playable` 与 `paired` 是两件事：前者是"能不能开局"，后者是"数据是否天然成对"。
 */
export function aggregateTopics(topics: HostTopic[]): PlayableTopic[] {
  return topics
    .map<PlayableTopic>((topic) => {
      const sidesAvailable: SeatId[] = [];
      if (topic.pro?.claim) sidesAvailable.push("pro");
      if (topic.con?.claim) sidesAvailable.push("con");
      return {
        questionId: topic.questionId,
        title: topic.title || "（未命名议题）",
        url: topic.url || "",
        paired: topic.paired === true,
        crossPaired: topic.crossPaired === true,
        pairingNote: topic.pairingNote,
        playable: sidesAvailable.length > 0,
        sidesAvailable,
        traceable: /^https:\/\//.test(topic.url || ""),
        pro: topic.pro ?? null,
        con: topic.con ?? null,
      };
    })
    // 可开局的排前面；同组内天然成对优先
    .sort((a, b) => Number(b.playable) - Number(a.playable) || Number(b.paired) - Number(a.paired));
}

/* ═══════════════ 提交前置校验 ═══════════════ */

/**
 * 提交按钮是否可用。**本地先拦一道**，与领域层规则保持一致：
 * 不是为了替代服务端校验（服务端仍会再校验），而是避免用户白跑一趟往返。
 */
export function canSubmitAction(action: RoomAction): boolean {
  const text = "text" in action ? action.text ?? "" : "";
  if (text && findBannedWords(text).length) return false;

  switch (action.kind) {
    case "submitBrief": {
      const brief = action.brief;
      if (!brief?.conclusion?.trim()) return false;
      const reasons = (brief.reasons ?? []).filter((reason) => reason?.trim());
      return reasons.length >= 1 && reasons.length <= 2;
    }
    case "submitOpening":
    case "submitClosing":
      return Boolean(text.trim());
    case "ask": {
      if (!action.targetItem) return false;
      const question = action.question ?? "";
      if (!question.trim()) return false;
      // 恰好一个问号（禁打包追问，与 Host 契约同一条硬约束）
      return (question.match(/[?？]/g) ?? []).length === 1;
    }
    case "answer":
      // 领域层要求至少 6 个字——本地同门槛，避免提交后被拒
      return Boolean(text.trim()) && Array.from(text.trim()).length >= 6;
    case "react":
      return ["accept", "press"].includes(action.reaction);
    case "freeSpeak": {
      if (!text.trim()) return false;
      if (action.freeType === "修正") return Boolean(action.revisedTo?.trim());
      return true;
    }
    case "leave":
      return true;
    case "pickSide":
      return true;
    default:
      return false;
  }
}

/** 质询靶点的可读说明 */
export function describeBriefItem(key: BriefItemKey): string {
  switch (key) {
    case "定义":
      return "关键定义：对方使用的核心词是怎么界定的";
    case "结论":
      return "核心结论：对方最终主张什么";
    case "理由 1":
      return "理由 1：支撑结论的第一条理由";
    case "理由 2":
      return "理由 2：支撑结论的第二条理由";
    case "依据":
      return "依据：支撑理由的事实或来源";
    default:
      return key;
  }
}

/* ═══════════════ 对局报告分栏 ═══════════════ */

export interface ReportItem {
  text: string;
  meta?: string;
}

export interface ReportSection {
  id: string;
  title: string;
  /** 空栏目也保留（显式显示「暂无」而不是整个消失） */
  items: ReportItem[];
  emptyText: string;
}

const SEAT_NAME: Record<SeatId, string> = { pro: "正方", con: "反方" };

/** 报告分栏顺序固定，便于测试与稳定渲染 */
export function reportSections(report: RoomReport): ReportSection[] {
  return [
    {
      id: "consensus",
      title: "已达成共识",
      emptyText: "本场没有出现标为「寻共识」的发言。",
      items: report.consensus.map((item) => ({ text: item.text, meta: SEAT_NAME[item.seat] })),
    },
    {
      id: "openQuestions",
      title: "尚未解决的分歧",
      emptyText: "终局 AI 未标出仍待回应的问题。",
      items: report.openQuestions.map((text) => ({ text })),
    },
    {
      id: "cross",
      title: "质询记录",
      emptyText: "本场没有质询记录。",
      items: report.crossRecords.map((record) => {
        const reactionLabel = record.closedBy === "questionLimit"
          ? "达到质询上限后自动结束"
          : record.closedBy === "accepted" || record.reaction === "accept"
            ? "已接受回答"
            : record.reaction === "press"
              ? "已继续追问"
              : "等待回答";
        const answer = record.answer ? `｜回答：${record.answer}` : "";
        return {
          text: `【${record.targetItem}】${record.question}${answer}`,
          meta: `${SEAT_NAME[record.asker]}提问 · ${reactionLabel}`,
        };
      }),
    },
    {
      id: "acknowledged",
      title: "已被承认的论证",
      emptyText: "本场没有出现标为「承认」的发言。该项仅作语义标注，不影响任何结算。",
      items: report.acknowledged.map((item) => ({ text: item.text, meta: SEAT_NAME[item.seat] })),
    },
    {
      id: "revisions",
      title: "观点修正记录",
      emptyText: "双方都没有修正自己的表述。",
      items: report.revisions.map((record) => ({
        text: `「${record.from}」→「${record.to}」`,
        meta: `${SEAT_NAME[record.seat]} · 原表述痕迹保留`,
      })),
    },
    {
      id: "evidence",
      title: "关键证据",
      emptyText: "本场没有登记带证据状态的发言。",
      items: report.evidence.map((item) => ({
        text: item.text,
        meta: `${SEAT_NAME[item.seat]}${item.status ? ` · ${item.status}` : ""}`,
      })),
    },
  ];
}

/* ═══════════════ 雷达图几何 ═══════════════ */

export interface Point {
  x: number;
  y: number;
}

/**
 * 六维雷达图顶点坐标。
 * 从 12 点钟方向开始顺时针分布；值夹紧到 0-100；缺维按 0 补齐。
 *
 * @param values 0-100 的六维值（可多于或少于 6 个，按 PROFILE_DIMS 取前 6 位）
 */
export function radarPoints(values: number[], cx: number, cy: number, radius: number): Point[] {
  const dims = PROFILE_DIMS.length;
  return PROFILE_DIMS.map((_dim, index) => {
    const raw = Number(values[index] ?? 0);
    const value = Math.max(0, Math.min(100, Number.isFinite(raw) ? raw : 0));
    // 从 -90° 起（12 点钟方向），顺时针
    const angle = (Math.PI * 2 * index) / dims - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });
}
