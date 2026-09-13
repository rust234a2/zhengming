/**
 * 从 map.json 生成前端数据模块。
 * 输出 TS 文件，数据内联，避免运行时 fetch（桌面端打包后没有静态服务器）。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(DIR, "map.json");
/* 跨仓写入：生成的数据模块落在 runi 桌面端（争鸣的桌面端两图仍在那里）。
 * 默认按「zhengming 与 runi 同级」推导，可用 RUNI_DESKTOP_DATA 覆盖。 */
const OUT = process.env.RUNI_DESKTOP_DATA
  ?? path.resolve(DIR, "../../../../runi/runi-desktop/src/data/controversyMap.ts");

const raw = JSON.parse(fs.readFileSync(SRC, "utf8"));

/* ── 筛选：保留「有实质内容」的议题 ──
 * 判定标准（满足任一即保留）：
 *   1) 该议题下 ≥2 条论点（有可对比的立场）
 *   2) 该议题被 ≥1 条 bridge 边命中（参与了跨议题主张 —— 这类议题
 *      哪怕只有 1 条论点也必须保留，因为它正是"缝合线"的证据本体）
 *   3) 该议题参与了 rebuts 边（跨议题矛盾是最有价值的信号）
 * 早期版本要求 bridge ≥2，导致最强的主张簇被连带筛掉、rebuts 全灭。
 */
const topicClaims = {};
const topicBridge = {};
const topicRebuts = new Set();
for (const n of raw.nodes) if (n.kind === "claim") topicClaims[n.topicId] = (topicClaims[n.topicId] || 0) + 1;
for (const e of raw.edges) if (e.relation === "bridge") topicBridge[e.target] = (topicBridge[e.target] || 0) + 1;
for (const e of raw.edges) {
  if (e.relation !== "rebuts") continue;
  const s = raw.nodes.find((n) => n.id === e.source);
  const t = raw.nodes.find((n) => n.id === e.target);
  if (s?.topicId) topicRebuts.add(s.topicId);
  if (t?.topicId) topicRebuts.add(t.topicId);
}

const keep = new Set();
for (const n of raw.nodes) {
  if (n.kind === "topic") {
    if ((topicClaims[n.id] || 0) >= 2 || (topicBridge[n.id] || 0) >= 1 || topicRebuts.has(n.id)) {
      keep.add(n.id);
    }
  } else {
    keep.add(n.id);
  }
}
// 剔除议题后，其下论点若不再有任何连接则一并剔除
for (const n of raw.nodes) if (n.kind === "claim" && !keep.has(n.topicId)) keep.delete(n.id);

// 去重：同一议题下措辞完全相同的论点只保留一条（原始检索有重复项）
const seenClaim = new Set();
for (const n of raw.nodes) {
  if (n.kind !== "claim") continue;
  const key = `${n.topicId}|${n.fullLabel}`;
  if (seenClaim.has(key)) keep.delete(n.id);
  else seenClaim.add(key);
}

let nodes = raw.nodes.filter((n) => keep.has(n.id));
let ids = new Set(nodes.map((n) => n.id));
let edges = raw.edges.filter((e) => ids.has(e.source) && ids.has(e.target));

// 清理没有任何边的节点（力导向里会变成漂浮孤岛）
const deg = {};
for (const e of edges) {
  deg[e.source] = (deg[e.source] || 0) + 1;
  deg[e.target] = (deg[e.target] || 0) + 1;
}
nodes = nodes.filter((n) => deg[n.id]);
ids = new Set(nodes.map((n) => n.id));
edges = edges.filter((e) => ids.has(e.source) && ids.has(e.target));

/* ── 增强：给 cluster 补 topicCount（它缝合了多少个议题）——这是视觉权重的依据 ── */
for (const n of nodes) {
  if (n.kind === "cluster") {
    const topics = new Set(
      edges.filter((e) => e.relation === "bridge" && e.source === n.id).map((e) => e.target),
    );
    n.topicCount = topics.size;
  }
}

const stats = {
  topics: nodes.filter((n) => n.kind === "topic").length,
  claims: nodes.filter((n) => n.kind === "claim").length,
  clusters: nodes.filter((n) => n.kind === "cluster").length,
  edges: edges.length,
  bridge: edges.filter((e) => e.relation === "bridge").length,
  member: edges.filter((e) => e.relation === "member").length,
  rebuts: edges.filter((e) => e.relation === "rebuts").length,
  contains: edges.filter((e) => e.relation === "contains").length,
};

const body = `/**
 * 跨议题争议地图数据 —— 自动生成，请勿手工编辑。
 * 生成脚本：zhengming 仓库 docs/research/controversy-map/build-ts.mjs
 *
 * 数据来源：zhihu-cli search zhihu 真实检索（5 次调用，覆盖 5 个检索簇）
 *          → LLM 提炼论点与立场 → LLM 跨议题语义挖掘 → 主张簇归一
 * 生成时间：${raw.generatedAt}
 */

import type { ControversyMapData } from "../types/map";

export const CONTROVERSY_MAP: ControversyMapData = ${JSON.stringify(
  { generatedAt: raw.generatedAt, source: raw.source, stats, nodes, edges },
  null,
  2,
)};
`;

fs.writeFileSync(OUT, body, "utf8");

console.log("写入:", OUT);
console.log("统计:", JSON.stringify(stats));
console.log("文件大小:", fs.statSync(OUT).size, "bytes");
console.log("\n--- 主张簇（图骨架）---");
for (const n of nodes.filter((x) => x.kind === "cluster").sort((a, b) => b.weight - a.weight)) {
  console.log(`  [${n.side}] ${n.label} — 缝合 ${n.topicCount} 个议题, ${n.weight} 条成员边`);
}
console.log("\n--- 议题 ---");
for (const n of nodes.filter((x) => x.kind === "topic")) {
  console.log(`  ${n.fullLabel.slice(0, 50)}`);
}
console.log(`\n论点 ${stats.claims} 条，示例：`);
for (const n of nodes.filter((x) => x.kind === "claim").slice(0, 3)) {
  console.log(`  [${n.side}] ${n.fullLabel.slice(0, 46)}`);
}
