/**
 * 事件推演 · Host 能力调用（前端侧 seam）
 *
 * 三条硬边界，任何实现都必须守住：
 *
 * 1. **只调服务端 `/api/host/*`，绝不直接调 StepFun**——key 只在服务端（契约 §0.2）。
 * 2. **隔离**：`actAdvance` / `replayEnding` 的请求体里**不得出现 canon / 真实人物真名**。
 *    沉浸式下模型本来就不需要原作，所以这是天然属性；但必须**可断言**，
 *    因此请求体由纯函数 `buildAdvancePayload` 统一构造，测试直接对该函数做 spy 断言。
 * 3. **降级必须显式**：服务端无 key 时会返回 `degraded:true`，界面据此明示「模拟」，
 *    绝不静默假装是真实模型输出（契约 §0.4）。
 *
 * 流式：契约 D4 规定 `actAdvance` / `replayEnding` 走流式。服务端尚未启用 SSE 转发，
 * 所以这里按「有流就读流、没流就一次性到达」处理——**一次性到达时把完整文本作为单个增量
 * 交给渲染**，而不是伪造逐字动画。
 */

import type {
  Act,
  ActAdvanceResult,
  CanonEntry,
  ComposedEventScaffold,
  ComposeParams,
  EndingCard,
  EventHeader,
  Ledger,
  LedgerEntry,
  PlayedAct,
  Position,
  RelationEntry,
} from "../../types/eventReplay";
import { LEDGER_KEYS, LEDGER_KEY_LABELS, positionName } from "../../domain/eventReplay";

export interface HostCallResult<T> {
  ok: boolean;
  result: T | null;
  /** true 表示走的是服务端启发式降级，界面必须明示「模拟」 */
  degraded: boolean;
  error?: string;
}

export interface AdvanceParams {
  header: EventHeader;
  position: Position;
  /**
   * 该事件的全部角色位。
   *
   * 契约 §0.7 的关系条目用**角色位名**作为 `target`（模型更容易对齐），
   * 而内部态度表以 id 为键，故构造请求体时必须有整表做映射。
   */
  positions: Position[];
  acts: Act[];
  actIndex: number;
  ledger: Ledger;
  relations: Record<string, number>;
  history: PlayedAct[];
  /** null 表示开局：此刻还没有任何决定 */
  chosenMoveId: string | null;
}

export interface EndingParams {
  position: Position;
  positions: Position[];
  history: PlayedAct[];
  ledger: Ledger;
  relations: Record<string, number>;
}

export interface StreamHandlers {
  /** 叙事增量：边到边渲染。收不到增量时调用方只需处理最终结果。 */
  onDelta?: (text: string) => void;
}

export interface EventReplayClient {
  advance(params: AdvanceParams, handlers?: StreamHandlers): Promise<HostCallResult<ActAdvanceResult>>;
  ending(params: EndingParams, handlers?: StreamHandlers): Promise<HostCallResult<EndingCard>>;
  /** 独立通道：推演期间绝不调用，只有终局玩家主动展开时才请求 */
  canon(eventId: string): Promise<HostCallResult<CanonEntry[]>>;
  /** 能力 9：把主题/时间线改写成事件脚本（契约 §0.8）。一次性 JSON，不走流。 */
  compose(params: ComposeParams): Promise<HostCallResult<ComposedEventScaffold>>;
}

/* ────────── 累加态 → 契约 §0.7 的条目列表 ────────── */

/**
 * 账本累加态 → `LedgerEntry[]`（契约 §0.7）。
 *
 * 只放非零维度（零维度不携带信息，白占提示词）；`key` 用中文维度名，
 * 模型因此倾向于沿用同一组词，回参归一化的命中率显著更高。
 */
export function ledgerToEntries(ledger: Ledger): LedgerEntry[] {
  return LEDGER_KEYS.filter((key) => Number(ledger[key]) !== 0).map((key) => ({
    key: LEDGER_KEY_LABELS[key],
    value: Number(ledger[key]) || 0,
  }));
}

/** 态度累加态 → `RelationEntry[]`（契约 §0.7）。`target` 用角色位名，同样只放非零项。 */
export function relationsToEntries(
  relations: Record<string, number>,
  positions: Position[],
): RelationEntry[] {
  return Object.entries(relations)
    .filter(([, value]) => Number(value) !== 0)
    .map(([positionId, value]) => ({
      target: positionName(positionId, positions),
      value: Number(value) || 0,
    }));
}

/** 角色位按契约 §0.7 的字段序列化（白名单，不放种子数据里的额外字段）。 */
function serializePosition(position: Position): Record<string, unknown> {
  return {
    id: position.id,
    name: position.name,
    role: position.role ?? "",
    stake: position.stake,
    visible: position.visible,
    resources: position.resources,
    canDo: position.canDo,
  };
}

/**
 * 构造 `actAdvance` 请求体。
 *
 * **纯函数 + 白名单字段**：不是"删掉 canon"，而是"只放该放的"——
 * 这样即便日后给 `EventReplay` 加了新字段，也不会被动地漏进请求体。
 */
export function buildAdvancePayload(params: AdvanceParams): Record<string, unknown> {
  const { header, position, positions, acts, actIndex, ledger, relations, history, chosenMoveId } =
    params;
  return {
    header: {
      id: header.id,
      title: header.title,
      background: header.background,
      endingCondition: header.endingCondition,
    },
    position: serializePosition(position),
    acts: acts.map((act) => ({ index: act.index, month: act.month, text: act.text })),
    actIndex,
    ledger: ledgerToEntries(ledger),
    relations: relationsToEntries(relations, positions),
    history: history.map((item) => ({
      actIndex: item.actIndex,
      month: acts[item.actIndex]?.month ?? "",
      moveId: item.moveId,
      moveText: item.moveText,
      moveLabel: item.moveLabel,
      outcome: item.outcome,
    })),
    chosenMoveId,
  };
}

/** 构造 `replayEnding` 请求体（同为白名单）。 */
export function buildEndingPayload(params: EndingParams): Record<string, unknown> {
  const { position, positions, history, ledger, relations } = params;
  return {
    position: serializePosition(position),
    history: history.map((item) => ({ moveText: item.moveText, outcome: item.outcome })),
    ledger: ledgerToEntries(ledger),
    relations: relationsToEntries(relations, positions),
  };
}

/** 构造 `replayCompose` 请求体（同为白名单；契约 §0.8）。 */
export function buildComposePayload(params: ComposeParams): Record<string, unknown> {
  return {
    topic: String(params.topic ?? "").trim(),
    timeline: (Array.isArray(params.timeline) ? params.timeline : [])
      .map((item) => String(item ?? "").trim())
      .filter(Boolean),
    actCount: Math.max(2, Math.min(5, Math.round(Number(params.actCount) || 3))),
  };
}

/** 递归找出请求体里所有 canon 相关的键——隔离断言的实现。 */
export function findCanonKeys(value: unknown, hits: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item) => findCanonKeys(item, hits));
    return hits;
  }
  if (value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
      const normalized = key.toLowerCase();
      if (normalized.includes("canon") || normalized.includes("realchoice")) hits.push(key);
      findCanonKeys(child, hits);
    });
  }
  return hits;
}

export interface HttpClientOptions {
  /** 默认同源；dev server 会把 /api 代理到 zhengming-server */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

function describeError(code: string | undefined, message: string | undefined): string {
  // 服务端会为领域性拒收写**中文**原因（如 compose 的准入底线）；优先透出
  const cjkMessage = typeof message === "string" && /[\u4e00-\u9fff]/.test(message) ? message.trim() : "";
  switch (code) {
    case "TIMEOUT":
      return cjkMessage || "模型响应超时";
    case "UPSTREAM":
      return cjkMessage || "模型服务暂时不可用";
    case "CONTENT_REJECTED":
      return cjkMessage || "生成内容未通过合规校验";
    case "PAYLOAD_TOO_LARGE":
      return cjkMessage || "请求内容过大";
    case "VALIDATION":
      return cjkMessage || "请求参数不合法";
    default:
      return cjkMessage || message || "这一步暂时无法推进";
  }
}

interface Envelope<T> {
  ok?: boolean;
  result?: T;
  degraded?: boolean;
  error?: { code?: string; message?: string };
}

export function createHttpEventReplayClient(options: HttpClientOptions = {}): EventReplayClient {
  const base = options.baseUrl ?? "";
  const doFetch = options.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));

  async function call<T>(
    capability: string,
    payload: Record<string, unknown>,
    handlers?: StreamHandlers,
  ): Promise<HostCallResult<T>> {
    const requestId = `web-${capability}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      const response = await doFetch(`${base}/api/host/${capability}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, requestId }),
      });

      const contentType = response.headers?.get?.("content-type") ?? "";
      const isStream = /text\/event-stream|x-ndjson/.test(contentType);
      if (isStream && response.body) {
        return (await readStream<T>(response.body, handlers)) as HostCallResult<T>;
      }

      const envelope = (await response.json().catch(() => null)) as Envelope<T> | null;
      if (!envelope) {
        return { ok: false, result: null, degraded: false, error: describeError(undefined, undefined) };
      }
      if (envelope.ok === false) {
        return {
          ok: false,
          result: null,
          degraded: false,
          error: describeError(envelope.error?.code, envelope.error?.message),
        };
      }
      // 非流式到达：把完整叙事文本作为**单个增量**交给渲染，不伪造逐字动画
      const result = (envelope.result ?? null) as T | null;
      if (handlers?.onDelta && result && typeof result === "object" && "outcome" in result) {
        handlers.onDelta(String((result as { outcome?: string }).outcome ?? ""));
      }
      return { ok: true, result, degraded: envelope.degraded === true };
    } catch {
      return { ok: false, result: null, degraded: false, error: "连接不上服务端" };
    }
  }

  return {
    advance: (params, handlers) => call<ActAdvanceResult>("actAdvance", buildAdvancePayload(params), handlers),
    ending: (params, handlers) => call<EndingCard>("replayEnding", buildEndingPayload(params), handlers),
    canon: (eventId) => call<CanonEntry[]>("replayCanon", { eventId }),
    compose: (params) => call<ComposedEventScaffold>("replayCompose", buildComposePayload(params)),
  };
}

/**
 * 读流：累积文本增量，流结束后解析完整 JSON。
 *
 * 中断（`reader.read()` 抛错）一律视为失败——**不把半截输出当结果**，
 * 由调用方转入失败态并整幕重试。
 */
async function readStream<T>(
  body: ReadableStream<Uint8Array>,
  handlers?: StreamHandlers,
): Promise<HostCallResult<T>> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      // NDJSON / SSE：逐行取增量文本
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) return;
        const data = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed;
        if (!data || data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data) as { delta?: string; text?: string };
          const delta = parsed.delta ?? parsed.text ?? "";
          if (delta) handlers?.onDelta?.(delta);
        } catch {
          handlers?.onDelta?.(data);
        }
      });
    }
    return { ok: true, result: JSON.parse(buffer.trim()) as T, degraded: false };
  } catch {
    return { ok: false, result: null, degraded: false, error: "这一步暂时无法推进" };
  }
}
