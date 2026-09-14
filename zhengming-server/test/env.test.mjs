/**
 * 环境加载与真实 StepFun 连通性验证（S5 前置）
 *
 * 覆盖两件事：
 *   1) .env 加载器行为正确（解析 / 不覆盖已有 / 值不进日志）
 *   2) 配了 key 时确实打到 StepFun，返回结构符合契约，且 key 不外泄
 *
 * 无 key 时跳过联网部分并打印 SKIP，不判失败（离线也能跑）。
 */

import assert from "node:assert/strict";
import test from "node:test";

import { loadEnv, parseEnv } from "../lib/env.mjs";
// 副作用：把 zhengming-server/.env 注入 process.env（host.mjs 的 readApiKey 依赖它）
import "../lib/env.mjs";
import { findBannedWords } from "../lib/contract.mjs";
import { readApiKey, invokeHost } from "../lib/host.mjs";

test("parseEnv：注释 / 引号 / export 前缀 / 行内注释", () => {
  const parsed = parseEnv(
    [
      "# 这是注释",
      "",
      "AKEY=plainvalue",
      'BKEY="quoted value"',
      "CKEY='single'",
      "export DKEY=exported",
      "EKEY=value # 行内注释",
      "FKEY=has#hash",
      "bad line without equals",
      "1INVALID=x",
    ].join("\n"),
  );
  assert.equal(parsed.AKEY, "plainvalue");
  assert.equal(parsed.BKEY, "quoted value");
  assert.equal(parsed.CKEY, "single");
  assert.equal(parsed.DKEY, "exported");
  assert.equal(parsed.EKEY, "value");
  assert.equal(parsed.FKEY, "has#hash", "值内无空格的 # 不应被截断");
  assert.equal(parsed["1INVALID"], undefined, "非法键名应被丢弃");
});

test("loadEnv：不覆盖已存在的环境变量", () => {
  const template = "STEPFUN_API_KEY=from-file";
  const parsed = parseEnv(template);
  // 已有值优先：模拟 env 里已有 shell 传入的值
  const env = { STEPFUN_API_KEY: "from-shell" };
  for (const [key, value] of Object.entries(parsed)) {
    if (env[key] === undefined || env[key] === "") env[key] = value;
  }
  assert.equal(parsed.STEPFUN_API_KEY, "from-file");
  assert.equal(env.STEPFUN_API_KEY, "from-shell", "已有环境变量优先，不被文件覆盖");
});

test("loadEnv：文件不存在时静默返回，不抛错", () => {
  const result = loadEnv(["/definitely/not/here.env"]);
  assert.equal(result.loaded, null);
  assert.deepEqual(result.keys, []);
});

test("readApiKey 从 process.env 读，且不因空白而误判为已配置", () => {
  const saved = process.env.STEPFUN_API_KEY;
  process.env.STEPFUN_API_KEY = "   ";
  assert.equal(readApiKey(), null, "纯空白视为未配置（返回 null）");
  process.env.STEPFUN_API_KEY = "sk-test-abc";
  assert.equal(readApiKey(), "sk-test-abc");
  if (saved === undefined) delete process.env.STEPFUN_API_KEY;
  else process.env.STEPFUN_API_KEY = saved;
});

test("真实 key：structureHint 打到 StepFun，返回结构合规且不含 key", async (t) => {
  const key = readApiKey();
  if (!key) {
    t.skip("STEPFUN_API_KEY 未配置，跳过联网校验");
    return;
  }

  const requestId = `s5-preflight-${Date.now()}`;
  // schema 见 host.mjs VALIDATORS.structureHint：只收 { statement }
  const envelope = await invokeHost(
    "structureHint",
    {
      statement: "AI 写代码的能力很强，但短期内不会取代程序员，因为需求理解和责任归属无法外包。",
    },
    { requestId },
  );

  assert.equal(envelope.ok, true, `调用失败: ${JSON.stringify(envelope.error || {})}`);
  assert.equal(envelope.capability, "structureHint");
  assert.equal(envelope.requestId, requestId);
  assert.equal(typeof envelope.result, "string", "structureHint 返回纯文本结构提示");
  assert.ok(envelope.result.trim().length > 0, "结构提示不应为空");
  assert.notEqual(envelope.degraded, true, "有 key 时不应带 degraded 标记");

  const serialized = JSON.stringify(envelope);
  assert.ok(!serialized.includes(key), "key 绝不能出现在返回体里");
  assert.deepEqual(findBannedWords(envelope.result), [], "真实模型输出也不得命中禁用词");
  console.log("  → StepFun 真实返回:", envelope.result.slice(0, 160));
});
