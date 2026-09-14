import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createRoomState } from "../src/domain/debateRoom";
import type { RoomState } from "../src/types/debateRoom";
import { DebateRoom } from "../src/ui/DebateRoom";

const send = vi.fn();

const state: RoomState = {
  ...createRoomState({
    roomId: "room-ai-feedback",
    match: {
      mode: "ai",
      status: "matched",
      reason: "已创建 AI 对手。",
      requestedAt: "2026-09-14T00:00:00.000Z",
    },
    topic: {
      questionId: "topic-ai",
      title: "AI 会取代程序员吗？",
      url: "https://example.com/topic-ai",
      paired: true,
      pro: { id: "pro", claim: "程序员仍会存在", author: "甲", voteUp: 1, url: "https://example.com/pro" },
      con: { id: "con", claim: "程序员岗位会减少", author: "乙", voteUp: 1, url: "https://example.com/con" },
    },
    now: "2026-09-14T00:00:00.000Z",
  }),
  phase: "opening",
  turnSeat: "pro",
  seats: {
    pro: { name: "体验者", connected: true, isBot: false },
    con: { name: "争鸣 AI", connected: true, isBot: true },
  },
  briefs: {
    pro: { conclusion: "程序员仍会存在", reasons: ["工程责任仍需由人承担"] },
    con: { conclusion: "程序员岗位会减少", reasons: ["常规编码可被自动化"] },
  },
};

vi.mock("../src/ui/useRoom", () => ({
  createMatch: vi.fn(),
  useTopics: () => ({ topics: [], loading: false, error: null, hostConfigured: true, reload: vi.fn() }),
  useRoom: () => ({
    state,
    mySide: "pro",
    connection: "open",
    error: null,
    errorCode: null,
    aiThinking: false,
    resumed: false,
    send,
    leave: vi.fn(),
    clearError: vi.fn(),
  }),
}));

describe("辩论间即时反馈", () => {
  beforeEach(() => {
    send.mockClear();
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/?view=room&room=room-ai-feedback&side=pro");
  });

  it("点击提交后立即显示本方内容和 AI 思考态，不等待服务端快照", async () => {
    render(<DebateRoom />);
    const input = await screen.findByPlaceholderText("把刚才填的结构用完整的话说出来。");
    fireEvent.change(input, { target: { value: "这是刚刚提交的开篇陈述。" } });
    fireEvent.click(screen.getByRole("button", { name: "提交开篇陈述" }));

    expect(send).toHaveBeenCalledWith({ kind: "submitOpening", text: "这是刚刚提交的开篇陈述。" });
    const pendingTurn = screen.getByRole("article", { name: "待发送发言" });
    expect(within(pendingTurn).getByText("这是刚刚提交的开篇陈述。")).toBeInTheDocument();
    expect(within(pendingTurn).getByText("发送中")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("AI 正在思考");
    expect(screen.getByRole("button", { name: "提交开篇陈述" })).toBeDisabled();
  });
});
