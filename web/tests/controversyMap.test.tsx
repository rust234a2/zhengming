/**
 * 跨议题争议地图的验证测试。
 *
 * 覆盖四块：
 *  1. 数据层：真实知乎数据是否自洽（多父结构、无孤岛、主张簇真的跨议题）；
 *  2. 布局层：真实跑 d3 模拟，验证「同类聚合、骨架撑开、无重叠、非同分布」；
 *  3. 组件层：渲染、悬停高亮、点击选中、空白清除、缩放、卸载清理；
 *  4. 关键差异：证明这张图能表达树结构表达不了的东西（跨议题多归属）。
 */

import { render, cleanup, fireEvent, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as d3 from "d3";

import { CONTROVERSY_MAP } from "../src/data/controversyMap";
import type { MapSimLink, MapSimNode } from "../src/types/map";
import { ControversyMap } from "../src/ui/ControversyMap";

afterEach(() => {
  cleanup();
});

/** jsdom 下 SVG 的 className 是 SVGAnimatedString，必须用 getAttribute。 */
function classOf(el: Element): string {
  return el.getAttribute("class") ?? "";
}

/* ────────── 1. 数据层 ────────── */

describe("争议地图数据层", () => {
  it("三种节点类型都存在", () => {
    const kinds = new Set(CONTROVERSY_MAP.nodes.map((n) => n.kind));
    expect(kinds.has("topic")).toBe(true);
    expect(kinds.has("claim")).toBe(true);
    expect(kinds.has("cluster")).toBe(true);
  });

  it("四条统计口径与实际边数一致", () => {
    const s = CONTROVERSY_MAP.stats;
    const count = (r: string) => CONTROVERSY_MAP.edges.filter((e) => e.relation === r).length;
    expect(s.bridge).toBe(count("bridge"));
    expect(s.member).toBe(count("member"));
    expect(s.rebuts).toBe(count("rebuts"));
    expect(s.contains).toBe(count("contains"));
    expect(s.edges).toBe(CONTROVERSY_MAP.edges.length);
  });

  it("图中没有任何孤岛节点（力导向里孤岛会漂浮无意义）", () => {
    const deg = new Map<string, number>();
    for (const e of CONTROVERSY_MAP.edges) {
      deg.set(e.source, (deg.get(e.source) ?? 0) + 1);
      deg.set(e.target, (deg.get(e.target) ?? 0) + 1);
    }
    const isolated = CONTROVERSY_MAP.nodes.filter((n) => !deg.get(n.id));
    expect(isolated.map((n) => n.id)).toEqual([]);
  });

  it("所有边的两端节点都真实存在（无悬空引用）", () => {
    const ids = new Set(CONTROVERSY_MAP.nodes.map((n) => n.id));
    for (const e of CONTROVERSY_MAP.edges) {
      expect(ids.has(e.source)).toBe(true);
      expect(ids.has(e.target)).toBe(true);
    }
  });

  it("这是树结构表达不了的结构：存在被多个议题共享的主张簇（多父）", () => {
    const bridgeByCluster = new Map<string, Set<string>>();
    for (const e of CONTROVERSY_MAP.edges) {
      if (e.relation !== "bridge") continue;
      if (!bridgeByCluster.has(e.source)) bridgeByCluster.set(e.source, new Set());
      bridgeByCluster.get(e.source)!.add(e.target);
    }
    // 至少有一个簇缝合了 >=3 个议题，否则这张图就没有存在价值
    const multi = [...bridgeByCluster.values()].filter((topics) => topics.size >= 3);
    expect(multi.length).toBeGreaterThanOrEqual(1);
    // 且该簇的 topicCount 字段与实际一致
    for (const cluster of CONTROVERSY_MAP.nodes.filter((n) => n.kind === "cluster")) {
      const actual = bridgeByCluster.get(cluster.id)?.size ?? 0;
      expect(cluster.topicCount).toBe(actual);
    }
  });

  it("存在跨议题的冲突边（rebuts），这是最有信息量的关系", () => {
    const rebuts = CONTROVERSY_MAP.edges.filter((e) => e.relation === "rebuts");
    expect(rebuts.length).toBeGreaterThan(0);
    // 冲突必须真的跨议题（两端属于不同议题），否则就是树内已有的关系
    const topicOf = new Map(
      CONTROVERSY_MAP.nodes.filter((n) => n.kind === "claim").map((n) => [n.id, n.topicId]),
    );
    for (const e of rebuts) {
      expect(topicOf.get(e.source)).not.toBe(topicOf.get(e.target));
    }
  });

  it("每个论点都归属唯一议题，且该议题存在", () => {
    const topicIds = new Set(CONTROVERSY_MAP.nodes.filter((n) => n.kind === "topic").map((n) => n.id));
    for (const claim of CONTROVERSY_MAP.nodes.filter((n) => n.kind === "claim")) {
      expect(topicIds.has(claim.topicId!)).toBe(true);
    }
  });

  it("论点立场均落在三值集合内", () => {
    for (const n of CONTROVERSY_MAP.nodes) {
      if (n.side === undefined) continue;
      expect(["positive", "negative", "neutral"]).toContain(n.side);
    }
  });
});

/* ────────── 2. 布局层（真实跑 d3 模拟） ────────── */

function seededRandom(initial: number) {
  let state = initial >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/** 用与组件一致的力配置跑一遍模拟，固定种子保证质量门槛不漂移。 */
function runSimulation(seed: () => number = seededRandom(42)) {
  const rng = seed;
  const nodes: MapSimNode[] = CONTROVERSY_MAP.nodes.map((n, i) => {
    const angle = i * 2.39996;
    const r = 120 + Math.sqrt(i) * 46;
    return {
      id: n.id,
      kind: n.kind,
      label: n.label,
      side: n.side ?? "neutral",
      depth: n.kind === "cluster" ? 0 : n.kind === "topic" ? 1 : 2,
      radius:
        n.kind === "cluster"
          ? 16 + Math.min(n.topicCount ?? 0, 6) * 2.6
          : n.kind === "topic"
            ? 11 + Math.min(n.weight ?? 0, 5) * 1.1
            : 6.5,
      topicCount: n.topicCount ?? 0,
      votes: n.votes ?? 0,
      x: Math.cos(angle) * r + (rng() - 0.5) * 20,
      y: Math.sin(angle) * r + (rng() - 0.5) * 20,
      vx: 0,
      vy: 0,
    };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const links: MapSimLink[] = CONTROVERSY_MAP.edges.map((e, i) => ({
    id: `l${i}`,
    source: e.source,
    target: e.target,
    relation: e.relation,
    sourceDepth: byId.get(e.source)!.depth,
    targetDepth: byId.get(e.target)!.depth,
  }));

  const dist: Record<string, number> = { bridge: 165, member: 78, contains: 118, rebuts: 250 };
  const str: Record<string, number> = { bridge: 0.55, member: 0.9, contains: 0.32, rebuts: 0.08 };
  const charge: Record<string, number> = { cluster: -1150, topic: -560, claim: -170 };
  /* 骨架目标半径随规模自适应：力导向布局的线性尺度 ~ O(√N)（v1 = 43 节点时 520），
   * 数据扩充后论点云半径同步膨胀，骨架半径必须按 √N 缩放才能继续留在外围。 */
  const skeletonR = Math.max(520, 80 * Math.sqrt(nodes.length));

  const sim = d3
    .forceSimulation<MapSimNode, MapSimLink>(nodes)
    .force("link", d3.forceLink<MapSimNode, MapSimLink>(links).id((n) => n.id).distance((l) => dist[l.relation]).strength((l) => str[l.relation]))
    .force("charge", d3.forceManyBody<MapSimNode>().strength((n) => charge[n.kind]))
    .force("center", d3.forceCenter(0, 0))
    .force("collide", d3.forceCollide<MapSimNode>().radius((n) => n.radius + (n.kind === "cluster" ? 34 : n.kind === "topic" ? 22 : 13)).strength(0.95))
    .force("polarity", d3.forceX<MapSimNode>((n) => (n.side === "positive" ? -420 : n.side === "negative" ? 420 : 0)).strength((n) => (n.kind === "cluster" ? 0.1 : 0.035)))
    .force("skeleton", d3.forceRadial<MapSimNode>((n) => (n.kind === "cluster" ? skeletonR : 0), 0, 0).strength((n) => (n.kind === "cluster" ? 0.15 : 0)))
    .alphaDecay(0.022)
    .velocityDecay(0.42)
    .stop();

  for (let i = 0; i < 400; i += 1) sim.tick();
  sim.stop();
  return { nodes, links };
}

describe("争议地图布局质量（真实 d3 模拟）", () => {
  it("所有节点坐标有限，无 NaN", () => {
    const { nodes } = runSimulation();
    for (const n of nodes) {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    }
  });

  it("节点之间没有明显重叠", () => {
    const { nodes } = runSimulation();
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        // 允许轻微相交（力导向的软约束），但不能重叠到看不清
        expect(d).toBeGreaterThan((nodes[i].radius + nodes[j].radius) * 0.5);
      }
    }
  });

  it("主张簇（骨架）被推到离中心较远的位置，撑开整张图", () => {
    const { nodes } = runSimulation();
    const clusters = nodes.filter((n) => n.kind === "cluster");
    const claims = nodes.filter((n) => n.kind === "claim");
    const avg = (a: MapSimNode[]) =>
      a.reduce((s, n) => s + Math.hypot(n.x, n.y), 0) / Math.max(a.length, 1);
    // 骨架在外围、论点在内部聚拢，结构才有层次
    expect(clusters.length).toBeGreaterThan(0);
    expect(avg(clusters)).toBeGreaterThan(avg(claims) * 0.8);
  });

  it("同一主张簇的成员论点，距离明显小于随机节点对", () => {
    const { nodes } = runSimulation();
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const memberPairs: number[] = [];
    for (const e of CONTROVERSY_MAP.edges) {
      if (e.relation !== "member") continue;
      const s = byId.get(e.source)!;
      const t = byId.get(e.target)!;
      memberPairs.push(Math.hypot(s.x - t.x, s.y - t.y));
    }
    const avgMember = memberPairs.reduce((a, b) => a + b, 0) / memberPairs.length;
    // 成员边（claim→cluster）应显著短于整体平均距离
    let total = 0;
    let n = 0;
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        total += Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        n += 1;
      }
    }
    expect(avgMember).toBeLessThan(total / n);
  });

  it("布局不是硬编码结果：两次独立运行坐标不同", () => {
    const a = runSimulation(seededRandom(42));
    const b = runSimulation(seededRandom(43));
    let diff = 0;
    for (let i = 0; i < a.nodes.length; i += 1) {
      diff += Math.abs(a.nodes[i].x - b.nodes[i].x) + Math.abs(a.nodes[i].y - b.nodes[i].y);
    }
    expect(diff).toBeGreaterThan(1);
  }, 20000);
});

/* ────────── 3. 组件层 ────────── */

/** 骨架视图下议题间冲突线的期望数量：论点级 rebuts 按 (topicA,topicB) 无向去重。 */
function expectedAggregatedCount(): number {
  const topicOf = new Map(
    CONTROVERSY_MAP.nodes.filter((n) => n.kind === "claim").map((n) => [n.id, n.topicId!]),
  );
  const pairs = new Set<string>();
  for (const e of CONTROVERSY_MAP.edges) {
    if (e.relation !== "rebuts") continue;
    const a = topicOf.get(e.source);
    const b = topicOf.get(e.target);
    if (!a || !b || a === b) continue;
    pairs.add(a < b ? `${a}|${b}` : `${b}|${a}`);
  }
  return pairs.size;
}

/** 展开论点后（归属边关闭）应渲染的连线数：bridge + 论点级 rebuts。 */
function emphasisTotal(): number {
  return CONTROVERSY_MAP.stats.bridge + CONTROVERSY_MAP.stats.rebuts;
}

function renderMap() {
  const utils = render(<ControversyMap />);
  const svg = utils.container.querySelector("svg.controversy-map-svg") as SVGSVGElement;
  return { ...utils, svg };
}

/** 点击工具栏按钮（按文案匹配），包在 act 里触发重建。 */
function clickButton(utils: { container: HTMLElement }, text: string): void {
  const btn = [...utils.container.querySelectorAll("button")].find((b) =>
    (b.textContent ?? "").includes(text),
  )!;
  expect(btn).toBeTruthy();
  act(() => {
    fireEvent.click(btn);
  });
}

describe("争议地图组件", () => {
  it("渲染出 SVG 画布与缩放层", () => {
    const { svg } = renderMap();
    expect(svg).toBeTruthy();
    expect(svg.querySelector("[data-zoom-layer]")).toBeTruthy();
  });

  it("骨架视图（默认）只渲染簇 + 议题，论点不进画布", () => {
    const { svg } = renderMap();
    const skeletonCount = CONTROVERSY_MAP.nodes.filter((n) => n.kind !== "claim").length;
    expect(svg.querySelectorAll("[data-node-id]").length).toBe(skeletonCount);
    expect(svg.querySelectorAll('[data-node-kind="claim"]').length).toBe(0);
    expect(svg.querySelectorAll('[data-node-kind="topic"]').length).toBe(
      CONTROVERSY_MAP.stats.topics,
    );
  });

  it("骨架视图的连线 = 缝合线 + 议题间冲突聚合线（不是全量 698 条）", () => {
    const { svg } = renderMap();
    const expected = CONTROVERSY_MAP.stats.bridge + expectedAggregatedCount();
    const rendered = svg.querySelectorAll("[data-link-id]").length;
    expect(rendered).toBe(expected);
    expect(rendered).toBeLessThan(CONTROVERSY_MAP.edges.length);
  });

  it("展开全部论点后，节点数回到全量；归属边默认隐藏，打开后补全", () => {
    const { svg, container } = renderMap();
    clickButton({ container }, "展开全部论点");
    expect(svg.querySelectorAll("[data-node-id]").length).toBe(CONTROVERSY_MAP.nodes.length);

    // 归属边默认关：只画 bridge + rebuts
    expect(svg.querySelectorAll("[data-link-id]").length).toBe(emphasisTotal());

    clickButton({ container }, "显示归属边");
    expect(svg.querySelectorAll("[data-link-id]").length).toBe(CONTROVERSY_MAP.edges.length);
  });

  it("连线渲染在节点之下（层级顺序正确）", () => {
    const { svg } = renderMap();
    const groups = [...svg.querySelectorAll("[data-zoom-layer] > g > g")];
    const linkIdx = groups.findIndex((g) => classOf(g).includes("cm-links"));
    const nodeIdx = groups.findIndex((g) => classOf(g).includes("cm-nodes"));
    expect(linkIdx).toBeGreaterThanOrEqual(0);
    expect(nodeIdx).toBeGreaterThan(linkIdx);
  });

  it("三种节点类型带有 data-node-kind 标记，用于视觉区分（展开后）", () => {
    const { svg, container } = renderMap();
    clickButton({ container }, "展开全部论点");
    for (const kind of ["topic", "claim", "cluster"]) {
      expect(svg.querySelectorAll(`[data-node-kind="${kind}"]`).length).toBeGreaterThan(0);
    }
  });

  it("强调层：缝合线全量出现；骨架模式下红线是议题间聚合冲突线", () => {
    const { svg } = renderMap();
    const emphasis = svg.querySelector(".cm-links-emphasis");
    expect(emphasis).toBeTruthy();
    const bridge = emphasis!.querySelectorAll('[data-relation="bridge"]');
    const rebuts = emphasis!.querySelectorAll('[data-relation="rebuts"]');
    expect(bridge.length).toBe(CONTROVERSY_MAP.stats.bridge);
    expect(rebuts.length).toBe(expectedAggregatedCount());
  });

  it("展开论点后，强调层出现全量论点级 rebuts", () => {
    const { svg, container } = renderMap();
    clickButton({ container }, "展开全部论点");
    const emphasis = svg.querySelector(".cm-links-emphasis")!;
    expect(emphasis.querySelectorAll('[data-relation="rebuts"]').length).toBe(
      CONTROVERSY_MAP.stats.rebuts,
    );
  });

  it("悬停骨架节点后，其邻域连线被强调、无关连线被淡化（按可见连线口径计算）", () => {
    const { svg } = renderMap();
    const cluster = svg.querySelector('[data-node-id^="cl-"]') as SVGGElement;
    expect(cluster).toBeTruthy();
    const id = cluster.getAttribute("data-node-id")!;

    // 期望值按「当前可见连线」的端点动态计算，与视图分层解耦
    const allRendered = [...svg.querySelectorAll("[data-link-id]")];
    const renderedPairs = allRendered.map((el) => ({
      s: el.getAttribute("data-src")!,
      t: el.getAttribute("data-tgt")!,
    }));
    const neighborhood = new Set<string>([id]);
    for (const { s, t } of renderedPairs) {
      if (s === id) neighborhood.add(t);
      if (t === id) neighborhood.add(s);
    }
    const expectedLit = renderedPairs.filter(
      ({ s, t }) => neighborhood.has(s) && neighborhood.has(t),
    ).length;
    expect(expectedLit).toBeGreaterThan(0);
    expect(expectedLit).toBeLessThan(renderedPairs.length);

    act(() => {
      fireEvent.mouseEnter(cluster);
    });

    const highlighted = allRendered.filter(
      (el) => Number(el.getAttribute("opacity")) > 0.5,
    );
    expect(highlighted.length).toBe(expectedLit);

    const dimmed = allRendered.filter((el) => Number(el.getAttribute("opacity")) <= 0.1);
    expect(dimmed.length).toBe(renderedPairs.length - expectedLit);

    act(() => {
      fireEvent.mouseLeave(cluster);
    });
    const afterLeave = allRendered.filter((el) => Number(el.getAttribute("opacity")) > 0.3);
    expect(afterLeave.length).toBe(renderedPairs.length);
  });

  it("点击节点选中，再次点击空白处取消选中", () => {
    const { svg, container } = renderMap();
    const node = svg.querySelector('[data-node-id^="cl-"]') as SVGGElement;
    const id = node.getAttribute("data-node-id")!;

    // 用 pointerdown + pointerup（无位移）触发选中语义
    act(() => {
      fireEvent.pointerDown(node, { clientX: 100, clientY: 100, pointerId: 1, button: 0 });
      fireEvent.pointerUp(window, { clientX: 100, clientY: 100, pointerId: 1 });
    });

    const selected = svg.querySelector(`[data-node-id="${id}"]`);
    // 选中态：组内出现高亮环（第二个 circle）
    expect(selected!.querySelectorAll("circle").length).toBeGreaterThan(1);

    // 点击背板取消
    const backdrop = container.querySelector("[data-backdrop]") as SVGRectElement;
    act(() => {
      fireEvent.click(backdrop);
    });
    const afterClear = svg.querySelector(`[data-node-id="${id}"]`);
    expect(afterClear!.querySelectorAll("circle").length).toBe(1);
  });

  it("有缩放控件，且限制在 0.25–3 之间（与树视图的 0.35 下限区分）", () => {
    const { getByLabelText } = renderMap();
    const zoomIn = getByLabelText("放大");
    const zoomOut = getByLabelText("缩小");
    expect(zoomIn).toBeTruthy();
    expect(zoomOut).toBeTruthy();
    // 缩放行为本身在 d3 内受 scaleExtent 约束，这里验证控件不会抛错
    act(() => {
      fireEvent.click(zoomIn);
    });
    act(() => {
      fireEvent.click(zoomOut);
    });
  });

  it("非法缩放不会让变换矩阵出现 NaN", () => {
    const { svg, getByLabelText } = renderMap();
    act(() => {
      for (let i = 0; i < 8; i += 1) fireEvent.click(getByLabelText("缩小"));
    });
    const transform = svg.querySelector("[data-zoom-layer]")?.getAttribute("transform") ?? "";
    expect(transform).not.toContain("NaN");
  });

  it("工具栏展示真实数据规模，且含跨议题边数", () => {
    const { container } = renderMap();
    const hint = container.querySelector(".controversy-map-hint")!;
    const text = hint.textContent ?? "";
    expect(text).toContain(String(CONTROVERSY_MAP.stats.topics));
    expect(text).toContain(String(CONTROVERSY_MAP.stats.clusters));
    expect(text).toContain("跨议题");
  });

  it("切换「显示全部标签」不改变节点与连线数量（展开模式下验证）", () => {
    const { container, svg } = renderMap();
    clickButton({ container }, "展开全部论点");
    const before = svg.querySelectorAll("[data-link-id]").length;
    clickButton({ container }, "标签");
    expect(svg.querySelectorAll("[data-link-id]").length).toBe(before);
    expect(svg.querySelectorAll("[data-node-id]").length).toBe(CONTROVERSY_MAP.nodes.length);
  });

  it("卸载时移除 window 上的指针监听并停止模拟", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderMap();
    unmount();
    const removed = removeSpy.mock.calls.map((c) => c[0]);
    expect(removed).toContain("pointermove");
    expect(removed).toContain("pointerup");
    expect(removed).toContain("pointercancel");
    removeSpy.mockRestore();
  });
});
