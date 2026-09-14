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

/**
 * 视图层节点类型。议题层已从图上移除 —— 主张簇直接连论点，
 * 所以画布上只会出现这两种节点（数据层的 topic 节点保留，但不进渲染）。
 */
export type MapGraphKind = "claim" | "cluster";

export type MapEdgeRelation =
  /** 数据层：议题 → 论点。议题层移除后视图层不再产生此边 */
  | "contains"
  /** 论点 → 主张簇：论点归属于这个跨议题主张（视图层唯一的归属边） */
  | "member"
  /** 数据层：主张簇 → 议题；视图层：主张簇 ↔ 主张簇（两簇共享同一论点，骨架视图推导） */
  | "bridge"
  /** 论点 ↔ 论点：互相矛盾；骨架视图下聚合为主张簇间的对抗线 */
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
  kind: MapGraphKind;
  label: string;
  /** 完整标题（原始文本），渲染详情浮层与悬停标签用。 */
  fullLabel?: string;
  side: DebateSideLike;
  /** 距「骨架」的层级：cluster=0、claim=1 —— 用于分层斥力与半径 */
  depth: number;
  radius: number;
  /** 该主张簇横跨多少个议题（cluster 专用），决定视觉权重 */
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
  /** 骨架视图的簇间线：由 N 个共享论点 / N 处论点级冲突聚合而来 */
  aggregated?: number;
}

export interface MapResolvedLink {
  id: string;
  relation: MapEdgeRelation;
  source: MapSimNode;
  target: MapSimNode;
  /** 骨架视图的簇间线：聚合了多少个共享论点 / 多少处冲突 */
  aggregated?: number;
}
