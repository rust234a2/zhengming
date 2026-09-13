# 事件推演实施计划

> 基线：`event-replay-PRD.md` v0.5（沉浸式历史角色扮演）、`IMPLEMENTATION-PATH.md` 阶段 0/4；2026-09-13 仓库状态。文件名沿用历史名称 `event-replay-*`，产品文案统一使用"事件推演"。

## 1. 目标与非目标

### 目标

- 在可部署的 `web/` 中新增 `?view=event&event=<eventId>`，完成事件选择、**角色位选择、逐幕扮演推进、账本与关系结算、自动收束结局**，以及终局**可选**的原作揭示。
- 以**沉浸式信息隔离**保证模拟层/事实层分离：`actAdvance` / `replayEnding` 的入参中**不含** `canon`（沉浸式下模型本来就不需要原作，调用隔离是天然属性）；推演期间界面不出现任何原作内容。
- 将事件准入、角色位差异、幕结构、动作数量、账本/关系合法性与原作来源固化为可测试的 schema/校验函数。
- 由 Host 生成推演追问（原料为动作的 `implicitAssumption`）与终局两条决策模式追问。
- 决定点、后果和终局追问通过稳定来源标识接入辩论树（`DebateOrigin = { kind:"event"; eventId; actIndex; positionId; moveLabel }`，不依赖生成文本）。

### 非目标

- 不预测未发生事件；**不扮演可识别的真实个人**（角色位一律改编为虚构位置）；不在运行时检索生成事实。
- 不判定选择对错或输赢；无分数、无排名；不收录私事、灾难、伤亡事件。
- **不做分支穷尽与回溯重走**——游戏里"选了就是选了"，代价不可撤销；可重复游玩性来自角色位，而非分支枚举。
- MVP 不建设真实同路人聚合、账号限频和跨设备持久化；F8 用静态演示数据。

## 2. 现状盘点

- `prototypes/event-replay-prototype.html` 是**静态数据版（v0.3 形态）**：第三人称观察、7 个决策节点、4 个结局、回溯、事实折叠、三列对照，`node prototypes/event-replay.test.mjs` 当前 26/26 通过。
- **用途变更（v0.5）**：该原型与 26 项测试**转为历史存档，不再用于演示**——其形态（观察者 + 剧透保护 + 三列对照）与本版（局内扮演 + 沉浸式隔离）已根本不同，演示旧形态会误导评审。离线兜底改用**录屏**或本地缓存生成结果。禁止为了"两版对齐"而回改静态版。
- 原型内不存在任何模型调用（`hint` 字段与 `REAL_HOST_QS` 均为静态常量），`realSource.url` 全为 `#`，不能算"真实事件入库"。
- `web/src/App.tsx` 只支持 `map / force / debate`；没有事件组件、事件类型、数据集或 Vitest 用例。`web/src/types/graph.ts` 是 D3 展示模型，`DebateTreePrototype.tsx` 使用私有树类型，尚不存在 PRD 所述共享 schema。
- `docs/design/host-contract.md`、Host 服务和持久化层尚未落地；且该契约目前只列了六个能力，**不含 `actAdvance` / `replayEnding` / `replayCanon`**，需在阶段 A 一并补齐。辩论树也不解析事件来源参数，因此 F6/F7 有明确前置依赖。
- `.worktrees/event-simulation` 与 `main` 同一提交且工作区干净，没有可复用的在途实现。

## 3. 架构与状态模型

### 3.1 数据与校验

新增 `web/src/types/eventReplay.ts`：

```ts
interface EventHeader {
  id: string;
  title: string;
  background: string;              // 背景陈述（年代 + 局面）
  adaptation: { peopleAliased: true; organizationsObscured: true; timeGranularity: "month" };
  admission: { publiclyDiscussed: true; disasterOrCasualty: false; reviewedAt: string };
  endingCondition: { kind: "actCount"; actCount: number };  // 本期：到达第 N 幕自动收束
}

interface Position {
  id: string;
  name: string;                    // 化名后的称呼
  stake: string;                   // 你在乎什么
  visible: string;                 // 你能看到的信息范围（关键字段）
  resources: string;               // 可动用的资源
  canDo: string[];                 // 你能发起哪类动作
  relations: { to: string; attitude: number }[];  // 与其他角色的初始态度
}

interface Act {
  index: number;
  month: string;
  text: string;                    // 外部事件（**锁定**，不因玩家选择改变）
}

interface CanonEntry {              // 原作轨迹：不展示、不注入模型
  actIndex: number;
  month: string;
  development: string;
  sources: { url: string; excerpt: string; reviewedAt: string }[];
}

interface Move {
  id: string;
  text: string;
  costHint: string;                // 代价提示（不给结果预告）
  implicitAssumption: string;      // 选它意味着你相信什么 —— F7 追问的原料
  label: string;                   // 语义标签，用于同路人对齐（F8）
}

interface LedgerDelta { time?: number; money?: number; relation?: number; health?: number; opportunity?: number }
```

`EventReplay` = `{ header, positions: Position[]（≥2 且 visible/resources 确有差异）, acts: Act[], canon: CanonEntry[] }`；后果、结局不进源数据（由模型生成）。

新增 `web/src/domain/eventReplay.ts`，导出：

- `validateEventReplay(event)`：来源为 https 知乎链接、`reviewedAt` 非空、`acts` 按 `index` 连续、准入底线（含**角色位 ≥2 且差异确凿**）、`actCount ≥ 2`。
- `validateActAdvanceResult(result)`：`moves.length` ∈ {2,3}、`outcome` 与 `nextScene` 非空、`relationDeltas` 指向存在的角色、结构内**不存在**任何 `canon` 字段、`atEnding` 与 `endingCondition` 一致。
- `assertNoCanonLeak(text, canon)`：原作关键词黑名单校验（真实人物名、机构名、原作结局关键词），返回命中列表——模型可能从背景知识里"猜到"真实结局并写进文案，这一层不能省。
- `assertWithinVisible(result, position)`：`nextScene.visibleFacts` 不得越出该角色位 `visible` 的范围（越界即拒收）。
- `applyLedger(ledger, deltas)` / `applyRelations(relations, deltas)`：纯函数结算；**关系反向限制动作**的判定（`relationGate`）也在领域层。
- `deriveDebateOrigin(actIndex, positionId, moveLabel)`：稳定来源标识，不依赖生成文本。

错误返回带字段路径的列表；应用启动时遇到非法事件数据直接拒绝展示。

### 3.2 运行状态

使用纯 reducer（`web/src/domain/eventReplayReducer.ts`）：

```ts
interface ReplayState {
  eventId: string;
  header: EventHeader;
  acts: Act[];
  positionId: string | null;        // 开局未选角色位
  actIndex: number;                 // 当前幕
  currentScene: string;             // 本幕处境（生成，限定在 visible 内）
  currentMoves: Move[];
  history: PlayedAct[];             // 已固化幕：{ actIndex, moveId, moveText, outcome, ledgerDeltas, relationDeltas }
  ledger: Ledger;                   // 时间/钱/关系/健康/机会
  relations: Record<string, number>;
  pending: boolean;
  pendingError: string | null;      // 「这一步暂时无法推进」等
  canonRevealed: boolean;           // 终局可选揭示，一次性开关
  ended: boolean;
}
```

动作固定为 `SELECT_POSITION / ACT_CHOSEN / ADVANCE_SUCCEEDED / ADVANCE_FAILED / REVEAL_CANON / RESTART`。

- `ACT_CHOSEN`：记录所选动作，进入 `pending`；此时禁用其他动作。
- `ADVANCE_SUCCEEDED`：把「决定 + 生成结果」固化为 `PlayedAct` 追加进 `history`，结算账本与关系，替换 `currentScene` / `currentMoves`；若 `atEnding` 则置 `ended`。
- `REVEAL_CANON`：仅在 `ended` 后可用；置 `canonRevealed` 并触发 `replayCanon` 请求。
- `RESTART`：清空全部运行态，回到角色位选择（换角色位重玩 = 从这里重新开始）。
- **没有 REWIND 动作**——代价不可撤销是本版的核心体验，回溯能力从 v0.4 设计中整体移除。
- 账本总账、关系终态、关键决定清单全部从 `history` 派生，不另存。

### 3.3 外部接口

- Host 依赖主线阶段 0 的 `HostClient`。事件推演用三个能力（签名见 PRD §9）：
  - `actAdvance(header, position, acts, actIndex, ledger, relations, history, chosenMoveId)`
  - `replayEnding(position, history, ledger, relations)`
  - `replayCanon(eventId)` —— **独立通道，仅终局可选揭示时调用，前端不预取**
  - 幕间追问沿用 `makeQuestion`；终局两条用 `terminalProbes`。
- **隔离硬约束（必须写成单测）**：`actAdvance` / `replayEnding` 的调用参数序列化后，不得包含 `canon` / `realChoice` / 真实人物真名。测试用 spy 捕获实际请求体断言。
- 组件接收可注入 client，测试用 mock client 返回固定 JSON。超时/失败显示「这一步暂时无法推进」+ 重试，**不把静态模板冒充模型结果**。
- 与辩论树约定 `DebateOrigin = { kind:"event"; eventId; actIndex; positionId; moveLabel }`。最低可用 URL 为 `?view=debate&event=<id>&act=<n>&pos=<pid>&label=<label>`；树侧据此生成/定位 root 并保存 `originRef`。反向入口 `?view=event&event=<id>&act=<n>`。在树侧支持前，按钮标记为未集成。
- 所有 Host 返回文本先过共享禁用词表；分享/导出/上树内容强制携带「**架空推演**」标识，原作揭示内容标「**史实**」。

## 4. 分阶段任务

### 阶段 A：锁定共享契约（主线前置）

1. 在 `main` 扩展 `docs/design/host-contract.md`，追加能力 7/8/9 的 JSON schema、正反例、错误结构与禁用词规则；**显式写入"能力 7/8 入参不得含 canon"这一条**。
2. 在 `main` 落地最小 Host 通道（`zhengming-server/`，`POST /api/host/:capability`，key 从 `DEEPSEEK_API_KEY` 读，请求上限 256KB、超时 30s），先打通 `checkRestatement` 再打通 `actAdvance`。
3. 辩论树模块确定 `DebateOrigin` 的读取、去重与持久化语义；同一 `eventId + actIndex + positionId + moveLabel` 重复进入应定位已有 root。
4. 明确事件数据审核责任人与同路人"小样本"阈值（<50 显示「样本尚少」）。依赖未完成时可用 mock client 推进纯领域层与 UI，但不得宣称 F1/F4/F5 完成。

### 阶段 B：领域层与种子数据（事件分支）

1. 新建 `web/src/types/eventReplay.ts`、`web/src/domain/eventReplay.ts`、`web/src/domain/eventReplayReducer.ts` 与 `web/tests/eventReplayDomain.test.ts`；先用 mock 幕跑通 reducer、账本/关系结算、关系反向限制与来源标识派生。
2. 新建 `web/src/data/eventReplays.ts`：**只放事件头 + 角色位 + 外部事件节拍 + 原作轨迹**（不预置选项、处境与结局——它们由模型生成）。老陈事件补齐 3 个角色位与可审核来源（禁止 `#`），再策划 2 个事件；每个事件 `acts` ≥3 幕、`canon` 逐幕有来源。
3. 为拒绝样本写 fixture 并断言校验失败：缺公共讨论、含伤亡、未匿名/时间过细、来源非 https、`acts.index` 不连续、**角色位只有 1 个或两个角色位 visible/resources 全同**。
4. 为 `validateActAdvanceResult` / `assertNoCanonLeak` / `assertWithinVisible` 写 fixture：动作数 1 或 4、`outcome` 为空、结构里混入 `canon` 字段、文案含真实人物名、`visibleFacts` 越出角色位信息范围 —— 全部必须被拒。

### 阶段 C：React 扮演体验（事件分支）

1. 新建 `web/src/ui/EventReplay.tsx` 与模块 CSS `web/src/ui/eventReplay.css`，避免在并行分支修改共享 `web/src/styles.css`。
2. 实现事件库选择、场景头（含改编声明）、**角色位选择卡**（stake / canDo / resources / 初始关系概览，不显示任何原作信息）、幕时间线、动作卡（代价提示 + 隐含假设折叠）、生成中/失败态、账本与关系面板、自动收束后的结局卡（无任何优劣评价），以及终局折叠入口「历史上实际发生了什么」（灰底 + 「史实」角标，玩家路径全程标「架空推演」）。移动端账本改为抽屉，不允许横向内容溢出。
3. 原作揭示用可访问的展开按钮和独立灰底区域；展开前 DOM 中不得渲染 canon 文本/溯源。同路人对比（F8）只在结束后出现，标注为演示数据。
4. 新建 `web/tests/eventReplay.test.tsx`，以角色/可访问名称测试行为（选位后进入第 1 幕、选择后禁用其他动作、生成失败可重试、关系反向限制使某动作不可选、结局后才能展开原作）。不复制原型 DOM 桩选择器。

### 阶段 D：Host 与辩论树闭环

1. 接入真 `actAdvance`：处理 loading、失败、重试、超时；固化原则——已生成的 `outcome` 作为锁定条件注入后续调用。
2. 接入真 `replayEnding` 与两条 `terminalProbes`；每条提供「转为辩论树追问」，携带 `DebateOrigin` 与追问正文的持久化 ID。
3. 接入 `replayCanon`：只在终局展开折叠时调用，前端不预取。
4. 动作卡和后果卡都提供「就这个选择开辩论」；集成测试验证新建、已有 root 定位、反向回到同一事件同一幕三条路径。

### 阶段 E：主线集成与生成物

1. 事件分支自测通过后合入 `main`；仅在 `main` 修改共享 `web/src/App.tsx`，注册 `event` 视图并加入落地页。若确需全局样式，再在此阶段改 `web/src/styles.css`。
2. **静态原型不再跟随本版变更**（已转历史存档）；如确需修 bug 只改 `prototypes/event-replay-prototype.html` 与 `prototypes/event-replay.test.mjs`，随后在 `main` 运行 `node prototypes/build-app.mjs`，绝不手改 `prototypes/zhengming-app.html`。
3. 按"辩论树 → 辩论间 → 事件推演"顺序合流，每次合流运行五套原型测试及 `web` 全套测试/构建。

## 5. 测试与验收

扮演式生成下无法用"可达性枚举"，改为三层：

- **契约层（确定性，mock Host）**：reducer 状态迁移、选位与重启、账本/关系结算、关系反向限制、`atEnding` 收束、失败态与重试。这一层追求精确断言。
- **不变量层（schema 校验）**：每幕动作 2-3 个、`outcome`/`nextScene` 非空、`visibleFacts` 不越出角色位、`relationDeltas` 指向存在的角色、到达 `endingCondition` 必出结局、事件数据合法（角色位 ≥2 且确有差异）。
- **合规层（真实联调）**：推演期间文案不含原作关键词与禁用词；`actAdvance`/`replayEnding` 请求体不含 canon（spy 断言）；`replayCanon` 只在终局展开时被调用；追问为假设澄清式、终局恰好两条；一切对外内容带「架空推演」标识。
- **闭环**：任一决定/后果能定位同一辩论 root；终局追问成为 `question` 节点；树可回到原事件同一幕同一角色位。
- **视觉与可访问性**：键盘可完成选位、选择、展开原作；焦点可见；桌面和窄屏无重叠；架空/史实两种内容有文字标签而非只靠颜色区分。

验收命令：

```bash
node prototypes/event-replay.test.mjs
cd web && npm test -- eventReplayDomain.test.ts eventReplay.test.tsx
cd web && npm test
cd web && npm run build
cd prototypes && node build-app.mjs && node app.test.mjs
```

## 6. 风险与待决策

| 项目 | 风险/决策 |
|---|---|
| Host 路线 D1 | 尚未决定原型 Node 服务或产品 core 通道；先锁定客户端接口，禁止事件模块自建第三套调用。 |
| 新能力未定稿 | `actAdvance` / `replayEnding` / `replayCanon` 尚未进入 `host-contract.md`，阶段 A 不完成则整个模块无法真跑通。 |
| 生成一致性 | 长扮演下模型可能与前文矛盾。缓解：固化原则 + `history` 注入 + mock 回归用例；但**无法保证 100%**，需接受并做重试与可读性检查。 |
| 角色信息越界 | 模型可能把其他角色位才知道的信息写进本位 `visibleFacts`。缓解：`assertWithinVisible` 拒收 + 重试；角色位 `visible` 写成可判定的范围描述而非模糊短语。 |
| 隔离是否真可靠 | 沉浸式下调用隔离是天然属性，但模型可能从背景知识里"猜到"真实结局——关键词黑名单兜底不能省。真实人物真名不得进事件头。 |
| 生成延迟与成本 | **D4 未拍板**：每幕一次模型调用会拖慢现场节奏。备选：幕预生成 / 流式输出 / 断网回退录屏演示。 |
| 数据真实性 | 老陈事件现有摘要不可直接上线；3 个事件的 `acts` + `canon` 需人工核验并记录审核时间，来源失效时下架而非静默替换。 |
| 伦理边界 | "不扮演可识别真实个人"是本版新增准入底线，审核清单必须显式检查角色位是否等于真人换名；分享内容的「架空推演」标识是防误传的关键，不可做成可关闭项。 |
| 同路人对齐粒度 | 生成式下只能按「幕序号 + 语义标签」近似聚合，标签由模型给出、稳定性未知。UI 必须标注近似，勿用"全站用户"措辞。 |
| 测试基线切换 | 原型 26 项测试不再覆盖本版实现，`web` 侧必须补齐，否则等于测试真空。 |

## 7. 完成定义

三个审核通过的事件在 `?view=event` 可完整扮演：选角色位 → 逐幕由真模型生成处境与动作 → 账本与关系随决定变化且关系反向限制动作 → 自动收束出连贯结局（无评分）→ 终局可选展开「历史上实际发生了什么」（带知乎溯源、标「史实」）；`actAdvance`/`replayEnding` 入参经 spy 断言不含 canon；`replayCanon` 仅在终局展开被调用；追问通过合规过滤；决定、后果与终局追问与辩论树双向可定位。领域层与交互层 Vitest 全绿、`web` 生产构建通过、五套原型测试全绿；生成物由构建脚本更新，提交中无占位来源、密钥或手工修改的生成文件。
