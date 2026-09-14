/**
 * 辩论树业务模型。
 *
 * 对齐 `docs/design/debate-tree-PRD.md` §3.2 的节点 schema 与
 * `docs/design/debate-tree-PLAN.md` 的「数据与状态模型」。
 *
 * 两处刻意的设计：
 *
 * 1. **知乎赞同数 ≠ 争鸣平台投票。**
 *    种子数据带的是真实知乎 `voteUp`（来源热度），平台 `votes` 是用户在
 *    这棵树上的单节点单票。两者来源、语义、更新时机都不同，因此分成两个字段，
 *    UI 也必须分开展示——把 204 赞写进 `votes.up` 会让「三派占比」看起来有数据，
 *    实际上那些票并不存在。这是 provenance 要求，不是洁癖。
 *
 * 2. **不伪造缺失字段。** 语料没有答主就不填 `author`，没有时间就不填
 *    `createdAt`，没有依据就不填 `evidence`。宁可少一个字段，不造一个默认值。
 *
 * 未完成项（对应 PLAN 阶段 1）：文档层尚未落成 `DebateTreeDocument`（节点表 +
 * revision）与 repository，当前仍是组件内的嵌套树。本文件的节点形状在两者之间
 * 保持兼容，迁移时只需换掉容器，不改字段。
 */

/* ═══════════════ 基础枚举 ═══════════════ */

/** 三派立场；PRD 里 neutral 的界面名是「看条件」 */
export type Stance = "pro" | "con" | "neutral";

/** 节点类型：root 全树唯一；question 不可投票、立场继承被追问节点 */
export type DebateNodeType = "root" | "claim" | "question";

/** 当前用户在该节点上的投票方向；null 表示未投 */
export type ViewerVote = "up" | "down" | null;

/* ═══════════════ 节点 ═══════════════ */

/** 争鸣平台自身的投票计数（种子节点一律从 0 起） */
export interface NodeVotes {
  up: number;
  down: number;
}

/** 知乎溯源：真实链接 + 真实原文节选，可选带真实赞同数 */
export interface NodeSource {
  url: string;
  /** 真实回答正文节选（≤200 字），来自语料，不得改写 */
  quote: string;
  /** 知乎赞同数（来源热度），与平台 votes 无关 */
  voteUp?: number;
}

export interface DebateTreeNode {
  id: string;
  type: DebateNodeType;
  /** root 恒为 "root"；claim / question 取三派之一 */
  stance: Stance | "root";
  text: string;
  /** 真实答主；语料没有就不填（root 通常没有——提问者信息不在语料里） */
  author?: string;
  /** 作者身份标注（真实，来自语料，如「互联网行业 从业人员」） */
  authorBadge?: string;
  /**
   * 该节点的溯源说明，由生成器撰写（**不是语料原文**）。
   * 与 `source.quote` 严格区分：quote 是真实回答正文节选，note 是「这批数据从哪来」。
   */
  provenanceNote?: string;
  /** 内联依据：仅参与者自己填写时存在 */
  evidence?: string;
  agentHint?: string;
  /** question 专用：被回应前为 false */
  answered?: boolean | null;
  source?: NodeSource;
  /** 平台投票计数；question 为 null */
  votes: NodeVotes | null;
  viewerVote: ViewerVote;
  createdAt?: string;
  children: DebateTreeNode[];
}

/* ═══════════════ 冷启动种子（生成物形状） ═══════════════ */

/**
 * 溯源通道。
 * - `claims`   一级论点已由立场抽取管线产出（有作者、赞同数、原文链接）
 * - `answers`  只采到真实回答摘要，立场归属**未经标注**，不冒充一级论点
 * - `question` 仅真实题干，尚无内容
 */
export type SeedTier = "claims" | "answers" | "question";

/** 语料里的原始立场字段；保留下来便于回溯抽取结果 */
export type SourceSide = "positive" | "negative" | "neutral";

export interface SeedClaim {
  id: string;
  text: string;
  stance: Stance;
  sourceSide: SourceSide;
  author: string;
  authorBadge: string;
  /** 知乎赞同数（真实） */
  voteUp: number;
  /** 真实知乎回答链接 */
  url: string;
  /** 真实回答正文节选 */
  quote: string;
  reasonType: string;
  quality: number | null;
}

/** 真实回答摘要（answers 通道）：只有链接与摘要，没有立场标注 */
export interface SeedAnswerSample {
  url: string;
  summary: string;
}

/** 真实立场聚类结果的一项 */
export interface SeedCluster {
  label: string;
  count: number;
}

export interface SeedClusterMeta {
  total: number;
  valid: number;
  topCluster: string;
  ratio: number;
}

export interface DebateTreeSeed {
  /** `zh-<zhihuId>` */
  id: string;
  zhihuId: string;
  /** 真实题干 */
  title: string;
  /** 真实知乎问题链接 */
  url: string;
  tier: SeedTier;
  /** 真实回答数（语料记录值）；无记录为 null */
  answerCount: number | null;
  /** 该议题的溯源说明，UI 直接展示 */
  note: string;
  clusters: SeedCluster[];
  clusterMeta: SeedClusterMeta | null;
  claims: SeedClaim[];
  answerSamples: SeedAnswerSample[];
}
