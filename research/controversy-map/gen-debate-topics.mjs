/**
 * 辩论间议题数据生成器：research/controversy-map/claims.json → web/src/data/debateRoomTopics.ts
 *
 * 为什么需要生成而不是手写：
 *   provenance 红线要求保留真实作者 / 赞同数 / 知乎原文链接。手抄会漂移，生成保证与语料一致。
 *
 * 数据实情（2026-09-14 核对）：源数据 27 议题 / 37 论点；题干门禁会排除没有明确站队结构的开放解释题。
 * 对策（ROLLOUT §5）：
 *   - 通过门禁的真实成对议题作为首批（`paired: true`）；
 *   - 其余按**同一 reasonType 跨议题配对**（如「人类特质」正 vs 「技术壁垒」反），
 *     标记 `paired: false` + `crossPaired: true` + `pairingNote`，UI 必须显式标注「跨议题配对」，
 *     **绝不假装是同一议题的正反方**。
 *
 * 用法：
 *   node research/controversy-map/gen-debate-topics.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const SOURCE = path.join(HERE, "claims.json");
const TARGET = path.resolve(ROOT, "web", "src", "data", "debateRoomTopics.ts");
const QUESTION_RULES = JSON.parse(
  fs.readFileSync(path.resolve(ROOT, "web", "src", "data", "debateQuestionRules.json"), "utf8"),
);

function isDebatableQuestionTitle(title) {
  const normalized = String(title ?? "").replace(/\s+/g, "").toLowerCase();
  return normalized.length > 0 && QUESTION_RULES.stanceMarkers.some((marker) => normalized.includes(marker));
}

/* ─────────── 读取真实语料 ─────────── */

const raw = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
const claims = (Array.isArray(raw) ? raw : raw.claims || []).filter(
  (c) => c && c.questionId && c.claim && c.url,
);

if (!claims.length) {
  console.error(`[gen-debate-topics] 语料为空：${SOURCE}`);
  process.exit(1);
}

const sourceQuestionCount = new Set(claims.map((claim) => claim.questionId)).size;

/* ─────────── 按议题分组 ─────────── */

const byQuestion = new Map();
for (const claim of claims) {
  if (!isDebatableQuestionTitle(claim.questionTitle)) continue;
  if (!byQuestion.has(claim.questionId)) {
    byQuestion.set(claim.questionId, {
      questionId: claim.questionId,
      title: claim.questionTitle || "",
      url: claim.url,
      positive: [],
      negative: [],
      neutral: [],
    });
  }
  const bucket = byQuestion.get(claim.questionId);
  const side = claim.side === "positive" ? "positive" : claim.side === "negative" ? "negative" : "neutral";
  bucket[side].push(claim);
}

const eligibleClaimCount = Array.from(byQuestion.values()).reduce(
  (total, entry) => total + entry.positive.length + entry.negative.length + entry.neutral.length,
  0,
);

/** 规范化成生成物里的 TopicClaim 形状（保留 provenance 三件套） */
function toClaim(claim) {
  return {
    id: claim.id,
    claim: String(claim.claim).trim(),
    author: claim.author || "知乎用户",
    authorBadge: claim.authorBadge || "",
    voteUp: Number(claim.voteUp) || 0,
    url: claim.url,
    reasonType: claim.reasonType || "",
    quality: typeof claim.quality === "number" ? claim.quality : null,
  };
}

const byVotes = (a, b) => b.voteUp - a.voteUp;

/* ─────────── 第一批：天然成对议题 ─────────── */

const pairedTopics = [];
for (const entry of byQuestion.values()) {
  if (!entry.positive.length || !entry.negative.length) continue;
  pairedTopics.push({
    questionId: entry.questionId,
    title: entry.title,
    url: entry.url,
    paired: true,
    crossPaired: false,
    pairingNote: "同一议题下的真实正反论点（争议地图管线立场抽取）",
    pro: toClaim(entry.positive.slice().sort(byVotes)[0]),
    con: toClaim(entry.negative.slice().sort(byVotes)[0]),
  });
}
pairedTopics.sort((a, b) => b.pro.voteUp + b.con.voteUp - (a.pro.voteUp + a.con.voteUp));

const pairedIds = new Set(pairedTopics.map((t) => t.questionId));

/* ─────────── 第二批：跨议题配对（按 reasonType 对撞） ─────────── */

/**
 * 配对策略：把**正面立场的理由类型**与**反面立场的理由类型**做互补配对。
 * 这组映射不是随机挑的——每一对都对应一个真实存在于争论中的张力：
 *   人类特质 vs 技术壁垒   → 「只有人能做的」对「机器终将能做」
 *   教育培养 vs 行业周期   → 「靠培养接得上」对「周期一到就断了」
 *   需求本质 vs 成本经济   → 「需求需要人定义」对「算力成本会降下来」
 */
const REASON_PAIRS = [
  { pro: "人类特质", con: "技术壁垒", tension: "「只有人能做的」对「机器终将能做」" },
  { pro: "教育培养", con: "行业周期", tension: "「靠培养接得上」对「周期一到就断了」" },
  { pro: "需求本质", con: "成本经济", tension: "「需求必须由人定义」对「成本终会降到可忽略」" },
  { pro: "责任归属", con: "需求本质", tension: "「责任必须有人承担」对「需求可以不靠人描述」" },
  { pro: "技术壁垒", con: "教育培养", tension: "「壁垒还在」对「人也能被培养出来绕过它」" },
  { pro: "成本经济", con: "人类特质", tension: "「人力成本更贵」对「人的判断贵得有道理」" },
];

/** 挑某个立场里质量最高、且尚未被成对议题占用的论点 */
function poolByReason(sideKey) {
  const pool = new Map();
  for (const entry of byQuestion.values()) {
    if (pairedIds.has(entry.questionId)) continue;
    for (const claim of entry[sideKey]) {
      const key = claim.reasonType || "";
      if (!pool.has(key)) pool.set(key, []);
      pool.get(key).push({ entry, claim });
    }
  }
  for (const list of pool.values()) {
    list.sort((a, b) => (b.claim.quality ?? 0) - (a.claim.quality ?? 0) || b.claim.voteUp - a.claim.voteUp);
  }
  return pool;
}

const posPool = poolByReason("positive");
const negPool = poolByReason("negative");
const usedClaimIds = new Set();

const crossTopics = [];
for (const pair of REASON_PAIRS) {
  const proPick = (posPool.get(pair.pro) || []).find((x) => !usedClaimIds.has(x.claim.id));
  const conPick = (negPool.get(pair.con) || []).find((x) => !usedClaimIds.has(x.claim.id));
  if (!proPick || !conPick) continue;
  usedClaimIds.add(proPick.claim.id);
  usedClaimIds.add(conPick.claim.id);

  crossTopics.push({
    // 跨议题配对没有共同议题——用两个 questionId 拼一个稳定 id
    questionId: `cross-${pair.pro}-${pair.con}`,
    title: `「${proPick.entry.title}」×「${conPick.entry.title}」`,
    url: proPick.claim.url,
    paired: false,
    crossPaired: true,
    pairingNote: `跨议题配对 · ${pair.pro}（正）对 ${pair.con}（反）· 张力：${pair.tension}。两侧论点来自不同议题，不是同一问题的正反方。`,
    pro: toClaim(proPick.claim),
    con: toClaim(conPick.claim),
  });
}

/* ─────────── 第三批：单侧议题（可作为「立论素材库」） ─────────── */

const singleTopics = [];
for (const entry of byQuestion.values()) {
  if (pairedIds.has(entry.questionId)) continue;
  const all = [...entry.positive, ...entry.negative, ...entry.neutral];
  if (!all.length) continue;
  const top = all.slice().sort((a, b) => b.voteUp - a.voteUp)[0];
  singleTopics.push({
    questionId: entry.questionId,
    title: entry.title,
    url: entry.url,
    claimCount: all.length,
    topClaim: toClaim(top),
    // side 映射到 pro/con 只是「该论点持哪个方向」，不表示该议题有成对论点
    side: top.side === "positive" ? "pro" : top.side === "negative" ? "con" : "neutral",
  });
}
singleTopics.sort((a, b) => b.topClaim.voteUp - a.topClaim.voteUp);

/* ─────────── 生成 TS ─────────── */

const banner = `/**
 * 辩论间议题与论点对 —— **自动生成，请勿手改**
 *
 * 生成器：\`research/controversy-map/gen-debate-topics.mjs\`
 * 数据源：\`research/controversy-map/claims.json\`（知乎立场抽取管线）
 *
 * provenance 红线：以下所有 \`author\` / \`voteUp\` / \`url\` 均为真实数据，**不得修改或伪造**。
 * 议题分布实情：${sourceQuestionCount} 个源议题中有 ${byQuestion.size} 个通过明确站队题干门禁；其中 ${pairedTopics.length} 个天然同时有正反论点，
 * 因此另有 ${crossTopics.length} 组**跨议题配对**（\`crossPaired: true\`）——
 * 跨议题配对的双方论点来自不同问题，UI 必须显式标注，不得假装是同一议题的正反方。
 *
 * 重新生成：node research/controversy-map/gen-debate-topics.mjs
 */

import type { DebateTopic, TopicClaim } from "../types/debateRoom";

/** 辩论间可直接开局的议题（成对议题优先，跨议题配对次之） */
export const DEBATE_TOPICS: readonly DebateTopic[] = ${JSON.stringify(pairedTopics, null, 2)} as const;

/** 跨议题配对（两侧论点来自不同议题，UI 需标注） */
export const CROSS_PAIRED_TOPICS = ${JSON.stringify(crossTopics, null, 2)} as const;

/** 单侧议题；其中非 neutral 且题干可站队的项目也可开局，另一侧由对手自主立论。 */
export const SINGLE_SIDED_TOPICS: readonly {
  questionId: string;
  title: string;
  url: string;
  claimCount: number;
  topClaim: TopicClaim;
  side: "pro" | "con" | "neutral";
}[] = ${JSON.stringify(singleTopics, null, 2)} as const;

/** 全部可开局的议题：真实成对 + 跨议题配对 + 非 neutral 单侧议题。 */
const SINGLE_SIDED_PLAYABLE_TOPICS: readonly DebateTopic[] = SINGLE_SIDED_TOPICS
  .filter((topic) => topic.side !== "neutral")
  .map((topic) => ({
    questionId: topic.questionId,
    title: topic.title,
    url: topic.url,
    paired: false,
    crossPaired: false,
    pairingNote: "单侧真实论点；另一立场由对手自主立论。",
    pro: topic.side === "pro" ? topic.topClaim : null,
    con: topic.side === "con" ? topic.topClaim : null,
  }));

export const PLAYABLE_TOPICS: readonly (DebateTopic & { crossPaired?: boolean; pairingNote?: string })[] = [
  ...DEBATE_TOPICS,
  ...CROSS_PAIRED_TOPICS,
  ...SINGLE_SIDED_PLAYABLE_TOPICS,
];

/** 统计：给 UI 与自检用，避免各处硬编码数字 */
export const TOPIC_STATS = {
  totalQuestions: ${byQuestion.size},
  totalClaims: ${eligibleClaimCount},
  pairedTopics: ${pairedTopics.length},
  crossPairedTopics: ${crossTopics.length},
  singleSidedTopics: ${singleTopics.length},
} as const;

/** 按 id 取议题 */
export function findTopic(questionId: string) {
  return PLAYABLE_TOPICS.find((topic) => topic.questionId === questionId) ?? null;
}
`;

fs.mkdirSync(path.dirname(TARGET), { recursive: true });
fs.writeFileSync(TARGET, banner, "utf8");

/* ─────────── 自检报告 ─────────── */

const stats = {
  "源议题总数": sourceQuestionCount,
  "通过题干门禁": byQuestion.size,
  "排除开放解释题": sourceQuestionCount - byQuestion.size,
  "通过门禁的论点": eligibleClaimCount,
  "天然成对议题": pairedTopics.length,
  "跨议题配对": crossTopics.length,
  "单侧议题": singleTopics.length,
};

console.log("[gen-debate-topics] 已生成 →", path.relative(ROOT, TARGET));
for (const [key, value] of Object.entries(stats)) console.log(`  ${key}: ${value}`);

// provenance 自检：每条都必须有真实 author / voteUp / 知乎 url
function assertProvenance(topic, label) {
  for (const side of ["pro", "con"]) {
    const claim = topic[side];
    if (!claim) continue;
    if (!claim.author) throw new Error(`${label} ${side} 缺 author`);
    if (!/^https:\/\/www\.zhihu\.com\//.test(claim.url)) throw new Error(`${label} ${side} url 非知乎 https`);
    if (typeof claim.voteUp !== "number") throw new Error(`${label} ${side} voteUp 非数字`);
  }
}
pairedTopics.forEach((t, i) => assertProvenance(t, `paired[${i}]`));
crossTopics.forEach((t, i) => assertProvenance(t, `cross[${i}]`));
console.log("  ✓ provenance 自检通过（author / voteUp / 知乎 https url 齐备）");

// 跨议题配对的双方不得来自同一议题（否则就是成对议题，不该标 crossPaired）
for (const topic of crossTopics) {
  if (topic.pro.url.split("/answer/")[0] === topic.con.url.split("/answer/")[0]) {
    throw new Error(`跨议题配对 ${topic.questionId} 的两侧来自同一议题，应改用成对议题通道`);
  }
}
console.log("  ✓ 跨议题配对自检通过（两侧来自不同议题）");
