/**
 * 争鸣 · Host 八能力实现（StepFun 上游）
 *
 * 职责（对齐 host-contract.md v1.2）：
 *  1. 参数 schema 校验（不过即 VALIDATION）
 *  2. StepFun 调用（key 只从 process.env.STEPFUN_API_KEY 读，不落盘、不进日志、不下发）
 *  3. 禁用词表校验（命中 → 重试 1 次 → 仍命中则 CONTENT_REJECTED）
 *  4. 幂等：同 requestId 直接返回缓存结果，不二次计费
 *  5. 降级：无 key 时走启发式，响应带 degraded:true（绝不静默假装是真实模型输出）
 *
 * 本文件不包含任何 HTTP 服务器逻辑——纯能力层，便于单测。
 */

import {
  CAPABILITIES,
  ERROR_CODES,
  ERROR_MESSAGES,
  GENERATION_TIMEOUT_MS,
  HostError,
  MAX_PAYLOAD_BYTES,
  REQUEST_TIMEOUT_MS,
  STEPFUN,
  STRUCTURED_CAPABILITIES,
  charCount,
  findBannedWords,
  isSingleQuestion,
} from "./contract.mjs";
import {
  PROMPTS,
  heuristicActAdvance,
  heuristicEvaluate,
  heuristicMakeQuestion,
  heuristicOpponentTurn,
  heuristicReplayCanon,
  heuristicReplayEnding,
  heuristicStructureHint,
  heuristicTerminalProbes,
} from "./prompts.mjs";

/* ═══════════════════ 入参校验 ═══════════════════ */

function requireString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new HostError(ERROR_CODES.VALIDATION, `${field} must be a non-empty string`);
  }
  return value.trim();
}

function requireArray(value, field) {
  if (!Array.isArray(value)) {
    throw new HostError(ERROR_CODES.VALIDATION, `${field} must be an array`);
  }
  return value;
}

/**
 * 契约 §9 隔离硬约束：能力 6/7 的调用参数序列化后不得含 canon / realChoice / 真实人物真名。
 * 这里用递归键名扫描实现——键名命中即拒（值里出现史实关键词同理）。
 */
const ISOLATION_KEYS = ["canon", "realchoice", "realpath", "truehistory", "史实", "真实历史", "真实结局"];
const ISOLATION_TEXT_PATTERNS = [/真实历史/, /史实上/, /历史上其实/, /现实中最终/];

export function assertIsolation(payload) {
  const hits = new Set();
  const walk = (node) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === "object") {
      for (const [key, value] of Object.entries(node)) {
        if (ISOLATION_KEYS.includes(String(key).toLowerCase())) hits.add(key);
        walk(value);
      }
      return;
    }
    if (typeof node === "string") {
      ISOLATION_TEXT_PATTERNS.forEach((re) => {
        if (re.test(node)) hits.add("史实相关文本");
      });
    }
  };
  walk(payload);
  if (hits.size) {
    throw new HostError(
      ERROR_CODES.VALIDATION,
      `isolation breach: payload must not contain ${Array.from(hits).join(", ")}`,
    );
  }
}

/** 各能力的入参校验器：返回规格化后的入参 */
const VALIDATORS = {
  opponentTurn(params) {
    const phase = requireString(params.phase, "phase");
    if (!["opening", "crossAsk", "crossAnswer", "crossReact", "free", "closing"].includes(phase)) {
      throw new HostError(ERROR_CODES.VALIDATION, "phase is not actionable by an AI seat");
    }
    return {
      phase,
      side: params.side === "con" ? "con" : "pro",
      topic: params.topic ?? {},
      presetClaim: typeof params.presetClaim === "string" ? params.presetClaim : "",
      ownBrief: params.ownBrief ?? null,
      opponentBrief: params.opponentBrief ?? null,
      transcript: requireArray(params.transcript ?? [], "transcript"),
      crossRecords: requireArray(params.crossRecords ?? [], "crossRecords"),
    };
  },
  structureHint(params) {
    return { statement: requireString(params.statement, "statement") };
  },
  makeQuestion(params) {
    const targetClaim = params.targetClaim;
    if (!targetClaim || typeof targetClaim !== "object") {
      throw new HostError(ERROR_CODES.VALIDATION, "targetClaim must be an object with label and text");
    }
    return {
      targetClaim: {
        label: requireString(targetClaim.label, "targetClaim.label"),
        text: requireString(targetClaim.text, "targetClaim.text"),
      },
      history: params.history === undefined ? [] : requireArray(params.history, "history"),
    };
  },
  evaluate(params) {
    const transcript = requireArray(params.transcript, "transcript");
    if (!transcript.length) {
      throw new HostError(ERROR_CODES.VALIDATION, "transcript must contain at least one turn");
    }
    return { transcript };
  },
  terminalProbes(params) {
    // 隔离扫描跑在**原始 params** 上：规格化只保留白名单字段会漏掉非法键
    assertIsolation(params);
    return {
      position: params.position ?? null,
      history: requireArray(params.history ?? [], "history"),
      ledger: requireArray(params.ledger ?? [], "ledger"),
      relations: requireArray(params.relations ?? [], "relations"),
    };
  },
  actAdvance(params) {
    assertIsolation(params);
    return {
      header: params.header ?? {},
      position: params.position ?? {},
      acts: requireArray(params.acts ?? [], "acts"),
      actIndex: Number.isInteger(params.actIndex) ? params.actIndex : 0,
      ledger: requireArray(params.ledger ?? [], "ledger"),
      relations: requireArray(params.relations ?? [], "relations"),
      history: requireArray(params.history ?? [], "history"),
      chosenMoveId: typeof params.chosenMoveId === "string" ? params.chosenMoveId : null,
    };
  },
  replayEnding(params) {
    assertIsolation(params);
    return {
      position: params.position ?? null,
      history: requireArray(params.history ?? [], "history"),
      ledger: requireArray(params.ledger ?? [], "ledger"),
      relations: requireArray(params.relations ?? [], "relations"),
    };
  },
  replayCanon(params) {
    return { eventId: requireString(params.eventId, "eventId") };
  },
};

/* ═══════════════════ 结构校验（模型返回必须过 schema） ═══════════════════ */

/** 清洗模型输出里的 ```json 围栏 */
export function stripCodeFence(text) {
  const t = String(text ?? "").trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return m ? m[1].trim() : t;
}

function parseJsonOrFail(raw) {
  try {
    return JSON.parse(stripCodeFence(raw));
  } catch {
    throw new HostError(ERROR_CODES.CONTENT_REJECTED, "model output is not valid JSON");
  }
}

const DIM_NAMES = ["立论", "论据", "逻辑", "回应", "表达", "规范"];

/** 各能力的返回结构校验器：不合规即抛 CONTENT_REJECTED（触发重试） */
const RESULT_CHECKS = {
  opponentTurn(result) {
    const obj = typeof result === "string" ? parseJsonOrFail(result) : result;
    const action = obj?.action;
    const allowed = ["submitBrief", "submitOpening", "ask", "answer", "react", "freeSpeak", "submitClosing"];
    if (!action || typeof action !== "object" || !allowed.includes(action.kind)) {
      throw new HostError(ERROR_CODES.CONTENT_REJECTED, "opponentTurn must contain one allowed action");
    }
    if (action.kind === "ask" && !isSingleQuestion(action.question)) {
      throw new HostError(ERROR_CODES.CONTENT_REJECTED, "opponentTurn ask must contain exactly one question");
    }
    return { action };
  },
  structureHint(result) {
    const text = String(result ?? "").trim();
    if (!text) throw new HostError(ERROR_CODES.CONTENT_REJECTED, "structureHint returned empty text");
    if (charCount(text) > 90) {
      throw new HostError(ERROR_CODES.CONTENT_REJECTED, "structureHint exceeds 60 chars by too much");
    }
    return text;
  },
  makeQuestion(result) {
    const text = String(result ?? "").trim();
    if (!isSingleQuestion(text)) {
      throw new HostError(ERROR_CODES.CONTENT_REJECTED, "makeQuestion must return exactly one question");
    }
    if (charCount(text) > 75) {
      throw new HostError(ERROR_CODES.CONTENT_REJECTED, "makeQuestion exceeds 50 chars by too much");
    }
    return text;
  },
  evaluate(result) {
    const obj = typeof result === "string" ? parseJsonOrFail(result) : result;
    if (!obj || typeof obj !== "object" || !obj.dims) {
      throw new HostError(ERROR_CODES.CONTENT_REJECTED, "evaluate result must contain dims");
    }
    const dims = {};
    for (const name of DIM_NAMES) {
      const v = Number(obj.dims[name]);
      if (!Number.isFinite(v)) {
        throw new HostError(ERROR_CODES.CONTENT_REJECTED, `evaluate.dims.${name} is not a number`);
      }
      dims[name] = Math.max(0, Math.min(100, Math.round(v)));
    }
    const total = Math.round(DIM_NAMES.reduce((sum, n) => sum + dims[n], 0) / DIM_NAMES.length);
    const grounds = Array.isArray(obj.grounds)
      ? obj.grounds
          .filter((g) => g && typeof g.dim === "string")
          .map((g) => ({
            dim: String(g.dim),
            quote: String(g.quote ?? ""),
            reason: String(g.reason ?? ""),
          }))
      : [];
    return {
      dims,
      total,
      grounds,
      verdict: typeof obj.verdict === "string" ? obj.verdict : "本评估仅衡量论证结构与辩论规范，不构成胜负判定。",
    };
  },
  terminalProbes(result) {
    const arr = typeof result === "string" ? parseJsonOrFail(result) : result;
    if (!Array.isArray(arr) || arr.length !== 2) {
      throw new HostError(ERROR_CODES.CONTENT_REJECTED, "terminalProbes must return exactly two questions");
    }
    return arr.map((q) => String(q).trim());
  },
  actAdvance(result) {
    const obj = typeof result === "string" ? parseJsonOrFail(result) : result;
    if (!obj || typeof obj !== "object") {
      throw new HostError(ERROR_CODES.CONTENT_REJECTED, "actAdvance result must be an object");
    }
    const moves = Array.isArray(obj.moves) ? obj.moves : [];
    if (moves.length < 2 || moves.length > 3) {
      throw new HostError(ERROR_CODES.CONTENT_REJECTED, "actAdvance.moves must contain 2 or 3 items");
    }
    if (typeof obj.outcome !== "string" || !obj.outcome.trim()) {
      throw new HostError(ERROR_CODES.CONTENT_REJECTED, "actAdvance.outcome must be a non-empty string");
    }
    const scene = obj.nextScene && typeof obj.nextScene === "object" ? obj.nextScene : {};
    const visibleFacts = Array.isArray(scene.visibleFacts) ? scene.visibleFacts.map(String) : [];
    return {
      outcome: obj.outcome.trim(),
      nextScene: {
        month: String(scene.month ?? ""),
        text: String(scene.text ?? ""),
        visibleFacts,
      },
      moves: moves.map((m, i) => ({
        id: String(m.id ?? `m${i + 1}`),
        text: String(m.text ?? ""),
        costHint: String(m.costHint ?? ""),
        implicitAssumption: String(m.implicitAssumption ?? ""),
        label: String(m.label ?? ""),
      })),
      relationDeltas: Array.isArray(obj.relationDeltas)
        ? obj.relationDeltas.map((d) => ({ target: String(d.target ?? ""), delta: Number(d.delta) || 0 }))
        : [],
      ledgerDeltas: Array.isArray(obj.ledgerDeltas)
        ? obj.ledgerDeltas.map((d) => ({
            key: String(d.key ?? ""),
            delta: Number(d.delta) || 0,
            note: String(d.note ?? ""),
          }))
        : [],
      atEnding: Boolean(obj.atEnding),
    };
  },
  replayEnding(result) {
    const obj = typeof result === "string" ? parseJsonOrFail(result) : result;
    if (!obj || typeof obj !== "object" || typeof obj.text !== "string" || !obj.text.trim()) {
      throw new HostError(ERROR_CODES.CONTENT_REJECTED, "replayEnding.text must be a non-empty string");
    }
    const title = String(obj.title ?? "终局").trim();
    if (charCount(title) > 20) {
      throw new HostError(ERROR_CODES.CONTENT_REJECTED, "replayEnding.title is too long");
    }
    return { title: title || "终局", text: obj.text.trim() };
  },
  replayCanon(result) {
    const obj = typeof result === "string" ? parseJsonOrFail(result) : result;
    const list = obj && Array.isArray(obj.canon) ? obj.canon : [];
    const canon = list
      .filter((c) => c && typeof c.development === "string")
      .map((c) => ({
        actIndex: Number.isInteger(c.actIndex) ? c.actIndex : 0,
        month: String(c.month ?? ""),
        development: String(c.development).trim(),
        sources: (Array.isArray(c.sources) ? c.sources : [])
          .filter((s) => typeof s?.url === "string" && /^https:\/\//.test(s.url))
          .map((s) => ({ url: s.url, reviewedAt: String(s.reviewedAt ?? "") })),
      }))
      // 契约 §7：给不出可靠 https 来源的条目直接丢弃，不伪造
      .filter((c) => c.sources.length > 0);
    return { canon };
  },
};

/* ═══════════════════ StepFun 调用 ═══════════════════ */

/** 从环境变量读 key；只读内存，不落盘 */
export function readApiKey(env = process.env) {
  const key = env.STEPFUN_API_KEY;
  return typeof key === "string" && key.trim() ? key.trim() : null;
}

/** 调用 StepFun（OpenAI 兼容）。失败抛 UPSTREAM / TIMEOUT。 */
async function callStepFun({ system, user, temperature }, { capability, fetchImpl = fetch, apiKey, timeoutMs = REQUEST_TIMEOUT_MS }) {
  const body = {
    model: STEPFUN.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: temperature ?? STEPFUN.defaultTemperature,
  };
  if (STRUCTURED_CAPABILITIES.includes(capability)) {
    body.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetchImpl(STEPFUN.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new HostError(ERROR_CODES.TIMEOUT, `upstream did not respond within ${timeoutMs}ms`);
    }
    throw new HostError(ERROR_CODES.UPSTREAM, `upstream request failed: ${error?.message || error}`);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    // 注意：不把 response body 直接透出，避免上游报错里回显 Authorization 相关信息
    throw new HostError(ERROR_CODES.UPSTREAM, `upstream returned HTTP ${response.status}`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new HostError(ERROR_CODES.UPSTREAM, "upstream returned non-JSON body");
  }
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new HostError(ERROR_CODES.UPSTREAM, "upstream returned empty content");
  }
  return content;
}

/* ═══════════════════ 能力派发 ═══════════════════ */

/** 按能力生成 prompt + 降级实现 */
const IMPLEMENTATIONS = {
  opponentTurn: {
    prompt: (p) => PROMPTS.opponentTurn(p),
    fallback: (p) => heuristicOpponentTurn(p),
  },
  structureHint: {
    prompt: (p) => PROMPTS.structureHint(p.statement),
    fallback: (p) => heuristicStructureHint(p.statement),
  },
  makeQuestion: {
    prompt: (p) => PROMPTS.makeQuestion(p.targetClaim, p.history),
    fallback: (p) => heuristicMakeQuestion(p.targetClaim),
  },
  evaluate: {
    prompt: (p) => PROMPTS.evaluate(p.transcript),
    fallback: (p) => heuristicEvaluate(p.transcript),
  },
  terminalProbes: {
    prompt: (p) => PROMPTS.terminalProbes(p.history, p.ledger, p.relations),
    fallback: (p) => heuristicTerminalProbes(p.history, p.ledger),
  },
  actAdvance: {
    prompt: (p) => PROMPTS.actAdvance(p.header, p.position, p.acts, p.actIndex, p.ledger, p.relations, p.history, p.chosenMoveId),
    fallback: (p) => heuristicActAdvance(p.header, p.position, p.acts, p.actIndex),
  },
  replayEnding: {
    prompt: (p) => PROMPTS.replayEnding(p.position, p.history, p.ledger, p.relations),
    fallback: (p) => heuristicReplayEnding(p.position, p.history, p.ledger),
  },
  replayCanon: {
    prompt: (p) => PROMPTS.replayCanon(p.eventId),
    fallback: () => heuristicReplayCanon(),
  },
};

/** 幂等缓存：requestId → 已完成结果（无 TTL 清理，进程生命周期内有效） */
const idempotencyCache = new Map();

export function clearIdempotencyCache() {
  idempotencyCache.clear();
}

export function idempotencyCacheSize() {
  return idempotencyCache.size;
}

/**
 * 调用一个 Host 能力。
 *
 * @param {string} capability 能力机器名（CAPABILITIES 之一）
 * @param {object} params 能力入参
 * @param {object} [options]
 * @param {string} [options.requestId] 幂等键
 * @param {string|null} [options.apiKey] 显式注入 key（默认从 env 读；传 null 强制降级，测试用）
 * @param {Function} [options.fetchImpl] 注入 fetch（测试用）
 * @param {number} [options.timeoutMs]
 * @returns {Promise<object>} 统一信封：{ok, capability, requestId, result} 或 {ok:false, error}
 */
export async function invokeHost(capability, params = {}, options = {}) {
  const requestId = typeof options.requestId === "string" && options.requestId.trim() ? options.requestId.trim() : `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // 契约 §0.1 请求体上限
  const payloadSize = Buffer.byteLength(JSON.stringify(params ?? {}), "utf8");
  if (payloadSize > MAX_PAYLOAD_BYTES) {
    return {
      ok: false,
      error: { code: ERROR_CODES.PAYLOAD_TOO_LARGE, message: `payload is ${payloadSize} bytes`, requestId },
    };
  }

  if (!CAPABILITIES.includes(capability)) {
    return {
      ok: false,
      error: { code: ERROR_CODES.CAPABILITY_NOT_FOUND, message: `unknown capability: ${capability}`, requestId },
    };
  }

  // 契约 §0.2 幂等：同 requestId 直接回缓存，不二次调用模型
  const cacheKey = `${capability}::${requestId}`;
  if (idempotencyCache.has(cacheKey)) {
    return idempotencyCache.get(cacheKey);
  }

  const impl = IMPLEMENTATIONS[capability];

  let normalized;
  try {
    normalized = VALIDATORS[capability](params ?? {});
  } catch (error) {
    const envelope = {
      ok: false,
      error: {
        code: error instanceof HostError ? error.code : ERROR_CODES.VALIDATION,
        message: error?.message || ERROR_MESSAGES[ERROR_CODES.VALIDATION],
        requestId,
      },
    };
    idempotencyCache.set(cacheKey, envelope);
    return envelope;
  }

  const key = options.apiKey === undefined ? readApiKey() : options.apiKey;
  let lastError = null;

  // 无 key → 降级（明确标记，不静默）
  if (!key) {
    try {
      const result = impl.fallback(normalized);
      const envelope = {
        ok: true,
        capability,
        requestId,
        result,
        degraded: true,
        degradedReason: "STEPFUN_API_KEY is not set on the server",
      };
      idempotencyCache.set(cacheKey, envelope);
      return envelope;
    } catch (error) {
      return {
        ok: false,
        error: { code: ERROR_CODES.UPSTREAM, message: `fallback failed: ${error?.message}`, requestId },
      };
    }
  }

  // 有 key → 真实调用，禁用词/结构不合规时重试 1 次（契约 §0.5）
  const MAX_ATTEMPTS = 2;
  // 契约 §0.1 超时分级：生成式长文本能力（事件推演）放宽到 90s
  const timeoutMs = capability === "actAdvance" || capability === "replayEnding"
    ? GENERATION_TIMEOUT_MS
    : REQUEST_TIMEOUT_MS;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const prompt = impl.prompt(normalized);
      const raw = await callStepFun(prompt, { ...options, capability, apiKey: key, timeoutMs });
      const result = RESULT_CHECKS[capability](raw);

      const hits = findBannedWords(result);
      if (hits.length) {
        throw new HostError(ERROR_CODES.CONTENT_REJECTED, `banned words found: ${hits.join(",")}`);
      }

      const envelope = { ok: true, capability, requestId, result };
      idempotencyCache.set(cacheKey, envelope);
      return envelope;
    } catch (error) {
      lastError = error instanceof HostError ? error : new HostError(ERROR_CODES.UPSTREAM, String(error?.message || error));
      // VALIDATION / TIMEOUT / UPSTREAM 不重试，只对 CONTENT_REJECTED 重试一次
      if (lastError.code !== ERROR_CODES.CONTENT_REJECTED || attempt === MAX_ATTEMPTS) break;
    }
  }

  return {
    ok: false,
    error: {
      code: lastError?.code || ERROR_CODES.UPSTREAM,
      message: lastError?.message || "host invocation failed",
      requestId,
    },
  };
}
