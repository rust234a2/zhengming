/**
 * 争鸣 · 房间存储
 *
 * 对局报告落盘到 rooms/<id>.json（契约 §D5 / ROLLOUT §8：rooms/*.json 必须在 .gitignore 里，
 * 因为报告含用户输入，可能含个人经历）。
 *
 * 本模块只做 IO，不做业务规则——规则在 web/src/domain/debateRoom.ts。
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** 默认落盘目录：zhengming-server/rooms/ */
export const DEFAULT_ROOMS_DIR = path.resolve(HERE, "..", "rooms");

/** 房间 id 白名单：只允许小写字母、数字、连字符，防路径穿越 */
const ROOM_ID_RE = /^[a-z0-9][a-z0-9-]{2,63}$/;

export function isValidRoomId(roomId) {
  return typeof roomId === "string" && ROOM_ID_RE.test(roomId);
}

export class Store {
  constructor({ dir = DEFAULT_ROOMS_DIR } = {}) {
    this.dir = dir;
  }

  async ensureDir() {
    await fs.mkdir(this.dir, { recursive: true });
  }

  filePath(roomId) {
    if (!isValidRoomId(roomId)) {
      throw new Error(`invalid room id: ${roomId}`);
    }
    return path.join(this.dir, `${roomId}.json`);
  }

  /** 写入房间快照（原子写：先写临时文件再 rename） */
  async save(roomId, state) {
    await this.ensureDir();
    const target = this.filePath(roomId);
    const tmp = `${target}.${process.pid}.tmp`;
    const payload = JSON.stringify({ ...state, savedAt: new Date().toISOString() }, null, 2);
    await fs.writeFile(tmp, payload, "utf8");
    await fs.rename(tmp, target);
    return target;
  }

  /** 读取房间快照；不存在返回 null */
  async load(roomId) {
    try {
      const raw = await fs.readFile(this.filePath(roomId), "utf8");
      return JSON.parse(raw);
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
  }

  /** 列出全部房间 id（按 mtime 倒序） */
  async list() {
    await this.ensureDir();
    const names = await fs.readdir(this.dir);
    const ids = names.filter((n) => n.endsWith(".json")).map((n) => n.slice(0, -5));
    const withTime = await Promise.all(
      ids.map(async (id) => {
        const stat = await fs.stat(this.filePath(id));
        return { id, mtime: stat.mtimeMs };
      }),
    );
    return withTime.sort((a, b) => b.mtime - a.mtime).map((x) => x.id);
  }
}

export default Store;
