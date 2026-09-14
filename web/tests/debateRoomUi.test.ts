/**
 * 辩论间 · UI 决策层测试（S5）
 *
 * 相比 DOM 断言，这里优先测**界面该显示什么**的决策逻辑：
 *  - 当前阶段 + 我的席位 → 我该看到哪个输入区 / 是否该等对方
 *  - 阶段进度条的完成态
 *  - 议题列表的跨议题配对标注（provenance 红线：不得假装同议题正反方）
 *  - 对局报告的分栏内容（共识 / 分歧 / 质询 / 修正）
 *
 * 这样即使布局微调，规则层的回归也能被守住。
 */

import { describe, expect, it } from "vitest";

import { createRoomState, briefItems, transition } from "../src/domain/debateRoom";
import { findBannedWords } from "../src/domain/roomClient";
import {
  composerFor,
  stageProgress,
  topicBadges,
  reportSections,
  radarPoints,
  describeBriefItem,
  canSubmitAction,
  parseTopicsResponse,
  aggregateTopics,
} from "../src/ui/debateRoomUi";
import type { DebateTopic, RoomReport, RoomState, SeatId } from "../src/types/debateRoom";
import type { HostTopic } from "../src/types/debateRoom";

/* ═══════════════ 夹具 ═══════════════ */

const TOPIC: DebateTopic = {
  questionId: "q1",
  title: "AI 会不会取代程序员？",
  url: "https://www.zhihu.com/question/1",
  paired: true,
  pro: { id: "c1", claim: "会取代", author: "甲", voteUp: 31, url: "https://www.zhihu.com/answer/1" },
  con: { id: "c2", claim: "不会取代", author: "乙", voteUp: 28, url: "https://www.zhihu.com/answer/2" },
};

function stateAt(overrides: Partial<RoomState> = {}): RoomState {
  const base = createRoomState({ roomId: "room-t", topic: TOPIC, now: "2026-09-14T00:00:00.000Z" });
  return { ...base, ...overrides };
}

/** 双方都占席的对局中状态 */
function playing(overrides: Partial<RoomState> = {}): RoomState {
  return stateAt({
    phase: "opening",
    turnSeat: "pro",
    seats: {
      pro: { name: "我", connected: true, isBot: false, profile: null },
      con: { name: "你", connected: true, isBot: false, profile: null },
    },
    ...overrides,
  });
}

/* ═══════════════ 输入区路由 ═══════════════ */

describe("composerFor：当前该显示哪个输入区", () => {
  it("waiting：显示等待对手，不给任何输入框", () => {
    const result = composerFor(stateAt({ phase: "waiting" }), "pro");
    expect(result.kind).toBe("waiting");
    expect(result.canAct).toBe(false);
  });

  it("opening 且我还没交结构：显示立论结构表单", () => {
    const result = composerFor(playing({ phase: "opening", turnSeat: "pro" }), "pro");
    expect(result.kind).toBe("brief");
    expect(result.canAct).toBe(true);
  });

  it("opening 且我已交结构、对方没交：显示等待对方（不给重复提交）", () => {
    const state = playing({
      phase: "opening",
      turnSeat: "con",
      briefs: {
        pro: { conclusion: "会", reasons: ["因为 A"] },
        con: null,
      },
    });
    const result = composerFor(state, "pro");
    expect(result.kind).toBe("waitingBrief");
    expect(result.canAct).toBe(false);
  });

  it("opening 且双方结构都交了：显示开篇陈述", () => {
    const state = playing({
      phase: "opening",
      turnSeat: "pro",
      briefs: {
        pro: { conclusion: "会", reasons: ["因为 A"] },
        con: { conclusion: "不会", reasons: ["因为 B"] },
      },
    });
    const result = composerFor(state, "pro");
    expect(result.kind).toBe("opening");
    expect(result.canAct).toBe(true);
  });

  it("crossAsk 且轮到我：显示质询（选择题靶 + 提问）", () => {
    const state = playing({
      phase: "crossAsk",
      turnSeat: "pro",
      briefs: {
        pro: { conclusion: "会", reasons: ["因为 A"] },
        con: { conclusion: "不会", reasons: ["因为 B"], definition: "取代＝完全替代" },
      },
    });
    const result = composerFor(state, "pro");
    expect(result.kind).toBe("ask");
    expect(result.canAct).toBe(true);
    // 靶点来自**对方**的立论结构
    expect(result.targets?.map((item) => item.key)).toEqual(["定义", "结论", "理由 1"]);
  });

  it("crossAsk 但轮到对方：显示等待", () => {
    const state = playing({ phase: "crossAsk", turnSeat: "con" });
    expect(composerFor(state, "pro").kind).toBe("waitingTurn");
  });

  it("crossAnswer 轮到我：显示回答区", () => {
    const state = playing({
      phase: "crossAnswer",
      turnSeat: "con",
      crossRecords: [{ asker: "pro", targetItem: "结论", question: "为什么？", pressed: false, at: "t" }],
    });
    const result = composerFor(state, "con");
    expect(result.kind).toBe("answer");
    expect(result.prompt).toBe("为什么？");
  });

  it("crossReact 轮到我：只显示接受或继续追问", () => {
    const base = {
      phase: "crossReact" as const,
      turnSeat: "pro" as const,
      crossRecords: [
        { asker: "pro" as const, targetItem: "结论" as const, question: "为什么？", answer: "因为…", pressed: false, at: "t" },
      ],
    };
    const fresh = composerFor(playing(base), "pro");
    expect(fresh.kind).toBe("react");
    expect(fresh.reactions?.map((r) => r.value)).toEqual(["accept", "press"]);

    const used = composerFor(playing({ ...base, pressedBy: ["pro"] }), "pro");
    expect(used.reactions).toEqual([]);
  });

  it("free 且我未发言：显示自由对辩（五种类型）", () => {
    const result = composerFor(playing({ phase: "free", turnSeat: "pro" }), "pro");
    expect(result.kind).toBe("free");
    expect(result.freeTypes).toEqual(["反驳", "举证", "承认", "修正", "寻共识"]);
  });

  it("free 且我已发言：显示等待对方", () => {
    const result = composerFor(playing({ phase: "free", freeSpokenBy: ["pro"], turnSeat: "con" }), "pro");
    expect(result.kind).toBe("waitingTurn");
  });

  it("closing：显示结辩（含可选修正）", () => {
    const result = composerFor(playing({ phase: "closing", turnSeat: "pro" }), "pro");
    expect(result.kind).toBe("closing");
    expect(result.canAct).toBe(true);
  });

  it("settled：显示终局，不给输入", () => {
    const result = composerFor(playing({ phase: "settled", turnSeat: null }), "pro");
    expect(result.kind).toBe("settled");
    expect(result.canAct).toBe(false);
  });

  it("未入席（side 为空）时一律不可动作", () => {
    expect(composerFor(playing(), null).canAct).toBe(false);
  });
});

/* ═══════════════ 阶段进度 ═══════════════ */

describe("stageProgress：五阶段进度条", () => {
  it("waiting 时所有阶段都未开始", () => {
    const progress = stageProgress(stateAt({ phase: "waiting" }));
    expect(progress.every((stage) => stage.state === "todo")).toBe(true);
    expect(progress.map((stage) => stage.name)).toEqual(["立论", "质询轮", "自由对辩", "结辩", "终局"]);
  });

  it("opening 时立论进行中", () => {
    const progress = stageProgress(playing({ phase: "opening" }));
    expect(progress[0].state).toBe("active");
    expect(progress.slice(1).every((stage) => stage.state === "todo")).toBe(true);
  });

  it("质询三个子相位都算「质询轮」进行中，立论已完成", () => {
    for (const phase of ["crossAsk", "crossAnswer", "crossReact"] as const) {
      const progress = stageProgress(playing({ phase }));
      expect(progress[0].state, phase).toBe("done");
      expect(progress[1].state, phase).toBe("active");
    }
  });

  it("settled 时五阶段全部完成", () => {
    const progress = stageProgress(playing({ phase: "settled", turnSeat: null }));
    expect(progress.every((stage) => stage.state === "done")).toBe(true);
  });

  it("进度条文案不含判输赢词族", () => {
    const text = stageProgress(playing({ phase: "free" })).map((s) => s.name).join("");
    expect(text).not.toMatch(/输赢|对错|胜负|赢了/);
  });
});

/* ═══════════════ 议题与配对标注 ═══════════════ */

describe("topicBadges：跨议题配对必须显式标注", () => {
  it("同议题真实正反方：标注「同一议题」", () => {
    const badges = topicBadges(TOPIC);
    expect(badges.some((b) => b.tone === "paired")).toBe(true);
    expect(badges.some((b) => b.tone === "cross")).toBe(false);
  });

  it("跨议题配对：必须出现「跨议题配对」标记与说明", () => {
    const cross: DebateTopic = {
      ...TOPIC,
      questionId: "q2",
      paired: false,
      crossPaired: true,
      pairingNote: "两侧论点来自不同议题，按追问类型对撞",
      pro: { ...TOPIC.pro!, id: "x1" },
      con: { ...TOPIC.con!, id: "x2" },
    };
    const badges = topicBadges(cross);
    expect(badges.some((b) => b.tone === "cross")).toBe(true);
    expect(badges.find((b) => b.tone === "cross")?.text).toContain("跨议题");
  });

  it("单侧议题：标注只有一个席位可选", () => {
    const single: DebateTopic = { ...TOPIC, paired: false, pro: TOPIC.pro, con: null };
    const badges = topicBadges(single);
    expect(badges.some((b) => b.tone === "single")).toBe(true);
  });

  it("provenance 徽章带真实作者与赞同数", () => {
    const badges = topicBadges(TOPIC);
    const text = badges.map((b) => b.text).join(" ");
    expect(text).toContain("甲");
    expect(text).toContain("31");
  });
});

describe("aggregateTopics：把服务端 /api/topics 响应变成可开局议题", () => {
  const hostTopics: HostTopic[] = [
    {
      questionId: "q1",
      title: "议题一",
      url: "https://www.zhihu.com/question/1",
      paired: true,
      crossPaired: false,
      pro: { id: "a", claim: "支持一", author: "甲", voteUp: 5, url: "https://www.zhihu.com/answer/a" },
      con: { id: "b", claim: "反对一", author: "乙", voteUp: 4, url: "https://www.zhihu.com/answer/b" },
    },
    {
      questionId: "q2",
      title: "议题二",
      url: "https://www.zhihu.com/question/2",
      paired: false,
      crossPaired: true,
      pairingNote: "跨议题",
      pro: { id: "c", claim: "支持二", author: "丙", voteUp: 3, url: "https://www.zhihu.com/answer/c" },
      con: { id: "d", claim: "反对二", author: "丁", voteUp: 2, url: "https://www.zhihu.com/answer/d" },
    },
  ];

  it("可开局的议题排在前面（成对优先）", () => {
    const result = aggregateTopics(hostTopics);
    expect(result[0].questionId).toBe("q1");
    expect(result[0].playable).toBe(true);
  });

  it("单侧议题也算可开局（真人守另一边），但标注不完整", () => {
    const single: HostTopic[] = [{ ...hostTopics[0], paired: false, con: null }];
    const result = aggregateTopics(single);
    expect(result[0].playable, "只要有任一侧论点即可开局").toBe(true);
    expect(result[0].sidesAvailable).toEqual(["pro"]);
  });

  it("两侧都没有论点的议题不可开局（拒绝空议题）", () => {
    const empty: HostTopic[] = [{ ...hostTopics[0], paired: false, pro: null, con: null }];
    expect(aggregateTopics(empty)[0].playable).toBe(false);
  });

  it("缺失 url 的议题保留但标记来源不可溯源", () => {
    const noUrl: HostTopic[] = [{ ...hostTopics[0], url: "" }];
    expect(aggregateTopics(noUrl)[0].traceable).toBe(false);
  });
});

describe("parseTopicsResponse：容忍服务端返回形状", () => {
  it("解析 {ok:true, topics:[...]}", () => {
    const parsed = parseTopicsResponse({ ok: true, topics: [{ questionId: "q1" }] });
    expect(parsed).toHaveLength(1);
  });

  it("非法输入返回空数组，不抛错", () => {
    expect(parseTopicsResponse(null)).toEqual([]);
    expect(parseTopicsResponse({ ok: false })).toEqual([]);
    expect(parseTopicsResponse({ topics: "nope" })).toEqual([]);
  });

  it("过滤掉没有 questionId 的脏数据", () => {
    const parsed = parseTopicsResponse({ topics: [{ questionId: "q1" }, { title: "脏" }] });
    expect(parsed).toHaveLength(1);
  });
});

/* ═══════════════ 提交前置校验 ═══════════════ */

describe("canSubmitAction：提交按钮可用性", () => {
  it("空白文本不可提交", () => {
    expect(canSubmitAction({ kind: "answer", text: "   " })).toBe(false);
    // 回答有 6 字下限（与领域层同门槛），这里给足字数
    expect(canSubmitAction({ kind: "answer", text: "这是我的正面回答内容" })).toBe(true);
  });

  it("回答不足 6 字不可提交（与领域层同门槛，避免白跑一次往返）", () => {
    expect(canSubmitAction({ kind: "answer", text: "太短了" })).toBe(false);
  });

  it("命中禁用词不可提交，并给出提示", () => {
    expect(canSubmitAction({ kind: "answer", text: "你错了这一点很明显" })).toBe(false);
    expect(findBannedWords("你错了这一点很明显")).toContain("你错了");
  });

  it("质询必须带靶点与单个问句", () => {
    expect(canSubmitAction({ kind: "ask", targetItem: "结论", question: "为什么？" })).toBe(true);
    expect(canSubmitAction({ kind: "ask", question: "为什么？" } as never)).toBe(false);
    expect(canSubmitAction({ kind: "ask", targetItem: "结论", question: "为什么？还有呢？" })).toBe(false);
    expect(canSubmitAction({ kind: "ask", targetItem: "结论", question: "为什么" })).toBe(false);
  });

  it("立论结构需结论 + 至少一条理由", () => {
    expect(canSubmitAction({ kind: "submitBrief", brief: { conclusion: "会", reasons: ["因为 A"] } })).toBe(true);
    expect(canSubmitAction({ kind: "submitBrief", brief: { conclusion: "会", reasons: [] } })).toBe(false);
    expect(canSubmitAction({ kind: "submitBrief", brief: { conclusion: "  ", reasons: ["A"] } })).toBe(false);
  });

  it("修正类型必须给出修正后的表述", () => {
    expect(canSubmitAction({ kind: "freeSpeak", freeType: "修正", text: "改一下" })).toBe(false);
    expect(canSubmitAction({ kind: "freeSpeak", freeType: "修正", text: "改一下", revisedTo: "新表述" })).toBe(true);
  });

  it("自由对辩/结辩的普通文本按非空判断", () => {
    expect(canSubmitAction({ kind: "freeSpeak", freeType: "反驳", text: "有内容" })).toBe(true);
    expect(canSubmitAction({ kind: "submitClosing", text: "有内容" })).toBe(true);
  });
});

/* ═══════════════ 报告分栏 ═══════════════ */

describe("reportSections：对局报告的栏目", () => {
  const report: RoomReport = {
    roomId: "room-t",
    topic: TOPIC,
    briefs: {
      pro: { conclusion: "会取代", reasons: ["因为 A"], definition: "取代＝完全替代" },
      con: { conclusion: "不会", reasons: ["因为 B"] },
    },
    crossRecords: [
      { asker: "pro", targetItem: "结论", question: "为什么？", answer: "因为…", reaction: "accept", pressed: false, at: "t1" },
      { asker: "con", targetItem: "理由 1", question: "依据呢？", answer: "……", pressed: false, closedBy: "questionLimit", at: "t2" },
    ],
    evidence: [{ seat: "pro", text: "A 报告说…", status: "已提供来源" }],
    consensus: [{ seat: "pro", text: "双方都认可工具会改变分工" }],
    acknowledged: [{ seat: "con", text: "对方关于成本的论据有道理" }],
    openQuestions: ["AI 评估认为该回答尚未说明依据来源"],
    revisions: [{ seat: "pro", from: "会被取代", to: "部分环节会被取代", at: "t3" }],
    profiles: { pro: [80, 75, 70, 65, 60, 55], con: null },
    grounds: [{ dim: "回应", quote: "因为…", reason: "正面回应了问题" }],
    verdict: "双方在成本与分工两个维度展开了交锋。",
    settlement: { total: 10, entries: [{ label: "完成完整对局（五阶段走满）", amount: 10 }], tier: "启鸣", mp: 10, toNext: { tier: "锋鸣", remaining: 20 } },
    completed: true,
    hostDegraded: false,
    generatedAt: "2026-09-14T00:00:00.000Z",
  };

  it("产出六个栏目，顺序固定", () => {
    const sections = reportSections(report);
    expect(sections.map((s) => s.id)).toEqual(["consensus", "openQuestions", "cross", "acknowledged", "revisions", "evidence"]);
  });

  it("共识栏列出标「寻共识」的发言", () => {
    const consensus = reportSections(report).find((s) => s.id === "consensus")!;
    expect(consensus.items[0].text).toContain("工具会改变分工");
  });

  it("质询栏带靶点与结束原因标记", () => {
    const cross = reportSections(report).find((s) => s.id === "cross")!;
    expect(cross.items).toHaveLength(2);
    // 结束原因（达到上限 / 已接受 / 已追问）出现在 meta 里，正文保留原始问答
    expect(cross.items[1].meta).toContain("达到质询上限后自动结束");
    expect(cross.items[0].text).toContain("结论");
    expect(cross.items[0].meta).toContain("已接受回答");
  });

  it("修正栏保留修正前后对照", () => {
    const revisions = reportSections(report).find((s) => s.id === "revisions")!;
    expect(revisions.items[0].text).toContain("会被取代");
    expect(revisions.items[0].text).toContain("部分环节会被取代");
  });

  it("报告不含胜负字段与胜负文案（红线）", () => {
    const serialized = JSON.stringify(report);
    expect(serialized).not.toMatch(/winner|"rank"|胜负|败北/);
    const allText = reportSections(report)
      .flatMap((s) => [s.title, ...s.items.map((i) => i.text)])
      .join(" ");
    expect(allText).not.toMatch(/输赢|对错|赢了|谬误|偷换/);
  });

  it("空栏目也被保留（显式显示「暂无」而不是消失）", () => {
    const empty = reportSections({ ...report, consensus: [], revisions: [], evidence: [] });
    expect(empty.every((section) => Array.isArray(section.items))).toBe(true);
    expect(empty.find((s) => s.id === "consensus")!.items).toHaveLength(0);
  });
});

/* ═══════════════ 雷达图几何 ═══════════════ */

describe("radarPoints：六维雷达图坐标", () => {
  it("满分时所有点落在最外圈", () => {
    const points = radarPoints([100, 100, 100, 100, 100, 100], 60, 60, 50);
    for (const point of points) {
      const distance = Math.hypot(point.x - 60, point.y - 60);
      expect(distance).toBeCloseTo(50, 1);
    }
  });

  it("零分时所有点落在圆心", () => {
    const points = radarPoints([0, 0, 0, 0, 0, 0], 60, 60, 50);
    for (const point of points) {
      expect(point.x).toBeCloseTo(60, 5);
      expect(point.y).toBeCloseTo(60, 5);
    }
  });

  it("维度数与坐标数一致（6 维）", () => {
    expect(radarPoints([80, 70, 60, 50, 40, 30], 0, 0, 100)).toHaveLength(6);
  });

  it("超出 0-100 的值被夹紧（模型给出 120 也不画出圈外）", () => {
    const points = radarPoints([120, -20, 100, 0, 50, 50], 60, 60, 50);
    expect(Math.hypot(points[0].x - 60, points[0].y - 60)).toBeCloseTo(50, 1);
    expect(points[1].x).toBeCloseTo(60, 5);
  });

  it("画像缺维时按 0 补齐，不崩", () => {
    expect(() => radarPoints([80], 60, 60, 50)).not.toThrow();
    expect(radarPoints([80], 60, 60, 50)).toHaveLength(6);
  });
});

/* ═══════════════ 靶点说明 ═══════════════ */

describe("describeBriefItem：质询靶点的可选性", () => {
  it("只列出对方真实填了的条目", () => {
    const items = briefItems({ conclusion: "会", reasons: ["A", "B"] });
    expect(items.map((i) => i.key)).toEqual(["结论", "理由 1", "理由 2"]);
  });

  it("有定义与依据时一并列出（定义可被质询，PRD §2）", () => {
    const items = briefItems({
      definition: "取代＝完全替代",
      conclusion: "会",
      reasons: ["A"],
      evidence: "某报告",
      evidenceStatus: "已提供来源",
    });
    expect(items.map((i) => i.key)).toEqual(["定义", "结论", "理由 1", "依据"]);
  });

  it("空结构返回空数组（没有靶点就不该显示质询）", () => {
    expect(briefItems(null)).toEqual([]);
  });

  it("describeBriefItem 给出人类可读的靶点说明", () => {
    expect(describeBriefItem("定义")).toContain("定义");
    expect(describeBriefItem("依据")).toContain("依据");
  });
});
