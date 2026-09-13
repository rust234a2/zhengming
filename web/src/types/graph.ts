/**
 * 辩论力导向树的类型定义。
 *
 * 数据层（DebateNode / DebateLink）是「渲染无关」的纯业务结构；
 * 布局层（SimNode / SimLink）是交给 d3-force 的可变副本 ——
 * d3 会在模拟过程中直接写入 x / y / vx / vy 等字段，
 * 因此绝不能把数据层对象直接交给 d3，否则会污染 React 状态。
 */

export type DebateNodeType =
  | "topic"
  | "side"
  | "argument"
  | "evidence"
  | "rebuttal"
  | "response";

export type DebateSide = "positive" | "negative" | "neutral";

export type DebateLinkRelation = "contains" | "supports" | "rebuts" | "responds";

export interface DebateNode {
  id: string;
  label: string;
  type: DebateNodeType;
  side: DebateSide;
  parentId?: string;
  children?: DebateNode[];
}

export interface DebateLink {
  id: string;
  source: string;
  target: string;
  relation: DebateLinkRelation;
}

/* ────────── 布局层：d3-force 的可变工作副本 ────────── */

/** 交给 d3.forceSimulation 的节点（d3 会写入坐标与速度）。 */
export interface SimNode {
  id: string;
  label: string;
  type: DebateNodeType;
  side: DebateSide;
  parentId?: string;
  /** 距根节点的层级，用于决定半径、斥力强度与连线距离。 */
  depth: number;
  /** 画布半径（像素），由 depth 与度数推导。 */
  radius: number;
  /** 该节点是否有可展开的子节点（控制展开/收起按钮）。 */
  hasChildren: boolean;
  /** 当前是否处于展开态（仅对有子节点的节点有意义）。 */
  expanded: boolean;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  /** 拖拽时由 d3.drag 写入的固定坐标，松手置 null。 */
  fx?: number | null;
  fy?: number | null;
}

/** 交给 d3.forceLink 的连线（source / target 会被 d3 替换成节点引用）。 */
export interface SimLink {
  id: string;
  source: SimNode | string;
  target: SimNode | string;
  relation: DebateLinkRelation;
  /** 连线的两个端点深度，用于按层级调整自然长度与线宽。 */
  sourceDepth: number;
  targetDepth: number;
}

/** 视觉上已解析出节点引用的连线（渲染时使用）。 */
export interface ResolvedLink {
  id: string;
  relation: DebateLinkRelation;
  source: SimNode;
  target: SimNode;
}
