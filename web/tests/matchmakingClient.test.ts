import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMatch } from "../src/ui/useRoom";
import { readSeatToken } from "../src/domain/roomClient";

describe("createMatch：HTTP 撮合与预签令牌", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("发送明确的真人模式，并在返回前保存预签 seatToken", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        roomId: "room-human",
        side: "pro",
        seatToken: "token-human",
        mode: "human",
        status: "waiting",
        reason: "等待在线反方。",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createMatch({ topicId: "q1", side: "pro", mode: "human", name: "甲" });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      topicId: "q1",
      side: "pro",
      mode: "human",
      name: "甲",
      profile: null,
    });
    expect(result.status).toBe("waiting");
    expect(readSeatToken("room-human")).toBe("token-human");
  });

  it("发送明确的 AI 模式并保留服务端 Bot 房间响应", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        roomId: "room-ai",
        side: "con",
        seatToken: "token-ai",
        mode: "ai",
        status: "matched",
        reason: "已创建 AI 对手。",
      }),
    }));

    const result = await createMatch({ topicId: "q1", side: "con", mode: "ai", name: "乙" });

    expect(result).toMatchObject({ roomId: "room-ai", mode: "ai", status: "matched" });
    expect(readSeatToken("room-ai")).toBe("token-ai");
  });

  it("拒绝缺少预签令牌的成功响应，且不污染存储", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, roomId: "room-bad", mode: "human", status: "waiting" }),
    }));

    await expect(createMatch({ topicId: "q1", side: "pro", mode: "human", name: "甲" })).rejects.toThrow();
    expect(readSeatToken("room-bad")).toBeNull();
  });

  it("拒绝缺少撮合状态的畸形响应", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        roomId: "room-bad-state",
        side: "pro",
        seatToken: "token-bad",
        mode: "human",
        reason: "缺少 status。",
      }),
    }));

    await expect(createMatch({ topicId: "q1", side: "pro", mode: "human", name: "甲" })).rejects.toThrow();
    expect(readSeatToken("room-bad-state")).toBeNull();
  });

  it("优先透传服务端匹配错误", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, error: { code: "SIDE_TAKEN", message: "该立场刚被占用。" } }),
    }));

    await expect(createMatch({ topicId: "q1", side: "pro", mode: "human", name: "甲" }))
      .rejects.toThrow("该立场刚被占用。");
  });
});
