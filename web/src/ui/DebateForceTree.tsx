/**
 * 可交互力导向辩论树（React + TypeScript + D3 + SVG）。
 *
 * 职责划分：
 *  - D3 负责力模拟（位置计算）、拖拽（drag）、缩放平移（zoom）；
 *  - React 负责数据状态与 SVG 元素渲染。
 *
 * 关键设计（避免踩 d3 与 React 混用的经典坑）：
 *  1. d3 会直接改写传入的节点/连线对象（x、y、vx、vy、source、target）。
 *     所以每次真正需要重建布局时，都把「数据层」拷贝成一份独立的 SimNode/SimLink
 *     工作副本；React state 里的原始数据从不交给 d3。
 *  2. simulation 只创建一次，之后仅通过 nodes()/force() 更新，不重复 new。
 *  3. 组件卸载时 stop() 模拟并清理 window 监听。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

import {
  DEBATE_TREE,
  flattenDebateTree,
  chargeForDepth,
  linkDistanceForDepth,
  radiusForType,
  sideBiasFor,
} from "../data/debateGraph";
import type { DebateLinkRelation, DebateNodeType, SimLink, SimNode } from "../types/graph";

/* ────────── 视觉常量 ────────── */

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 3;
const ZOOM_STEP = 1.25;

/** 依类型与阵营取填充色，保持与项目既有蓝/珊瑚色系一致。 */
function fillForNode(node: SimNode): string {
  if (node.type === "topic") {
    return "#111827";
  }
  if (node.type === "side") {
    return node.side === "positive" ? "#0f6fe5" : "#d9574d";
  }
  if (node.side === "positive") {
    return node.type === "rebuttal" ? "#ffffff" : "#5b9bf0";
  }
  if (node.side === "negative") {
    return node.type === "response" ? "#ffffff" : "#e8837a";
  }
  return "#94a3b8";
}

function strokeForNode(node: SimNode): string {
  if (node.type === "topic") {
    return "#111827";
  }
  if (node.type === "side") {
    return node.side === "positive" ? "#0f6fe5" : "#d9574d";
  }
  if (node.type === "rebuttal") {
    return "#d9574d";
  }
  if (node.type === "response") {
    return "#0f6fe5";
  }
  return "#ffffff";
}

/** 依节点类型取字号，根节点最大以保证可读性。 */
function fontSizeForNode(type: DebateNodeType): number {
  switch (type) {
    case "topic":
      return 15;
    case "side":
      return 12;
    case "argument":
      return 11;
    default:
      return 10;
  }
}

/** 标签距节点中心的偏移（沿着远离父节点方向 + 半径）。 */
function labelOffsetForNode(type: DebateNodeType, radius: number): number {
  switch (type) {
    case "topic":
      return radius + 18;
    case "side":
      return radius + 16;
    case "argument":
      return radius + 14;
    default:
      return radius + 12;
  }
}

/** 连线颜色：反驳/回应用强调色，其余中性。 */
function strokeForLink(relation: DebateLinkRelation): string {
  if (relation === "rebuts") {
    return "#d9574d";
  }
  if (relation === "responds") {
    return "#0f6fe5";
  }
  return "#9db2cb";
}

function linkDash(relation: DebateLinkRelation): string | undefined {
  return relation === "rebuts" || relation === "responds" ? "5 4" : undefined;
}

/* ────────── 组件 ────────── */

/**
 * 拖拽力度参数。
 * d3 的 alpha 是「模拟热度」：alphaTarget 是拖拽期间维持的目标热度，
 * 数值越大 → 冷却越慢 → 邻居跟随越积极、整体越好拉动。
 * 0.25 偏温和，0.5 是 d3 官方拖拽示例附近的量级，手感明显更"黏"。
 */
const DRAG_ALPHA_TARGET = 0.5;
/** 按下瞬间的最低热度，保证一上手就有响应，而不是等几帧。 */
const DRAG_ALPHA_MIN = 0.45;
/** 直接邻居跟随系数：0 不带动，1 完全同步跟手。0.35 兼顾响应与不失衡。 */
const DRAG_NEIGHBOR_PULL = 0.35;

interface DragState {
  nodeId: string;
  offsetX: number;
  offsetY: number;
  moved: boolean;
}

export function DebateForceTree() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  /** React 侧只保存「哪些节点被收起」这一份最小状态。 */
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 960, height: 620 });

  /**
   * 展开后的扁平数据（纯数据层，绝不交给 d3）。
   * d3 只读取它来构造独立的工作副本。
   */
  const flatGraph = useMemo(() => flattenDebateTree(DEBATE_TREE, collapsedIds), [collapsedIds]);

  /** 稳定的 Map：id → 数据层节点（用于取 label / type / side）。 */
  const nodeDataById = useMemo(() => {
    const map = new Map<string, (typeof flatGraph.nodes)[number]>();
    for (const node of flatGraph.nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [flatGraph]);

  /** 每个节点的层级与子节点计数（用于半径、斥力、连线长度）。 */
  const metaById = useMemo(() => {
    const meta = new Map<string, { depth: number; childCount: number }>();
    const walk = (node: (typeof flatGraph.nodes)[number], depth: number): void => {
      meta.set(node.id, { depth, childCount: (node.children ?? []).length });
      for (const child of node.children ?? []) {
        walk(child, depth + 1);
      }
    };
    walk(DEBATE_TREE, 0);
    return meta;
  }, [flatGraph]);

  /** 邻接关系：用于悬停/选中时高亮直接相连的节点与连线。 */
  const neighborIds = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const add = (a: string, b: string): void => {
      if (!map.has(a)) {
        map.set(a, new Set());
      }
      map.get(a)!.add(b);
    };
    for (const link of flatGraph.links) {
      add(link.source, link.target);
      add(link.target, link.source);
    }
    return map;
  }, [flatGraph]);

  /* 模拟所需的可变工作副本（d3 直接改写这些对象）。 */
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

  /**
   * 渲染用的只读快照（结构 + 初始坐标）。
   * d3 只改写 nodesRef/linksRef 里的对象，这份快照用于 React 渲染，
   * 每帧坐标由 syncDomPositions 直接写 DOM，避免每帧 setState。
   * 之所以要用 state 而不是直接读 ref：ref 更新不触发重渲染，
   * 会导致连线数量变化（展开/收起）后 DOM 不同步。
   */
  const [renderSnapshot, setRenderSnapshot] = useState<{
    nodes: SimNode[];
    links: { id: string; relation: DebateLinkRelation; sourceId: string; targetId: string }[];
  }>({ nodes: [], links: [] });

  /* ---------- 缩放平移 ---------- */

  const zoomBehavior = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  /* ---------- 尺寸自适应 ---------- */

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    const updateSize = (): void => {
      const rect = element.getBoundingClientRect();
      setSize({
        width: Math.max(320, Math.round(rect.width)),
        height: Math.max(320, Math.round(rect.height)),
      });
    };
    updateSize();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateSize);
      observer.observe(element);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  /* ---------- 力模拟：只创建一次 ---------- */

  useEffect(() => {
    const simulation = d3
      .forceSimulation<SimNode, SimLink>()
      .force("charge", d3.forceManyBody<SimNode>().strength((node) => chargeForDepth(node.depth)))
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>([])
          .id((node) => node.id)
          .distance((link) => linkDistanceForDepth(link.targetDepth))
          .strength((link) => (link.targetDepth <= 1 ? 0.35 : 0.75)),
      )
      .force("collide", d3.forceCollide<SimNode>().radius((node) => node.radius + 16).strength(0.9))
      .force("center", d3.forceCenter(0, 0))
      // 阵营分离：轻微的位置力，避免形成僵硬的左右两列
      .force(
        "sideBias",
        d3.forceX<SimNode>((node) => sideBiasFor(node.side) * 900).strength((node) =>
          node.type === "side" || node.type === "argument" ? 0.06 : 0.02,
        ),
      )
      .force("y", d3.forceY<SimNode>(0).strength(0.03))
      .alphaDecay(0.028)
      .velocityDecay(0.4)
      .on("tick", () => {
        // 坐标统一以 (0,0) 为中心，由外层 <g> 平移到画布中心，
        // 这样 forceCenter 的变动不影响已缩放的视图。
        syncDomPositions();
      });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
  }, []);

  /**
   * 把 sim 节点坐标写入 DOM。
   * 不走 React state（每帧 setState 会带来大量重渲染），
   * 直接操作已渲染的 SVG 元素；React 只负责结构与交互态。
   */
  const syncDomPositions = useCallback((): void => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    const byId = new Map<string, SimNode>();
    for (const node of nodesRef.current) {
      byId.set(node.id, node);
    }
    const linkById = new Map(linksRef.current.map((link) => [link.id, link]));
    svg.querySelectorAll<SVGGElement>("[data-node-id]").forEach((group) => {
      const id = group.dataset.nodeId;
      const node = id ? byId.get(id) : undefined;
      if (!node) {
        return;
      }
      group.setAttribute("transform", `translate(${node.x},${node.y})`);
    });
    svg.querySelectorAll<SVGLineElement>("[data-link-id]").forEach((line) => {
      const id = line.dataset.linkId;
      const link = id ? linkById.get(id) : undefined;
      if (!link) {
        return;
      }
      // 交给 d3 之后 source/target 已是节点对象
      const source = link.source as SimNode;
      const target = link.target as SimNode;
      if (typeof source === "string" || typeof target === "string") {
        return;
      }
      line.setAttribute("x1", String(source.x));
      line.setAttribute("y1", String(source.y));
      line.setAttribute("x2", String(target.x));
      line.setAttribute("y2", String(target.y));
    });
  }, []);

  /* ---------- 数据变化时重建工作副本并重启模拟 ---------- */
  useEffect(() => {
    const simulation = simulationRef.current;
    if (!simulation) {
      return;
    }

    const previous = new Map(nodesRef.current.map((node) => [node.id, node]));
    const nodes: SimNode[] = flatGraph.nodes.map((item) => {
      const meta = metaById.get(item.id);
      const depth = meta?.depth ?? 0;
      const prior = previous.get(item.id);
      return {
        id: item.id,
        label: item.label,
        type: item.type,
        side: item.side,
        parentId: item.parentId,
        depth,
        radius: radiusForType(item.type),
        hasChildren: (meta?.childCount ?? 0) > 0,
        expanded: !collapsedIds.has(item.id),
        // 已存在的节点保留坐标，避免展开/收起时整图跳动
        x: prior?.x ?? 0,
        y: prior?.y ?? 0,
        vx: prior?.vx ?? 0,
        vy: prior?.vy ?? 0,
        fx: prior?.fx ?? null,
        fy: prior?.fy ?? null,
      };
    });

    // 新节点围绕其父节点初始撒点，让展开动作有连贯的"生长"感
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    for (const node of nodes) {
      if (previous.has(node.id) || !node.parentId) {
        continue;
      }
      const parent = nodeById.get(node.parentId);
      if (!parent) {
        continue;
      }
      node.x = parent.x + (Math.random() - 0.5) * 40;
      node.y = parent.y + (Math.random() - 0.5) * 40;
    }

    const links: SimLink[] = flatGraph.links.map((link) => {
      const sourceMeta = metaById.get(link.source);
      const targetMeta = metaById.get(link.target);
      return {
        id: link.id,
        source: link.source,
        target: link.target,
        relation: link.relation,
        sourceDepth: sourceMeta?.depth ?? 0,
        targetDepth: targetMeta?.depth ?? 1,
      };
    });

    /**
     * 关键：d3 的 forceLink.links() 会把 source/target 从字符串替换成节点对象，
     * 替换后就再也拿不到 id 了。所以必须在交给 d3 之前先把 id 快照出来。
     */
    const linkIdSnapshot = links.map((link) => ({
      id: link.id,
      relation: link.relation,
      sourceId: link.source as string,
      targetId: link.target as string,
    }));

    nodesRef.current = nodes;
    linksRef.current = links;

    simulation.nodes(nodes);
    const linkForce = simulation.force<d3.ForceLink<SimNode, SimLink>>("link");
    linkForce?.links(links);

    // 同步渲染快照：结构变化（展开/收起）后连线与节点必须随之增删
    setRenderSnapshot({ nodes, links: linkIdSnapshot });

    // 复用同一个 simulation，仅重新加热，不重复创建实例
    simulation.alpha(0.9).restart();
  }, [flatGraph, metaById, collapsedIds]);

  /**
   * React 提交新节点后，立刻把坐标写进 DOM。
   * 新渲染出的 <g> 初始 transform 来自快照坐标，若不及时同步，
   * 会闪现在原点（(0,0) 是模拟坐标系的中心）直到下一个 tick 才归位。
   */
  useEffect(() => {
    syncDomPositions();
  }, [renderSnapshot, syncDomPositions]);

  /* ---------- 缩放与平移（作用于容器 <g>，不改 SVG 尺寸） ---------- */

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    const behavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .filter((event: Event) => {
        // 允许滚轮与拖拽平移；但节点自身的拖拽交给 d3.drag 处理
        const target = event.target as Element | null;
        const onNode = target?.closest?.("[data-node-id]");
        if (onNode) {
          return false;
        }
        // 只响应鼠标左键（滚轮事件的 button 为 0）
        return !(event instanceof MouseEvent) || event.button === 0;
      })
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const layer = svg.querySelector<SVGGElement>("[data-zoom-layer]");
        if (!layer) {
          return;
        }
        const { x, y, k } = event.transform;
        layer.setAttribute("transform", `translate(${x},${y}) scale(${k})`);
      });

    zoomBehavior.current = behavior;
    d3.select(svg).call(behavior).on("dblclick.zoom", null);

    return () => {
      d3.select(svg).on(".zoom", null);
      zoomBehavior.current = null;
    };
  }, []);

  /* ---------- 拖拽 ---------- */

  const selectNodeById = useCallback((id: string | null): void => {
    setSelectedId(id);
  }, []);

  /**
   * 拖拽助跑：把当前帧的位移按比例转成「直接邻居」的速度冲量。
   *
   * 为什么需要它：d3 的力模型里，被钉住（fx/fy）的节点只是不再移动，
   * 它对邻居的拉力仍由 forceLink 每帧计算——但那是渐进的、有阻尼的，
   * 拖动快时邻居「跟不上手」，感觉拉不动。这里额外给邻居一个与拖动
   * 方向一致的初速度，让它们像被绳子拽着一样立刻响应。
   *
   * 只作用于直接邻居（一跳），跳数越远衰减越强，避免整图被拖散。
   */
  const pushNeighbors = useCallback(
    (node: SimNode, deltaX: number, deltaY: number): void => {
      if (deltaX === 0 && deltaY === 0) {
        return;
      }
      for (const link of linksRef.current) {
        const source = typeof link.source === "string" ? null : link.source;
        const target = typeof link.target === "string" ? null : link.target;
        if (!source || !target) {
          continue;
        }
        let neighbor: SimNode | null = null;
        if (source.id === node.id) {
          neighbor = target;
        } else if (target.id === node.id) {
          neighbor = source;
        }
        if (!neighbor) {
          continue;
        }
        // 邻居被"拽着走"，但力度弱于指针本身，保留力学自平衡的空间
        neighbor.vx = (neighbor.vx ?? 0) + deltaX * DRAG_NEIGHBOR_PULL;
        neighbor.vy = (neighbor.vy ?? 0) + deltaY * DRAG_NEIGHBOR_PULL;
      }
    },
    [],
  );

  /**
   * 节点拖拽：模拟坐标以 (0,0) 为中心，需把屏幕坐标反解回「模拟坐标系」。
   * 反解依赖当前 zoom transform 与容器中心偏移。
   */
  const pointerToSimSpace = useCallback(
    (event: PointerEvent | MouseEvent): { x: number; y: number } | null => {
      const svg = svgRef.current;
      if (!svg) {
        return null;
      }
      const current = d3.zoomTransform(svg);
      const rect = svg.getBoundingClientRect();
      // 屏幕 → SVG 视口坐标 → 去掉 zoom → 去掉中心偏移 → 模拟坐标
      const vx = event.clientX - rect.left;
      const vy = event.clientY - rect.top;
      const unzoomedX = (vx - current.x) / current.k;
      const unzoomedY = (vy - current.y) / current.k;
      return { x: unzoomedX - size.width / 2, y: unzoomedY - size.height / 2 };
    },
    [size.width, size.height],
  );

  const handleNodePointerDown = useCallback(
    (event: React.PointerEvent<SVGGElement>, nodeId: string): void => {
      // 展开/收起按钮有自己的 click 语义，绝不能被拖拽逻辑吞掉
      if ((event.target as Element).closest?.(".debate-force-toggle")) {
        return;
      }
      event.stopPropagation();
      const simulation = simulationRef.current;
      const node = nodesRef.current.find((item) => item.id === nodeId);
      const pointer = pointerToSimSpace(event.nativeEvent);
      if (!node || !pointer) {
        return;
      }
      // 记录指针与节点的偏移，避免按下瞬间节点"跳跃"到指针位置
      dragStateRef.current = {
        nodeId,
        offsetX: node.x - pointer.x,
        offsetY: node.y - pointer.y,
        moved: false,
      };
      // 拖动期间固定该节点，模拟重新加热让邻居跟随。
      // alphaTarget 越高，模拟冷却得越慢、邻居跟随越积极。
      // 用 forceSimulation 原生 alphaTarget 语义之外，还手动抬一次 alpha，
      // 保证「刚按下就有明显响应」，而不是等几帧才热起来。
      node.fx = node.x;
      node.fy = node.y;
      if (simulation) {
        simulation.alphaTarget(DRAG_ALPHA_TARGET).restart();
        if (simulation.alpha() < DRAG_ALPHA_MIN) {
          simulation.alpha(DRAG_ALPHA_MIN);
        }
      }
      (event.target as Element).setPointerCapture?.(event.pointerId);
    },
    [pointerToSimSpace],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent): void => {
      const drag = dragStateRef.current;
      if (!drag) {
        return;
      }
      const node = nodesRef.current.find((item) => item.id === drag.nodeId);
      const pointer = pointerToSimSpace(event);
      if (!node || !pointer) {
        return;
      }
      drag.moved = true;
      const nextX = pointer.x + drag.offsetX;
      const nextY = pointer.y + drag.offsetY;
      // 把这一帧的位移转成速度，稍后传导给直接邻居，让它们"被拽着走"
      const deltaX = nextX - node.x;
      const deltaY = nextY - node.y;
      node.fx = nextX;
      node.fy = nextY;
      // 立即跟手，不等下一个 tick
      node.x = nextX;
      node.y = nextY;
      pushNeighbors(node, deltaX, deltaY);
      syncDomPositions();
    };

    const handlePointerUp = (): void => {
      const drag = dragStateRef.current;
      if (!drag) {
        return;
      }
      const node = nodesRef.current.find((item) => item.id === drag.nodeId);
      if (node) {
        // 松手解除固定，节点重新参与力学并逐渐稳定
        node.fx = null;
        node.fy = null;
      }
      // 若没有明显位移，视为点击选中
      if (!drag.moved) {
        selectNodeById(drag.nodeId);
      }
      dragStateRef.current = null;
      simulationRef.current?.alphaTarget(0);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [pointerToSimSpace, syncDomPositions, selectNodeById, pushNeighbors]);

  /* ---------- 展开 / 收起 ---------- */

  const toggleNode = useCallback((nodeId: string, event: React.MouseEvent): void => {
    event.stopPropagation();
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  /* ---------- 空白处点击取消选中 ---------- */

  const handleBackgroundClick = useCallback(
    (event: React.MouseEvent<SVGSVGElement>): void => {
      if (event.target === event.currentTarget || (event.target as Element).hasAttribute("data-backdrop")) {
        selectNodeById(null);
      }
    },
    [selectNodeById],
  );

  /* ---------- 缩放按钮 ---------- */

  const zoomBy = useCallback((factor: number): void => {
    const svg = svgRef.current;
    const behavior = zoomBehavior.current;
    if (!svg || !behavior) {
      return;
    }
    d3.select(svg).transition().duration(180).call(behavior.scaleBy, factor);
  }, []);

  const resetZoom = useCallback((): void => {
    const svg = svgRef.current;
    const behavior = zoomBehavior.current;
    if (!svg || !behavior) {
      return;
    }
    d3.select(svg).transition().duration(220).call(behavior.transform, d3.zoomIdentity);
  }, []);

  /* ---------- 高亮计算 ---------- */

  const activeId = hoveredId ?? selectedId;
  const highlightedNodeIds = useMemo(() => {
    if (!activeId) {
      return null;
    }
    const set = new Set<string>([activeId]);
    for (const id of neighborIds.get(activeId) ?? []) {
      set.add(id);
    }
    return set;
  }, [activeId, neighborIds]);

  const highlightedLinkIds = useMemo(() => {
    if (!activeId) {
      return null;
    }
    const set = new Set<string>();
    for (const link of flatGraph.links) {
      if (link.source === activeId || link.target === activeId) {
        set.add(link.id);
      }
    }
    return set;
  }, [activeId, flatGraph]);

  /* ---------- 渲染 ---------- */

  const halfWidth = size.width / 2;
  const halfHeight = size.height / 2;

  /** 已解析出节点引用的连线（渲染用）。 */
  const resolvedLinks = useMemo(() => {
    const byId = new Map(renderSnapshot.nodes.map((node) => [node.id, node]));
    return renderSnapshot.links
      .map((link) => {
        const source = byId.get(link.sourceId);
        const target = byId.get(link.targetId);
        if (!source || !target) {
          return null;
        }
        return { id: link.id, relation: link.relation, source, target };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [renderSnapshot]);

  return (
    <div className="debate-force-tree" ref={containerRef} data-testid="debate-force-tree">
      <div className="debate-force-toolbar">
        <span className="debate-force-hint">拖拽节点调整布局 · 滚轮缩放 · 拖动空白处平移 · 点击节点选中</span>
        <div className="debate-force-actions">
          <button type="button" onClick={() => zoomBy(1 / ZOOM_STEP)} aria-label="缩小">
            −
          </button>
          <button type="button" onClick={() => zoomBy(ZOOM_STEP)} aria-label="放大">
            +
          </button>
          <button type="button" className="fit-button" onClick={resetZoom}>
            重置视图
          </button>
        </div>
      </div>

      <svg
        ref={svgRef}
        className="debate-force-svg"
        width="100%"
        height="100%"
        viewBox={`0 0 ${size.width} ${size.height}`}
        onClick={handleBackgroundClick}
        role="presentation"
      >
        <rect data-backdrop="true" x={0} y={0} width={size.width} height={size.height} fill="transparent" />
        <g data-zoom-layer transform={`translate(0,0) scale(1)`}>
          <g transform={`translate(${halfWidth},${halfHeight})`}>
            {/* 连线位于节点下层 */}
            <g className="debate-force-links">
              {resolvedLinks.map((link) => {
                const dimmed = highlightedLinkIds !== null && !highlightedLinkIds.has(link.id);
                const emphasized = highlightedLinkIds !== null && highlightedLinkIds.has(link.id);
                return (
                  <line
                    key={link.id}
                    data-link-id={link.id}
                    x1={link.source.x}
                    y1={link.source.y}
                    x2={link.target.x}
                    y2={link.target.y}
                    stroke={emphasized ? "#0f6fe5" : strokeForLink(link.relation)}
                    strokeWidth={emphasized ? 2 : 1}
                    strokeDasharray={linkDash(link.relation)}
                    strokeOpacity={dimmed ? 0.12 : emphasized ? 0.95 : 0.5}
                  />
                );
              })}
            </g>

            <g className="debate-force-nodes">
              {renderSnapshot.nodes.map((node) => {
                const dimmed = highlightedNodeIds !== null && !highlightedNodeIds.has(node.id);
                const isActive = activeId === node.id;
                const isSelected = selectedId === node.id;
                const isExpanded = node.expanded;
                const labelLines = wrapLabel(node.label, node.type);
                const labelOffset = labelOffsetForNode(node.type, node.radius);
                return (
                  <g
                    key={node.id}
                    data-node-id={node.id}
                    data-node-type={node.type}
                    transform={`translate(${node.x},${node.y})`}
                    className={[
                      "debate-force-node",
                      `type-${node.type}`,
                      `side-${node.side}`,
                      isActive ? "is-active" : "",
                      isSelected ? "is-selected" : "",
                      dimmed ? "is-dimmed" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{ opacity: dimmed ? 0.22 : 1, cursor: "grab" }}
                    onPointerDown={(event) => handleNodePointerDown(event, node.id)}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId((current) => (current === node.id ? null : current))}
                  >
                    <circle
                      r={isActive ? node.radius * 1.14 : node.radius}
                      fill={fillForNode(node)}
                      stroke={strokeForNode(node)}
                      strokeWidth={node.type === "topic" || node.type === "side" ? 2 : 1.5}
                    />
                    <text
                      className="debate-force-label"
                      y={labelOffset}
                      textAnchor="middle"
                      fontSize={fontSizeForNode(node.type)}
                    >
                      {labelLines.map((line, index) => (
                        <tspan key={line + index} x={0} dy={index === 0 ? 0 : fontSizeForNode(node.type) + 2}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                    {node.hasChildren ? (
                      <g
                        className={`debate-force-toggle${isExpanded ? " is-expanded" : ""}`}
                        transform={`translate(${node.radius + 8},${-node.radius - 6})`}
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => toggleNode(node.id, event)}
                        role="button"
                        aria-label={isExpanded ? "收起分支" : "展开分支"}
                      >
                        {/* 透明命中区：让 <g> 自身也能接收点击，扩大可点范围 */}
                        <circle r={13} fill="transparent" />
                        <circle className="debate-force-toggle-ring" r={8} />
                        <text y={3.5} textAnchor="middle">
                          {isExpanded ? "−" : "+"}
                        </text>
                      </g>
                    ) : null}
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

/* ────────── 标签换行 ────────── */

const LABEL_MAX_CHARS_PER_LINE = 12;

/**
 * 长标签按字符数折行，避免遮挡相邻节点。
 * 根节点与阵营节点给更宽的行宽。
 */
function wrapLabel(label: string, type: DebateNodeType): string[] {
  const maxChars =
    type === "topic" ? 14 : type === "side" ? 12 : LABEL_MAX_CHARS_PER_LINE;
  if (label.length <= maxChars) {
    return [label];
  }
  const lines: string[] = [];
  for (let index = 0; index < label.length; index += maxChars) {
    lines.push(label.slice(index, index + maxChars));
  }
  return lines.slice(0, 3);
}
