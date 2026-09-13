/**
 * 浅检索执行器（召回层）。
 *
 * 设计要点：
 * - 幂等：raw-discovery/qXX.json 存在且可解析则跳过，随时可断点重跑。
 * - 只走 search 通道（5000/月额度），question_answers 100/日 零消耗。
 * - question-registry.json 是全局账本：键 = zhihuId，hitBy 记录命中来源，
 *   被后续门禁拒绝的题也永久保留。
 * - query-ledger.json 记录每条 query 的执行状态与 yield（新增题数 / 成本）。
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CLI = "C:\\Users\\Lenovo\\AppData\\Local\\ZhihuCLI\\current\\zhihu-cli.exe";
const RAW = path.join(DIR, "raw-discovery");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 与 parse.mjs 同一套启发式立场判断，供单阵营统计用 */
function guessPolarity(text) {
  const neg = /不会|不能|无法|不存在|没必要|不值得|失业|收缩|替代不了|取代不了|被夸大/;
  const pos = /会|能够|可以|必然|正在|已经|值得|机会|放大|提升|不可替代/;
  const n = (text.match(neg) || []).length;
  const p = (text.match(pos) || []).length;
  if (n > p) return "negative";
  if (p > n) return "positive";
  return "neutral";
}

function snippet(text, max = 140) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  return t.slice(0, max);
}

const { queries } = JSON.parse(fs.readFileSync(path.join(DIR, "queries.json"), "utf8"));
fs.mkdirSync(RAW, { recursive: true });

const REG = path.join(DIR, "question-registry.json");
const LED = path.join(DIR, "query-ledger.json");
const registry = fs.existsSync(REG)
  ? JSON.parse(fs.readFileSync(REG, "utf8"))
  : { generatedAt: new Date().toISOString(), questions: {} };
const ledger = fs.existsSync(LED)
  ? JSON.parse(fs.readFileSync(LED, "utf8"))
  : { generatedAt: new Date().toISOString(), queries: {} };

let done = 0;
for (const q of queries) {
  const rawPath = path.join(RAW, `${q.id}.json`);

  // 幂等跳过
  if (fs.existsSync(rawPath)) {
    try {
      if (((JSON.parse(fs.readFileSync(rawPath, "utf8")).Data || {}).Items || []).length > 0) {
        if (!ledger.queries[q.id]) ledger.queries[q.id] = { text: q.text, status: "ok(skip)" };
        done++;
        continue;
      }
    } catch {}
  }

  process.stdout.write(`[${q.id}] ${q.text} ... `);
  let out = "";
  try {
    out = execFileSync(CLI, ["search", "zhihu", "--query", q.text, "--count", "10", "--timeout", "90s"], {
      encoding: "utf8",
      timeout: 100000,
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (e) {
    out = String(e.stdout || "");
  }

  let items = [];
  try {
    items = ((JSON.parse(out).Data || {}).Items) || [];
  } catch {}

  if (items.length === 0) {
    // 空结果退避一次（沿用 slow_collect 的 45s 经验，试跑收窄为 15s）
    await sleep(15000);
    try {
      out = execFileSync(CLI, ["search", "zhihu", "--query", q.text, "--count", "10", "--timeout", "90s"], {
        encoding: "utf8",
        timeout: 100000,
        maxBuffer: 32 * 1024 * 1024,
      });
      items = ((JSON.parse(out).Data || {}).Items) || [];
    } catch {}
  }

  fs.writeFileSync(rawPath, out || "{}", "utf8");

  // 入账本
  const knownBefore = Object.keys(registry.questions).length;
  let hits = 0;
  for (const it of items) {
    const m = (it.Url || "").match(/question\/(\d+)/);
    if (!m) continue;
    hits++;
    const zid = m[1];
    if (!registry.questions[zid]) {
      registry.questions[zid] = {
        id: `zh-${zid}`,
        zhihuId: zid,
        url: `https://www.zhihu.com/question/${zid}`,
        title: (it.Title || "").replace(/ - 知乎$/, "").trim(),
        hitBy: [],
        answers: [],
      };
    }
    const rec = registry.questions[zid];
    if (!rec.hitBy.includes(q.id)) rec.hitBy.push(q.id);
    if (!rec.answers.some((a) => a.aid === `a-${it.ContentID}`)) {
      rec.answers.push({
        aid: `a-${it.ContentID}`,
        voteUp: it.VoteUpCount || 0,
        polarity: guessPolarity(it.ContentText || ""),
        snippet: snippet(it.ContentText || ""),
      });
    }
  }
  const newQ = Object.keys(registry.questions).length - knownBefore;
  ledger.queries[q.id] = {
    text: q.text,
    construction: q.construction,
    status: items.length > 0 ? "ok" : "empty",
    itemCount: items.length,
    questionHits: hits,
    newQuestions: newQ,
    yield: newQ,
  };
  console.log(`${items.length} 条回答 / ${hits} 题 / 新增 ${newQ}`);

  fs.writeFileSync(REG, JSON.stringify(registry, null, 1), "utf8");
  fs.writeFileSync(LED, JSON.stringify(ledger, null, 1), "utf8");
  done++;
  if (done < queries.length) await sleep(3000);
}

console.log(`\nDONE ${done}/${queries.length}`);
