import { describe, expect, it } from "vitest";

import {
  applyLedger,
  applyRelations,
  assertNoCanonLeak,
  assertWithinVisible,
  relationGate,
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
    { id: "teacher", name: "教师", stake: "职业与家庭", visible: "聘用条件，家庭安排", resources: "积蓄与专业经验", canDo: ["协商"], relations: [{ to: "partner", attitude: 20 }] },
    { id: "partner", name: "伴侣", stake: "家庭稳定", visible: "家庭安排，孩子近况", resources: "家庭否决权", canDo: ["沟通"], relations: [{ to: "teacher", attitude: 20 }] },
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
  relationDeltas: [{ positionId: "partner", amount: 5 }],
  ledgerDeltas: [{ time: -1, opportunity: 2 }],
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

  it("拒绝幕数、关系目标和 canon 泄漏", () => {
    expect(validateActAdvanceResult(result, ["teacher", "partner"], 0, 2).ok).toBe(true);
    const invalid = { ...result, moves: [result.moves[0]], relationDeltas: [{ positionId: "unknown", amount: 1 }], canon: "hidden" };
    const checked = validateActAdvanceResult(invalid, ["teacher", "partner"], 0, 2);
    expect(checked.errors.map((item) => item.path)).toEqual(expect.arrayContaining(["moves", "relationDeltas[0].positionId", "$" ]));
  });

  it("按角色 visible 精确拦截越界信息", () => {
    expect(assertWithinVisible(result, event.positions[0]).ok).toBe(true);
    const leaked = structuredClone(result);
    leaked.nextScene.visibleFacts.push("孩子近况");
    expect(assertWithinVisible(leaked, event.positions[0]).ok).toBe(false);
  });

  it("检测原作关键词且结算函数不修改输入", () => {
    expect(assertNoCanonLeak("当事人决定继续协商聘用条件。", event.canon)).toContain("当事人决定继续协商聘用条件");
    const ledger = { time: 3, money: 2, relation: 0, health: 1, opportunity: 0 };
    expect(applyLedger(ledger, [{ time: -1, opportunity: 2 }])).toEqual({ ...ledger, time: 2, opportunity: 2 });
    expect(ledger.time).toBe(3);
    const relations = { partner: 98 };
    expect(applyRelations(relations, [{ positionId: "partner", amount: 8 }])).toEqual({ partner: 100 });
    expect(relations.partner).toBe(98);
  });

  it("关系门槛会反向限制动作", () => {
    const move = { ...result.moves[0], relationGate: { positionId: "partner", minimum: 20 } };
    expect(relationGate(move, { partner: 19 })).toBe(false);
    expect(relationGate(move, { partner: 20 })).toBe(true);
  });
});
