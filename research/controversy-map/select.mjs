/**
 * 选题器（发现期 → 深挖期的闸口）。
 *
 * 打分口径（PILOT-REPORT 2026-09-13 修订版——不含任何立场/对垒项）：
 *   score = 2 × 多重命中数 + min(采样回答数, 6) + 深挖加成
 * 只从门禁「放行」的议题里选；按分排序取 TOP_N。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const TOP_N = Number(process.argv[2] || 40);

const gated = JSON.parse(fs.readFileSync(path.join(DIR, "gated.json"), "utf8"));
const reg = JSON.parse(fs.readFileSync(path.join(DIR, "question-registry.json"), "utf8"));
const queries = JSON.parse(fs.readFileSync(path.join(DIR, "queries.json"), "utf8")).queries;
const qById = new Map(queries.map((q) => [q.id, q]));

const passed = new Set(gated.rows.filter((r) => r.verdict === "放行").map((r) => r.zhihuId));
const rows = [];
for (const zid of passed) {
  const q = reg.questions[zid];
  if (!q || q.answers.length === 0) continue;
  const subjects = new Set(
    q.hitBy.map((hid) => qById.get(hid)?.slots?.subject).filter(Boolean),
  );
  rows.push({
    zhihuId: zid,
    title: q.title,
    url: q.url,
    score: 2 * q.hitBy.length + Math.min(q.answers.length, 6),
    hitBy: q.hitBy.length,
    sampledAnswers: q.answers.length,
    subjects: [...subjects],
  });
}
rows.sort((a, b) => b.score - a.score);

// 主体多样性：同一主体槽最多 6 题，防止清单被单一职业占满
const perSubject = {};
const picked = [];
for (const r of rows) {
  const key = r.subjects[0] || "其他";
  perSubject[key] = (perSubject[key] || 0) + 1;
  if (perSubject[key] > 6) continue;
  picked.push(r);
  if (picked.length >= TOP_N) break;
}

fs.writeFileSync(
  path.join(DIR, "deep-dive.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), topN: TOP_N, picked }, null, 1),
  "utf8",
);
console.log(`候选 ${rows.length} → 选出 ${picked.length}（TOP_N=${TOP_N}）`);
const bySub = {};
for (const p of picked) bySub[p.subjects[0] || "其他"] = (bySub[p.subjects[0] || "其他"] || 0) + 1;
console.log("主体分布:", JSON.stringify(bySub));
for (const p of picked.slice(0, 12)) console.log(`  [${p.score}] (${p.hitBy}命中/${p.sampledAnswers}答) ${p.title.slice(0, 44)}`);
