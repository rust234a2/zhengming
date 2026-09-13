/**
 * 立场派生实验：从符号图（same-claim=+1 / rebuts=-1）二分出宏观阵营。
 *
 * 设计依据（2026-09-13 讨论结论）：
 * - 立场不再由 LLM 对文本判定（题级参照系歧义，实测仅 30% 准确），改由
 *   mine-cross 已判定的关系图派生 —— 纯图算法、可复现、零 LLM 调用。
 * - 仅对「含 rebuts 且总边数 >= 3」的连通分量做符号谱二分；
 *   其余分量/孤立论点一律中性 —— 宁可中性，不硬派阵营。
 * - 输出阵营命名为 A/B（对称，无正反之分），与「不判输赢」红线一致。
 *
 * 输入：claims.json + cross-links.json（v1 既有产物，只读）
 * 输出：polarity-report.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const claimsData = JSON.parse(fs.readFileSync(`${DIR}/claims.json`, "utf8"));
const cross = JSON.parse(fs.readFileSync(`${DIR}/cross-links.json`, "utf8"));
const claimById = new Map(claimsData.claims.map((c) => [c.id, c]));

/* ── 1. 去重（cross-links 有完全重复条目）── */
const seen = new Set();
const edges = [];
for (const l of cross.links) {
  if (l.relation !== "same-claim" && l.relation !== "rebuts") continue;
  const key = [l.source, l.target].sort().join("|") + "|" + l.relation;
  if (seen.has(key)) continue;
  seen.add(key);
  edges.push({
    a: l.source, b: l.target,
    sign: l.relation === "same-claim" ? 1 : -1,
    w: l.confidence ?? 1,
    relation: l.relation, label: l.label,
  });
}
console.log(`跨题边（去重后）: ${edges.length}（same-claim ${edges.filter(e=>e.sign>0).length} / rebuts ${edges.filter(e=>e.sign<0).length}）`);

/* ── 2. 连通分量 ── */
const adj = new Map();
for (const e of edges) {
  for (const u of [e.a, e.b]) {
    if (!adj.has(u)) adj.set(u, []);
    adj.get(u).push(e);
  }
}
const visited = new Set();
const components = [];
for (const start of adj.keys()) {
  if (visited.has(start)) continue;
  const nodes = [];
  const compEdges = [];
  const stack = [start];
  visited.add(start);
  while (stack.length) {
    const u = stack.pop();
    nodes.push(u);
    for (const e of adj.get(u)) {
      if (!compEdges.includes(e)) compEdges.push(e);
      const v = e.a === u ? e.b : e.a;
      if (!visited.has(v)) { visited.add(v); stack.push(v); }
    }
  }
  components.push({ nodes, edges: compEdges });
}

/* ── 3. 符号谱二分（幂迭代求 B 的主特征向量）── */
function spectralBipartition(nodes, compEdges) {
  const idx = new Map(nodes.map((n, i) => [n, i]));
  const n = nodes.length;
  let v = nodes.map((_, i) => (i % 2 === 0 ? 1 : -1) + 0.01 * (i + 1));
  let lambda = 0;
  for (let it = 0; it < 300; it++) {
    const nv = new Array(n).fill(0);
    for (const e of compEdges) {
      const s = e.sign * e.w;
      nv[idx.get(e.a)] += s * v[idx.get(e.b)];
      nv[idx.get(e.b)] += s * v[idx.get(e.a)];
    }
    const norm = Math.hypot(...nv);
    if (norm < 1e-12) return null;
    for (let i = 0; i < n; i++) v[i] = nv[i] / norm;
  }
  const bv = new Array(n).fill(0);
  for (const e of compEdges) {
    const s = e.sign * e.w;
    bv[idx.get(e.a)] += s * v[idx.get(e.b)];
    bv[idx.get(e.b)] += s * v[idx.get(e.a)];
  }
  lambda = v.reduce((acc, x, i) => acc + x * bv[i], 0);
  if (lambda <= 0.5) return null; // 无有意义的二分结构
  let assign = v.map((x) => (x >= 0 ? "A" : "B"));
  // 固定朝向：让字母序最小的节点落在 A（消除特征向量符号歧义）
  if (assign[0] === "B") assign = assign.map((c) => (c === "A" ? "B" : "A"));
  let sat = 0;
  for (const e of compEdges) {
    if (assign[idx.get(e.a)] !== assign[idx.get(e.b)] ? e.sign < 0 : e.sign > 0) sat++;
  }
  return { assign, lambda, balance: sat / compEdges.length };
}

/* ── 4. 逐分量派生 ── */
const result = {};
const compReports = [];
const unlinked = claimsData.claims.filter((c) => !adj.has(c.id)).map((c) => c.id);

for (let ci = 0; ci < components.length; ci++) {
  const comp = components[ci];
  const hasRebuts = comp.edges.some((e) => e.sign < 0);
  const polarizable = hasRebuts && comp.edges.length >= 3;
  const bp = polarizable ? spectralBipartition(comp.nodes, comp.edges) : null;

  const members = comp.nodes.map((id, i) => {
    const c = claimById.get(id) || {};
    return {
      id,
      camp: bp ? bp.assign[i] : "neutral",
      v1Side: c.side ?? "?",
      claim: c.claim,
      topic: claimsData.questions.find((q) => q.id === c.questionId)?.title ?? c.questionId,
    };
  });
  // 与 v1 side 的最优对齐一致率（仅供对照，不作真值）
  let agreement = null;
  if (bp) {
    const scored = members.filter((m) => m.v1Side === "positive" || m.v1Side === "negative");
    if (scored.length) {
      const match = (flip) =>
        scored.filter((m) => (flip ? m.camp === "B" : m.camp === "A") ? m.v1Side === "positive" : m.v1Side === "negative").length;
      agreement = Math.max(match(false), match(true)) / scored.length;
    }
  }
  compReports.push({
    component: ci + 1,
    size: comp.nodes.length,
    edges: comp.edges.length,
    rebuts: comp.edges.filter((e) => e.sign < 0).length,
    polarized: !!bp,
    eigenvalue: bp ? +bp.lambda.toFixed(3) : null,
    balance: bp ? +bp.balance.toFixed(3) : null,
    v1SideAgreement: agreement,
    members,
    edgeList: comp.edges.map((e) => `${e.a.slice(0, 12)} --(${e.sign > 0 ? "+" : "-"} ${e.relation}${e.label ? " " + e.label : ""})--> ${e.b.slice(0, 12)}`),
  });
  for (const m of members) result[m.id] = m.camp;
}
for (const id of unlinked) result[id] = "neutral";

const out = {
  generatedAt: new Date().toISOString(),
  method: "signed-spectral bipartition (power iteration), per connected component; rule: rebuts>=1 && edges>=3, else neutral",
  stats: {
    claims: claimsData.claims.length,
    inGraph: adj.size,
    unlinkedNeutral: unlinked.length,
    components: components.length,
    polarizedComponents: compReports.filter((r) => r.polarized).length,
  },
  components: compReports,
  polarity: result,
};
fs.writeFileSync(`${DIR}/polarity-report.json`, JSON.stringify(out, null, 2), "utf8");

/* ── 5. 摘要 ── */
console.log(`\n=== 分量概览（${components.length} 个分量 + ${unlinked.length} 条无跨题边论点）===`);
for (const r of compReports) {
  console.log(`\n分量 ${r.component}: ${r.size} 论点 / ${r.edges} 边（rebuts ${r.rebuts}）→ ${r.polarized ? `二分 λ=${r.eigenvalue} balance=${r.balance} v1一致率=${r.v1SideAgreement}` : "中性"}`);
  for (const m of r.members) {
    console.log(`  [${m.camp === "neutral" ? "中" : m.camp}] (v1:${m.v1Side}) ${m.claim?.slice(0, 42)} —— ${m.topic?.slice(0, 20)}`);
  }
}
console.log(`\n产物: polarity-report.json`);
