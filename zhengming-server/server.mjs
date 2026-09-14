/**
 * 争鸣 · 服务端入口（单进程 · 单端口）
 *
 * 路由：
 *   POST /api/host/:capability   → Host 八能力（key 只在服务端读）
 *   GET  /api/health             → 健康检查 + 是否已配 key（不含 key 本身）
 *   GET  /api/rooms              → 房间列表
 *   POST /api/rooms              → 新建房间
 *   POST /api/matches            → 真人候选池或明确 AI 对辩
 *   GET  /api/rooms/:id          → 房间快照（含报告）
 *   GET  /api/topics             → 真实议题与论点对（辩论间选边用）
 *   WS   /ws/room?roomId=xxx     → 房间实时通道
 *
 * 环境变量：
 *   PORT                 默认 5300
 *   STEPFUN_API_KEY      阶跃星辰 API key（不设则 Host 走降级启发式，响应标 degraded:true）
 *   ZHENGMING_DOMAIN     辩论间领域模块路径（默认从 web/src/domain/debateRoom.ts 的编译产物读；
 *                        见 README「领域内核共享」一节）
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 副作用式加载 zhengming-server/.env（零依赖；只注入 process.env，不打印值）
import "./lib/env.mjs";

import { CAPABILITIES, ERROR_CODES, MAX_PAYLOAD_BYTES, findBannedWords } from "./lib/contract.mjs";
import { invokeHost, readApiKey } from "./lib/host.mjs";
import { RoomRegistry, SEAT_SIDES } from "./lib/room.mjs";
import { Store } from "./lib/store.mjs";
import { OPCODE, FrameParser, acceptKey, encodeClose, encodePong, encodeText } from "./lib/ws.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEBATE_QUESTION_RULES_PATH = path.resolve(HERE, "..", "web", "src", "data", "debateQuestionRules.json");
const DEBATE_QUESTION_RULES = JSON.parse(fs.readFileSync(DEBATE_QUESTION_RULES_PATH, "utf8"));

export const DEFAULT_PORT = Number(process.env.PORT || 5300);

/** 只让含明确可站队结构的题干进入辩论间；开放解释题仍保留在研究数据中。 */
export function isDebatableQuestionTitle(title) {
  const normalized = String(title ?? "").replace(/\s+/g, "").toLowerCase();
  return normalized.length > 0 && DEBATE_QUESTION_RULES.stanceMarkers.some((marker) => normalized.includes(marker));
}

const EVALUATION_SEATS = ["pro", "con"];
const EVALUATION_DIMS = ["立论", "论据", "逻辑", "回应", "表达", "规范"];

function opponentOf(side) {
  return side === "pro" ? "con" : "pro";
}

function hasTurn(state, side, kind) {
  return state.transcript.some((turn) => turn.authorId === side && turn.kind === kind);
}

/**
 * AI 席位 orchestrator：只在 Bot 当前可动作时调用 Host，且每个动作仍过共享 transition。
 * 真实上游失败时强制走 invokeHost 的确定性 fallback，并把降级原因写进权威快照。
 */
export async function driveBotRoom(room, hostInvoker = invokeHost) {
  const botSide = EVALUATION_SEATS.find((side) => room.state.seats[side]?.isBot);
  if (!botSide) return room.state;

  for (let guard = 0; guard < 12; guard += 1) {
    const state = room.state;
    if (["waiting", "settled"].includes(state.phase)) break;

    const canAct =
      (state.phase === "opening" && (!state.briefs[botSide] || (state.briefs.pro && state.briefs.con && !hasTurn(state, botSide, "opening")))) ||
      (["crossAsk", "crossAnswer", "crossReact"].includes(state.phase) && state.turnSeat === botSide) ||
      (state.phase === "free" && !state.freeSpokenBy.includes(botSide)) ||
      (state.phase === "closing" && !hasTurn(state, botSide, "closing"));
    if (!canAct) break;

    const context = {
      phase: state.phase,
      side: botSide,
      topic: state.topic,
      presetClaim: (botSide === "pro" ? state.topic.pro : state.topic.con)?.claim || "",
      ownBrief: state.briefs[botSide],
      opponentBrief: state.briefs[opponentOf(botSide)],
      transcript: state.transcript,
      crossRecords: state.crossRecords,
    };
    // 立论结构不会写 transcript；把结构提交数等状态位纳入幂等键，
    // 避免 submitBrief 与紧随其后的 submitOpening 误命中同一缓存动作。
    const requestId = [
      state.roomId,
      "bot",
      state.phase,
      state.turnSeat || "none",
      `briefs-${Object.values(state.briefs).filter(Boolean).length}`,
      `turns-${state.transcript.length}`,
      `cross-${state.crossRecords.length}`,
      `free-${state.freeSpokenBy.length}`,
    ].join("-");
    let envelope;
    try {
      envelope = await hostInvoker("opponentTurn", context, { requestId });
    } catch (error) {
      envelope = { ok: false, error: { code: "UPSTREAM", message: error?.message || "opponentTurn failed" } };
    }
    let degradedReason = envelope?.degradedReason;
    if (!envelope?.ok) {
      degradedReason = envelope?.error?.message || "AI 对手上游暂时不可用";
      envelope = await invokeHost("opponentTurn", context, { requestId: `${requestId}-fallback`, apiKey: null });
    }
    const action = envelope?.result?.action;
    const hits = findBannedWords(action);
    let outcome = !action || hits.length
      ? { ok: false, code: "CONTENT_REJECTED", message: "AI 对手输出未通过内容校验" }
      : room.applyAction(botSide, action);

    if (!outcome.ok && !envelope?.degraded) {
      const fallback = await invokeHost("opponentTurn", context, { requestId: `${requestId}-domain-fallback`, apiKey: null });
      const fallbackAction = fallback?.result?.action;
      outcome = fallbackAction && !findBannedWords(fallbackAction).length
        ? room.applyAction(botSide, fallbackAction)
        : outcome;
      degradedReason = `${outcome.message || "AI 动作不符合当前阶段"}`;
      envelope = fallback;
    }
    if (!outcome.ok) {
      room.state = {
        ...room.state,
        host: { degraded: true, reason: degradedReason || outcome.message || "AI 对手降级动作失败" },
      };
      break;
    }
    if (envelope.degraded || degradedReason) {
      room.state = {
        ...room.state,
        host: { degraded: true, reason: degradedReason || envelope.degradedReason || "AI 对手使用启发式降级" },
      };
    }
    room.broadcastEvent({ kind: "botActed", side: botSide });
    room.broadcastState();
  }
  return room.state;
}

/**
 * 终局分别评价两个席位。Host 契约把被评估者固定标为 user，
 * 因此这里只改 authorId 视角，保留原始顺序、kind 与问答文本。
 */
export async function evaluateSettledRoom(state, hostInvoker = invokeHost) {
  if (state?.phase !== "settled" || !state.report || !state.transcript?.length) return state;

  const evaluations = await Promise.all(
    EVALUATION_SEATS.map(async (seat) => {
      const transcript = state.transcript.map((turn) => ({
        ...turn,
        authorId: turn.authorId === seat ? "user" : turn.authorId === "host" ? "host" : "bot",
      }));
      try {
        const envelope = await hostInvoker(
          "evaluate",
          { transcript },
          { requestId: `${state.roomId}-evaluate-${seat}` },
        );
        return { seat, transcript, envelope };
      } catch (error) {
        return { seat, transcript, envelope: null, error };
      }
    }),
  );

  const profiles = { ...state.report.profiles };
  const grounds = [];
  const verdicts = [];
  const degradedReasons = [];

  for (const { seat, transcript, envelope, error } of evaluations) {
    let resolved = envelope;
    if (!resolved?.ok) {
      degradedReasons.push(`${seat}: ${error?.message || resolved?.error?.message || "evaluate failed"}`);
      resolved = await invokeHost(
        "evaluate",
        { transcript },
        { requestId: `${state.roomId}-evaluate-${seat}-fallback`, apiKey: null },
      );
    }
    if (!resolved.ok) {
      degradedReasons.push(`${seat}: fallback ${resolved.error?.message || "failed"}`);
      continue;
    }
    profiles[seat] = EVALUATION_DIMS.map((dim) => Math.round(Number(resolved.result?.dims?.[dim]) || 0));
    for (const ground of resolved.result?.grounds ?? []) {
      grounds.push({ ...ground, seat });
    }
    if (resolved.result?.verdict) {
      verdicts.push(`${seat === "pro" ? "正方" : "反方"}：${resolved.result.verdict}`);
    }
    if (resolved.degraded && envelope?.ok) {
      degradedReasons.push(resolved.degradedReason || `${seat}: heuristic fallback`);
    }
  }

  const degraded = degradedReasons.length > 0;
  return {
    ...state,
    host: {
      degraded,
      ...(degraded ? { reason: [...new Set(degradedReasons)].join("；") } : {}),
    },
    report: {
      ...state.report,
      profiles,
      grounds,
      verdict: verdicts.join("\n"),
      hostDegraded: degraded,
    },
  };
}

/* ═══════════════════ 领域内核加载 ═══════════════════
   ROLLOUT §2 明确：服务端 **import 同一份 domain 纯函数**，不重写。
   前端是 TS，这里读它的构建产物：web/src/domain/debateRoom.js（由 tsc 产出）
   或显式指定的路径。加载失败时用内置最小实现兜底，并打印显著告警。 */

const DOMAIN_CANDIDATES = [
  process.env.ZHENGMING_DOMAIN,
  path.resolve(HERE, "..", "web", "dist-domain", "domain", "debateRoom.js"),
  path.resolve(HERE, "..", "web", "src", "domain", "debateRoom.mjs"),
].filter(Boolean);

/** 兜底 transition：只做最基本的守卫，保证服务端在领域模块缺失时仍能起 */
function fallbackTransition(state, actor, action) {
  if (!state || !actor || !action) {
    return { ok: false, code: "VALIDATION", message: "missing state, actor or action" };
  }
  if (state.phase === "settled") {
    return { ok: false, code: "ROOM_SETTLED", message: "room already settled" };
  }
  if (action.kind === "leave") {
    return { ok: true, state: { ...state, phase: "settled" } };
  }
  return { ok: false, code: "DOMAIN_MODULE_MISSING", message: "debateRoom domain module is not loaded" };
}

/**
 * 兜底领域实现：领域模块缺失时保证服务端能起，但除 leave 外的动作一律拒绝。
 * `createRoomState` 必须给出结构完整的 RoomState，否则前端拿到 undefined 字段会崩。
 */
const fallbackDomain = {
  createRoomState: ({ roomId, topic, match, now }) => ({
    roomId,
    topic,
    match: match || {
      mode: "human",
      status: "waiting",
      reason: "已进入真人候选池，等待持相反立场的用户在线。",
      requestedAt: now || new Date().toISOString(),
    },
    phase: "waiting",
    seats: { pro: null, con: null },
    briefs: { pro: null, con: null },
    transcript: [],
    crossRecords: [],
    revisions: [],
    pressedBy: [],
    freeSpokenBy: [],
    turnSeat: null,
    host: { degraded: true, reason: "debateRoom domain module is not loaded" },
    report: null,
    createdAt: now || new Date().toISOString(),
  }),
  openRoom: (state) =>
    state.phase === "waiting" && Object.values(state.seats).filter(Boolean).length >= 2
      ? { ...state, phase: "opening", turnSeat: "pro" }
      : state,
  withSeat: (state, side, info) => ({ ...state, seats: { ...state.seats, [side]: info } }),
  rankCandidates: (_profile, candidates) => candidates,
  transition: fallbackTransition,
};

async function loadDomain() {
  for (const candidate of DOMAIN_CANDIDATES) {
    try {
      if (!fs.existsSync(candidate)) continue;
      const mod = await import(`file://${candidate.replace(/\\/g, "/")}`);
      if (typeof mod.transition === "function" && typeof mod.createRoomState === "function") {
        return {
          transition: mod.transition,
          createRoomState: mod.createRoomState,
          openRoom: typeof mod.openRoom === "function" ? mod.openRoom : fallbackDomain.openRoom,
          withSeat: typeof mod.withSeat === "function" ? mod.withSeat : fallbackDomain.withSeat,
          rankCandidates: typeof mod.rankCandidates === "function" ? mod.rankCandidates : fallbackDomain.rankCandidates,
          source: candidate,
        };
      }
      console.warn(
        `[zhengming] domain module at ${candidate} is missing transition/createRoomState; ` +
          "run `npm run build:domain` in web/ and retry.",
      );
    } catch (error) {
      console.warn(`[zhengming] domain module at ${candidate} failed to load: ${error.message}`);
    }
  }
  console.warn(
    "[zhengming] WARNING: debateRoom domain module not found; using minimal fallback. " +
      "Room actions will be rejected with DOMAIN_MODULE_MISSING. " +
      "Run `npm run build:domain` in web/ to fix. See README 「领域内核共享」.",
  );
  return { ...fallbackDomain, source: null };
}

/* ═══════════════════ 真实议题数据加载 ═══════════════════
   数据来源：research/controversy-map/claims.json（真实作者 / 赞同数 / 知乎 URL）。
   provenance 红线：绝不伪造，保留 author / voteUp / url。 */

const CLAIMS_PATH = path.resolve(HERE, "..", "research", "controversy-map", "claims.json");

function loadClaims() {
  try {
    const raw = fs.readFileSync(CLAIMS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const claims = Array.isArray(parsed) ? parsed : parsed.claims || [];
    return claims.filter((c) => c && c.questionId && c.claim);
  } catch (error) {
    console.warn(`[zhengming] claims.json not readable (${error.message}); /api/topics will be empty.`);
    return [];
  }
}

/** 把真实论点组织成辩论间可用的「议题 + 论点对」 */
export function buildTopics(claims) {
  const byQuestion = new Map();
  for (const claim of claims) {
    if (!isDebatableQuestionTitle(claim.questionTitle)) continue;
    if (!byQuestion.has(claim.questionId)) {
      byQuestion.set(claim.questionId, {
        questionId: claim.questionId,
        title: claim.questionTitle || "",
        url: claim.url || "",
        side: { positive: [], negative: [], neutral: [] },
      });
    }
    const bucket = byQuestion.get(claim.questionId);
    const side = claim.side === "positive" ? "positive" : claim.side === "negative" ? "negative" : "neutral";
    bucket.side[side].push({
      id: claim.id,
      claim: claim.claim,
      author: claim.author || "",
      authorBadge: claim.authorBadge || "",
      voteUp: Number(claim.voteUp) || 0,
      url: claim.url || "",
      reasonType: claim.reasonType || "",
      quality: typeof claim.quality === "number" ? claim.quality : null,
    });
  }

  const topics = [];
  for (const entry of byQuestion.values()) {
    const pro = entry.side.positive;
    const con = entry.side.negative;
    const paired = pro.length > 0 && con.length > 0;
    // 有两个真实论点对时优先；否则取该议题得票最高的一侧论点
    topics.push({
      questionId: entry.questionId,
      title: entry.title,
      url: entry.url,
      paired,
      // 同一议题的正反方 → 不标跨议题；数据实情见 README
      crossPaired: false,
      pairingNote: "同一议题下的真实正反论点（争议地图管线立场抽取）",
      // 成对：各取赞同数最高的一条；不成对：单侧也给出，前端标注「跨议题配对」
      pro: paired ? pro.slice().sort((a, b) => b.voteUp - a.voteUp)[0] : null,
      con: paired ? con.slice().sort((a, b) => b.voteUp - a.voteUp)[0] : null,
      pool: { positive: pro, negative: con, neutral: entry.side.neutral },
    });
  }

  // 成对议题排前面
  return topics.sort((a, b) => Number(b.paired) - Number(a.paired));
}

/* ═══════════════════ HTTP 工具 ═══════════════════ */

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { ...JSON_HEADERS, "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}

function readBody(req, limit = MAX_PAYLOAD_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error("payload too large"), { code: ERROR_CODES.PAYLOAD_TOO_LARGE }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/* ═══════════════════ 创建服务 ═══════════════════ */

/**
 * 创建服务端（返回 { server, registry, store, topics, domainSource }）。
 * 导出成函数便于测试里用随机端口启动。
 */
export async function createServer({ port = DEFAULT_PORT, storeDir, transitionOverride, hostInvoker = invokeHost } = {}) {
  const store = new Store(storeDir ? { dir: storeDir } : {});
  await store.ensureDir();

  const domain = transitionOverride
    ? { ...fallbackDomain, transition: transitionOverride, source: "injected" }
    : await loadDomain();

  const claims = loadClaims();
  const topics = buildTopics(claims);

  const registry = new RoomRegistry({
    transition: domain.transition,
    createRoomState: domain.createRoomState,
    openRoom: domain.openRoom,
    withSeat: domain.withSeat,
    rankCandidates: domain.rankCandidates,
    driveBot: (room) => driveBotRoom(room, hostInvoker),
    createTopic: () => topics[0] || { title: "未命名议题", paired: false },
    onReport: async (state) => {
      const finalState = await evaluateSettledRoom(state, hostInvoker);
      try {
        await store.save(finalState.roomId, finalState);
      } catch (error) {
        console.error(`[zhengming] failed to persist room ${finalState.roomId}: ${error.message}`);
      }
      return finalState;
    },
  });

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "OPTIONS") {
      res.writeHead(204, JSON_HEADERS);
      res.end();
      return;
    }

    // ── 健康检查：只说有没有 key，绝不下发 key
    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, {
        ok: true,
        service: "zhengming-server",
        host: { configured: Boolean(readApiKey()), capabilities: CAPABILITIES },
        rooms: registry.rooms.size,
        topics: topics.length,
        domainModule: domain.source,
      });
      return;
    }

    // ── Host 能力
    if (req.method === "POST" && url.pathname.startsWith("/api/host/")) {
      const capability = decodeURIComponent(url.pathname.slice("/api/host/".length));
      let params;
      try {
        const raw = await readBody(req);
        params = raw ? JSON.parse(raw) : {};
      } catch (error) {
        if (error?.code === ERROR_CODES.PAYLOAD_TOO_LARGE) {
          sendJson(res, 413, {
            ok: false,
            error: { code: ERROR_CODES.PAYLOAD_TOO_LARGE, message: error.message, requestId: null },
          });
          return;
        }
        sendJson(res, 400, {
          ok: false,
          error: { code: ERROR_CODES.VALIDATION, message: "request body is not valid JSON", requestId: null },
        });
        return;
      }
      const requestId = typeof params.requestId === "string" ? params.requestId : url.searchParams.get("requestId") || undefined;
      const envelope = await hostInvoker(capability, params, { requestId });
      const status = envelope.ok
        ? 200
        : envelope.error.code === ERROR_CODES.CAPABILITY_NOT_FOUND
          ? 404
          : envelope.error.code === ERROR_CODES.VALIDATION
            ? 400
            : envelope.error.code === ERROR_CODES.PAYLOAD_TOO_LARGE
              ? 413
              : envelope.error.code === ERROR_CODES.TIMEOUT
                ? 504
                : 502;
      sendJson(res, status, envelope);
      return;
    }

    // ── 议题列表（真实数据）
    if (req.method === "GET" && url.pathname === "/api/topics") {
      const pairedOnly = url.searchParams.get("paired") === "1";
      sendJson(res, 200, {
        ok: true,
        total: topics.length,
        paired: topics.filter((t) => t.paired).length,
        topics: pairedOnly ? topics.filter((t) => t.paired) : topics,
        provenance: "research/controversy-map/claims.json · 真实作者/赞同数/知乎原链接",
      });
      return;
    }

    // ── 双入口撮合：真人候选池 / 明确 AI 对辩
    if (req.method === "POST" && url.pathname === "/api/matches") {
      let body;
      try {
        const raw = await readBody(req);
        body = raw ? JSON.parse(raw) : {};
      } catch (error) {
        sendJson(res, error?.code === ERROR_CODES.PAYLOAD_TOO_LARGE ? 413 : 400, {
          ok: false,
          error: { code: error?.code || "VALIDATION", message: "匹配请求不是有效 JSON。" },
        });
        return;
      }
      const topic = topics.find((item) => item.questionId === body.topicId);
      if (!topic || !SEAT_SIDES.includes(body.side) || !["human", "ai"].includes(body.mode)) {
        sendJson(res, 400, {
          ok: false,
          error: { code: "VALIDATION", message: "请选择有效议题、立场与匹配方式。" },
        });
        return;
      }
      const result = registry.requestMatch({
        topic,
        side: body.side,
        mode: body.mode,
        name: typeof body.name === "string" ? body.name.slice(0, 40) : "辩手",
        profile: Array.isArray(body.profile) ? body.profile.slice(0, 6) : null,
      });
      if (!result.ok) {
        sendJson(res, 409, { ok: false, error: { code: result.code, message: result.message } });
        return;
      }
      sendJson(res, 201, {
        ok: true,
        roomId: result.room.id,
        side: result.side,
        seatToken: result.seatToken,
        mode: result.mode,
        status: result.status,
        reason: result.reason,
      });
      return;
    }

    // ── 房间列表 / 新建
    if (url.pathname === "/api/rooms") {
      if (req.method === "GET") {
        sendJson(res, 200, { ok: true, rooms: registry.list() });
        return;
      }
      if (req.method === "POST") {
        let body = {};
        try {
          const raw = await readBody(req);
          body = raw ? JSON.parse(raw) : {};
        } catch {
          body = {};
        }
        const topic = body.topicId ? topics.find((t) => t.questionId === body.topicId) : undefined;
        const room = registry.create({ topic: topic || undefined });
        sendJson(res, 201, { ok: true, roomId: room.id, room: { id: room.id, topic: room.topic, phase: room.state.phase } });
        return;
      }
    }

    // ── 单房间快照
    const roomMatch = url.pathname.match(/^\/api\/rooms\/([a-z0-9-]+)$/);
    if (req.method === "GET" && roomMatch) {
      const roomId = roomMatch[1];
      const live = registry.get(roomId);
      if (live) {
        sendJson(res, 200, { ok: true, source: "memory", state: live.state });
        return;
      }
      const persisted = await store.load(roomId);
      if (persisted) {
        sendJson(res, 200, { ok: true, source: "disk", state: persisted });
        return;
      }
      sendJson(res, 404, { ok: false, error: { code: "NOT_FOUND", message: `no room ${roomId}` } });
      return;
    }

    sendJson(res, 404, { ok: false, error: { code: "NOT_FOUND", message: `no route for ${req.method} ${url.pathname}` } });
  });

  /* ── WebSocket 升级（路径 /ws/room） */
  /** 已升级的连接：server.close() 不会关掉它们，必须自己跟踪并在关闭时销毁 */
  const upgradedSockets = new Set();

  server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const key = req.headers["sec-websocket-key"];
    if (url.pathname !== "/ws/room" || !key) {
      socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
      socket.destroy();
      return;
    }

    upgradedSockets.add(socket);
    socket.on("close", () => upgradedSockets.delete(socket));

    socket.write(
      [
        "HTTP/1.1 101 Switching Protocols",
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Accept: ${acceptKey(key)}`,
        "\r\n",
      ].join("\r\n"),
    );

    const parser = new FrameParser();
    const client = {
      socket,
      room: null,
      side: null,
      closed: false,
      send(text) {
        if (!this.closed) socket.write(encodeText(text));
      },
      close(code = 1000, reason = "") {
        if (this.closed) return;
        this.closed = true;
        try {
          socket.write(encodeClose(code, reason));
        } catch {
          /* socket already gone */
        }
        socket.end();
      },
    };
    let messageRun = Promise.resolve();

    if (head && head.length) handleChunk(head);

    function handleChunk(chunk) {
      let frames;
      try {
        frames = parser.push(chunk);
      } catch (error) {
        client.close(1002, `protocol error: ${error.message}`);
        return;
      }
      for (const frame of frames) {
        if (frame.opcode === OPCODE.CLOSE) {
          messageRun = messageRun.then(() => leaveRoom()).catch(() => {});
          client.close(1000, "bye");
          return;
        }
        if (frame.opcode === OPCODE.PING) {
          socket.write(encodePong(frame.payload));
          continue;
        }
        if (frame.opcode === OPCODE.PONG) continue;
        if (frame.opcode === OPCODE.TEXT) {
          let message;
          try {
            message = JSON.parse(frame.text);
          } catch {
            client.send(JSON.stringify({ type: "error", code: "VALIDATION", message: "message is not valid JSON" }));
            continue;
          }
          // 串行处理：保证同一连接上的 join / action / leave 不会交错修改房间。
          messageRun = messageRun
            .then(() => handleMessage(message))
            .catch((error) => {
              client.send(JSON.stringify({ type: "error", code: "INTERNAL", message: error?.message || "internal error" }));
            });
        }
      }
    }

    async function leaveRoom({ intentional = false } = {}) {
      if (!client.room) return;
      const { room, side } = client;
      // 先解除 client 绑定，避免 error/close 连续触发两次离席流程。
      client.room = null;
      client.side = null;
      const wasWaiting = room.state.phase === "waiting";
      const removed = room.leave(side, client);
      if (!removed) return;
      room.broadcastEvent({ kind: "seatLeft", side });
      // 等待池的传输断开不是中途离席：立即失去在线候选资格，但可持 token 重连。
      if (wasWaiting && !intentional) {
        room.broadcastState();
        return;
      }
      // 离席惩罚（PRD §7：MP -5）由领域层结算——这里只把 leave 动作交给 transition
      const outcome = room.applyAction(side, { kind: "leave" });
      if (outcome.ok) {
        await room.finish();
      }
      room.broadcastState();
    }

    async function handleMessage(message) {
      if (!message || typeof message !== "object") {
        client.send(JSON.stringify({ type: "error", code: "VALIDATION", message: "message must be an object" }));
        return;
      }

      if (message.type === "join") {
        const room = registry.getOrCreate(message.roomId, {
          topic: message.topicId ? topics.find((t) => t.questionId === message.topicId) : undefined,
        });
        if (client.room && client.room !== room) await leaveRoom();
        const result = room.join({ socket: client, seatToken: message.seatToken, side: message.side, name: message.name });
        if (!result.ok) {
          client.send(JSON.stringify({ type: "error", code: result.code, message: result.message }));
          return;
        }
        client.room = room;
        client.side = result.side;
        client.send(
          JSON.stringify({
            type: "joined",
            roomId: room.id,
            side: result.side,
            seatToken: result.seatToken,
            resumed: result.resumed,
          }),
        );
        room.broadcastEvent({ kind: result.resumed ? "seatResumed" : "seatJoined", side: result.side });
        room.broadcastState();
        await room.driveBot();
        return;
      }

      if (!client.room) {
        client.send(JSON.stringify({ type: "error", code: "NOT_IN_ROOM", message: "send join first" }));
        return;
      }

      if (message.type === "action") {
        const action = message.action;
        if (!action || typeof action.kind !== "string") {
          client.send(JSON.stringify({ type: "error", code: "VALIDATION", message: "action.kind is required" }));
          return;
        }
        if (action.kind === "leave") {
          await leaveRoom({ intentional: true });
          return;
        }
        // 禁用词硬约束：用户输入也不得携带判输赢词族（契约 §0.5 的精神，库层面拦截）
        const hits = findBannedWords(action.payload ?? action);
        if (hits.length) {
          client.send(
            JSON.stringify({
              type: "error",
              code: "CONTENT_REJECTED",
              message: `发言中含平台禁用表述（${hits.join("、")}）——争鸣只记录分歧，不评判立场。`,
            }),
          );
          return;
        }
        const outcome = client.room.applyAction(client.side, action);
        if (!outcome.ok) {
          client.send(JSON.stringify({ type: "error", code: outcome.code, message: outcome.message }));
          return;
        }
        await client.room.driveBot();
        // 终局时**先落盘再广播**：客户端收到 settled 快照时，报告已经可以从磁盘回读
        if (client.room.state.phase === "settled") {
          await client.room.finish();
        }
        client.room.broadcastState();
        return;
      }

      if (message.type === "leave") {
        await leaveRoom({ intentional: true });
        return;
      }

      client.send(JSON.stringify({ type: "error", code: "VALIDATION", message: `unknown message type: ${message.type}` }));
    }

    socket.on("data", handleChunk);
    socket.on("error", () => {
      messageRun = messageRun.then(() => leaveRoom()).catch(() => {});
      client.close(1011, "socket error");
    });
    socket.on("close", () => {
      client.closed = true;
      messageRun = messageRun.then(() => leaveRoom()).catch(() => {});
    });
  });

  /** 关闭服务：先关升级过的连接（server.close 管不到它们），再关 HTTP */
  const close = () =>
    new Promise((resolve) => {
      for (const socket of upgradedSockets) {
        try {
          socket.destroy();
        } catch {
          /* already gone */
        }
      }
      upgradedSockets.clear();
      server.close(() => resolve());
    });

  return { server, registry, store, topics, domainSource: domain.source, port, close };
}

/* ═══════════════════ 直接运行时启动 ═══════════════════ */

const isDirectRun = (() => {
  const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return entry === path.resolve(HERE, "server.mjs");
})();

if (isDirectRun) {
  const { server, topics, domainSource, port } = await createServer();
  server.listen(port, "127.0.0.1", () => {
    const hasKey = Boolean(readApiKey());
    console.log(`[zhengming] server listening on http://127.0.0.1:${port}`);
    console.log(`[zhengming] Host upstream: ${hasKey ? "StepFun (step-3.7-flash)" : "DEGRADED — STEPFUN_API_KEY not set"}`);
    console.log(`[zhengming] rooms: in-memory · reports: zhengming-server/rooms/`);
    console.log(`[zhengming] topics loaded: ${topics.length}（其中成对 ${topics.filter((t) => t.paired).length}）`);
    console.log(`[zhengming] domain module: ${domainSource || "NOT FOUND（房间动作会被拒）"}`);
    console.log(`[zhengming] WS endpoint: ws://127.0.0.1:${port}/ws/room?roomId=<id>`);
  });
}

export { SEAT_SIDES };
