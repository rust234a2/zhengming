/**
 * 门禁（三带路由）。接在 discover 之后、深挖之前。
 *
 * 规则带：classify.py 的 RULES + sub_tier 原样移植（确定性、零成本）。
 *   - tier ∈ 甜区/可用区 且无宾语碰撞 → 放行
 *   - tier = 排除区 → 拒绝
 *   - 其余（弱可辩 / 其他未分类 / 零命中）→ 灰带
 * 灰带（--gray 才启用）：LLM 不做分类，改做生成式判定——
 *   「正反双方各自的最强理由是什么？任一方说不出理由 → 不可辩」。
 *   判据天然贴合地图的存在理由（有对垒才有图），且偏召回。
 *
 * cache：key = sha1(title) + PROMPT_VERSION，改 prompt 必须换版本号。
 * 金牌回归：--test 用现有 parsed.json 的真实议题回测规则带。
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PROMPT_VERSION = "v2-multi-angle";

// ---------- 规则带（原样移植 classify.py） ----------
const RULES = [
  ["情境假设", [/穿越/, /如果.{0,16}你会/, /假如你是/, /假设你/, /如果是你/, /你会怎么办/, /重生/]],
  ["事实核查", [/是真的吗/, /真的吗/, /真的假的/, /谣言/, /辟谣/, /确有其事/, /真实性/, /是不是真的/]],
  ["观点评价", [/如何评价/, /怎么看/, /如何看待/, /怎么看待/, /怎样看待/, /如何看/, /作何评价/, /怎么评价/]],
  ["决策抉择", [/该不该/, /要不要/, /值得吗/, /有必要吗/, /应不应该/, /值不值/, /划不划算/]],
  ["预测推演", [/会不会/, /能.{0,10}吗/, /会成为/, /意味着什么/, /会产生哪些影响/, /带来哪些/, /还有.{0,4}竞争力吗/, /不可避免吗/]],
  ["资源聚合", [/有哪些/, /有什么/, /求推荐/, /推荐一下/, /盘点/, /汇总/, /合集/, /书单/, /清单/, /值得一看/]],
  ["经验叙事", [/是什么体验/, /什么感受/, /什么感觉/, /我的.{0,8}经历/, /我是怎么/]],
  ["实务求助", [/怎么办/, /怎么才能/, /该如何/, /求教/, /求助/, /请教/, /注意什么/, /怎么处理/, /如何办理/, /需要什么/]],
  ["概念辨析", [/是什么/, /什么叫/, /什么意思/, /的定义/, /到底指/, /算是/, /算不算/]],
  ["比较选择", [/哪个更好/, /哪个更/, /还是.{0,12}哪个/, /对比/, /vs/, /有什么区别/, /哪个更值得/]],
  ["归因探究", [/为什么/, /为何/, /是什么原因/, /怎么会/, /咋回事/]],
  ["审美评价", [/好看吗/, /好听吗/, /水平如何/, /成色/, /怎么样/]],
];
const SCIENCE_HINT = /体温|大脑|物理|化学|数学|生物|光|电|原子|进化|宇宙|地球|医学|病|发烧|睡眠|记忆|神经|算法|模型训练/;
const MOTIVE_HINT = /他|她|为什么要在|心理|动机|是不是故意|为什么总|为什么喜欢问/;
const SOCIAL_HINT = /年轻人|90后|00后|社会|教育|职场|房价|生育|结婚|躺平|内卷|县城|农村|行业|公司|市场|政策|文化|历史|为什么现在|为什么很多/;
const TIER = {
  事实核查: ["排除区", "有唯一答案，查证即可"],
  资源聚合: ["排除区", "答案是清单，不存在对立立场"],
  实务求助: ["排除区", "求的是步骤，不是观点"],
  经验叙事: ["排除区", "比的是经历，不是论证"],
  审美评价: ["弱可辩", "偏好分歧，无推理链"],
  归因探究: ["弱可辩→可用", "取决于宾语"],
  概念辨析: ["可用区", "可辩性高、天然收敛"],
  比较选择: ["可用区", "可辩，易退化成参数罗列"],
  观点评价: ["甜区（高风险）", "主战场，事实未定情绪高"],
  决策抉择: ["甜区", "价值取舍，无事实争议"],
  预测推演: ["甜区", "可证伪"],
  情境假设: ["甜区", "无标准答案，需完整推理链"],
  "其他/未分类": ["待判", "需人工复核"],
};

function classify(title) {
  for (const [name, pats] of RULES) {
    for (const p of pats) {
      if (p.test(title)) return name;
    }
  }
  return "其他/未分类";
}

function subTier(ttype, title) {
  if (ttype === "归因探究") {
    if (SCIENCE_HINT.test(title)) return ["排除区", "问科学机制，有标准答案"];
    if (MOTIVE_HINT.test(title)) return ["弱可辩", "揣测他人动机（规则疑似过宽，仅送灰带不直接拒）"];
    if (SOCIAL_HINT.test(title)) return ["可用区", "问社会成因，可辩"];
    return ["弱可辩", "归因对象不明确"];
  }
  if (ttype === "观点评价") {
    if (/电影|电视剧|综艺|游戏|小说|专辑|歌|角色|演员|导演|恋综|评分/.test(title)) return ["弱可辩", "评价文艺作品"];
    if (/去世|逝世|事件|通报|政策|宣布|披露|争议|曝光|上市|发布/.test(title)) return ["甜区（高风险）", "评价公共事件"];
    return ["可用区", "评价人物或长期现象"];
  }
  const t = TIER[ttype] || ["待判", ""];
  return t;
}

function ruleBand(title) {
  const t = classify(title);
  const [tier, note] = subTier(t, title);
  let verdict;
  if (tier === "甜区" || tier === "可用区") verdict = "放行";
  else if (tier === "排除区") verdict = "拒绝";
  else verdict = "灰带"; // 甜区（高风险）/ 弱可辩 / 待判 全送灰带
  return { type: t, hit: tier, tier, note, verdict, band: "rule" };
}

// ---------- 灰带（LLM 生成式判定） ----------
const CACHE = path.join(DIR, ".gate-cache.json");
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};

async function grayBand(titles) {
  const key = (t) => crypto.createHash("sha1").update(t + "|" + PROMPT_VERSION).digest("hex");
  const need = titles.filter((t) => !(key(t) in cache));
  for (let i = 0; i < need.length; i += 10) {
    const batch = need.slice(i, i + 10);
    const body = {
      model: "deepseek-chat",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            '你是辩论议题的可行性评审。对给定的每个知乎问题标题，给出这个话题下 2~4 个互不相同的讨论角度，每个角度一句话说清它与别的角度差别在哪（30字内）。注意：角度是多元的，不限于正反两派；若给不出 2 个真正互不相同的角度，则该题不可辩。只输出 JSON：{"results":[{"title":"…","angles":["角度1","角度2","角度3"],"debatable":true/false,"reason":"一句话"}]}',
        },
        { role: "user", content: JSON.stringify(batch) },
      ],
    };
    const r = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    let parsed;
    try {
      parsed = JSON.parse(data.choices[0].message.content);
    } catch {
      console.error("LLM parse fail, batch skipped:", (data.error && data.error.message) || "?");
      continue;
    }
    for (const item of parsed.results || []) cache[key(item.title)] = { ...item, promptVersion: PROMPT_VERSION };
    console.log(`  gray batch ${Math.floor(i / 10) + 1}: ${batch.length} 题`);
    await sleep(1200);
  }
  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1), "utf8");
  return titles.map((t) => {
    const c = cache[key(t)];
    return c
      ? { type: "灰带-LLM", tier: c.debatable ? "甜区/可用（LLM 多角度判定）" : "不可辩", note: `角度:${(c.angles || []).join("｜")}`, verdict: c.debatable ? "放行" : "拒绝", band: "gray" }
      : { type: "灰带-LLM", tier: "未判定", note: "调用失败", verdict: "灰带", band: "gray" };
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- 主流程 ----------
const args = process.argv.slice(2);
const titlesFrom = (f, pick) => {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  return pick(d);
};

if (args.includes("--test")) {
  // 金牌回归：现有语料的真实议题（旧门禁的误杀样本必须在里面）
  const qs = titlesFrom("parsed.json", (d) => d.questions);
  const rows = qs.map((q) => ({ title: q.title, ...ruleBand(q.title) }));
  const cnt = {};
  for (const r of rows) cnt[r.verdict] = (cnt[r.verdict] || 0) + 1;
  console.log("金牌集回测（parsed.json 真实议题）:", cnt);
  for (const r of rows) console.log(`  [${r.verdict}] (${r.type}/${r.tier}) ${r.title}`);
} else {
  const reg = JSON.parse(fs.readFileSync(path.join(DIR, "question-registry.json"), "utf8"));
  const all = Object.values(reg.questions);
  const ruleRows = all.map((q) => ({ zhihuId: q.zhihuId, title: q.title, ...ruleBand(q.title) }));
  const grayTitles = ruleRows.filter((r) => r.verdict === "灰带").map((r) => r.title);
  let grayRows = [];
  if (args.includes("--gray") && grayTitles.length > 0) {
    console.log(`灰带 ${grayTitles.length} 题，走 LLM 生成式判定...`);
    grayRows = await grayBand(grayTitles);
  }
  const out = { generatedAt: new Date().toISOString(), promptVersion: PROMPT_VERSION, rows: ruleRows };
  if (grayRows.length > 0) {
    const map = new Map(grayTitles.map((t, i) => [t, grayRows[i]]));
    for (const r of out.rows) if (r.verdict === "灰带") Object.assign(r, map.get(r.title) || {});
  }
  fs.writeFileSync(path.join(DIR, "gated.json"), JSON.stringify(out, null, 1), "utf8");
  const cnt = { 放行: 0, 拒绝: 0, 灰带: 0 };
  for (const r of out.rows) cnt[r.verdict] = (cnt[r.verdict] || 0) + 1;
  console.log(`门禁完成：${all.length} 题 →`, cnt);
}
