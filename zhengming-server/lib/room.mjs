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
 * @param {object} options
 * @param {string} options.id
 * @param {object} options.topic 议题与论点对（来自真实数据）
 * @param {Function} options.transition (state, actor, action) => {ok, state?, code?, message?}
 * @param {Function} [options.onReport] 对局结束时的落盘回调 (state) => Promise<void>
 */
export class Room {
  constructor({ id, topic, transition, onReport }) {
    this.id = id;
    this.topic = topic;
    this.transition = transition;
    this.onReport = onReport;
    /** @type {Map<string, {socket:object, side:string, token:string, name:string}>} */
    this.seats = new Map();
    /** 已签发但未使用的令牌（断线重连时凭它回到原席位） */
    this.tokens = new Map();
    this.state = {
      roomId: id,
      topic,
      phase: "waiting",
      seats: { pro: null, con: null },
      transcript: [],
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
    if (preferred && SEAT_SIDES.includes(preferred) && !this.seats.has(preferred)) return preferred;
    return SEAT_SIDES.find((s) => !this.seats.has(s)) || null;
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
      if (previous) previous.socket.close(1000, "session replaced by reconnection");
      this.seats.set(record.side, { socket, side: record.side, token: seatToken, name: name || record.name });
      this.state.seats[record.side] = { name: name || record.name, connected: true, isBot: false };
      return { ok: true, seatToken, side: record.side, resumed: true };
    }

    // 2) 无令牌 → 占一个空席位
    const target = this.freeSide(side);
    if (!target) {
      return { ok: false, code: "ROOM_FULL", message: "both seats are taken" };
    }
    const token = generateSeatToken();
    this.tokens.set(token, { side: target, name: name || `席位 ${target}` });
    this.seats.set(target, { socket, side: target, token, name: name || `席位 ${target}` });
    this.state.seats[target] = { name: name || `席位 ${target}`, connected: true, isBot: false };
    return { ok: true, seatToken: token, side: target, resumed: false };
  }

  /** 离席 */
  leave(side) {
    const seat = this.seats.get(side);
    if (!seat) return false;
    this.seats.delete(side);
    if (this.state.seats[side]) this.state.seats[side].connected = false;
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

  /** 广播权威快照 */
  broadcastState() {
    const message = JSON.stringify({ type: "state", roomId: this.id, state: this.state });
    for (const seat of this.seats.values()) {
      seat.socket.send(message);
    }
  }

  /** 广播轻量事件 */
  broadcastEvent(event) {
    const message = JSON.stringify({ type: "event", roomId: this.id, event: { ...event, at: new Date().toISOString() } });
    for (const seat of this.seats.values()) {
      seat.socket.send(message);
    }
  }

  /** 房间终结：落盘报告 */
  async finish() {
    if (this.closed) return;
    this.closed = true;
    if (typeof this.onReport === "function") {
      await this.onReport(this.state);
    }
  }
}

/**
 * 房间注册表：进程内内存持有。
 * 服务端重启后房间丢失（本地开发可接受；报告已落盘可回读）。
 */
export class RoomRegistry {
  constructor({ transition, createTopic, onReport } = {}) {
    this.transition = transition;
    this.createTopic = createTopic;
    this.onReport = onReport;
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
  }

  create({ topic, roomId } = {}) {
    const id = roomId || generateRoomId();
    const room = new Room({
      id,
      topic: topic || (typeof this.createTopic === "function" ? this.createTopic() : { title: "未命名议题" }),
      transition: this.transition,
      onReport: this.onReport,
    });
    this.rooms.set(id, room);
    return room;
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
      topic: room.topic?.title || "",
    }));
  }

  remove(roomId) {
    return this.rooms.delete(roomId);
  }
}
