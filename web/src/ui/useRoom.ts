/**
 * 辩论间 · React 接线层
 *
 * 把 `RoomClient` 接进 React 生命周期，并统一处理：
 *  - 服务端权威快照的整体替换（绝不做乐观更新，否则两窗口阶段会不一致）
 *  - 席位令牌的窗口隔离（sessionStorage 优先）
 *  - 卸载时断开（React 严格模式会 mount 两次，必须幂等）
 *
 * 本文件只做状态管道，不做规则判断——规则在 domain/ 与 debateRoomUi.ts。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { RoomClient, describeSocketError, readSeatToken, writeSeatToken } from "../domain/roomClient";
import type { HostTopic, MatchMode, MatchResponse, PlayableTopic, RoomAction, RoomState, SeatId } from "../types/debateRoom";
import { aggregateTopics, parseTopicsResponse } from "./debateRoomUi";

/* ═══════════════ 房间连接 ═══════════════ */

export type ConnectionState = "idle" | "connecting" | "open" | "closed";

export interface UseRoomOptions {
  roomId: string | null;
  side: SeatId | null;
  name: string;
  /** 传 false 时完全不建连（例如还在选边阶段） */
  enabled?: boolean;
}

export interface UseRoomResult {
  state: RoomState | null;
  mySide: SeatId | null;
  connection: ConnectionState;
  error: string | null;
  errorCode: string | null;
  aiThinking: boolean;
  /** 是否为重连回到原席位 */
  resumed: boolean;
  send: (action: RoomAction) => void;
  leave: () => void;
  clearError: () => void;
}

/** WS 地址：走 Vite dev server 的同源代理（vite.config.ts 里 forwarded 到 5300） */
export function roomSocketUrl(roomId: string): string {
  if (typeof window === "undefined") return "";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/room?roomId=${encodeURIComponent(roomId)}`;
}

export function useRoom({ roomId, side, name, enabled = true }: UseRoomOptions): UseRoomResult {
  const [state, setState] = useState<RoomState | null>(null);
  const [mySide, setMySide] = useState<SeatId | null>(side);
  const [connection, setConnection] = useState<ConnectionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [resumed, setResumed] = useState(false);
  const clientRef = useRef<RoomClient | null>(null);

  // side 变化时同步到本地席位（选边后立刻生效，不必等 joined 回来）
  useEffect(() => {
    if (side) setMySide(side);
  }, [side]);

  useEffect(() => {
    if (!enabled || !roomId) {
      setConnection("idle");
      return;
    }
    setConnection("connecting");
    setError(null);
    setErrorCode(null);
    setAiThinking(false);

    const client = new RoomClient({
      url: roomSocketUrl(roomId),
      onOpen: () => setConnection("open"),
      onState: (next) => setState(next),
      onJoined: (info) => {
        setMySide(info.side);
        setResumed(info.resumed);
      },
      onEvent: (event) => {
        if (event.kind === "aiThinking") setAiThinking(event.active === true);
      },
      onError: (message, code) => {
        setError(message);
        setErrorCode(code);
      },
      onClose: () => {
        setConnection("closed");
        setAiThinking(false);
      },
    });
    clientRef.current = client;
    client.connect({ roomId, side: side ?? undefined, name });

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
    // side 不进依赖：入席后换边不是正常流程（PRD：选边在撮合阶段完成，房间内不做立场变更）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, name, enabled]);

  const send = useCallback((action: RoomAction) => {
    clientRef.current?.sendAction(action);
  }, []);

  const leave = useCallback(() => {
    clientRef.current?.sendAction({ kind: "leave" });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);

  return useMemo(
    () => ({ state, mySide, connection, error, errorCode, aiThinking, resumed, send, leave, clearError }),
    [state, mySide, connection, error, errorCode, aiThinking, resumed, send, leave, clearError],
  );
}

/* ═══════════════ 议题列表 ═══════════════ */

export interface UseTopicsResult {
  topics: PlayableTopic[];
  loading: boolean;
  error: string | null;
  /** 服务端是否配了 LLM key（false 时界面明示「模拟」） */
  hostConfigured: boolean | null;
  reload: () => void;
}

/** 拉取 `/api/topics`（Vite 代理到 zhengming-server） */
export function useTopics(): UseTopicsResult {
  const [topics, setTopics] = useState<PlayableTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hostConfigured, setHostConfigured] = useState<boolean | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [topicsResponse, healthResponse] = await Promise.all([
          fetch("/api/topics"),
          fetch("/api/health").catch(() => null),
        ]);
        const payload = await topicsResponse.json();
        if (cancelled) return;
        const list = parseTopicsResponse(payload);
        setTopics(aggregateTopics(list as HostTopic[]));

        if (healthResponse?.ok) {
          const health = await healthResponse.json().catch(() => null);
          if (!cancelled && health?.host) setHostConfigured(health.host.configured === true);
        }
      } catch {
        if (!cancelled) {
          setError(describeSocketError("CONNECT_FAILED"));
          setTopics([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { topics, loading, error, hostConfigured, reload };
}

/* ═══════════════ 建房 ═══════════════ */

export interface CreateRoomResult {
  roomId: string;
  topic: unknown;
}

/**
 * 建房并占席。
 *
 * 房间 id 由服务端派发（`POST /api/rooms`）。选边信息通过 WS `join` 的 `side` 传入，
 * **不在这里传**——房间的席位由 WS 入席动作决定，HTTP 建房只负责分配 id 与绑定议题。
 */
export async function createRoom(topicId?: string): Promise<CreateRoomResult> {
  const response = await fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(topicId ? { topicId } : {}),
  });
  if (!response.ok) {
    throw new Error(describeSocketError("CONNECT_FAILED"));
  }
  const payload = await response.json();
  if (!payload?.ok || typeof payload.roomId !== "string") {
    throw new Error(describeSocketError("INTERNAL"));
  }
  return { roomId: payload.roomId, topic: payload.room };
}

/**
 * 进入服务端权威撮合：真人模式加入候选池，AI 模式立即预留 Bot 对手。
 * seatToken 在 WS 建连前写入 sessionStorage，避免 HTTP→WS 之间被其它窗口抢席。
 */
export async function createMatch({
  topicId,
  side,
  mode,
  name,
  profile = null,
}: {
  topicId: string;
  side: SeatId;
  mode: MatchMode;
  name: string;
  profile?: number[] | null;
}): Promise<MatchResponse> {
  const response = await fetch("/api/matches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topicId, side, mode, name, profile }),
  });
  const payload = await response.json().catch(() => null);
  const validPayload =
    payload?.ok === true &&
    typeof payload.roomId === "string" &&
    typeof payload.seatToken === "string" &&
    (payload.side === "pro" || payload.side === "con") &&
    (payload.mode === "human" || payload.mode === "ai") &&
    (payload.status === "waiting" || payload.status === "matched") &&
    typeof payload.reason === "string";
  if (!response.ok || !validPayload) {
    throw new Error(payload?.error?.message || describeSocketError("CONNECT_FAILED"));
  }
  writeSeatToken(payload.roomId, payload.seatToken);
  return payload as MatchResponse;
}

export { readSeatToken, writeSeatToken };
