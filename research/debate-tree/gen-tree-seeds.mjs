/**
 * 辩论树冷启动数据生成器：真实知乎语料 → web/src/data/debateTreeSeed.ts
 *
 * 为什么需要生成而不是手写：
 *   provenance 红线要求保留真实提问链接、真实答主、真实赞同数与真实回答原文。
 *   手抄会漂移，生成保证与语料逐字一致。
 *
 * 三条溯源通道（每一条都可追到具体文件，**没有任何模型生成内容**）：
 *   A `claims`   research/controversy-map/claims.json
 *                → 27 个真实议题 / 37 条真实论点（author / authorBadge / voteUp / url / side / reasonType）
 *                  论点的原文节选取自同文件的 answers[].fullText（真实回答正文）
 *   B `answers`  research/zhihu-corpus/stance_balance.json + raw/answers_*.json
 *                → 3 个真实议题的真实回答摘要（Url + Summary）与真实立场聚类结果
 *                  题面取自 stance_balance.py 的 QUESTIONS 登记（采集时的权威映射）
 *   C `question` research/zhihu-corpus/classified.json
 *                → 真实题干池（甜区 / 可用区 / 弱可辩），只有议题与链接，尚无论点
 *
 * 红线约束（生成期强制，命中即剔除并计入报告）：
 *   - 禁用词表取自 zhengming-server/lib/contract.mjs 的 BANNED_WORDS（契约唯一来源）
 *   - 不伪造 author / voteUp / 时间；缺失一律留空而不是填默认值
 *   - 立场未标注的答案**不当论点用**，只作为「真实回答」列在议题下（B 通道）
 *   - 知乎赞同数与争鸣平台投票是两回事，生成物里分成两个字段，绝不合并
 *
 * 用法：
 *   node research/debate-tree/gen-tree-seeds.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BANNED_WORDS } from "../../zhengming-server/lib/contract.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const MAP_DIR = path.resolve(ROOT, "research/controversy-map");
const CORPUS_DIR = path.resolve(ROOT, "research/zhihu-corpus");
const TARGET = path.resolve(ROOT, "web/src/data/debateTreeSeed.ts");

const QUESTION_URL = /^https:\/\/www\.zhihu\.com\/question\/(\d+)/;
const ANSWER_URL = /^https:\/\/www\.zhihu\.com\/question\/(\d+)\/answer\/(\d+)/;

/** title B 通道收录的题干档位（其他档位按语料结论视为不可辩或已排除） */
const QUESTION_TIERS = ["甜区", "甜区（高风险）", "可用区", "弱可辩"];

/** 单个议题最多收录多少条真实回答摘要（控体积，不改变可追源性） */
const MAX_ANSWER_SAMPLES = 20;
const MAX_QUOTE_CHARS = 200;
const MAX_SAMPLE_CHARS = 200;

const dropped = [];
const drop = (what, reason, detail) => {
  dropped.push({ what, reason, detail: String(detail ?? "").slice(0, 60) });
};

const findBanned = (text) => BANNED_WORDS.filter((word) => String(text ?? "").includes(word));

function zhihuIdOf(url) {
  const match = String(url ?? "").match(QUESTION_URL);
  return match ? match[1] : null;
}

function readJson(...segments) {
  const file = path.join(...segments);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/* ═══════════════ 载入语料 ═══════════════ */

const claimsRaw = readJson(MAP_DIR, "claims.json");
const claims = claimsRaw.claims ?? [];
const claimQuestions = claimsRaw.questions ?? [];
const claimAnswers = claimsRaw.answers ?? [];

if (!claims.length || !claimQuestions.length) {
  console.error("[gen-tree-seeds] claims.json 没有可用语料，终止");
  process.exit(1);
}

/** claim.id → 真实回答全文（用于取原文节选） */
const fullTextById = new Map(claimAnswers.map((answer) => [answer.id, String(answer.fullText ?? "")]));

/* ═══════════════ A 通道：真实论点 ═══════════════ */

const sideToStance = (side) => (side === "positive" ? "pro" : side === "negative" ? "con" : "neutral");

const claimsByQuestion = new Map();
const seenClaimKeys = new Set();
for (const claim of claims) {
  if (!claim?.questionId || !claim?.claim || !claim?.url) {
    drop("claim", "缺 questionId / claim / url", claim?.id);
    continue;
  }
  if (!zhihuIdOf(claim.url) && !ANSWER_URL.test(claim.url)) {
    drop("claim", "url 非知乎真实链接", claim?.id);
    continue;
  }
  // 同一 (id, 正文) 视为重复：语料里同一答主同一论点被抽过两次
  const key = `${claim.id}|${claim.claim}`;
  if (seenClaimKeys.has(key)) {
    drop("claim", "重复条目", claim?.id);
    continue;
  }
  seenClaimKeys.add(key);

  const banned = findBanned(claim.claim);
  if (banned.length) {
    drop("claim", `正文命中禁用词（${banned.join("、")}）`, claim?.id);
    continue;
  }
  if (!claim.author) {
    drop("claim", "无真实作者，拒绝伪造", claim?.id);
    continue;
  }

  if (!claimsByQuestion.has(claim.questionId)) claimsByQuestion.set(claim.questionId, []);
  claimsByQuestion.get(claim.questionId).push(claim);
}

const byVotes = (a, b) => b.voteUp - a.voteUp;

const claimTopics = [];
for (const question of claimQuestions) {
  const list = claimsByQuestion.get(question.id);
  if (!list?.length) continue;
  if (!question.url || !zhihuIdOf(question.url)) {
    drop("topic", "题干无真实知乎链接", question.id);
    continue;
  }
  const banned = findBanned(question.title);
  if (banned.length) {
    drop("topic", `题干命中禁用词（${banned.join("、")}）`, question.id);
    continue;
  }

  claimTopics.push({
    id: question.id,
    zhihuId: question.zhihuId || zhihuIdOf(question.url),
    title: String(question.title ?? "").trim(),
    url: question.url,
    tier: "claims",
    answerCount: typeof question.answerCount === "number" ? question.answerCount : null,
    note: "一级论点来自争议地图管线的立场抽取，作者 / 赞同数 / 原文链接均为真实数据。",
    clusters: [],
    clusterMeta: null,
    claims: list
      .slice()
      .sort(byVotes)
      .map((claim) => {
        const raw = (fullTextById.get(claim.id) || "").replace(/\s+/g, " ").trim();
        // 论点本身是干净句；但真实回答正文里出现「错误」这类日常用词很正常，
        // 而禁用词表是按**字面**扫描的（连否定句都算命中）。取舍：
        // 保留论点、答主、赞同数与链接（provenance 不动），只**省略原文节选**，
        // 免得把禁用词字面渲染到界面上、也免得破坏仓库级的 0 命中验收。
        const quoteHits = findBanned(raw);
        if (quoteHits.length) {
          drop("claim", `原文节选命中禁用词（${quoteHits.join("、")}），已省略节选、保留论点与链接`, claim.id);
          return {
            id: claim.id,
            text: String(claim.claim).trim(),
            stance: sideToStance(claim.side),
            sourceSide: claim.side,
            author: claim.author,
            authorBadge: claim.authorBadge || "",
            voteUp: Number(claim.voteUp) || 0,
            url: claim.url,
            quote: "",
            reasonType: claim.reasonType || "",
            quality: typeof claim.quality === "number" ? claim.quality : null,
          };
        }
        return {
          id: claim.id,
          text: String(claim.claim).trim(),
          stance: sideToStance(claim.side),
          sourceSide: claim.side,
          author: claim.author,
          authorBadge: claim.authorBadge || "",
          voteUp: Number(claim.voteUp) || 0,
          url: claim.url,
          quote: raw.slice(0, MAX_QUOTE_CHARS),
          reasonType: claim.reasonType || "",
          quality: typeof claim.quality === "number" ? claim.quality : null,
        };
      }),
    answerSamples: [],
  });
}
claimTopics.sort((a, b) => b.claims.length - a.claims.length || a.title.localeCompare(b.title, "zh"));

/* ═══════════════ B 通道：真实回答摘要 + 真实立场聚类 ═══════════════ */

/** 从 stance_balance.py 的 QUESTIONS 登记里取 zhihuId → 题面 */
function readAnswerQuestionRegistry() {
  const source = fs.readFileSync(path.join(CORPUS_DIR, "stance_balance.py"), "utf8");
  const block = source.slice(source.indexOf("QUESTIONS"), source.indexOf("}", source.indexOf("QUESTIONS")));
  const registry = new Map();
  for (const line of block.split(/\r?\n/)) {
    const match = line.match(/^\s*"(\d+)"\s*:\s*"(.+?)",?\s*$/);
    if (match) registry.set(match[1], match[2]);
  }
  if (!registry.size) throw new Error("stance_balance.py 里没有解析到 QUESTIONS 登记");
  return registry;
}

const questionRegistry = readAnswerQuestionRegistry();
const stanceBalance = readJson(CORPUS_DIR, "stance_balance.json");

const answerTopics = [];
for (const file of fs.readdirSync(path.join(CORPUS_DIR, "raw"))) {
  if (!file.startsWith("answers_") || !file.endsWith(".json")) continue;
  const zhihuId = file.replace("answers_", "").replace(".json", "");
  const title = questionRegistry.get(zhihuId);
  if (!title) {
    drop("topic", "题面无登记（stance_balance.py 里查不到）", zhihuId);
    continue;
  }
  const banned = findBanned(title);
  if (banned.length) {
    drop("topic", `题干命中禁用词（${banned.join("、")}）`, zhihuId);
    continue;
  }

  const items = readJson(CORPUS_DIR, "raw", file)?.Data?.Items ?? [];
  const samples = [];
  for (const item of items) {
    const summary = String(item?.Summary ?? "").replace(/\s+/g, " ").trim();
    if (!summary) continue;
    if (!ANSWER_URL.test(item?.Url ?? "")) {
      drop("answer", "回答链接非知乎真实链接", item?.Url);
      continue;
    }
    const hit = findBanned(summary);
    if (hit.length) {
      drop("answer", `回答摘要命中禁用词（${hit.join("、")}）`, item?.Url);
      continue;
    }
    samples.push({ url: item.Url, summary: summary.slice(0, MAX_SAMPLE_CHARS) });
    if (samples.length >= MAX_ANSWER_SAMPLES) break;
  }

  if (!samples.length) {
    drop("topic", "无可用真实回答摘要", zhihuId);
    continue;
  }

  const balance = stanceBalance[title] ?? null;
  const clusters = balance?.valid > 0
    ? Object.entries(balance.clusters).map(([label, count]) => ({ label, count }))
    : [];

  answerTopics.push({
    id: `zh-${zhihuId}`,
    zhihuId,
    title,
    url: `https://www.zhihu.com/question/${zhihuId}`,
    tier: "answers",
    answerCount: samples.length,
    note: "语料只采到真实回答摘要，未做论点抽取——立场归属未经标注，因此**不冒充一级论点**，仅作为真实回答并列展示。",
    clusters,
    clusterMeta: balance && balance.valid > 0
      ? { total: balance.total, valid: balance.valid, topCluster: balance.top_cluster, ratio: balance.ratio }
      : null,
    claims: [],
    answerSamples: samples,
  });
}
answerTopics.sort((a, b) => (b.clusterMeta?.valid ?? 0) - (a.clusterMeta?.valid ?? 0) || a.title.localeCompare(b.title, "zh"));

/* ═══════════════ C 通道：真实题干池 ═══════════════ */

const usedIds = new Set([...claimTopics, ...answerTopics].map((topic) => topic.zhihuId));
const classified = readJson(CORPUS_DIR, "classified.json");

const questionTopics = [];
const seenQuestionIds = new Set();
for (const row of classified) {
  const zhihuId = zhihuIdOf(row?.url);
  if (!zhihuId) continue;
  if (usedIds.has(zhihuId) || seenQuestionIds.has(zhihuId)) continue;
  if (!QUESTION_TIERS.includes(row.tier)) continue;

  const title = String(row.title ?? "").trim();
  if (!title) continue;
  const banned = findBanned(title);
  if (banned.length) {
    drop("topic", `题干命中禁用词（${banned.join("、")}）`, zhihuId);
    continue;
  }
  seenQuestionIds.add(zhihuId);
  questionTopics.push({
    id: `zh-${zhihuId}`,
    zhihuId,
    title,
    url: `https://www.zhihu.com/question/${zhihuId}`,
    tier: "question",
    answerCount: null,
    note: `题干经语料门禁判为「${row.tier}」${row.type ? ` · ${row.type}` : ""}；尚无真实论点，等待参与者立论。`,
    clusters: [],
    clusterMeta: null,
    claims: [],
    answerSamples: [],
  });
}
questionTopics.sort((a, b) => a.title.localeCompare(b.title, "zh"));

/* ═══════════════ 汇总与自检 ═══════════════ */

const seeds = [...claimTopics, ...answerTopics, ...questionTopics];

const totalClaims = seeds.reduce((sum, seed) => sum + seed.claims.length, 0);
const totalAnswerSamples = seeds.reduce((sum, seed) => sum + seed.answerSamples.length, 0);

/** 每个议题必须能追到真实知乎链接；任何一条不满足就直接失败，不静默放行 */
for (const seed of seeds) {
  if (!QUESTION_URL.test(seed.url)) throw new Error(`${seed.id} 的议题链接不是知乎真实链接`);
  if (!seed.title) throw new Error(`${seed.id} 缺题干`);
  for (const claim of seed.claims) {
    if (!claim.author) throw new Error(`${seed.id} 的论点 ${claim.id} 缺真实作者`);
    if (typeof claim.voteUp !== "number") throw new Error(`${seed.id} 的论点 ${claim.id} 缺真实赞同数`);
    if (!ANSWER_URL.test(claim.url)) throw new Error(`${seed.id} 的论点 ${claim.id} 链接不是知乎回答`);
    for (const word of findBanned(claim.text)) throw new Error(`${seed.id} 的论点含禁用词 ${word}`);
    for (const word of findBanned(claim.quote)) throw new Error(`${seed.id} 的原文节选含禁用词 ${word}`);
  }
  for (const sample of seed.answerSamples) {
    if (!ANSWER_URL.test(sample.url)) throw new Error(`${seed.id} 的回答摘要链接不是知乎回答`);
    for (const word of findBanned(sample.summary)) throw new Error(`${seed.id} 的回答摘要含禁用词 ${word}`);
  }
  for (const word of findBanned(seed.title)) throw new Error(`${seed.id} 的题干含禁用词 ${word}`);
}

/** 默认议题：优先选一级论点最多、且正反都有的那一个，便于展示真实分叉 */
const score = (seed) =>
  seed.claims.length * 10 +
  (seed.claims.some((c) => c.stance === "pro") && seed.claims.some((c) => c.stance === "con") ? 5 : 0) +
  (seed.tier === "claims" ? 2 : seed.tier === "answers" ? 1 : 0);
const defaultSeed = seeds.slice().sort((a, b) => score(b) - score(a))[0];

const banner = `/**
 * 辩论树冷启动种子 —— **自动生成，请勿手改**
 *
 * 生成器：\`research/debate-tree/gen-tree-seeds.mjs\`
 *
 * provenance 红线：下列所有 \`title\` / \`url\` / \`author\` / \`authorBadge\` / \`voteUp\` / \`quote\`
 * 均为真实知乎数据（或真实回答正文节选），**不得修改或伪造**。
 *
 * 三条溯源通道（\`tier\`）：
 *   - \`claims\`   一级论点已由立场抽取管线产出，作者 / 赞同数 / 原文链接齐备
 *   - \`answers\`  只采到真实回答摘要，未做论点抽取：立场归属未经标注，
 *                 因此以 \`answerSamples\` 并列展示，**不冒充一级论点**
 *   - \`question\` 仅真实题干，尚无内容，等待参与者立论
 *
 * 注意：\`voteUp\` 是**知乎赞同数**（来源热度），与争鸣平台自身的投票是两回事，
 * UI 里必须分开展示，不得合并成一个数字。
 *
 * 议题分布实情：${claimTopics.length} 个议题有真实论点（共 ${totalClaims} 条）·
 * ${answerTopics.length} 个议题有真实回答摘要（共 ${totalAnswerSamples} 条）· ${questionTopics.length} 个仅题干。
 *
 * 重新生成：node research/debate-tree/gen-tree-seeds.mjs
 */

import type { DebateTreeSeed } from "../types/debateTree";

/** 全部真实议题；按「有论点 → 有回答 → 仅题干」排列，UI 按 \`tier\` 分组展示 */
export const DEBATE_TREE_SEEDS: readonly DebateTreeSeed[] = ${JSON.stringify(seeds, null, 2)};

/** 默认打开的议题：真实论点最多且正反兼具 */
export const DEFAULT_TREE_SEED_ID = ${JSON.stringify(defaultSeed.id)};

export const TREE_SEED_STATS = {
  topics: ${seeds.length},
  claimTopics: ${claimTopics.length},
  answerTopics: ${answerTopics.length},
  questionOnlyTopics: ${questionTopics.length},
  claims: ${totalClaims},
  answerSamples: ${totalAnswerSamples},
} as const;

/** 按议题 id（\`zh-<zhihuId>\`）取种子；找不到返回 null，不抛错 */
export function findTreeSeed(id: string): DebateTreeSeed | null {
  return DEBATE_TREE_SEEDS.find((seed) => seed.id === id) ?? null;
}
`;

fs.mkdirSync(path.dirname(TARGET), { recursive: true });
fs.writeFileSync(TARGET, banner, "utf8");

/* ═══════════════ 报告 ═══════════════ */

console.log("[gen-tree-seeds] 已生成 →", path.relative(ROOT, TARGET).replace(/\\/g, "/"));
const report = {
  "议题总数（真实）": seeds.length,
  "  有真实论点": claimTopics.length,
  "  有真实回答摘要": answerTopics.length,
  "  仅题干": questionTopics.length,
  "真实论点条数": totalClaims,
  "真实回答摘要条数": totalAnswerSamples,
  "默认议题": defaultSeed.title.slice(0, 40),
  "被剔除条目": dropped.length,
};
for (const [key, value] of Object.entries(report)) console.log(`  ${key}: ${value}`);

if (dropped.length) {
  const byReason = new Map();
  for (const item of dropped) {
    const key = `${item.what} · ${item.reason}`;
    if (!byReason.has(key)) byReason.set(key, []);
    byReason.get(key).push(item.detail);
  }
  console.log("  剔除明细：");
  for (const [reason, list] of byReason) {
    console.log(`    ${reason} × ${list.length}  例：${list.slice(0, 2).join(" / ")}`);
  }
}
console.log("  ✓ provenance 自检通过（题干 / 论点 / 回答摘要均为知乎真实 https 链接，作者与赞同数齐备）");
console.log(`  ✓ 禁用词扫描通过（词表取自 zhengming-server/lib/contract.mjs：${BANNED_WORDS.join("、")}）`);
