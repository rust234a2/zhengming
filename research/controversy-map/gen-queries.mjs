/**
 * 三维张量（facet × 主体 × 判据）展开为 query 清单。
 *
 * 三种构造式（本轮试跑）：
 * 1. 冲突对式 —— 同主体肯定式 + 「为什么…不会」否定式成对，唯一能一次捞到正反双方的构造。
 * 2. 判据式   —— 〈主体〉〈判据〉，跨主体共享同一判据 token，为跨议题关系预置交集。
 * 3. 拼接式   —— 〈教育主体〉〈facet 后缀〉，覆盖教育与职业转换面。
 *
 * 产出 queries.json；不发起任何网络请求。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const lex = JSON.parse(fs.readFileSync(path.join(DIR, "lexicon.json"), "utf8"));

const queries = [];
let n = 0;
const add = (construction, slots, text) =>
  queries.push({ id: `q${String(++n).padStart(2, "0")}`, construction, slots, text });

// 1. 冲突对式：v1 的 6 主体 × 2（固定 slice(0,6)，v2 新主体在后面追加，保证已有 id 稳定）
for (const s of lex.subjects.slice(0, 6)) {
  add("conflict-pos", { subject: s, polarity: "pos" }, `AI 会取代${s}吗`);
  add("conflict-neg", { subject: s, polarity: "neg" }, `${s} 为什么不会被 AI 取代`);
}

// 2. 判据式：判据跨主体复用（共享 token 预置跨议题交集）
const judgmentPairs = [
  ["程序员", "技术壁垒", "护城河"],
  ["设计师", "技术壁垒", "护城河"],
  ["程序员", "需求本质", "招聘"],
  ["翻译", "行业周期", "机器翻译"],
  ["插画师", "成本经济", "接单"],
  ["文案", "责任归属", "品牌"],
];
for (const [s, m, extra] of judgmentPairs) add("judgment", { subject: s, judgment: m }, `${s} ${m} ${extra} AI`);

// 3. 拼接式：教育 / 转换面（v1 的 4 条保持原序，id 稳定）
add("facet", { subject: "计算机专业", facet: "还值得吗" }, `${lex.educationSubjects[0]}还值得报考吗 就业前景`);
add("facet", { subject: "学编程", facet: "还值得吗" }, `AI 时代还值得${lex.educationSubjects[1]}吗`);
add("facet", { subject: "插画师", facet: "如何看待" }, `如何看待 AI 取代插画师`);
add("facet", { subject: "程序员", facet: "真的能" }, `AI 真的能替代程序员吗`);

// ── v2 扩量（只追加，不改前面已生成 query 的 id/文本，discover 幂等依赖 id 对应）──
// 4. 冲突对式：v2 新增 8 个主体 × 2
const v2Subjects = lex.subjects.slice(6);
for (const s of v2Subjects) {
  add("conflict-pos", { subject: s, polarity: "pos", gen: "v2" }, `AI 会取代${s}吗`);
  add("conflict-neg", { subject: s, polarity: "neg", gen: "v2" }, `${s} 为什么不会被 AI 取代`);
}

// 5. 拼接式：v2 新主体的行业冲击评价面（观点评价族，可用区产出高）
for (const s of v2Subjects) {
  add("facet", { subject: s, facet: "如何看待", gen: "v2" }, `如何看待 AI 对${s}行业的冲击`);
}

// 6. 拼接式：v2 新增教育主体（专业报考价值，决策抉择族，甜区）
const v2Edu = lex.educationSubjects.slice(2);
for (const s of v2Edu) {
  add("facet", { subject: s, facet: "还值得吗", gen: "v2" }, `${s}还值得报考吗 AI`);
}

fs.writeFileSync(
  path.join(DIR, "queries.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), domain: lex.domain, queries }, null, 2),
  "utf8",
);
console.log(`queries: ${queries.length}`);
const byC = {};
for (const q of queries) byC[q.construction] = (byC[q.construction] || 0) + 1;
console.log(byC);
