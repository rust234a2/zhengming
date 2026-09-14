import { describe, expect, it } from "vitest";

import {
  buildAdvancePayload,
  buildEndingPayload,
  createHttpEventReplayClient,
  findCanonKeys,
  type AdvanceParams,
} from "../src/ui/event-replay/eventReplayClient";
import type { EventReplay } from "../src/types/eventReplay";

/** 与 eventReplayReducer.test.ts 同源的最小事件夹具，但带上 canon 以证明隔离。 */
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
      stake: "职业与家庭",
      visible: "聘用条件，家庭安排",
      resources: "积蓄与专业经验",
      canDo: ["协商", "接受"],
      relations: [{ to: "partner", attitude: 20 }],
    },
  ],
  acts: [{ index: 0, month: "2023-03", text: "异地学校发来正式邀请。" }],
  canon: [
    {
      actIndex: 0,
      month: "2023-03",
      development: "现实中的公开讨论集中在两地教育资源差距",
      sources: [
        {
          url: "https://www.zhihu.com/question/2038884733304697602",
          excerpt: "公开讨论摘要",
          reviewedAt: "2026-09-14",
        },
      ],
    },
  ],
};

const advanceParams: AdvanceParams = {
  header: event.header,
  position: event.positions[0],
  acts: event.acts,
  actIndex: 0,
  ledger: { time: 0, money: 0, relation: 0, health: 0, opportunity: 0 },
  relations: { partner: 20 },
  history: [
    {
      actIndex: 0,
      moveId: "a",
      moveText: "接受邀请",
      moveLabel: "accept",
      outcome: "对方要求一周内答复",
      ledgerDeltas: [],
      relationDeltas: [],
    },
  ],
  chosenMoveId: "a",
};

describe("buildAdvancePayload / buildEndingPayload（隔离白名单）", () => {
  it("请求体是纯白名单构造：即使入参携带 canon，也不出现任何 canon 键", () => {
    const payload = buildAdvancePayload(advanceParams);
    expect(findCanonKeys(payload)).toEqual([]);
    // 顶层只允许出现契约字段
    expect(Object.keys(payload).sort()).toEqual([
      "actIndex",
      "acts",
      "chosenMoveId",
      "header",
      "history",
      "ledger",
      "position",
      "relations",
    ]);
  });

  it("history 只携带决定与后果，不携带多余字段", () => {
    const payload = buildAdvancePayload(advanceParams) as {
      history: Record<string, unknown>[];
    };
    expect(payload.history).toHaveLength(1);
    expect(Object.keys(payload.history[0]).sort()).toEqual([
      "actIndex",
      "moveId",
      "moveLabel",
      "moveText",
      "outcome",
    ]);
  });

  it("replayEnding 请求体同样不含 canon", () => {
    const payload = buildEndingPayload({
      position: event.positions[0],
      history: advanceParams.history,
      ledger: advanceParams.ledger,
      relations: advanceParams.relations,
    });
    expect(findCanonKeys(payload)).toEqual([]);
    expect(Object.keys(payload).sort()).toEqual(["history", "ledger", "position", "relations"]);
  });

  it("findCanonKeys 能递归发现 canon / realChoice 键（隔离断言自身的健全性）", () => {
    const hits = findCanonKeys({
      nested: { canon: [{ realChoice: true }], safe: 1 },
      list: [{ history: "x" }],
    });
    expect(hits.sort()).toEqual(["canon", "realChoice"]);
  });
});

describe("createHttpEventReplayClient（HTTP seam，注入 fetch）", () => {
  function mockFetch(response: { status?: number; contentType?: string; body?: string } | Error) {
    const calls: { url: string; body: string }[] = [];
    const impl = (async (url: string, init?: { body?: string }) => {
      calls.push({ url, body: init?.body ?? "" });
      if (response instanceof Error) throw response;
      return {
        ok: (response.status ?? 200) >= 200 && (response.status ?? 200) < 300,
        status: response.status ?? 200,
        headers: { get: (key: string) => (key.toLowerCase() === "content-type" ? response.contentType ?? "application/json" : null) },
        json: async () => JSON.parse(response.body ?? "{}"),
        body: null,
      } as unknown as Response;
    }) as typeof fetch;
    return { impl, calls };
  }

  it("advance 把完整 ActAdvanceResult 作为单个增量交给渲染（不伪造逐字动画）", async () => {
    const result = {
      outcome: "对方接受了你的条件。",
      nextScene: { month: "2023-05", text: "报到期限临近。", visibleFacts: ["聘用条件"] },
      moves: [],
      relationDeltas: [],
      ledgerDeltas: [{ time: -2 }],
      atEnding: false,
    };
    const { impl, calls } = mockFetch({
      body: JSON.stringify({ ok: true, result, degraded: false }),
    });
    const client = createHttpEventReplayClient({ fetchImpl: impl });
    const deltas: string[] = [];
    const response = await client.advance(advanceParams, { onDelta: (t) => deltas.push(t) });

    expect(response.ok).toBe(true);
    expect(response.result).toEqual(result);
    expect(response.degraded).toBe(false);
    expect(deltas).toEqual([result.outcome]);
    // 走的是 Host 契约端点，且请求体里没有 canon
    expect(calls[0].url).toContain("/api/host/actAdvance");
    expect(findCanonKeys(JSON.parse(calls[0].body))).toEqual([]);
  });

  it("degraded:true 会被透传，界面据此明示「模拟」", async () => {
    const { impl } = mockFetch({
      body: JSON.stringify({
        ok: true,
        result: { outcome: "（模拟）", nextScene: { month: "", text: "", visibleFacts: [] }, moves: [], relationDeltas: [], ledgerDeltas: [], atEnding: false },
        degraded: true,
      }),
    });
    const client = createHttpEventReplayClient({ fetchImpl: impl });
    const response = await client.advance(advanceParams);
    expect(response.ok).toBe(true);
    expect(response.degraded).toBe(true);
  });

  it("错误信封被翻译成非指控式失败文案", async () => {
    const { impl } = mockFetch({
      body: JSON.stringify({ ok: false, error: { code: "TIMEOUT", message: "upstream timeout" } }),
    });
    const client = createHttpEventReplayClient({ fetchImpl: impl });
    const response = await client.advance(advanceParams);
    expect(response.ok).toBe(false);
    expect(response.error).toBe("模型响应超时");
  });

  it("连接失败（fetch 抛错）返回失败态而不是把半截输出当结果", async () => {
    const { impl } = mockFetch(new Error("network down"));
    const client = createHttpEventReplayClient({ fetchImpl: impl });
    const response = await client.advance(advanceParams);
    expect(response.ok).toBe(false);
    expect(response.error).toBe("连接不上服务端");
    expect(response.result).toBeNull();
  });

  it("replayCanon 是独立通道，只在终局展开时由调用方触发", async () => {
    const { impl, calls } = mockFetch({ body: JSON.stringify({ ok: true, result: event.canon }) });
    const client = createHttpEventReplayClient({ fetchImpl: impl });
    const response = await client.canon(event.header.id);
    expect(response.ok).toBe(true);
    expect(response.result).toEqual(event.canon);
    expect(calls[0].url).toContain("/api/host/replayCanon");
  });
});
