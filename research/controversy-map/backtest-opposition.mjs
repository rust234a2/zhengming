/**
 * 回测：LLM 看回答全文判「有无对垒」，与 v1 已知立场分布对比。
 *
 * 标准答案：claims.json 的 side 字段（v1 两步法判出的立场）。
 *   题级 GT：某题的论点中同时存在 positive 与 negative → 有对垒。
 *   答级 GT：side = positive/negative/neutral。
 * 基线：parse.mjs 的词表启发式 guessPolarity（parsed.json 的 polarity 字段）。
 *
 * 注意：GT 本身也是 LLM 产物（extract-claims），本回测衡量的是
 * 「看全文判分歧」方法与 v1 基线的一致性，不是绝对真值。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const parsed = JSON.parse(fs.readFileSync(path.join(DIR, "parsed.json"), "utf8"));
const claims = JSON.parse(fs.readFileSync(path.join(DIR, "claims.json"), "utf8"));
const claimSide = new Map(claims.claims.map((c) => [c.id, c.side]));

// 题级标准答案
const gtByQ = new Map();
for (const q of parsed.questions) {
  const sides = parsed.answers.filter((a) => a.questionId === q.id).map((a) => claimSide.get(a.id)).filter(Boolean);
  gtByQ.set(q.id, {
    hasOpposition: sides.includes("positive") && sides.includes("negative"),
    pos: sides.filter((s) => s === "positive").length,
    neg: sides.filter((s) => s === "negative").length,
    neu: sides.filter((s) => s === "neutral").length,
  });
}

const CACHE = path.join(DIR, ".backtest-cache.json");
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};

async function judgeOne(q, answers) {
  const body = {
    model: "deepseek-chat",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          '你在分析一个知乎问题下的多条回答。逐条判断每条回答的立场（support=支持该问题隐含的主流担忧方向 / oppose=反对 / neutral=中立或未表态），并判断这组回答之间是否存在真实的观点对立（即是否同时存在 support 与 oppose）。只输出 JSON：{"stances":[{"i":1,"stance":"support|oppose|neutral","reason":"12字内"}],"hasOpposition":true/false,"note":"一句话"}',
      },
      {
        role: "user",
        content: JSON.stringify({
          title: q.title,
          answers: answers.map((a, i) => ({
            i: i + 1,
            voteUp: a.voteUp,
            text: (a.fullText || "").replace(/\s+/g, " ").slice(0, 400),
          })),
        }),
      },
    ],
  };
  const r = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  return JSON.parse(data.choices[0].message.content);
}

const results = [];
for (const q of parsed.questions) {
  const answers = parsed.answers.filter((a) => a.questionId === q.id);
  const key = q.id;
  let out = cache[key];
  if (!out) {
    try {
      out = await judgeOne(q, answers);
      cache[key] = out;
      fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1), "utf8");
    } catch (e) {
      console.error(`FAIL ${q.id}: ${String(e).slice(0, 80)}`);
      continue;
    }
    await sleep(800);
  }
  const gt = gtByQ.get(q.id);
  // 答级一致性
  let agree = 0, total = 0;
  const norm = (s) => (s === "support" ? "positive" : s === "oppose" ? "negative" : "neutral");
  out.stances?.forEach((s, i) => {
    const a = answers[i];
    if (!a) return;
    const gtSide = claimSide.get(a.id);
    if (!gtSide) return;
    total++;
    if (norm(s.stance) === gtSide) agree++;
  });
  // 启发式基线（同题）
  let hAgree = 0;
  answers.forEach((a) => {
    const gtSide = claimSide.get(a.id);
    if (gtSide && a.polarity === gtSide) hAgree++;
  });
  results.push({
    id: q.id,
    title: q.title,
    gtOpp: gt.hasOpposition,
    gtDist: `+${gt.pos}/-${gt.neg}/~${gt.neu}`,
    llmOpp: !!out.hasOpposition,
    note: out.note || "",
    ansAgree: `${agree}/${total}`,
    heurAgree: `${hAgree}/${answers.filter((a) => claimSide.get(a.id)).length}`,
  });
  process.stdout.write(`[${q.id}] LLM判对垒=${out.hasOpposition ? "Y" : "N"} GT=${gt.hasOpposition ? "Y" : "N"} (${gt.dist0 || gtDist(gt)})\n`);
}
function gtDist(gt) { return `+${gt.pos}/-${gt.neg}/~${gt.neu}`; }

// ---- 汇总 ----
console.log("\n=== 题级：LLM 判对垒 vs 标准答案 ===");
const tp = results.filter((r) => r.gtOpp && r.llmOpp).length;
const fp = results.filter((r) => !r.gtOpp && r.llmOpp).length;
const fn = results.filter((r) => r.gtOpp && !r.llmOpp).length;
const tn = results.filter((r) => !r.gtOpp && !r.llmOpp).length;
console.log(`GT有对垒 ${tp + fn} 题，GT无对垒 ${fp + tn} 题`);
console.log(`判对: TP=${tp} TN=${tn}   判错: FP=${fp} FN=${fn}`);

console.log("\n=== 答级：LLM 逐条立场 vs 标准答案（基线=词表启发式）===");
let lT = 0, lA = 0, hT = 0, hA = 0;
for (const r of results) {
  const [a, t] = r.ansAgree.split("/").map(Number);
  lA += a; lT += t;
  const [ha, ht] = r.heurAgree.split("/").map(Number);
  hA += ha; hT += ht;
}
console.log(`LLM 全文判定: ${lA}/${lT} = ${((lA / lT) * 100).toFixed(0)}%`);
console.log(`词表启发式:   ${hA}/${hT} = ${((hA / hT) * 100).toFixed(0)}%`);

console.log("\n=== 明细 ===");
for (const r of results) {
  console.log(`[${r.gtOpp && r.llmOpp ? "TP" : r.gtOpp ? "FN" : r.llmOpp ? "FP" : "TN"}] ${r.title.slice(0, 38)}`);
  console.log(`     GT ${r.gtDist} | LLM判对垒=${r.llmOpp} | 答级 ${r.ansAgree} | 启发式 ${r.heurAgree} | ${r.note.slice(0, 50)}`);
}
fs.writeFileSync(path.join(DIR, "backtest-opposition.json"), JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 1), "utf8");
