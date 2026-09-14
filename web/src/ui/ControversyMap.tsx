/**
 * 跨议题争议地图（React + TypeScript + D3 + SVG）。
 *
 * 和「辩论树」的区别 —— 也是这张图存在的理由：
 *   树是层级结构，一个节点只能有一个父节点，只能表达「一场辩论内部」的论证。
 *   地图是网状结构：同一主张可以横跨多个议题（cluster 节点），
 *   这才是力导向不可替代的地方 —— 缩进树物理上无法表达多父关系。
 *
 * 布局目标不是"排版好看"，而是"让聚类自己浮现"：
 *   不同语义的边配不同的力（见 FORCE 配置），结构就会自己长出来。
 *   例如 cluster→topic 的 bridge 边用强吸引，同一主张缝合的议题就会自动靠近。
 *
 * d3 与 React 混用的两个经典坑（同 DebateForceTree）：
 *   1. d3 会就地改写传入对象（x/y/vx/vy、link.source/target 由 id 变对象引用），
 *      所以数据层必须拷成独立工作副本，且 links 快照必须在 forceLink.links() 之前。
 *   2. simulation 只创建一次，靠 nodes()/force() 复用。
 */

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

import { CONTROVERSY_MAP } from "../data/controversyMap";
import type {
  DebateSideLike,
  MapEdgeRelation,
  MapNodeKind,
  MapResolvedLink,
  MapSimLink,
  MapSimNode,
} from "../types/map";

/* ────────── 布局常量 ────────── */

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_STEP = 1.25;

/* ────────── 标签密度三档（语义缩放的标签侧） ──────────
   缩得越远标签越少、放得越大标签越多；跨档才触发重渲染，缩放过程零 React 开销。 */
const LABEL_ZOOM_NEAR = 1.2;
const LABEL_ZOOM_FAR = 0.6;

export type LabelTier = "far" | "mid" | "near";

/** k≥1.2 出全量标签（含论点）；k<0.6 只留主张簇标签；中间档 = 簇 + 议题。 */
export function labelTierFromK(k: number): LabelTier {
  if (k >= LABEL_ZOOM_NEAR) return "near";
  if (k < LABEL_ZOOM_FAR) return "far";
  return "mid";
}

/** 拖拽期间把模拟「温度」钉在 0.45（原型 d3.drag 的 alphaTarget(0.45) 等效）。 */
const DRAG_ALPHA_TARGET = 0.45;

/** 半径：cluster 是骨架要显眼，topic 次之，claim 最小（与原型 demo 一致）。 */
function radiusFor(kind: MapNodeKind, weight: number, topicCount: number): number {
  if (kind === "cluster") return 13 + Math.min(topicCount * 2, 16);
  if (kind === "topic") return 10;
  return 5.5;
}

/** 每类边的自然长度：越"强"的关系越短，让语义结构在几何上可见。 */
function linkDistanceFor(relation: MapEdgeRelation): number {
  switch (relation) {
    case "bridge":
      return 165; // 缝合线：同一主张跨议题，要拉近
    case "member":
      return 78; // 论点归属主张簇，紧贴
    case "contains":
      return 118; // 议题包含论点
    case "rebuts":
      return 250; // 矛盾：刻意拉远，让冲突在视觉上张开
    default:
      return 130;
  }
}

/** 每类边的强度：bridge/member 强吸引，contains 中等，rebuts 弱（避免被硬拉近）。 */
function linkStrengthFor(relation: MapEdgeRelation): number {
  switch (relation) {
    case "bridge":
      return 0.55;
    case "member":
      return 0.9;
    case "contains":
      return 0.32;
    case "rebuts":
      return 0.08;
    default:
      return 0.3;
  }
}

/** 斥力按层级分层：骨架节点撑开空间，论点紧凑。 */
function chargeFor(kind: MapNodeKind): number {
  if (kind === "cluster") return -1150;
  if (kind === "topic") return -560;
  return -170;
}

/* ────────── 扇形分翼（v2 布局） ────────── */

/**
 * v1 用 forceX(±420) 分翼：只约束 X，节点在 Y 方向自由散开，每个立场被拉成
 * 一根竖条（数据扩到 244 论点后尤其难看）。v2 改扇形：正方 = 左扇区、
 * 反方 = 右扇区、中性 = 上下两段；同一主张簇的节点分到相邻角度，保住团块。
 * 目标点只依赖静态数据，是模块级常量——模拟与测试共用同一口径。
 */
export interface PolarityTarget {
  tx: number;
  ty: number;
}

/** 各立场的角度区间（度，数学坐标系：0=右，90=上）。 */
const SECTOR_SPANS: Record<DebateSideLike, Array<[number, number]>> = {
  positive: [[112, 248]],
  negative: [[-68, 68]],
  neutral: [
    [70, 110],
    [250, 290],
  ],
};

/** 各类节点的基准半径：簇最外、议题居中、论点贴内圈。 */
const SECTOR_RADIUS: Record<MapNodeKind, number> = { cluster: 330, topic: 270, claim: 235 };

/** 纵向压缩系数：指向左右的楔形纵向弦天然更长，整体压扁后图形贴合宽视口
 * （v1 竖条问题的反面——不能压出一个横条，0.45 实测各侧横纵比均衡）。 */
const SECTOR_Y_SCALE = 0.45;

const POLARITY_SIDES = ["positive", "negative", "neutral"] as const;

export const POLARITY_TARGETS: Map<string, PolarityTarget> = (() => {
  const nodes = CONTROVERSY_MAP.nodes;
  // 议题 → 缝合它的主张簇（bridge 边方向：cluster → topic）
  const topicCluster = new Map<string, string>();
  for (const e of CONTROVERSY_MAP.edges) {
    if (e.relation === "bridge" && !topicCluster.has(e.target)) topicCluster.set(e.target, e.source);
  }
  type DataNode = (typeof nodes)[number];
  const groupOf = (n: DataNode): string => {
    if (n.kind === "cluster") return n.id;
    if (n.kind === "topic") return topicCluster.get(n.id) ?? `t:${n.id}`;
    if (n.topicId) return topicCluster.get(n.topicId) ?? `t:${n.topicId}`;
    return `solo:${n.id}`;
  };

  const targets = new Map<string, PolarityTarget>();
  const golden = 0.618033988749895;
  let globalIndex = 0;
  for (const side of POLARITY_SIDES) {
    const list = nodes.filter((n) => (n.side ?? "neutral") === side);
    if (!list.length) continue;
    // 同簇相邻；簇间按规模降序（大簇占更宽的角区），其余按 id 稳定
    const sizeOf = new Map<string, number>();
    for (const n of list) sizeOf.set(groupOf(n), (sizeOf.get(groupOf(n)) ?? 0) + 1);
    list.sort((a, b) => {
      const ga = groupOf(a);
      const gb = groupOf(b);
      if (ga !== gb) {
        const bySize = (sizeOf.get(gb) ?? 0) - (sizeOf.get(ga) ?? 0);
        if (bySize !== 0) return bySize;
        return ga < gb ? -1 : 1;
      }
      const rank = (k: MapNodeKind) => (k === "cluster" ? 0 : k === "topic" ? 1 : 2);
      return rank(a.kind) - rank(b.kind) || (a.id < b.id ? -1 : 1);
    });
    // 排序后按 group 切块（排序保证同组连续）
    const groups: DataNode[][] = [];
    let lastGroup = "";
    for (const n of list) {
      const g = groupOf(n);
      if (g !== lastGroup) {
        groups.push([]);
        lastGroup = g;
      }
      groups[groups.length - 1].push(n);
    }

    // 角度分配：单扇区侧整块铺满；中性侧把「整个组」轮流分给上下两段
    //（按组分配而非按节点奇偶，否则同组会被上下弧拆散）
    const spans = SECTOR_SPANS[side];
    const placeInSpan = (span: [number, number], items: DataNode[]) => {
      const n = items.length;
      items.forEach((n0, i) => {
        const theta = ((span[0] + ((i + 0.5) / n) * (span[1] - span[0])) * Math.PI) / 180;
        const jitter = (globalIndex * golden) % 1; // 黄金比例抖动，避免排成完美圆环
        globalIndex += 1;
        const r = SECTOR_RADIUS[n0.kind] * (0.82 + 0.5 * jitter);
        targets.set(n0.id, { tx: r * Math.cos(theta), ty: r * Math.sin(theta) * SECTOR_Y_SCALE });
      });
    };
    if (spans.length === 1) {
      placeInSpan(spans[0], groups.flat());
    } else {
      spans.forEach((span, si) => {
        placeInSpan(span, groups.filter((_, gi) => gi % spans.length === si).flat());
      });
    }
  }
  return targets;
})();

/* ────────── 视觉常量 ────────── */

const KIND_LABEL: Record<MapNodeKind, string> = {
  topic: "议题",
  claim: "论点",
  cluster: "共识主张",
};

/** 三类节点用不同形状承载身份 —— 用户一眼能分辨自己在看什么。 */
function fillForNode(node: MapSimNode): string {
  if (node.kind === "cluster") {
    return node.side === "positive" ? "#0f6fe5" : node.side === "negative" ? "#d9574d" : "#64748b";
  }
  if (node.kind === "topic") return "#111827";
  if (node.side === "positive") return "#7fb0f2";
  if (node.side === "negative") return "#eda49c";
  return "#a8b6c8";
}

function strokeForNode(node: MapSimNode): string {
  if (node.kind === "cluster") return "#0b3f80";
  if (node.kind === "topic") return "#111827";
  return "#ffffff";
}

/** 跨议题矛盾边用醒目的橙红 —— 它是最有信息量的关系。 */
function strokeForLink(relation: MapEdgeRelation): string {
  switch (relation) {
    case "bridge":
      return "#e8a33d"; // 缝合线：金色高亮（这张图的核心）
    case "rebuts":
      return "#d9574d"; // 矛盾：红
    case "member":
      return "#b9c6d4";
    case "contains":
      return "#dbe3ec";
    default:
      return "#dbe3ec";
  }
}

function dashForLink(relation: MapEdgeRelation): string | undefined {
  switch (relation) {
    case "bridge":
      return "7 5";
    case "rebuts":
      return "5 4";
    default:
      return undefined;
  }
}

function widthForLink(relation: MapEdgeRelation): number {
  switch (relation) {
    case "bridge":
      return 2;
    case "rebuts":
      return 1.6;
    case "member":
      return 1.1;
    default:
      return 0.8;
  }
}

/**
 * 连线的常态透明度按关系类型分层（一致性原则优先于好看）：
 * 同类关系永远同一种视觉，不同类之间拉开差距 —— bridge 是这张图的核心信息，
 * member/contains 只是撑住结构的骨架，必须退到背景，否则 429 条结构边会淹没一切。
 */
function baseOpacityFor(relation: MapEdgeRelation): number {
  switch (relation) {
    case "bridge":
      return 0.75;
    case "rebuts":
      return 0.6;
    case "member":
      return 0.25;
    case "contains":
      return 0.2;
    default:
      return 0.3;
  }
}

/**
 * 缝合线的弧线形态：二次贝塞尔，控制点沿中垂线外推。
 * 弯向按两端 id 的字典序取符号 —— 同一条无向边永远往同一侧弯，
 * 否则布局抖动时线会在两侧来回跳。骨架层的 177 条缝合线全部走这里。
 */
function curveLinkPath(sx: number, sy: number, tx: number, ty: number, bowSign: number): string {
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.hypot(dx, dy) || 1;
  const bow = Math.min(dist * 0.16, 64) * bowSign;
  const mx = (sx + tx) / 2 - (dy / dist) * bow;
  const my = (sy + ty) / 2 + (dx / dist) * bow;
  return `M${sx},${sy}Q${mx},${my} ${tx},${ty}`;
}

/** 标签截断：与原型一致，单行截断（topic/cluster 20 字，论点按上下文 22/26 字）。 */
function trunc(text: string, maxLen: number): string {
  const s = text || "";
  return s.length > maxLen ? s.slice(0, maxLen) + "…" : s;
}

/* ────────── 组件 ────────── */

interface DragState {
  nodeId: string;
  offsetX: number;
  offsetY: number;
  moved: boolean;
}

interface RenderSnapshot {
  nodes: MapSimNode[];
  links: { id: string; relation: MapEdgeRelation; sourceId: string; targetId: string; aggregated?: number }[];
}

/** 由数据层构造 d3 工作副本的深度：cluster=0（骨架）、topic=1、claim=2。 */
const DEPTH_BY_KIND: Record<MapNodeKind, number> = { cluster: 0, topic: 1, claim: 2 };

/** 数据层节点索引（模块级常量）：骨架聚合议题间冲突时查 claim.topicId 用。 */
const nodeByIdStatic = new Map(CONTROVERSY_MAP.nodes.map((n) => [n.id, n]));

/* ────────── 凸包分组（让聚类自己显形） ────────── */

/**
 * 分组依据是 **bridge 边**（数据事实）：一个主张簇缝合了哪些议题。
 * 但包络的**形状**是当前布局的产物，会随力模拟变化 —— 两者必须在图例里分开讲，
 * 否则会被读成「这几个议题有共同归属」。这是凸包唯一的误读风险。
 */
export interface HullGroup {
  /** 主张簇 id：包络以簇命名，颜色也取簇的立场 */
  id: string;
  side: DebateSideLike;
  /** 该簇缝合的议题 id（不含簇自身，渲染时补上） */
  members: string[];
}

/** 绕每个节点采样的圆周点数：把「点集凸包」升级为「圆集凸包」（Minkowski 和的近似）。 */
const HULL_SAMPLES = 12;
/** 包络在节点半径之外再留的呼吸空间。 */
const HULL_PAD = 11;

/**
 * 39 个包络的分组表，模块级只算一次。
 * 106 议题里只有 75 个被 bridge 覆盖，所以另外 31 个议题不会落进任何包络 ——
 * 这不是缺陷，是真实信息：「尚未被归入任何跨议题主张」，图例须写明。
 */
export const HULL_GROUPS: HullGroup[] = (() => {
  const map = new Map<string, HullGroup>();
  for (const e of CONTROVERSY_MAP.edges) {
    if (e.relation !== "bridge") continue;
    const a = nodeByIdStatic.get(e.source);
    const b = nodeByIdStatic.get(e.target);
    const c = a?.kind === "cluster" ? a : b?.kind === "cluster" ? b : null;
    const t = a?.kind === "topic" ? a : b?.kind === "topic" ? b : null;
    if (!c || !t) continue;
    let g = map.get(c.id);
    if (!g) {
      g = { id: c.id, side: (c.side ?? "neutral") as DebateSideLike, members: [] };
      map.set(c.id, g);
    }
    if (!g.members.includes(t.id)) g.members.push(t.id);
  }
  return [...map.values()];
})();

const HULL_GROUP_BY_ID = new Map(HULL_GROUPS.map((g) => [g.id, g]));

/** 闭合 Catmull-Rom：曲线**经过**每个控制点，所以外扩后的包络不会切进节点。 */
const hullCurve = d3.line<[number, number]>().curve(d3.curveCatmullRomClosed.alpha(0.5));

/**
 * 把每个成员节点"撑"成一个半径 r+pad 的圆环再取凸包 —— 单点也能成圆，
 * 两点的簇会得到一枚胶囊，因此不需要为退化情形写特例。
 */
export function hullPathFor(ids: string[], byId: Map<string, MapSimNode>): string | null {
  const pts: [number, number][] = [];
  for (const id of ids) {
    const n = byId.get(id);
    if (!n) continue;
    const r = n.radius + HULL_PAD;
    for (let i = 0; i < HULL_SAMPLES; i++) {
      const a = (i / HULL_SAMPLES) * Math.PI * 2;
      pts.push([n.x + Math.cos(a) * r, n.y + Math.sin(a) * r]);
    }
  }
  if (pts.length < 3) return null;
  const hull = d3.polygonHull(pts);
  return hull && hull.length >= 3 ? hullCurve(hull) : null;
}

function hullFillFor(side: DebateSideLike): string {
  return side === "positive" ? "#0f6fe5" : side === "negative" ? "#d9574d" : "#64748b";
}

/* ────────── 聚焦视图（下钻） ────────── */

/**
 * 点节点进入的「聚焦视图」：只保留该节点 + 它的一跳邻居。
 * 同心环半径随邻居数增大 —— 邻居越多环越大，节点不会挤成一坨。
 */
function ringRadiusFor(neighborCount: number): number {
  return Math.min(470, Math.max(160, 100 + 30 * Math.sqrt(neighborCount)));
}

/** 聚焦时生效的力配置（供 mount 时创建的力通过 ref 读取最新值）。 */
interface FocusState {
  id: string;
  /** 邻居所在的同心环半径 */
  ring: number;
  neighborCount: number;
}

/**
 * 聚焦视图的相机变换：内容中心固定在模拟原点，取一个"整个同心环刚好装得下"的缩放。
 * 进入聚焦、重置视图共用同一套取景参数。
 */
function focusCameraTransform(ring: number, width: number, height: number): d3.ZoomTransform {
  const k = Math.min(
    MAX_ZOOM,
    Math.max(MIN_ZOOM, Math.min(width, height) / (2 * (ring + 90))),
  );
  return d3.zoomIdentity.translate((width / 2) * (1 - k), (height / 2) * (1 - k)).scale(k);
}

export function ControversyMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /**
   * 「显示全部标签」按钮 = 手动覆盖：开着时无视缩放档位直接全显；
   * 关着时走 labelTier 的自动密度（语义缩放：放大出细节、缩小去噪声）。
   */
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [labelTier, setLabelTier] = useState<LabelTier>("mid");
  /**
   * 显示层级开关：
   *   骨架视图（默认）—— 只画 簇 + 议题 + 缝合线，外加「议题间冲突」聚合线；
   *   全量视图 —— 展开全部论点，此时归属边（member/contains）默认隐藏、可单独打开。
   * 数据量到 106 题 / 244 论点后全量铺开会糊成一片，骨架先行是主要解法。
   */
  const [showClaims, setShowClaims] = useState(false);
  const [showStructEdges, setShowStructEdges] = useState(false);
  /**
   * 聚焦路径（root → … → 当前中心）：点节点下钻一层，只显示「该节点 + 一跳邻居」。
   * 数组即层级栈 —— 「返回上一级」弹一层，面包屑可跳级，空数组 = 全图。
   */
  const [focusPath, setFocusPath] = useState<string[]>([]);
  const focusId = focusPath.length > 0 ? focusPath[focusPath.length - 1] : null;
  /**
   * 焦点快照。d3 的力是挂载时创建一次的（闭包），只能通过 ref 读到最新焦点，
   * 否则切换聚焦后径向力还按旧值布局。
   */
  const focusRef = useRef<FocusState | null>(null);
  /** 相机动作意图：退出聚焦时把视图适配回全图（push 时不需要标记）。 */
  const cameraIntentRef = useRef<"exit" | "none">("none");
  const [size, setSize] = useState({ width: 1000, height: 660 });
  const [snapshot, setSnapshot] = useState<RenderSnapshot>({ nodes: [], links: [] });

  const nodesRef = useRef<MapSimNode[]>([]);
  /** id → 节点 的索引：逐帧写坐标时 O(1) 查找，替换掉原先 O(N²) 的 find */
  const nodesByIdRef = useRef<Map<string, MapSimNode>>(new Map());
  const linksRef = useRef<MapSimLink[]>([]);
  const simulationRef = useRef<d3.Simulation<MapSimNode, MapSimLink> | null>(null);
  const linkForceRef = useRef<d3.ForceLink<MapSimNode, MapSimLink> | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  /* ---------- 数据 → 工作副本 ---------- */

  /**
   * @param withClaims false = 骨架视图：只保留 簇 + 议题；
   *                   论点级 rebuts 聚合成「议题间冲突」线（claim.topicId 归并），不丢冲突信号。
   * @param focusedId  非空 = 聚焦视图：只保留该节点 + 一跳邻居（用完整边集，
   *                   所以骨架模式下聚焦也会把论点层带出来 —— 这是下钻的信息增量）。
   */
  const buildGraph = useCallback(
    (
      withClaims: boolean,
      focusedId: string | null,
    ): { nodes: MapSimNode[]; links: MapSimLink[]; focus: FocusState | null } => {
      const prev = new Map(nodesRef.current.map((n) => [n.id, n]));

      const toSimNode = (n: (typeof CONTROVERSY_MAP.nodes)[number]): MapSimNode => {
        const old = prev.get(n.id);
        return {
          id: n.id,
          kind: n.kind,
          label: n.label,
          fullLabel: n.fullLabel ?? n.label,
          side: (n.side ?? "neutral") as DebateSideLike,
          depth: DEPTH_BY_KIND[n.kind],
          radius: radiusFor(n.kind, n.weight ?? 0, n.topicCount ?? 0),
          topicCount: n.topicCount ?? 0,
          votes: n.votes ?? 0,
          x: old?.x ?? 0,
          y: old?.y ?? 0,
          vx: 0,
          vy: 0,
          fx: null,
          fy: null,
        };
      };

      const makeLink = (
        id: string,
        e: (typeof CONTROVERSY_MAP.edges)[number],
        byId: Map<string, MapSimNode>,
      ): MapSimLink | null => {
        const s = byId.get(e.source);
        const t = byId.get(e.target);
        if (!s || !t) return null;
        return {
          id,
          source: e.source,
          target: e.target,
          relation: e.relation,
          sourceDepth: s.depth,
          targetDepth: t.depth,
        };
      };

      /* ── 聚焦视图：该节点 + 一跳邻居（诱导子图） ── */
      if (focusedId) {
        const inView = new Set<string>([focusedId]);
        for (const e of CONTROVERSY_MAP.edges) {
          if (e.source === focusedId) inView.add(e.target);
          if (e.target === focusedId) inView.add(e.source);
        }
        const nodes = CONTROVERSY_MAP.nodes.filter((n) => inView.has(n.id)).map(toSimNode);
        const byId = new Map(nodes.map((n) => [n.id, n]));
        const links: MapSimLink[] = [];
        for (const [i, e] of CONTROVERSY_MAP.edges.entries()) {
          if (!inView.has(e.source) || !inView.has(e.target)) continue;
          const link = makeLink(`fl${i}-${e.relation}`, e, byId);
          if (link) links.push(link);
        }
        return {
          nodes,
          links,
          focus: { id: focusedId, ring: ringRadiusFor(nodes.length - 1), neighborCount: nodes.length - 1 },
        };
      }

      /* ── 全图：骨架（默认）或全量 ── */
      const nodes: MapSimNode[] = CONTROVERSY_MAP.nodes
        .filter((n) => withClaims || n.kind !== "claim")
        .map(toSimNode);

      const byId = new Map(nodes.map((n) => [n.id, n]));
      const links: MapSimLink[] = [];
      // 骨架视图下的议题间冲突聚合：key = "topicA|topicB"（小 id 在前，保证无向唯一）
      const topicConflicts = new Map<string, { a: string; b: string; count: number }>();

      for (const [i, e] of CONTROVERSY_MAP.edges.entries()) {
        if (!withClaims && e.relation === "rebuts") {
          // 论点级冲突 → 归并到议题级（同议题内部的冲突不画线）
          const idA = nodeByIdStatic.get(e.source)?.topicId;
          const idB = nodeByIdStatic.get(e.target)?.topicId;
          if (idA && idB && idA !== idB) {
            const [lo, hi] = idA < idB ? [idA, idB] : [idB, idA];
            const key = `${lo}|${hi}`;
            const cur = topicConflicts.get(key);
            if (cur) cur.count += 1;
            else topicConflicts.set(key, { a: lo, b: hi, count: 1 });
          }
          continue;
        }
        const link = makeLink(`l${i}-${e.relation}`, e, byId);
        if (link) links.push(link);
      }

      for (const [key, { a, b, count }] of topicConflicts) {
        const s = byId.get(a);
        const t = byId.get(b);
        if (!s || !t) continue;
        links.push({
          id: `tc-${key}`,
          source: a,
          target: b,
          relation: "rebuts",
          sourceDepth: s.depth,
          targetDepth: t.depth,
          aggregated: count,
        });
      }
      return { nodes, links, focus: null };
    },
    [],
  );

  /* ---------- simulation：只创建一次 ---------- */

  useEffect(() => {
    const linkForce = d3
      .forceLink<MapSimNode, MapSimLink>([])
      .id((n) => n.id)
      .distance((l) => linkDistanceFor(l.relation))
      .strength((l) => linkStrengthFor(l.relation));
    linkForceRef.current = linkForce;

    const simulation = d3
      .forceSimulation<MapSimNode, MapSimLink>([])
      .force("link", linkForce)
      .force("charge", d3.forceManyBody<MapSimNode>().strength((n) => chargeFor(n.kind)))
      .force("center", d3.forceCenter(0, 0))
      .force(
        "collide",
        d3.forceCollide<MapSimNode>()
          .radius((n) => n.radius + (n.kind === "cluster" ? 34 : n.kind === "topic" ? 22 : 13))
          .strength(0.95),
      )
      // 扇形分翼（v2）：正/负/中性各占一个扇区，目标点查 POLARITY_TARGETS。
      // X、Y 同时轻拉（0.08），只定方向不锁死坐标，节点在扇区内自然铺开——
      // 旧 forceX(±420) 只约束 X，会把每个立场拉成一根竖条。
      // 聚焦视图下让位给径向环力（分翼会把邻居压扁）。
      .force(
        "polarityX",
        d3
          .forceX<MapSimNode>((n) => POLARITY_TARGETS.get(n.id)?.tx ?? 0)
          .strength(() => (focusRef.current ? 0 : 0.08)),
      )
      .force(
        "polarityY",
        d3
          .forceY<MapSimNode>((n) => POLARITY_TARGETS.get(n.id)?.ty ?? 0)
          .strength(() => (focusRef.current ? 0 : 0.08)),
      )
      // 聚焦视图：中心节点拉回原点、邻居落在同心环上（非聚焦时强度 0，不影响原布局）
      .force(
        "focusRing",
        d3
          .forceRadial<MapSimNode>((n) => {
            const f = focusRef.current;
            if (!f) return 0;
            return n.id === f.id ? 0 : f.ring;
          }, 0, 0)
          .strength((n) => {
            const f = focusRef.current;
            if (!f) return 0;
            return n.id === f.id ? 1 : 0.62;
          }),
      )
      .alphaDecay(0.022)
      .on("tick", () => syncDomPositions());

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
  }, []);

  /* ---------- 结构变化：重建副本 ---------- */

  useEffect(() => {
    const simulation = simulationRef.current;
    if (!simulation) return;
    const { nodes, links, focus } = buildGraph(showClaims, focusId);
    focusRef.current = focus;
    nodesRef.current = nodes;
    nodesByIdRef.current = new Map(nodes.map((n) => [n.id, n]));
    linksRef.current = links;

    // 关键：必须在 forceLink.links() 之前快照 id，
    // 否则 d3 会把 source/target 改写成节点对象，之后就取不到 id 了。
    const linkSnapshot = links.map((l) => ({
      id: l.id,
      relation: l.relation,
      sourceId: l.source as string,
      targetId: l.target as string,
      aggregated: l.aggregated,
    }));

    simulation.nodes(nodes);
    linkForceRef.current?.links(links);

    // 初次布局用黄金角撒点，避免全部叠在原点；
    // 聚焦视图下新出现的邻居直接撒到同心环上 —— 入场就是"从中心向外张开"的动画。
    const ringNeighbors = focus ? nodes.filter((n) => n.id !== focus.id) : [];
    const ringIndex = new Map(ringNeighbors.map((n, i) => [n.id, i]));
    for (const [i, n] of nodes.entries()) {
      if (n.x !== 0 || n.y !== 0) continue;
      if (focus && n.id !== focus.id) {
        const angle = ((ringIndex.get(n.id) ?? 0) / Math.max(ringNeighbors.length, 1)) * Math.PI * 2;
        n.x = Math.cos(angle) * focus.ring;
        n.y = Math.sin(angle) * focus.ring;
      } else {
        const angle = i * 2.39996;
        const r = 120 + Math.sqrt(i) * 46;
        n.x = Math.cos(angle) * r;
        n.y = Math.sin(angle) * r;
      }
    }

    setSnapshot({ nodes, links: linkSnapshot });
    simulation.alpha(0.95).restart();
  }, [buildGraph, focusId, showClaims]);

  /* ---------- 逐帧坐标写入 ---------- */

  const syncDomPositions = useCallback((): void => {
    const svg = svgRef.current;
    if (!svg) return;
    const byId = nodesByIdRef.current;
    const nodeEls = svg.querySelectorAll<SVGGElement>("[data-node-id]");
    for (const el of nodeEls) {
      const id = el.getAttribute("data-node-id");
      const n = id ? byId.get(id) : undefined;
      if (!n) continue;
      el.setAttribute("transform", `translate(${n.x},${n.y})`);
    }
    // 连线混着两种形态：缝合线是 path（二次贝塞尔），其余仍是 line。
    // 这是每帧热路径 —— 只按 localName 分流一次，不做任何查询缓存失效处理。
    const linkEls = svg.querySelectorAll<SVGElement>("[data-link-id]");
    for (const el of linkEls) {
      const s = el.getAttribute("data-src");
      const t = el.getAttribute("data-tgt");
      const sn = s ? byId.get(s) : undefined;
      const tn = t ? byId.get(t) : undefined;
      if (!sn || !tn) continue;
      if (el.localName === "path") {
        const sign = Number(el.getAttribute("data-bow") ?? "1");
        el.setAttribute("d", curveLinkPath(sn.x, sn.y, tn.x, tn.y, sign));
      } else {
        el.setAttribute("x1", String(sn.x));
        el.setAttribute("y1", String(sn.y));
        el.setAttribute("x2", String(tn.x));
        el.setAttribute("y2", String(tn.y));
      }
    }
    // 凸包分组：每帧按当前坐标重算包络。
    // 39 组 × 平均 44 个采样点，量级远低于连线写入，暂时不分帧节流；
    // 若日后簇数上到数百，这里按 alpha 高低隔帧更新即可。
    const hullEls = svg.querySelectorAll<SVGPathElement>("[data-hull-id]");
    for (const el of hullEls) {
      const gid = el.getAttribute("data-hull-id");
      const group = gid ? HULL_GROUP_BY_ID.get(gid) : undefined;
      if (!group) continue;
      const d = hullPathFor([group.id, ...group.members], byId);
      if (d) el.setAttribute("d", d);
    }
    // 标签跟随节点（挂在节点组内，无需单独处理）
  }, []);

  useEffect(() => {
    syncDomPositions();
  }, [snapshot, syncDomPositions]);

  /* ---------- 容器尺寸 ---------- */

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = (): void => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(320, Math.round(rect.width));
      const h = Math.max(360, Math.round(rect.height));
      setSize({ width: w, height: h });
      const sim = simulationRef.current;
      if (sim) {
        const center = sim.force("center") as d3.ForceCenter<MapSimNode> | undefined;
        center?.x(0).y(0);
        sim.alpha(Math.max(sim.alpha(), 0.15)).restart();
      }
    };
    update();
    // ResizeObserver 在 jsdom / 老环境里可能不存在，降级到 window.resize
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* ---------- 缩放平移 ---------- */

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .filter((event: Event) => {
        // 起点在节点上的事件交给拖拽逻辑，不做平移
        const target = event.target as Element | null;
        if (target?.closest?.("[data-node-id]")) return false;
        if (event instanceof MouseEvent && event.button !== 0) return false;
        return true;
      })
      .on("zoom", (event) => {
        const layer = svg.querySelector<SVGGElement>("[data-zoom-layer]");
        layer?.setAttribute("transform", event.transform.toString());
        // 标签密度档位只在跨档时真正 setState（同值返回时 React 直接 bail out）
        setLabelTier((prev) => {
          const next = labelTierFromK(event.transform.k);
          return prev === next ? prev : next;
        });
      });
    zoomBehaviorRef.current = zoom;
    d3.select(svg).call(zoom).on("dblclick.zoom", null);
    return () => {
      d3.select(svg).on(".zoom", null);
      zoomBehaviorRef.current = null;
    };
  }, []);

  /* ---------- 聚焦（下钻）操作 ---------- */

  /** 下钻一层：只显示该节点 + 一跳邻居。重复点同一节点不会叠层（双击因此是幂等的）。 */
  const focusOn = useCallback((id: string): void => {
    setSelectedId(id);
    setFocusPath((prev) => (prev[prev.length - 1] === id ? prev : [...prev, id]));
  }, []);

  /** 返回上一级：弹一层；退到顶层时相机动画适配回全图。 */
  const goBack = useCallback((): void => {
    if (focusPath.length === 0) return;
    const next = focusPath.slice(0, -1);
    cameraIntentRef.current = next.length === 0 ? "exit" : "none";
    setFocusPath(next);
    setSelectedId(next[next.length - 1] ?? null);
  }, [focusPath]);

  /** 面包屑跳级：depth = -1 表示回到全图，否则聚焦到该层。 */
  const goToLevel = useCallback(
    (depth: number): void => {
      const next = depth < 0 ? [] : focusPath.slice(0, depth + 1);
      if (next.length === focusPath.length) return;
      cameraIntentRef.current = next.length === 0 ? "exit" : "none";
      setFocusPath(next);
      setSelectedId(next[next.length - 1] ?? null);
    },
    [focusPath],
  );

  /* ---------- 拖拽 ---------- */

  const pointerToSimSpace = useCallback(
    (event: PointerEvent | MouseEvent): { x: number; y: number } | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const current = d3.zoomTransform(svg);
      const rect = svg.getBoundingClientRect();
      const vx = event.clientX - rect.left;
      const vy = event.clientY - rect.top;
      return {
        x: (vx - current.x) / current.k - size.width / 2,
        y: (vy - current.y) / current.k - size.height / 2,
      };
    },
    [size.height, size.width],
  );

  const handleNodePointerDown = useCallback(
    (event: React.PointerEvent<SVGGElement>, nodeId: string): void => {
      event.stopPropagation();
      const simulation = simulationRef.current;
      const node = nodesByIdRef.current.get(nodeId);
      const pointer = pointerToSimSpace(event.nativeEvent);
      if (!node || !pointer) return;
      dragStateRef.current = {
        nodeId,
        offsetX: node.x - pointer.x,
        offsetY: node.y - pointer.y,
        moved: false,
      };
      node.fx = node.x;
      node.fy = node.y;
      simulation?.alphaTarget(DRAG_ALPHA_TARGET).restart();
      (event.target as Element).setPointerCapture?.(event.pointerId);
    },
    [pointerToSimSpace],
  );

  useEffect(() => {
    const onMove = (event: PointerEvent): void => {
      const drag = dragStateRef.current;
      if (!drag) return;
      const node = nodesByIdRef.current.get(drag.nodeId);
      const pointer = pointerToSimSpace(event);
      if (!node || !pointer) return;
      drag.moved = true;
      node.fx = pointer.x + drag.offsetX;
      node.fy = pointer.y + drag.offsetY;
      node.x = node.fx;
      node.y = node.fy ?? node.y;
      syncDomPositions();
    };
    const onUp = (): void => {
      const drag = dragStateRef.current;
      if (!drag) return;
      // 与原型一致：松手后保持钉住（拖到哪固定到哪），双击才解除固定。
      // 无位移 = 点击：选中并下钻进「聚焦视图」（点同一节点不叠层，故双击是幂等的）。
      if (!drag.moved) focusOn(drag.nodeId);
      dragStateRef.current = null;
      simulationRef.current?.alphaTarget(0);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [focusOn, pointerToSimSpace, syncDomPositions]);

  /* ---------- 邻接计算（高亮用，按当前视图的可见边） ---------- */

  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const e of snapshot.links) {
      if (!map.has(e.sourceId)) map.set(e.sourceId, new Set());
      if (!map.has(e.targetId)) map.set(e.targetId, new Set());
      map.get(e.sourceId)!.add(e.targetId);
      map.get(e.targetId)!.add(e.sourceId);
    }
    return map;
  }, [snapshot]);

  const activeId = hoveredId ?? selectedId;
  const highlighted = useMemo(() => {
    if (!activeId) return null;
    const set = new Set<string>([activeId]);
    for (const n of adjacency.get(activeId) ?? []) set.add(n);
    return set;
  }, [activeId, adjacency]);

  const isDim = (id: string): boolean => highlighted !== null && !highlighted.has(id);

  /**
   * 悬停/选中时给包络分档：含高亮成员的包络浮起（is-context），其余退到背景（is-muted）。
   * 不做这层分档的话，39 块底色会在读数时糊成一片，反而比不加更乱。
   */
  const hullClassOf = (groupId: string): string => {
    if (highlighted === null) return "cm-hull";
    const group = HULL_GROUP_BY_ID.get(groupId);
    if (!group) return "cm-hull";
    const hit = highlighted.has(group.id) || group.members.some((m) => highlighted.has(m));
    return hit ? "cm-hull is-context" : "cm-hull is-muted";
  };

  /**
   * 连线的当前透明度：常态按关系类型分层（baseOpacityFor）；
   * 悬停/选中时只保留"两端都在邻域内"的连线，其余压到 0.07。
   */
  const linkOpacity = (relation: MapEdgeRelation, srcId: string, tgtId: string): number => {
    if (highlighted === null) return baseOpacityFor(relation);
    return highlighted.has(srcId) && highlighted.has(tgtId) ? 1 : 0.07;
  };

  /* ---------- 缩放按钮 ---------- */

  const zoomBy = useCallback((factor: number): void => {
    const svg = svgRef.current;
    const behavior = zoomBehaviorRef.current;
    if (!svg || !behavior) return;
    d3.select(svg).transition().duration(180).call(behavior.scaleBy, factor);
  }, []);

  const resetView = useCallback((): void => {
    const svg = svgRef.current;
    const behavior = zoomBehaviorRef.current;
    if (!svg || !behavior) return;
    const focus = focusRef.current;
    if (focus) {
      // 聚焦态下"重置"= 重新框住当前邻域（弹回全图坐标会让人瞬间迷路）
      d3.select(svg)
        .transition()
        .duration(320)
        .call(behavior.transform, focusCameraTransform(focus.ring, size.width, size.height));
      simulationRef.current?.alpha(0.5).restart();
      return;
    }
    d3.select(svg).transition().duration(240).call(behavior.transform, d3.zoomIdentity);
    simulationRef.current?.alpha(0.6).restart();
  }, [size.height, size.width]);

  /** 缩放平移到「全部节点可见」：数据量大后手动找节点太累，一键适配。 */
  const fitView = useCallback((): void => {
    const svg = svgRef.current;
    const behavior = zoomBehaviorRef.current;
    if (!svg || !behavior) return;
    const nodes = nodesRef.current;
    if (nodes.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    }
    const pad = 60;
    const bw = Math.max(maxX - minX + pad * 2, 1);
    const bh = Math.max(maxY - minY + pad * 2, 1);
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(size.width / bw, size.height / bh)));
    // 渲染公式：screen = t.x + k*(w/2 + p)，反解内容中心落回画布中心
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const t = d3.zoomIdentity
      .translate(size.width / 2 - k * (size.width / 2 + cx), size.height / 2 - k * (size.height / 2 + cy))
      .scale(k);
    d3.select(svg).transition().duration(320).call(behavior.transform, t);
  }, [size.height, size.width]);

  /* ---------- 视图切换的相机动画 ---------- */

  /**
   * 聚焦时把相机拉近到同心环（"进入"动作），退出聚焦时适配回全图（"返回"动作）。
   * 与力的重启、新节点的入场动画共同构成一次完整的过渡。
   */
  useEffect(() => {
    const svg = svgRef.current;
    const behavior = zoomBehaviorRef.current;
    if (!svg || !behavior) return;
    const intent = cameraIntentRef.current;
    cameraIntentRef.current = "none";

    const focus = focusRef.current;
    if (focusId && focus) {
      d3.select(svg)
        .transition()
        .duration(520)
        .ease(d3.easeCubicOut)
        .call(behavior.transform, focusCameraTransform(focus.ring, size.width, size.height));
      return;
    }
    if (focusId) return; // 焦点布局还没建好，等下一次 effect
    if (intent === "exit") fitView();
  }, [fitView, focusId, size.height, size.width]);

  /* ---------- 渲染 ---------- */

  const resolvedLinks: MapResolvedLink[] = useMemo(() => {
    const byId = new Map(snapshot.nodes.map((n) => [n.id, n]));
    const out: MapResolvedLink[] = [];
    for (const l of snapshot.links) {
      const s = byId.get(l.sourceId);
      const t = byId.get(l.targetId);
      if (s && t) out.push({ id: l.id, relation: l.relation, source: s, target: t, aggregated: l.aggregated });
    }
    return out;
  }, [snapshot]);

  // 连线在下、节点在上：分两组渲染，保证层级正确。
  // member/contains 是纯结构边，数量最大（429 条）——全量模式下默认藏起来、按需打开；
  // 但聚焦视图里它们正是"为什么这些节点算相连"的依据，必须画。
  const structVisible = focusId !== null || (showClaims && showStructEdges);
  const linkLayer = resolvedLinks.filter(
    (l) => (l.relation === "member" || l.relation === "contains") && structVisible,
  );
  const emphasisLayer = resolvedLinks.filter((l) => l.relation === "bridge" || l.relation === "rebuts");

  const stats = CONTROVERSY_MAP.stats;
  const nodeById = useMemo(() => new Map(CONTROVERSY_MAP.nodes.map((n) => [n.id, n])), []);
  const activeNode = activeId ? nodeById.get(activeId) ?? null : null;

  /** 详情浮层：论点 / 议题 / 主张簇三种形态（与原型 #panel 一致，数据缺 author 时显示 —）。 */
  const panel = useMemo(() => {
    if (!activeNode) return null;
    const full = (n: (typeof CONTROVERSY_MAP.nodes)[number]): string => n.fullLabel ?? n.label;
    if (activeNode.kind === "claim") {
      const topic = activeNode.topicId ? nodeById.get(activeNode.topicId) : undefined;
      return (
        <>
          <h2>{full(activeNode)}</h2>
          <div className="cm-chips">
            <span className={`cm-chip ${activeNode.side === "positive" ? "pos" : activeNode.side === "negative" ? "neg" : ""}`}>
              v1 立场：{activeNode.side}
            </span>
            <span className="cm-chip">理由类型：{activeNode.reasonType ?? "—"}</span>
          </div>
          <div className="cm-meta">
            作者：— · 赞 {activeNode.votes ?? 0}
            <br />
            所属议题：{topic ? trunc(full(topic), 60) : "—"}
          </div>
          {activeNode.url ? (
            <p style={{ marginTop: 8 }}>
              <a href={activeNode.url} target="_blank" rel="noreferrer">查看知乎原文 ↗</a>
            </p>
          ) : null}
        </>
      );
    }
    if (activeNode.kind === "topic") {
      const claims = CONTROVERSY_MAP.nodes.filter((n) => n.kind === "claim" && n.topicId === activeNode.id);
      return (
        <>
          <h2>{full(activeNode)}</h2>
          <div className="cm-meta">论点数：{claims.length}（点击可下钻到该论点的聚焦视图）</div>
          <ul>
            {claims.map((c) => (
              <li key={c.id} onClick={() => focusOn(c.id)}>{trunc(full(c), 44)}</li>
            ))}
          </ul>
        </>
      );
    }
    const touched = new Set(
      CONTROVERSY_MAP.edges.filter((e) => e.relation === "bridge" && e.source === activeNode.id).map((e) => e.target),
    );
    const members = CONTROVERSY_MAP.nodes.filter(
      (c) => c.kind === "claim" && CONTROVERSY_MAP.edges.some((e) => e.relation === "member" && e.source === c.id && e.target === activeNode.id),
    );
    return (
      <>
        <h2>主张簇：{activeNode.label}</h2>
        <div className="cm-chips"><span className="cm-chip">{activeNode.summary ?? ""}</span></div>
        <div className="cm-meta">缝合 {touched.size} 个议题 · 成员边 {activeNode.weight ?? 0}</div>
        <ul>
          {members.map((c) => (
            <li key={c.id} onClick={() => focusOn(c.id)}>{trunc(full(c), 44)}</li>
          ))}
        </ul>
      </>
    );
  }, [activeNode, focusOn, nodeById]);

  return (
    <div className={`controversy-map${focusId ? " is-focused" : ""}`} ref={containerRef}>
      <div className="controversy-map-toolbar">
        <div className="controversy-map-hint">
          <strong>跨议题争议地图 · 真实数据</strong>
          <span>
            {stats.topics} 题 / {stats.claims} 论点 / {stats.clusters} 主张簇 / {stats.edges} 边 ·{" "}
            <em className="cm-em-bridge">{stats.bridge} 条跨议题缝合线</em> ·{" "}
            <em className="cm-em-rebuts">{stats.rebuts} 处跨议题冲突</em>
          </span>
        </div>
        <div className="controversy-map-actions">
          <button
            type="button"
            onClick={() => {
              goToLevel(-1); // 聚焦态下切换视图语义不明确，先退回全图
              setShowClaims((v) => !v);
            }}
          >
            {showClaims ? "返回骨架视图" : "展开全部论点"}
          </button>
          {showClaims && !focusId ? (
            <button
              type="button"
              onClick={() => setShowStructEdges((v) => !v)}
              title="member / contains 归属边数量最大（429 条），默认隐藏"
            >
              {showStructEdges ? "隐藏归属边" : "显示归属边"}
            </button>
          ) : null}
          <button type="button" onClick={() => setShowAllLabels((v) => !v)}>
            {showAllLabels ? "仅显示骨架标签" : "显示全部标签"}
          </button>
          <button type="button" onClick={fitView} title="缩放平移到全部节点可见">
            适配合
          </button>
          <button type="button" onClick={() => zoomBy(1 / ZOOM_STEP)} aria-label="缩小">
            −
          </button>
          <button type="button" onClick={() => zoomBy(ZOOM_STEP)} aria-label="放大">
            +
          </button>
          <button type="button" onClick={resetView}>
            重置视图
          </button>
        </div>
      </div>

      {focusId ? (
        <div className="cm-focus-bar" role="navigation" aria-label="聚焦层级">
          <button type="button" className="cm-focus-back" onClick={goBack}>
            ← 返回上一级
          </button>
          <span className="cm-crumb" onClick={() => goToLevel(-1)}>
            全图
          </span>
          {focusPath.map((id, i) => {
            const n = nodeById.get(id);
            const last = i === focusPath.length - 1;
            return (
              <Fragment key={`${id}-${i}`}>
                <i className="cm-crumb-sep">›</i>
                <span
                  className={`cm-crumb${last ? " is-current" : ""}`}
                  onClick={() => goToLevel(i)}
                  title={n?.fullLabel ?? n?.label ?? id}
                >
                  {trunc(n?.label ?? id, 16)}
                </span>
              </Fragment>
            );
          })}
          <span className="cm-focus-count">
            {snapshot.nodes.length - 1} 个相连节点 · 点节点继续下钻
          </span>
        </div>
      ) : (
        <div className="cm-caption">
          默认骨架视图（簇 + 议题 + 缝合线 + 议题间冲突聚合线）；点任一节点可下钻到「该节点 + 相连节点」的
          聚焦视图，再从顶部返回。悬停查看详情；拖动节点可固定，双击取消固定。
        </div>
      )}

      <div className="controversy-map-legend">
        <div>
          <span className="cm-lg"><i className="dot" style={{ background: "#0f6fe5" }} />正方主张簇</span>
          <span className="cm-lg"><i className="dot" style={{ background: "#d9574d" }} />反方主张簇</span>
          <span className="cm-lg"><i className="dot" style={{ background: "#64748b" }} />中性簇</span>
        </div>
        <div>
          <span className="cm-lg"><i className="dot" style={{ background: "#111827" }} />议题</span>
          <span className="cm-lg"><i className="dot" style={{ background: "#7fb0f2" }} />正方论点</span>
          <span className="cm-lg"><i className="dot" style={{ background: "#eda49c" }} />反方论点</span>
          <span className="cm-lg"><i className="dot" style={{ background: "#a8b6c8" }} />中性</span>
        </div>
        <div>
          <span className="cm-lg"><i className="ln g" />缝合线（跨议题共享主张）</span>
          <span className="cm-lg"><i className="ln r" />rebuts 跨议题矛盾</span>
        </div>
        <div>
          <span className="cm-lg" style={{ fontSize: 11, color: "#64748b" }}>
            骨架视图下的红线 = 议题间冲突（由论点级 rebuts 聚合）
          </span>
        </div>
        <div>
          <span className="cm-lg" style={{ fontSize: 11, color: "#64748b" }}>
            <i className="ring" />聚焦视图的圆心标记（该节点的全部相连节点会围成一环）
          </span>
        </div>
        <div>
          <span className="cm-lg" style={{ fontSize: 11, color: "#64748b" }}>
            <i className="hull" />底色包络 = 该主张缝合的议题（成员来自 bridge 边，形状随布局变化）
          </span>
        </div>
      </div>

      <svg
        ref={svgRef}
        className="controversy-map-svg"
        width={size.width}
        height={size.height}
        onClick={(e) => {
          if (e.target === e.currentTarget || (e.target as Element).hasAttribute("data-backdrop")) {
            setSelectedId(null);
          }
        }}
      >
        <rect data-backdrop="1" width={size.width} height={size.height} fill="transparent" />
        <g data-zoom-layer>
          <g transform={`translate(${size.width / 2},${size.height / 2})`}>
            {/*
              凸包分组层：置于所有连线之下（整张图的最底层）。
              它的职责只是「让聚类显形」—— 39 个同位同色的簇原本没有团块感，
              加一层低透明度包络后，「这几个议题是一伙的」才成为一眼可见的事实。
              聚焦视图下不画：那时成员多半不全，包络会失真，局部也不需要分组背景。
            */}
            {focusId === null && (
              <g className="cm-hulls">
                {HULL_GROUPS.map((g) => (
                  <path
                    key={g.id}
                    data-hull-id={g.id}
                    className={hullClassOf(g.id)}
                    fill={hullFillFor(g.side)}
                    stroke={hullFillFor(g.side)}
                  />
                ))}
              </g>
            )}

            {/* 普通关系边 */}
            <g className="cm-links">
              {linkLayer.map((l) => (
                <line
                  key={l.id}
                  data-link-id={l.id}
                  data-src={l.source.id}
                  data-tgt={l.target.id}
                  data-relation={l.relation}
                  stroke={strokeForLink(l.relation)}
                  strokeWidth={widthForLink(l.relation)}
                  strokeDasharray={dashForLink(l.relation)}
                  opacity={linkOpacity(l.relation, l.source.id, l.target.id)}
                />
              ))}
            </g>

            {/*
              强调边：冲突与缝合线，置于普通边上、节点下。
              缝合线（bridge）走弧线 —— 直线在簇与簇之间反复对穿，
              视觉上和 member/contains 的直线没有区分度；弧线让"跨议题"一眼可辨。
              弯向由 data-bow 固定，避免同一条边在布局抖动时左右翻。
              rebuts 仍用直线 + title 提示。
            */}
            <g className="cm-links-emphasis">
              {emphasisLayer.map((l) => {
                const s = nodeById.get(l.source.id);
                const t = nodeById.get(l.target.id);
                if (l.relation === "bridge") {
                  return (
                    <path
                      key={l.id}
                      data-link-id={l.id}
                      data-src={l.source.id}
                      data-tgt={l.target.id}
                      data-relation={l.relation}
                      data-bow={l.source.id < l.target.id ? "1" : "-1"}
                      fill="none"
                      stroke={strokeForLink(l.relation)}
                      strokeWidth={widthForLink(l.relation)}
                      strokeDasharray={dashForLink(l.relation)}
                      opacity={linkOpacity(l.relation, l.source.id, l.target.id)}
                    />
                  );
                }
                return (
                  <line
                    key={l.id}
                    data-link-id={l.id}
                    data-src={l.source.id}
                    data-tgt={l.target.id}
                    data-relation={l.relation}
                    stroke={strokeForLink(l.relation)}
                    strokeWidth={l.aggregated ? 1.2 : widthForLink(l.relation)}
                    strokeDasharray={dashForLink(l.relation)}
                    opacity={linkOpacity(l.relation, l.source.id, l.target.id)}
                  >
                    {l.relation === "rebuts" ? (
                      <title>
                        {l.aggregated
                          ? `议题间冲突：${s ? s.fullLabel ?? s.label : ""}\n↔\n${t ? t.fullLabel ?? t.label : ""}\n（骨架视图：聚合自 ${l.aggregated} 条论点级 rebuts，展开论点后可见原始冲突线）`
                          : `rebuts：跨议题矛盾\n${s ? s.fullLabel ?? s.label : ""}\n↔\n${t ? t.fullLabel ?? t.label : ""}`}
                      </title>
                    ) : null}
                  </line>
                );
              })}
            </g>

            {/* 节点 */}
            <g className="cm-nodes">
              {snapshot.nodes.map((n) => {
                const dim = isDim(n.id);
                const isActive = activeId === n.id;
                /** 聚焦视图的圆心节点：常驻脉冲环标记"当前中心" */
                const isCenter = n.id === focusId;
                /*
                 * 标签密度（语义缩放）：
                 *   near（k≥1.2）→ 论点标签全显；mid → 簇 + 议题；far（k<0.6）→ 只留簇。
                 * 聚焦视图强制按 mid 处理 —— 那时相机 k 取决于环半径，不反映真实放大需求，
                 * 且聚焦邻域本就靠 focusId 显示标签。
                 * 「显示全部标签」按钮是手动覆盖，开着时无视档位。
                 */
                const tier: LabelTier = focusId ? "mid" : labelTier;
                const showAll = showAllLabels || tier === "near";
                const text =
                  n.kind === "claim"
                    ? isActive
                      ? trunc(n.fullLabel ?? n.label, 26)
                      : highlighted?.has(n.id) || showAll || focusId
                        ? trunc(n.fullLabel ?? n.label, 22)
                        : ""
                    : n.kind === "topic" && tier === "far" && !focusId
                      ? ""
                      : trunc(n.label, 20);
                const showLabel = text !== "";
                return (
                  <g
                    key={n.id}
                    data-node-id={n.id}
                    data-node-kind={n.kind}
                    data-focus-center={isCenter ? "1" : undefined}
                    transform={`translate(${n.x},${n.y})`}
                    className={`cm-node${isCenter ? " is-center" : ""}`}
                    opacity={dim ? 0.14 : 1}
                    onPointerDown={(e) => handleNodePointerDown(e, n.id)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      const sim = simulationRef.current;
                      const target = nodesByIdRef.current.get(n.id);
                      if (target) {
                        target.fx = null;
                        target.fy = null;
                      }
                      sim?.alpha(0.3).restart();
                    }}
                    onMouseEnter={() => setHoveredId(n.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      cursor: "grab",
                      transition: "opacity 140ms ease",
                    }}
                  >
                    {/* 入场动画包一层：位置的 transform 在外层命令行内联，动画的 scale/opacity 在内层，互不打架 */}
                    <g className="cm-node-body">
                      <circle
                        r={n.radius}
                        fill={fillForNode(n)}
                        stroke={strokeForNode(n)}
                        strokeWidth={n.kind === "cluster" ? 2 : n.kind === "topic" ? 1.6 : 0}
                      />
                      {/* 中心/选中环：中心环是结构标记（常驻脉冲），选中环是交互态，两者不同时出现 */}
                      {isCenter ? (
                        <circle
                          data-center-ring="1"
                          className="cm-focus-ring"
                          r={n.radius + 9}
                          fill="none"
                          stroke="#e8a33d"
                          strokeWidth="1.8"
                          strokeDasharray="4 4"
                        />
                      ) : isActive ? (
                        <circle
                          data-selection-ring="1"
                          r={n.radius + 6}
                          fill="none"
                          stroke={n.kind === "cluster" ? "#e8a33d" : "#0f6fe5"}
                          strokeWidth="1.6"
                        />
                      ) : null}
                      {showLabel && (
                        <text
                          className="cm-node-label"
                          textAnchor="middle"
                          y={n.radius + 13}
                          fill={n.kind === "cluster" ? "#7a4b00" : "#334155"}
                          fontSize={n.kind === "cluster" ? 11.5 : n.kind === "topic" ? 10.5 : 10}
                          fontWeight={n.kind === "cluster" ? 600 : 400}
                        >
                          {text}
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}
            </g>
          </g>
        </g>
      </svg>

      {activeNode ? (
        <aside className="cm-panel" aria-label="节点详情">
          {panel}
        </aside>
      ) : null}
    </div>
  );
}
