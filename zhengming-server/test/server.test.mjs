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

import { createServer, evaluateSettledRoom } from "../server.mjs";
import { invokeHost } from "../lib/host.mjs";
import { Room } from "../lib/room.mjs";
import { OPCODE, FrameParser, encodeFrame } from "../lib/ws.mjs";

let ctx;
let baseUrl;
let wsPort;

function encodeClientFrame(opcode, value = "") {
  const payload = Buffer.isBuffer(value) ? Buffer.from(value) : Buffer.from(value, "utf8");
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
  header[0] = 0x80 | opcode;
  return Buffer.concat([header, mask, payload]);
}

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
    this.socket.write(encodeClientFrame(OPCODE.TEXT, JSON.stringify(obj)));
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
        reject(new Error(`waitFor timeout; got: ${JSON.stringify(this.messages).slice(0, 1200)}`));
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
    if (this.socket && !this.socket.destroyed) {
      // 客户端控制帧同样必须带掩码；走协议关闭才能确定性触发服务端离席清理。
      this.socket.end(encodeClientFrame(OPCODE.CLOSE));
    }
  }
}

before(async () => {
  const storeDir = await fs.mkdtemp(path.join(os.tmpdir(), "zhengming-rooms-"));
  ctx = await createServer({
    port: 0,
    storeDir,
    // 普通 HTTP/WS 回归固定走无 Key 降级；真实联网只由 env.test.mjs 负责。
    hostInvoker: (capability, params, options) => invokeHost(capability, params, { ...options, apiKey: null }),
  });
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
  assert.equal(body.host.capabilities.length, 8);
  assert.ok(body.host.capabilities.includes("opponentTurn"));
  assert.equal(JSON.stringify(body).includes("STEPFUN_API_KEY"), false);
});

test("GET /api/topics 返回真实议题，保留 author/voteUp/url（provenance 红线）", async () => {
  const res = await fetch(`${baseUrl}/api/topics`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(body.total > 0, "应能读到 research/controversy-map/claims.json");
  assert.equal(
    body.topics.some((topic) => topic.questionId === "zh-1972252087044796716"),
    false,
    "预设结论后只追问原因的开放解释题不得进入辩论间议题",
  );
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

async function firstTopicId() {
  const response = await fetch(`${baseUrl}/api/topics?paired=1`);
  const body = await response.json();
  return body.topics[0].questionId;
}

async function requestMatch(mode, side, name) {
  const response = await fetch(`${baseUrl}/api/matches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topicId: await firstTopicId(), mode, side, name }),
  });
  assert.equal(response.status, 201);
  return response.json();
}

async function waitForRoomState(roomId, predicate, { timeout = 3000 } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const response = await fetch(`${baseUrl}/api/rooms/${roomId}`);
    const body = await response.json();
    if (body.ok && predicate(body.state)) return body.state;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`room ${roomId} did not reach expected state`);
}

test("真人匹配只撮合同议题相反立场的实际在线用户", async () => {
  const first = await requestMatch("human", "pro", "候选甲");
  assert.equal(first.status, "waiting");

  const a = await new TestWsClient(wsPort, `?roomId=${first.roomId}`).connect();
  a.send({ type: "join", roomId: first.roomId, seatToken: first.seatToken, name: "候选甲" });
  await a.waitFor((message) => message.type === "state" && message.state.seats.pro?.connected === true);

  const second = await requestMatch("human", "con", "候选乙");
  assert.equal(second.roomId, first.roomId);
  assert.equal(second.status, "matched");

  const b = await new TestWsClient(wsPort, `?roomId=${second.roomId}`).connect();
  b.send({ type: "join", roomId: second.roomId, seatToken: second.seatToken, name: "候选乙" });
  const opened = await a.waitFor((message) => message.type === "state" && message.state.phase === "opening");
  assert.equal(opened.state.match.mode, "human");
  assert.equal(opened.state.seats.pro.isBot, false);
  assert.equal(opened.state.seats.con.isBot, false);
  a.close();
  b.close();
});

test("真人预留但尚未建立 WS 的席位不进入候选池", async () => {
  const offline = await requestMatch("human", "pro", "尚未在线");
  const opposite = await requestMatch("human", "con", "反方请求者");
  assert.notEqual(opposite.roomId, offline.roomId);

  const online = await new TestWsClient(wsPort, `?roomId=${offline.roomId}`).connect();
  online.send({ type: "join", roomId: offline.roomId, seatToken: offline.seatToken, name: "已在线" });
  await online.waitFor((message) => message.type === "state" && message.state.seats.pro?.connected === true);

  const matched = await requestMatch("human", "con", "后来的反方");
  assert.equal(matched.roomId, offline.roomId);
  online.close();
});

test("预签 seatToken 保护指定席位，无效 token 不降级为新占席", async () => {
  const match = await requestMatch("human", "pro", "席位持有人");
  const intruder = await new TestWsClient(wsPort, `?roomId=${match.roomId}`).connect();

  intruder.send({ type: "join", roomId: match.roomId, side: "pro", name: "无令牌请求" });
  const reserved = await intruder.waitFor((message) => message.type === "error" && message.code === "SIDE_TAKEN");
  assert.equal(reserved.code, "SIDE_TAKEN");

  intruder.send({ type: "join", roomId: match.roomId, side: "con", seatToken: "not-a-real-token" });
  const invalid = await intruder.waitFor((message) => message.type === "error" && message.code === "INVALID_SEAT_TOKEN");
  assert.equal(invalid.code, "INVALID_SEAT_TOKEN");

  const owner = await new TestWsClient(wsPort, `?roomId=${match.roomId}`).connect();
  owner.send({ type: "join", roomId: match.roomId, seatToken: match.seatToken, name: "席位持有人" });
  const joined = await owner.waitFor((message) => message.type === "joined");
  assert.equal(joined.side, "pro");
  intruder.close();
  owner.close();
});

test("等待者断线后失去候选资格，持原 token 重连后恢复", async () => {
  const waiting = await requestMatch("human", "pro", "可重连候选");
  const first = await new TestWsClient(wsPort, `?roomId=${waiting.roomId}`).connect();
  first.send({ type: "join", roomId: waiting.roomId, seatToken: waiting.seatToken, name: "可重连候选" });
  await first.waitFor((message) => message.type === "state" && message.state.seats.pro?.connected === true);
  first.close();

  const disconnected = await waitForRoomState(
    waiting.roomId,
    (state) => state.phase === "waiting" && state.seats.pro?.connected === false,
  );
  assert.equal(disconnected.match.status, "waiting");

  const whileOffline = await requestMatch("human", "con", "离线期间请求者");
  assert.notEqual(whileOffline.roomId, waiting.roomId);

  const again = await new TestWsClient(wsPort, `?roomId=${waiting.roomId}`).connect();
  again.send({ type: "join", roomId: waiting.roomId, seatToken: waiting.seatToken, name: "可重连候选" });
  const resumed = await again.waitFor((message) => message.type === "joined");
  assert.equal(resumed.resumed, true);
  await again.waitFor((message) => message.type === "state" && message.state.seats.pro?.connected === true);

  const afterReconnect = await requestMatch("human", "con", "重连后的请求者");
  assert.equal(afterReconnect.roomId, waiting.roomId);
  again.close();
});

test("同 token 替换连接时，旧 socket 关闭不会移除新连接", async () => {
  const waiting = await requestMatch("human", "pro", "替换连接候选");
  const oldClient = await new TestWsClient(wsPort, `?roomId=${waiting.roomId}`).connect();
  oldClient.send({ type: "join", roomId: waiting.roomId, seatToken: waiting.seatToken });
  await oldClient.waitFor((message) => message.type === "joined");

  const newClient = await new TestWsClient(wsPort, `?roomId=${waiting.roomId}`).connect();
  newClient.send({ type: "join", roomId: waiting.roomId, seatToken: waiting.seatToken });
  const rejoined = await newClient.waitFor((message) => message.type === "joined");
  assert.equal(rejoined.resumed, true);
  await new Promise((resolve) => setTimeout(resolve, 50));

  const state = await waitForRoomState(waiting.roomId, (snapshot) => snapshot.seats.pro?.connected === true);
  assert.equal(state.phase, "waiting");
  const matched = await requestMatch("human", "con", "替换后的对手");
  assert.equal(matched.roomId, waiting.roomId);
  oldClient.close();
  newClient.close();
});

test("同批 join 与 Close 帧按序清理，不留下在线候选", async () => {
  const waiting = await requestMatch("human", "pro", "快速关闭候选");
  const client = await new TestWsClient(wsPort, `?roomId=${waiting.roomId}`).connect();
  const join = encodeClientFrame(OPCODE.TEXT, JSON.stringify({
    type: "join",
    roomId: waiting.roomId,
    seatToken: waiting.seatToken,
  }));
  client.socket.end(Buffer.concat([join, encodeClientFrame(OPCODE.CLOSE)]));

  const state = await waitForRoomState(
    waiting.roomId,
    (snapshot) => snapshot.phase === "waiting" && snapshot.seats.pro?.connected === false,
  );
  assert.equal(state.match.status, "waiting");
  const opposite = await requestMatch("human", "con", "快速关闭后的请求者");
  assert.notEqual(opposite.roomId, waiting.roomId);
});

test("Bot 的 null socket 可安全广播、列出和离席", async () => {
  const match = await requestMatch("ai", "pro", "空 socket 检查");
  const room = ctx.registry.get(match.roomId);
  assert.equal(room.seats.get("con").socket, null);
  assert.doesNotThrow(() => room.broadcastEvent({ kind: "nullSocketCheck" }));
  assert.doesNotThrow(() => room.broadcastState());
  assert.ok(ctx.registry.list().some((entry) => entry.id === match.roomId && entry.occupied === 1));
  assert.equal(room.leave("con", null), true);
  assert.doesNotThrow(() => room.broadcastState());
});

test("Bot 驱动运行中收到新触发时，会串行补跑而不吞动作", async () => {
  let releaseFirst;
  const firstRun = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  let runs = 0;
  const room = new Room({
    id: "bot-pump-race",
    topic: { title: "测试议题" },
    match: { mode: "ai", status: "matched", reason: "test", requestedAt: "test" },
    transition: (state) => ({ ok: true, state }),
    createRoomState: ({ match }) => ({ match }),
    driveBot: async () => {
      runs += 1;
      if (runs === 1) await firstRun;
    },
  });

  const first = room.driveBot();
  await Promise.resolve();
  const queued = room.driveBot();
  releaseFirst();
  await Promise.all([first, queued]);

  assert.equal(runs, 2);
  assert.equal(room.botRun, null);
});

test("直接选择 AI 后 Bot 明确占席并自动完成对侧五阶段动作", async () => {
  const match = await requestMatch("ai", "pro", "AI 路径用户");
  assert.equal(match.status, "matched");
  const client = await new TestWsClient(wsPort, `?roomId=${match.roomId}`).connect();
  client.send({ type: "join", roomId: match.roomId, seatToken: match.seatToken, name: "AI 路径用户" });
  const ready = await client.waitFor(
    (message) => message.type === "state" && message.state.phase === "opening" && Boolean(message.state.briefs.con),
  );
  assert.equal(ready.state.match.mode, "ai");
  assert.equal(ready.state.seats.con.isBot, true);
  assert.equal(ready.state.seats.con.name, "争鸣 AI");

  const brief = { conclusion: "程序员会继续存在", reasons: ["责任归属仍需由人承担"] };
  client.send({ type: "action", action: { kind: "submitBrief", brief } });
  await client.waitFor((message) => message.type === "state" && message.state.transcript.some((turn) => turn.authorId === "con" && turn.kind === "opening"));
  client.send({ type: "action", action: { kind: "submitOpening", text: "我方标准是责任主体是否仍然存在，因此程序员会继续存在。" } });
  await client.waitFor((message) => message.type === "state" && message.state.phase === "crossAsk" && message.state.turnSeat === "pro");

  client.send({ type: "action", action: { kind: "ask", targetItem: "结论", question: "你的结论在什么条件下不成立？" } });
  await client.waitFor((message) => message.type === "state" && message.state.phase === "crossReact" && message.state.turnSeat === "pro");
  client.send({ type: "action", action: { kind: "react", reaction: "accept" } });
  await client.waitFor((message) => message.type === "state" && message.state.phase === "crossAnswer" && message.state.turnSeat === "pro");
  client.send({ type: "action", action: { kind: "answer", text: "我认为关键仍是责任是否需要由具体的人承担。" } });
  const free = await client.waitFor((message) => message.type === "state" && message.state.phase === "free" && message.state.freeSpokenBy.includes("con"));
  assert.equal(free.state.host.degraded, true);

  client.send({ type: "action", action: { kind: "freeSpeak", freeType: "举证", text: "现有项目仍需要明确的责任主体承担上线后果。" } });
  await client.waitFor((message) => message.type === "state" && message.state.phase === "closing" && message.state.transcript.some((turn) => turn.authorId === "con" && turn.kind === "closing"));
  client.send({ type: "action", action: { kind: "submitClosing", text: "本场分歧集中在职业形态变化是否等于责任角色消失。" } });
  const settled = await client.waitFor(
    (message) => message.type === "state" && message.state.phase === "settled" && Boolean(message.state.report),
    { timeout: 8_000 },
  );
  assert.equal(settled.state.report.completed, true);
  assert.ok(settled.state.transcript.some((turn) => turn.authorId === "con" && turn.kind === "answer"));
  assert.ok(settled.state.transcript.some((turn) => turn.authorId === "con" && turn.kind === "question"));
  assert.equal(settled.state.seats.con.isBot, true);
  client.close();
});

test("GET 不存在的房间 → 404", async () => {
  const res = await fetch(`${baseUrl}/api/rooms/room-does-not-exist`);
  assert.equal(res.status, 404);
});

test("终局分别调用 Host 评价双方，并把席位视角映射为 user", async () => {
  const calls = [];
  const state = {
    roomId: "room-evaluate-test",
    phase: "settled",
    host: { degraded: false },
    transcript: [
      { turnId: "q1", authorId: "pro", kind: "question", text: "依据是什么？" },
      { turnId: "a1", authorId: "con", kind: "answer", text: "依据来自公开报告。" },
      { turnId: "r1", authorId: "pro", kind: "reaction", text: "接受回答" },
    ],
    report: {
      profiles: { pro: null, con: null },
      grounds: [],
      verdict: "",
      hostDegraded: false,
    },
  };
  const hostInvoker = async (capability, params, options) => {
    calls.push({ capability, params, options });
    const evaluatedSeat = options.requestId.endsWith("-pro") ? "pro" : "con";
    return {
      ok: true,
      result: {
        dims: { 立论: 71, 论据: 72, 逻辑: 73, 回应: evaluatedSeat === "pro" ? 64 : 84, 表达: 75, 规范: 76 },
        grounds: [{ dim: "回应", quote: evaluatedSeat === "pro" ? "依据是什么" : "公开报告", reason: "对照问答评价" }],
        verdict: "按完整发言记录生成的中立结构反馈。",
      },
    };
  };

  const evaluated = await evaluateSettledRoom(state, hostInvoker);

  assert.equal(calls.length, 2);
  assert.equal(calls[0].capability, "evaluate");
  assert.equal(calls[0].params.transcript[0].authorId, "user");
  assert.equal(calls[1].params.transcript[1].authorId, "user");
  assert.equal(evaluated.report.profiles.pro[3], 64);
  assert.equal(evaluated.report.profiles.con[3], 84);
  assert.deepEqual(evaluated.report.grounds.map((ground) => ground.seat), ["pro", "con"]);
  assert.match(evaluated.report.verdict, /正方：/);
  assert.match(evaluated.report.verdict, /反方：/);
  assert.equal(evaluated.report.hostDegraded, false);
});

test("终局真实评分失败时回退启发式，保留双方画像与降级原因", async () => {
  const state = {
    roomId: "room-evaluate-fallback",
    phase: "settled",
    host: { degraded: false },
    transcript: [
      { turnId: "q1", authorId: "pro", kind: "question", text: "你的判断标准是什么？" },
      { turnId: "a1", authorId: "con", kind: "answer", text: "我以岗位职责是否独立存在为标准。" },
    ],
    report: { profiles: { pro: null, con: null }, grounds: [], verdict: "", hostDegraded: false },
  };
  const failedHost = async () => ({
    ok: false,
    error: { code: "TIMEOUT", message: "upstream did not respond within 30000ms" },
  });

  const evaluated = await evaluateSettledRoom(state, failedHost);

  assert.equal(evaluated.report.hostDegraded, true);
  assert.ok(evaluated.report.profiles.pro);
  assert.ok(evaluated.report.profiles.con);
  assert.match(evaluated.host.reason, /upstream did not respond/);
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
