# 辩论间落地计划（v0.7 · 真实多人 + 真实 LLM）

2026-09-14 · 对应决策点 **D8**（真实多人房间）与 **D9**（Host 上游 StepFun）
目标：**两个人能真的进入同一个辩论间，按五阶段把一场辩论打完**（可用程度），Host 接真实 LLM。

---

## 0. 一句话范围

把「辩论间」从原型（固定 Bot + 本地启发式 + 单文件 HTML）升级为**桌面端的第三个视图**，
并新建 `zhengming-server/` 承载 **Host（LLM）** 与 **房间（WebSocket）** 两件事。

不做：知乎 OAuth、自动排队撮合、辩论树集成、账号系统。

---

## 1. 三个必须解决的现实约束

| # | 约束 | 对策 |
|---|---|---|
| 1 | **模型 key 不能进浏览器**。前端直接调 StepFun 会把 key 暴露给任何打开 F12 的人 | key 只在 `zhengming-server/` 读 `process.env.STEPFUN_API_KEY`；前端只调 `/api/host/*` |
| 2 | **没有后端，双方无法共享状态**。localhost 上两个标签页是两台"客户端" | 新建 WebSocket 房间服务，**服务端权威**：客户端只发动作，服务端广播状态快照 |
| 3 | **同一浏览器多标签页共用 localStorage**，席位令牌会撞车 | 席位令牌按**窗口**分配（`sessionStorage` 优先）；演示真人对局用「一个正常窗口 + 一个隐身窗口」或两台设备 |

---

## 2. 架构

```
浏览器窗口 A（正方）            浏览器窗口 B（反方）
   │  WebSocket                     │
   └──────────┬─────────────────────┘
              ▼
    zhengming-server/  (单进程 · 单端口)
      ├── POST /api/host/:capability   → StepFun chat/completions（key 只在服务端）
      ├── GET  /api/rooms/:id          → 房间快照（含报告）
      ├── WS   /ws/room                → 房间实时通道（权威状态机在这里）
      └── rooms/<id>.json              → 对局报告落盘（D5）
```

**职责边界**：规则/纯函数放 `web/src/domain/debateRoom.ts`（可单测、无 IO）；
服务端只负责**校验 + 广播 + 落盘**，不复制业务规则（它 import 同一份 `domain` 纯函数）。

---

## 3. 服务端：`zhengming-server/`

```
zhengming-server/
├── server.mjs            # HTTP + WS 入口，单端口
├── lib/host.mjs          # Host 七能力 → StepFun 调用（含禁用词过滤、幂等、超时）
├── lib/room.mjs          # 房间生命周期（create/join/action/leave/cleanup）
├── lib/store.mjs         # rooms/<id>.json 读写（幂等、404）
├── lib/deepseek-legacy.mjs  # （不建）DeepSeek 相关配置作废，仅保留注释说明
└── README.md             # 启动方式、环境变量、限制说明
```

### 3.1 Host 能力（对齐 host-contract.md 七个）

辩论间消费其中四个：`structureHint` / `makeQuestion` / `opponent.*`（Bot 兜底用）/ `evaluate`。
其余三个（`terminalProbes` / `actAdvance` / `replayEnding`）供事件推演，本期**一并实现**但不在辩论间路径上。

**统一信封**（契约 §0.1）：`{ok, capability, requestId, result}` / `{ok:false, error:{code,message,requestId}}`。
**错误码**：`VALIDATION` / `CAPABILITY_NOT_FOUND` / `PAYLOAD_TOO_LARGE` / `TIMEOUT` / `UPSTREAM` / `CONTENT_REJECTED`。
**禁用词表**（硬约束）：`错误|谬误|偷换|输赢|对错|你错了|赢了` 命中即 `CONTENT_REJECTED`（重试 1 次）。
**幂等**：同 `requestId` 返回缓存。
**无 key 降级**：读不到 `STEPFUN_API_KEY` 时，`/api/host/*` 返回**明确标记的降级结果**（`degraded: true`，走启发式），
前端在界面明示「模拟」，**绝不静默假装是真实模型输出**。

### 3.2 房间（WS 消息契约）

**客户端 → 服务端**（动作）
```
{type:"join",   roomId, seatToken?, side?}       // 加入或重连
{type:"action", roomId, action:{kind,payload}}   // pickSide/submitBrief/submitOpening/ask/answer/react/freeSpeak/submitClosing
{type:"leave",  roomId}
```

**服务端 → 客户端**
```
{type:"state",   roomId, state:<RoomState>}      // 权威快照，客户端整体替换本地状态
{type:"event",   roomId, event:{kind, at, ...}}  // 轻量通知（对方上线/离席/阶段推进）
{type:"error",   code, message}
```

**规则**：所有动作先过 `domain/debateRoom.ts` 的 `transition()`；不合法则回 `error` 且**不动状态**。

---

## 4. 领域内核：`web/src/domain/debateRoom.ts` + `types/debateRoom.ts`

照 `domain/eventReplay.ts` 的既有架构（纯函数 + 类型分离）。

```ts
export type RoomPhase =
  | "waiting"                                   // 等待对手（另一席位未占）
  | "opening"                                   // ① 立论（双方各填结构 + 开篇）
  | "crossAnswer" | "crossAsk" | "crossReact"   // ② 质询轮
  | "free"                                      // ③ 自由对辩
  | "closing"                                   // ④ 结辩
  | "settled";                                  // ⑤ 终局

export type RoomAction =
  | { kind: "pickSide"; side: "pro" | "con" }
  | { kind: "submitBrief"; brief: OpeningBrief }
  | { kind: "submitOpening"; text: string; evidence?: string }
  | { kind: "ask"; targetItem: BriefItemKey; question: string }
  | { kind: "answer"; text: string }
  | { kind: "react"; reaction: "accept" | "press"; text?: string }
  | { kind: "freeSpeak"; freeType: FreeType; text: string }
  | { kind: "submitClosing"; text: string; revision?: { from: string; to: string } }
  | { kind: "leave" };

export function transition(state: RoomState, actor: SeatId, action: RoomAction)
  : { ok: true; state: RoomState } | { ok: false; code: string; message: string };
```

**不变量**（写单测）：理由至少 1 条 · 每方最多 2 问（首次 + 1 次追问）· 提问方接受后提前结束 ·
第 2 问被回答后自动推进 · 每方自由发言 1 次 · 质询一问一答 · 轮次走满即 `settled` ·
人工不判断回避，服务端在 `settled` 后分别以正/反方视角调用 Host `evaluate`，对照问答 transcript 在「回应」维度评分，合并双方画像后再落盘与广播 · **无 `winner`/`rank`/胜负字段** · 禁用词不入库。

**纯函数**：`rankCandidates()`（画像相近度，D-1）、`settleMp()`（段位结算）、`buildReport()`（对局报告）、`tierOf()`。

---

## 5. 真实业务数据：`web/src/data/debateRoomTopics.ts`

从 `research/controversy-map/claims.json`（27 真实议题 / 37 真实论点 / 真实作者 / 赞同数 / 知乎原文 URL）生成。

**数据不足的实情**：只有 **2 个议题**天然同时有正反论点。对策：
- 以这 2 个真实议题为**首选**（`AI 写程序的能力毋庸置疑很强大,为何没有取代程序员`、`如果人人都可以通过 AI 写代码,程序员还需要存在吗`）；
- 其余议题按 **同一 `reasonType` 跨议题配对**（如「人类特质」正 vs「技术壁垒」反），并在 UI 标注**「跨议题配对」**，不假装是同一议题的正反方；
- **provenance 红线**：保留真实作者、赞同数、`url`；不做任何数据伪造。

---

## 6. 前端：`web/src/ui/DebateRoom.tsx`

对齐 `prototypes/debate-room-prototype.html`：三栏（左：议题/阶段/席位/段位/规则 · 中：发言流+输入区 · 右：本场记录+图例）+
选边遮罩 + 撮合动效 + 五阶段输入区 + 对局报告（六维 SVG 雷达 + 段位结算 + MP 明细）。
接入方式：`App.tsx` 加 `?view=room`，顶栏加第三个标签（与「缩进树 | 争议地图」并列）。

---

## 7. 推进顺序（先后端后前端）

| 步 | 内容 | 验收 |
|---|---|---|
| S1 | `zhengming-server/` 骨架 + Host 四能力 + StepFun 接入 + 禁用词/幂等/降级 | `curl` 各能力返回合规；无 key 时降级标记正确；禁用词命中被拒 |
| S2 | `domain/debateRoom.ts` + `types/debateRoom.ts` + 单测 | 五阶段全流程纯函数测试通过；不变量与非法规跃迁有对应用例 |
| S3 | WS 房间 + `rooms/<id>.json` 落盘 | 两个 `node` 脚本客户端可开房、走完整流程、报告落盘可回读 |
| S4 | `data/debateRoomTopics.ts`（真实数据生成） | 生成物含真实 author/url/voteUp；成对议题可开局 |
| S5 | `ui/DebateRoom.tsx` + `?view=room` + 顶栏标签 + 测试 | `npm test` / `tsc -b` / `vite build` 全绿；TDD 覆盖阶段推进与报告 |
| S6 | 真人对局人工验收（双窗口） | 两个浏览器上下文走完五阶段；报告一致；离席 MP -5 生效 |

---

## 8. 风险

| 风险 | 处理 |
|---|---|
| WS 与 Vite dev server 跨端口（5299 vs 服务端口） | 服务端开 CORS；或 Vite `server.proxy` 转发 `/api` 与 `/ws`（优先，避免跨域） |
| StepFun 无 key / 额度不足 | 降级路径 + UI 明示；不阻塞流程（流程可全走启发式） |
| 真实多人演示受限于同机 localStorage | 文档明说「一个正常窗口 + 一个隐身窗口」；`sessionStorage` 优先分配席位令牌 |
| 服务端复制业务规则导致与前端不一致 | 服务端 **import 同一份 domain 纯函数**，不重写 |
| 报告含用户输入（可能含个人经历） | `rooms/*.json` 加入 `.gitignore`；README 说明本地存储 |
