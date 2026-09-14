/**
 * 辩论间 · 前端桥接层测试（TDD，S5）
 *
 * 被测对象是**纯逻辑**（不碰真实 WebSocket）：
 *  - 席位令牌在 sessionStorage 优先 / localStorage 兜底（ROLLOUT §1 约束 3）
 *  - 与服务端的消息编解码（join / action / leave 上行；state/event/error 下行）
 *  - 错误码 → 用户可读中文（错误文案不得含判输赢词族）
 *  - Host 降级标记的透传（前端必须能据此明示「模拟」）
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BANNED_WORDS,
  SEAT_TOKEN_PREFIX,
  SocketLike,
  buildJoinMessage,
  buildActionMessage,
  describeSocketError,
  isHostDegraded,
  parseServerMessage,
  readSeatToken,
  seatLabel,
  writeSeatToken,
  RoomClient,
} from "../src/domain/roomClient";
import type { RoomState } from "../src/types/debateRoom";
import { createRoomState } from "../src/domain/debateRoom";

/* ═══════════════ 测试替身 ═══════════════ */

/** 最小 RoomState 工厂：用领域层唯一构造入口，避免手写缺字段 */
function makeState(overrides: Partial<RoomState> = {}): RoomState {
  const base = createRoomState({
    roomId: "room-t",
    topic: {
      questionId: "q1",
      title: "测试议题",
      url: "https://www.zhihu.com/question/1",
      paired: true,
      pro: { id: "c1", claim: "正方论点", author: "甲", voteUp: 10, url: "https://www.zhihu.com/answer/1" },
      con: { id: "c2", claim: "反方论点", author: "乙", voteUp: 8, url: "https://www.zhihu.com/answer/2" },
    },
    now: "2026-09-14T00:00:00.000Z",
  });
  return { ...base, ...overrides };
}

/** 可控的假 WebSocket。注册 open 监听时立刻触发（真实 WS 是异步，语义等价）。 */
class FakeSocket implements SocketLike {
  static last: FakeSocket | null = null;
  readyState = 1;
  sent: string[] = [];
  listeners = new Map<string, ((event: unknown) => void)[]>();

  constructor(public url: string) {
    FakeSocket.last = this;
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = 3;
    this.emit("close", {});
  }

  addEventListener(type: string, handler: (event: unknown) => void): void {
    const list = this.listeners.get(type) ?? [];
    list.push(handler);
    this.listeners.set(type, list);
    // 模拟握手完成：一旦有人监听 open，就通知它（这样 connect() 会立刻发 join）
    if (type === "open") this.emit("open", {});
  }

  emit(type: string, event: unknown): void {
    (this.listeners.get(type) ?? []).forEach((handler) => handler(event));
  }

  /** 模拟服务端推一条消息 */
  push(payload: unknown): void {
    this.emit("message", { data: JSON.stringify(payload) });
  }

  get parsed(): unknown[] {
    return this.sent.map((raw) => JSON.parse(raw));
  }
}

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  FakeSocket.last = null;
});

/* ═══════════════ 令牌存取（窗口隔离） ═══════════════ */

describe("席位令牌存取", () => {
  it("写入后从 sessionStorage 读回（同窗口重连回原席位）", () => {
    writeSeatToken("room-1", "tok-a");
    expect(window.sessionStorage.getItem(`${SEAT_TOKEN_PREFIX}room-1`)).toBe("tok-a");
    expect(readSeatToken("room-1")).toBe("tok-a");
  });

  it("sessionStorage 为空时回落到 localStorage（跨窗口兜底）", () => {
    window.localStorage.setItem(`${SEAT_TOKEN_PREFIX}room-1`, "tok-fallback");
    expect(readSeatToken("room-1")).toBe("tok-fallback");
  });

  it("两处都有时 sessionStorage 优先（隐私窗口不撞车）", () => {
    window.sessionStorage.setItem(`${SEAT_TOKEN_PREFIX}room-1`, "tok-window");
    window.localStorage.setItem(`${SEAT_TOKEN_PREFIX}room-1`, "tok-shared");
    expect(readSeatToken("room-1")).toBe("tok-window");
  });

  it("无令牌返回 null，不同房间互不串号", () => {
    expect(readSeatToken("room-nope")).toBeNull();
    writeSeatToken("room-1", "tok-a");
    expect(readSeatToken("room-2")).toBeNull();
  });

  it("存储不可用（隐私模式抛错）时不崩，返回 null", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage disabled");
    });
    expect(() => readSeatToken("room-1")).not.toThrow();
    expect(readSeatToken("room-1")).toBeNull();
    spy.mockRestore();
  });
});

/* ═══════════════ 上行消息编码 ═══════════════ */

describe("上行消息编码", () => {
  it("join 带 roomId / side / name / seatToken", () => {
    const msg = buildJoinMessage({ roomId: "room-1", side: "pro", name: "我", seatToken: "tok-a" });
    expect(msg).toMatchObject({ type: "join", roomId: "room-1", side: "pro", name: "我", seatToken: "tok-a" });
  });

  it("join 不带 seatToken 时不含该字段（新入席而非重连）", () => {
    const msg = buildJoinMessage({ roomId: "room-1", side: "con", name: "我" });
    expect("seatToken" in msg).toBe(false);
  });

  it("action 包成 {type:'action', action}", () => {
    const msg = buildActionMessage({ kind: "answer", text: "我的回答" });
    expect(msg).toEqual({ type: "action", action: { kind: "answer", text: "我的回答" } });
  });

  it("join / action 都能序列化（WS 只传字符串）", () => {
    expect(() => JSON.stringify(buildJoinMessage({ roomId: "r", side: "pro", name: "我" }))).not.toThrow();
    expect(() => JSON.stringify(buildActionMessage({ kind: "leave" }))).not.toThrow();
  });
});

/* ═══════════════ 下行消息解码 ═══════════════ */

describe("下行消息解码", () => {
  it("state 消息解出权威快照", () => {
    const state = makeState();
    const parsed = parseServerMessage(JSON.stringify({ type: "state", roomId: "room-t", state }));
    expect(parsed).toEqual({ kind: "state", state });
  });

  it("joined 消息解出席位与令牌（重连标记透传）", () => {
    const parsed = parseServerMessage(
      JSON.stringify({ type: "joined", roomId: "room-t", side: "pro", seatToken: "tok", resumed: true }),
    );
    expect(parsed).toEqual({ kind: "joined", roomId: "room-t", side: "pro", seatToken: "tok", resumed: true });
  });

  it("event 消息解出轻量通知", () => {
    const parsed = parseServerMessage(
      JSON.stringify({ type: "event", roomId: "room-t", event: { kind: "seatLeft", side: "con", at: "t" } }),
    );
    expect(parsed).toMatchObject({ kind: "event", event: { kind: "seatLeft", side: "con" } });
  });

  it("error 消息解出错误码与文案", () => {
    const parsed = parseServerMessage(
      JSON.stringify({ type: "error", code: "ROOM_FULL", message: "房间已满" }),
    );
    expect(parsed).toEqual({ kind: "error", code: "ROOM_FULL", message: "房间已满" });
  });

  it("非法 JSON → 返回 unknown 而不抛错", () => {
    const parsed = parseServerMessage("{不是 JSON");
    expect(parsed.kind).toBe("unknown");
  });

  it("未知 type → unknown（向前兼容服务端新增消息）", () => {
    expect(parseServerMessage(JSON.stringify({ type: "who-knows" })).kind).toBe("unknown");
  });

  it("state 消息缺 state 字段 → unknown（不做半吊子解析）", () => {
    expect(parseServerMessage(JSON.stringify({ type: "state", roomId: "r" })).kind).toBe("unknown");
  });
});

/* ═══════════════ 错误文案 ═══════════════ */

describe("错误码文案", () => {
  it("已知错误码给出中文可读文案", () => {
    expect(describeSocketError("ROOM_FULL")).toContain("满");
    expect(describeSocketError("NOT_IN_ROOM")).toContain("房间");
    expect(describeSocketError("NOT_YOUR_TURN")).toContain("轮到");
    expect(describeSocketError("PRESS_LIMIT")).toContain("追问");
  });

  it("未知错误码回落为原码，不吞掉信息", () => {
    expect(describeSocketError("SOMETHING_NEW")).toContain("SOMETHING_NEW");
  });

  it("服务端给了 message 时优先用服务端文案（领域层文案更精准）", () => {
    expect(describeSocketError("WRONG_PHASE", "立论结构只能在①立论阶段提交。")).toBe(
      "立论结构只能在①立论阶段提交。",
    );
  });

  it("所有内置错误文案都不含判输赢词族（红线）", () => {
    const codes = [
      "ROOM_FULL",
      "NOT_IN_ROOM",
      "NOT_YOUR_TURN",
      "WRONG_PHASE",
      "PRESS_LIMIT",
      "FREE_LIMIT",
      "REVISION_REQUIRED",
      "TARGET_NOT_FOUND",
      "MULTIPLE_QUESTIONS",
      "CONTENT_REJECTED",
      "ROOM_SETTLED",
      "INTERNAL",
      "UNKNOWN",
    ];
    for (const code of codes) {
      const text = describeSocketError(code);
      for (const word of BANNED_WORDS) {
        expect(text, `${code} 的文案不得含「${word}」`).not.toContain(word);
      }
    }
  });
});

/* ═══════════════ 席位与降级展示 ═══════════════ */

describe("席位标签与 Host 降级", () => {
  it("席位标签是立场标签，不是优劣标签", () => {
    expect(seatLabel("pro")).toBe("正方");
    expect(seatLabel("con")).toBe("反方");
  });

  it("host.degraded 为真时判定为模拟", () => {
    expect(isHostDegraded(makeState({ host: { degraded: true, reason: "no key" } }))).toBe(true);
    expect(isHostDegraded(makeState({ host: { degraded: false } }))).toBe(false);
    expect(isHostDegraded(null)).toBe(false);
  });
});

/* ═══════════════ RoomClient 连接行为 ═══════════════ */

describe("RoomClient", () => {
  function makeClient(overrides: Partial<ConstructorParameters<typeof RoomClient>[0]> = {}) {
    const onState = vi.fn();
    const onError = vi.fn();
    const onJoined = vi.fn();
    const onEvent = vi.fn();
    const client = new RoomClient({
      url: "ws://127.0.0.1:5299/ws/room?roomId=room-t",
      socketFactory: (url) => new FakeSocket(url),
      onState,
      onError,
      onJoined,
      onEvent,
      ...overrides,
    });
    return { client, onState, onError, onJoined, onEvent };
  }

  it("connect 后用最新令牌入场，并把 joined 的令牌写回存储", () => {
    writeSeatToken("room-t", "tok-old");
    const { client, onJoined } = makeClient();
    client.connect({ roomId: "room-t", side: "pro", name: "我" });
    const socket = FakeSocket.last!;
    expect(socket.parsed[0]).toMatchObject({ type: "join", roomId: "room-t", seatToken: "tok-old" });

    socket.push({ type: "joined", roomId: "room-t", side: "pro", seatToken: "tok-new", resumed: false });
    expect(onJoined).toHaveBeenCalledTimes(1);
    expect(readSeatToken("room-t")).toBe("tok-new");
  });

  it("收到 state 消息时把快照交给 onState", () => {
    const { client, onState } = makeClient();
    client.connect({ roomId: "room-t", side: "pro", name: "我" });
    const state = makeState();
    FakeSocket.last!.push({ type: "state", roomId: "room-t", state });
    expect(onState).toHaveBeenCalledWith(state);
  });

  it("收到 error 消息时用中文文案回调 onError", () => {
    const { client, onError } = makeClient();
    client.connect({ roomId: "room-t", side: "pro", name: "我" });
    FakeSocket.last!.push({ type: "error", code: "NOT_YOUR_TURN", message: "还没轮到你提问。" });
    expect(onError).toHaveBeenCalledWith("还没轮到你提问。", "NOT_YOUR_TURN");
  });

  it("sendAction 只在连接就绪时下发", () => {
    const { client } = makeClient();
    client.connect({ roomId: "room-t", side: "pro", name: "我" });
    const socket = FakeSocket.last!;
    client.sendAction({ kind: "answer", text: "答" });
    expect(socket.parsed.at(-1)).toMatchObject({ type: "action", action: { kind: "answer" } });

    socket.readyState = 0; // CONNECTING
    const before = socket.sent.length;
    client.sendAction({ kind: "answer", text: "答 2" });
    expect(socket.sent.length, "未就绪时不下发").toBe(before);
  });

  it("disconnect 后不再接收回调（避免卸载后 setState）", () => {
    const { client, onState } = makeClient();
    client.connect({ roomId: "room-t", side: "pro", name: "我" });
    const socket = FakeSocket.last!;
    client.disconnect();
    socket.push({ type: "state", roomId: "room-t", state: makeState() });
    expect(onState).not.toHaveBeenCalled();
  });

  it("disconnect 是可重入的（卸载时调用两次不炸）", () => {
    const { client } = makeClient();
    client.connect({ roomId: "room-t", side: "pro", name: "我" });
    client.disconnect();
    expect(() => client.disconnect()).not.toThrow();
  });

  it("socket 报错时回调 onError 而不是抛出", () => {
    const { client, onError } = makeClient();
    client.connect({ roomId: "room-t", side: "pro", name: "我" });
    expect(() => FakeSocket.last!.emit("error", {})).not.toThrow();
    expect(onError).toHaveBeenCalled();
  });
});
