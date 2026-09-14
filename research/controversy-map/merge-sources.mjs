/**
 * 多源合并：raw/（v1 collect.ps1）+ raw-discovery/ + raw-deep/ → parsed.json。
 *
 * 与 parse.mjs 的差异：
 * 1) 三路来源合并，回答按 ContentID 全局去重（同答多源时保留 ContentText 最长的）；
 * 2) 发现期/深挖期议题先过门禁（gated.json verdict=放行），v1 raw/ 来源的议题是
 *    人工策展基线，无条件保留；
 * 3) 每题只保留点赞 top-8 回答进入提炼——这是预算截断链（30→8）的落点，
 *    全量原文仍在 raw-deep/ 与 question-registry 中，不丢数据。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));

function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[。！？；])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function extractClaim(text) {
  const sentences = splitSentences(text);
  const picked = [];
  let len = 0;
  for (const s of sentences) {
    if (len + s.length > 120 && picked.length > 0) break;
    picked.push(s);
    len += s.length;
    if (picked.length >= 3) break;
  }
  const claim = picked.join("").replace(/[。！？；]$/, "");
  return claim.length > 4 ? claim : text.slice(0, 120);
}

function guessPolarity(text) {
  const neg = /不会|不能|无法|不存在|没必要|不值得|失业|收缩|替代不了|取代不了|被夸大/;
  const pos = /会|能够|可以|必然|正在|已经|值得|机会|放大|提升|不可替代/;
  const n = (text.match(neg) || []).length;
  const p = (text.match(pos) || []).length;
  if (n > p) return "negative";
  if (p > n) return "positive";
  return "neutral";
}

/** 门禁放行集合 */
const gated = JSON.parse(fs.readFileSync(path.join(DIR, "gated.json"), "utf8"));
const passed = new Set(gated.rows.filter((r) => r.verdict === "放行").map((r) => String(r.zhihuId)));

/** 来源目录 → 是否受门禁约束（v1 raw/ 人工策展，不受） */
const SOURCES = [
  { dir: "raw", gated: false, label: (f) => f.replace(/\.json$/, "") },
  { dir: "raw-discovery", gated: true, label: (f) => f.replace(/\.json$/, "") },
  { dir: "raw-deep", gated: true, label: (f) => `deep:${f.replace(/\.json$/, "")}` },
];

const questions = new Map();
const answersById = new Map();
let rawTotal = 0;

for (const src of SOURCES) {
  const abs = path.join(DIR, src.dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of fs.readdirSync(abs)) {
    let items;
    try {
      items = ((JSON.parse(fs.readFileSync(path.join(abs, file), "utf8")).Data || {}).Items) || [];
    } catch {
      continue;
    }
    const cluster = src.label(file);
    for (const item of items) {
      rawTotal++;
      const m = (item.Url || "").match(/question\/(\d+)/);
      const questionId = m ? m[1] : null;
      if (!questionId) continue;
      if (src.gated && !passed.has(questionId)) continue; // 门禁约束

      const title = (item.Title || "").replace(/ - 知乎$/, "").trim();
      if (!questions.has(questionId)) {
        questions.set(questionId, {
          id: `zh-${questionId}`,
          zhihuId: questionId,
          url: `https://www.zhihu.com/question/${questionId}`,
          title,
          clusters: [],
          answerCount: 0,
        });
      }
      const q = questions.get(questionId);
      if (!q.clusters.includes(cluster)) q.clusters.push(cluster);
      q.answerCount += 1;

      const aid = `a-${item.ContentID}`;
      const answer = {
        id: aid,
        questionId: `zh-${questionId}`,
        author: item.AuthorName || "匿名",
        authorSignature: item.AuthorSignature || "",
        authorBadge: item.AuthorBadgeText || "",
        authorityLevel: item.AuthorityLevel || "",
        voteUp: item.VoteUpCount || 0,
        commentCount: item.CommentCount || 0,
        claim: extractClaim((item.ContentText || "").trim()),
        fullText: (item.ContentText || "").trim(),
        polarity: guessPolarity(item.ContentText || ""),
        url: item.Url || "",
      };
      const prev = answersById.get(aid);
      if (!prev || answer.fullText.length > prev.fullText.length) answersById.set(aid, answer);
    }
  }
}

// 每题 top-8（点赞），其余留在原始文件里
const byTopic = new Map();
for (const a of answersById.values()) {
  if (!byTopic.has(a.questionId)) byTopic.set(a.questionId, []);
  byTopic.get(a.questionId).push(a);
}
const answers = [];
for (const list of byTopic.values()) {
  list.sort((a, b) => b.voteUp - a.voteUp);
  answers.push(...list.slice(0, 8));
}

const result = {
  generatedAt: new Date().toISOString(),
  clusters: { pipeline: "发现管线 v2（lexicon v2 × 49 query → gate → deep-dive）" },
  questions: [...questions.values()].sort((a, b) => b.answerCount - a.answerCount),
  answers: answers.sort((a, b) => b.voteUp - a.voteUp),
};

fs.writeFileSync(path.join(DIR, "parsed.json"), JSON.stringify(result, null, 2), "utf8");
console.log(`原始回答条目 ${rawTotal} → 去重后 ${answersById.size} → 门禁通过议题 ${questions.size} 个 → top-8 截断后 ${answers.length} 条`);
console.log(`回答数 ≥3 的议题: ${[...byTopic.values()].filter((l) => l.length >= 3).length}`);
