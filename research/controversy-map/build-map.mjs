/**
 * 第三步：把跨议题边聚合成「主张簇」，生成地图最终数据。
 *
 * 为什么要聚簇：LLM 给出的 label 有同义异名（"程序员价值转向担责" /
 * "人类核心价值在担责" / "AI时代核心价值是担责" 其实是同一主张）。
 * 若不归一化，图里会出现冗余的网格边，力导向会把它拉成一坨。
 *
 * 最终模型：
 *   topic 节点（知乎真实问题）
 *   claim 节点（真实回答里的主张，归属唯一 topic）
 *   cluster 节点（跨议题共享的主张簇 —— 这张图的骨架，图里最重要的节点）
 *   边：contains(topic→claim) / authored(人→claim) / member(claim→cluster)
 *       bridge(cluster→topic) 表示"该主张在这个议题下也出现过"
 *       rebuts(claim↔claim) 跨议题矛盾
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { selectClusterLinks } from "./build-map-core.mjs";

/** 路径一律相对脚本自身推导 */
const DIR = path.dirname(fileURLToPath(import.meta.url));
const KEY = process.env.DEEPSEEK_API_KEY;

const claimsData = JSON.parse(fs.readFileSync(`${DIR}/claims.json`, "utf8"));
const cross = JSON.parse(fs.readFileSync(`${DIR}/cross-links.json`, "utf8"));
const clusterLinks = selectClusterLinks(cross.links);

const claims = claimsData.claims;
const claimById = new Map(claims.map((c) => [c.id, c]));

/* ── 1. 收集所有非空 label，让 LLM 做同义归一 ── */
const rawLabels = [...new Set(clusterLinks.map((l) => l.label).filter(Boolean))];

const SYSTEM = `你是知识图谱构建者。给你一组中文主张标签（来自知乎不同议题下的论点挖掘），请把它们归并为若干个「主张簇」。

规则：
- 语义相同或高度重叠的标签合并为一个簇（例如"程序员价值转向担责"和"人类核心价值在担责"是同一件事）。
- 每个簇给出：id（英文短横线小写）、label（12 字以内的中文名）、summary（一句话说清这个主张是什么，25 字内）、side（positive/negative/neutral，指对"AI 冲击该领域"的立场倾向）。
- 不能合并的标签单独成簇。
- 输出 JSON: {"clusters":[{"id":"...","label":"...","summary":"...","side":"...","members":["原标签1","原标签2"]}]}
- 必须覆盖输入里的每一个标签，不能遗漏。`;

async function mergeLabels(labels) {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `标签列表：\n${labels.map((l, i) => `${i + 1}. ${l}`).join("\n")}` },
      ],
      temperature: 0.1,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    }),
  });
  const json = await res.json();
  return JSON.parse(json.choices?.[0]?.message?.content || "{}").clusters || [];
}

console.log(`待归一的标签数: ${rawLabels.length}`);
const clusters = await mergeLabels(rawLabels);
console.log(`归并为 ${clusters.length} 个主张簇:`);
for (const c of clusters) console.log(`  [${c.side}] ${c.label} — ${c.summary} (${c.members.join(" / ")})`);

/* ── 2. 建立 label → cluster 映射 ── */
const labelToCluster = new Map();
for (const c of clusters) for (const m of c.members) labelToCluster.set(m, c.id);

/* ── 3. 生成节点 ── */
const nodes = [];
const edges = [];

// topic 节点
const topicAnswerCount = {};
for (const c of claims) topicAnswerCount[c.questionId] = (topicAnswerCount[c.questionId] || 0) + 1;

for (const q of claimsData.questions) {
  nodes.push({
    id: q.id,
    kind: "topic",
    label: q.title.length > 26 ? q.title.slice(0, 25) + "…" : q.title,
    fullLabel: q.title,
    url: q.url,
    weight: topicAnswerCount[q.id] || 0,
  });
}

// claim 节点
for (const c of claims) {
  nodes.push({
    id: c.id,
    kind: "claim",
    label: c.claim.length > 30 ? c.claim.slice(0, 29) + "…" : c.claim,
    fullLabel: c.claim,
    side: c.side,
    reasonType: c.reasonType,
    quality: c.quality,
    votes: c.voteUp,
    topicId: c.questionId,
    url: c.url,
  });
  edges.push({ source: c.questionId, target: c.id, relation: "contains" });
}

// cluster 节点（图的核心）
const clusterMemberCount = {};
for (const c of clusters) clusterMemberCount[c.id] = 0;

for (const l of clusterLinks) {
  const cid = labelToCluster.get(l.label);
  if (!cid) continue;
  clusterMemberCount[cid] = (clusterMemberCount[cid] || 0) + 1;
}

for (const c of clusters) {
  const n = clusterMemberCount[c.id] || 0;
  // 只保留真正跨议题的簇（成员边 >= 2，即至少缝合两个议题）
  if (n < 2) continue;
  nodes.push({
    id: `cl-${c.id}`,
    kind: "cluster",
    label: c.label,
    summary: c.summary,
    side: c.side,
    weight: n,
  });
}

/* ── 4. 生成边 ── */
const clusterIds = new Set(nodes.filter((n) => n.kind === "cluster").map((n) => n.id));
const bridgedPairs = new Set();

for (const l of clusterLinks) {
  const cid = labelToCluster.get(l.label);
  if (!cid) continue;
  const clusterId = `cl-${cid}`;
  if (!clusterIds.has(clusterId)) continue;

  const src = claimById.get(l.source);
  const tgt = claimById.get(l.target);
  if (!src || !tgt) continue;

  // claim → cluster 归属边
  for (const cl of [src, tgt]) {
    const eid = `${cl.id}->${clusterId}`;
    if (!bridgedPairs.has(eid)) {
      bridgedPairs.add(eid);
      edges.push({ source: cl.id, target: clusterId, relation: "member" });
    }
  }
  // cluster → topic 桥接边（表示该主张在此议题下也成立）
  for (const tid of [src.questionId, tgt.questionId]) {
    const eid = `${clusterId}->${tid}`;
    if (!bridgedPairs.has(eid)) {
      bridgedPairs.add(eid);
      edges.push({ source: clusterId, target: tid, relation: "bridge" });
    }
  }
}

// 跨议题 rebuts 边
const rebutSeen = new Set();
for (const l of cross.links) {
  if (l.relation !== "rebuts") continue;
  const key = [l.source, l.target].sort().join("|");
  if (rebutSeen.has(key)) continue;
  rebutSeen.add(key);
  edges.push({ source: l.source, target: l.target, relation: "rebuts" });
}

const out = {
  generatedAt: new Date().toISOString(),
  source: "发现管线 v2：lexicon v2 × 49 query 浅检索 → 门禁 → 完整标题深挖 → LLM 提炼/比对（全部真实检索）",
  stats: {
    topics: nodes.filter((n) => n.kind === "topic").length,
    claims: nodes.filter((n) => n.kind === "claim").length,
    clusters: nodes.filter((n) => n.kind === "cluster").length,
    edges: edges.length,
    bridgeEdges: edges.filter((e) => e.relation === "bridge").length,
    memberEdges: edges.filter((e) => e.relation === "member").length,
    rebutsEdges: edges.filter((e) => e.relation === "rebuts").length,
  },
  nodes,
  edges,
};

fs.writeFileSync(`${DIR}/map.json`, JSON.stringify(out, null, 2), "utf8");

console.log(`\n=== 地图统计 ===`);
console.log(JSON.stringify(out.stats, null, 2));
console.log("\n=== 主张簇（图骨架）===");
for (const n of nodes.filter((x) => x.kind === "cluster").sort((a, b) => b.weight - a.weight)) {
  const touched = new Set(edges.filter((e) => e.relation === "bridge" && e.source === n.id).map((e) => e.target));
  console.log(`  [${n.side}] ${n.label} (${n.weight}边/跨${touched.size}议题) — ${n.summary}`);
}
