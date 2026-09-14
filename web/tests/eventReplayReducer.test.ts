import { describe, expect, it } from "vitest";

import {
  canChooseMove,
  createInitialReplayState,
  replayReducer,
} from "../src/domain/eventReplayReducer";
import type { ActAdvanceResult, EventReplay, ReplayState } from "../src/types/eventReplay";

/** 三幕、两个角色位的最小事件——只服务 reducer 契约，不冒充真实事件库。 */
const event: EventReplay = {
  header: {
    id: "fixture-career",
    title: "一次职业迁移（测试夹具）",
    background: "2023 年，一位教师收到异地学校的邀请。",
    adaptation: { peopleAliased: true, organizationsObscured: true, timeGranularity: "month" },
    admission: { publiclyDiscussed: true, disasterOrCasualty: false, reviewedAt: "2026-09-14" },
    endingCondition: { kind: "actCount", actCount: 3 },
  },
  positions: [
    {
      id: "teacher",
      name: "当事人",
      role: "收到异地邀请的教师",
      stake: "职业与家庭",
      visible: ["聘用条件", "家庭安排"],
      resources: "积蓄与专业经验",
      canDo: ["协商", "接受"],
      relations: [{ to: "partner", attitude: 20 }],
    },
    {
      id: "partner",
      name: "伴侣",
      role: "当事人的伴侣",
      stake: "家庭稳定",
      visible: ["家庭安排", "孩子近况"],
      resources: "家庭否决权",
      canDo: ["沟通", "拒绝"],
      relations: [{ to: "teacher", attitude: 30 }],
    },
  ],
  acts: [
    { index: 0, month: "2023-03", text: "异地学校发来正式邀请。" },
    { index: 1, month: "2023-05", text: "报到期限临近。" },
    { index: 2, month: "2023-06", text: "对方要求给出最终答复。" },
  ],
  canon: [
    {
      actIndex: 0,
      month: "2023-03",
      development: "现实中的公开讨论集中在两地教育资源差距",
      sources: [{ url: "https://www.zhihu.com/question/2038884733304697602", excerpt: "公开讨论摘要", reviewedAt: "2026-09-14" }],
    },
  ],
};

function advance(
  outcome: string,
  moves: ActAdvanceResult["moves"],
  extra: Partial<ActAdvanceResult> = {},
): ActAdvanceResult {
  return {
    outcome,
    nextScene: { month: "2023-05", text: `处境：${outcome}`, visibleFacts: ["聘用条件"] },
    moves,
    relationDeltas: [],
    ledgerDeltas: [],
    atEnding: false,
    ...extra,
  };
}

const moveA = { id: "a", text: "接受邀请", costHint: "搬迁成本", implicitAssumption: "机会不会重来", label: "accept" };
const moveB = { id: "b", text: "继续协商", costHint: "消耗人情", implicitAssumption: "条件仍可变化", label: "negotiate" };
const moveGated = { ...moveA, id: "g", relationGate: { positionId: "partner", minimum: 60 } };

/** 选位并走完开局，返回可直接做决定的运行态。 */
function started(): ReplayState {
  let state = createInitialReplayState(event);
  state = replayReducer(event, state, { type: "SELECT_POSITION", positionId: "teacher" });
  state = replayReducer(event, state, {
    type: "ADVANCE_SUCCEEDED",
    chosenMoveId: null,
    result: advance("受邀信摆在桌上。", [moveA, moveB]),
  });
  return state;
}

describe("事件推演 reducer", () => {
  it("选位后进入开局请求，关系取自角色位初始态度", () => {
    let state = createInitialReplayState(event);
    expect(state.positionId).toBeNull();
    expect(state.currentMoves).toEqual([]);
    state = replayReducer(event, state, { type: "SELECT_POSITION", positionId: "teacher" });
    expect(state.positionId).toBe("teacher");
    expect(state.pending).toBe(true);
    expect(state.relations).toEqual({ partner: 20 });
  });

  it("开局不落 history、不结算——还没有作出任何决定", () => {
    const state = started();
    expect(state.history).toEqual([]);
    expect(state.actIndex).toBe(0);
    expect(state.currentScene).toBe("处境：受邀信摆在桌上。");
    expect(state.currentMoves.map((item) => item.id)).toEqual(["a", "b"]);
    expect(state.ledger.time).toBe(0);
    expect(state.pending).toBe(false);
  });

  it("作出决定后固化进 history 并结算账本与关系", () => {
    let state = started();
    state = replayReducer(event, state, { type: "ACT_CHOSEN", moveId: "a" });
    expect(state.pending).toBe(true);
    expect(state.pendingMoveId).toBe("a");
    state = replayReducer(event, state, {
      type: "ADVANCE_SUCCEEDED",
      chosenMoveId: "a",
      result: advance("你签了意向书。", [moveA, moveB], {
        ledgerDeltas: [
          { key: "时间", delta: -2, note: "搬迁准备" },
          { key: "钱", delta: -3, note: "搬迁开销" },
        ],
        relationDeltas: [{ target: "伴侣", delta: 5 }],
      }),
    });
    expect(state.history).toHaveLength(1);
    expect(state.history[0]).toMatchObject({ actIndex: 0, moveId: "a", outcome: "你签了意向书。" });
    expect(state.ledger.time).toBe(-2);
    expect(state.ledger.money).toBe(-3);
    expect(state.relations.partner).toBe(25);
    expect(state.actIndex).toBe(1);
    expect(state.ended).toBe(false);
    expect(state.pending).toBe(false);
  });

  it("走到最后一幕自动收束，收束后不再提供动作", () => {
    let state = started();
    for (const id of ["a", "b", "a"]) {
      state = replayReducer(event, state, { type: "ACT_CHOSEN", moveId: id });
      state = replayReducer(event, state, {
        type: "ADVANCE_SUCCEEDED",
        chosenMoveId: id,
        result: advance(`第 ${state.actIndex + 1} 幕后果`, [moveA, moveB]),
      });
    }
    expect(state.history).toHaveLength(3);
    expect(state.actIndex).toBe(3);
    expect(state.ended).toBe(true);
    expect(state.currentMoves).toEqual([]);
    expect(canChooseMove(state, moveA)).toBe(false);
    // 收束后仍可接收结局卡
    state = replayReducer(event, state, {
      type: "ENDING_RECEIVED",
      ending: { title: "落定", text: "你在新城市安了家。" },
    });
    expect(state.ending?.title).toBe("落定");
  });

  it("关系门槛反向限制动作：不满足时选中无效且不可选", () => {
    let state = started();
    state = replayReducer(event, state, {
      type: "ADVANCE_SUCCEEDED",
      chosenMoveId: null,
      result: advance("关系紧张。", [moveGated, moveB]),
    });
    expect(canChooseMove(state, moveGated)).toBe(false);
    expect(canChooseMove(state, moveB)).toBe(true);
    const unchanged = replayReducer(event, state, { type: "ACT_CHOSEN", moveId: "g" });
    expect(unchanged).toEqual(state);
    expect(unchanged.pending).toBe(false);
  });

  it("失败态丢弃半截输出且不落 history，重试仍是整幕重来", () => {
    let state = started();
    const before = state;
    state = replayReducer(event, state, { type: "ACT_CHOSEN", moveId: "a" });
    state = replayReducer(event, state, { type: "ADVANCE_STREAM", text: "你签了" });
    expect(state.streamingOutcome).toBe("你签了");
    state = replayReducer(event, state, { type: "ADVANCE_FAILED", message: "这一步暂时无法推进" });
    expect(state.pending).toBe(false);
    expect(state.pendingError).toBe("这一步暂时无法推进");
    // 半截文本留在屏上（界面标「未完成」），但绝不写进 currentScene、绝不落 history
    expect(state.streamingOutcome).toBe("你签了");
    expect(state.history).toEqual([]);
    expect(state.currentScene).toBe(before.currentScene);
    expect(state.currentMoves.map((item) => item.id)).toEqual(["a", "b"]);

    // 重试是整幕重新生成：先清掉残留半截文本
    state = replayReducer(event, state, { type: "RETRY" });
    expect(state.pending).toBe(true);
    expect(state.streamingOutcome).toBe("");
    expect(state.pendingError).toBeNull();
  });

  it("流式增量只影响渲染，结构字段在完整结果到达前不变", () => {
    let state = started();
    const sceneBefore = state.currentScene;
    state = replayReducer(event, state, { type: "ACT_CHOSEN", moveId: "b" });
    state = replayReducer(event, state, { type: "ADVANCE_STREAM", text: "你提出" });
    state = replayReducer(event, state, { type: "ADVANCE_STREAM", text: "三项条件。" });
    expect(state.streamingOutcome).toBe("你提出三项条件。");
    expect(state.currentScene).toBe(sceneBefore);
    expect(state.currentMoves.map((item) => item.id)).toEqual(["a", "b"]);
    state = replayReducer(event, state, {
      type: "ADVANCE_SUCCEEDED",
      chosenMoveId: "b",
      result: advance("对方答应再谈一轮。", [moveA, moveB]),
    });
    expect(state.streamingOutcome).toBe("");
  });

  it("原作默认不可见，只有终局揭示才装载", () => {
    let state = started();
    expect(state.canon).toBeNull();
    expect(state.canonRevealed).toBe(false);
    // 未收束时揭示无效
    const blocked = replayReducer(event, state, { type: "REVEAL_CANON", canon: event.canon });
    expect(blocked).toEqual(state);
    for (const id of ["a", "b", "a"]) {
      state = replayReducer(event, state, { type: "ACT_CHOSEN", moveId: id });
      state = replayReducer(event, state, {
        type: "ADVANCE_SUCCEEDED",
        chosenMoveId: id,
        result: advance("推进", [moveA, moveB]),
      });
    }
    expect(state.canon).toBeNull();
    state = replayReducer(event, state, { type: "REVEAL_CANON", canon: event.canon });
    expect(state.canonRevealed).toBe(true);
    expect(state.canon).toHaveLength(1);
    // 一次性开关：重复揭示不再改写
    const again = replayReducer(event, state, { type: "REVEAL_CANON", canon: [] });
    expect(again.canon).toHaveLength(1);
  });

  it("开演后不能换角色位，RESTART 才清空运行态", () => {
    let state = started();
    state = replayReducer(event, state, { type: "ACT_CHOSEN", moveId: "a" });
    state = replayReducer(event, state, {
      type: "ADVANCE_SUCCEEDED",
      chosenMoveId: "a",
      result: advance("推进", [moveA, moveB]),
    });
    const tried = replayReducer(event, state, { type: "SELECT_POSITION", positionId: "partner" });
    expect(tried.positionId).toBe("teacher");
    const restarted = replayReducer(event, state, { type: "RESTART" });
    expect(restarted).toMatchObject({ positionId: null, history: [], actIndex: 0, ended: false });
    expect(restarted.canon).toBeNull();
  });
});
