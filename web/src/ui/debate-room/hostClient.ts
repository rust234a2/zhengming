/**
 * Host 能力调用（前端侧）
 *
 * 只调服务端 `/api/host/*`，**绝不直接调 StepFun**（key 只在服务端）。
 *
 * 降级处理：服务端无 key 时响应带 `degraded:true`，本模块把它标记出来，
 * UI 必须据此明示「模拟」——绝不静默假装是真实模型输出（契约 §0.4）。
 */

import { describeSocketError } from "../../domain/roomClient";

export interface HostCallResult<T> {
  ok: boolean;
  result: T | null;
  /** true 表示走的是服务端启发式降级，界面必须明示「模拟」 */
  degraded: boolean;
  error?: string;
}

interface Envelope<T> {
  ok?: boolean;
  result?: T;
  degraded?: boolean;
  error?: { code?: string; message?: string };
}

async function callHost<T>(capability: string, params: Record<string, unknown>): Promise<HostCallResult<T>> {
  const requestId = `web-${capability}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    const response = await fetch(`/api/host/${capability}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...params, requestId }),
    });
    const envelope = (await response.json().catch(() => null)) as Envelope<T> | null;
    if (!envelope) {
      return { ok: false, result: null, degraded: false, error: describeSocketError("INTERNAL") };
    }
    if (envelope.ok === false) {
      return {
        ok: false,
        result: null,
        degraded: false,
        error: describeSocketError(envelope.error?.code ?? "INTERNAL", envelope.error?.message),
      };
    }
    return { ok: true, result: (envelope.result ?? null) as T | null, degraded: envelope.degraded === true };
  } catch {
    return { ok: false, result: null, degraded: false, error: describeSocketError("CONNECT_FAILED") };
  }
}

/**
 * 结构提示（能力 1）。
 * 契约：**只提示缺哪个要素，不代写可粘贴内容**。
 */
export function requestStructureHint(statement: string): Promise<HostCallResult<string>> {
  return callHost<string>("structureHint", { statement });
}

/**
 * 生成追问（能力 2）。
 * 契约：返回**恰好一个问句**（`isSingleQuestion`），打包追问会被服务端拒。
 */
export function requestMakeQuestion(
  targetClaim: { label: string; text: string },
  history: { role: string; text: string }[] = [],
): Promise<HostCallResult<string>> {
  return callHost<string>("makeQuestion", { targetClaim, history });
}
