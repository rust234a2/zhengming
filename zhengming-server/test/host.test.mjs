/**
 * Host 能力层单测（node --test）
 *
 * 覆盖契约里的硬约束：
 *  - 统一信封与错误码枚举
 *  - 禁用词表命中 → CONTENT_REJECTED（含重试 1 次）
 *  - 幂等：同 requestId 不二次调用模型
 *  - 降级：无 key 时 degraded:true，且绝不静默假装真实输出
 *  - 能力 6/7 的隔离硬约束（canon / realChoice 不得入参）
 *  - 结构校验：moves 必须 2-3 张、makeQuestion 只能一个问题、terminalProbes 恰好两条
 */

import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  BANNED_WORDS,
  ERROR_CODES,
  charCount,
  findBannedWords,
  isSingleQuestion,
} from "../lib/contract.mjs";
import {
  assertIsolation,
  clearIdempotencyCache,
  idempotencyCacheSize,
  invokeHost,
  readApiKey,
  stripCodeFence,
} from "../lib/host.mjs";

/** 构造一个假的 StepFun 响应 */
function fakeFetch(content, { status = 200, capture } = {}) {
  return async (url, init) => {
    if (capture) {
      capture.url = url;
      capture.init = init;
      capture.body = JSON.parse(init.body);
    }
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => ({ choices: [{ message: { content } }] }),
    };
  };
}

beforeEach(() => {
  clearIdempotencyCache();
});

/* ─────────── 常量与工具 ─────────── */

test("禁用词表与契约一致（7 个词）", () => {
  assert.deepEqual([...BANNED_WORDS], ["错误", "谬误", "偷换", "输赢", "对错", "你错了", "赢了"]);
});

test("findBannedWords 递归扫描嵌套结构", () => {
  assert.deepEqual(findBannedWords("这是一段正常的话"), []);
  assert.deepEqual(findBannedWords("你的推理有错误"), ["错误"]);
  assert.deepEqual(findBannedWords({ a: { b: ["正常", "这是谬误"] } }), ["谬误"]);
  assert.deepEqual(findBannedWords([{ text: "你赢了" }, { text: "偷换概念" }]).sort(), ["偷换", "赢了"].sort());
  // 不重复计数
  assert.deepEqual(findBannedWords("对错和对错都是对错"), ["对错"]);
});

test("isSingleQuestion 拒绝打包追问", () => {
  assert.equal(isSingleQuestion("这个数据是哪年的？"), true);
  assert.equal(isSingleQuestion("这个数据是哪年的？另外你觉得孩子能适应吗？"), false);
  assert.equal(isSingleQuestion("这个数据是哪年的。"), false);
  assert.equal(isSingleQuestion(""), false);
});

test("charCount 按码点计数（emoji 算 1 个）", () => {
  assert.equal(charCount("你好"), 2);
  assert.equal(charCount("👍a"), 2);
});

test("stripCodeFence 去掉 ```json 围栏", () => {
  assert.equal(stripCodeFence('```json\n{"a":1}\n```'), '{"a":1}');
  assert.equal(stripCodeFence('{"a":1}'), '{"a":1}');
});

/* ─────────── 信封与错误码 ─────────── */

test("未知能力返回 CAPABILITY_NOT_FOUND", async () => {
  const res = await invokeHost("noSuchCapability", {}, { apiKey: null, requestId: "r-1" });
  assert.equal(res.ok, false);
  assert.equal(res.error.code, ERROR_CODES.CAPABILITY_NOT_FOUND);
  assert.equal(res.error.requestId, "r-1");
});

test("入参不过 schema 返回 VALIDATION", async () => {
  const res = await invokeHost("structureHint", { statement: "" }, { apiKey: "sk-test", requestId: "r-2" });
  assert.equal(res.ok, false);
  assert.equal(res.error.code, ERROR_CODES.VALIDATION);
});

test("evaluate 空 transcript 返回 VALIDATION", async () => {
  const res = await invokeHost("evaluate", { transcript: [] }, { apiKey: "sk-test", requestId: "r-3" });
  assert.equal(res.ok, false);
  assert.equal(res.error.code, ERROR_CODES.VALIDATION);
});

test("超 256KB 请求体返回 PAYLOAD_TOO_LARGE", async () => {
  const huge = { statement: "x".repeat(300 * 1024) };
  const res = await invokeHost("structureHint", huge, { apiKey: "sk-test", requestId: "r-4" });
  assert.equal(res.ok, false);
  assert.equal(res.error.code, ERROR_CODES.PAYLOAD_TOO_LARGE);
});

/* ─────────── 降级路径 ─────────── */

test("无 key 时降级：结构提示只提要素、不代写，且带 degraded 标记", async () => {
  const res = await invokeHost(
    "structureHint",
    { statement: "43 岁该辞职去苏州——窗口期不等人" },
    { apiKey: null, requestId: "r-5" },
  );
  assert.equal(res.ok, true);
  assert.equal(res.capability, "structureHint");
  assert.equal(res.degraded, true);
  assert.match(res.degradedReason, /STEPFUN_API_KEY/);
  assert.equal(typeof res.result, "string");
  assert.equal(findBannedWords(res.result).length, 0);
  // 不代写：不得出现成段的论证内容（判断依据：长度受控且不含引号包裹的示例句）
  assert.ok(charCount(res.result) <= 60);
});

test("无 key 时 opponentTurn 返回单个合法 Bot 动作并明确降级", async () => {
  const res = await invokeHost(
    "opponentTurn",
    {
      phase: "opening",
      side: "con",
      topic: { title: "AI 会改变程序员职业吗？", con: { claim: "职业形态会改变" } },
      presetClaim: "职业形态会改变",
      ownBrief: null,
      opponentBrief: null,
      transcript: [],
      crossRecords: [],
    },
    { apiKey: null, requestId: "opponent-fallback-1" },
  );
  assert.equal(res.ok, true);
  assert.equal(res.degraded, true);
  assert.equal(res.result.action.kind, "submitBrief");
  assert.equal(findBannedWords(res.result).length, 0);
});

test("无 key 降级：evaluate 返回契约同形六维载荷", async () => {
  const res = await invokeHost(
    "evaluate",
    {
      transcript: [
        { turnId: "t1", authorId: "user", kind: "opening", text: "我方标准是：不可逆的机会损失优先于可缓解的家庭波动。结论是今年该去。" },
        { turnId: "t2", authorId: "bot", kind: "question", text: "这个窗口期是客观机制还是主观感受？" },
        { turnId: "t3", authorId: "user", kind: "answer", text: "有公开文件支撑，不是主观感受。", evidenceStatus: "已提供来源" },
      ],
    },
    { apiKey: null, requestId: "r-6" },
  );
  assert.equal(res.ok, true);
  assert.equal(res.degraded, true);
  const { dims, total, grounds } = res.result;
  assert.deepEqual(Object.keys(dims), ["立论", "论据", "逻辑", "回应", "表达", "规范"]);
  for (const v of Object.values(dims)) assert.ok(v >= 0 && v <= 100);
  assert.equal(total, Math.round(Object.values(dims).reduce((a, b) => a + b, 0) / 6));
  assert.ok(Array.isArray(grounds));
  // 无胜负语义
  assert.equal(findBannedWords(res.result).length, 0);
});

test("无 key 降级：接受只是流程动作，不会提高回应分", async () => {
  const base = [
    { turnId: "t1", authorId: "bot", kind: "question", text: "你的数据覆盖哪个时间段？" },
    { turnId: "t2", authorId: "user", kind: "answer", text: "数据覆盖最近三个完整年度。" },
  ];
  const withoutAccept = await invokeHost("evaluate", { transcript: base }, { apiKey: null, requestId: "r-6a" });
  const withAccept = await invokeHost(
    "evaluate",
    { transcript: [...base, { turnId: "t3", authorId: "bot", kind: "reaction", text: "接受回答" }] },
    { apiKey: null, requestId: "r-6b" },
  );

  assert.equal(withoutAccept.ok, true);
  assert.equal(withAccept.ok, true);
  assert.equal(withAccept.result.dims.回应, withoutAccept.result.dims.回应);
});

test("无 key 降级：actAdvance 的 moves 落在 2-3 张", async () => {
  const res = await invokeHost(
    "actAdvance",
    { header: { title: "测试事件" }, position: { name: "角色位" }, acts: [{ month: "一月" }], actIndex: 0 },
    { apiKey: null, requestId: "r-7" },
  );
  assert.equal(res.ok, true);
  assert.ok(res.result.moves.length >= 2 && res.result.moves.length <= 3);
});

test("无 key 降级：replayCanon 无可靠来源时返回空数组，不编造", async () => {
  const res = await invokeHost("replayCanon", { eventId: "some-event" }, { apiKey: null, requestId: "r-8" });
  assert.equal(res.ok, true);
  assert.deepEqual(res.result.canon, []);
});

test("readApiKey 只从环境变量读，空白视为无 key", () => {
  assert.equal(readApiKey({}), null);
  assert.equal(readApiKey({ STEPFUN_API_KEY: "   " }), null);
  assert.equal(readApiKey({ STEPFUN_API_KEY: " sk-abc " }), "sk-abc");
});

/* ─────────── 真实调用路径（注入 fake fetch） ─────────── */

test("有 key 时走 StepFun，请求头带 Bearer 且 key 不外泄到返回体", async () => {
  const capture = {};
  const res = await invokeHost(
    "structureHint",
    { statement: "43 岁该辞职去苏州" },
    { apiKey: "sk-secret", requestId: "r-9", fetchImpl: fakeFetch("你的陈述里有结论和一条理由，但没给出判断标准——按什么标准衡量？", { capture }) },
  );
  assert.equal(res.ok, true);
  assert.equal(res.degraded, undefined);
  assert.equal(capture.url, "https://api.stepfun.com/v1/chat/completions");
  assert.equal(capture.init.headers.Authorization, "Bearer sk-secret");
  assert.equal(capture.body.model, "step-3.7-flash");
  assert.equal(capture.body.response_format, undefined, "structureHint 不需要结构化输出");
  // key 绝不出现在返回体序列化结果里
  assert.equal(JSON.stringify(res).includes("sk-secret"), false);
});

test("结构化能力带 response_format: json_object", async () => {
  const capture = {};
  await invokeHost(
    "evaluate",
    { transcript: [{ turnId: "t1", authorId: "user", kind: "opening", text: "我方结论是今年该去。" }] },
    {
      apiKey: "sk-test",
      requestId: "r-10",
      fetchImpl: fakeFetch(
        JSON.stringify({ dims: { 立论: 78, 论据: 64, 逻辑: 82, 回应: 71, 表达: 80, 规范: 90 }, total: 0, grounds: [] }),
        { capture },
      ),
    },
  );
  assert.deepEqual(capture.body.response_format, { type: "json_object" });
  assert.equal(capture.body.temperature, 0.3);
});

test("模型输出命中禁用词 → 重试 1 次 → 仍命中则 CONTENT_REJECTED", async () => {
  let calls = 0;
  const res = await invokeHost(
    "structureHint",
    { statement: "43 岁该辞职去苏州" },
    {
      apiKey: "sk-test",
      requestId: "r-11",
      fetchImpl: async () => {
        calls += 1;
        return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: "你的推理存在错误。" } }] }) };
      },
    },
  );
  assert.equal(res.ok, false);
  assert.equal(res.error.code, ERROR_CODES.CONTENT_REJECTED);
  assert.equal(calls, 2, "必须重试恰好一次");
});

test("首次命中禁用词、重试通过 → 返回成功结果", async () => {
  let calls = 0;
  const res = await invokeHost(
    "structureHint",
    { statement: "43 岁该辞职去苏州" },
    {
      apiKey: "sk-test",
      requestId: "r-12",
      fetchImpl: async () => {
        calls += 1;
        const content = calls === 1 ? "你的说法有错误。" : "你的陈述里有结论和一条理由，但没有给出判断标准。";
        return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }] }) };
      },
    },
  );
  assert.equal(res.ok, true);
  assert.equal(calls, 2);
  assert.equal(findBannedWords(res.result).length, 0);
});

test("makeQuestion 返回两个问题 → CONTENT_REJECTED（禁打包追问）", async () => {
  const res = await invokeHost(
    "makeQuestion",
    { targetClaim: { label: "依据", text: "苏州公告年龄上限放宽至 45 岁" } },
    {
      apiKey: "sk-test",
      requestId: "r-13",
      fetchImpl: fakeFetch("这个数据是哪年的？另外你觉得孩子能适应吗？"),
    },
  );
  assert.equal(res.ok, false);
  assert.equal(res.error.code, ERROR_CODES.CONTENT_REJECTED);
});

test("actAdvance 只返回 1 张 move → CONTENT_REJECTED", async () => {
  const res = await invokeHost(
    "actAdvance",
    { header: {}, position: {}, acts: [], actIndex: 0 },
    {
      apiKey: "sk-test",
      requestId: "r-14",
      fetchImpl: fakeFetch(
        JSON.stringify({ outcome: "本幕结束。", nextScene: { month: "二月", text: "处境", visibleFacts: [] }, moves: [{ id: "m1", text: "做点什么", costHint: "", implicitAssumption: "", label: "行动" }] }),
      ),
    },
  );
  assert.equal(res.ok, false);
  assert.equal(res.error.code, ERROR_CODES.CONTENT_REJECTED);
});

test("terminalProbes 返回 1 条或 3 条 → CONTENT_REJECTED", async () => {
  for (const payload of [["只有一个问题？"], ["一？", "二？", "三？"]]) {
    clearIdempotencyCache();
    const res = await invokeHost(
      "terminalProbes",
      { history: [], ledger: [], relations: [] },
      { apiKey: "sk-test", requestId: `r-15-${payload.length}`, fetchImpl: fakeFetch(JSON.stringify(payload)) },
    );
    assert.equal(res.ok, false);
    assert.equal(res.error.code, ERROR_CODES.CONTENT_REJECTED);
  }
});

test("replayCanon 丢弃非 https 来源的条目（不伪造）", async () => {
  const res = await invokeHost(
    "replayCanon",
    { eventId: "e1" },
    {
      apiKey: "sk-test",
      requestId: "r-16",
      fetchImpl: fakeFetch(
        JSON.stringify({
          canon: [
            { actIndex: 0, month: "一月", development: "中性史实描述", sources: [{ url: "http://insecure.example.com", reviewedAt: "2026-09-01" }] },
            { actIndex: 1, month: "二月", development: "中性史实描述", sources: [{ url: "https://www.zhihu.com/question/1", reviewedAt: "2026-09-01" }] },
          ],
        }),
      ),
    },
  );
  assert.equal(res.ok, true);
  assert.equal(res.result.canon.length, 1);
  assert.match(res.result.canon[0].sources[0].url, /^https:\/\//);
});

test("上游 5xx → UPSTREAM；超时 → TIMEOUT", async () => {
  const up = await invokeHost("structureHint", { statement: "abc" }, {
    apiKey: "sk-test",
    requestId: "r-17",
    fetchImpl: fakeFetch("", { status: 503 }),
  });
  assert.equal(up.error.code, ERROR_CODES.UPSTREAM);

  const to = await invokeHost("structureHint", { statement: "abc" }, {
    apiKey: "sk-test",
    requestId: "r-18",
    timeoutMs: 1,
    fetchImpl: async () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      throw err;
    },
  });
  assert.equal(to.error.code, ERROR_CODES.TIMEOUT);
});

test("timeoutMs=0 时不注册中止信号", async () => {
  const capture = {};
  const result = await invokeHost("structureHint", { statement: "abc" }, {
    apiKey: "sk-test",
    requestId: "r-no-timeout",
    timeoutMs: 0,
    fetchImpl: fakeFetch("陈述尚未给出判断标准。", { capture }),
  });

  assert.equal(result.ok, true);
  assert.equal("signal" in capture.init, false);
});

test("上游报错信息不把 key 透出", async () => {
  const res = await invokeHost("structureHint", { statement: "abc" }, {
    apiKey: "sk-super-secret",
    requestId: "r-19",
    fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({ error: { message: "Bearer sk-super-secret invalid" } }) }),
  });
  assert.equal(res.ok, false);
  assert.equal(JSON.stringify(res).includes("sk-super-secret"), false);
});

/* ─────────── 幂等 ─────────── */

test("同 requestId 重复调用返回缓存，不二次调用模型", async () => {
  let calls = 0;
  const opts = {
    apiKey: "sk-test",
    requestId: "r-idem",
    fetchImpl: async () => {
      calls += 1;
      return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: "你的陈述里还缺一项结构要素。" } }] }) };
    },
  };
  const first = await invokeHost("structureHint", { statement: "abc" }, opts);
  const second = await invokeHost("structureHint", { statement: "abc" }, opts);
  assert.equal(calls, 1);
  assert.deepEqual(first, second);
  assert.equal(idempotencyCacheSize(), 1);
});

test("不同 requestId 各自计算", async () => {
  let calls = 0;
  const make = (rid) =>
    invokeHost("structureHint", { statement: "abc" }, {
      apiKey: "sk-test",
      requestId: rid,
      fetchImpl: async () => {
        calls += 1;
        return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: "还缺一项结构要素。" } }] }) };
      },
    });
  await make("r-a");
  await make("r-b");
  assert.equal(calls, 2);
});

/* ─────────── 隔离硬约束（契约 §8） ─────────── */

test("actAdvance / replayEnding 入参含 canon / realChoice → VALIDATION", async () => {
  const bad = [
    { header: {}, position: {}, acts: [], actIndex: 0, canon: [{ actIndex: 0 }] },
    { position: {}, history: [], ledger: [], relations: [], realChoice: "x" },
  ];
  for (const [i, params] of bad.entries()) {
    clearIdempotencyCache();
    const capability = i === 0 ? "actAdvance" : "replayEnding";
    const res = await invokeHost(capability, params, { apiKey: "sk-test", requestId: `r-iso-${i}` });
    assert.equal(res.ok, false);
    assert.equal(res.error.code, ERROR_CODES.VALIDATION);
    assert.match(res.error.message, /isolation breach/);
  }
});

test("assertIsolation 直接调用时能捕获嵌套键", () => {
  assert.throws(() => assertIsolation({ history: [{ canon: [] }] }), /isolation breach/);
  assert.throws(() => assertIsolation({ x: { deep: { realPath: "y" } } }), /isolation breach/);
  assert.doesNotThrow(() => assertIsolation({ history: [{ outcome: "正常叙事" }] }));
});
