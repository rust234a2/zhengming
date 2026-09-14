/**
 * 辩论图谱的模拟数据：1 个辩题 + 正反两个阵营 + 每方 3 个核心论点 + 每论点 ≥2 个子节点。
 *
 * 这里同时提供树形结构（用于展开/收起）与展开后的扁平结构。
 */

import type { DebateLink, DebateNode } from "../types/graph";

/* ────────── 树形数据（单一事实来源） ────────── */

export const DEBATE_TREE: DebateNode = {
  id: "topic",
  label: "AI 是否会取代程序员？",
  type: "topic",
  side: "neutral",
  children: [
    {
      id: "side-positive",
      label: "正方 · 会取代",
      type: "side",
      side: "positive",
      parentId: "topic",
      children: [
        {
          id: "arg-p1",
          label: "重复性编码工作已可被自动完成",
          type: "argument",
          side: "positive",
          parentId: "side-positive",
          children: [
            {
              id: "evi-p1a",
              label: "大模型可稳定生成 CRUD 与样板代码",
              type: "evidence",
              side: "positive",
              parentId: "arg-p1",
            },
            {
              id: "evi-p1b",
              label: "代码补全工具已进入主流 IDE 工作流",
              type: "evidence",
              side: "positive",
              parentId: "arg-p1",
            },
          ],
        },
        {
          id: "arg-p2",
          label: "开发效率提升会压缩岗位总量",
          type: "argument",
          side: "positive",
          parentId: "side-positive",
          children: [
            {
              id: "evi-p2a",
              label: "同等需求下所需人数随效率线性下降",
              type: "evidence",
              side: "positive",
              parentId: "arg-p2",
            },
            {
              id: "reb-p2b",
              label: "反驳：效率提升也会创造新需求",
              type: "rebuttal",
              side: "negative",
              parentId: "arg-p2",
            },
          ],
        },
        {
          id: "arg-p3",
          label: "代码审查与测试环节最先被替代",
          type: "argument",
          side: "positive",
          parentId: "side-positive",
          children: [
            {
              id: "evi-p3a",
              label: "静态分析与自动测试已高度成熟",
              type: "evidence",
              side: "positive",
              parentId: "arg-p3",
            },
            {
              id: "evi-p3b",
              label: "审查规则的显式程度高于架构设计",
              type: "evidence",
              side: "positive",
              parentId: "arg-p3",
            },
          ],
        },
      ],
    },
    {
      id: "side-negative",
      label: "反方 · 不会取代",
      type: "side",
      side: "negative",
      parentId: "topic",
      children: [
        {
          id: "arg-n1",
          label: "需求本身的模糊性无法被自动消解",
          type: "argument",
          side: "negative",
          parentId: "side-negative",
          children: [
            {
              id: "evi-n1a",
              label: "真实需求常在迭代中被重新定义",
              type: "evidence",
              side: "negative",
              parentId: "arg-n1",
            },
            {
              id: "evi-n1b",
              label: "跨部门协商需要承担责任的角色",
              type: "evidence",
              side: "negative",
              parentId: "arg-n1",
            },
          ],
        },
        {
          id: "arg-n2",
          label: "系统复杂度增长快于工具能力增长",
          type: "argument",
          side: "negative",
          parentId: "side-negative",
          children: [
            {
              id: "evi-n2a",
              label: "分布式与遗留系统的耦合难以形式化",
              type: "evidence",
              side: "negative",
              parentId: "arg-n2",
            },
            {
              id: "res-n2b",
              label: "回应：AI 可辅助定位复杂度热点",
              type: "response",
              side: "positive",
              parentId: "arg-n2",
            },
          ],
        },
        {
          id: "arg-n3",
          label: "责任归属要求人类保留最终决策",
          type: "argument",
          side: "negative",
          parentId: "side-negative",
          children: [
            {
              id: "evi-n3a",
              label: "线上事故需要可追责的决策主体",
              type: "evidence",
              side: "negative",
              parentId: "arg-n3",
            },
            {
              id: "evi-n3b",
              label: "合规与审计要求决策链路可解释",
              type: "evidence",
              side: "negative",
              parentId: "arg-n3",
            },
          ],
        },
      ],
    },
  ],
};

/* ────────── 从树形数据展开为图谱所需的扁平结构 ────────── */

export interface FlatDebateGraph {
  nodes: DebateNode[];
  links: DebateLink[];
}

/**
 * 按「展开态」把树展开成扁平节点 + 连线。
 * @param collapsedIds 处于收起态的节点 id（其余默认展开）
 */
export function flattenDebateTree(
  root: DebateNode = DEBATE_TREE,
  collapsedIds: ReadonlySet<string> = new Set(),
): FlatDebateGraph {
  const nodes: DebateNode[] = [];
  const links: DebateLink[] = [];

  const walk = (node: DebateNode, depth: number): void => {
    nodes.push(node);
    if (collapsedIds.has(node.id)) {
      return;
    }
    for (const child of node.children ?? []) {
      links.push({
        id: `${node.id}->${child.id}`,
        source: node.id,
        target: child.id,
        relation: relationFor(node, child),
      });
      walk(child, depth + 1);
    }
  };

  walk(root, 0);
  return { nodes, links };
}

/** 依据子节点类型推导连线语义。 */
function relationFor(parent: DebateNode, child: DebateNode): DebateLink["relation"] {
  if (child.type === "rebuttal") {
    return "rebuts";
  }
  if (child.type === "response") {
    return "responds";
  }
  if (child.type === "argument" || child.type === "evidence") {
    return "supports";
  }
  return "contains";
}

/** 统计树中所有节点数量（含已收起分支）。 */
export function countDebateNodes(root: DebateNode = DEBATE_TREE): number {
  return 1 + (root.children ?? []).reduce((sum, child) => sum + countDebateNodes(child), 0);
}

/* ────────── 视觉映射 ────────── */

/** 依节点类型决定半径，根 > 阵营 > 论点 > 证据/回应。 */
export function radiusForType(type: DebateNode["type"]): number {
  switch (type) {
    case "topic":
      return 26;
    case "side":
      return 19;
    case "argument":
      return 11;
    default:
      return 7.5;
  }
}

/** 依深度决定 d3 的连线自然长度。 */
export function linkDistanceForDepth(depth: number): number {
  if (depth <= 1) {
    return 190;
  }
  return 108;
}

/** 依深度决定 d3 的斥力强度（越靠近根，斥力越大以撑开空间）。 */
export function chargeForDepth(depth: number): number {
  if (depth === 0) {
    return -820;
  }
  if (depth === 1) {
    return -420;
  }
  return -190;
}

/** 阵营节点轻微外推的目标 x 偏移（相对画布中心的比例）。 */
export function sideBiasFor(side: DebateNode["side"]): number {
  if (side === "positive") {
    return -0.16;
  }
  if (side === "negative") {
    return 0.16;
  }
  return 0;
}
