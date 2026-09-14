/**
 * 辩论树的纯决策层：节点遍历、种子 → 树的转换、三派统计、议题库分组与检索。
 *
 * 全部是纯函数，不碰 DOM 与 React，便于单测守住规则。DOM 相关的
 * localStorage / URL 参数在 `debateTreeStorage.ts`，组件只负责接线。
 */

import type {
  DebateTreeSeed,
  DebateTreeNode,
  SeedTier,
  Stance,
  ViewerVote,
} from "../types/debateTree";

/* ═══════════════ 常量 ═══════════════ */

/** 三派在界面上的固定排列顺序：支持 → 看条件 → 反对（与统计条同序） */
export const STANCE_ORDER: readonly Stance[] = ["pro", "neutral", "con"] as const;

/** PRD 里 neutral 的界面名是「看条件」，代码里是 neutral —— 只此一处映射 */
export const STANCE_LABEL: Record<Stance, string> = {
  pro: "支持",
  con: "反对",
  neutral: "看条件",
};

export const TIER_LABEL: Record<SeedTier, string> = {
  claims: "有真实论点",
  answers: "有真实回答",
  question: "仅题干",
};

export const TIER_HINT: Record<SeedTier, string> = {
  claims: "一级论点由立场抽取管线产出，作者、赞同数、原文链接齐备，可直接辩。",
  answers: "只采到真实回答摘要、未做论点抽取：立场归属未经标注，因此不冒充一级论点，仅并列展示。",
  question: "题干已过语料门禁，但还没有真实论点——留着等第一位参与者立论。",
};

/** 最大簇占比超过它即提示失衡（PRD F3：严格大于 70%） */
export const IMBALANCE_THRESHOLD = 0.7;

/* ═══════════════ 树的遍历与改写（纯函数） ═══════════════ */

export function walkTree(node: DebateTreeNode, visit: (target: DebateTreeNode) => void): void {
  visit(node);
  for (const child of node.children) walkTree(child, visit);
}

export function findNode(tree: DebateTreeNode, id: string): DebateTreeNode | null {
  if (tree.id === id) return tree;
  for (const child of tree.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

/** 从根到目标节点的 id 路径（含两端）；找不到返回 null */
export function findPath(tree: DebateTreeNode, id: string, trail: string[] = []): string[] | null {
  const next = [...trail, tree.id];
  if (tree.id === id) return next;
  for (const child of tree.children) {
    const found = findPath(child, id, next);
    if (found) return found;
  }
  return null;
}

export function updateNode(
  tree: DebateTreeNode,
  id: string,
  update: (target: DebateTreeNode) => DebateTreeNode,
): DebateTreeNode {
  if (tree.id === id) return update(tree);
  return { ...tree, children: tree.children.map((child) => updateNode(child, id, update)) };
}

/** 节点的三派归属；root 返回 null（它不属于任何一派） */
export function stanceOf(node: DebateTreeNode): Stance | null {
  return node.type === "root" ? null : (node.stance as Stance);
}

/* ═══════════════ 种子 → 树 ═══════════════ */

export function claimNodeId(seedId: string, claimId: string): string {
  return `${seedId}:${claimId}`;
}

export function rootNodeId(seedId: string): string {
  return `${seedId}:root`;
}

/**
 * 把一条真实议题种成树：root 是议题本身，第一层是语料里真实的论点。
 *
 * 排序：先按三派固定顺序（支持 → 看条件 → 反对），派内按**知乎真实赞同数**降序。
 * 这不是「按票数排序」——平台票还没开始投，这里排的是来源热度，且数值本身就摆在
 * 卡片上，不存在把热度藏起来再偷偷排序的问题。
 *
 * 平台投票一律从 0 起：种子里的知乎赞同数只在 `source.voteUp` 上展示，
 * 绝不写进 `votes`，否则统计条会用不存在的票算占比。
 */
export function buildTreeFromSeed(seed: DebateTreeSeed): DebateTreeNode {
  const claims = seed.claims
    .slice()
    .sort((a, b) => {
      const order = STANCE_ORDER.indexOf(a.stance) - STANCE_ORDER.indexOf(b.stance);
      return order !== 0 ? order : b.voteUp - a.voteUp;
    })
    .map<DebateTreeNode>((claim) => ({
      id: claimNodeId(seed.id, claim.id),
      type: "claim",
      stance: claim.stance,
      text: claim.text,
      author: claim.author,
      authorBadge: claim.authorBadge,
      source: { url: claim.url, quote: claim.quote, voteUp: claim.voteUp },
      votes: { up: 0, down: 0 },
      viewerVote: null,
      children: [],
    }));

  return {
    id: rootNodeId(seed.id),
    type: "root",
    stance: "root",
    text: seed.title,
    source: { url: seed.url, quote: "" },
    provenanceNote: seed.note,
    votes: { up: 0, down: 0 },
    viewerVote: null,
    children: claims,
  };
}

/* ═══════════════ 三派统计 ═══════════════ */

export interface TreeStats {
  counts: Record<Stance, number> & { question: number };
  /** 三派节点总数（不含追问） */
  total: number;
  /** 最大簇占比，0–1 */
  maxShare: number;
  /** 最大簇占比 > 70% 时提示失衡，引导补反方立场 */
  imbalanced: boolean;
}

export function treeStats(tree: DebateTreeNode): TreeStats {
  const counts = { pro: 0, con: 0, neutral: 0, question: 0 };
  walkTree(tree, (node) => {
    if (node.type === "question") counts.question += 1;
    else if (node.stance !== "root") counts[node.stance as Stance] += 1;
  });
  const total = counts.pro + counts.con + counts.neutral;
  const max = Math.max(counts.pro, counts.con, counts.neutral);
  const maxShare = total > 0 ? max / total : 0;
  return { counts, total, maxShare, imbalanced: total > 0 && maxShare > IMBALANCE_THRESHOLD };
}

export function maxShareText(stats: TreeStats): string {
  return `${Math.round(stats.maxShare * 100)}%`;
}

/* ═══════════════ 议题库 ═══════════════ */

export interface SeedBadge {
  label: string;
  tone: SeedTier | "clusters";
}

/** 议题卡片上的徽标：数量全部来自语料，不做估算 */
export function seedBadges(seed: DebateTreeSeed): SeedBadge[] {
  const badges: SeedBadge[] = [];
  if (seed.claims.length) badges.push({ label: `${seed.claims.length} 条真实论点`, tone: "claims" });
  if (seed.answerSamples.length) badges.push({ label: `${seed.answerSamples.length} 条真实回答`, tone: "answers" });
  if (seed.clusterMeta) badges.push({ label: `${seed.clusterMeta.valid} 条已归类`, tone: "clusters" });
  if (!seed.claims.length && !seed.answerSamples.length) badges.push({ label: "仅题干", tone: "question" });
  return badges;
}

export interface SeedGroup {
  tier: SeedTier;
  label: string;
  hint: string;
  items: DebateTreeSeed[];
}

/** 按溯源通道分组，档位顺序固定：有论点 → 有回答 → 仅题干 */
export function groupSeeds(seeds: readonly DebateTreeSeed[]): SeedGroup[] {
  const tiers: SeedTier[] = ["claims", "answers", "question"];
  return tiers
    .map((tier) => ({
      tier,
      label: TIER_LABEL[tier],
      hint: TIER_HINT[tier],
      items: seeds.filter((seed) => seed.tier === tier),
    }))
    .filter((group) => group.items.length > 0);
}

/** 关键词检索：题干、真实答主、理由类型都参与匹配 */
export function seedMatchesQuery(seed: DebateTreeSeed, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    seed.title,
    ...seed.claims.map((claim) => claim.author),
    ...seed.claims.map((claim) => claim.reasonType),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

/* ═══════════════ 展示辅助 ═══════════════ */

export function sourceVoteText(node: DebateTreeNode): string {
  const voteUp = node.source?.voteUp;
  return typeof voteUp === "number" ? `知乎 ${voteUp} 赞` : "";
}

export function shortText(text: string, limit = 42): string {
  const trimmed = text.trim();
  return trimmed.length > limit ? `${trimmed.slice(0, limit)}…` : trimmed;
}

/* ═══════════════ 投票（本地先行，服务端化前只改本地树） ═══════════════ */

/**
 * 单节点单用户一票，可改向不可叠加。
 * 点同一方向取消该票；点反方向先撤旧票再记新票。
 */
export function applyVote(
  node: DebateTreeNode,
  direction: Exclude<ViewerVote, null>,
): DebateTreeNode {
  if (!node.votes) return node;
  const votes = { ...node.votes };

  if (node.viewerVote === direction) {
    votes[direction] -= 1;
    return { ...node, votes, viewerVote: null };
  }

  if (node.viewerVote) votes[node.viewerVote] -= 1;
  votes[direction] += 1;
  return { ...node, votes, viewerVote: direction };
}
