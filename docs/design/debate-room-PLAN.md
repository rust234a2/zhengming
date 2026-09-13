# 辩论间实施计划

对齐 PRD 版本：**v0.4**（去树化 · 轮次制） · 2026-09-13 · 基线原型 `prototypes/debate-room-prototype.html`

> **v0.4 同步说明**：PRD 删除了「论证树预提交」「终局互认」「一键上树」，流程由七阶段收敛为六阶段、在轮次结束后即完成。本计划相应改动：① `RoomPhase` 去掉 `pretree` 与 `acknowledgement`；② `DebateRoomState` 去掉 `trees` 与 `acknowledgements`；③ **原「与辩论树负责人共同冻结 Settlement 与树写入接口」的闸口取消**，阶段 A 只剩契约与服务端两条；④ 终局产物改名 `RoomReport`，落点待定（见 §6 待决策 W1）。

## 1. 目标与非目标

目标是把 `prototypes/debate-room-prototype.html` 已验证的**六阶段**交互，从"固定 Bot + 本地启发式"升级为可接真实 Host、可解释匹配、可产出对局报告的模块，并保持"不判输赢、先承认再推进、Host 只提示不代写"的产品红线。

**不做什么（明确排除）**：

- 不重做视觉稿，不扩展快速/完整双模式
- 不在本阶段实现知乎 OAuth
- **不引入辩论树**：不预提交树、不点选树节点、不写回树、不消费树 schema（移入 PRD §12「暂不纳入」）
- **不做终局互认 / 对手承认 / 荣誉授予**——结果不由对方决定
- 不把模型对手包装成"真人实时对局"

真正的多人实时房间仍缺身份、候选池、房间生命周期和消息传输契约，须单独决策后再承诺。

## 2. 现状盘点

- `prototypes/debate-room-prototype.html` **已于 2026-09-13 同步 v0.4**：六阶段 `idle → concept → opening → cross-* → free → closing → end`（`setStage(0..5)`），`pretree` 与终局互认已删除；立论为「立论结构 + 开篇陈述」且不上共享画板（右栏改为「本场记录」），质询按立论结构条目定位，终局卡为「对局报告」，「沉淀/进入辩论树」出口已移除，自动演示同步为六阶段脚本。
- `prototypes/debate-room.test.mjs` 已随原型同步为 **60 项全绿**（v0.3 的 41 项去除互认/预提交用例后重写并补负向路径），是后续替换实现时的行为基线；但 DOM 桩不能发现事件绑错节点、遮罩层冲突等浏览器问题。
- `CONCEPTS`、`BOT_TREE/BOT_OPENING/BOT_QUESTION/BOT_ANSWERS`、`startMatch()` 和 `evaluate()` 均为硬编码或启发式，没有网络、持久化或真实匹配。
- `prototypes/build-app.mjs` 通过字符串提取和 IIFE 包装集成原型，依赖内联 `<script>`、固定 DOM id 与 CRLF 兼容正则；`prototypes/zhengming-app.html` 是生成物。
- `web/` 只有 `map`、`force`、`debate` 三个 React 视图，**没有辩论间路由或房间类型**。对应 worktree `feat/debate-room` 与 `main` 同源且干净。
- `host-contract.md` 与 `zhengming-server/` **尚不存在**。可持久化的树 / `settlement` schema 也不存在——**但 v0.4 之后辩论间不再依赖它**。

## 3. 架构与状态模型

把状态迁移规则作为深模块，界面只派发事件并渲染状态。建议使用可判别联合：

```ts
type RoomPhase =
  | "matching" | "concept" | "opening"
  | "crossAnswer" | "crossAsk" | "crossReact"
  | "free" | "closing" | "settled";

interface DebateRoomState {
  roomId: string;
  phase: RoomPhase;
  topic: TopicRef;
  participants: [Participant, Participant];
  definitions: DefinitionChoice[];
  briefs: Record<ParticipantId, OpeningBrief>;   // 立论结构（结论/理由/依据），非树
  transcript: Turn[];
  crossExaminations: CrossExamination[];
  report?: RoomReport;
}
```

与 v0.3 的差别：删 `"pretree" | "acknowledgement"` 两个 phase；删 `trees`（`MiniArgumentTree`）与 `acknowledgements` 两个字段；`Settlement` → `RoomReport`。

状态迁移的接口统一为 `transition(state, event) -> Result<state, DomainError>`；它负责**“理由至少一条、概念最多重选两次、追问最多一次、每方自由发言一次、轮次走满即结算”**等不变量。每条 `Turn` 使用稳定 id、`authorId`、`kind`、`targetBriefItem`（指向对方立论结构的条目）、`evidenceStatus` 与时间戳，禁止再从已转义 HTML 反推业务数据。

外部能力放在三个 seam：`HostClient`、`MatchRepository`、`RoomReportSink`。生产 Adapter 分别调用服务端 Host、候选池和报告存储；测试 Adapter 返回确定结果。Host 接口至少包含 `alignConcepts`、`structureHint`、`makeQuestion`、`opponent.opening/answer/question`、`evaluate`。异步请求携带 `roomId + turnId + requestId`，重复响应必须幂等，失败时保留草稿并允许重试。

> **红线 1 的落点（见 §6 待决策 W2）**：`checkRestatement` 是否保留为"发言前闸门"会影响 `HostClient` 的接口面，需先定。

## 4. 分阶段任务

### 阶段 A：Host 地基先落地（`main`）

1. 新建 `docs/design/host-contract.md`，为 Host 能力补 JSON schema、正反例、结构化错误与禁用词校验；先由产品确认契约。
   > **v0.4 变化**：辩论间只需 `alignConcepts` / `structureHint` / `makeQuestion` / `opponent.*` / `evaluate` 五组；树相关能力不再由本模块驱动。
2. 决定 D1。默认采用演示优先路线 A，在 `zhengming-server/server.mjs` 提供静态托管和 `POST /api/host/:capability`；密钥仅从 `DEEPSEEK_API_KEY` 读取，请求上限 256 KB、超时 30 秒。
   > **已取消**：v0.3 的 A3「与辩论树负责人共同冻结 `Settlement` 和树写入接口」。辩论间不再写树，这条闸口消失，阶段 A 可独立推进。

依赖：A1 是全部 Host 工作的闸口（但**不再是跨模块闸口**）。共享文件和 `zhengming-server/` 只在 `main` 修改，随后合并到模块 worktree。

### 阶段 B：固化领域内核（`feat/debate-room`）

1. ✅ **（2026-09-13 已完成）原型已改为 v0.4 六阶段**：
   - 删 `pretree` 阶段与 `renderPreTree()`、`myTree` 相关逻辑；`setStage` 的 0..6 改为 0..5
   - 立论改为填写「立论结构」（结论 / 理由 1-2 / 依据），**不上共享画板**；质询改按条目定位
   - 删终局互认、金点标记、互授荣誉；`evaluate()` 保留但去掉承认相关输入
   - 删 MP 表中"被对手承认的论点 +3"「获对手授予荣誉 +5」两行
   - 改名：争议档案 → **对局报告**
2. 在 `prototypes/debate-room-prototype.html` 内抽出状态、事件和 Adapter 调用点，保持独立 HTML 与构建器可提取；不改变现有页面布局。
3. 扩展 `prototypes/debate-room.test.mjs`：覆盖非法跃迁、两次概念不一致后放行并记档、追问额度、重复提交幂等、**轮次走满即结算**、修正前后条目、请求失败重试，并**移除**互认相关用例（数量会变，需更新基线）。
4. 将 `msg()` 的 HTML 渲染与 transcript 记录拆开，所有用户/模型文本统一转义；业务对象不存 HTML。
5. ✅（2026-09-13 已完成）`prototypes/build-app.mjs` 的字符串锚点已同步（`submitBrief`/`records`/`BOT_BRIEF`，删除 `submitPreTree`/`acknowledge`/`newNodes`/`BOT_TREE` 引用），`prototypes/zhengming-app.html` 已重建并通过集成测试。

### 阶段 C：替换模拟 Host 与对手

1. 依次替换模型对手的立论结构、立论、质询和回答；返回结构保持与 `OpeningBrief` 同构，响应必须引用目标条目。
2. 接入 `alignConcepts` 和 `structureHint`；换议题后概念必须变化，提示不得代写。
3. 最后替换 `evaluate()` 内部实现，保持 `{dims, total, verdict}` 的 UI 形状；**六维**依据必须引用 transcript 的 turn id。
4. 若 W2 决定保留红线 1 的复述关卡，此处接入 `checkRestatement`：未通过时停留原阶段并给描述式原因。

每一步保留确定性的测试 Adapter；真实模型只做带环境变量的 smoke test，不进入默认测试。

### 阶段 D：匹配、报告与集成

1. 定义 `MatchCandidate` 与纯函数 `scoreMatch()`：`base * 0.35 + debate * 0.45 + style * 0.20`。同输入必须同输出，并返回各因子和降级路径供 UI 解释。
2. D2 默认选择"站内行为代理 style"，无历史时降级到 `base`；若改用知乎收藏/关注，先完成部署、OAuth 和用户授权，不在客户端伪造数据。
3. 从最终状态纯函数生成 `RoomReport`，包含概念定义、双方立论结构、证据状态、质询记录、共识、分歧、未决、回避、修正、六维画像与评估总结；**不含**任何互认 / 荣誉字段。落点见 §6 W1。
4. 修改原型后在 `main` 更新 `prototypes/build-app.mjs` / `prototypes/app.test.mjs` 并重建 `prototypes/zhengming-app.html`。若选择产品路线 B，再新增 `web/src/ui/DebateRoom.tsx`、`web/src/types/room.ts` 和对应测试，并在 `web/src/App.tsx` 增加 `?view=room`；这些共享改动不得直接落在模块 worktree。

## 5. 测试与验收

- 单模块：`node prototypes/debate-room.test.mjs`，v0.4 基线 **60 项全绿**（互认/预提交用例已移除，含新增负向/失败路径）。
- 集成：依次运行五套 `prototypes/*.test.mjs`，再执行 `node prototypes/build-app.mjs` 与 `node prototypes/app.test.mjs`。
- 浏览器：用自动演示跑完整六阶段，人工检查移动端、遮罩关闭/重开、重复点击、慢响应、断网恢复和无文本溢出。
- 服务端：用 stub 上游验证 schema、超时、限流、非法 JSON、禁用词和密钥不泄露；再用真实 key 各 smoke 一次。
- 若落 React：在 `web/` 运行 `npm test` 与 `npm run build`。

业务验收以 PRD v0.4 清单为准，并补充：匹配理由可解释；模型失败不丢草稿；`RoomReport` 可读回且与终局卡一致；**全局无 winner/rank/胜负判定，也无"由对方授予"的结果字段**。

## 6. 风险与待决策

- **W1（新）· 对局报告存哪**：树写入已删，`RoomReportSink` 失去目标。三选一：① 只在前端内存中渲染、不落盘（演示够用）；② 落 `zhengming-server` 的 `rooms/<id>.json`；③ 预留可插拔 sink，将来接树。**建议 ②**，演示可控且能证明"产物可回读"。
- **W2（新）· 红线 1「先承认再推进」在辩论间的落点**：v0.4 流程里**没有独立的复述关卡**，但总纲把"复述对方观点且通过忠实校验才获准发言"表述为辩论间硬规则。两选一：① 保留为**发言前闸门**（在 ③质询与 ④自由对辩前插入校验）；② 本模块暂不落该闸门，只在事件推演等模块生效。**未定前不要实现 `checkRestatement` 的调用点。**
- **W3（新）· 质询锚点强度**：本版把质询锚在「立论结构」的条目上。若嫌填写负担重，可降级为"按话轮/发言定位"，代价是质询失去结构指向。PRD §3 末已留一行改动说明。
- **D1 Host 通道**：路线 A 可分享但形成双轨；路线 B 架构更长期但依赖仓外 core/protocol 和桌面环境。未决前不得同时实现两套。
- **真人或模型对手**：当前没有实时协议。若 MVP 要求真人，需先补排队、断线重连、超时、顺序号和服务端权威状态；否则交付名应明确为"模型陪练对局"。
- ~~**树 schema 冲突**~~：**已消解**。v0.4 去树化后，`web/src/types/graph.ts`（`topic/side/argument`）与树 PRD（`root/claim/question`）的命名分歧不再阻塞本模块。
- ~~**雷达维数冲突**~~：**已在 PRD v0.4 修正**，统一按六维；实现时仍需确认测试基线也是六维。
- **原型集成脆弱**：构建器依赖字符串锚点和 CRLF；改 id、class、stage 索引或启动行时必须同步更新并故意验证守卫会失败。

## 7. 完成定义

Host 契约已确认；模拟常量不再承担生产路径；**完整六阶段**可在失败重试后走通；匹配结果确定且可解释；终局六维评估引用具体发言且无胜负表达；**轮次结束即生成可回读的 `RoomReport`，全程无互认 / 荣誉 / 对手授予类字段**；所有原型、集成和可选 React 测试全部通过；真实浏览器验收完成；生成物由构建脚本更新，密钥和用户数据未进入仓库或浏览器日志。
