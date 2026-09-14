/**
 * 争鸣 · 辩论间房间管理（服务端权威状态机的外壳）
 *
 * 职责边界（ROLLOUT §2）：
 *   服务端只负责 **校验 + 广播 + 落盘**，不复制业务规则。
 *   阶段跃迁判定由 web/src/domain/debateRoom.ts 的 transition() 完成——
 *   本模块通过注入的 `applyAction` 回调调用它，服务端与前端共享同一份纯函数。
 *
 * 席位令牌（ROLLOUT §1 约束 3）：同一浏览器多标签页共用 localStorage，
 * 所以令牌由服务端按 join 顺序签发，客户端存 sessionStorage（按窗口隔离）。
 * 持令牌重连 → 回到原席位，不从池子里新占一个。
 */

import crypto from "node:crypto";

export const SEAT_SIDES = Object.freeze(["pro", "con"]);

/** 生成房间 id：可读前缀 + 随机串，满足 store 的白名单 */
export function generateRoomId(prefix = "room") {
  const rand = crypto.randomBytes(4).toString("hex");
  const stamp = Date.now().toString(36).slice(-4);
  return `${prefix}-${stamp}-${rand}`;
}

export function generateSeatToken() {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * 房间容器：持有状态 + 成员连接 + 落盘钩子。
 *
 * 状态一律通过 `domain.debateRoom.createRoomState()` 构造——
 * 服务端**不手写** RoomState（手写会缺字段，导致动作被领域层拒收）。
 *
 * @param {object} options
 * @param {string} options.id
 * @param {object} options.topic 议题与论点对（来自真实数据）
 * @param {Function} options.transition (state, actor, action) => {ok, state?, code?, message?}
 * @param {Function} [options.createRoomState] 领域工厂
 * @param {Function} [options.openRoom] waiting → opening 跃迁
 * @param {Function} [options.withSeat] 席位写入
 * @param {Function} [options.onReport] 对局结束时的评分/落盘回调，可返回最终 state
 */
export class Room {
  constructor({ id, topic, match, transition, createRoomState, openRoom, withSeat, onReport, driveBot }) {
    this.id = id;
    this.topic = topic;
    this.transition = transition;
    this.openRoom = openRoom;
    this.withSeat = withSeat;
    this.onReport = onReport;
    this.botDriver = driveBot;
    this.botRun = null;
    /** @type {Map<string, {socket:object|null, side:string, token:string|null, name:string, isBot:boolean}>} */
    this.seats = new Map();
    /** 预留席位或已入席记录；HTTP 匹配先签发，WS join 再激活 */
    this.tokens = new Map();
    this.state = createRoomState
      ? createRoomState({ roomId: id, topic, match })
      : {
          // 极端兜底：领域工厂缺失时也要有个能跑的结构（启动时已打印显著告警）
          roomId: id,
          topic,
          match: match || {
            mode: "human",
            status: "waiting",
            reason: "已进入真人候选池，等待持相反立场的用户在线。",
            requestedAt: new Date().toISOString(),
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
          host: { degraded: true, reason: "domain module missing" },
          report: null,
          createdAt: new Date().toISOString(),
        };
    this.closed = false;
  }

  /** 已占席位数量 */
  occupiedCount() {
    return this.seats.size;
  }

  /** 找到一个空席位 */
  freeSide(preferred) {
    const reserved = new Set(Array.from(this.tokens.values()).map((record) => record.side));
    if (preferred && SEAT_SIDES.includes(preferred) && !this.seats.has(preferred) && !reserved.has(preferred)) return preferred;
    return SEAT_SIDES.find((s) => !this.seats.has(s) && !reserved.has(s)) || null;
  }

  /** 席位信息写入 state（走领域函数，不手写） */
  #setSeat(side, name, connected, { isBot = false, profile = null } = {}) {
    const info = { name, connected, isBot, profile };
    this.state = this.withSeat
      ? this.withSeat(this.state, side, info)
      : { ...this.state, seats: { ...this.state.seats, [side]: info } };
  }

  /** HTTP 撮合阶段预留真人席位，返回给该窗口专用的 seatToken。 */
  reserveHuman({ side, name, profile = null }) {
    const target = this.freeSide(side);
    if (!target || target !== side) {
      return { ok: false, code: "SIDE_TAKEN", message: "requested side is no longer available" };
    }
    const token = generateSeatToken();
    this.tokens.set(token, { side: target, name: name || `席位 ${target}`, profile, reserved: true });
    return { ok: true, seatToken: token, side: target };
  }

  /** AI 模式明确占据对侧；Bot 不持有 socket，也绝不显示为真人在线。 */
  attachBot(side, name = "争鸣 AI") {
    if (!SEAT_SIDES.includes(side) || this.seats.has(side)) return false;
    this.seats.set(side, { socket: null, side, token: null, name, isBot: true });
    this.#setSeat(side, name, true, { isBot: true, profile: null });
    this.state = {
      ...this.state,
      match: {
        ...this.state.match,
        status: "matched",
        reason: "已按你的选择创建 AI 对手，Bot 席位已明确标注。",
        matchedAt: new Date().toISOString(),
      },
    };
    this.#tryOpen();
    return true;
  }

  /** 席位占满时把房间从 waiting 推进到 opening */
  #tryOpen() {
    if (this.state.phase !== "waiting") return;
    if (this.occupiedCount() < 2) return;
    this.state = this.openRoom ? this.openRoom(this.state) : { ...this.state, phase: "opening" };
  }

  /**
   * 加入 / 重连。
   * @returns {{ok:true, seatToken:string, side:string, resumed:boolean} | {ok:false, code:string, message:string}}
   */
  join({ socket, seatToken, side, name }) {
    // 1) 带令牌 → 重连回原席位
    if (seatToken && this.tokens.has(seatToken)) {
      const record = this.tokens.get(seatToken);
      const previous = this.seats.get(record.side);
      const resumed = record.reserved === false;
      if (previous?.socket && previous.socket !== socket) previous.socket.close(1000, "session replaced by reconnection");
      const displayName = name || record.name;
      this.tokens.set(seatToken, { ...record, name: displayName, reserved: false });
      this.seats.set(record.side, { socket, side: record.side, token: seatToken, name: displayName, isBot: false });
      this.#setSeat(record.side, displayName, true, { profile: record.profile ?? null });
      this.#tryOpen();
      return { ok: true, seatToken, side: record.side, resumed };
    }
    if (seatToken) {
      return { ok: false, code: "INVALID_SEAT_TOKEN", message: "seat token is not valid for this room" };
    }

    // 2) 无令牌 → 占一个空席位
    const target = this.freeSide(side);
    if (side && target !== side) {
      return { ok: false, code: "SIDE_TAKEN", message: "requested side is reserved or already occupied" };
    }
    if (!target) {
      return { ok: false, code: "ROOM_FULL", message: "both seats are taken" };
    }
    const token = generateSeatToken();
    const displayName = name || `席位 ${target}`;
    this.tokens.set(token, { side: target, name: displayName, profile: null, reserved: false });
    this.seats.set(target, { socket, side: target, token, name: displayName, isBot: false });
    this.#setSeat(target, displayName, true);
    this.#tryOpen();
    return { ok: true, seatToken: token, side: target, resumed: false };
  }

  /**
   * 移除当前连接。传 socket 时必须仍是该席位的连接，防止被替换的旧连接误删新连接。
   */
  leave(side, socket) {
    const seat = this.seats.get(side);
    if (!seat) return false;
    if (socket !== undefined && seat.socket !== socket) return false;
    this.seats.delete(side);
    this.#setSeat(side, this.state.seats[side]?.name || seat.name, false);
    return true;
  }

  /**
   * 消费一个动作：交给共享的 transition() 判定，不合法则原样返回错误且不动状态。
   */
  applyAction(actorSide, action) {
    const outcome = this.transition(this.state, actorSide, action);
    if (!outcome.ok) return outcome;
    this.state = outcome.state;
    return outcome;
  }

  /** 串行驱动 Bot，避免同一 socket 的快速重复动作触发两条 AI 链。 */
  async driveBot() {
    if (this.state.match?.mode !== "ai" || typeof this.botDriver !== "function") return;
    // Bot 广播后，真人可能在当前 driver 的 finally 前立刻提交下一步。
    // 每次触发都追加到 Promise 尾部，保证下一轮读取最新权威状态且不会并行。
    const previous = this.botRun || Promise.resolve();
    const queued = previous.then(() => this.botDriver(this));
    const tracked = queued.finally(() => {
      if (this.botRun === tracked) this.botRun = null;
    });
    this.botRun = tracked;
    await tracked;
  }

  /** 广播权威快照 */
  broadcastState() {
    const message = JSON.stringify({ type: "state", roomId: this.id, state: this.state });
    for (const seat of this.seats.values()) {
      seat.socket?.send(message);
    }
  }

  /** 广播轻量事件 */
  broadcastEvent(event) {
    const message = JSON.stringify({ type: "event", roomId: this.id, event: { ...event, at: new Date().toISOString() } });
    for (const seat of this.seats.values()) {
      seat.socket?.send(message);
    }
  }

  /** 房间终结：落盘报告 */
  async finish() {
    if (this.closed) return;
    this.closed = true;
    if (typeof this.onReport === "function") {
      const finalState = await this.onReport(this.state);
      if (finalState) this.state = finalState;
    }
  }
}

/**
 * 房间注册表：进程内内存持有。
 * 服务端重启后房间丢失（本地开发可接受；报告已落盘可回读）。
 */
export class RoomRegistry {
  constructor({ transition, createTopic, onReport, createRoomState, openRoom, withSeat, rankCandidates, driveBot } = {}) {
    this.transition = transition;
    this.createTopic = createTopic;
    this.onReport = onReport;
    this.createRoomState = createRoomState;
    this.openRoom = openRoom;
    this.withSeat = withSeat;
    this.rankCandidates = rankCandidates;
    this.driveBot = driveBot;
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
  }

  create({ topic, roomId, match } = {}) {
    const id = roomId || generateRoomId();
    const room = new Room({
      id,
      topic: topic || (typeof this.createTopic === "function" ? this.createTopic() : { title: "未命名议题" }),
      match,
      transition: this.transition,
      createRoomState: this.createRoomState,
      openRoom: this.openRoom,
      withSeat: this.withSeat,
      onReport: this.onReport,
      driveBot: this.driveBot,
    });
    this.rooms.set(id, room);
    return room;
  }

  /**
   * 服务端权威撮合。真人模式只把**实际在线**的等待席位放入候选；AI 模式明确附加 Bot。
   */
  requestMatch({ topic, side, mode, name, profile = null }) {
    if (!topic || !SEAT_SIDES.includes(side) || !["human", "ai"].includes(mode)) {
      return { ok: false, code: "VALIDATION", message: "topic, side and mode are required" };
    }
    const now = new Date().toISOString();
    const createWaitingRoom = () => this.create({
      topic,
      match: {
        mode,
        status: "waiting",
        reason: mode === "ai"
          ? "正在创建明确标注的 AI 对手。"
          : "已进入真人候选池，等待持相反立场的用户在线。",
        requestedAt: now,
      },
    });

    if (mode === "ai") {
      const room = createWaitingRoom();
      const reservation = room.reserveHuman({ side, name, profile });
      if (!reservation.ok) return reservation;
      room.attachBot(side === "pro" ? "con" : "pro");
      return {
        ok: true,
        room,
        side,
        seatToken: reservation.seatToken,
        mode,
        status: "matched",
        reason: room.state.match.reason,
      };
    }

    const opposite = side === "pro" ? "con" : "pro";
    const waiting = Array.from(this.rooms.values()).filter((room) =>
      room.state.match?.mode === "human" &&
      room.state.phase === "waiting" &&
      room.topic?.questionId === topic.questionId &&
      room.state.seats[opposite]?.connected === true &&
      room.state.seats[opposite]?.isBot === false &&
      room.freeSide(side) === side,
    );
    const candidates = waiting.map((room) => ({
      seatId: room.id,
      name: room.state.seats[opposite]?.name || "候选辩手",
      side: opposite,
      profile: room.state.seats[opposite]?.profile ?? null,
    }));
    const ranked = typeof this.rankCandidates === "function"
      ? this.rankCandidates(profile, candidates)
      : candidates;
    const matched = ranked.length ? this.get(ranked[0].seatId) : null;
    const room = matched || createWaitingRoom();
    const reservation = room.reserveHuman({ side, name, profile });
    if (!reservation.ok) return reservation;
    if (matched) {
      room.state = {
        ...room.state,
        match: {
          ...room.state.match,
          status: "matched",
          reason: ranked[0].score == null
            ? "已匹配到同一议题、相反立场的在线真人（双方暂无历史画像）。"
            : `已匹配到同一议题、相反立场的在线真人（画像相近度 ${Math.round(ranked[0].score * 100)}%）。`,
          matchedAt: now,
        },
      };
      room.broadcastState();
    }
    return {
      ok: true,
      room,
      side,
      seatToken: reservation.seatToken,
      mode,
      status: matched ? "matched" : "waiting",
      reason: room.state.match.reason,
    };
  }

  get(roomId) {
    return this.rooms.get(roomId) || null;
  }

  /** 取出或按需创建（客户端可以带 roomId 直接进房） */
  getOrCreate(roomId, { topic } = {}) {
    if (roomId && this.rooms.has(roomId)) return this.rooms.get(roomId);
    return this.create({ topic, roomId });
  }

  list() {
    return Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      phase: room.state.phase,
      occupied: room.occupiedCount(),
      match: room.state.match,
      topic: room.topic?.title || "",
    }));
  }

  remove(roomId) {
    return this.rooms.delete(roomId);
  }
}
