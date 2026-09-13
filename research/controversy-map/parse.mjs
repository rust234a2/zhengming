/**
 * 把 zhihu-cli search 的原始返回抽成结构化数据。
 *
 * 设计要点：
 * - 搜索返回的是「回答」，一个回答挂在某个問題下。我们按 question 聚合，
 *   因为议题（topic）是地图的骨架，回答则提供论点原料。
 * - ContentText 是完整长文，需要截断为「论点句」——取前若干句作为主论点。
 * - 保留 VoteUpCount / AuthorName / AuthorBadgeText 作为社区信号（weight）。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** 路径一律相对脚本自身推导，不写死绝对路径（仓库搬家不会再断） */
const DIR = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(DIR, "raw");
const OUT = path.join(DIR, "parsed.json");

/** 我们的 5 个检索簇 → 人类可读的主题域 */
const CLUSTER_LABEL = {
  t1_ai_replace_programmer: "AI 与程序员",
  t2_learn_programming: "AI 与编程教育",
  t3_ai_replace_creator: "AI 与创作者",
  t4_cs_major_value: "计算机专业价值",
  t5_ai_human_judgment: "人的不可替代性",
};

/** 把长文切成句子。中文以。！？；为界，保留分隔符。 */
function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[。！？；])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * 抽取「论点句」：取回答开头的前 2 句，且总长控制在 120 字内。
 * 知乎回答通常开门见山给结论，前两句命中率最高。
 */
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

/** 粗略立场极性：用否定/肯定词表做启发式判断，仅供后续 LLM 复核参考。 */
function guessPolarity(text) {
  const neg = /不会|不能|无法|不存在|没必要|不值得|失业|收缩|替代不了|取代不了|被夸大/;
  const pos = /会|能够|可以|必然|正在|已经|值得|机会|放大|提升|不可替代/;
  const n = (text.match(neg) || []).length;
  const p = (text.match(pos) || []).length;
  if (n > p) return "negative";
  if (p > n) return "positive";
  return "neutral";
}

const questions = new Map();
const answers = [];

for (const file of fs.readdirSync(RAW_DIR)) {
  const cluster = file.replace(/\.json$/, "");
  const raw = JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), "utf8"));
  const items = (raw.Data && raw.Data.Items) || [];

  for (const item of items) {
    const url = item.Url || "";
    const m = url.match(/question\/(\d+)/);
    const questionId = m ? m[1] : null;
    if (!questionId) continue;

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

    const content = (item.ContentText || "").trim();
    answers.push({
      id: `a-${item.ContentID}`,
      questionId: `zh-${questionId}`,
      author: item.AuthorName || "匿名",
      authorSignature: item.AuthorSignature || "",
      authorBadge: item.AuthorBadgeText || "",
      authorityLevel: item.AuthorityLevel || "",
      voteUp: item.VoteUpCount || 0,
      commentCount: item.CommentCount || 0,
      claim: extractClaim(content),
      fullText: content,
      polarity: guessPolarity(content),
      url,
    });
  }
}

const result = {
  generatedAt: new Date().toISOString(),
  clusters: CLUSTER_LABEL,
  questions: [...questions.values()].sort((a, b) => b.answerCount - a.answerCount),
  answers: answers.sort((a, b) => b.voteUp - a.voteUp),
};

fs.writeFileSync(OUT, JSON.stringify(result, null, 2), "utf8");

console.log("问题数:", result.questions.length);
console.log("回答数:", result.answers.length);
console.log("--- 跨簇共享的问题（出现在多个检索簇里）---");
for (const q of result.questions) {
  if (q.clusters.length > 1) console.log(`  [${q.clusters.join(" + ")}] ${q.title}`);
}
console.log("--- 高赞回答 top 8 ---");
for (const a of result.answers.slice(0, 8)) {
  console.log(`  [${a.voteUp}赞] ${a.claim.slice(0, 60)}`);
}
