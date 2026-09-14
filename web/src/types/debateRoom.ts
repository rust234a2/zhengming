/**
 * 辩论间类型（v0.7 · 真实多人房间）
 *
 * 对照：docs/design/debate-room-PRD.md（v0.7 规则）+ debate-room-ROLLOUT.md（v0.7 落地方案）
 *
 * 红线在类型层的体现：
 *  - **全程无 `winner` / `rank` / `胜负` 字段**。段位是参与度，画像不排名。
 *  - 立论结构只是本条发言的骨架，**不是一棵树**：无节点、无父子关系、无跨发言建边。
 *  - `Side` 是立场标签，不是优劣标签。
 */

/** 席位标识：正 / 反 */
export type SeatId = "pro" | "con";

/** 开局方式：真人候选池或明确选择的 AI 对辩 */
export type MatchMode = "human" | "ai";

/** 撮合状态由服务端维护，前端不得据本地计时伪造已匹配 */
export type MatchStatus = "waiting" | "matched";

export interface MatchInfo {
  mode: MatchMode;
  status: MatchStatus;
  /** 面向用户的撮合依据，不含虚构在线人数 */
  reason: string;
  requestedAt: string;
  matchedAt?: string;
}

/** 证据七档（PRD §5） */
export type EvidenceStatus =
  | "已提供来源"
  | "来源可信但不支持结论"
  | "来源存在争议"
  | "缺少证据"
  | "个人经验"
  | "价值判断"
  | "无法验证";

export const EVIDENCE_STATUSES: readonly EvidenceStatus[] = [
  "已提供来源",
  "来源可信但不支持结论",
  "来源存在争议",
  "缺少证据",
  "个人经验",
  "价值判断",
  "无法验证",
] as const;

/** 六维结构画像的维度名（PRD §6，标签统一 2 字） */
export type ProfileDim = "立论" | "论据" | "逻辑" | "回应" | "表达" | "规范";

export const PROFILE_DIMS: readonly ProfileDim[] = ["立论", "论据", "逻辑", "回应", "表达", "规范"] as const;

/** 立论结构的条目键——②质询轮的靶点（PRD §3） */
export type BriefItemKey = "定义" | "结论" | "理由 1" | "理由 2" | "依据";

export const BRIEF_ITEM_KEYS: readonly BriefItemKey[] = ["定义", "结论", "理由 1", "理由 2", "依据"] as const;

/** 立论结构：本条发言的骨架，**不是树** */
export interface OpeningBrief {
  /** 关键定义：可选；对方可在质询轮直接选中发问 */
  definition?: string;
  /** 核心观点：默认预填所选边的预设论点，可改 */
  conclusion: string;
  /** 理由：至少 1 条 */
  reasons: string[];
  /** 依据：可选，随理由进入证据七档流程 */
  evidence?: string;
  /** 依据的七档状态：填了 evidence 才需要 */
  evidenceStatus?: EvidenceStatus;
}

/** 提问方收到首次回答后的动作：接受并结束，或使用唯一一次追问。 */
export type Reaction = "accept" | "press";

export const REACTIONS: readonly Reaction[] = ["accept", "press"] as const;

/** 自由对辩的发言类型（PRD §4） */
export type FreeType = "反驳" | "举证" | "承认" | "修正" | "寻共识";

export const FREE_TYPES: readonly FreeType[] = ["反驳", "举证", "承认", "修正", "寻共识"] as const;

/** 房间阶段（ROLLOUT §4） */
export type RoomPhase =
  | "waiting" // 等待对手（另一席位未占）
  | "opening" // ① 立论
  | "crossAnswer" // ② 质询轮 · 回答对方
  | "crossAsk" // ② 质询轮 · 轮到本方提问
  | "crossReact" // ② 质询轮 · 对方答完，本方可接受或继续追问
  | "free" // ③ 自由对辩
  | "closing" // ④ 结辩
  | "settled"; // ⑤ 终局

export const ROOM_PHASES: readonly RoomPhase[] = [
  "waiting",
  "opening",
  "crossAnswer",
  "crossAsk",
  "crossReact",
  "free",
  "closing",
  "settled",
] as const;

/** 五阶段的中文名（UI 用来渲染阶段条） */
export const STAGE_NAMES = ["立论", "质询轮", "自由对辩", "结辩", "终局"] as const;

/** 一条发言（Host 能力 2/3/4 的公共入参形状，契约 §0.6） */
export interface Turn {
  turnId: string;
  /** 发言者：席位 id，或 "host"（Host 提示） */
  authorId: SeatId | "host";
  /** 发言类型：brief / opening / question / answer / reaction / free / closing / sys */
  kind: string;
  /** 纯文本，不依赖 HTML */
  text: string;
  /** 自由对辩的发言类型标注（反驳/举证/承认/修正/寻共识） */
  freeType?: FreeType;
  /** 证据七档 */
  evidenceStatus?: EvidenceStatus;
  /** 质询靶点（kind 为 question 时有值） */
  targetItem?: BriefItemKey;
  /** 多选质询靶点；targetItem 保留为首项以兼容旧快照 */
  targetItems?: BriefItemKey[];
  at: string;
}

/** 议题与论点对（来自争议地图管线的真实数据） */
export interface DebateTopic {
  questionId: string;
  title: string;
  url: string;
  /** 是否天然同时有正反论点（同一议题下的真实正反方） */
  paired: boolean;
  /**
   * 是否为**跨议题配对**：两侧论点来自不同议题。
   * 数据实情——27 个真实议题里只有 2 个天然成对，其余按 reasonType 跨议题对撞。
   * `crossPaired: true` 时 UI **必须显式标注**，不得假装是同一议题的正反方。
   */
  crossPaired?: boolean;
  /** 配对说明（跨议题配对时必填，向用户解释这对张力从哪来） */
  pairingNote?: string;
  /** 正方预设论点；跨议题配对时同样有值 */
  pro: TopicClaim | null;
  /** 反方预设论点 */
  con: TopicClaim | null;
}

/** 一条真实论点（provenance：作者 / 赞同数 / 原文链接必须保留） */
export interface TopicClaim {
  id: string;
  claim: string;
  author: string;
  authorBadge?: string;
  voteUp: number;
  url: string;
  reasonType?: string;
  quality?: number | null;
}

/** 席位快照 */
export interface SeatInfo {
  name: string;
  /** 是否在线 */
  connected: boolean;
  /** 是否为 Bot 兜底（不伪造真人在线） */
  isBot: boolean;
  /** 六维历史画像（冷启动为 null） */
  profile?: number[] | null;
}

/** 质询轮记录（进对局报告） */
export interface CrossRecord {
  /** 哪一方提问 */
  asker: SeatId;
  /** 质询靶点 */
  targetItem: BriefItemKey;
  /** 本次质询涉及的全部靶点；旧记录缺省时读取 targetItem */
  targetItems?: BriefItemKey[];
  question: string;
  answer?: string;
  /** 提问方的反应；第二问回答后系统自动推进，不再产生反应动作 */
  reaction?: Reaction;
  /** 本条问答如何结束 */
  closedBy?: "accepted" | "questionLimit";
  /** 是否用过继续追问 */
  pressed: boolean;
  at: string;
}

/** 修正记录（保留原表述痕迹，PRD §4） */
export interface RevisionRecord {
  seat: SeatId;
  from: string;
  to: string;
  at: string;
}

/** 段位（鸣声值） */
export interface MpEntry {
  label: string;
  amount: number;
}

export interface MpSettlement {
  /** 本场净变动 */
  total: number;
  entries: MpEntry[];
  /** 结算后段位名 */
  tier: string;
  /** 结算后累计 MP */
  mp: number;
  /** 距下一段还差多少 MP；已至最高段为 null */
  toNext: { tier: string; remaining: number } | null;
}

/** 对局报告（PRD §8） */
export interface RoomReport {
  roomId: string;
  topic: DebateTopic;
  /** 双方立论结构（含关键定义） */
  briefs: Record<SeatId, OpeningBrief | null>;
  /** 完整质询记录（回避与否由终局 AI 根据问答原文评价） */
  crossRecords: CrossRecord[];
  /** 关键证据（含七档状态） */
  evidence: { seat: SeatId; text: string; status?: EvidenceStatus }[];
  /** 已达成共识（标「寻共识」的发言） */
  consensus: { seat: SeatId; text: string }[];
  /** 已被承认的论证（标「承认」的发言）——仅语义标注，不影响任何结算 */
  acknowledged: { seat: SeatId; text: string }[];
  /** 尚未解决的问题 / 分歧 */
  openQuestions: string[];
  /** 观点修正记录（修正前后对照） */
  revisions: RevisionRecord[];
  /** 六维结构画像（不排名） */
  profiles: Record<SeatId, number[] | null>;
  /** 六维评估依据（每条引用原话） */
  grounds: { seat?: SeatId; dim: string; quote: string; reason: string }[];
  /** 六维评估总结（不含胜负判定） */
  verdict: string;
  /** 段位结算 */
  settlement: MpSettlement;
  /** 是否完整走满五阶段 */
  completed: boolean;
  /** 是否走的是降级（启发式）Host —— 前端必须明示「模拟」 */
  hostDegraded: boolean;
  generatedAt: string;
}

/** Host 降级标记（贯穿房间状态） */
export interface HostStatus {
  degraded: boolean;
  reason?: string;
}

/** 房间权威状态（服务端广播的整体替换对象） */
export interface RoomState {
  roomId: string;
  topic: DebateTopic;
  /** 服务端权威的撮合方式与进度 */
  match: MatchInfo;
  phase: RoomPhase;
  seats: Record<SeatId, SeatInfo | null>;
  /** 双方立论结构（对局中互不可见；报告阶段公开） */
  briefs: Record<SeatId, OpeningBrief | null>;
  /** 全场发言记录（AI 中立评估的数据源） */
  transcript: Turn[];
  /** 质询轮记录 */
  crossRecords: CrossRecord[];
  /** 修正记录 */
  revisions: RevisionRecord[];
  /** 本方已用掉「继续追问」的席位 */
  pressedBy: SeatId[];
  /** 每一方自由对辩是否已发言 */
  freeSpokenBy: SeatId[];
  /** 当前轮到谁动作 */
  turnSeat: SeatId | null;
  /** 本场 Host 是否降级 */
  host: HostStatus;
  /** 终局报告 */
  report: RoomReport | null;
  createdAt: string;
}

/** 房间动作（客户端 → 服务端，ROLLOUT §3.2） */
export type RoomAction =
  | { kind: "pickSide"; side: SeatId }
  | { kind: "submitBrief"; brief: OpeningBrief }
  | { kind: "submitOpening"; text: string; evidence?: string; evidenceStatus?: EvidenceStatus }
  | { kind: "ask"; targetItem?: BriefItemKey; targetItems?: BriefItemKey[]; question: string }
  | { kind: "answer"; text: string }
  | { kind: "react"; reaction: Reaction }
  | { kind: "freeSpeak"; freeType: FreeType; text: string; revisedTo?: string }
  | { kind: "submitClosing"; text: string; revision?: { from: string; to: string } }
  | { kind: "leave" };

export type RoomActionKind = RoomAction["kind"];

/** 跃迁结果 */
export type TransitionResult =
  | { ok: true; state: RoomState }
  | { ok: false; code: string; message: string };

/** 撮合候选（真人优先，按六维画像相近度排序） */
export interface Candidate {
  seatId: string;
  name: string;
  side: SeatId;
  profile: number[] | null;
}

/**
 * 服务端 `/api/topics` 返回的议题形状（比 `DebateTopic` 多出 pool 与 pairingNote 的必填性差异）。
 * 与 `zhengming-server/server.mjs` 的 `buildTopics()` 输出对齐。
 */
export interface HostTopic {
  questionId: string;
  title: string;
  url: string;
  /** 同一议题下是否同时有真实正反论点 */
  paired: boolean;
  /** 是否为跨议题配对（两侧来自不同议题） */
  crossPaired?: boolean;
  pairingNote?: string;
  pro: TopicClaim | null;
  con: TopicClaim | null;
  /** 未经筛选的完整论点池（前端暂不消费，保留以便做「换一条论点」） */
  pool?: { positive: TopicClaim[]; negative: TopicClaim[]; neutral: TopicClaim[] };
}

/** 可开局议题（前端聚合后的形态） */
export interface PlayableTopic {
  questionId: string;
  title: string;
  url: string;
  paired: boolean;
  crossPaired: boolean;
  pairingNote?: string;
  /** 至少一侧有真实论点即可开局（另一侧由真人守） */
  playable: boolean;
  /** 该议题可选边的席位（有论点的那些边） */
  sidesAvailable: SeatId[];
  /** 是否有可溯源的知乎链接（provenance 红线） */
  traceable: boolean;
  pro: TopicClaim | null;
  con: TopicClaim | null;
}

export interface RankedCandidate extends Candidate {
  /** 画像相近度 0-1；无画像为 null（排在有画像之后） */
  score: number | null;
}

/** `POST /api/matches` 的请求与响应契约 */
export interface MatchRequest {
  topicId: string;
  side: SeatId;
  mode: MatchMode;
  name: string;
  profile?: number[] | null;
}

export interface MatchResponse {
  ok: true;
  roomId: string;
  side: SeatId;
  seatToken: string;
  mode: MatchMode;
  status: MatchStatus;
  reason: string;
}

/** 段位表（PRD §7：鸣声值 MP） */
export const TIERS: readonly (readonly [string, number])[] = [
  ["启鸣", 0],
  ["锋鸣", 30],
  ["争鸣", 80],
  ["共鸣", 180],
  ["和鸣", 350],
] as const;

/** MP 变动规则（PRD §7）——只看完成/离席，不消费对手的接受动作 */
export const MP_RULES = {
  completeRoom: 10,
  leavePenalty: -5,
} as const;
