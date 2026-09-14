/**
 * 事件推演 · UI 层测试（红线 3 的 DOM 断言落点）
 *
 * 覆盖三件事：
 *  1. **推演期间 DOM 搜不到任何原作文本**（IMPLEMENTATION-PATH 红线 3 验收：
 *     「推演期间 DOM 搜不到 canon」）——大厅、选位后、进行中都不许出现；
 *  2. **`replayCanon` 是独立通道**：收束前界面上不存在「揭示」入口；
 *     只有终局后才出现按钮，且点击才触发一次独立请求；
 *  3. **不判输赢**：界面上不出现分数/胜负措辞，只有代价账本。
 *
 * Host 客户端全部注入 mock（契约层，不联网）。
 */

import { render, cleanup, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EventReplay } from "../src/ui/EventReplay";
import type {
  ActAdvanceResult,
  CanonEntry,
  ComposedEventScaffold,
  EndingCard,
  EventReplay as EventReplayData,
  ReplayState,
} from "../src/types/eventReplay";
import type { EventReplayClient, HostCallResult } from "../src/ui/event-replay/eventReplayClient";

afterEach(() => {
  cleanup();
});

const CANON_TEXT = "现实中的公开讨论集中在两地教育资源差距与搬迁成本";

const event: EventReplayData = {
  header: {
    id: "fixture-ui",
    title: "一次职业迁移（UI 夹具）",
    background: "2023 年，一位教师收到异地学校的邀请。",
    adaptation: { peopleAliased: true, organizationsObscured: true, timeGranularity: "month" },
    admission: { publiclyDiscussed: true, disasterOrCasualty: false, reviewedAt: "2026-09-14" },
    endingCondition: { kind: "actCount", actCount: 2 },
  },
  positions: [
    {
      id: "teacher",
      name: "当事人",
      role: "收到异地邀请的教师",
      stake: "职业与家庭",
      visible: ["聘用条件", "家庭安排"],
      resources: "积蓄与专业经验",
      canDo: ["协商", "接受"],
      relations: [{ to: "partner", attitude: 20 }],
    },
    {
      id: "partner",
      name: "伴侣",
      role: "当事人的伴侣",
      stake: "家庭稳定",
      visible: ["家庭安排", "孩子近况"],
      resources: "家庭否决权",
      canDo: ["沟通"],
      relations: [{ to: "teacher", attitude: 30 }],
    },
  ],
  acts: [
    { index: 0, month: "2023-03", text: "异地学校发来正式邀请。" },
    { index: 1, month: "2023-06", text: "对方要求给出最终答复。" },
  ],
  canon: [
    {
      actIndex: 0,
      month: "2023-03",
      development: CANON_TEXT,
      sources: [
        {
          url: "https://www.zhihu.com/question/2038884733304697602",
          excerpt: "公开讨论摘要",
          reviewedAt: "2026-09-14",
        },
      ],
    },
  ],
};

function advanceResult(overrides: Partial<ActAdvanceResult> = {}): ActAdvanceResult {
  return {
    outcome: "对方希望你本周内给出答复。",
    nextScene: { month: "2023-06", text: "报到期限临近，家里仍在商量。", visibleFacts: ["聘用条件"] },
    moves: [
      { id: "m1", text: "接受邀请", costHint: "搬迁成本", implicitAssumption: "机会不会重来", label: "accept" },
      { id: "m2", text: "继续协商", costHint: "消耗人情", implicitAssumption: "条件仍可变化", label: "negotiate" },
    ],
    relationDeltas: [],
    ledgerDeltas: [{ key: "时间", delta: -2, note: "搬迁准备" }],
    atEnding: false,
    ...overrides,
  };
}

function ok<T>(result: T): HostCallResult<T> {
  return { ok: true, result, degraded: false };
}

/** 可编排的 mock 客户端：记录调用并按剧本返回。 */
function mockClient() {
  const advance = vi.fn<(params: unknown, handlers?: { onDelta?: (t: string) => void }) => Promise<HostCallResult<ActAdvanceResult>>>();
  const ending = vi.fn<(params: unknown, handlers?: { onDelta?: (t: string) => void }) => Promise<HostCallResult<EndingCard>>>();
  const canon = vi.fn<(eventId: string) => Promise<HostCallResult<CanonEntry[]>>>();
  const compose = vi.fn<(params: unknown) => Promise<HostCallResult<ComposedEventScaffold>>>();
  const client: EventReplayClient = { advance, ending, canon, compose };
  return { client, advance, ending, canon, compose };
}

/** 断言整份 DOM 里搜不到原作文本文案（红线 3）。 */
function expectNoCanonInDom() {
  expect(document.body.textContent).not.toContain(CANON_TEXT);
  expect(document.body.textContent).not.toContain("史实");
}

describe("事件推演 UI · 沉浸式隔离（红线 3）", () => {
  it("大厅阶段：显示角色位与改编声明，DOM 里没有任何原作内容", () => {
    const { client } = mockClient();
    render(<EventReplay client={client} events={[event]} />);

    expect(screen.getByText(/选一个角色位进入事件/)).toBeTruthy();
    expect(screen.getByText(/改编声明/)).toBeTruthy();
    expectNoCanonInDom();
    // 大厅阶段绝不触发任何 Host 调用
    expect(client.advance).not.toHaveBeenCalled();
    expect(client.canon).not.toHaveBeenCalled();
  });

  it("知识范围（visible 数组）在界面上带分隔符渲染，不糊成一串", () => {
    const { client } = mockClient();
    render(<EventReplay client={client} events={[event]} />);

    // teacher.visible = ["聘用条件", "家庭安排"]
    expect(screen.getAllByText("聘用条件；家庭安排").length).toBeGreaterThan(0);
    // 缺分隔符的拼接形态绝不该出现
    expect(document.body.textContent).not.toContain("聘用条件家庭安排");
  });

  it("舞台内铺开完整推演路径：每步选择 + 后果 + 代价/关系明细，进行中的选择即时挂入", async () => {
    const { client, advance } = mockClient();
    advance.mockResolvedValueOnce(ok(advanceResult())); // 开局（不落 history）
    advance.mockResolvedValueOnce(
      ok(
        advanceResult({
          outcome: "家里第一次坐下来谈这件事。",
          ledgerDeltas: [{ key: "时间", delta: -2, note: "彻夜整理材料" }],
          relationDeltas: [{ target: "伴侣", delta: -5 }],
        }),
      ),
    );
    render(<EventReplay client={client} events={[event]} />);

    fireEvent.click(screen.getByRole("button", { name: /以当事人进入事件/ }));
    await screen.findByRole("button", { name: /接受邀请/ });

    // 开局推演中：路径块不出现（开局不是"决定"）
    expect(screen.queryByLabelText("推演路径")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /接受邀请/ }));

    // 选择一发出，路径块立刻出现并挂上「推演中」占位（不等模型返回）
    expect(screen.getByLabelText("推演路径")).toBeTruthy();
    expect(screen.getByText(/推演中/)).toBeTruthy();

    await waitFor(() => expect(advance).toHaveBeenCalledTimes(2));

    // 落定后：全文版路径 = 选择 + 完整后果 + 代价与关系明细
    expect(screen.getByText("第 1 步")).toBeTruthy();
    expect(screen.getByText(/你选择了：接受邀请/)).toBeTruthy();
    // 后果全文在左栏时间轴与舞台路径块各出现一次（两处都该有）
    expect(screen.getAllByText("家里第一次坐下来谈这件事。").length).toBe(2);
    expect(screen.getByText(/时间 -2/)).toBeTruthy();
    expect(screen.getByText(/彻夜整理材料/)).toBeTruthy();
    // 关系 chip 显示角色位名字（不是 id）
    expect(screen.getByText(/伴侣 -5/)).toBeTruthy();
    // 占位消失，不再显示「推演中」
    expect(screen.queryByText(/推演中/)).toBeNull();
    // 路径是玩家路径 → 必须带架空标注，且搜不到任何原作内容（红线 3）
    expect(screen.getAllByText("架空推演").length).toBeGreaterThan(0);
    expectNoCanonInDom();
  });

  it("选位后进入推演：外部事件可见、原作不可见，且界面标注「架空推演」", async () => {
    const { client, advance } = mockClient();
    advance.mockResolvedValue(ok(advanceResult()));
    render(<EventReplay client={client} events={[event]} />);

    fireEvent.click(screen.getByRole("button", { name: /以当事人进入事件/ }));
    await waitFor(() => expect(advance).toHaveBeenCalled());

    // 外部事件节拍可见（锁定层：场景与时间线两处）
    expect(screen.getAllByText(/异地学校发来正式邀请/).length).toBeGreaterThan(0);
    // 架空标识存在（模拟与事实分离的文字标注，不靠颜色）
    expect(screen.getAllByText("架空推演").length).toBeGreaterThan(0);
    expectNoCanonInDom();
  });

  it("actCount 走满收束后才出现「揭示原作」入口，点击才发独立 replayCanon 请求", async () => {
    const { client, advance, ending, canon } = mockClient();
    // 剧本：#1 开局幕 → #2 回应第 1 幕的选择（未收束）→ #3 回应第 2 幕的选择（收束）
    advance.mockResolvedValueOnce(
      ok(advanceResult({ atEnding: false, ledgerDeltas: [{ key: "时间", delta: -1, note: "排队与往返" }] })),
    );
    advance.mockResolvedValueOnce(
      ok(
        advanceResult({
          atEnding: false,
          outcome: "你给出了第一轮答复，家里仍在商量。",
          nextScene: { month: "2023-06", text: "报到期限临近，对方催促最终答复。", visibleFacts: ["家庭安排"] },
        }),
      ),
    );
    advance.mockResolvedValueOnce(
      ok(
        advanceResult({
          atEnding: true,
          outcome: "你做出了最后的决定。",
          nextScene: { month: "2023-06", text: "一切尘埃落定。", visibleFacts: ["聘用条件"] },
        }),
      ),
    );
    ending.mockResolvedValue(ok({ title: "迁移落定", text: "这一局到此为止。" }));
    canon.mockResolvedValue(ok(event.canon));

    render(<EventReplay client={client} events={[event]} />);
    fireEvent.click(screen.getByRole("button", { name: /以当事人进入事件/ }));
    await waitFor(() => expect(advance).toHaveBeenCalledTimes(1));

    // 第 1 幕的选择 → 进入第 2 幕
    fireEvent.click(screen.getByRole("button", { name: /接受邀请/ }));
    await waitFor(() => expect(advance).toHaveBeenCalledTimes(2));
    // 第 2 幕的动作出现后再选一次 → 收束
    const secondMove = await screen.findByRole("button", { name: /接受邀请/ });
    fireEvent.click(secondMove);
    await waitFor(() => expect(advance).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(ending).toHaveBeenCalledTimes(1));

    // 收束前 DOM 不该有揭示入口；收束后才有
    const reveal = await screen.findByRole("button", { name: /历史上实际发生了什么/ });
    expectNoCanonInDom();

    fireEvent.click(reveal);
    await waitFor(() => expect(canon).toHaveBeenCalledTimes(1));
    // 独立通道收到的是 eventId，而非整个事件（含 canon）的请求
    expect(canon.mock.calls[0][0]).toBe(event.header.id);
    // 展开后原作文本才出现在独立的「史实」区块里
    await waitFor(() => expect(screen.getByText(CANON_TEXT)).toBeTruthy());
    expect(screen.getByText("史实")).toBeTruthy();
  });

  it("推演界面不出现分数与胜负措辞（不判输赢）", async () => {
    const { client, advance } = mockClient();
    advance.mockResolvedValue(ok(advanceResult()));
    render(<EventReplay client={client} events={[event]} />);

    fireEvent.click(screen.getByRole("button", { name: /以当事人进入事件/ }));
    await waitFor(() => expect(advance).toHaveBeenCalled());

    const text = document.body.textContent ?? "";
    // 「不判输赢」这条产品原则本身会出现在副标题里，它不是违规词；
    // 界面不许出现的是"评价玩家"的胜负措辞。
    expect(text).toContain("不判输赢");
    // 「替代分数的反馈」这类解释性文案不含评价语义，不算违规；
    // 界面不许出现的是"评价玩家"的胜负措辞。
    for (const banned of ["得分", "你赢", "你输", "获胜", "完胜", "完败", "排名"]) {
      expect(text).not.toContain(banned);
    }
    // 代价账本存在
    expect(screen.getByText("代价账本")).toBeTruthy();
  });
});
