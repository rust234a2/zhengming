/**
 * 跨议题争议地图的类型定义。
 *
 * 与 debate 树的本质区别：树是层级结构（一个节点只能有一个 parentId），
 * 地图是网状结构 —— 同一主张可以横跨多个议题，这正是力导向存在的理由。
 * 因此不能复用 DebateNode，需要独立的图模型。
 *
 * 数据来源：zhengming 仓库 research/controversy-map/map.json
 * （由 zhihu-cli search zhihu 真实检索 + LLM 语义挖掘生成）
 */

export type MapNodeKind = "topic" | "claim" | "cluster";

export type MapEdgeRelation =
  /** 议题 → 论点：单纯归属 */
  | "contains"
  /** 论点 → 主张簇：该论点属于这个跨议题主张 */
  | "member"
  /** 主张簇 → 议题：这个主张在该议题下也出现过（缝合线） */
  | "bridge"
  /** 论点 ↔ 论点：跨议题互相矛盾；骨架视图下聚合成议题间冲突线 */
  | "rebuts";

/** map.json 里的节点原始形态（字段随 kind 变化，故用可选字段）。 */
export interface MapNodeData {
  id: string;
  kind: MapNodeKind;
  label: string;
  fullLabel?: string;
  /** 主张簇的一句话说明 */
  summary?: string;
  side?: DebateSideLike;
  /** 论点：该论点所属议题 */
  topicId?: string;
  /** 论点：理由类型（技术壁垒 / 人类特质 …） */
  reasonType?: string;
  /** 论点：作为辩论素材的质量分 0-1 */
  quality?: number;
  /** 论点：知乎赞同数 */
  votes?: number;
  url?: string;
  /** 度数或回答数，决定视觉权重；论点可能没有，故可选 */
  weight?: number;
  /** 主张簇专用：这个主张缝合了多少个议题（视觉权重的核心依据） */
  topicCount?: number;
}

export type DebateSideLike = "positive" | "negative" | "neutral";

export interface MapEdgeData {
  source: string;
  target: string;
  relation: MapEdgeRelation;
}

export interface ControversyMapData {
  generatedAt: string;
  source: string;
  stats: Record<string, number>;
  nodes: MapNodeData[];
  edges: MapEdgeData[];
}

/* ────────── 布局层：交给 d3 的可变副本 ────────── */

/**
 * 力导向模拟节点。刻意与 debate 树的 SimNode 保持「结构兼容」——
 * 同样是 d3 会写入 x/y/vx/vy 的工作副本，绝不直接传数据层对象。
 */
export interface MapSimNode {
  id: string;
  kind: MapNodeKind;
  label: string;
  /** 完整标题（论点/议题的原始文本），渲染详情浮层与悬停标签用。 */
  fullLabel?: string;
  side: DebateSideLike;
  /** 距「骨架」的层级：topic=0, cluster=1, claim=2 —— 用于分层斥力与半径 */
  depth: number;
  radius: number;
  /** 连接的议题数（cluster 专用），决定视觉权重 */
  topicCount: number;
  votes: number;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface MapSimLink {
  id: string;
  source: MapSimNode | string;
  target: MapSimNode | string;
  relation: MapEdgeRelation;
  sourceDepth: number;
  targetDepth: number;
  /** 仅骨架视图：该边由 N 条论点级 rebuts 聚合而来（议题间冲突线） */
  aggregated?: number;
}

export interface MapResolvedLink {
  id: string;
  relation: MapEdgeRelation;
  source: MapSimNode;
  target: MapSimNode;
  /** 骨架视图的议题间冲突线：聚合了多少条论点级 rebuts */
  aggregated?: number;
}
