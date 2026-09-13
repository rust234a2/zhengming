/**
 * 第二步：跨议题语义挖掘 —— 找出「说的其实是同一件事」的论点对。
 *
 * 这是整张图存在的理由。树结构里一个节点只有一个 parent，
 * 而这里要建立的是「议题 A 下的某论点 ≡ 议题 B 下的某论点」的横向边。
 *
 * 策略：不两两全比对（37×37 太多且噪音大），而是
 *   1) 先用 reasonType 把论点粗分组（只有同组才可能语义重合）
 *   2) 组内两两比对，让 LLM 判断是「同一主张」「互相反驳」还是「无关」
 *   3) 只保留同一主张 / 明确反驳这两种强关系
 *
 * 输出三类跨议题边：
 *   same-claim  同一主张在不同议题下的两次表达（图的缝合线，最重要）
 *   rebuts      不同议题下的论点互相矛盾（揭示跨议题立场冲突）
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** 路径一律相对脚本自身推导 */
const DIR = path.dirname(fileURLToPath(import.meta.url));
const IN = path.join(DIR, "claims.json");
const OUT = path.join(DIR, "cross-links.json");
const CACHE = path.join(DIR, ".cross-cache.json");
const KEY = process.env.DEEPSEEK_API_KEY;

let cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};

const claims = JSON.parse(fs.readFileSync(IN, "utf8")).claims;

const SYSTEM = `你是论证结构分析师。给你两组来自不同知乎议题的论点，判断它们之间的关系。

对每一对，输出 relation：
- "same-claim"：两个论点表达的是同一个底层主张（措辞、议题不同，但核心判断一致）。注意：领域不同但结构同构也算，比如"设计师不该担心AI，因为AI只替代执行环节"和"程序员不该担心AI，因为AI只替代翻译需求"。label 给出这个共同主张的简短命名（8-16字）。
- "rebuts"：两个论点互相矛盾（一个说会/应该，另一个说不会/不应该）。
- "related"：同一主题但既不重合也不矛盾（比如都在谈教育，但一个谈该学什么、一个谈值不值得）。
- "unrelated"：没有实质关联。

要求严格：same-claim 必须是核心判断一致，不能只是共享话题词。宁可判 unrelated，也不要牵强附会。

输出 JSON: {"pairs":[{"i":<组内序号A>,"j":<组内序号B>,"relation":"...","label":"...","confidence":0-1}]}`;

async function judge(group) {
  const payload = group.map((c, i) => ({
    i,
    topic: c.questionTitle.slice(0, 40),
    claim: c.claim,
    side: c.side,
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
          content: `请判断以下 ${payload.length} 个论点两两之间的关系。覆盖所有 i<j 的组合。\n\n${JSON.stringify(
            payload,
            null,
            1,
          )}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  });
  const json = await res.json();
  const parsed = JSON.parse(json.choices?.[0]?.message?.content || "{}");
  return parsed.pairs || [];
}

/** 按 reasonType 分组，只跨议题比对（同议题内部的关系已有树结构表达） */
const groups = {};
for (const c of claims) {
  (groups[c.reasonType] ||= []).push(c);
}

const allPairs = [];

for (const [reason, list] of Object.entries(groups)) {
  if (list.length < 2) continue;
  // 只保留跨议题的组合
  const cross = list.filter((c) => c.questionId !== list[0].questionId || true);
  const cacheKey = `g:${reason}:${cross.map((c) => c.id).join("|")}`;

  let pairs;
  if (cache[cacheKey]) {
    pairs = cache[cacheKey];
  } else {
    try {
      pairs = await judge(cross);
      cache[cacheKey] = pairs;
      fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1), "utf8");
    } catch (e) {
      console.log(`  group ${reason} FAILED: ${e.message}`);
      continue;
    }
    await new Promise((r) => setTimeout(r, 600));
  }

  for (const p of pairs) {
    const a = cross[p.i];
    const b = cross[p.j];
    if (!a || !b) continue;
    if (a.questionId === b.questionId) continue; // 只保留跨议题
    if (p.relation !== "same-claim" && p.relation !== "rebuts") continue;
    if ((p.confidence ?? 0) < 0.6) continue;
    allPairs.push({
      source: a.id,
      target: b.id,
      relation: p.relation,
      label: p.label || "",
      confidence: p.confidence ?? 0.7,
      reasonType: reason,
      sourceTopic: a.questionTitle,
      targetTopic: b.questionTitle,
    });
  }
  console.log(`  ${reason}: ${pairs.length} 对 → 保留跨议题强关系`);
}

fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), links: allPairs }, null, 2), "utf8");

console.log(`\n跨议题边总数: ${allPairs.length}`);
console.log("--- same-claim（缝合线）---");
for (const l of allPairs.filter((x) => x.relation === "same-claim")) {
  console.log(`  [${l.label}] ${l.confidence}`);
  console.log(`     A: ${claims.find((c) => c.id === l.source).claim}`);
  console.log(`     B: ${claims.find((c) => c.id === l.target).claim}`);
}
console.log("--- rebuts（跨议题冲突）---");
for (const l of allPairs.filter((x) => x.relation === "rebuts")) {
  console.log(`  ${l.confidence}`);
  console.log(`     A: ${claims.find((c) => c.id === l.source).claim}`);
  console.log(`     B: ${claims.find((c) => c.id === l.target).claim}`);
}
