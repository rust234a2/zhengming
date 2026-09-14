import { describe, expect, it } from "vitest";

import {
  applyLedger,
  applyRelations,
  assertNoCanonLeak,
  filterWithinVisible,
  isComposedEventId,
  normalizeComposedEvent,
  normalizeLedgerKey,
  relationGate,
  resolveRelationTarget,
  validateActAdvanceResult,
  validateEventReplay,
} from "../src/domain/eventReplay";
import type { ActAdvanceResult, EventReplay } from "../src/types/eventReplay";

const event: EventReplay = {
  header: {
    id: "career-crossroads",
    title: "一次职业迁移",
    background: "2023 年，一位教师收到异地学校的邀请。",
    adaptation: { peopleAliased: true, organizationsObscured: true, timeGranularity: "month" },
    admission: { publiclyDiscussed: true, disasterOrCasualty: false, reviewedAt: "2026-09-14" },
    endingCondition: { kind: "actCount", actCount: 2 },
  },
  positions: [
    { id: "teacher", name: "教师", role: "收到异地邀请的教师", stake: "职业与家庭", visible: ["聘用条件", "家庭安排"], resources: "积蓄与专业经验", canDo: ["协商"], relations: [{ to: "partner", attitude: 20 }] },
    { id: "partner", name: "伴侣", role: "当事人的伴侣", stake: "家庭稳定", visible: ["家庭安排", "孩子近况"], resources: "家庭否决权", canDo: ["沟通"], relations: [{ to: "teacher", attitude: 20 }] },
  ],
  acts: [
    { index: 0, month: "2023-03", text: "异地学校发来正式邀请。" },
    { index: 1, month: "2023-06", text: "报到期限临近。" },
  ],
  canon: [
    { actIndex: 0, month: "2023-03", development: "当事人决定继续协商聘用条件", sources: [{ url: "https://www.zhihu.com/question/2038884733304697602", excerpt: "公开讨论摘要", reviewedAt: "2026-09-14" }] },
  ],
};

const result: ActAdvanceResult = {
  outcome: "协商为家庭争取了更多时间。",
  nextScene: { month: "2023-06", text: "报到期限临近。", visibleFacts: ["聘用条件"] },
  moves: [
    { id: "accept", text: "接受邀请", costHint: "搬迁时间", implicitAssumption: "机会不会重来", label: "accept" },
    { id: "wait", text: "继续协商", costHint: "消耗人情", implicitAssumption: "条件仍可变化", label: "negotiate" },
  ],
  relationDeltas: [{ target: "伴侣", delta: 5 }],
  ledgerDeltas: [
    { key: "时间", delta: -1, note: "协商占掉的时间" },
    { key: "机会", delta: 2, note: "争取到的缓冲" },
  ],
  atEnding: false,
};

describe("事件推演领域校验", () => {
  it("接受合格事件并给错误返回字段路径", () => {
    expect(validateEventReplay(event)).toEqual({ ok: true, errors: [] });
    const invalid = structuredClone(event);
    invalid.positions[1].visible = invalid.positions[0].visible;
    invalid.positions[1].resources = invalid.positions[0].resources;
    invalid.canon[0].sources[0].url = "http://example.com";
    const checked = validateEventReplay(invalid);
    expect(checked.ok).toBe(false);
    expect(checked.errors.map((item) => item.path)).toContain("positions");
    expect(checked.errors.map((item) => item.path)).toContain("canon[0].sources[0].url");
  });

  it("拒绝幕数不足与 canon 泄漏；未知关系目标不阻断整幕", () => {
    expect(validateActAdvanceResult(result, 0, 2).ok).toBe(true);

    const invalid = { ...result, moves: [result.moves[0]], canon: "hidden" };
    const checked = validateActAdvanceResult(invalid, 0, 2);
    expect(checked.errors.map((item) => item.path)).toEqual(expect.arrayContaining(["moves", "$"]));

    // 模型给的可能是代称（真机实测会给「林女士」这类简称）：不该为一个称谓废掉整幕，
    // 解析不了的条目由 applyRelations 丢弃。
    const unknown = { ...result, relationDeltas: [{ target: "查无此人", delta: 1 }] };
    expect(validateActAdvanceResult(unknown, 0, 2).ok).toBe(true);
  });

  it("atEnding 由前端按幕数归一化：模型置错不产生错误，直接被纠正", () => {
    // 第 1 幕（共 2 幕）：模型谎报终局 → 归一化为 false，且不算校验失败
    const earlyEnding = structuredClone(result);
    earlyEnding.atEnding = true;
    expect(validateActAdvanceResult(earlyEnding, 0, 2).ok).toBe(true);
    expect(earlyEnding.atEnding).toBe(false);
    // 最后一幕：模型忘了置位 → 归一化为 true
    const missedEnding = structuredClone(result);
    missedEnding.atEnding = false;
    expect(validateActAdvanceResult(missedEnding, 1, 2).ok).toBe(true);
    expect(missedEnding.atEnding).toBe(true);
  });

  it("越界 visibleFacts 被丢弃不展示（泄露内容不进「知道」列表），不再废整幕", () => {
    const leaked = structuredClone(result);
    leaked.nextScene.visibleFacts = ["聘用条件", "孩子近况"];
    const dropped = filterWithinVisible(leaked, event.positions[0]);
    expect(dropped).toEqual(["孩子近况"]);
    expect(leaked.nextScene.visibleFacts).toEqual(["聘用条件"]);
  });

  it("检测原作关键词且结算函数不修改输入", () => {
    expect(assertNoCanonLeak("当事人决定继续协商聘用条件。", event.canon)).toContain("当事人决定继续协商聘用条件");
    const ledger = { time: 3, money: 2, relation: 0, health: 1, opportunity: 0 };
    expect(
      applyLedger(ledger, [
        { key: "时间", delta: -1, note: "协商占掉的时间" },
        { key: "机会", delta: 2, note: "争取到的缓冲" },
      ]),
    ).toEqual({ ...ledger, time: 2, opportunity: 2 });
    expect(ledger.time).toBe(3);
    const relations = { partner: 98 };
    expect(applyRelations(relations, [{ target: "伴侣", delta: 8 }], event.positions)).toEqual({
      partner: 100,
    });
    expect(relations.partner).toBe(98);
  });

  it("关系门槛会反向限制动作", () => {
    const move = { ...result.moves[0], relationGate: { positionId: "partner", minimum: 20 } };
    expect(relationGate(move, { partner: 19 })).toBe(false);
    expect(relationGate(move, { partner: 20 })).toBe(true);
  });
});

/**
 * 这一组守的是 Host 契约 §0.7 的形状边界。
 *
 * 起因：服务端与前端曾各自想象 `ledger` / `relations` 的形状（一边要条目数组、
 * 一边发累加对象），首度联调第一发请求就是 `400 VALIDATION: ledger must be an array`。
 * 契约 §0.7 定死形状后，这里把「模型可能给什么」的边界逐条钉住。
 */
describe("Host 契约 §0.7 · 形状与归一化", () => {
  it("账本维度：中文名 / 英文键 / 常见别名都归一，五维之外返回 null", () => {
    expect(normalizeLedgerKey("时间")).toBe("time");
    expect(normalizeLedgerKey("钱")).toBe("money");
    expect(normalizeLedgerKey("time")).toBe("time");
    expect(normalizeLedgerKey("opportunity")).toBe("opportunity");
    expect(normalizeLedgerKey("人情")).toBe("relation");
    expect(normalizeLedgerKey("金钱成本")).toBe("money"); // 条目名里含维度词
    expect(normalizeLedgerKey("声望")).toBeNull(); // PRD 定死五维，自造维度不许进账本
    expect(normalizeLedgerKey("   ")).toBeNull();
  });

  it("账本增量：归一化不了的条目被丢弃，不污染其他维度", () => {
    const ledger = { time: 0, money: 0, relation: 0, health: 0, opportunity: 0 };
    const next = applyLedger(ledger, [
      { key: "时间", delta: -2, note: "搬迁准备" },
      { key: "声望", delta: 99, note: "模型自造维度" },
      { key: "relation", delta: -1, note: "英文键也吃" },
    ]);
    expect(next).toEqual({ time: -2, money: 0, relation: -1, health: 0, opportunity: 0 });
  });

  it("关系目标：id / 角色名 / 简称都解析到同一角色位，解析不了的条目被丢弃", () => {
    expect(resolveRelationTarget("partner", event.positions)).toBe("partner");
    expect(resolveRelationTarget("伴侣", event.positions)).toBe("partner");
    expect(resolveRelationTarget("伴侣（她）", event.positions)).toBe("partner");
    expect(resolveRelationTarget("查无此人", event.positions)).toBeNull();

    const rels = applyRelations(
      {},
      [
        { target: "伴侣", delta: 10 },
        { target: "查无此人", delta: 100 },
      ],
      event.positions,
    );
    expect(rels).toEqual({ partner: 10 });
  });

  it("角色位按契约序列化：visible 是数组，越界条目直接过滤掉", () => {
    // 「孩子近况」只属于 partner 的可见范围，在 teacher 位置上必须被丢弃
    const leaked = structuredClone(result);
    leaked.nextScene.visibleFacts = ["孩子近况"];
    const dropped = filterWithinVisible(leaked, event.positions[0]);
    expect(dropped).toEqual(["孩子近况"]);
    expect(leaked.nextScene.visibleFacts).toEqual([]);
  });

  it("越界判定容忍标点差异与适度精简，只丢范围外的内容", () => {
    // teacher 的 visible 是 ["聘用条件", "家庭安排"]
    const tolerated = structuredClone(result);
    tolerated.nextScene.visibleFacts = ["聘用条件。", "家庭安排（含收支）", "家庭安排"];
    expect(filterWithinVisible(tolerated, event.positions[0])).toEqual([]);

    const outOfRange = structuredClone(result);
    outOfRange.nextScene.visibleFacts = ["配偶的内心活动"];
    expect(filterWithinVisible(outOfRange, event.positions[0])).toEqual(["配偶的内心活动"]);
  });
});

describe("normalizeComposedEvent（能力 9 · 契约 §0.8）", () => {
  const scaffold = {
    title: "一次团队去留",
    background: "一家 30 人的创业公司收到低估值收购意向，核心团队分歧很大。",
    admission: { publiclyDiscussed: true, disasterOrCasualty: false },
    positions: [
      {
        id: "founder",
        name: "创始人（化名）",
        role: "公司创始人",
        stake: "团队存续",
        visible: ["现金只能撑四个月", "收购意向已到账"],
        resources: "决策权",
        canDo: ["谈判", "接受"],
        relations: [
          { to: "engineer", attitude: 10 },
          { to: "unknown-position", attitude: 99 }, // 指向未知 → 应被丢弃
          { to: "founder", attitude: 50 }, // 指向自身 → 应被丢弃
        ],
      },
      {
        id: "engineer",
        name: "核心工程师（化名）",
        role: "技术负责人",
        stake: "技术路线延续",
        visible: ["收购方将解散现有技术线"],
        resources: "离职选项",
        canDo: ["沟通", "离职"],
        relations: [{ to: "founder", attitude: -10 }],
      },
    ],
    acts: [
      { index: 5, month: "2024-01", text: "收购意向首次接触。" },
      { index: 9, month: "2024-03", text: "投资人给出最后期限。" },
    ],
  };

  it("归一化为标准事件：id 加前缀、幕序号重排、canon 恒为空", () => {
    const composed = normalizeComposedEvent(scaffold);
    expect(composed.header.id.startsWith("compose-")).toBe(true);
    expect(composed.acts.map((act) => act.index)).toEqual([0, 1]);
    expect(composed.header.endingCondition).toEqual({ kind: "actCount", actCount: 2 });
    expect(composed.canon).toEqual([]);
    expect(composed.header.adaptation).toEqual({
      peopleAliased: true,
      organizationsObscured: true,
      timeGranularity: "month",
    });
    expect(composed.header.admission.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("关系只保留指向已知角色位的条目，且过完 validateEventReplay 准入校验", () => {
    const composed = normalizeComposedEvent(scaffold);
    expect(composed.positions[0].relations).toEqual([{ to: "engineer", attitude: 10 }]);

    const checked = validateEventReplay(composed);
    expect(checked.errors).toEqual([]);
  });

  it("模型申报非公开讨论时，准入校验必须拦下（底线 1）", () => {
    const composed = normalizeComposedEvent({
      ...scaffold,
      admission: { publiclyDiscussed: false, disasterOrCasualty: false },
    });
    const checked = validateEventReplay(composed);
    expect(checked.ok).toBe(false);
    expect(checked.errors.some((item) => item.path === "header.admission.publiclyDiscussed")).toBe(true);
  });

  it("isComposedEventId 只认 compose- 前缀", () => {
    expect(isComposedEventId("compose-1726000000000")).toBe(true);
    expect(isComposedEventId("career-crossroads")).toBe(false);
  });
});
