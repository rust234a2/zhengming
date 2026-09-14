/**
 * 大话题域归类：用一次 LLM 调用把全部议题标题归入 6-10 个互斥的大话题域。
 *
 * 输入：web/src/data/controversyMap.ts（整体 JSON.parse，见 parseControversyMap）
 * 输出：
 *   - research/controversy-map/domains.json（管线侧留档）
 *   - web/src/data/controversyDomains.ts（前端用，ControversyMap.ts 不动，
 *     域是视图层推导，不进争议地图本体数据结构）
 *
 * 校验：每个议题必须恰好归入一个域、域数 6-10、域内议题数 >= 2。
 * 校验不过自动重试（最多 3 次），仍失败则退出非零。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const MAP_TS = path.join(DIR, "../../web/src/data/controversyMap.ts");
const OUT_JSON = path.join(DIR, "domains.json");
const OUT_TS = path.join(DIR, "../../web/src/data/controversyDomains.ts");

const KEY = process.env.DEEPSEEK_API_KEY;
if (!KEY) throw new Error("DEEPSEEK_API_KEY missing");

/** controversyMap.ts 除头两行外就是纯 JSON（build-ts 生成的 JSON 序列化）。 */
function parseControversyMap() {
  const raw = fs.readFileSync(MAP_TS, "utf8");
  const start = raw.indexOf("{", raw.indexOf("CONTROVERSY_MAP"));
  const end = raw.lastIndexOf("}");
  return JSON.parse(raw.slice(start, end + 1));
}

const map = parseControversyMap();
const topics = map.nodes.filter((n) => n.kind === "topic");

const SYSTEM = `你是知识图谱架构师。任务：把一批知乎争议议题归入若干「大话题域」（domain）。

要求：
1. 域的数量 6-10 个，互斥且并起来覆盖全部议题；每个域至少 2 个议题。
2. 域的划分依据是议题讨论的现实领域（如：就业与职业、教育与培养、医疗健康、创作与版权…），不是立场，不是结论。
3. name 是 2-8 个字的域名（如「就业与职业」）；summary 是一句话（15-30 字）说明这个域里在争什么。
4. 每个议题必须归入恰好一个域，topicIds 并集 = 全部输入 id，不得遗漏、不得重复。
5. 归属拿不准时，选议题「最主要的争论领域」；跨域议题按标题中占主导的领域分。

只输出 JSON 对象：{"domains":[{"name":"...","summary":"...","topicIds":["..."]}]}，不要 markdown 包裹。`;

async function callLLM() {
  const payload = topics.map((t) => ({ id: t.id, title: t.fullLabel ?? t.label }));
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `共 ${payload.length} 个议题。请输出域划分 JSON。\n\n${JSON.stringify(payload)}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`DeepSeek error: ${json.error.message}`);
  const content = json.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  return parsed.domains || parsed.results || [];
}

/** 校验并规整 LLM 输出；不合法返回 null（带原因）。 */
function validate(rawDomains) {
  if (!Array.isArray(rawDomains) || rawDomains.length < 6 || rawDomains.length > 10) {
    return { ok: false, reason: `域数量 ${rawDomains?.length} 不在 6-10` };
  }
  const seen = new Map();
  const domains = [];
  for (const [i, d] of rawDomains.entries()) {
    const ids = [...new Set(d.topicIds || [])];
    if (!d.name || ids.length < 2) {
      return { ok: false, reason: `域 ${i}（${d.name ?? "?"}）缺 name 或议题数 < 2` };
    }
    for (const id of ids) {
      if (!topics.some((t) => t.id === id)) {
        return { ok: false, reason: `未知 topicId：${id}` };
      }
      if (seen.has(id)) return { ok: false, reason: `议题 ${id} 重复归入 ${seen.get(id)} 与 ${d.name}` };
      seen.set(id, d.name);
    }
    domains.push({ id: `dm-${i + 1}`, name: d.name.trim(), summary: (d.summary || "").trim(), topicIds: ids });
  }
  if (seen.size !== topics.length) {
    return { ok: false, reason: `覆盖 ${seen.size}/${topics.length}，有遗漏` };
  }
  return { ok: true, domains };
}

let result = null;
let lastReason = "";
for (let attempt = 1; attempt <= 3; attempt += 1) {
  const raw = await callLLM();
  const v = validate(raw);
  if (v.ok) {
    result = v.domains;
    break;
  }
  lastReason = v.reason;
  console.error(`[attempt ${attempt}] 校验失败：${v.reason}`);
}
if (!result) {
  console.error(`3 次尝试均未通过校验，最后原因：${lastReason}`);
  process.exit(1);
}

const topicToDomain = {};
for (const d of result) for (const id of d.topicIds) topicToDomain[id] = d.id;

const generatedAt = new Date().toISOString();
fs.writeFileSync(
  OUT_JSON,
  JSON.stringify({ generatedAt, source: map.source, domains: result, topicToDomain }, null, 2) + "\n",
);

// 前端数据文件：与 controversyMap.ts 同风格（自动生成、禁止手改）
const header = `/**
 * 大话题域归类 —— 自动生成，请勿手工编辑。
 * 生成脚本：research/controversy-map/assign-domains.mjs
 * 生成时间：${generatedAt}
 *
 * 域是「议题的现实领域」分组（就业/教育/医疗…），刻意与立场无关：
 * 立场分区已在设计上被否决（side 退出分析层口径），域只回答「这些题在争哪个领域的事」。
 */

import type { ControversyDomainsData } from "../types/map";

export const CONTROVERSY_DOMAINS: ControversyDomainsData = `;

fs.writeFileSync(
  OUT_TS,
  header + JSON.stringify({ generatedAt, domains: result, topicToDomain }, null, 2) + ";\r\n",
);

const sizes = result.map((d) => `${d.name}(${d.topicIds.length})`).join(" ");
console.log(`OK：${result.length} 个域，覆盖 ${topics.length} 题`);
console.log(sizes);
