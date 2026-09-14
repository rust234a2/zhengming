/**
 * 争鸣 · Host 提示词与降级启发式
 *
 * 两条硬边界（产品红线在提示词层的落点）：
 *  1. **不判输赢**：所有能力禁止输出胜负/对错语义；禁用词表见 contract.mjs。
 *  2. **不代写**：
 *     - structureHint 只指出缺哪个结构要素，**不得给出可直接粘贴的论证内容**；
 *     - 事件推演（能力 6/7）的入参**不得含 canon / realChoice / 真实人物真名**。
 *
 * 降级：读不到 STEPFUN_API_KEY 时走本文件的启发式实现，
 * 并在响应里带 `degraded: true` + `degradedReason`，前端必须明示「模拟」。
 */

import { charCount, isSingleQuestion } from "./contract.mjs";

/** 全局人格（所有能力共用） */
export const BASE_SYSTEM = `你是「争鸣」辩论训练平台的 Host（中立助手）。你的职责是帮用户把观点、证据和反驳结构化，而不是替他们说话，也不是给他们打分排名。

你必须遵守四条铁律：
1. 绝不判定输赢、对错、高下，绝不说「你错了」「这是谬误」「偷换概念」「赢了」「输了」。你的语言永远是描述性的、中立的。
2. 只提示结构，不代写内容。用户需要自己说。
3. 尊重任何立场，包括与常识相悖的立场——你的任务是让分歧被谈清楚，不是让某一方获胜。
4. 输出纯文本或严格 JSON，不要 Markdown 代码块包裹，不要 HTML 标签。

禁止出现的词：错误、谬误、偷换、输赢、对错、你错了、赢了。`;

const SIX_DIMS = ["立论", "论据", "逻辑", "回应", "表达", "规范"];

/* ═══════════════════ 提示词模板 ═══════════════════ */

export const PROMPTS = {
  /** AI 对辩席位：根据服务端权威阶段只生成当前一个合法动作。 */
  opponentTurn(context) {
    return {
      system: BASE_SYSTEM,
      user: `你是辩论间里明确标注的 AI 辩手，不是 Host。你守${context.side === "pro" ? "正方" : "反方"}。

议题：${context.topic?.title || ""}
预设本方论点：${context.presetClaim || "（无）"}
当前阶段：${context.phase}
本方立论结构：${JSON.stringify(context.ownBrief || null)}
对方立论结构：${JSON.stringify(context.opponentBrief || null)}
最近发言：${JSON.stringify((context.transcript || []).slice(-8))}
最近质询：${JSON.stringify((context.crossRecords || []).slice(-2))}

只生成当前阶段的一个合法动作，严格输出 JSON：
- opening 且本方无结构：{"action":{"kind":"submitBrief","brief":{"conclusion":"...","reasons":["..."],"evidenceStatus":"价值判断"}}}
- opening 且双方有结构、本方未开篇：{"action":{"kind":"submitOpening","text":"..."}}
- crossAsk：{"action":{"kind":"ask","targetItem":"结论","question":"...？"}}
- crossAnswer：{"action":{"kind":"answer","text":"..."}}
- crossReact：{"action":{"kind":"react","reaction":"accept"}}
- free：{"action":{"kind":"freeSpeak","freeType":"反驳","text":"..."}}
- closing：{"action":{"kind":"submitClosing","text":"..."}}

硬要求：只输出 JSON；问题恰好一个问号；不使用禁用词；引用对方具体内容；不宣称自己是真人。`,
      temperature: 0.5,
    };
  },

  /**
   * 能力 1 · 结构提示 structureHint
   * 用途：立论阶段指出陈述缺哪个结构要素，不给现成句子。
   */
  structureHint(statement) {
    return {
      system: BASE_SYSTEM,
      user: `用户的立论陈述如下：

"""
${statement}
"""

请判断这段话里，五个结构要素（判断标准 / 核心结论 / 理由 / 依据 / 关键定义）分别是否出现。
然后**只说一句**中文提示，指出**最值得补的一个**缺失要素，并说明它对论证的作用。

硬要求：
- ≤60 字，一句话，不带编号、不带分点、不带换行。
- **绝不给出可直接粘贴的论证内容**，不要写出用户该说的理由是什么、证据是什么、定义是什么。
- 只提结构要素本身，例如「你的陈述里有结论和一条理由，但没有给出判断标准——按什么标准衡量『该不该』？」
- 不评判用户说得对不对，只描述结构。`,
      temperature: 0.5,
    };
  },

  /**
   * 能力 2 · 质询生成 makeQuestion
   * 用途：按对方立论结构条目（含关键定义）生成一个追问。一次只问一个，禁打包。
   */
  makeQuestion(targetClaim, history) {
    const historyText = (history || [])
      .map((t) => `[${t.authorId}/${t.kind}] ${t.text}`)
      .join("\n");
    return {
      system: BASE_SYSTEM,
      user: `辩论进行中。攻方的质询靶点是对方立论结构里的这一条：

靶点类型：${targetClaim.label}
靶点内容：${targetClaim.text}

${historyText ? `最近的发言记录：\n"""\n${historyText}\n"""\n` : ""}
请针对这个靶点，提出**恰好一个问题**，帮攻方把这一条追问到底。

硬要求：
- 只问一个问题，**绝对不能打包两个问题**（全句只能出现一个问号）。
- 以「？」结尾，≤50 字。
- 问题应指向该条的**来源可查证性 / 适用边界 / 隐含前提 / 标准一致性**，而不是评价对方说的是否正确。
- 不要复述对方原话超过 14 个字。
- 直接输出这句问句，不要加任何前缀、引号或说明。`,
      temperature: 0.5,
    };
  },

  /**
   * 能力 3 · 中立评估 evaluate
   * 用途：终局对全场 transcript 出六维结构画像。不构成胜负判定。
   */
  evaluate(transcript) {
    const transcriptText = (transcript || [])
      .map((t, i) => `#${i + 1} [${t.authorId}/${t.kind}]${t.evidenceStatus ? `（证据状态：${t.evidenceStatus}）` : ""} ${t.text}`)
      .join("\n");
    return {
      system: BASE_SYSTEM,
      user: `以下是一场结构化辩论的完整发言记录：

"""
${transcriptText}
"""

请对**攻方（authorId 为 "user" 的发言者）**的论证结构做中立评估，输出六个维度的分数（0-100，整数）与评分依据。

六个维度固定为：立论、论据、逻辑、回应、表达、规范。
- 立论：观点是否明确、是否紧扣辩题、判断标准是否合理
- 论据：证据是否真实、相关、充分，来源是否可靠
- 逻辑：论点与论据是否匹配、推理是否完整
- 回应：逐条对照对方提出的问题与紧随其后的本方回答，判断是否直接触及问题焦点、是否回应核心攻击、反驳是否有效
- 表达：语言是否清楚、结构是否连贯
- 规范：是否尊重对手；有无人身攻击、打断

硬要求：
- 评估「回应」时，必须把每个 question 与对应的 answer 成对比较；没有回答、只重复立场或偏离问题焦点，都应在该维度如实体现。
- reaction 中的「接受回答」只是提问方结束本轮的流程动作，不代表同意立场，也不证明回答切题；不得因出现「接受」而提高任何分数。
- 每条依据（grounds）**必须引用发言记录里的原话片段**（quote 字段，原文摘录，不要改写）。引用不到原话的依据请删掉。
- 综合得分（total）为六维**等权平均**，四舍五入取整。
- **绝不出现胜负语义**，不要写「占上风」「更胜一筹」「谁赢」「谁错」之类表述。这是结构质量反馈，像教练复盘，不像裁判打分。
- 分数不要全部集中在同一档，要按实际表现给出区分度。

严格输出如下 JSON（不要代码块包裹）：
{
  "dims": {"立论": 0, "论据": 0, "逻辑": 0, "回应": 0, "表达": 0, "规范": 0},
  "total": 0,
  "grounds": [{"dim": "论据", "quote": "原话片段", "reason": "一句话说明"}]
}`,
      temperature: 0.3,
    };
  },

  /**
   * 能力 4 · 终局追问 terminalProbes
   * 用途：事件推演终局的两条决策模式追问。入参不含 canon / realChoice。
   */
  terminalProbes(history, ledger, relations) {
    const historyText = (history || []).map((s, i) => `第${i + 1}幕：${s.text || s.outcome || ""}`).join("\n");
    const ledgerText = (ledger || []).map((e) => `${e.key}：${e.value ?? e.delta ?? ""}`).join("\n");
    const relationText = (relations || []).map((r) => `${r.target}：${r.value ?? r.delta ?? ""}`).join("\n");
    return {
      system: BASE_SYSTEM,
      user: `玩家刚刚走完一场架空历史推演。他的决策痕迹如下：

走过的幕次：
${historyText || "（无）"}

代价账本：
${ledgerText || "（无）"}

关系状态：
${relationText || "（无）"}

请提出**恰好两条**问题，指向**这名玩家自己的决策模式**（他在什么样的处境下倾向怎么选）。

硬要求：
- 必须**恰好两条**，组成 JSON 数组，元素为字符串，各 ≤60 字。
- 只谈玩家自己的选择倾向，**绝对不要对照任何真实历史发展**，不要提现实中发生了什么。
- 不要评价他的选择是好是坏、是对是错。
- 严格输出 JSON 数组（不要代码块包裹）：["问题一", "问题二"]

正确示例：["你在三次决定里都选了风险更低的一边——这是处境使然，还是你的风格？", "两次账本告急你都没向家人求助——你默认的关系支持是靠得住的吗？"]`,
      temperature: 0.3,
    };
  },

  /**
   * 能力 5 · 幕推进 actAdvance
   * 用途：按角色位推进一幕，产出叙事 + 2-3 张动作卡。
   */
  actAdvance(header, position, acts, actIndex, ledger, relations, history, chosenMoveId) {
    const visible = position?.visible || [];
    const historyText = (history || []).map((s) => `第${s.actIndex + 1}幕：${s.outcome || ""}`).join("\n");
    return {
      system: BASE_SYSTEM,
      user: `你正在主持一场**架空历史推演**（不是真实历史复述）。

事件：${header?.title || ""}
背景：${header?.background || ""}
角色位：${position?.name || ""}${position?.role ? `（${position.role}）` : ""}
该角色位**只能知道**以下信息（下一幕的 visibleFacts 只能从这里逐字摘取）：
${visible.length ? visible.map((v) => `- ${v}`).join("\n") : "（无特别限制）"}

时间表：
${(acts || []).map((a, i) => {
  const head = `第${i + 1}幕 · ${a?.month || ""}`;
  return `${head}\n  外部事件：${a?.text || "（未提供）"}`;
}).join("\n")}

当前推进到：第 ${actIndex + 1} 幕
${chosenMoveId ? `玩家上一幕选择的动作 id：${chosenMoveId}` : "这是第一幕。"}

已锁定幕次（既成事实，不得改写）：
${historyText || "（无）"}

代价账本：${(ledger || []).map((e) => `${e.key} ${e.value ?? e.delta ?? ""}`).join("、") || "（空）"}
关系状态：${(relations || []).map((r) => `${r.target} ${r.value ?? r.delta ?? ""}`).join("、") || "（空）"}

请生成这一幕。严格输出如下 JSON（不要代码块包裹）：
{
  "outcome": "本幕结果叙事，150-260 字，第二人称，具体、有画面，但不替玩家做判断",
  "nextScene": {
    "month": "下一幕的时点",
    "text": "下一幕的处境描写，100-180 字",
    "visibleFacts": ["从上面「该角色位只能知道」列表里逐字复制的条目"]
  },
  "moves": [
    {"id": "m1", "text": "玩家可执行的一个具体动作", "costHint": "非评判性的代价描述", "implicitAssumption": "这个动作默认成立的前提，一句话", "label": "两到四字的动作标签"}
  ],
  "relationDeltas": [{"target": "其他角色位的名字（照抄）", "delta": 0}],
  "ledgerDeltas": [{"key": "时间|钱|关系|健康|机会", "delta": 0, "note": "一句话说明"}],
  "atEnding": false
}

硬要求：
- moves **必须为 2 或 3 张**，不能是 1 张也不能是 4 张。
- visibleFacts 的每一条必须**逐字复制**上面「该角色位只能知道」列表里的某一项：原样照抄，不改写、不合并、不新增；列表里没有的内容一律不许写。
- relationDeltas 的 target 必须是该事件里**其他角色位的名字**（照抄角色位名称，不要用代称）；本幕若不影响任何关系，返回空数组 []。
- ledgerDeltas 的 key **只能取「时间」「钱」「关系」「健康」「机会」这五个词之一**，不得自造维度（如「编制权益」「家庭安置成本」都属无效）；本幕确实没有代价时返回空数组 []。
- 不要提到任何真实历史人物真名，不要提到现实中的真实结局。
- moves 的 text 是玩家能做的事，不是建议、不是评价。
- 不得使用「你错了」「谬误」「正确」「错误」这类词。`,
      temperature: 0.5,
    };
  },

  /**
   * 能力 6 · 结局生成 replayEnding
   * 用途：与走过的路径连贯的终局叙述。
   */
  replayEnding(position, history, ledger, relations) {
    const historyText = (history || []).map((s, i) => `第${i + 1}幕（${s.month || ""}）：${s.outcome || ""}`).join("\n");
    return {
      system: BASE_SYSTEM,
      user: `一场架空历史推演走到终点。玩家的路径如下：

角色位：${position?.name || ""}（${position?.role || ""}）

${historyText || "（无）"}

代价账本：${(ledger || []).map((e) => `${e.key} ${e.value ?? e.delta ?? ""}`).join("、") || "（空）"}
关系状态：${(relations || []).map((r) => `${r.target} ${r.value ?? r.delta ?? ""}`).join("、") || "（空）"}

请为这条路径写一个终局叙述。严格输出 JSON（不要代码块包裹）：
{"title": "短语式标题，≤12 字", "text": "≤400 字的终局叙述，第二人称，收束在这个角色位的视角"}

硬要求：
- 叙述必须与上面走过的路径连贯，不要引入未发生的转折。
- 收束在角色位的视角与处境上，**不评价玩家选择的对错好坏**。
- 不出现「你赢了」「你输了」以及任何对照真实历史的宣判。
- 这是**架空推演**，不要暗示这就是真实历史。`,
      temperature: 0.5,
    };
  },

  /**
   * 能力 7 · 原作揭示 replayCanon
   * 用途：终局可选揭示史实对照。独立通道，推演期间绝不调用。
   */
  replayCanon(eventId) {
    return {
      system: BASE_SYSTEM,
      user: `请为事件 "${eventId}" 输出一条**史实对照时间线**，用于玩家在推演结束后可选择地查看真实历史发展。

严格输出 JSON（不要代码块包裹）：
{
  "canon": [
    {"actIndex": 0, "month": "时点", "development": "该时点真实发生的事，中性描述，60-120 字",
     "sources": [{"url": "https://...", "reviewedAt": "YYYY-MM-DD"}]}
  ]
}

硬要求：
- sources[].url 必须是可访问的 **https** 链接（优先知乎链接）；给不出可靠来源的条目请直接省略。
- reviewedAt 为人工审核日期，格式 YYYY-MM-DD。
- development 为**中性史实描述**，不含对任何推演路径的褒贬。
- 若你不确定该事件的可靠史实，**宁可返回空数组** {"canon": []}，也不要编造。`,
      temperature: 0.3,
    };
  },

  /**
   * 能力 9 · 事件生成 replayCompose（契约 §0.8）
   * 用途：把一段有明显时间线的社会事件，改写成一份可直接推演的事件脚本。
   * 生成物只有「壳」：角色位 / 幕节拍 / 信息范围。不生成 canon——史实对照
   * 必须有人工核实的来源，生成事件一律 canon: []。
   */
  replayCompose(topic, timeline, actCount) {
    const timelineText = (timeline || []).length
      ? `用户给的时间线节点（按此排幕，允许合理归并）：\n${timeline.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n`
      : "";
    return {
      system: BASE_SYSTEM,
      user: `请把下面这段社会事件，改写成一份「事件推演」脚本。推演是**架空模拟**：玩家扮演其中一个处境，一步一步做决定，看路径如何展开。

事件材料：
"""
${topic}
"""
${timelineText}
要求生成 ${actCount} 幕。

严格输出 JSON（不要代码块包裹）：
{
  "title": "事件短题，≤20字，不含真实人名机构名",
  "background": "80-180字的处境背景，时间粒度到月，人物一律化名",
  "admission": {"publiclyDiscussed": true, "disasterOrCasualty": false},
  "positions": [
    {"id": "英文短横线id", "name": "身份 · 某某（化名）", "role": "一句话身份",
     "stake": "这个处境里他最在意什么",
     "visible": ["该角色位只能知道的事实，4-6条，逐条一项"],
     "resources": "能动用的资源或杠杆",
     "canDo": ["能做的动作类型，2-4条"],
     "relations": [{"to": "另一角色位的id", "attitude": -30到30的整数}]}
  ],
  "acts": [{"index": 0, "month": "YYYY-MM", "text": "本幕发生的外部事件，40-90字"}]
}

硬要求：
- 2-4 个角色位，全部是**虚构位置**，绝不扮演可识别的真实个人；人物一律化名，机构模糊化。
- visible 是信息范围：每个角色位**只能**知道哪些事实，逐条一项、可直接摘引；不同角色位的范围必须有实质差异。
- acts 覆盖 ${actCount} 幕，month 用 YYYY-MM，节拍沿时间线推进；最后一幕要形成"必须做决定"的压力。
- 若事件涉及灾难、伤亡，或并非公开讨论的事件：把 admission 对应项如实置为 true/false 并照常输出，服务端会拒收——不要为此编造或美化。
- 不使用禁用词（错误/谬误/偷换/输赢/对错/你错了/赢了）。`,
      temperature: 0.4,
    };
  },
};

/* ═══════════════════ 降级启发式（无 key 时） ═══════════════════ */

const ELEMENT_LABELS = {
  standard: "判断标准",
  conclusion: "核心结论",
  reason: "理由",
  evidence: "依据",
  definition: "关键定义",
};

/**
 * 启发式结构提示：只按关键词命中情况指出缺失要素，不生成任何论证内容。
 * 这是对契约「只提示结构、不代写」的字面实现——它天然无法代写。
 */
export function heuristicStructureHint(statement) {
  const s = String(statement || "");
  const present = {
    standard: /标准|衡量|口径|依据什么/.test(s),
    conclusion: /(该|不该|应该|不应该|必须|不能|值得|不值得)/.test(s),
    reason: /因为|理由|一是|由于|原因/.test(s) || s.length >= 40,
    evidence: /研究|数据|报道|公告|统计|案例|来源|文件|报告/.test(s),
    definition: /所谓|指的是|定义为|＝|=|即/.test(s),
  };
  const order = ["standard", "evidence", "reason", "conclusion", "definition"];
  const missing = order.find((key) => !present[key]);
  if (!missing) {
    return "五个结构要素都出现了——接下来可以让理由与依据的对应关系更紧一些。";
  }
  const advice = {
    standard: "按什么标准衡量",
    evidence: "这条理由背后有没有可查证的东西",
    reason: "结论为什么成立",
    conclusion: "你最终主张什么",
    definition: "你使用的关键词是怎么界定的",
  };
  return `你的陈述里还缺「${ELEMENT_LABELS[missing]}」——${advice[missing]}？`;
}

/** 无 key/上游失败时的确定性 AI 席位，调用方必须保留 degraded 标记。 */
export function heuristicOpponentTurn(context) {
  const side = context.side === "con" ? "con" : "pro";
  const own = context.ownBrief;
  const theirs = context.opponentBrief;
  const preset = String(context.presetClaim || (side === "pro" ? context.topic?.pro?.claim : context.topic?.con?.claim) || "这个议题需要保留更多条件");
  const latest = (context.crossRecords || []).at(-1);
  if (context.phase === "opening" && !own) {
    return {
      action: {
        kind: "submitBrief",
        brief: {
          conclusion: preset,
          reasons: ["这个判断取决于实际影响是否能够被替代方案缓解"],
        },
      },
    };
  }
  if (context.phase === "opening") {
    return { action: { kind: "submitOpening", text: `我的核心主张是：${own?.conclusion || preset}。理由是：${own?.reasons?.[0] || "需要比较不同条件下的实际影响"}。` } };
  }
  if (context.phase === "crossAsk") {
    const targetItem = theirs?.reasons?.length ? "理由 1" : "结论";
    const target = targetItem === "理由 1" ? theirs.reasons[0] : theirs?.conclusion;
    return { action: { kind: "ask", targetItem, question: `你提到「${Array.from(String(target || "这项主张")).slice(0, 16).join("")}」，它在什么条件下不成立？` } };
  }
  if (context.phase === "crossAnswer") {
    return { action: { kind: "answer", text: `针对这个问题，我的依据仍是本方立论中的判断标准；在条件发生变化时，我也会相应缩小结论的适用范围。` } };
  }
  if (context.phase === "crossReact") {
    return { action: { kind: "react", reaction: "accept" } };
  }
  if (context.phase === "free") {
    return { action: { kind: "freeSpeak", freeType: "反驳", text: `对方给出的理由说明了一个条件，但还不足以覆盖本方所强调的实际影响。` } };
  }
  return { action: { kind: "submitClosing", text: `本场分歧集中在判断标准与适用条件。我保留本方结论，同时承认仍需更多可查证材料来缩小争议范围。` } };
}

/** 启发式质询生成：按靶点类型选一个固定的追问角度，套用靶点原文片段 */
export function heuristicMakeQuestion(targetClaim) {
  const label = String(targetClaim?.label || "立论条目");
  const snippet = Array.from(String(targetClaim?.text || "")).slice(0, 12).join("");
  const templates = {
    定义: `你把「${snippet}…」界定成这样——这是学术上的既定口径，还是你自己的用法？`,
    结论: `你的结论「${snippet}…」在什么条件下会不成立？`,
    "理由 1": `你给出的理由「${snippet}…」与结论之间，中间还差哪一步？`,
    "理由 2": `你给出的理由「${snippet}…」与结论之间，中间还差哪一步？`,
    依据: `你引用的「${snippet}…」出自哪里，现在还能查到吗？`,
  };
  return templates[label] || `你提到的「${snippet}…」，依据是什么？`;
}

/** 启发式六维评估：把可观测行为映射到分数，输出契约同形载荷 */
export function heuristicEvaluate(transcript) {
  const turns = Array.isArray(transcript) ? transcript : [];
  const mine = turns.filter((t) => t.authorId === "user");
  const open = mine.find((t) => t.kind === "opening" || t.kind === "brief");
  const closing = mine.find((t) => t.kind === "closing");
  const evidenceTurns = turns.filter((t) => t.evidenceStatus && t.evidenceStatus !== "缺少证据");
  const revisions = mine.filter((t) => t.kind === "revision" || /修正/.test(String(t.kind || ""))).length;
  let pendingQuestion = false;
  let questionsToMine = 0;
  let pairedAnswers = 0;
  for (const turn of turns) {
    if (turn.kind === "question" && turn.authorId !== "user") {
      questionsToMine += 1;
      pendingQuestion = true;
    } else if (turn.kind === "answer" && turn.authorId === "user" && pendingQuestion) {
      pairedAnswers += 1;
      pendingQuestion = false;
    }
  }
  const answerCoverage = questionsToMine ? pairedAnswers / questionsToMine : 0;
  const avgLen = mine.length
    ? Math.round(mine.reduce((sum, t) => sum + charCount(t.text), 0) / mine.length)
    : 0;

  const dims = {
    立论: Math.min(96, 60 + (open ? 12 : 0) + (/标准/.test(open?.text || "") ? 12 : 0) + (avgLen >= 50 ? 8 : 0)),
    论据: Math.min(96, 52 + Math.min(3, evidenceTurns.length) * 12),
    逻辑: Math.min(96, 62 + (revisions ? 12 : 0) + (mine.length >= 3 ? 8 : 0)),
    // 降级模式只能观察问答是否成对完成，不能判断语义上是否回避；接受动作不参与评分。
    回应: Math.min(96, 52 + Math.min(2, pairedAnswers) * 10 + Math.round(answerCoverage * 14) + (closing ? 4 : 0)),
    表达: Math.min(96, avgLen >= 60 ? 82 : avgLen >= 35 ? 72 : 60),
    规范: Math.min(96, 84 + (revisions ? 6 : 0)),
  };
  const total = Math.round(Object.values(dims).reduce((a, b) => a + b, 0) / 6);
  const grounds = [];
  if (open) grounds.push({ dim: "立论", quote: Array.from(open.text).slice(0, 24).join(""), reason: "开篇陈述给出了本方的主张与展开路径" });
  if (evidenceTurns.length) {
    grounds.push({ dim: "论据", quote: Array.from(evidenceTurns[0].text).slice(0, 24).join(""), reason: `全场提交可查证来源 ${evidenceTurns.length} 处` });
  } else {
    grounds.push({ dim: "论据", quote: "", reason: "全场未给出可核查的来源，该项按基线计分" });
  }
  const firstAnswer = mine.find((turn) => turn.kind === "answer");
  if (firstAnswer) {
    grounds.push({
      dim: "回应",
      quote: Array.from(firstAnswer.text).slice(0, 24).join(""),
      reason: `完成 ${pairedAnswers}/${questionsToMine} 组对应问答；降级模式不以对方是否接受判断回答质量`,
    });
  }
  grounds.push({ dim: "表达", quote: "", reason: `场均发言 ${avgLen} 字，结构完整度中等` });

  return {
    dims,
    total,
    grounds,
    verdict: "本场双方完成五阶段结构化对局（规定轮次走满即完成）。本评估仅衡量论证结构与辩论规范，不构成胜负判定。",
    degraded: true,
  };
}

/** 启发式终局追问：从决策痕迹里抽两条模式问题 */
export function heuristicTerminalProbes(history, ledger) {
  const scenes = Array.isArray(history) ? history : [];
  const ledgerItems = Array.isArray(ledger) ? ledger : [];
  const probes = [];
  probes.push(
    scenes.length >= 3
      ? `你在 ${scenes.length} 次决定里都倾向于先把局面稳住——这是处境使然，还是你的风格？`
      : "你在有限的选择里优先守住了什么，这个偏好是你主动的还是被逼的？",
  );
  probes.push(
    ledgerItems.length
      ? `你一路背负着「${ledgerItems[0]?.key || "代价"}」，却始终没有向外求援——你默认的关系支持是靠得住的吗？`
      : "整场推演你都没有向身边的人开口——你默认他们帮不上忙，还是不想欠？",
  );
  return probes;
}

/** 启发式幕推进：按幕次生成 3 张动作卡（2-3 张区间内） */
export function heuristicActAdvance(header, position, acts, actIndex) {
  const month = acts?.[actIndex + 1]?.month || "下一幕";
  const visible = position?.visible || [];
  return {
    outcome: `第 ${actIndex + 1} 幕走完了。你在「${position?.name || "角色位"}」的位子上做了当下的选择，局面随之向前挪了一格——账本上的数字变了，身边的人也各自记下了你的态度。没有哪种做法是安全牌，你只是选了一种需要承担的。`,
    nextScene: {
      month,
      text: `时点推到 ${month}。摆在面前的事比上一幕更具体：要处理的东西变多了，能拖延的余地变小了，而你手上可动用的资源还是那几样。`,
      visibleFacts: visible.length ? visible.slice(0, 3) : ["你所在位子上能看到的公开动向", "身边人最近的态度变化"],
    },
    moves: [
      { id: "m1", text: "按原计划推进，先把手上最要紧的那件事落地", costHint: "会占用这一阶段大部分精力", implicitAssumption: "眼下没有人会从中作梗", label: "按兵推进" },
      { id: "m2", text: "先去找关键的那个人当面谈谈，把话讲开", costHint: "要付出一定的情面成本", implicitAssumption: "对方愿意给你这个时间", label: "当面沟通" },
      { id: "m3", text: "暂时按住不动，用这段时间换更多信息", costHint: "窗口会随之收窄", implicitAssumption: "再等一等不会让局面更糟", label: "观望蓄势" },
    ],
    relationDeltas: [],
    ledgerDeltas: [{ key: "精力", delta: -1, note: "这一阶段的高强度投入" }],
    atEnding: false,
    degraded: true,
  };
}

/** 启发式结局：把走过的路径串成一段收束叙述 */
export function heuristicReplayEnding(position, history, ledger) {
  const scenes = Array.isArray(history) ? history : [];
  return {
    title: "你走过的那条线",
    text: `${scenes.length} 幕走下来，你站在「${position?.name || "角色位"}」的位置上回头看了一眼。这一路上你做的每个取舍，都把一个原本还可能分叉的局面收窄成了一条线。账本上的数字印证了代价，身边的人也都按自己的方式回应了你的选择。这不是历史，只是你走过的那条线——它不评价你，它只是呈现你。`,
    degraded: true,
  };
}

/** 启发式原作揭示：无可靠来源时不编造，返回空数组 */
export function heuristicReplayCanon() {
  return { canon: [], degraded: true };
}

/**
 * 启发式事件生成（无 key 降级）。
 *
 * 降级**不可能**真的改写用户给的事件——硬凑角色位只会产出廉价的假结构。
 * 所以直接返回结构化失败标记，由调用方看 `ok:false` 走「无法生成」路径，
 * 不假装这是一份可推演的事件。
 */
export function heuristicReplayCompose() {
  throw new Error("replayCompose has no heuristic fallback: composing an event requires the real model");
}
