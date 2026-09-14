/**
 * 服务端集成测试（node --test）
 *
 * 真起一个 HTTP+WS 服务（随机端口），用真实 socket 连接：
 *  - /api/health、/api/topics 真实数据、/api/host/* 降级标记
 *  - WS 两个客户端开房 → 各占一席 → 广播快照
 *  - 席位令牌重连回原席位
 *  - 房间满了拒第三个
 *  - 用户发言命中禁用词 → CONTENT_REJECTED
 */

import assert from "node:assert/strict";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import test, { after, before } from "node:test";

import { createServer } from "../server.mjs";
import { OPCODE, FrameParser, encodeFrame } from "../lib/ws.mjs";

let ctx;
let baseUrl;
let wsPort;

/** 一个极简 WS 客户端：自己握手、自己组帧、自己解析 */
class TestWsClient {
  constructor(port, query = "") {
    this.port = port;
    this.query = query;
    this.messages = [];
    this.waiters = [];
    this.closed = false;
    this.parser = new FrameParser();
  }

  connect() {
    return new Promise((resolve, reject) => {
      const key = Buffer.from("0123456789abcdef").toString("base64");
      this.socket = net.connect(this.port, "127.0.0.1", () => {
        this.socket.write(
          [
            `GET /ws/room${this.query} HTTP/1.1`,
            `Host: 127.0.0.1:${this.port}`,
            "Upgrade: websocket",
            "Connection: Upgrade",
            `Sec-WebSocket-Key: ${key}`,
            "Sec-WebSocket-Version: 13",
            "\r\n",
          ].join("\r\n"),
        );
      });
      let handshake = "";
      const onData = (chunk) => {
        handshake += chunk.toString("latin1");
        if (!handshake.includes("\r\n\r\n")) return;
        if (!/101/.test(handshake.split("\r\n")[0])) {
          reject(new Error(`handshake failed: ${handshake.split("\r\n")[0]}`));
          return;
        }
        this.socket.off("data", onData);
        this.socket.on("data", (c) => this.#onFrames(c));
        resolve(this);
      };
      this.socket.on("data", onData);
      this.socket.on("error", reject);
    });
  }

  #onFrames(chunk) {
    for (const frame of this.parser.push(chunk)) {
      if (frame.opcode === OPCODE.TEXT) {
        const parsed = JSON.parse(frame.text);
        this.messages.push(parsed);
        // 只移除被满足的 waiter——不满足的继续等后续帧
        for (let i = this.waiters.length - 1; i >= 0; i -= 1) {
          if (this.waiters[i](parsed)) this.waiters.splice(i, 1);
        }
      }
      if (frame.opcode === OPCODE.CLOSE) this.closed = true;
    }
  }

  send(obj) {
    // 客户端帧必须带掩码
    const payload = Buffer.from(JSON.stringify(obj), "utf8");
    const mask = Buffer.from([1, 2, 3, 4]);
    for (let i = 0; i < payload.length; i += 1) payload[i] ^= mask[i % 4];
    let header;
    if (payload.length < 126) {
      header = Buffer.alloc(2);
      header[1] = 0x80 | payload.length;
    } else {
      header = Buffer.alloc(4);
      header[1] = 0x80 | 126;
      header.writeUInt16BE(payload.length, 2);
    }
    header[0] = 0x80 | OPCODE.TEXT;
    this.socket.write(Buffer.concat([header, mask, payload]));
  }

  /** 等一条满足条件的消息（含已收到的）。不满足条件的消息不会吃掉等待。 */
  waitFor(predicate, { timeout = 3000 } = {}) {
    const found = this.messages.find(predicate);
    if (found) {
      return Promise.resolve(found);
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.waiters.indexOf(check);
        if (idx >= 0) this.waiters.splice(idx, 1);
        reject(new Error(`waitFor timeout; got: ${JSON.stringify(this.messages).slice(0, 500)}`));
      }, timeout);
      const check = (msg) => {
        if (!predicate(msg)) return false;
        clearTimeout(timer);
        resolve(msg);
        return true;
      };
      this.waiters.push(check);
    });
  }

  close() {
    if (this.socket && !this.socket.destroyed) this.socket.destroy();
  }
}

before(async () => {
  const storeDir = await fs.mkdtemp(path.join(os.tmpdir(), "zhengming-rooms-"));
  ctx = await createServer({ port: 0, storeDir });
  await new Promise((resolve) => ctx.server.listen(0, "127.0.0.1", resolve));
  wsPort = ctx.server.address().port;
  baseUrl = `http://127.0.0.1:${wsPort}`;
});

after(async () => {
  await ctx.close();
});

/* ─────────── HTTP ─────────── */

test("GET /api/health 只报有无 key，不下发 key", async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  assert.equal(typeof body.host.configured, "boolean");
  assert.equal(body.host.capabilities.length, 7);
  assert.equal(JSON.stringify(body).includes("STEPFUN_API_KEY"), false);
});

test("GET /api/topics 返回真实议题，保留 author/voteUp/url（provenance 红线）", async () => {
  const res = await fetch(`${baseUrl}/api/topics`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(body.total > 0, "应能读到 research/controversy-map/claims.json");
  const paired = body.topics[0];
  assert.equal(paired.paired, true, "成对议题应排在最前");
  for (const sideKey of ["pro", "con"]) {
    const claim = paired[sideKey];
    assert.ok(claim.author, "必须保留真实作者");
    assert.ok(typeof claim.voteUp === "number");
    assert.match(claim.url, /^https:\/\/www\.zhihu\.com\//);
  }
});

test("POST /api/host/structureHint 无 key 时返回 degraded 标记", async () => {
  const res = await fetch(`${baseUrl}/api/host/structureHint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statement: "43 岁该辞职去苏州", requestId: "http-t-1" }),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  if (!process.env.STEPFUN_API_KEY) {
    assert.equal(body.degraded, true, "无 key 时必须明示降级");
  }
  assert.equal(typeof body.result, "string");
});

test("POST /api/host/unknown 返回 404 + CAPABILITY_NOT_FOUND", async () => {
  const res = await fetch(`${baseUrl}/api/host/unknown`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.error.code, "CAPABILITY_NOT_FOUND");
});

test("POST /api/host/structureHint 入参不合 schema → 400 VALIDATION", async () => {
  const res = await fetch(`${baseUrl}/api/host/structureHint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statement: "" }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, "VALIDATION");
});

test("POST /api/rooms 建房，GET /api/rooms/:id 可回读", async () => {
  const create = await fetch(`${baseUrl}/api/rooms`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  const created = await create.json();
  assert.equal(create.status, 201);
  assert.ok(created.roomId);
  const read = await fetch(`${baseUrl}/api/rooms/${created.roomId}`);
  const snapshot = await read.json();
  assert.equal(snapshot.ok, true);
  assert.equal(snapshot.state.roomId, created.roomId);
  assert.equal(snapshot.state.phase, "waiting");
});

test("GET 不存在的房间 → 404", async () => {
  const res = await fetch(`${baseUrl}/api/rooms/room-does-not-exist`);
  assert.equal(res.status, 404);
});

/* ─────────── WebSocket ─────────── */

test("两个客户端开房各占一席，快照广播给双方", async () => {
  const a = await new TestWsClient(wsPort, "?roomId=ws-t-1").connect();
  const b = await new TestWsClient(wsPort, "?roomId=ws-t-1").connect();

  a.send({ type: "join", roomId: "ws-t-1", name: "正方" });
  const joinedA = await a.waitFor((m) => m.type === "joined");
  assert.equal(joinedA.side, "pro");
  assert.equal(joinedA.resumed, false);
  assert.ok(joinedA.seatToken);

  b.send({ type: "join", roomId: "ws-t-1", side: "con", name: "反方" });
  const joinedB = await b.waitFor((m) => m.type === "joined");
  assert.equal(joinedB.side, "con");
  assert.notEqual(joinedA.seatToken, joinedB.seatToken);

  const stateA = await a.waitFor((m) => m.type === "state" && m.state.seats.con?.name);
  assert.ok(stateA.state.seats.pro.name);
  assert.ok(stateA.state.seats.con.name);
  assert.equal(stateA.state.topic?.paired, true, "房间应绑定成对的真实议题");

  a.close();
  b.close();
});

test("席位令牌重连回原席位，不从池里新占", async () => {
  const a = await new TestWsClient(wsPort, "?roomId=ws-t-2").connect();
  a.send({ type: "join", roomId: "ws-t-2", name: "甲" });
  const joined = await a.waitFor((m) => m.type === "joined");
  a.close();
  await new Promise((r) => setTimeout(r, 80));

  const again = await new TestWsClient(wsPort, "?roomId=ws-t-2").connect();
  again.send({ type: "join", roomId: "ws-t-2", seatToken: joined.seatToken });
  const rejoined = await again.waitFor((m) => m.type === "joined");
  assert.equal(rejoined.resumed, true);
  assert.equal(rejoined.side, joined.side);
  again.close();
});

test("第三个客户端加入 → ROOM_FULL", async () => {
  const a = await new TestWsClient(wsPort, "?roomId=ws-t-3").connect();
  const b = await new TestWsClient(wsPort, "?roomId=ws-t-3").connect();
  const c = await new TestWsClient(wsPort, "?roomId=ws-t-3").connect();
  a.send({ type: "join", roomId: "ws-t-3", side: "pro" });
  b.send({ type: "join", roomId: "ws-t-3", side: "con" });
  await a.waitFor((m) => m.type === "joined");
  await b.waitFor((m) => m.type === "joined");
  c.send({ type: "join", roomId: "ws-t-3" });
  const err = await c.waitFor((m) => m.type === "error");
  assert.equal(err.code, "ROOM_FULL");
  a.close();
  b.close();
  c.close();
});

test("未 join 就发 action → NOT_IN_ROOM", async () => {
  const c = await new TestWsClient(wsPort, "?roomId=ws-t-4").connect();
  c.send({ type: "action", roomId: "ws-t-4", action: { kind: "pickSide", side: "pro" } });
  const err = await c.waitFor((m) => m.type === "error");
  assert.equal(err.code, "NOT_IN_ROOM");
  c.close();
});

test("发言含判输赢词族 → CONTENT_REJECTED（用户输入同样受红线约束）", async () => {
  const a = await new TestWsClient(wsPort, "?roomId=ws-t-5").connect();
  a.send({ type: "join", roomId: "ws-t-5" });
  await a.waitFor((m) => m.type === "joined");
  a.send({ type: "action", roomId: "ws-t-5", action: { kind: "submitOpening", text: "你的论证有错误，这局我赢了" } });
  const err = await a.waitFor((m) => m.type === "error");
  assert.equal(err.code, "CONTENT_REJECTED");
  assert.match(err.message, /争鸣只记录分歧/);
  a.close();
});

test("非 JSON 帧 → 回 VALIDATION 错误而不崩连接", async () => {
  const c = await new TestWsClient(wsPort, "?roomId=ws-t-6").connect();
  c.socket.write(encodeFrame(OPCODE.TEXT, "这不是 JSON"));
  const err = await c.waitFor((m) => m.type === "error");
  assert.equal(err.code, "VALIDATION");
  c.close();
});
