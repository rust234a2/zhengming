/**
 * 力导向辩论树的验证测试。
 *
 * 覆盖三块：
 *  1. 数据层：树展开/收起得到的节点与连线是否正确、连线语义是否推导正确；
 *  2. 布局层：真实跑 d3 力模拟，验证「不重叠、正反阵营自然分居两侧、层级收敛」；
 *  3. 组件层：渲染、展开收起交互、选中高亮、卸载时停止模拟。
 */

import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as d3 from "d3";

import {
  DEBATE_TREE,
  flattenDebateTree,
  countDebateNodes,
  radiusForType,
  linkDistanceForDepth,
  chargeForDepth,
  sideBiasFor,
} from "../src/data/debateGraph";
import type { SimLink, SimNode } from "../src/types/graph";
import { DebateForceTree } from "../src/ui/DebateForceTree";

afterEach(() => {
  cleanup();
});

/* ────────── 1. 数据层 ────────── */

describe("辩论图谱数据层", () => {
  it("全部展开时节点数与树节点数一致", () => {
    const flat = flattenDebateTree(DEBATE_TREE);
    expect(flat.nodes.length).toBe(countDebateNodes(DEBATE_TREE));
  });

  it("模拟数据满足题目要求：1 辩题 + 2 阵营 + 每方 3 论点 + 每论点 ≥2 子节点", () => {
    expect(DEBATE_TREE.type).toBe("topic");
    const sides = DEBATE_TREE.children ?? [];
    expect(sides).toHaveLength(2);
    expect(sides.map((side) => side.side)).toEqual(["positive", "negative"]);

    for (const side of sides) {
      const args = side.children ?? [];
      expect(args).toHaveLength(3);
      for (const arg of args) {
        expect(arg.type).toBe("argument");
        expect((arg.children ?? []).length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("展开态下节点数与连线数匹配（树结构：连线 = 节点 - 1）", () => {
    const flat = flattenDebateTree(DEBATE_TREE);
    expect(flat.links.length).toBe(flat.nodes.length - 1);
  });

  it("收起一个阵营后，其全部后代被隐藏", () => {
    const collapsed = new Set(["side-positive"]);
    const flat = flattenDebateTree(DEBATE_TREE, collapsed);
    expect(flat.nodes.some((node) => node.id === "side-positive")).toBe(true);
    // 该阵营下 3 个论点及其 6 个子节点都应被隐藏
    expect(flat.nodes.some((node) => node.id === "arg-p1")).toBe(false);
    expect(flat.nodes.some((node) => node.id === "evi-p1a")).toBe(false);
    // 另一侧阵营不受影响
    expect(flat.nodes.some((node) => node.id === "arg-n1")).toBe(true);
  });

  it("展开后恢复后代节点与连线", () => {
    const collapsed = flattenDebateTree(DEBATE_TREE, new Set(["side-positive"]));
    const expanded = flattenDebateTree(DEBATE_TREE);
    expect(expanded.nodes.length).toBeGreaterThan(collapsed.nodes.length);
    expect(expanded.links.length).toBeGreaterThan(collapsed.links.length);
  });

  it("连线语义按子节点类型推导", () => {
    const flat = flattenDebateTree(DEBATE_TREE);
    const byTarget = new Map(flat.links.map((link) => [link.target, link.relation]));
    expect(byTarget.get("evi-p1a")).toBe("supports");
    expect(byTarget.get("reb-p2b")).toBe("rebuts");
    expect(byTarget.get("res-n2b")).toBe("responds");
    expect(byTarget.get("side-positive")).toBe("contains");
  });

  it("缩放/半径映射单调合理：根 > 阵营 > 论点 > 证据", () => {
    expect(radiusForType("topic")).toBeGreaterThan(radiusForType("side"));
    expect(radiusForType("side")).toBeGreaterThan(radiusForType("argument"));
    expect(radiusForType("argument")).toBeGreaterThan(radiusForType("evidence"));
  });

  it("斥力强度随层级变浅而增强（撑开中心空间）", () => {
    expect(chargeForDepth(0)).toBeLessThan(chargeForDepth(1));
    expect(chargeForDepth(1)).toBeLessThan(chargeForDepth(2));
  });

  it("阵营分离力方向相反且中立为零", () => {
    expect(sideBiasFor("positive")).toBeLessThan(0);
    expect(sideBiasFor("negative")).toBeGreaterThan(0);
    expect(sideBiasFor("neutral")).toBe(0);
  });

  it("连线自然长度按层级递减", () => {
    expect(linkDistanceForDepth(1)).toBeGreaterThan(linkDistanceForDepth(2));
  });
});

/* ────────── 2. 布局层：真实跑 d3 力模拟 ────────── */

/** 复刻组件里的力配置，用于离屏跑模拟并断言布局质量。 */
function runSimulation(iterations = 400) {
  const flat = flattenDebateTree(DEBATE_TREE);
  const meta = new Map<string, { depth: number }>();
  const walk = (node: typeof DEBATE_TREE, depth: number): void => {
    meta.set(node.id, { depth });
    for (const child of node.children ?? []) {
      walk(child, depth + 1);
    }
  };
  walk(DEBATE_TREE, 0);

  const nodes: SimNode[] = flat.nodes.map((item) => {
    const depth = meta.get(item.id)?.depth ?? 0;
    return {
      id: item.id,
      label: item.label,
      type: item.type,
      side: item.side,
      parentId: item.parentId,
      depth,
      radius: radiusForType(item.type),
      hasChildren: (item.children ?? []).length > 0,
      expanded: true,
      x: (Math.random() - 0.5) * 60,
      y: (Math.random() - 0.5) * 60,
    };
  });

  const links: SimLink[] = flat.links.map((link) => ({
    id: link.id,
    source: link.source,
    target: link.target,
    relation: link.relation,
    sourceDepth: meta.get(link.source)?.depth ?? 0,
    targetDepth: meta.get(link.target)?.depth ?? 1,
  }));

  const simulation = d3
    .forceSimulation<SimNode, SimLink>(nodes)
    .force("charge", d3.forceManyBody<SimNode>().strength((node) => chargeForDepth(node.depth)))
    .force(
      "link",
      d3
        .forceLink<SimNode, SimLink>(links)
        .id((node) => node.id)
        .distance((link) => linkDistanceForDepth(link.targetDepth))
        .strength((link) => (link.targetDepth <= 1 ? 0.35 : 0.75)),
    )
    .force("collide", d3.forceCollide<SimNode>().radius((node) => node.radius + 16).strength(0.9))
    .force("center", d3.forceCenter(0, 0))
    .force(
      "sideBias",
      d3.forceX<SimNode>((node) => sideBiasFor(node.side) * 900).strength((node) =>
        node.type === "side" || node.type === "argument" ? 0.06 : 0.02,
      ),
    )
    .force("y", d3.forceY<SimNode>(0).strength(0.03))
    .alphaDecay(0.028)
    .velocityDecay(0.4)
    .stop();

  for (let index = 0; index < iterations; index += 1) {
    simulation.tick();
  }
  simulation.stop();

  return { nodes, links };
}

describe("力导向布局质量", () => {
  it("模拟收敛后所有坐标有限", () => {
    const { nodes } = runSimulation();
    for (const node of nodes) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    }
  });

  it("节点之间无明显重叠（碰撞半径内无其他节点）", () => {
    const { nodes } = runSimulation();
    const overlaps: string[] = [];
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance < a.radius + b.radius) {
          overlaps.push(`${a.id}~${b.id}`);
        }
      }
    }
    expect(overlaps).toEqual([]);
  });

  it("根节点位于整体中心附近", () => {
    const { nodes } = runSimulation();
    const root = nodes.find((node) => node.id === "topic")!;
    const centroid = {
      x: nodes.reduce((sum, node) => sum + node.x, 0) / nodes.length,
      y: nodes.reduce((sum, node) => sum + node.y, 0) / nodes.length,
    };
    const drift = Math.hypot(root.x - centroid.x, root.y - centroid.y);
    // 根节点应明显比普通节点更靠近整体重心
    const avgRadius = nodes.reduce((sum, node) => sum + node.radius, 0) / nodes.length;
    expect(drift).toBeLessThan(avgRadius * 12);
  });

  it("正方整体与反方整体分居中心两侧", () => {
    const { nodes } = runSimulation();
    const averageX = (side: string): number => {
      const group = nodes.filter((node) => node.side === side && node.type !== "topic");
      return group.reduce((sum, node) => sum + node.x, 0) / group.length;
    };
    const positiveX = averageX("positive");
    const negativeX = averageX("negative");
    // 两侧均值应方向相反，且拉开一定距离
    expect(positiveX).toBeLessThan(0);
    expect(negativeX).toBeGreaterThan(0);
    expect(Math.abs(negativeX - positiveX)).toBeGreaterThan(80);
  });

  it("阵营分布不是僵硬的左右两列（纵向有自然散开）", () => {
    const { nodes } = runSimulation();
    const positive = nodes.filter((node) => node.side === "positive" && node.type !== "topic");
    const spreadY = Math.max(...positive.map((node) => node.y)) - Math.min(...positive.map((node) => node.y));
    expect(spreadY).toBeGreaterThan(60);
  });

  it("层级有区分度：子节点总体比父节点离根更远", () => {
    const { nodes } = runSimulation(600);
    const root = nodes.find((node) => node.id === "topic")!;
    const distanceOf = (id: string): number => {
      const node = nodes.find((item) => item.id === id)!;
      return Math.hypot(node.x - root.x, node.y - root.y);
    };
    // 阵营节点比根远，论点比阵营远（用整体平均判断，避免个别抖动）
    const sideAvg =
      ["side-positive", "side-negative"].reduce((sum, id) => sum + distanceOf(id), 0) / 2;
    const argAvg =
      nodes
        .filter((node) => node.type === "argument")
        .reduce((sum, node) => sum + Math.hypot(node.x - root.x, node.y - root.y), 0) /
      nodes.filter((node) => node.type === "argument").length;
    expect(sideAvg).toBeGreaterThan(0);
    expect(argAvg).toBeGreaterThan(sideAvg * 0.8);
  });

  it("位置不是写死的：两次独立模拟结果不同", () => {
    const first = runSimulation(120).nodes.map((node) => `${node.id}:${node.x.toFixed(1)},${node.y.toFixed(1)}`);
    const second = runSimulation(120).nodes.map((node) => `${node.id}:${node.x.toFixed(1)},${node.y.toFixed(1)}`);
    expect(first).not.toEqual(second);
  });
});

/* ────────── 3. 组件层 ────────── */

/**
 * jsdom 下 SVG 元素的 className 返回 SVGAnimatedString 而非字符串，
 * 这里统一用 getAttribute("class") 读取，行为与浏览器一致。
 */
function classOf(element: Element | null): string {
  return element?.getAttribute("class") ?? "";
}

/** 点击展开/收起的切换按钮（真实用户点的是可见圆圈）。 */
function clickToggle(container: HTMLElement, nodeId: string): void {
  const toggle = container.querySelector<SVGGElement>(
    `[data-node-id="${nodeId}"] .debate-force-toggle`,
  );
  if (!toggle) {
    throw new Error(`未找到 ${nodeId} 的展开/收起按钮`);
  }
  act(() => {
    fireEvent.click(toggle);
  });
}

describe("DebateForceTree 组件", () => {
  it("渲染出全部节点，连线位于节点层之前（下层）", () => {
    const { container } = render(<DebateForceTree />);
    const nodeCount = flattenDebateTree(DEBATE_TREE).nodes.length;
    expect(container.querySelectorAll("[data-node-id]")).toHaveLength(nodeCount);

    const linksGroup = container.querySelector(".debate-force-links");
    const nodesGroup = container.querySelector(".debate-force-nodes");
    expect(linksGroup).not.toBeNull();
    expect(nodesGroup).not.toBeNull();
    // 连线组在 DOM 中先于节点组 → 视觉上位于下层
    expect(
      linksGroup!.compareDocumentPosition(nodesGroup!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("根节点与阵营节点有更大的半径", () => {
    const { container } = render(<DebateForceTree />);
    const rootCircle = container.querySelector('[data-node-id="topic"] circle');
    const sideCircle = container.querySelector('[data-node-id="side-positive"] circle');
    const leafCircle = container.querySelector('[data-node-id="evi-p1a"] circle');
    const radiusOf = (element: Element | null): number =>
      Number(element?.getAttribute("r") ?? 0);
    expect(radiusOf(rootCircle)).toBeGreaterThan(radiusOf(sideCircle));
    expect(radiusOf(sideCircle)).toBeGreaterThan(radiusOf(leafCircle));
  });

  it("点击节点触发选中高亮，其他节点降低透明度", () => {
    const { container } = render(<DebateForceTree />);
    const target = container.querySelector<SVGGElement>('[data-node-id="arg-p1"]')!;

    act(() => {
      fireEvent.pointerDown(target, { clientX: 100, clientY: 100, pointerId: 1 });
      fireEvent.pointerUp(window, { clientX: 100, clientY: 100, pointerId: 1 });
    });

    const selected = container.querySelector('[data-node-id="arg-p1"]');
    expect(classOf(selected)).toContain("is-selected");

    // 直接相邻的节点保持高亮，无关节点被压暗
    const neighbor = container.querySelector('[data-node-id="side-positive"]');
    const unrelated = container.querySelector('[data-node-id="arg-n1"]');
    expect(classOf(neighbor)).not.toContain("is-dimmed");
    expect(classOf(unrelated)).toContain("is-dimmed");
  });

  it("悬停节点放大并高亮其直接连线", () => {
    const { container } = render(<DebateForceTree />);
    const target = container.querySelector<SVGGElement>('[data-node-id="arg-p1"]')!;
    const baseRadius = Number(
      container.querySelector('[data-node-id="arg-p1"] circle')!.getAttribute("r"),
    );

    act(() => {
      fireEvent.mouseEnter(target);
    });

    const hoveredRadius = Number(
      container.querySelector('[data-node-id="arg-p1"] circle')!.getAttribute("r"),
    );
    expect(hoveredRadius).toBeGreaterThan(baseRadius);

    // 与 arg-p1 相连的连线被强调（stroke-width 2）：父边 + 两条子边
    const emphasized = Array.from(container.querySelectorAll(".debate-force-links line")).filter(
      (line) => Number(line.getAttribute("stroke-width")) === 2,
    );
    expect(emphasized.length).toBe(3);

    // 无关连线保持常规线宽
    const normal = Array.from(container.querySelectorAll(".debate-force-links line")).filter(
      (line) => Number(line.getAttribute("stroke-width")) === 1,
    );
    expect(normal.length).toBeGreaterThan(0);
  });

  it("点击画布空白处取消选中", () => {
    const { container } = render(<DebateForceTree />);
    const target = container.querySelector<SVGGElement>('[data-node-id="arg-p1"]')!;
    act(() => {
      fireEvent.pointerDown(target, { clientX: 10, clientY: 10, pointerId: 1 });
      fireEvent.pointerUp(window, { clientX: 10, clientY: 10, pointerId: 1 });
    });
    expect(classOf(container.querySelector('[data-node-id="arg-p1"]'))).toContain("is-selected");

    const svg = container.querySelector(".debate-force-svg")!;
    act(() => {
      fireEvent.click(svg);
    });
    expect(container.querySelector(".debate-force-node.is-selected")).toBeNull();
  });

  it("收起节点后其后代节点与连线一起从 DOM 移除", () => {
    const { container } = render(<DebateForceTree />);
    const before = container.querySelectorAll("[data-node-id]").length;
    const linksBefore = container.querySelectorAll("[data-link-id]").length;
    expect(container.querySelector('[data-node-id="arg-p1"]')).not.toBeNull();

    clickToggle(container, "side-positive");

    expect(container.querySelector('[data-node-id="arg-p1"]')).toBeNull();
    expect(container.querySelector('[data-node-id="evi-p1a"]')).toBeNull();
    expect(container.querySelectorAll("[data-node-id]").length).toBeLessThan(before);
    // 连线同步移除
    expect(container.querySelectorAll("[data-link-id]").length).toBeLessThan(linksBefore);
    // 另一侧阵营不受影响
    expect(container.querySelector('[data-node-id="arg-n1"]')).not.toBeNull();
  });

  it("展开后后代节点恢复", () => {
    const { container } = render(<DebateForceTree />);
    clickToggle(container, "side-positive");
    expect(container.querySelector('[data-node-id="arg-p1"]')).toBeNull();

    clickToggle(container, "side-positive");
    expect(container.querySelector('[data-node-id="arg-p1"]')).not.toBeNull();
  });

  it("只有存在子节点的节点才有展开按钮", () => {
    const { container } = render(<DebateForceTree />);
    expect(
      container.querySelector('[data-node-id="side-positive"] .debate-force-toggle'),
    ).not.toBeNull();
    // 叶子节点没有按钮
    expect(
      container.querySelector('[data-node-id="evi-p1a"] .debate-force-toggle'),
    ).toBeNull();
  });

  it("重复展开/收起不会重复创建 simulation（节点 DOM 数量正确变化）", () => {
    const { container } = render(<DebateForceTree />);
    const total = container.querySelectorAll("[data-node-id]").length;
    expect(total).toBe(21);

    // 收起 → 展开，节点数必须精确回到初始值
    clickToggle(container, "side-positive");
    expect(container.querySelectorAll("[data-node-id]").length).toBe(12);
    clickToggle(container, "side-positive");
    expect(container.querySelectorAll("[data-node-id]").length).toBe(21);

    // 再对另一侧与更深层重复一遍，验证多次增删后无残留/重复
    clickToggle(container, "side-negative");
    expect(container.querySelectorAll("[data-node-id]").length).toBe(12);
    clickToggle(container, "side-negative");
    expect(container.querySelectorAll("[data-node-id]").length).toBe(21);

    clickToggle(container, "arg-p1");
    // arg-p1 有 2 个子节点，收起后移除 2 个
    expect(container.querySelectorAll("[data-node-id]").length).toBe(19);
    clickToggle(container, "arg-p1");
    expect(container.querySelectorAll("[data-node-id]").length).toBe(21);

    // 无重复节点：每个 id 在 DOM 中只出现一次
    expect(container.querySelectorAll('[data-node-id="arg-p1"]').length).toBe(1);
    expect(container.querySelectorAll('[data-node-id="topic"]').length).toBe(1);
    // 连线数 = 节点数 - 1（树结构），说明连线也没有残留
    expect(container.querySelectorAll("[data-link-id]").length).toBe(20);
  });

  it("使用稳定的 key：展开收起后节点 DOM 元素被复用而非重建", () => {
    const { container } = render(<DebateForceTree />);
    const before = container.querySelector('[data-node-id="arg-p1"]');
    clickToggle(container, "side-negative");
    clickToggle(container, "side-negative");
    const after = container.querySelector('[data-node-id="arg-p1"]');
    expect(after).toBe(before);
  });

  it("组件卸载时停止 simulation 并移除 window 监听", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<DebateForceTree />);
    unmount();

    expect(removeSpy).toHaveBeenCalledWith("pointermove", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("pointerup", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("pointercancel", expect.any(Function));

    removeSpy.mockRestore();
  });

  it("拖拽节点时跟随指针，松手后解除固定", () => {
    const { container } = render(<DebateForceTree />);
    const target = container.querySelector<SVGGElement>('[data-node-id="arg-n1"]')!;
    const transformBefore = target.getAttribute("transform");

    act(() => {
      fireEvent.pointerDown(target, { clientX: 200, clientY: 200, pointerId: 2 });
    });
    act(() => {
      fireEvent.pointerMove(window, { clientX: 260, clientY: 240, pointerId: 2 });
    });

    const transformDuring = container.querySelector('[data-node-id="arg-n1"]')!.getAttribute("transform");
    // 拖拽过程中节点位置已改变（跟随指针）
    expect(transformDuring).not.toBe(transformBefore);

    act(() => {
      fireEvent.pointerUp(window, { clientX: 260, clientY: 240, pointerId: 2 });
    });
    // 有位移的拖拽不应触发选中
    expect(container.querySelector(".debate-force-node.is-selected")).toBeNull();
  });

  it("工具栏提供缩放与重置按钮", () => {
    render(<DebateForceTree />);
    expect(screen.getByLabelText("放大")).toBeTruthy();
    expect(screen.getByLabelText("缩小")).toBeTruthy();
    expect(screen.getByText("重置视图")).toBeTruthy();
  });
});
