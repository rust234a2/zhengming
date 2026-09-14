/**
 * 辩论间领域内核单测
 *
 * 覆盖 ROLLOUT §4 列出的全部不变量：
 *   理由至少 1 条 · 每方最多 2 问且达到上限自动推进 · 每方自由发言 1 次 · 质询一问一答 ·
 *   轮次走满即 settled · **无 winner/rank/胜负字段** · 禁用词不入库
 * 以及非法规跃迁（错阶段、抢轮次、重复提交）与段位/撮合纯函数。
 */

import { describe, expect, it } from "vitest";

import {
  buildReport,
  briefItems,
  isUsableTopic,
  mergeEvaluateResult,
  opponentOf,
  rankCandidates,
  settleMp,
  tierOf,
  transition,
  validateBrief,
} from "../src/domain/debateRoom";
import type {
  Candidate,
  DebateTopic,
  OpeningBrief,
  RoomState,
  SeatId,
} from "../src/types/debateRoom";

/* ─────────── 测试夹具 ─────────── */

const TOPIC: DebateTopic = {
  questionId: "zh-1",
  title: "如果人人都可以通过 AI 写代码，程序员还需要存在吗？",
  url: "https://www.zhihu.com/question/1",
  paired: true,
  pro: {
    id: "a-1",
    claim: "程序员会继续存在，因为需求定义与责任归属无法被工具承担",
    author: "真实作者甲",
    voteUp: 120,
    url: "https://www.zhihu.com/question/1/answer/1",
    reasonType: "责任归属",
  },
  con: {
    id: "a-2",
    claim: "程序员这个职业会消解，留下的是产品定义者",
    author: "真实作者乙",
    voteUp: 88,
    url: "https://www.zhihu.com/question/1/answer/2",
    reasonType: "需求本质",
  },
};

const BRIEF: OpeningBrief = {
  definition: "「程序员」＝以编写与维护代码为主要谋生手段的人",
  conclusion: "程序员会继续存在",
  reasons: ["需求定义无法被工具承担", "责任归属必须有人承担"],
  evidence: "近三年招聘岗位结构的变化数据",
  evidenceStatus: "已提供来源",
};

function freshState(overrides: Partial<RoomState> = {}): RoomState {
  return {
    roomId: "room-test",
    topic: TOPIC,
    match: {
      mode: "human",
      status: "matched",
      reason: "测试真人已就绪",
      requestedAt: "2026-09-14T00:00:00.000Z",
    },
    phase: "opening",
    seats: {
      pro: { name: "甲方", connected: true, isBot: false },
      con: { name: "乙方", connected: true, isBot: false },
    },
    briefs: { pro: null, con: null },
    transcript: [],
    crossRecords: [],
    revisions: [],
    pressedBy: [],
    freeSpokenBy: [],
    turnSeat: null,
    host: { degraded: true, reason: "STEPFUN_API_KEY is not set on the server" },
    report: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/** 把状态推进到「双方都填完立论结构」 */
function withBriefs(state = freshState()): RoomState {
  let s = state;
  const a = transition(s, "pro", { kind: "submitBrief", brief: BRIEF });
  expect(a.ok).toBe(true);
  if (a.ok) s = a.state;
  const b = transition(s, "con", { kind: "submitBrief", brief: { ...BRIEF, conclusion: "程序员会消解" } });
  expect(b.ok).toBe(true);
  if (b.ok) s = b.state;
  return s;
}

/** 完全走完五阶段，返回终局状态 */
function playThrough(): RoomState {
  let s = withBriefs();

  const open = transition(s, "pro", { kind: "submitOpening", text: "我方标准是需求不可替代。结论是程序员会继续存在。" });
  expect(open.ok).toBe(true);
  if (open.ok) s = open.state;
  const open2 = transition(s, "con", { kind: "submitOpening", text: "我方标准是职能可分解。结论是职业会消解。" });
  expect(open2.ok).toBe(true);
  if (open2.ok) s = open2.state;

  // 质询轮：pro 先问 con
  const ask1 = transition(s, "pro", { kind: "ask", targetItem: "结论", question: "你说的消解，是指岗位消失还是职能转移？" });
  expect(ask1.ok).toBe(true);
  if (ask1.ok) s = ask1.state;
  const ans1 = transition(s, "con", { kind: "answer", text: "我指的是岗位数量级下降，职能被并入产品角色。" });
  expect(ans1.ok).toBe(true);
  if (ans1.ok) s = ans1.state;
  const react1 = transition(s, "pro", { kind: "react", reaction: "accept" });
  expect(react1.ok).toBe(true);
  if (react1.ok) s = react1.state;

  // con 提问
  const ask2 = transition(s, "con", { kind: "ask", targetItem: "理由 1", question: "需求定义为什么无法被工具承担？" });
  expect(ask2.ok).toBe(true);
  if (ask2.ok) s = ask2.state;
  const ans2 = transition(s, "pro", { kind: "answer", text: "因为需求是利益相关方协商的产物，工具只能承接已定型的表述。" });
  expect(ans2.ok).toBe(true);
  if (ans2.ok) s = ans2.state;
  const react2 = transition(s, "con", { kind: "react", reaction: "accept" });
  expect(react2.ok).toBe(true);
  if (react2.ok) s = react2.state;

  // 自由对辩
  const free1 = transition(s, "pro", { kind: "freeSpeak", freeType: "举证", text: "举证：近三年招聘结构里需求侧岗位占比上升。" });
  expect(free1.ok).toBe(true);
  if (free1.ok) s = free1.state;
  const free2 = transition(s, "con", { kind: "freeSpeak", freeType: "寻共识", text: "我们可能都同意：纯粹敲代码的工作占比在下降。" });
  expect(free2.ok).toBe(true);
  if (free2.ok) s = free2.state;

  // 结辩
  const cl1 = transition(s, "pro", { kind: "submitClosing", text: "分歧在职能能否被完全外包给工具。按我的标准，结论仍成立。" });
  expect(cl1.ok).toBe(true);
  if (cl1.ok) s = cl1.state;
  const cl2 = transition(s, "con", { kind: "submitClosing", text: "分歧在需求定义的归属。按我的标准，职业形态已经改变。" });
  expect(cl2.ok).toBe(true);
  if (cl2.ok) s = cl2.state;

  return s;
}

/* ─────────── 立论结构 ─────────── */

describe("validateBrief：立论结构校验", () => {
  it("理由至少 1 条", () => {
    expect(validateBrief({ conclusion: "该去", reasons: [] }).ok).toBe(false);
    expect(validateBrief({ conclusion: "该去", reasons: ["因为窗口收窄"] }).ok).toBe(true);
  });

  it("最多两条理由", () => {
    expect(validateBrief({ conclusion: "该去", reasons: ["一", "二", "三"] }).ok).toBe(false);
  });

  it("结论不能为空", () => {
    expect(validateBrief({ conclusion: "   ", reasons: ["一"] }).ok).toBe(false);
  });

  it("填了依据必须标注七档状态", () => {
    expect(validateBrief({ conclusion: "该去", reasons: ["一"], evidence: "某公告" }).ok).toBe(false);
    expect(validateBrief({ conclusion: "该去", reasons: ["一"], evidence: "某公告", evidenceStatus: "已提供来源" }).ok).toBe(true);
  });
});

describe("briefItems：立论结构展开为质询靶点", () => {
  it("定义可选，条目顺序为 定义/结论/理由1/理由2/依据", () => {
    expect(briefItems(BRIEF).map((i) => i.key)).toEqual(["定义", "结论", "理由 1", "理由 2", "依据"]);
    expect(briefItems({ conclusion: "x", reasons: ["y"] }).map((i) => i.key)).toEqual(["结论", "理由 1"]);
    expect(briefItems(null)).toEqual([]);
  });
});

/* ─────────── 五阶段全流程 ─────────── */

describe("transition：五阶段全流程", () => {
  it("走满五阶段即 settled，且生成报告", () => {
    const s = playThrough();
    expect(s.phase).toBe("settled");
    expect(s.report).not.toBeNull();
    expect(s.report!.completed).toBe(true);
    expect(s.freeSpokenBy.sort()).toEqual(["con", "pro"]);
    expect(s.crossRecords).toHaveLength(2);
  });

  it("立论阶段：双方都填完结构后互相轮替，双方都陈述完才进质询轮", () => {
    let s = withBriefs();
    expect(s.phase).toBe("opening");
    const a = transition(s, "pro", { kind: "submitOpening", text: "我方结论是继续存在。" });
    expect(a.ok).toBe(true);
    if (a.ok) s = a.state;
    expect(s.phase).toBe("opening");
    expect(s.turnSeat).toBe("con");
    const b = transition(s, "con", { kind: "submitOpening", text: "我方结论是会消解。" });
    expect(b.ok).toBe(true);
    if (b.ok) s = b.state;
    // 双方陈述完毕 → 质询轮，由先立论的一方（pro）先提问
    expect(s.phase).toBe("crossAsk");
    expect(s.turnSeat).toBe("pro");
  });

  it("质询轮一问一答：首次回答后由提问方接受或继续追问", () => {
    let s = withBriefs();
    const o1 = transition(s, "pro", { kind: "submitOpening", text: "我方结论是继续存在。" });
    if (o1.ok) s = o1.state;
    const o2 = transition(s, "con", { kind: "submitOpening", text: "我方结论是会消解。" });
    if (o2.ok) s = o2.state;

    const ask = transition(s, "pro", { kind: "ask", targetItem: "结论", question: "消解指什么？" });
    expect(ask.ok).toBe(true);
    if (ask.ok) s = ask.state;
    expect(s.phase).toBe("crossAnswer");
    expect(s.turnSeat).toBe("con");

    const ans = transition(s, "con", { kind: "answer", text: "指岗位数量级下降。" });
    expect(ans.ok).toBe(true);
    if (ans.ok) s = ans.state;
    expect(s.phase).toBe("crossReact");
    expect(s.turnSeat).toBe("pro");
  });

  it("继续追问限 1 次，第二次回答后自动推进", () => {
    let s = withBriefs();
    const o1 = transition(s, "pro", { kind: "submitOpening", text: "我方结论是继续存在。" });
    if (o1.ok) s = o1.state;
    const o2 = transition(s, "con", { kind: "submitOpening", text: "我方结论是会消解。" });
    if (o2.ok) s = o2.state;

    const ask = transition(s, "pro", { kind: "ask", targetItem: "结论", question: "消解指什么？" });
    if (ask.ok) s = ask.state;
    const ans = transition(s, "con", { kind: "answer", text: "指岗位数量级下降。" });
    if (ans.ok) s = ans.state;

    const press = transition(s, "pro", { kind: "react", reaction: "press" });
    expect(press.ok).toBe(true);
    if (press.ok) s = press.state;
    expect(s.pressedBy).toContain("pro");
    expect(s.phase).toBe("crossAsk");

    // 追问后 con 再答一次
    const askAgain = transition(s, "pro", { kind: "ask", targetItem: "结论", question: "那职能去哪了？" });
    expect(askAgain.ok).toBe(true);
    if (askAgain.ok) s = askAgain.state;
    const ansAgain = transition(s, "con", { kind: "answer", text: "被并入产品与运营角色。" });
    if (ansAgain.ok) s = ansAgain.state;
    expect(s.phase).toBe("crossAsk");
    expect(s.turnSeat).toBe("con");
    expect(s.crossRecords.at(-1)?.closedBy).toBe("questionLimit");

    const pressAgain = transition(s, "pro", { kind: "react", reaction: "press" });
    expect(pressAgain.ok).toBe(false);
    if (!pressAgain.ok) expect(pressAgain.code).toBe("WRONG_PHASE");
  });

  it("每方自由发言 1 次", () => {
    let s = playThrough();
    // 回退到自由阶段不复现，直接构造：在 free 阶段连发两次
    const freeState = freshState({ phase: "free" });
    const first = transition(freeState, "pro", { kind: "freeSpeak", freeType: "反驳", text: "反驳对方的前提。" });
    expect(first.ok).toBe(true);
    if (first.ok) s = first.state;
    const second = transition(s, "pro", { kind: "freeSpeak", freeType: "举证", text: "再举一证。" });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.code).toBe("FREE_LIMIT");
  });

  it("「修正」保留原表述痕迹，并更新当前结论", () => {
    const freeState = freshState({
      phase: "free",
      briefs: { pro: BRIEF, con: null },
    });
    const r = transition(freeState, "pro", {
      kind: "freeSpeak",
      freeType: "修正",
      text: "我修正本方对窗口期的判断。",
      revisedTo: "窗口期收窄的速度没有我原先说得那么快",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.revisions).toHaveLength(1);
    expect(r.state.revisions[0].from).toBe(BRIEF.conclusion);
    expect(r.state.revisions[0].to).toContain("没有我原先说得那么快");
    expect(r.state.briefs.pro!.conclusion).toContain("没有我原先说得那么快");
  });

  it("「修正」未写修正后的表述 → 拒收", () => {
    const freeState = freshState({ phase: "free" });
    const r = transition(freeState, "pro", { kind: "freeSpeak", freeType: "修正", text: "我要改。" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("REVISION_REQUIRED");
  });

  it("「承认」只是语义标注，不产生任何结算加成", () => {
    let s = playThrough();
    const report = s.report!;
    // 承认不进 MP 明细
    expect(report.settlement.entries.map((e) => e.label)).not.toContain("承认");
    expect(report.settlement.entries.every((e) => e.amount !== 3 && e.amount !== 5)).toBe(true);
  });
});

/* ─────────── 非法规跃迁 ─────────── */

describe("transition：非法规跃迁全部被拒且不动状态", () => {
  it("错阶段提交被拒", () => {
    const s = freshState({ phase: "crossAnswer" });
    const r = transition(s, "pro", { kind: "submitBrief", brief: BRIEF });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("WRONG_PHASE");
  });

  it("抢别人的轮次被拒", () => {
    const s = freshState({ phase: "crossAsk", turnSeat: "pro" });
    const r = transition(s, "con", { kind: "ask", targetItem: "结论", question: "为什么？" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("NOT_YOUR_TURN");
  });

  it("重复提交立论结构被拒", () => {
    const s = withBriefs();
    const r = transition(s, "pro", { kind: "submitBrief", brief: BRIEF });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("ALREADY_SUBMITTED");
  });

  it("没填立论结构不能直接开篇陈述", () => {
    const s = freshState();
    const r = transition(s, "pro", { kind: "submitOpening", text: "我方的结论是……" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("BRIEF_REQUIRED");
  });

  it("质询靶点必须在对方结构里存在", () => {
    // 构造：对方（con）的立论结构只有「结论」和「理由 1」，没有「定义」与「理由 2」
    let s = freshState({ phase: "crossAsk", turnSeat: "pro" });
    const brief = transition(s, "pro", { kind: "submitBrief", brief: BRIEF });
    expect(brief.ok).toBe(false); // opening 阶段才收立论结构
    s = freshState({
      phase: "crossAsk",
      turnSeat: "pro",
      briefs: { pro: BRIEF, con: { conclusion: "会消解", reasons: ["职能可分解"] } },
    });

    // con 没有「定义」条目 → 拒收
    const miss = transition(s, "pro", { kind: "ask", targetItem: "定义", question: "这个定义怎么来的？" });
    expect(miss.ok).toBe(false);
    if (!miss.ok) expect(miss.code).toBe("TARGET_NOT_FOUND");

    // con 有「结论」条目 → 通过
    const hit = transition(s, "pro", { kind: "ask", targetItem: "结论", question: "消解指岗位消失还是职能转移？" });
    expect(hit.ok).toBe(true);
    if (hit.ok) expect(hit.state.phase).toBe("crossAnswer");
  });

  it("打包追问（两个问号）被拒——追问权替代验证权", () => {
    let s = withBriefs();
    const o1 = transition(s, "pro", { kind: "submitOpening", text: "我方结论是继续存在。" });
    if (o1.ok) s = o1.state;
    const o2 = transition(s, "con", { kind: "submitOpening", text: "我方结论是会消解。" });
    if (o2.ok) s = o2.state;
    const r = transition(s, "pro", { kind: "ask", targetItem: "结论", question: "消解指什么？另外你怎么看转型？" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("MULTIPLE_QUESTIONS");
  });

  it("回答过短被拒", () => {
    let s = withBriefs();
    const o1 = transition(s, "pro", { kind: "submitOpening", text: "我方结论是继续存在。" });
    if (o1.ok) s = o1.state;
    const o2 = transition(s, "con", { kind: "submitOpening", text: "我方结论是会消解。" });
    if (o2.ok) s = o2.state;
    const ask = transition(s, "pro", { kind: "ask", targetItem: "结论", question: "消解指什么？" });
    if (ask.ok) s = ask.state;
    const r = transition(s, "con", { kind: "answer", text: "不知道" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("ANSWER_TOO_SHORT");
  });

  it("已 settled 的房间拒绝一切动作", () => {
    const s = playThrough();
    const r = transition(s, "pro", { kind: "freeSpeak", freeType: "反驳", text: "再补一句。" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("ROOM_SETTLED");
  });

  it("离席 → settled，报告标记未完成局", () => {
    const s = withBriefs();
    const r = transition(s, "con", { kind: "leave" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.phase).toBe("settled");
    expect(r.state.seats.con!.connected).toBe(false);
    expect(r.state.report!.completed).toBe(false);
    expect(r.state.report!.settlement.entries.some((e) => e.label === "中途离席")).toBe(true);
  });
});

/* ─────────── 阶段跃迁不合法性（穷举） ─────────── */

describe("transition：每个阶段的动作白名单", () => {
  const cases: { phase: RoomState["phase"]; action: Parameters<typeof transition>[2]; shouldPass: boolean }[] = [
    { phase: "opening", action: { kind: "submitBrief", brief: BRIEF }, shouldPass: true },
    { phase: "opening", action: { kind: "ask", targetItem: "结论", question: "为什么？" }, shouldPass: false },
    { phase: "opening", action: { kind: "freeSpeak", freeType: "反驳", text: "文本" }, shouldPass: false },
    { phase: "free", action: { kind: "submitBrief", brief: BRIEF }, shouldPass: false },
    { phase: "free", action: { kind: "submitClosing", text: "文本" }, shouldPass: false },
    { phase: "closing", action: { kind: "freeSpeak", freeType: "反驳", text: "文本" }, shouldPass: false },
    { phase: "closing", action: { kind: "submitClosing", text: "文本" }, shouldPass: true },
  ];

  it.each(cases)("$phase 阶段 $action.kind → $shouldPass", ({ phase, action, shouldPass }) => {
    const s = freshState({ phase, turnSeat: "pro" });
    expect(transition(s, "pro", action).ok).toBe(shouldPass);
  });
});

/* ─────────── 红线：无胜负字段 ─────────── */

describe("红线：报告中物理上不存在胜负语义", () => {
  it("序列化后的报告不含 winner/rank/胜负/赢了/败", () => {
    const s = playThrough();
    const json = JSON.stringify(s.report).toLowerCase();
    for (const forbidden of ["winner", "rank", "\"胜负\"", "赢了", "败"]) {
      expect(json).not.toContain(forbidden.toLowerCase());
    }
  });

  it("接受回答不参与 MP 结算，只有完成行为获得奖励", () => {
    const settlement = settleMp({ completed: true });
    const labels = settlement.entries.map((e) => e.label);
    expect(labels).toEqual(["完成完整对局（五阶段走满）"]);
    expect(settlement.total).toBe(10);
  });

  it("段位按累计 MP 单调映射，且从不因对局结果升降", () => {
    expect(tierOf(0)).toBe("启鸣");
    expect(tierOf(29)).toBe("启鸣");
    expect(tierOf(30)).toBe("锋鸣");
    expect(tierOf(80)).toBe("争鸣");
    expect(tierOf(180)).toBe("共鸣");
    expect(tierOf(350)).toBe("和鸣");
    expect(tierOf(9999)).toBe("和鸣");
  });

  it("离席 MP -5，且累计 MP 不为负", () => {
    const s = settleMp({ left: true, previousMp: 2 });
    expect(s.total).toBe(-5);
    expect(s.mp).toBe(0);
  });

  it("settleMp 给出距下一段所需 MP", () => {
    const s = settleMp({ completed: true, previousMp: 20 });
    expect(s.tier).toBe("锋鸣");
    expect(s.toNext).toEqual({ tier: "争鸣", remaining: 50 });
    const top = settleMp({ completed: true, previousMp: 400 });
    expect(top.toNext).toBeNull();
  });
});

/* ─────────── 撮合排序 ─────────── */

describe("rankCandidates：六维画像相近度", () => {
  const me = [80, 60, 80, 70, 75, 90];

  it("相近度公式为 1 − mean(|Δ|)/100，越接近越高", () => {
    const [closest] = rankCandidates(me, [{ seatId: "a", name: "A", side: "con", profile: [80, 60, 80, 70, 75, 90] }]);
    expect(closest.score).toBeCloseTo(1, 5);

    const [farthest] = rankCandidates(me, [{ seatId: "b", name: "B", side: "con", profile: [0, 0, 0, 0, 0, 0] }]);
    expect(farthest.score).toBeCloseTo(1 - (80 + 60 + 80 + 70 + 75 + 90) / 6 / 100, 5);
  });

  it("按 score 降序，无画像的排最后", () => {
    const candidates: Candidate[] = [
      { seatId: "cold", name: "冷启动", side: "con", profile: null },
      { seatId: "far", name: "远", side: "con", profile: [10, 10, 10, 10, 10, 10] },
      { seatId: "near", name: "近", side: "con", profile: [82, 58, 78, 72, 74, 88] },
    ];
    expect(rankCandidates(me, candidates).map((c) => c.seatId)).toEqual(["near", "far", "cold"]);
  });

  it("我无画像时全部为 null，保持稳定顺序", () => {
    const candidates: Candidate[] = [
      { seatId: "x", name: "X", side: "con", profile: [1, 2, 3, 4, 5, 6] },
      { seatId: "y", name: "Y", side: "con", profile: null },
    ];
    const ranked = rankCandidates(null, candidates);
    expect(ranked.map((c) => c.score)).toEqual([null, null]);
    expect(ranked.map((c) => c.seatId)).toEqual(["x", "y"]);
  });

  it("不修改入参（纯函数）", () => {
    const candidates: Candidate[] = [{ seatId: "a", name: "A", side: "con", profile: [50, 50, 50, 50, 50, 50] }];
    const snapshot = JSON.parse(JSON.stringify(candidates));
    rankCandidates(me, candidates);
    expect(candidates).toEqual(snapshot);
  });
});

/* ─────────── 报告与 Host 合并 ─────────── */

describe("buildReport / mergeEvaluateResult", () => {
  it("共识、承认分别归档，人工回避栏目保持为空", () => {
    let s = freshState({ phase: "free" });
    const free1 = transition(s, "pro", { kind: "freeSpeak", freeType: "寻共识", text: "我们都同意敲代码占比在降。" });
    if (free1.ok) s = free1.state;
    const free2 = transition(s, "con", { kind: "freeSpeak", freeType: "承认", text: "我承认需求侧确实变重了。" });
    if (free2.ok) s = free2.state;

    const report = buildReport(s, { completed: true });
    expect(report.consensus).toHaveLength(1);
    expect(report.consensus[0].seat).toBe("pro");
    expect(report.acknowledged).toHaveLength(1);
    expect(report.acknowledged[0].seat).toBe("con");
    expect(report.openQuestions).toEqual([]);
  });

  it("Host 降级标记透传到报告", () => {
    const report = buildReport(freshState(), { completed: true });
    expect(report.hostDegraded).toBe(true);
  });

  it("mergeEvaluateResult 用 Host 六维覆盖启发式，不引入排名", () => {
    const report = buildReport(freshState(), { completed: true });
    const merged = mergeEvaluateResult(report, {
      dims: { 立论: 78, 论据: 64, 逻辑: 82, 回应: 71, 表达: 80, 规范: 90 },
      grounds: [{ dim: "论据", quote: "近三年招聘岗位结构的变化数据", reason: "全场唯一可查证来源" }],
      verdict: "本评估仅衡量论证结构与辩论规范，不构成胜负判定。",
    });
    expect(merged.profiles.pro).toEqual([78, 64, 82, 71, 80, 90]);
    expect(merged.grounds).toHaveLength(1);
    expect(merged.grounds[0].quote).toContain("近三年");
    expect(JSON.stringify(merged).toLowerCase()).not.toContain("winner");
  });
});

/* ─────────── 议题合法性 ─────────── */

describe("isUsableTopic：真实数据准入", () => {
  it("有 title 且至少一侧有论点才算可用", () => {
    expect(isUsableTopic(TOPIC)).toBe(true);
    expect(isUsableTopic(null)).toBe(false);
    expect(isUsableTopic({ ...TOPIC, title: "" })).toBe(false);
    expect(isUsableTopic({ ...TOPIC, pro: null, con: null })).toBe(false);
    expect(isUsableTopic({ ...TOPIC, pro: null })).toBe(true);
  });
});

describe("opponentOf", () => {
  it("席位互为对手", () => {
    const sides: SeatId[] = ["pro", "con"];
    sides.forEach((side) => expect(opponentOf(opponentOf(side))).toBe(side));
  });
});
