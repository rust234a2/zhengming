/**
 * 第一步：LLM 提炼论点 + 标注立场。
 *
 * 为什么必须用 LLM：知乎回答的开头常是背景铺垫（"前文有提到…"），
 * 机械截断会抓偏。而且立场判断需要整段语义，关键词极性表会误判。
 *
 * 两步法（项目已验证的经验）：
 *   1) 本脚本：把每条回答压成「一句可辩论的主张」+ 立场 + 理由类型
 *   2) mine-cross.mjs：在所有论点上做跨议题语义比对，找出「说的其实是同一件事」
 *
 * 单步直判会标签碎片化，所以这里只做单条回答的提炼，不管跨议题关系。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** 路径一律相对脚本自身推导 */
const DIR = path.dirname(fileURLToPath(import.meta.url));
const IN = path.join(DIR, "parsed.json");
const OUT = path.join(DIR, "claims.json");
const CACHE = path.join(DIR, ".claim-cache.json");

const KEY = process.env.DEEPSEEK_API_KEY;
if (!KEY) throw new Error("DEEPSEEK_API_KEY missing");

/** 断点续跑缓存：key = answerId，避免重复调用浪费额度 */
let cache = {};
if (fs.existsSync(CACHE)) cache = JSON.parse(fs.readFileSync(CACHE, "utf8"));

const SYSTEM = `你是辩论议题分析师。任务：从知乎回答中提炼出「一个可被反驳的主张」。

规则：
1. claim 必须是一个完整的、可辩论的主张句（15-45 字），不能是背景描述、不能是"我觉得很有意思"这类空话。要具体到能被反对。
2. side 只能是 positive / negative / neutral 三选一。判断依据是这个主张对「AI 是否/应否冲击该领域」的倾向：
   - positive = 认为 AI 会/应带来取代、冲击、价值重估（可以含"正在发生"）
   - negative = 认为 AI 不会/无法取代，或影响被夸大、人类有护城河
   - neutral = 真正的条件依赖型（"取决于…"）、或议题与该轴无关
3. reasonType 归入以下之一：技术壁垒 / 需求本质 / 责任归属 / 成本经济 / 教育培养 / 人类特质 / 行业周期 / 其他
4. quality 是这条主张作为辩论素材的质量分 0-1：具体、有论证支撑、有对立面 = 高分；情绪宣泄、纯转述 = 低分。

只输出 JSON 数组，不要 markdown 包裹。`;

async function callLLM(batch) {
  const payload = batch.map((a, i) => ({
    idx: i,
    question: a.questionTitle,
    author: a.author,
    votes: a.voteUp,
    text: a.fullText.slice(0, 1200),
  }));

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `请处理以下 ${payload.length} 条回答，按 idx 顺序输出 JSON 数组，每项含 idx/claim/side/reasonType/quality。\n\n${JSON.stringify(
            payload,
            null,
            1,
          )}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  });

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  // response_format json_object 会包一层，兼容多种返回形态
  return parsed.items || parsed.claims || parsed.results || (Array.isArray(parsed) ? parsed : []);
}

const data = JSON.parse(fs.readFileSync(IN, "utf8"));
const qById = new Map(data.questions.map((q) => [q.id, q]));
const todo = data.answers.filter((a) => !cache[a.id]);
console.log(`总回答 ${data.answers.length}，已完成 ${data.answers.length - todo.length}，待处理 ${todo.length}`);

const BATCH = 6;
for (let i = 0; i < todo.length; i += BATCH) {
  const batch = todo.slice(i, i + BATCH).map((a) => ({
    ...a,
    questionTitle: qById.get(a.questionId)?.title || "",
  }));
  try {
    const items = await callLLM(batch);
    for (const it of items) {
      const src = batch[it.idx];
      if (!src) continue;
      cache[src.id] = {
        claim: String(it.claim || "").slice(0, 80),
        side: ["positive", "negative", "neutral"].includes(it.side) ? it.side : "neutral",
        reasonType: it.reasonType || "其他",
        quality: typeof it.quality === "number" ? it.quality : 0.5,
      };
    }
    fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1), "utf8");
    console.log(`  batch ${i / BATCH + 1} ok (${Object.keys(cache).length}/${data.answers.length})`);
  } catch (e) {
    console.log(`  batch ${i / BATCH + 1} FAILED: ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 700));
}

// 合并回主数据
const claims = data.answers.map((a) => {
  const c = cache[a.id] || { claim: a.claim, side: a.polarity, reasonType: "其他", quality: 0.4 };
  return {
    id: a.id,
    questionId: a.questionId,
    questionTitle: qById.get(a.questionId)?.title || "",
    author: a.author,
    authorBadge: a.authorBadge,
    voteUp: a.voteUp,
    url: a.url,
    ...c,
  };
});

fs.writeFileSync(OUT, JSON.stringify({ ...data, claims }, null, 2), "utf8");

const dist = {};
for (const c of claims) dist[c.side] = (dist[c.side] || 0) + 1;
console.log("立场分布:", JSON.stringify(dist));
console.log("理由类型分布:", JSON.stringify(claims.reduce((m, c) => ((m[c.reasonType] = (m[c.reasonType] || 0) + 1), m), {})));
console.log("--- 论点样例 ---");
for (const c of claims.slice(0, 10)) console.log(`  [${c.side}/${c.reasonType}] ${c.claim}`);
