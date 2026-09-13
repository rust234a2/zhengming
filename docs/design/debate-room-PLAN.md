# 辩论间实施计划

对齐 PRD 版本：**v0.6**（选边制 · 画像驱动撮合） · 2026-09-13 · 基线原型 `prototypes/debate-room-prototype.html`

> **v0.6 同步说明**：撮合从打分制改为**选边制**——系统按议题给出预设论点对（来自争议地图管线），用户选边；对手**真人优先**（守另一边的候选，按**六维结构画像相近度**排序）、**Bot 兜底**。本计划相应改动：① 旧公式 `base*0.35 + debate*0.45 + style*0.20` 退役（§4 阶段 D 改为画像相近度纯函数）；② `DebateRoomState` 增加 `sidePicks`（双方所选预设论点）；③ **决策点 D2 作废**——`style` 信号不再需要知乎收藏/关注，OAuth 安心留在阶段 5；④ 原型 `startMatch()` 固定单局脚本待改（见 PRD §13 v0.6 待同步）。

> **v0.5 同步说明**：PRD 删除了「概念对齐」独立阶段，流程六阶段 → **五阶段**；关键定义降级为立论结构的可选字段，②质询轮可将其作为条目靶点发问，定义分歧直接记入对局报告（无 Host 拦截、无重选上限）。本计划相应改动：① `RoomPhase` 去掉 `concept`；② `DebateRoomState` 去掉 `definitions: DefinitionChoice[]`（定义并入 `OpeningBrief` 的可选字段）；③ Host 接口去掉 `alignConcepts`（已于 2026-09-13 经确认无任何模块消费，**从 `IMPLEMENTATION-PATH.md` 卡 0-1 能力表彻底移除**，卡 1-3 作废）；④ 不变量"概念最多重选两次"删除。

> **v0.4 同步说明**：PRD 删除了「论证树预提交」「终局互认」「一键上树」，流程由七阶段收敛为六阶段、在轮次结束后即完成。本计划相应改动：① `RoomPhase` 去掉 `pretree` 与 `acknowledgement`；② `DebateRoomState` 去掉 `trees` 与 `acknowledgements`；③ **原「与辩论树负责人共同冻结 Settlement 与树写入接口」的闸口取消**，阶段 A 只剩契约与服务端两条；④ 终局产物改名 `RoomReport`，落点待定（见 §6 待决策 W1）。

## 1. 目标与非目标

目标是把 `prototypes/debate-room-prototype.html` 已验证的**五阶段**交互，从"固定 Bot + 本地启发式"升级为可接真实 Host、可解释匹配、可产出对局报告的模块，并保持"不判输赢、先承认再推进（D6 拍板：原则性表述，不设复述闸门）、追问权替代验证权、Host 只提示不代写"的产品红线。

**不做什么（明确排除）**：

- 不重做视觉稿，不扩展快速/完整双模式
- 不在本阶段实现知乎 OAuth
- **不引入辩论树**：不预提交树、不点选树节点、不写回树、不消费树 schema（移入 PRD §12「暂不纳入」）
- **不做终局互认 / 对手承认 / 荣誉授予**——结果不由对方决定
- **不恢复概念对齐阶段**——定义是可被质询的论点，不是前置协议（PRD v0.5 §2）
- 不把模型对手包装成"真人实时对局"

真正的多人实时房间仍缺身份、候选池、房间生命周期和消息传输契约，须单独决策后再承诺。

## 2. 现状盘点

- `prototypes/debate-room-prototype.html` **已于 2026-09-13 同步 v0.4**（v0.5 概念对齐删除见阶段 B 第 2 步）：六阶段 `idle → concept → opening → cross-* → free → closing → end`（`setStage(0..5)`），`pretree` 与终局互认已删除；立论为「立论结构 + 开篇陈述」且不上共享画板（右栏改为「本场记录」），质询按立论结构条目定位，终局卡为「对局报告」，「沉淀/进入辩论树」出口已移除，自动演示同步为六阶段脚本。
- `prototypes/debate-room.test.mjs` 已随原型同步为 **60 项全绿**（v0.3 的 41 项去除互认/预提交用例后重写并补负向路径），是后续替换实现时的行为基线；但 DOM 桩不能发现事件绑错节点、遮罩层冲突等浏览器问题。**v0.5 待改**：概念对齐相关用例（`pickConcept`/`CONCEPTS`/定义重选）将随五阶段改造删除。
- `CLAIM_PAIR/BOT_SIDES`、`startMatch()`（v0.6 已为选边制 UI：论点对 → 选边 → 画像排序 → Bot 兜底）和 `evaluate()` 均为硬编码或启发式，没有网络、持久化或真实撮合服务。
- `prototypes/build-app.mjs` 通过字符串提取和 IIFE 包装集成原型，依赖内联 `<script>`、固定 DOM id 与 CRLF 兼容正则；`prototypes/zhengming-app.html` 是生成物。
- `web/` 现有 `map`、`debate` 两个 React 视图（`force` 已随 D3 拍板于 2026-09-13 移除），**没有辩论间路由或房间类型**。对应 worktree `feat/debate-room` 与 `main` 同源且干净。
- `host-contract.md` 与 `zhengming-server/` **尚不存在**。可持久化的树 / `settlement` schema 也不存在——**但 v0.4 之后辩论间不再依赖它**。

## 3. 架构与状态模型

把状态迁移规则作为深模块，界面只派发事件并渲染状态。建议使用可判别联合：

```ts
type RoomPhase =
  | "matching" | "opening"
  | "crossAnswer" | "crossAsk" | "crossReact"
  | "free" | "closing" | "settled";

interface DebateRoomState {
  roomId: string;
  phase: RoomPhase;
  topic: TopicRef;
  sidePicks: Record<ParticipantId, PresetClaim>;   // v0.6 选边制：双方所选预设论点（对立由选边保证）
  participants: [Participant, Participant];
  briefs: Record<ParticipantId, OpeningBrief>;   // 立论结构（关键定义?/结论/理由/依据），非树
  transcript: Turn[];
  crossExaminations: CrossExamination[];
  report?: RoomReport;
}
```

与 v0.4 的差别：删 `"concept"` phase；删 `definitions: DefinitionChoice[]` 字段（关键定义并入 `OpeningBrief` 可选字段，可被质询定位）；与 v0.3 的差别：删 `"pretree" | "acknowledgement"` 两个 phase；删 `trees`（`MiniArgumentTree`）与 `acknowledgements` 两个字段；`Settlement` → `RoomReport`。

状态迁移的接口统一为 `transition(state, event) -> Result<state, DomainError>`；它负责**“理由至少一条、追问最多一次、每方自由发言一次、轮次走满即结算”**等不变量。每条 `Turn` 使用稳定 id、`authorId`、`kind`、`targetBriefItem`（指向对方立论结构的条目，含可选的关键定义条目）、`evidenceStatus` 与时间戳，禁止再从已转义 HTML 反推业务数据。

外部能力放在三个 seam：`HostClient`、`MatchRepository`、`RoomReportSink`。生产 Adapter 分别调用服务端 Host、候选池和报告存储；测试 Adapter 返回确定结果。Host 接口至少包含 `structureHint`、`makeQuestion`、`opponent.opening/answer/question`、`evaluate`（`alignConcepts` 已于 2026-09-13 从 Host 能力表彻底移除；`checkRestatement` 已随 **D6 拍板不落闸门** 同步移除）。异步请求携带 `roomId + turnId + requestId`，重复响应必须幂等，失败时保留草稿并允许重试。

> **红线 1 的落点（已定，2026-09-13）**：D6 拍板「③ 不落 + 修总纲」——辩论间**不设**复述闸门；"先承认，再推进"降为产品原则，由 `makeQuestion` 承载理解偏差的澄清。总纲红线 1 表述已改写。

## 4. 分阶段任务

### 阶段 A：Host 地基先落地（`main`）

1. 新建 `docs/design/host-contract.md`，为 Host 能力补 JSON schema、正反例、结构化错误与禁用词校验；先由产品确认契约。
   > **v0.5 变化**：辩论间只需 `structureHint` / `makeQuestion` / `opponent.*` / `evaluate` 四组；`alignConcepts` 已从 Host 能力表彻底移除（无任何模块消费）；树相关能力不再由本模块驱动。
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
2. **（v0.5 新增）原型改五阶段**：删概念对齐阶段（`CONCEPTS`/`pickConcept`/`conceptPicks`/`conceptAgreed` 及对应 UI），`setStage` 的 0..5 改为 0..4；立论结构增加可选「关键定义」字段（`bf-def`），Bot 开篇含定义；质询靶点含定义条目；MP 明细与 `evaluate()` 去掉概念对齐输入；自动演示同步。完成后同步 `build-app.mjs` 锚点并重建。
3. 在 `prototypes/debate-room-prototype.html` 内抽出状态、事件和 Adapter 调用点，保持独立 HTML 与构建器可提取；不改变现有页面布局。
4. 扩展 `prototypes/debate-room.test.mjs`：覆盖非法跃迁、追问额度、重复提交幂等、**轮次走满即结算**、修正前后条目、请求失败重试；v0.5 需**移除**概念对齐相关用例并补"定义条目可被质询、未填定义不阻塞"用例（数量会变，需更新基线）。
5. 将 `msg()` 的 HTML 渲染与 transcript 记录拆开，所有用户/模型文本统一转义；业务对象不存 HTML。
6. ✅（2026-09-13 已完成）`prototypes/build-app.mjs` 的字符串锚点已同步（`submitBrief`/`records`/`BOT_BRIEF`，删除 `submitPreTree`/`acknowledge`/`newNodes`/`BOT_TREE` 引用），`prototypes/zhengming-app.html` 已重建并通过集成测试。**v0.5 追加**：还需同步删除 `pickConcept`/`CONCEPTS` 锚点。

### 阶段 C：替换模拟 Host 与对手

1. 依次替换模型对手的立论结构、立论、质询和回答；返回结构保持与 `OpeningBrief` 同构，响应必须引用目标条目。
2. 接入 `structureHint`；立论阶段可给出定义提示（如"你的结论依赖一个未言明的定义"），提示不得代写。
3. 最后替换 `evaluate()` 内部实现，保持 `{dims, total, verdict}` 的 UI 形状；**六维**依据必须引用 transcript 的 turn id。
4. ~~若 W2 决定保留红线 1 的复述关卡，此处接入 `checkRestatement`~~ —— **W2/D6 已拍板（2026-09-13）：不落**，此步取消，`checkRestatement` 已移出 Host 契约。

每一步保留确定性的测试 Adapter；真实模型只做带环境变量的 smoke test，不进入默认测试。

### 阶段 D：匹配、报告与集成

1. 定义 `PresetClaim`（预设论点对：正方论点 / 反方论点，来源争议地图管线）与纯函数 `rankCandidates()`：输入守另一边的候选列表，按**六维画像相近度**排序——`score = 1 − mean(|dim_i − dim_i'|)/100`（六维取自历史 `RoomReport`）；无画像候选排在其后、并列随机。同输入必须同输出，并返回排序依据供 UI 解释。（原型已落参考实现：`prototypes/debate-room-prototype.html`，2026-09-13）
2. **D2 已作废（2026-09-13 随选边制）**：撮合不再消费 `style`/知乎收藏关注信号；OAuth 安心留在阶段 5，无需提前。
3. **对手来源（已拍板 2026-09-13）**：真人优先、Bot 兜底——候选池空或等待超时（建议 90s），由 Bot 持预设对方论点开局；Bot 路径不伪造"真人在线"提示。
4. 从最终状态纯函数生成 `RoomReport`，包含双方关键定义（如有，含定义分歧）、双方立论结构、证据状态、质询记录、共识、分歧、未决、回避、修正、六维画像与评估总结；**不含**任何互认 / 荣誉字段。落点见 §6 W1。**六维画像同时写入用户撮合档案**，作为下次撮合的排序信号（闭环：对局 → 画像 → 撮合）。
5. 修改原型后在 `main` 更新 `prototypes/build-app.mjs` / `prototypes/app.test.mjs` 并重建 `prototypes/zhengming-app.html`。若选择产品路线 B，再新增 `web/src/ui/DebateRoom.tsx`、`web/src/types/room.ts` 和对应测试，并在 `web/src/App.tsx` 增加 `?view=room`；这些共享改动不得直接落在模块 worktree。

## 5. 测试与验收

- 单模块：`node prototypes/debate-room.test.mjs`，v0.6 基线 **82 项全绿**（新增论点对 / 选边 / 撮合排序纯函数 / Bot 兜底用例；历史：v0.4 为 60 项，v0.5 删概念对齐用例后以新数量为准）。
- 集成：依次运行五套 `prototypes/*.test.mjs`，再执行 `node prototypes/build-app.mjs` 与 `node prototypes/app.test.mjs`。
- 浏览器：用自动演示跑完整五阶段，人工检查移动端、遮罩关闭/重开、重复点击、慢响应、断网恢复和无文本溢出。
- 服务端：用 stub 上游验证 schema、超时、限流、非法 JSON、禁用词和密钥不泄露；再用真实 key 各 smoke 一次。
- 若落 React：在 `web/` 运行 `npm test` 与 `npm run build`。

业务验收以 PRD v0.6 清单为准，并补充：选边与撮合理由可解释；模型失败不丢草稿；`RoomReport` 可读回且与终局卡一致；**全局无 winner/rank/胜负判定，也无"由对方授予"的结果字段**。

## 6. 风险与待决策

- **W1（已定 2026-09-13，即决策点 D5）· 对局报告存哪**：拍板为 **② 落 `zhengming-server` 的 `rooms/<id>.json`**——按 roomId 写 JSON、可回读；服务端负责幂等写与 404。`RoomReportSink` 的生产 Adapter 即此文件存储，测试 Adapter 用临时目录。
- **W2（已定 2026-09-13，即决策点 D6）· 红线 1「先承认再推进」在辩论间的落点**：拍板为「③ 不落 + 修总纲」——辩论间不设复述闸门，`checkRestatement` 移出 Host 契约（能力表 8→7），总纲红线 1 改写为原则性表述；卡 1-2 作废。
- **W3（已定 2026-09-13，即决策点 D7）· 质询锚点强度**：拍板为 **① 保留条目锚**——质询继续锚在「立论结构」的条目（定义/结论/理由/依据）上，填写负担视为可接受成本。
- **D1 Host 通道（已拍板 2026-09-13：路线 A）**：新建 `zhengming-server/` 自建 `/api/host/*`，key 走服务端环境变量；原型不动、单端口可发布、可分享链接。与 runi-core 双轨是有意识取舍，赛后迁 runi-desktop 须行为定型后整批移植。
- **真人或模型对手（已拍板 2026-09-13：真人优先、Bot 兜底）**：MVP 期真人撮合要求不高——候选池即"守另一边的选边用户"，池空由 Bot 持预设论点开局。若后续做完整真人实时房间，仍需补排队、断线重连、超时、顺序号和服务端权威状态，另立决策。
- ~~**树 schema 冲突**~~：**已消解**。v0.4 去树化后，`web/src/types/graph.ts`（`topic/side/argument`）与树 PRD（`root/claim/question`）的命名分歧不再阻塞本模块。
- ~~**雷达维数冲突**~~：**已在 PRD v0.4 修正**，统一按六维；实现时仍需确认测试基线也是六维。
- **原型集成脆弱**：构建器依赖字符串锚点和 CRLF；改 id、class、stage 索引或启动行时必须同步更新并故意验证守卫会失败。

## 7. 完成定义

Host 契约已确认；模拟常量不再承担生产路径；**完整五阶段**可在失败重试后走通；匹配结果确定且可解释；终局六维评估引用具体发言且无胜负表达；**轮次结束即生成可回读的 `RoomReport`，全程无互认 / 荣誉 / 对手授予类字段**；所有原型、集成和可选 React 测试全部通过；真实浏览器验收完成；生成物由构建脚本更新，密钥和用户数据未进入仓库或浏览器日志。
