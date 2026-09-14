import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SEAT_TOKEN_PREFIX } from "../src/domain/roomClient";
import { DebateRoom } from "../src/ui/DebateRoom";
import { CREATED_ROOM_STORAGE_KEY } from "../src/ui/debate-room/roomStorage";

vi.mock("../src/ui/useRoom", () => ({
  createMatch: vi.fn(),
  useTopics: () => ({
    topics: [],
    loading: false,
    error: null,
    hostConfigured: true,
    reload: vi.fn(),
  }),
  useRoom: ({ enabled, side }: { enabled: boolean; side: "pro" | "con" | null }) => ({
    state: null,
    mySide: side,
    connection: enabled ? "open" : "idle",
    error: enabled ? "seat token is not valid for this room" : null,
    errorCode: enabled ? "INVALID_SEAT_TOKEN" : null,
    resumed: false,
    send: vi.fn(),
    leave: vi.fn(),
    clearError: vi.fn(),
  }),
}));

describe("辩论间失效席位恢复", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    window.history.replaceState(null, "", "/?view=room&room=room-stale&side=pro");
  });

  it("自动清掉旧房间记录与 token，并返回匹配页", async () => {
    window.sessionStorage.setItem(
      CREATED_ROOM_STORAGE_KEY,
      JSON.stringify({
        roomId: "room-stale",
        topicId: "topic-1",
        side: "pro",
        at: "2026-09-14T00:00:00.000Z",
      }),
    );
    window.sessionStorage.setItem(`${SEAT_TOKEN_PREFIX}room-stale`, "stale-session-token");
    window.localStorage.setItem(`${SEAT_TOKEN_PREFIX}room-stale`, "stale-legacy-token");

    render(<DebateRoom />);

    expect(await screen.findByText("席位凭证已失效，已清理旧房间记录，请重新匹配。")).toBeInTheDocument();
    expect(screen.getByText("开一间辩论间")).toBeInTheDocument();
    expect(window.sessionStorage.getItem(CREATED_ROOM_STORAGE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(`${SEAT_TOKEN_PREFIX}room-stale`)).toBeNull();
    expect(window.localStorage.getItem(`${SEAT_TOKEN_PREFIX}room-stale`)).toBeNull();
    await waitFor(() => expect(window.location.search).toBe("?view=room"));
  });
});
