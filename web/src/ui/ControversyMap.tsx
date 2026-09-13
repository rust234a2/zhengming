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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const DRAG_ALPHA_TARGET = 0.5;
const DRAG_ALPHA_MIN = 0.45;
const DRAG_NEIGHBOR_PULL = 0.35;

/** 半径：cluster 是骨架要显眼，topic 次之，claim 最小。 */
function radiusFor(kind: MapNodeKind, weight: number, topicCount: number): number {
  if (kind === "cluster") return 16 + Math.min(topicCount, 6) * 2.6;
  if (kind === "topic") return 11 + Math.min(weight, 5) * 1.1;
  return 6.5;
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

/** 标签换行：中文按字符数切，最多两行。 */
function wrapLabel(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const lines: string[] = [];
  for (let i = 0; i < text.length && lines.length < 2; i += maxLen) {
    lines.push(text.slice(i, i + maxLen));
  }
  if (lines.length === 2 && text.length > maxLen * 2) {
    lines[1] = lines[1].slice(0, maxLen - 1) + "…";
  }
  return lines;
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
  links: { id: string; relation: MapEdgeRelation; sourceId: string; targetId: string }[];
}

/** 由数据层构造 d3 工作副本的深度：cluster=0（骨架）、topic=1、claim=2。 */
const DEPTH_BY_KIND: Record<MapNodeKind, number> = { cluster: 0, topic: 1, claim: 2 };

export function ControversyMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [size, setSize] = useState({ width: 1000, height: 660 });
  const [snapshot, setSnapshot] = useState<RenderSnapshot>({ nodes: [], links: [] });

  const nodesRef = useRef<MapSimNode[]>([]);
  const linksRef = useRef<MapSimLink[]>([]);
  const simulationRef = useRef<d3.Simulation<MapSimNode, MapSimLink> | null>(null);
  const linkForceRef = useRef<d3.ForceLink<MapSimNode, MapSimLink> | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const labelModeRef = useRef(showAllLabels);
  labelModeRef.current = showAllLabels;

  /* ---------- 数据 → 工作副本 ---------- */

  const buildGraph = useCallback((): { nodes: MapSimNode[]; links: MapSimLink[] } => {
    const prev = new Map(nodesRef.current.map((n) => [n.id, n]));
    const topicCountById = new Map<string, number>();
    const inDegree = new Map<string, number>();

    for (const edge of CONTROVERSY_MAP.edges) {
      inDegree.set(edge.source, (inDegree.get(edge.source) ?? 0) + 1);
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
      if (edge.relation === "bridge") {
        topicCountById.set(edge.source, (topicCountById.get(edge.source) ?? 0) + 1);
      }
    }

    const nodes: MapSimNode[] = CONTROVERSY_MAP.nodes.map((n) => {
      const old = prev.get(n.id);
      return {
        id: n.id,
        kind: n.kind,
        label: n.label,
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
    });

    const byId = new Map(nodes.map((n) => [n.id, n]));
    const links: MapSimLink[] = [];
    for (const [i, e] of CONTROVERSY_MAP.edges.entries()) {
      const s = byId.get(e.source);
      const t = byId.get(e.target);
      if (!s || !t) continue;
      links.push({
        id: `l${i}-${e.relation}`,
        source: e.source,
        target: e.target,
        relation: e.relation,
        sourceDepth: s.depth,
        targetDepth: t.depth,
      });
    }
    return { nodes, links };
  }, []);

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
      // 立场分离：同立场的簇/议题互相靠近，对立阵营自然分开
      .force(
        "polarity",
        d3
          .forceX<MapSimNode>((n) => (n.side === "positive" ? -420 : n.side === "negative" ? 420 : 0))
          .strength((n) => (n.kind === "cluster" ? 0.1 : 0.035)),
      )
      .alphaDecay(0.022)
      .velocityDecay(0.42)
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
    const { nodes, links } = buildGraph();
    nodesRef.current = nodes;
    linksRef.current = links;

    // 关键：必须在 forceLink.links() 之前快照 id，
    // 否则 d3 会把 source/target 改写成节点对象，之后就取不到 id 了。
    const linkSnapshot = links.map((l) => ({
      id: l.id,
      relation: l.relation,
      sourceId: l.source as string,
      targetId: l.target as string,
    }));

    simulation.nodes(nodes);
    linkForceRef.current?.links(links);

    // 初次布局用黄金角撒点，避免全部叠在原点
    for (const [i, n] of nodes.entries()) {
      if (n.x === 0 && n.y === 0) {
        const angle = i * 2.39996;
        const r = 120 + Math.sqrt(i) * 46;
        n.x = Math.cos(angle) * r;
        n.y = Math.sin(angle) * r;
      }
    }

    setSnapshot({ nodes, links: linkSnapshot });
    simulation.alpha(0.95).restart();
  }, [buildGraph]);

  /* ---------- 逐帧坐标写入 ---------- */

  const syncDomPositions = useCallback((): void => {
    const svg = svgRef.current;
    if (!svg) return;
    const nodeEls = svg.querySelectorAll<SVGGElement>("[data-node-id]");
    for (const el of nodeEls) {
      const id = el.getAttribute("data-node-id");
      const n = nodesRef.current.find((x) => x.id === id);
      if (!n) continue;
      el.setAttribute("transform", `translate(${n.x},${n.y})`);
    }
    const linkEls = svg.querySelectorAll<SVGLineElement>("[data-link-id]");
    for (const el of linkEls) {
      const s = el.getAttribute("data-src");
      const t = el.getAttribute("data-tgt");
      const sn = nodesRef.current.find((x) => x.id === s);
      const tn = nodesRef.current.find((x) => x.id === t);
      if (!sn || !tn) continue;
      el.setAttribute("x1", String(sn.x));
      el.setAttribute("y1", String(sn.y));
      el.setAttribute("x2", String(tn.x));
      el.setAttribute("y2", String(tn.y));
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
      });
    zoomBehaviorRef.current = zoom;
    d3.select(svg).call(zoom).on("dblclick.zoom", null);
    return () => {
      d3.select(svg).on(".zoom", null);
      zoomBehaviorRef.current = null;
    };
  }, []);

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

  const pushNeighbors = useCallback((node: MapSimNode, dx: number, dy: number): void => {
    if (dx === 0 && dy === 0) return;
    for (const link of linksRef.current) {
      const s = typeof link.source === "string" ? null : link.source;
      const t = typeof link.target === "string" ? null : link.target;
      if (!s || !t) continue;
      let neighbor: MapSimNode | null = null;
      if (s.id === node.id) neighbor = t;
      else if (t.id === node.id) neighbor = s;
      if (!neighbor) continue;
      neighbor.vx = (neighbor.vx ?? 0) + dx * DRAG_NEIGHBOR_PULL;
      neighbor.vy = (neighbor.vy ?? 0) + dy * DRAG_NEIGHBOR_PULL;
    }
  }, []);

  const handleNodePointerDown = useCallback(
    (event: React.PointerEvent<SVGGElement>, nodeId: string): void => {
      event.stopPropagation();
      const simulation = simulationRef.current;
      const node = nodesRef.current.find((n) => n.id === nodeId);
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
      if (simulation) {
        simulation.alphaTarget(DRAG_ALPHA_TARGET).restart();
        if (simulation.alpha() < DRAG_ALPHA_MIN) simulation.alpha(DRAG_ALPHA_MIN);
      }
      (event.target as Element).setPointerCapture?.(event.pointerId);
    },
    [pointerToSimSpace],
  );

  useEffect(() => {
    const onMove = (event: PointerEvent): void => {
      const drag = dragStateRef.current;
      if (!drag) return;
      const node = nodesRef.current.find((n) => n.id === drag.nodeId);
      const pointer = pointerToSimSpace(event);
      if (!node || !pointer) return;
      drag.moved = true;
      const nx = pointer.x + drag.offsetX;
      const ny = pointer.y + drag.offsetY;
      const dx = nx - node.x;
      const dy = ny - node.y;
      node.fx = nx;
      node.fy = ny;
      node.x = nx;
      node.y = ny;
      pushNeighbors(node, dx, dy);
      syncDomPositions();
    };
    const onUp = (): void => {
      const drag = dragStateRef.current;
      if (!drag) return;
      const node = nodesRef.current.find((n) => n.id === drag.nodeId);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
      if (!drag.moved) setSelectedId((cur) => (cur === drag.nodeId ? null : drag.nodeId));
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
  }, [pointerToSimSpace, pushNeighbors, syncDomPositions]);

  /* ---------- 邻接计算（高亮用） ---------- */

  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const e of CONTROVERSY_MAP.edges) {
      if (!map.has(e.source)) map.set(e.source, new Set());
      if (!map.has(e.target)) map.set(e.target, new Set());
      map.get(e.source)!.add(e.target);
      map.get(e.target)!.add(e.source);
    }
    return map;
  }, []);

  const activeId = hoveredId ?? selectedId;
  const highlighted = useMemo(() => {
    if (!activeId) return null;
    const set = new Set<string>([activeId]);
    for (const n of adjacency.get(activeId) ?? []) set.add(n);
    return set;
  }, [activeId, adjacency]);

  const isDim = (id: string): boolean => highlighted !== null && !highlighted.has(id);

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
    d3.select(svg).transition().duration(240).call(behavior.transform, d3.zoomIdentity);
    simulationRef.current?.alpha(0.6).restart();
  }, []);

  /* ---------- 渲染 ---------- */

  const resolvedLinks: MapResolvedLink[] = useMemo(() => {
    const byId = new Map(snapshot.nodes.map((n) => [n.id, n]));
    const out: MapResolvedLink[] = [];
    for (const l of snapshot.links) {
      const s = byId.get(l.sourceId);
      const t = byId.get(l.targetId);
      if (s && t) out.push({ id: l.id, relation: l.relation, source: s, target: t });
    }
    return out;
  }, [snapshot]);

  // 连线在下、节点在上：分两组渲染，保证层级正确
  const linkLayer = resolvedLinks.filter((l) => l.relation !== "bridge" && l.relation !== "rebuts");
  const emphasisLayer = resolvedLinks.filter((l) => l.relation === "bridge" || l.relation === "rebuts");

  const stats = CONTROVERSY_MAP.stats;

  return (
    <div className="controversy-map" ref={containerRef}>
      <div className="controversy-map-toolbar">
        <div className="controversy-map-hint">
          <strong>跨议题争议地图</strong>
          <span>
            {stats.topics} 个议题 · {stats.claims} 条论点 · {stats.clusters} 个共识主张 ·{" "}
            <em className="cm-em-bridge">{stats.bridge} 条跨议题缝合线</em> ·{" "}
            <em className="cm-em-rebuts">{stats.rebuts} 处跨议题冲突</em>
          </span>
        </div>
        <div className="controversy-map-actions">
          <button type="button" onClick={() => setShowAllLabels((v) => !v)}>
            {showAllLabels ? "仅显示骨架标签" : "显示全部标签"}
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

      <div className="controversy-map-legend">
        <span className="cm-lg">
          <svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="#0f6fe5" /></svg>
          共识主张（跨议题）
        </span>
        <span className="cm-lg">
          <svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="#111827" /></svg>
          议题
        </span>
        <span className="cm-lg">
          <svg width="14" height="14"><circle cx="7" cy="7" r="3.5" fill="#7fb0f2" /></svg>
          论点
        </span>
        <span className="cm-lg">
          <svg width="22" height="14"><line x1="1" y1="7" x2="21" y2="7" stroke="#e8a33d" strokeWidth="2" strokeDasharray="7 5" /></svg>
          跨议题缝合线
        </span>
        <span className="cm-lg">
          <svg width="22" height="14"><line x1="1" y1="7" x2="21" y2="7" stroke="#d9574d" strokeWidth="1.6" strokeDasharray="5 4" /></svg>
          跨议题冲突
        </span>
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
                  opacity={
                    highlighted === null
                      ? 0.5
                      : highlighted.has(l.source.id) && highlighted.has(l.target.id)
                        ? 1
                        : 0.07
                  }
                />
              ))}
            </g>

            {/* 强调边：缝合线与冲突，置于普通边上、节点下 */}
            <g className="cm-links-emphasis">
              {emphasisLayer.map((l) => (
                <line
                  key={l.id}
                  data-link-id={l.id}
                  data-src={l.source.id}
                  data-tgt={l.target.id}
                  data-relation={l.relation}
                  stroke={strokeForLink(l.relation)}
                  strokeWidth={widthForLink(l.relation)}
                  strokeDasharray={dashForLink(l.relation)}
                  opacity={
                    highlighted === null
                      ? 0.85
                      : highlighted.has(l.source.id) && highlighted.has(l.target.id)
                        ? 1
                        : 0.06
                  }
                />
              ))}
            </g>

            {/* 节点 */}
            <g className="cm-nodes">
              {snapshot.nodes.map((n) => {
                const dim = isDim(n.id);
                const isActive = activeId === n.id;
                const showLabel =
                  showAllLabels || n.kind !== "claim" || isActive || (highlighted?.has(n.id) ?? false);
                const lines = wrapLabel(n.label, n.kind === "cluster" ? 9 : 12);
                return (
                  <g
                    key={n.id}
                    data-node-id={n.id}
                    data-node-kind={n.kind}
                    transform={`translate(${n.x},${n.y})`}
                    className="cm-node"
                    opacity={dim ? 0.14 : 1}
                    onPointerDown={(e) => handleNodePointerDown(e, n.id)}
                    onMouseEnter={() => setHoveredId(n.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      cursor: "grab",
                      transition: "opacity 140ms ease",
                    }}
                  >
                    <circle
                      r={n.radius}
                      fill={fillForNode(n)}
                      stroke={strokeForNode(n)}
                      strokeWidth={n.kind === "cluster" ? 2 : n.kind === "topic" ? 1.6 : 0}
                    />
                    {/* 邻域高亮环，让"这个节点的关系网"一眼可见 */}
                    {isActive && (
                      <circle
                        r={n.radius + 6}
                        fill="none"
                        stroke={n.kind === "cluster" ? "#e8a33d" : "#0f6fe5"}
                        strokeWidth="1.6"
                      />
                    )}
                    {showLabel && (
                      <text
                        className="cm-node-label"
                        textAnchor="middle"
                        y={n.radius + 13}
                        fill={n.kind === "cluster" ? "#7a4b00" : "#334155"}
                        fontSize={n.kind === "cluster" ? 11.5 : n.kind === "topic" ? 10.5 : 10}
                        fontWeight={n.kind === "cluster" ? 600 : 400}
                      >
                        {lines.map((line, i) => (
                          <tspan key={i} x={0} dy={i === 0 ? 0 : 12}>
                            {line}
                          </tspan>
                        ))}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
