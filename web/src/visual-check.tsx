/**
 * 临时视觉夹具（截图后删除）：给 EventReplay 注入脚本化 mock 客户端，
 * 自动走完一局，用于在真浏览器里核对三栏版式与终局遮罩。
 *
 * 用法：/?view=event 换成 /visual-check.html?auto=play|ending
 */

import { createRoot } from "react-dom/client";

import { EventReplay } from "./ui/EventReplay";
import type { EventReplayClient } from "./ui/event-replay/eventReplayClient";
import type { ActAdvanceResult, CanonEntry, EndingCard, EventReplay as EventReplayData } from "./types/eventReplay";

const CANON: CanonEntry[] = [
  {
    actIndex: 0,
    month: "2023-03",
    development: "现实中的公开讨论集中在两地教育资源差距与搬迁成本，当事人的孩子最终没有转学。",
    sources: [
      {
        url: "https://www.zhihu.com/question/2038884733304697602",
        excerpt: "知乎讨论摘要：跨市调动案例近年上升，但成功率口径不一。",
        reviewedAt: "2026-09-14",
      },
    ],
  },
];

const EVENT: EventReplayData = {
  header: {
    id: "visual-fixture",
    title: "一次职业迁移",
    background:
      "2023 年，一位在苏北任教二十年的骨干教师收到苏南一所新建学校的邀请：对方给出编制、安家补贴与子女随迁就读的初步条件，但要求在本学期结束前答复。",
    adaptation: { peopleAliased: true, organizationsObscured: true, timeGranularity: "month" },
    admission: { publiclyDiscussed: true, disasterOrCasualty: false, reviewedAt: "2026-09-14" },
    endingCondition: { kind: "actCount", actCount: 2 },
  },
  positions: [
    {
      id: "teacher",
      name: "当事人 · 陈老师（化名）",
      stake: "职业上升空间与孩子的教育机会",
      visible: "聘用条件、家庭安排、孩子升学节点",
      resources: "二十年教龄与业内口碑",
      canDo: ["协商条件", "接受邀请", "放弃邀请"],
      relations: [{ to: "partner", attitude: 20 }],
    },
    {
      id: "partner",
      name: "伴侣 · 林女士（化名）",
      stake: "家庭稳定与自己的职业连续性",
      visible: "家庭收支、孩子近况",
      resources: "自己的工作与家庭否决权",
      canDo: ["沟通", "提出条件", "拒绝搬迁"],
      relations: [{ to: "teacher", attitude: 30 }],
    },
  ],
  acts: [
    { index: 0, month: "2023-03", text: "异地学校发来正式邀请，要求在学期结束前答复。" },
    { index: 1, month: "2023-06", text: "对方催促最终答复，家里仍在商量。" },
  ],
  canon: CANON,
};

let call = 0;
/**
 * 三段推进（actCount = 2 时的真实调用序列）：
 *   #0 覆盖调用（chosenMoveId=null，actIndex 0，atEnding false）
 *   #1 回应第 1 幕的决定（actIndex 仍是 0，atEnding false）
 *   #2 回应第 2 幕的决定（actIndex 1 → 1+1>=2，atEnding true）
 */
const ADVANCE: ActAdvanceResult[] = [
  {
    outcome: "你先没有答复，把条件整理成了一页纸：编制、安家补贴、孩子学位，逐条列清楚。",
    nextScene: { month: "2023-06", text: "报到期限临近，对方要求本周内给出准信。", visibleFacts: ["聘用条件"] },
    moves: [
      { id: "m1", text: "接受邀请，本周内答复", costHint: "搬迁成本与家庭安置", implicitAssumption: "机会不会重来", label: "accept" },
      { id: "m2", text: "继续协商，争取更多条件", costHint: "消耗人情", implicitAssumption: "条件仍可变化", label: "negotiate" },
      { id: "m3", text: "放弃邀请，留在原校", costHint: "放弃一次窗口", implicitAssumption: "留在原校仍有上升通道", label: "decline", relationGate: { positionId: "teacher", minimum: 10 } },
    ],
    relationDeltas: [],
    ledgerDeltas: [],
    atEnding: false,
  },
  {
    outcome: "你把答复件反复改了三遍，最后仍然是签了字；家里为此开了两次家庭会议。",
    nextScene: { month: "2023-09", text: "手续办完，你把这学期的课交接给了同事。", visibleFacts: ["聘用条件", "家庭安排"] },
    moves: [
      { id: "m4", text: "带家人一起搬过去", costHint: "两地生活成本", implicitAssumption: "家人愿意同行", label: "move-family" },
      { id: "m5", text: "自己先去，家人留一学期", costHint: "长期分居", implicitAssumption: "分居不会影响孩子备考", label: "move-alone" },
    ],
    relationDeltas: [{ positionId: "partner", amount: -5 }],
    ledgerDeltas: [{ time: -2, money: -1 }],
    atEnding: false,
  },
  {
    outcome: "行李箱装到一半，你停下来给原来的教研组长发了条消息，说等安顿好了就回来看他们。",
    nextScene: { month: "2024-01", text: "新学校的第一学期开始了。", visibleFacts: ["聘用条件"] },
    moves: [
      { id: "m6", text: "把课备到极致，等一个机会", costHint: "时间与健康", implicitAssumption: "成绩能被看见", label: "grind" },
      { id: "m7", text: "主动找校长谈带毕业班", costHint: "人情与风险", implicitAssumption: "校长愿意给机会", label: "ask" },
    ],
    relationDeltas: [{ positionId: "partner", amount: -8 }],
    ledgerDeltas: [{ time: -3, health: -1, opportunity: 1 }],
    atEnding: true,
  },
];

const client: EventReplayClient = {
  async advance() {
    const result = ADVANCE[Math.min(call, ADVANCE.length - 1)];
    call += 1;
    return { ok: true, result, degraded: false };
  },
  async ending(): Promise<{ ok: true; result: EndingCard; degraded: boolean }> {
    return {
      ok: true,
      result: {
        title: "迁移落定",
        text: "两年后你带上了毕业班，孩子在新的城市慢下来。账本上没有胜负，只有你换出去的时间和换回来的东西。",
      },
      degraded: false,
    };
  },
  async canon() {
    return { ok: true, result: CANON, degraded: false };
  },
};

const mode = new URLSearchParams(window.location.search).get("auto") ?? "play";
const root = createRoot(document.getElementById("visual-root")!);
root.render(<EventReplay client={client} events={[EVENT]} />);

function click(selector: string): boolean {
  const el = document.querySelector<HTMLButtonElement>(selector);
  if (!el) return false;
  el.click();
  return true;
}

/** 自动驱动：选位（只点一次）→ 逐个点第一个动作；mode=ending 时一直点到终局遮罩出现。 */
let positionChosen = false;
let movesClicked = 0;

window.setTimeout(function step() {
  if (document.querySelector(".er-mask")) {
    // 终局遮罩出现后展开对照表
    if (mode === "ending" && !document.querySelector(".er-cmp td.real")) {
      window.setTimeout(() => click(".er-canon-entry .er-btn-primary"), 200);
    }
    return;
  }

  if (!positionChosen) {
    positionChosen = click(".er-col-c ul.er-opts > li > .er-opt:not(:disabled)");
    window.setTimeout(step, 300);
    return;
  }

  // 角色位已定：只点中栏「可选动作」里的动作，绝不重复点角色位（重复选位会重置幕序）
  const moveSelector = ".er-col-c ul[aria-label='可选动作'] .er-opt:not(:disabled)";
  if (click(moveSelector)) {
    movesClicked += 1;
    if (mode === "play" && movesClicked >= 1) {
      // 走一步即可：等后果卡渲染完再停
      window.setTimeout(() => {
        if (!document.querySelector(".er-conseq")) window.setTimeout(step, 200);
      }, 600);
      return;
    }
  }
  window.setTimeout(step, 300);
}, 300);
