/**
 * 辩论间 · 本地房间记忆（sessionStorage）
 *
 * 只记「这个窗口自己开的房」，用于：
 *  - 刷新后能回到刚才那一局
 *  - 避免误入别人分享的房间
 *
 * 用 **sessionStorage** 而不是 localStorage：同一浏览器两个窗口要能各开各的房
 * （ROLLOUT §1 约束 3 的同一套理由）。
 */

export const CREATED_ROOM_STORAGE_KEY = "zhengming.room.created";

export interface CreatedRoomRecord {
  roomId: string;
  topicId: string;
  side: "pro" | "con";
  at: string;
}

export function rememberCreatedRoom(record: CreatedRoomRecord): void {
  try {
    window.sessionStorage.setItem(CREATED_ROOM_STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* 存储不可用：不影响本局 */
  }
}

export function readCreatedRoom(): CreatedRoomRecord | null {
  try {
    const raw = window.sessionStorage.getItem(CREATED_ROOM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CreatedRoomRecord;
    if (!parsed?.roomId || typeof parsed.roomId !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function forgetCreatedRoom(): void {
  try {
    window.sessionStorage.removeItem(CREATED_ROOM_STORAGE_KEY);
  } catch {
    /* 忽略 */
  }
}

/** 从 URL 读房间号（邀请链接 `/ ...?view=room&room=xxx`） */
export function readRoomFromUrl(): { roomId: string | null; side: "pro" | "con" | null } {
  if (typeof window === "undefined") return { roomId: null, side: null };
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("room");
  const sideParam = params.get("side");
  const side = sideParam === "pro" || sideParam === "con" ? sideParam : null;
  return { roomId: roomId && /^[a-z0-9-]+$/.test(roomId) ? roomId : null, side };
}
