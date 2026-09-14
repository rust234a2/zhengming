/**
 * 争鸣 · Host 契约常量与通用工具
 *
 * 对齐 docs/design/host-contract.md v1.2：
 *  - 统一信封 {ok, capability, requestId, result} / {ok:false, error:{code,message,requestId}}
 *  - 错误码枚举 6 个
 *  - 禁用词表（硬约束，产品红线「不判输赢 / 追问权替代验证权」的契约落点）
 *  - StepFun（阶跃星辰，OpenAI 兼容）参数基线
 */

/** 契约 §0.1 错误码枚举 */
export const ERROR_CODES = Object.freeze({
  VALIDATION: "VALIDATION",
  CAPABILITY_NOT_FOUND: "CAPABILITY_NOT_FOUND",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  TIMEOUT: "TIMEOUT",
  UPSTREAM: "UPSTREAM",
  CONTENT_REJECTED: "CONTENT_REJECTED",
});

export const ERROR_MESSAGES = Object.freeze({
  VALIDATION: "request payload does not match capability schema",
  CAPABILITY_NOT_FOUND: "unknown host capability",
  PAYLOAD_TOO_LARGE: "request payload exceeds 256KB",
  TIMEOUT: "upstream model call timed out",
  UPSTREAM: "upstream model returned an error",
  CONTENT_REJECTED: "generated text violated the banned-word list or structure check",
});

/** 契约 §0.5 禁用词表（硬约束，命中即 CONTENT_REJECTED） */
export const BANNED_WORDS = Object.freeze([
  "错误",
  "谬误",
  "偷换",
  "输赢",
  "对错",
  "你错了",
  "赢了",
]);

/** 契约 §0.3 模型参数基线（StepFun，OpenAI 兼容） */
export const STEPFUN = Object.freeze({
  endpoint: "https://api.stepfun.com/v1/chat/completions",
  model: "step-3.7-flash",
  defaultTemperature: 0.5,
  structuredTemperature: 0.3,
});

/** 契约 §0.1 请求体上限 / 超时 */
export const MAX_PAYLOAD_BYTES = 256 * 1024;
export const REQUEST_TIMEOUT_MS = 30_000;
/**
 * 生成式长文本能力的超时（契约 §0.1 分级）。
 *
 * 真机实测（2026-09-14）：actAdvance 单幕生成 P50 ≈ 26s，带 history 的中后幕
 * 普遍越过 30s——30s 阈值下 TIMEOUT 是高频事件而不是兜底。事件推演的
 * actAdvance / replayEnding 按生成类放宽到 90s，其余能力维持 30s。
 */
export const GENERATION_TIMEOUT_MS = 90_000;

/** Host 能力机器名；opponentTurn 专用于明确选择的 AI 对辩席位。 */
export const CAPABILITIES = Object.freeze([
  "structureHint",
  "makeQuestion",
  "evaluate",
  "opponentTurn",
  "terminalProbes",
  "actAdvance",
  "replayEnding",
  "replayCanon",
]);

/** 需要 response_format: json_object 的能力（契约 §0.3） */
export const STRUCTURED_CAPABILITIES = Object.freeze([
  "evaluate",
  "opponentTurn",
  "terminalProbes",
  "actAdvance",
  "replayEnding",
  "replayCanon",
]);

/** 流式能力（契约 §0.4，本期服务端未启用 SSE 转发，保留标记供后续接入） */
export const STREAMING_CAPABILITIES = Object.freeze(["actAdvance", "replayEnding"]);

/**
 * 契约 §0.5：禁用词检查。返回命中的词数组（空数组表示通过）。
 * 对嵌套结构递归收集全部字符串字段——含数组与对象，避免漏检。
 */
export function findBannedWords(value, hits = []) {
  if (typeof value === "string") {
    for (const word of BANNED_WORDS) {
      if (value.includes(word) && !hits.includes(word)) hits.push(word);
    }
    return hits;
  }
  if (Array.isArray(value)) {
    for (const item of value) findBannedWords(item, hits);
    return hits;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) findBannedWords(item, hits);
    return hits;
  }
  return hits;
}

/** 中文字数（按 Unicode 码点计，代理对算 1 个） */
export function charCount(text) {
  return Array.from(String(text ?? "")).length;
}

/** 是否为单条问句：以中文或英文问号结尾，且句中不出现第二个问号（禁打包追问） */
export function isSingleQuestion(text) {
  const t = String(text ?? "").trim();
  if (!/[?？]$/.test(t)) return false;
  const marks = t.match(/[?？]/g);
  return marks ? marks.length === 1 : false;
}

/** 统一的错误对象构造（用于内部抛出，被信封层捕获后成型） */
export class HostError extends Error {
  constructor(code, message) {
    super(message || ERROR_MESSAGES[code] || code);
    this.name = "HostError";
    this.code = code;
  }
}

export function fail(code, message) {
  throw new HostError(code, message);
}
