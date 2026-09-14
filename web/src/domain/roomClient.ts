/**
 * 辩论间 · 前端桥接层（纯逻辑 + 一层薄 WS 封装）
 *
 * 设计纪律：
 *  - **服务端权威**：客户端只发动作，收到 `state` 就整体替换本地状态，绝不做乐观更新
 *    （乐观更新会让两个窗口显示不同的阶段）。
 *  - 本模块不 import React，便于单测；UI 层用 `useRoom` 包一层。
 *  - 所有错误文案**不得含判输赢词族**（产品红线，测试守门）。
 *
 * 席位令牌的窗口隔离（ROLLOUT §1 约束 3）：
 *   同一浏览器多标签页共用 localStorage，令牌会撞车。
 *   因此 **sessionStorage 优先**（每个窗口独立），localStorage 仅作跨窗口兜底。
 *   真人对局演示用「一个正常窗口 + 一个隐身窗口」——两个 sessionStorage 互相看不见。
 */

import type { RoomAction, RoomState, SeatId } from "../types/debateRoom";

/** 与服务端契约一致的禁用词表（前端提前拦一道，避免无谓往返） */
export const BANNED_WORDS = ["错误", "谬误", "偷换", "输赢", "对错", "你错了", "赢了"] as const;

export const SEAT_TOKEN_PREFIX = "zhengming.room.seat.";

/** 检查文本是否命中禁用词；返回命中的词 */
export function findBannedWords(text: string): string[] {
  return BANNED_WORDS.filter((word) => text.includes(word));
}

/* ═══════════════ 席位令牌存取 ═══════════════ */

function safeGet(store: Storage | undefined, key: string): string | null {
  try {
    return store?.getItem(key) ?? null;
  } catch {
    // 隐私模式 / 存储被禁用：读不到就当没有，不能让界面崩
    return null;
  }
}

function safeSet(store: Storage | undefined, key: string, value: string): void {
  try {
    store?.setItem(key, value);
  } catch {
    /* 写不进就算了：重连会退化为新入席，不影响本局 */
  }
}

function safeRemove(store: Storage | undefined, key: string): void {
  try {
    store?.removeItem(key);
  } catch {
    /* 存储不可用时无需继续恢复；UI 仍会返回匹配页 */
  }
}

/**
 * 读席位令牌：**sessionStorage 优先**（本窗口），localStorage 兜底（跨窗口）。
 */
export function readSeatToken(roomId: string): string | null {
  const key = `${SEAT_TOKEN_PREFIX}${roomId}`;
  if (typeof window === "undefined") return null;
  return safeGet(window.sessionStorage, key) ?? safeGet(window.localStorage, key);
}

/** 写席位令牌：写 sessionStorage，**不写 localStorage**（避免污染其它窗口的席位） */
export function writeSeatToken(roomId: string, token: string): void {
  if (typeof window === "undefined") return;
  safeSet(window.sessionStorage, `${SEAT_TOKEN_PREFIX}${roomId}`, token);
}

/** 清理失效席位令牌；同时移除旧版本可能遗留在 localStorage 的副本。 */
export function forgetSeatToken(roomId: string): void {
  if (typeof window === "undefined") return;
  const key = `${SEAT_TOKEN_PREFIX}${roomId}`;
  safeRemove(window.sessionStorage, key);
  safeRemove(window.localStorage, key);
}

/* ═══════════════ 上行消息 ═══════════════ */

export interface JoinParams {
  roomId: string;
  side?: SeatId;
  name?: string;
  seatToken?: string | null;
}

export function buildJoinMessage({ roomId, side, name, seatToken }: JoinParams): Record<string, unknown> {
  const message: Record<string, unknown> = { type: "join", roomId };
  if (side) message.side = side;
  if (name) message.name = name;
  // 不带 seatToken 表示「新入席占位」；带了表示「重连回原席位」
  if (seatToken) message.seatToken = seatToken;
  return message;
}

export function buildActionMessage(action: RoomAction): { type: "action"; action: RoomAction } {
  return { type: "action", action };
}

/* ═══════════════ 下行消息 ═══════════════ */

export type ServerMessage =
  | { kind: "joined"; roomId: string; side: SeatId; seatToken: string; resumed: boolean }
  | { kind: "state"; state: RoomState }
  | { kind: "event"; event: { kind: string; side?: SeatId; active?: boolean; at?: string } }
  | { kind: "error"; code: string; message: string }
  | { kind: "unknown"; raw: string };

/**
 * 解析服务端消息。非法 / 未知消息一律回落 `unknown`，**不抛错**——
 * 服务端将来新增消息类型时，老客户端不该崩。
 */
export function parseServerMessage(raw: string): ServerMessage {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { kind: "unknown", raw };
  }
  if (!parsed || typeof parsed !== "object") return { kind: "unknown", raw };
  const message = parsed as Record<string, unknown>;

  switch (message.type) {
    case "joined": {
      if (typeof message.roomId !== "string" || typeof message.seatToken !== "string") {
        return { kind: "unknown", raw };
      }
      const side = message.side === "con" ? "con" : "pro";
      return {
        kind: "joined",
        roomId: message.roomId,
        side,
        seatToken: message.seatToken,
        resumed: message.resumed === true,
      };
    }
    case "state": {
      // 没带 state 的 state 消息是坏消息：宁可当未知，也不要半吊子快照
      if (!message.state || typeof message.state !== "object") return { kind: "unknown", raw };
      return { kind: "state", state: message.state as RoomState };
    }
    case "event": {
      if (!message.event || typeof message.event !== "object") return { kind: "unknown", raw };
      return { kind: "event", event: message.event as { kind: string; side?: SeatId; active?: boolean; at?: string } };
    }
    case "error": {
      return {
        kind: "error",
        code: typeof message.code === "string" ? message.code : "UNKNOWN",
        message: typeof message.message === "string" ? message.message : "",
      };
    }
    default:
      return { kind: "unknown", raw };
  }
}

/* ═══════════════ 错误文案 ═══════════════ */

/**
 * 错误码 → 中文文案。
 * 服务端给了 message 就优先用它（领域层的报错更精准，比如「继续追问每方限 1 次」）。
 *
 * 注意：以下文案**不得出现判输赢词族**——测试逐个词扫描。
 */
const ERROR_TEXT: Record<string, string> = {
  ROOM_FULL: "这个房间的两个席位都满了——另开一间，或让对方发邀请链接给你。",
  SIDE_TAKEN: "你选择的立场已被预留，请返回后重新选择。",
  INVALID_SEAT_TOKEN: "席位凭证已失效，请返回后重新进入匹配。",
  NOT_IN_ROOM: "还没进入房间：请先从辩论间入口入席。",
  NOT_YOUR_TURN: "还没轮到你动作——等对方提交后这里会自动解锁。",
  WRONG_PHASE: "当前阶段不接受这个动作。",
  PRESS_LIMIT: "继续追问每方限 1 次，你已经用过了。",
  FREE_LIMIT: "自由对辩每方 1 次，你已发言过。",
  REVISION_REQUIRED: "选了「修正」就要写出修正后的表述——原表述的痕迹会保留。",
  TARGET_NOT_FOUND: "对方立论结构里没有这条，换一条发问。",
  MULTIPLE_QUESTIONS: "一次只问一个问题——不许打包追问。",
  // 注意：文案本身也不能出现禁用词字面——连"不判定对错"这种否定句也算命中。
  // 契约的禁用词是**字面扫描**，因此这里改用「只记录分歧」的表达方式。
  CONTENT_REJECTED: "发言里出现了平台不接受的表述。争鸣只记录分歧、不评判立场，请换一种说法。",
  ROOM_SETTLED: "本局已结束——点「再来一局」开新的一局。",
  ROOM_NOT_FOUND: "找不到这个房间——可能是服务端重启过，请重新开局。",
  PAYLOAD_TOO_LARGE: "内容太长了，请精简后重发。",
  TIMEOUT: "Host 响应超时——可以重试，本局状态没受影响。",
  UPSTREAM: "Host 上游暂时不可用——已保留本局状态，稍后重试。",
  VALIDATION: "提交的内容不符合这一阶段的格式要求。",
  DOMAIN_MODULE_MISSING: "服务端未加载辩论规则模块——请先运行 web/ 的 build:domain。",
  CONNECT_FAILED: "连不上辩论服务——请确认 zhengming-server 已启动。",
  DISCONNECTED: "与辩论服务的连接断了——刷新页面可回到你的席位。",
  INTERNAL: "服务端出错了，本局状态未受影响。",
  UNKNOWN: "出现了未预期的问题，请重试。",
};

export function describeSocketError(code: string, serverMessage?: string): string {
  if (serverMessage && serverMessage.trim()) return serverMessage.trim();
  // 回落分支也要过红线：先前写成「（错误码 …）」，而禁用词是**字面**扫描，
  // 于是这个兜底文案自己就把「错误」二字送到了界面上。
  return ERROR_TEXT[code] ?? `${ERROR_TEXT.UNKNOWN}（代码 ${code}）`;
}

/* ═══════════════ 展示辅助 ═══════════════ */

/** 席位标签：立场标签，不是优劣标签 */
export function seatLabel(side: SeatId): string {
  return side === "pro" ? "正方" : "反方";
}

/** Host 是否处于降级（启发式）——UI 必须据此明示「模拟」 */
export function isHostDegraded(state: RoomState | null | undefined): boolean {
  return state?.host?.degraded === true;
}

/* ═══════════════ WS 封装 ═══════════════ */

/** 只用到 WebSocket 的一小部分能力，抽成接口便于测试替身 */
export interface SocketLike {
  readyState: number;
  send(data: string): void;
  close(): void;
  addEventListener(type: string, handler: (event: unknown) => void): void;
}

export interface RoomClientOptions {
  url: string;
  socketFactory?: (url: string) => SocketLike;
  onState?: (state: RoomState) => void;
  onJoined?: (info: { roomId: string; side: SeatId; seatToken: string; resumed: boolean }) => void;
  onEvent?: (event: { kind: string; side?: SeatId; active?: boolean; at?: string }) => void;
  onError?: (message: string, code: string) => void;
  onClose?: () => void;
  onOpen?: () => void;
}

const WS_OPEN = 1;

/**
 * 房间连接客户端。
 *
 * 用法：
 *   const client = new RoomClient({ url, onState, onError });
 *   client.connect({ roomId, side, name });
 *   client.sendAction({ kind: "submitBrief", brief });
 *   client.disconnect();   // 卸载时务必调用
 */
export class RoomClient {
  private socket: SocketLike | null = null;
  private disposed = false;
  private currentRoomId: string | null = null;

  constructor(private readonly options: RoomClientOptions) {}

  /** 建连并入席。若本地有该房间的席位令牌，自动带上（重连回原席位）。 */
  connect(params: JoinParams): void {
    this.disposed = false;
    const factory = this.options.socketFactory ?? ((url: string) => new WebSocket(url) as unknown as SocketLike);
    const socket = factory(this.options.url);
    this.socket = socket;
    this.currentRoomId = params.roomId;

    socket.addEventListener("open", () => {
      if (this.disposed) return;
      this.options.onOpen?.();
      const seatToken = params.seatToken ?? readSeatToken(params.roomId);
      socket.send(JSON.stringify(buildJoinMessage({ ...params, seatToken })));
    });

    socket.addEventListener("message", (event) => {
      if (this.disposed) return;
      const data = (event as { data?: unknown })?.data;
      if (typeof data !== "string") return;
      const message = parseServerMessage(data);
      if (message.kind === "state") {
        this.options.onState?.(message.state);
      } else if (message.kind === "joined") {
        // 服务端下发的令牌是权威的（可能是派发的新令牌，也可能是重连后刷新过的）
        writeSeatToken(message.roomId, message.seatToken);
        this.options.onJoined?.({
          roomId: message.roomId,
          side: message.side,
          seatToken: message.seatToken,
          resumed: message.resumed,
        });
      } else if (message.kind === "event") {
        this.options.onEvent?.(message.event);
      } else if (message.kind === "error") {
        this.options.onError?.(describeSocketError(message.code, message.message), message.code);
      }
    });

    socket.addEventListener("error", () => {
      if (this.disposed) return;
      this.options.onError?.(describeSocketError("CONNECT_FAILED"), "CONNECT_FAILED");
    });

    socket.addEventListener("close", () => {
      if (this.disposed) return;
      this.options.onClose?.();
    });
  }

  /** 下发一个动作。连接未就绪时静默丢弃——UI 层应当据此禁用按钮。 */
  sendAction(action: RoomAction): void {
    if (this.disposed || !this.socket || this.socket.readyState !== WS_OPEN) return;
    this.socket.send(JSON.stringify(buildActionMessage(action)));
  }

  /** 已连接并可发消息 */
  get isReady(): boolean {
    return !this.disposed && this.socket?.readyState === WS_OPEN;
  }

  get roomId(): string | null {
    return this.currentRoomId;
  }

  /** 断开。可重入（React 严格模式下会调两次）。 */
  disconnect(): void {
    this.disposed = true;
    const socket = this.socket;
    this.socket = null;
    this.currentRoomId = null;
    try {
      socket?.close();
    } catch {
      /* 已经断了 */
    }
  }
}
