# 争鸣 · 实施路径（AI 执行手册）

版本 v1.0 · 2026-09-13 · **读者是 AI 实施者，不是人**

配套文档：`README.md`（总纲）、四份 PRD、`../../runi/runi-desktop/AGENTS.md`（跨仓边界）

---

## 0. 这份文档和 PRD 的分工

| 文档 | 回答什么 |
|---|---|
| PRD | 做什么（产品定义、交互规格、视觉规格、验收清单） |
| **本文** | **怎么做、按什么顺序、怎么算做完** |
| `../../runi/runi-desktop/AGENTS.md` | 谁拥有哪块代码、跨仓怎么协调 |

**三条执行纪律（不容变通）**

1. **一次只领一张任务卡。** 不要并行开工，不要把三张卡揉成一次提交。
2. **每张卡做完，必须跑它列的验收命令，并把真实输出贴出来。** 不是"应该没问题"，是贴输出。
3. **验收不过，不许开下一张卡。** 也**绝不许**把没做的写成已做——跑不通就说跑不通，这是唯一被接受的状态汇报方式。

**任务卡状态总表（本表是进度的唯一真源，每完成一张就更新）**

| 卡号 | 任务 | 依赖 | 状态 |
|---|---|---|---|
| 0-1 | 定稿 Host 契约 | — | 🟡 草稿完成（`host-contract.md` v1.0），**待用户确认**（闸口） |
| 0-2 | 打通最小可调用通道 | 0-1、D1 | ☐ |
| 1-1 | 对手改由模型生成 | 0-2 | ☐ |
| 1-2 | 承认校验走真 Host | — | ✗ 已作废（D6 拍板：红线 1 不落闸门） |
| 1-3 | 概念对齐走真 Host | 0-2 | ✗ 已于 2026-09-13 作废 |
| 1-4 | 终局评估走真 Host | 0-2 | ☐ |
| 1-5 | 选边制撮合落地 | 1-1…1-4 | ☐ |
| 2-1 | 树 schema 可持久化 | 1-5 | ☐ |
| 2-2 | Agent 追问点走真 Host | 2-1 | ☐ |
| ~~2-3~~ | ~~辩论间终局上树（打通）~~ **已于 2026-09-13 作废**：辩论间 v0.4 去树化，不再产出 `settlement` | — | ✗ |
| 2-4 | 知乎冷启动建树 | 2-1 | ☐ |
| ~~3-1~~ | ~~地图 → 力导向图~~ **已于 2026-09-13 作废**：D3 拍板力导向图下线 | — | ✗ |
| ~~3-2~~ | ~~力导向图 → 树~~ **已于 2026-09-13 作废**：同上 | — | ✗ |
| 3-3 | 地图数据作冷启动种子 | 2-1 | ☐ |
| 4-1 | 事件库 schema + 准入检查 | 0-2 | 🟡 前端层已落地（`web/src/domain/eventReplay.ts` 的 `validateEventReplay` + 事件库 schema 类型，Vitest 全绿）；准入与 Host 联调待服务端 |
| 4-2 | 入库真实事件 ×3（仅事件头 + 真实发展线） | 4-1 | 🟡 三例已起草入库（`web/src/data/eventReplays.ts`，来源链接真实，**待人工准入核验**，见文件头审核声明） |
| 4-3 | 生成式推演引擎走真 Host | 4-2 | 🟡 前端层已落地（reducer / Host 客户端 seam / `?view=event` 界面 / 三层测试 223+，隔离断言齐备）；**服务端能力 5/6/7（actAdvance/replayEnding/replayCanon）未实现**，当前走降级失败态，真模型联调待卡 0-2 |
| 4-4 | Host 推演追问走真 Host | 4-3 | ☐ |
| 5-1 | 重建集成应用 | 全部原型改动 | ☐ |
| 5-2 | 部署 | 5-1 | ☐ |
| 5-3 | OAuth 真登录 | 5-2 | ☐ |

**七个决策点（2026-09-13 全部拍板：D1/D2/D3/D4/D5/D6/D7；AI 不许自己决定）**

| 编号 | 问题 | 影响 |
|---|---|---|
| **D1** | ~~Host 走「原型 + Node 后端」还是「移入 runi-desktop + core 会话通道」~~ **✅ 已拍板（2026-09-13）：路线 A · 演示优先** | 新建 `zhengming-server/` 自建 `/api/host/*`，key 走服务端环境变量；原型不动、单端口可发布、可分享链接。**与 runi-core 形成双轨，此为有意识取舍**；赛后若迁 runi-desktop 走路线 B，整批移植且须在行为定型、`host-contract.md` 冻结之后。D4 流式由该通道以 SSE 承载 |
| **D2** | ~~匹配公式的 `style` 信号是否取用户知乎收藏/关注~~ **✅ 已拍板（2026-09-13）：随选边制作废** | 撮合改为**选边制**（预设论点对，用户选边保证对立；对手真人优先、Bot 兜底），旧公式 `base/debate/style` 退役，撮合排序改用**六维结构画像**（历史对局产物）。知乎 style 信号不再需要，**OAuth 安心留在阶段 5，顺序不重排** |
| **D3** | ~~力导向图（`?view=force`）保留还是下线~~ **✅ 已拍板（2026-09-13）：下线** | 代码已移除：`App.tsx` 的 force 分支、`DebateForceTree.tsx`、`debateGraph.ts`、其 Vitest 用例与 `styles.css` 的 `.debate-force-*` 块（Vitest 26/26 与生产构建复验通过）；卡 3-1/3-2 作废，「三段联动」改为「地图 ↔ 树」两段联动。单议题内部对垒感知的职责由争议地图与辩论树覆盖；`prototypes/` 内的 debate-graph 原型保留为历史存档 |
| **D4** | ~~扮演式推演的模型调用频率与演示降级策略~~ **✅ 已拍板（2026-09-13）：流式输出** | 每幕一次调用改走**流式**：`actAdvance` 用 SSE/分块返回，处境叙事边到边渲染；动作卡必须等完整 JSON 过 `validateActAdvanceResult` 校验后才可交互。不做幕预生成；断网演示兜底用录屏（静态原型已存档） |
| **D5** | ~~辩论间对局报告（`RoomReport`）存哪~~ **✅ 已拍板（2026-09-13）：落 `zhengming-server` 的 `rooms/<id>.json`** | 按roomId 写 JSON、可回读；服务端负责幂等写与 404。演示可控且能证明"产物可回读"；赛后迁移时随路线 B 一起搬 |
| **D6** | ~~红线 1「先承认再推进」在辩论间是否保留为发言前闸门~~ **✅ 已拍板（2026-09-13）：③ 不落 + 修总纲** | 辩论间不设复述闸门；`checkRestatement` 从 Host 契约**移除**（8→7 能力，编号整体前移），卡 1-2 作废；总纲红线 1 改写为原则性表述（"先承认，再推进"是产品原则，由质询生成承载理解偏差的澄清，不设强制拦截） |
| **D7** | ~~辩论间质询轮的锚点强度~~ **✅ 已拍板（2026-09-13）：① 保留条目锚** | 质询继续锚在「立论结构」的条目（定义/结论/理由/依据）上；填写负担视为可接受成本。若后续嫌重再降级，改动只涉及 PRD §3 末一行说明 |

---

## 1. 起点：什么已经真实，什么是演的

**动手前必须读完这张表**，否则会做错优先级。

| 模块 | 交互 | 数据 | LLM | 结论 |
|---|---|---|---|---|
| 跨议题争议地图 | ✅ | ✅ 真实知乎检索 | ✅ 真实 DeepSeek 管线 | **唯一端到端真实的模块** |
| 实时辩论间 | ✅ 五阶段（v0.4 去树化 + v0.5 去概念对齐；原型已同步） | ❌ 硬编码脚本 Bot | ❌ 选项匹配模拟 | 全模拟 |
| 辩论树 | ✅ | ❌ mock | ❌ Agent 追问是模拟 | 全模拟 |
| 事件推演 | ✅ | ❌ 1 个事件、静态占比 | ❌（v0.5 已定为沉浸式角色扮演，能力 5/6/7 待接） | 全模拟 |
| ~~力导向图~~ | **已下线（D3，2026-09-13）** | — | — | 代码已移除 |

**一句话概括起点**：交互设计已经验证透了，**业务内核 100% 是模拟的**。所有"真人""真模型""真数据"的部分都还没接。

**证据（每条都可直接查证，不要凭印象）**

- `prototypes/debate-room-prototype.html` — **v0.6 已落地选边制 UI（2026-09-13）**：论点对 `CLAIM_PAIR` → 选边 → `rankCandidates()` 画像排序 → 池空 Bot 兜底；但候选池 `CANDIDATE_POOL` 为空常量、撮合为纯前端模拟，无真人服务
- `prototypes/debate-room-prototype.html` — `BOT_SIDES`（双方立论/质询/结辩内容）仍是硬编码常量
- `prototypes/debate-room-prototype.html` — `CONCEPTS` 曾用 `ok:true / false` 字段模拟 Host 判定；**v0.5 已随概念对齐阶段删除**
- ~~`runi-desktop/src/data/debateGraph.ts` — 力导向图的 21 节点 mock~~（已随 D3 下线，于 2026-09-13 从 `web/src/data/` 移除）
- `research/controversy-map/extract-claims.mjs` — **「争鸣」原型线里唯一真的在调 LLM 的代码**（runi-core 侧另有一整套 provider 实现，见 §2.3），是本手册反复引用的参考实现

---

## 2. 不可违反的约束

违反任何一条都会返工，其中 2.1 会被评审当场抓到。

### 2.1 产品红线（四条，贯穿所有模块）

| 红线 | 含义 | 自检方法 |
|---|---|---|
| **不判输赢** | 没有任何"谁赢"的字段、分数排名或文案 | 全局搜 `winner\|rank\|胜负\|赢了\|败`（`rankCandidates` 为撮合排序纯函数名，不属胜负字段） |
| **追问权替代验证权** | Agent 只追问、不裁判 | 搜 `谬误\|偷换\|你错了\|错误\|对错` 必须 0 命中 |
| **先承认再推进** | **D6 已拍板：不设强制闸门**，红线降为产品原则——"理解对方是推进讨论的前提"，由质询生成承载理解偏差的澄清 | 总纲红线 1 已改为原则性表述；全局搜 `checkRestatement` 必须 0 命中 |
| **模拟与事实分离** | 事件推演推演期间不出现原作（canon 不注入模型、不展示界面），终局可选揭示标「史实」 | 推演期间 DOM 里搜不到 canon 文本；`actAdvance`/`replayEnding` 请求体不含 canon |

> 注意第二条的措辞要求：拦截文案必须是**描述式**（"你们的分歧可能来自对 X 的定义不同"），不是**指控式**（"你偷换了概念"）。

### 2.2 跨仓边界（`runi-desktop/AGENTS.md` 硬规定）

- 做 `runi-desktop/` 的工作时，**不许**修改 `../../runi/runi-core/`（路径相对本仓库：`zhengming/` 与 `runi/` 同级）
- **不许**直接改 `../../runi/runi-protocol/` — 它归 core owner，任何改动需要**用户明确批准**
- desktop 只能通过 `runi-protocol` 的 HTTP/SSE 契约消费 core，不许在 desktop 里维护长期协议镜像
- 涉及共享协议时：先改并验证 `runi-protocol/`，再让 core 与 desktop 各自适配

### 2.3 LLM 该放在哪 —— 最容易做错的一条

> **绝对不许把 API key 放进前端代码、或任何浏览器可读的位置。**

依据：`runi-core/docs/PROVIDERS.md` 的 **🔐 API Key** 一节明确写了 API key 存在实例配置里，**不应该把完整 key 当普通状态随便暴露给前端**。

而且 core **已经有**完整的 provider 注册表（DeepSeek / Qwen / Moonshot / Zhipu / OpenRouter / Ollama… 共 18 个），配置在 `~/.runi/config.json`。**不要重造 provider 层。**

core 已具备的调用路径：

```
desktop ──POST /v1/sessions/{session_id}/turns──▶ core（持有 key，调模型）
        ◀──SSE  /v1/events:  turn.delta / turn.completed
```

完整路由表见 `runi-protocol/remote_protocol.json`（37 条 httpRoutes + 32 个 sseEventTypes）。相关：`GET /v1/providers`、`PATCH /v1/providers/{provider}`、`PUT /v1/providers/active`、`POST /v1/runtime/reload`。

**D1 的两条路线**

| | 路线 A · 演示优先（建议先做） | 路线 B · 产品优先 |
|---|---|---|
| 形态 | `prototypes/*.html` + Node 后端 | 功能移入 `runi-desktop/src/ui/` |
| Host 通道 | 自建 `/api/host/*`，key 在服务端环境变量 | 走 core 会话通道（上图的 turns/SSE） |
| 优点 | 原型不动、能直接发布成单端口应用、**能分享链接** | 架构正确、key 天然安全、与产品方向一致 |
| 缺点 | 与 runi-core 形成双轨 | 工作量大；Tauri 桌面端不便分享链接 |

> **建议：A 做演示，B 做产品。** 两者共用同一份 Host 契约（卡 0-1 的产物），prompt 与 schema 的工作不会浪费。

### 2.4 D3 / React 四条铁律（所有 d3 组件适用）

原型已在 `DebateForceTree.tsx` 与 `ControversyMap.tsx` 踩过这些坑：

1. **双层副本隔离** — d3 会就地改写传入对象（写 `x/y/vx/vy`，且 `forceLink` 把 `link.source` 从 id 字符串换成节点对象引用）。数据层对象**绝不**直接交给 d3。
2. **id 快照先行** — `linkForce.links()` 调用**之前**必须先把 `sourceId/targetId` 快照出来，否则之后再也拿不到 id。
3. **simulation 单例** — 组件生命周期内只 `new` 一次，后续只做 `nodes()/links()/alpha().restart()`。
4. **每帧不走 setState** — tick 里直接写 DOM，React 只持有结构快照。

**必加守卫**：`typeof ResizeObserver !== "undefined"`，否则 jsdom/老环境直接崩（这个 bug 犯过一次）。

### 2.5 测试纪律

**原型测试（`prototypes/*.test.mjs`，五套）**

- Node DOM 桩 + **手动时钟**：`setTimeout` 先收集，再由 `flushAsync` 推进
- **`await` 异步函数前必须先 flush，否则死锁**
- 改任何原型后，必须重跑**全部五套**（见 §10）
- **测试桩有盲区**：查不到"事件绑错容器"这类 bug（`querySelectorAll` 返回 `[]` 时静默通过）。改交互后用真浏览器 E2E 补位：`prototypes/demo-harness*.html` + Edge headless `--dump-dom`

**桌面测试（vitest + jsdom）**

- 改 `runi-desktop` 后必须跑 `vitest run`，当前基线 **8 文件 / 90 项全绿**
- 新增可视化组件时，在 `tests/setup.ts` 补 jsdom 缺失的桩（如 `SVGElement.prototype.width/height`、`ResizeObserver`）

### 2.6 额度纪律（知乎 CLI）

- 二进制**不在 PATH**：`C:\Users\Lenovo\AppData\Local\ZhihuCLI\current\zhihu-cli.exe`
- **`question_answers` 只有 100/日，能不用就不用**；`search zhihu` 返回**完整长文**（还带 `VoteUpCount`/`AuthorBadgeText`），质量比 200 字摘要高得多。地图管线实测只用 5 次搜索（5/5000），`question_answers` 零消耗。
- 本机 CLI 是 **0.5.0**，**没有** `question recommend`。要"按议题找问题"只能走 `search zhihu`，再按结果 `Url` 里的 question id 自行聚合。
- `status` 必须带 `--skill-version 0.2.1 --min-cli-version 0.1.0`，否则报 INVALID_ARGUMENT
- `search zhihu --count` 上限 **10**
- 错误码 **30001 混用**"限流"与"配额耗尽"，用 `quota` 命令区分

### 2.7 本机环境陷阱

- **`npm` / `npx` 不可用**（shim 触发黑名单 `wsl.exe`）。一律用绝对路径调 node：
  `C:/Users/Lenovo/.workbuddy/binaries/node/versions/22.22.2-3/node.exe`
- bash 缺 coreutils（`ls / dirname / cat / head / tail / grep / rm / cp` 全报 command not found）→ **文件操作走 node `fs`**
- **源原型与 `build-app.mjs` 是纯 CRLF**。写跨行正则必须用 `\r?\n`，只写 `\n` 会**静默失配**（这个 bug 已经犯过一次，导致旧链接在集成产物里潜伏了很久）
- **自检字符串必须在真实产物里真的可能出现**。`app.includes('xxx.html</a>')` 这种写法如果产物里永远是 `xxx.html" style=...`，守卫就是安慰剂——它从不报错，bug 因此潜伏。写守卫后请**故意不修，验证它确实会报错**。

---

## 3. 顺序总览

排序原则：**赛道命题 × 真实度落差 × 数据依赖**，**不按 PRD 编号**（编号是历史演进顺序，不是依赖顺序）。

```
   ┌──────────────────────────────────────────────┐
   │ 阶段 0  Host 通道（地基）                       │
   │   0-1 契约 → 0-2 打通最小调用                   │
   └───────────────────┬──────────────────────────┘
                       ▼
   ┌──────────────────────────────────────────────┐
   │ 阶段 1  辩论间 · 真匹配 + 真 Host  ★最高优先    │
   │   1-1 对手 → 1-2 承认 → 1-4 评估（1-3 已作废）  │
   │   → 1-5 选边制撮合（阶段灵魂）                  │
   └───────────────────┬──────────────────────────┘
                       ▼
   ┌──────────────────────────────────────────────┐
   │ 阶段 2  辩论树 · 真沉淀 + 真追问                │
   │   2-1 schema → 2-2 追问 → 2-4 冷启动（2-3 已作废）│
   └───────────────────┬──────────────────────────┘
                       ▼
   ┌──────────────────────────────────────────────┐
   │ 阶段 3  地图 ↔ 树联动（力导向图已下线）        │
   └───────────────────┬──────────────────────────┘
                       ▼
   ┌──────────────────────────────────────────────┐
   │ 阶段 4  事件推演 · 沉浸式角色扮演（可并行/后置）│
   └───────────────────┬──────────────────────────┘
                       ▼
   ┌──────────────────────────────────────────────┐
   │ 阶段 5  集成 · 部署 · OAuth 收口 （外部流程）   │
   └──────────────────────────────────────────────┘
```

**为什么阶段 1 排第一**：赛道命题就叫「灵魂匹配局」，而匹配在原型里只是**一张模拟卡**——产品最核心的主张从未被真实验证过。同时它是唯一"两个真人连接"发生的地方（社交价值在此），也是全链上游（分歧点进事件推演）。**落差最大**：评审问一句"对手是谁、Host 是真模型吗"就会露馅。

> **2026-09-13 变更**：辩论间 v0.4 去树化，**不再把终局 settlement 写到辩论树上**（原卡 2-3 作废）；对局产物改为自洽的「对局报告」，落点见 D5。阶段 2 的辩论树因此只服务"树自身"与"知乎冷启动"，不再依赖辩论间。

**为什么地图最成熟却排第三**：它是**浏览层/放大器，不是发动机**——不产生新数据、不连接人。联动需要树里先有真实数据，否则点进去看到的是 mock。但地图有个被低估的价值：**它是冷启动数据源**（15 个真实议题 + 23 条真实论点可直接喂给树，解决"空树"）。

---

## 4. 阶段 0：Host 通道（地基）

**目标**：让"Host"这个角色从"选项匹配模拟"变成**真实可调用的服务**，且所有模块共用同一份契约。

### 卡 0-1 · 定稿 Host 契约（只写文档，不写实现）

> **2026-09-13 进展**：`docs/design/host-contract.md` v1.0 草稿已写出（七个能力 schema + 正反例、禁用词表、能力 5/6 隔离约束、统一错误结构、流式规则）。**卡未完成**——完成标志是用户确认，确认后本行状态改 ✅ 并开卡 0-2。
- **产出**：`docs/design/host-contract.md`
- **内容**：七个能力，每个都要 JSON schema + **1 个正例 + 1 个反例**

| # | 能力 | 签名 | 用途 |
|---|---|---|---|
| 1 | 结构提示 | `structureHint(statement) → string` | 立论阶段，**只提示结构、不代写内容** |
| 2 | 质询生成 | `makeQuestion(targetClaim, history) → string` | 辩论间 ② / 事件推演 |
| 3 | 中立评估 | `evaluate(transcript) → {dims:{立论,论据,逻辑,回应,表达,规范}, total, grounds[]}` | 辩论间 ⑤ |
| 4 | 终局追问 | `terminalProbes(position, history, ledger, relations) → [string, string]` | 事件推演（辩论间 v0.6 对局报告不含终局追问，**是否恢复待定**；入参不含 canon，仅呈现给玩家、无导出） |
| 5 | 幕推进 | `actAdvance(header, position, acts, actIndex, ledger, relations, history, chosenMoveId) → {outcome, nextScene:{month,text,visibleFacts}, moves:[{id,text,costHint,implicitAssumption,label}], relationDeltas[], ledgerDeltas[], atEnding}` | 事件推演（**核心**） |
| 6 | 结局生成 | `replayEnding(position, history, ledger, relations) → {title, text}` | 事件推演终局叙述 |
| 7 | 原作揭示 | `replayCanon(eventId) → {canon:[{actIndex, month, development, sources[]}]}` | 事件推演终局可选揭示（**独立通道**，推演期间不调用） |

> **历史注记（2026-09-13）**：原能力「概念对齐 `alignConcepts`」「承认校验 `checkRestatement`」已分别随辩论间 v0.5 删除概念对齐阶段（卡 1-3 作废）与 **D6 拍板不落复述闸门**（卡 1-2 作废）而**彻底移除**（均无任何模块消费）；本表编号已两轮整体前移，其余能力编号以本表为准。

- **硬约束**：能力 1/2/3/4/5/6/7 的返回文本必须过**禁用词表**：`错误 | 谬误 | 偷换 | 输赢 | 对错 | 你错了 | 赢了`
- **隔离硬约束（事件推演）**：能力 5/6 的**入参中不得出现 `canon` / 真实人物真名**——沉浸式下模型本来就不需要原作，调用隔离是天然属性，但仍须写成单测断言（spy 捕获请求体）。原作只喂给能力 7，且能力 7 **仅在终局可选揭示时被调用**；能力 5 的 `visibleFacts` 不得越出所选角色位 `visible` 的范围（越界拒收）。
- **验收**
  - `docs/design/host-contract.md` 存在，七个能力 schema 齐全，每个都有正/反例
  - 文档中**显式列出**禁用词表，以及能力 5/6 的隔离约束
- **完成标志**：用户确认契约（这是一个闸口，不许跳过）

### 卡 0-2 · 打通最小可调用通道（D1 已拍板：路线 A）

**路线 A 步骤**（建议先走这条）

1. **新建 `zhengming-server/`**（Node，零依赖，只用 `node:` 内置模块 + 全局 `fetch`）
   - `server.mjs`：静态托管 + `/api/host/:capability` 路由
   - **key 从 `process.env.DEEPSEEK_API_KEY` 读，不落盘、不进代码、不进日志**
   - 请求体上限 256KB；30s 超时；失败返回结构化错误（不是裸 500）
   - **流式支持（D4 已拍板）**：事件推演的 `actAdvance` / `replayEnding` 走 `stream: true`，服务端以 SSE（`text/event-stream`）或 NDJSON 分块转发增量；其余能力可保持一次性 JSON 返回
   > 这会新增一个顶层目录；若只服务原型，退路是放 `prototypes/server.mjs`，但不得把可执行代码放回 `docs/`。
2. **只实现一个能力**打通链路：先做 `makeQuestion`（判据最清晰：输出恰好一条问句、必须过禁用词表；且是辩论间与事件推演共用的能力）
3. **复用已验证的调用参数**（直接抄 `research/controversy-map/extract-claims.mjs`）：
   - endpoint `https://api.deepseek.com/chat/completions`
   - `model: "deepseek-chat"`
   - `response_format: { type: "json_object" }`
   - 批处理 + 落盘缓存支持续跑（参考同目录 `.claim-cache.json` 的做法）

- **验收**
  - `curl -X POST localhost:<PORT>/api/host/makeQuestion -H 'Content-Type: application/json' -d '{...}'` 返回结构化 JSON
  - **构造一个"对手主张"用例**：返回必须是**恰好一条**以问号结尾的质询，且**0 命中禁用词表**（不能输出陈述句或评判）
  - `grep -r "sk-" <产物目录>` → **0 命中**
- **完成标志**：一次真实模型调用能从浏览器点通，且 key 不出现在任何客户端可见文件里

---

## 5. 阶段 1：辩论间 —— 真匹配 + 真 Host ★最高优先

### 卡 1-1 · 对手改由模型生成（先把最假的部分换掉）

- **现状**：`prototypes/debate-room-prototype.html:326-334` 四个硬编码常量
- **目标**：`BOT_*` 常量替换为 `/api/host/opponent/*` 三个调用
  - `opening(stance, brief)` → 立论陈述
  - `answer(question, myBrief, style)` → 正面回答，或（**受控地**）回避
  - `question(myBrief)` → 一条质询（锚点强度见 **D7**，已拍板保留条目锚）
- **必须保留的可测性**：模型输出仍要落成与原型常量**同构**的结构（结论 / 理由 / 依据，即 PRD v0.4 的「立论结构」），否则下游各阶段全要改
- **验收**
  - 同一个质询问题调两次，返回**不同但都合规**的回答 → 证明不是复读常量
  - 回答中必须**引用我方的具体论点**（不能是泛泛而谈）
  - `STAGE_NAMES` **五阶段**流程仍能走完（跑 `event-replay`/`debate-room` 两套测试）
- **完成标志**：对局中的"对方"会针对你说的话回应

### 卡 1-2 · 承认校验走真 Host（✗ 已作废，2026-09-13，D6 拍板）

- **作废原因**：D6 拍板「③ 不落 + 修总纲」——辩论间不设复述闸门，`checkRestatement` 从 Host 契约彻底移除（无任何模块消费，与 `alignConcepts` 同例），本卡随之作废。
- 历史需求存档：原为"复述未通过忠实校验不许发言"，未通过时给描述式拦截文案；曾有验收用例"偷换复述必须 `faithful:false`"。
- **重启前提**：若未来产品决定恢复"先承认"硬闸门，先改总纲红线 1 表述、在 Host 能力表重新登记 `checkRestatement` 并开新卡；不得直接复活本卡。

### 卡 1-3 · 概念对齐走真 Host（✗ 已作废，2026-09-13）

- **作废原因**：辩论间 v0.5 删除概念对齐阶段（定义并入立论、作为 ②质询轮的可质疑条目，见 PRD v0.5 §2）后，`alignConcepts` 经确认**无任何模块消费**（事件推演 / 辩论树均未引用），已从 Host 能力表彻底移除，本卡随之作废。
- 历史需求存档：原 `alignConcepts` 从议题 + 双方立场抽出 2-3 个概念；每个给 1 个中性 + 2 个带倾向的定义；双方不一致时要求重选（**上限 2 次**，超限允许带差异继续并记入档案）。
- **重启前提**：若未来某模块需要"协商式定义对齐"（如多人讨论间），先恢复 PRD 层需求，再在 Host 能力表新增能力并开新卡；不得直接复活本卡。

### 卡 1-4 · 终局评估走真 Host

- `evaluate(transcript)` 返回六维分数 + **依据**；依据必须**引用具体发言**
- **保留现有接口形状**（`evaluate() → {dims[6], total, verdict}`），只换内部实现，这样 UI 不用改
- **v0.5 补充**：`evaluate` 是五阶段里的 **⑤**（v0.3 曾是"⑦"、v0.4 曾是"⑥"）；输入只剩 transcript / 证据 / 质询结果，**不再有"对手承认"相关项，也不再依赖概念对齐结果**——互认、金点、互授荣誉已废除（见 PRD v0.4 文首变更块）。`verdict` 字段仅作"结构性总结"，不得承载胜负语义
- **验收**
  - 雷达图仍正常渲染（六维 **2 字标签**）
  - 终局卡必须含"**不构成胜负判定**"
  - 输出中**无排名、无胜负**
  - 六维等权（`total` 等于六维平均）
- **完成标志**：评分依据能指回真实发言
- **v0.6 补充**：六维画像落进 `RoomReport` 的同时**写入用户撮合档案**——它是卡 1-5 选边撮合的排序信号（对局 → 画像 → 撮合闭环）。`evaluate` 的输出形状不变，只是多了一个消费方

### 卡 1-5 · 选边制撮合落地（阶段 1 的灵魂，v0.6 重写）

- **目标**：把 `startMatch()`（`prototypes/debate-room-prototype.html`）的固定单局脚本换成**选边制撮合**：论点对浏览 → 用户选边 → 真人优先撮合 → Bot 兜底开局。**原型层已落地（2026-09-13）**：论点对 / 选边 / 排序 / 兜底 UI 与 `rankCandidates()` 纯函数已进原型并通过 82 项测试；本卡剩余范围为服务端撮合（候选池、超时、撮合档案闭环）
- **流程**：

| 步骤 | 说明 | 数据来源 |
|---|---|---|
| 论点对 | 按议题给出预设正反方论点（各 1 条核心论点 + 立场标签） | 争议地图管线（27 议题 / 37 论点） |
| 选边 | 用户选一边；允许选自己不信的一边（辩论训练特性） | 用户动作 |
| 排序 | 守另一边的真人候选按**六维画像相近度**排序：`score = 1 − mean(|dim_i − dim_i'|)/100` | 历史 `RoomReport` 的六维画像 |
| 兜底 | 池空或等待超时（建议 90s）→ Bot 持预设对方论点开局，不伪造"真人在线" | `BOT_SIDES` 常量真实化 |

- **硬约束**：**预设论点只是立论起点**——选边后预填立论结构草稿，用户可改可弃，不能跳过立论直接开打
- **验收**
  - **可复现**：同输入同输出（不许有随机、不许依赖时间）；排序依据可展示（"对方画像与你相近"）
  - **单调性**：造 3 组对照，画像越相近排位越高
  - **不崩**：无画像新用户走"随机 → Bot 兜底"路径，永远有局可开
  - **闭环成立**：对局结束后六维画像写入撮合档案，下一次撮合能消费
- **完成标志**：匹配结果**可解释**——UI 能说清"为什么匹配到这个人"

---

## 6. 阶段 2：辩论树 —— 真沉淀 + 真追问

### 卡 2-1 · 树 schema 落地为可持久化结构

- 复用已定 schema：`root / claim / question` 三类节点，`stance: pro|con|neutral`，证据是 `claim` 的**内联字段**（不设独立节点）
- 约束：深度 ≤ 4；每节点追问 ≤ 3；root 下固定「支持 / 反对 / 看条件」三桶
- **验收**：能存能读能迁移；旧 mock 数据结构可通过迁移脚本导入
- **完成标志**：树数据不再依赖内存常量

### 卡 2-2 · Agent 追问点走真 Host

- 对满足条件的节点打 `agentHint`：**是断言（无论证）、无子回应、与对向节点存在正面冲突**
- **姿态红线**：文案永远说"这是**可以追问的点**"，禁止"你犯了 X 谬误"
- **验收**：生成的追问**指向具体内容**（纯表态必须被前端拦截）；文案 0 命中禁用词
- **完成标志**：追问建议不再是预制文本

### ~~卡 2-3 · 辩论间终局上树（打通）~~ ✗ 已于 2026-09-13 作废

- **作废原因**：辩论间 PRD 升到 v0.4，主动**去树化**——不预提交树、不点选树节点、不写回树。本卡的存在前提（辩论间产出 `settlement`）消失，卡号保留为占位以免与 `debate-tree-PLAN.md` 的同名卡混淆。
- **替代物**：对局产物改为自洽的「**对局报告**」(`RoomReport`)，落点已拍板（**D5**：落 `zhengming-server` 的 `rooms/<id>.json`，不写树）。
- **若要恢复**：先满足 PRD §12「暂不纳入」的重新引入前置条件（冻结树 schema），再新开一张卡，不要直接复活本卡。

### 卡 2-4 · 知乎冷启动建树

- 流程：`search zhihu`（**不是** `question answers`，额度稀缺）→ 按 question id 聚合 → LLM 两步法抽立场 → 生成两级树（root → 三派桶 → 代表论点，带 `source` 溯源）
- **验收**：新建的树第一层 claim 带知乎 `source`，且**立场分布不是一边倒**（最大簇占比 > 70% 判失衡并提示）
- **完成标志**：冷启动不需要人工录数据

---

## 7. 阶段 3：地图 ↔ 树联动

> **2026-09-13 变更（D3 拍板：力导向图下线）**：原「三段联动（地图 → 力导向图 → 树）」改为两段。`?view=force`、`DebateForceTree.tsx`、`debateGraph.ts`、其 Vitest 用例与 `.debate-force-*` CSS 块已从 `web/` 移除（Vitest 与生产构建复验通过）。单议题内部的对垒感知职责由争议地图（跨议题索引 + 议题内主张分布）与辩论树（缩进展开）覆盖；`prototypes/` 内的 debate-graph 原型保留为历史存档，不再作为基线。
>
> 原**卡 3-1（地图 → 力导向图）**、**卡 3-2（力导向图 → 树）**随之作废。若日后想恢复单议题空间感知视图，重启前提：争议地图与辩论树均已接真数据，且为地图或树新增视图属于新增 PRD 而非复活旧代码。

### 卡 3-3 · 地图数据作冷启动种子

- 把地图已有的 **15 议题 / 23 论点 / 5 主张簇** 转成树的初始节点，解决"空树"问题
- **验收**：新建的树非空、有真实议题与论点、可回溯知乎原问题
- **完成标志**：不再有"新树没内容"

---

## 8. 阶段 4：事件推演 —— 真事件库 + 生成式推演

> 命名说明：本模块原名「事件复盘器」，2026-09-13 更名为「**事件推演**」。旧名重心在"回顾"，而核心动作是**在岔路口做选择、看模拟后果**；且"复盘器"暗示进来就能看到真实走向，与产品的**剧透保护**第一规则相悖。文件名为历史原因仍为 `event-replay-*`。
>
> **形态重定义（v0.5，2026-09-13）**：本模块由 v0.4 的「第三人称生成式沙盘」改为「**沉浸式历史角色扮演**」——**玩家是历史事件中的一个角色位，你的决定改变事件走向**。外部事件节拍（`acts`）按历史时间表锁定到来；原作轨迹（`canon`）推演期间**不展示也不注入模型**，仅在终局以可选方式揭示；反馈用**代价账本**（时间/钱/关系/健康/机会）替代分数，**无成败判定**。可重复游玩性来自角色位（信息/资源/关系各不相同），而非分支穷举。详见 `event-replay-PRD.md` v0.5 与 `event-replay-PLAN.md`。

### 卡 4-1 · 事件库 schema + 准入检查

- schema：`header`（背景 + 改编声明 + 准入记录）/ `positions`（可扮演角色位 ≥2，各含 `stake/visible/resources/canDo/relations`）/ `acts`（锁定的外部事件节拍）/ `endingCondition` / `canon`（原作轨迹：不展示、不注入模型）
- **准入底线五条（硬性，不满足不许入库）**
  1. 只收**公共讨论充分**的事件（知乎已有问题/高热度）
  2. 涉及**灾难、伤亡的事件不入库**（扮演 ≠ 消费苦难）
  3. 改编规则：人物化名、机构模糊、时间粒度到月
  4. **不扮演可识别的真实个人**——角色位一律是改编后的虚构位置，禁止"你就是某某本人"
  5. `canon` 必须有可核验来源并记录审核时间；来源失效时**下架**事件而非静默替换
- **验收**：写一个准入检查函数；给 3 个不满足条件的事件样本，全部必须被拒。另断言 `acts.index` 连续、**角色位 ≥2 且 visible/resources 确有差异**、来源为 https 知乎链接
- **完成标志**：准入是**代码校验**，不是靠人自觉

### 卡 4-2 · 入库 3 个真实事件

- **只录事件头 + 角色位 + 外部事件节拍 + 原作轨迹**（不预置处境、动作与结局——它们由模型生成）
- 人工策划 + 知乎事件类回答溯源
- **验收**：每个事件 `acts` ≥3 幕、`canon` 逐幕有来源链接、角色位 ≥2 个且信息面/资源确有差异、事件头带改编声明；**禁止保留 `#` 占位来源**
- **完成标志**：事件库从 1 个涨到 3 个，且每个都可真跑通

### 卡 4-3 · 角色扮演推演引擎走真 Host

> **进度（2026-09-14，分支 `feat/event-simulation`）**：前端层已落地——`web/src/domain/eventReplayReducer.ts`（无回溯单轴 reducer）、`web/src/ui/event-replay/eventReplayClient.ts`（白名单请求体 + 流式读取 + 降级透传）、`web/src/ui/EventReplay.tsx` + `eventReplay.css`（`?view=event` 全流程界面）。测试三份：reducer 契约 9 项、事件库 5 项、client 隔离断言（`findCanonKeys` spy）+ UI 红线（推演期间 DOM 搜不到 canon、replayCanon 仅终局触发、无胜负措辞）。**剩余：`zhengming-server` 侧实现能力 5/6/7（含 D4 流式 SSE），真模型联调后本卡才可关。**

- 三个新能力：`actAdvance`（幕推进：处境 + 动作 + 后果 + 账本/关系增量）/ `replayEnding`（终局叙述）/ `replayCanon`（原作揭示，独立通道，仅终局调用）
- **必须实现的机制**
  - **固化原则**：已生成的 `outcome` 作为锁定条件注入后续调用，不可翻案
  - **账本与关系**：每幕结算增减；关系反向限制后续可选动作（"妻子已不信任你 → 你无法说服她一起搬"）
  - **隔离断言**：spy 捕获 `actAdvance`/`replayEnding` 请求体，断言不含 `canon` / 真实人物真名；`visibleFacts` 不越出角色位信息范围（越界拒收）
  - **失败态**：超时/失败显示「这一步暂时无法推进」+ 重试，**不得用静态模板冒充模型结果**
- **验收**：一次扮演可连续走 ≥3 幕；账本与关系随决定变化；到达收束条件自动出结局且**无任何评分**；隔离断言通过；断开 Host 时出现失败态而非假结果
- **完成标志**：扮演由真模型逐步驱动，原作既不进模型入参也不出现在推演界面

### 卡 4-4 · Host 推演追问走真 Host

- 推演中：依据**动作自带的 `implicitAssumption`** 给一条**假设澄清式**追问（"你选这条路的隐含假设是 X，依据是什么？"），**不评判选择本身**
- 终局：`terminalProbes` 输出 2 条，指向**决策模式**（"你三次都选了风险更低的一边——是处境使然，还是你的风格？"）
- **验收**：文案无评判词；追问确为假设澄清式；追问**仅在游戏内呈现**，无任何导出/跳转入口（联动已随 2026-09-13 拍板取消）
- **完成标志**：追问由模型生成且合规

---

## 9. 阶段 5：集成 · 部署 · OAuth 收口

### 卡 5-1 · 重建集成应用

- 改过任何原型后**必须**重跑：`node build-app.mjs`（在 `prototypes/` 下）
- **CRLF 陷阱**：`build-app.mjs` 与源原型都是纯 CRLF，跨行正则必须写 `\r?\n`
- **自查**：构建脚本打印的 KB 是 `app.length/1024`（**UTF-16 字符数，不是字节数**）。中文文件两者差很多，**不要拿它对比体积**，要比就比 `Buffer.byteLength`
- **验收**：五套测试全绿；产物里**没有**对独立原型的残留链接（如 `prototypes/event-replay-prototype.html`）
- **完成标志**：集成应用可演示

### 卡 5-2 · 部署

- 静态站：`python3 -m http.server "$PORT" --bind 0.0.0.0`
- Node 应用（路线 A）：监听 `process.env.PORT`、绑定 `0.0.0.0`
- **Vite 注意**：若部署 Vite 开发/预览服务，必须 `server.host = "0.0.0.0"` + `allowedHosts`，否则反代域名会被拒（当前 `vite.config.ts` 是 `127.0.0.1:1420`，**只适合本地**）
- **验收**：线上链接可访问；关键资源 200
- **完成标志**：别人能打开

### 卡 5-3 · OAuth 真登录

- **硬前置**：OAuth **必须已部署**——回调必须是**公网 HTTPS** 地址，且要在**知乎开放平台登记**。**本地只能预览，不可能跑通真实登录。**
- 顺序：部署取得域名 → 用真实域名更新回调配置 → 重新部署 → 开放平台登记 → 用户**本人**点击授权页最终确认（**AI 不许代点**）
- 凭证命名**必须区分**（极易串位）：
  - App ID（短数字）→ 只写项目配置的 `oauth.appId`
  - OAuth App Key → 钥匙串 / 线上 `ZHIHU_OAUTH_APP_KEY`（用于换 token）
  - Access Secret → 官方 Skill / 线上 `ZHIHU_ACCESS_SECRET`（用于用户数据接口）
- **验收**：`/api/oauth/status` 正常；五项用户接口（创作/关注/收藏夹/收藏夹内容/近期收藏）各请求一条并**如实记录**成功/空数据/失败；回调无 `state` 时必须标"仅适合临时联调"
- **完成标志**：真实登录跑通，或如实标记为待验证

---

## 10. 验收命令速查

**本机必须用绝对路径调 node**（`npm` / `npx` 不可用）：

```bash
NODE="C:/Users/Lenovo/.workbuddy/binaries/node/versions/22.22.2-3/node.exe"
```

**原型五套测试**（在 `prototypes/` 下）— 基线 **195 项全绿**

```bash
cd prototypes
for t in debate-graph debate-room debate-tree-v2 event-replay app; do
  "$NODE" $t.test.mjs || echo "FAIL $t"
done
# 期望：52 / 41 / 40 / 26 / 36 全通过（以各套实际输出为准）
# 注：debate-room 测试已随原型 v0.4 / v0.5 两次同步（删互认/预提交用例、
#     删概念对齐用例、新增"阶段跃迁""定义可被质询""轮次走满即结算"用例），
#     此处数字为快照——以最新一次全量回归为准。
```

**桌面端测试 / 类型检查 / 构建**（在 `runi-desktop/` 下）— 基线 **8 文件 90 项全绿**

```bash
cd runi-desktop
"$NODE" ./node_modules/vitest/vitest.mjs run      # 约 50s
"$NODE" ./node_modules/typescript/bin/tsc -b      # 类型检查
"$NODE" ./node_modules/vite/bin/vite.js build     # 构建产物
```

**集成应用重建**

```bash
cd prototypes && "$NODE" build-app.mjs
```

**真浏览器 E2E**（jsdom 盲区补位）

```bash
msedge --headless=new --disable-gpu --virtual-time-budget=35000 \
       --allow-file-access-from-files --dump-dom demo-harness-app.html
```

---

## 11. 失败模式与对策

| 症状 | 根因 | 对策 |
|---|---|---|
| `npm` 报 wsl.exe 相关错误 | shim 触发黑名单 | 用绝对路径 node + 显式 `.js` 入口 |
| bash 里 `ls/cat/rm` 报 command not found | 缺 coreutils | 一律走 node `fs` |
| 正则"看着对"但不生效 | 源文件是 CRLF，正则只写了 `\n` | 用 `\r?\n` |
| 自检永远通过却真有 bug | 自检字符串在产物里不可能出现 | **故意不修，验证守卫会报错** |
| d3 图渲染错乱 / 连线错位 | 数据层对象被 d3 就地改写 | 双层副本 + `links()` 前快照 id |
| jsdom 里组件崩 | `ResizeObserver` 未守卫 | `typeof !== "undefined"` + 降级 |
| 原型测试改了交互却仍全绿 | DOM 桩盲区（查不到绑错容器） | 真浏览器 E2E 补位 |
| 测试死锁 / 挂住 | `await` 前没 flush 手动时钟 | 先 `flushAsync` 再 await |
| LLM 返回非 JSON | 没开 json 模式 | `response_format:{type:"json_object"}` + 解析兜底 |
| 预算/额度突然耗尽 | 误用 `question_answers`（仅 100/日） | 改用 `search zhihu`（返回完整长文） |
| 真实登录跑不通 | 用了本地回调地址 | 必须部署 + 公网 HTTPS + 开放平台登记 |

---

## 12. 时间被压缩时怎么办

- **只剩 3 天**：卡 0-1 → 0-2 → 1-1（真对手）+ 1-5（选边撮合）。Host 其余能力可暂留半模拟，但**「选边 → 真人撮合 → Bot 兜底」这条必须成立**——它是赛道命题本身。
- **只剩 1 天**：做争议地图 + 树的真数据联动（原「三段联动」已因 D3 下线力导向图改为两段）。成本最低（界面接口活）、数据已真实、**demo 最安全**——网络故障或没人配对时，它是唯一还能撑住的演示。

**明确不建议的顺序**：按 PRD 编号推进（树 → 间 → 推演）——那是历史演进顺序，按它会先做一个没有真实数据可装的容器；或"先把原型打磨漂亮"——不解决"核心主张从未被真实验证"这个最大风险。

---

## 13. 并行开发：三个模块，三个 worktree

已建立（2026-09-13，本仓库独立成仓后重建）。

| 板块 | worktree 路径 | 分支 | 独占的模块文件 |
|---|---|---|---|
| 辩论树 | `zhengming/.worktrees/debate-tree` | `feat/debate-tree` | `prototypes/debate-tree-prototype.html`、`prototypes/debate-tree-canvas.html`、`prototypes/debate-tree-v2.html` |
| 辩论间 | `zhengming/.worktrees/debate-room` | `feat/debate-room` | `prototypes/debate-room-prototype.html` |
| 事件推演 | `zhengming/.worktrees/event-simulation` | `feat/event-simulation` | `prototypes/event-replay-prototype.html` |

> 路径相对 `E:/vibe_coding_prj/`。worktree 放在仓库内的 `.worktrees/` 下并已 gitignore——三条分支同源于本仓库，源码不跨仓，所以不需要放到外面。
>
> 目录 / 分支用新名 `event-simulation`；**文件名仍是 `event-replay-*`**（历史原因，改名只改了中文名与文案，见 §8 命名说明）。

### 13.1 铁律：共享文件只在 main 改

三个 worktree 同源，功能互不重叠，**唯一会打架的地方是共享文件**。所以归属必须划死：

| 归属 | 文件 |
|---|---|
| 辩论树 独占 | `prototypes/debate-tree-*.html`、`prototypes/debate-tree-v2.test.mjs`、`prototypes/debate-graph.test.mjs`、`docs/design/debate-tree-PRD.md` |
| 辩论间 独占 | `prototypes/debate-room-prototype.html`、`prototypes/debate-room.test.mjs`、`docs/design/debate-room-PRD.md` |
| 事件推演 独占 | `prototypes/event-replay-prototype.html`、`prototypes/event-replay.test.mjs`、`docs/design/event-replay-PRD.md` |
| **共享 → 禁止在任何 worktree 分支上改** | `prototypes/build-app.mjs`、`prototypes/app.test.mjs`、`README.md`、`docs/design/IMPLEMENTATION-PATH.md`、`docs/design/host-contract.md`、`zhengming-server/`（原型后端），以及 `web/` 的工程配置（`package.json`、`vite.config.ts`、`tsconfig*.json`、`src/App.tsx`、`src/styles.css`、`tests/setup.ts`） |
| **生成物 → 任何人都禁止手改** | `prototypes/zhengming-app.html`（由 `prototypes/build-app.mjs` 产出）、`web/src/data/controversyMap.ts`（由 `research/controversy-map/build-ts.mjs` 产出） |
| **桌面视图归属** | `web/src/ui/DebateTreePrototype.tsx`（`?view=debate`）归**辩论树** worktree；`ControversyMap.tsx`（`?view=map`）不属于这三个模块中的任何一个——它没有对应 worktree，改动直接走 `main`。`DebateForceTree.tsx`（`?view=force`）已随 D3 拍板移除。 |

**规则**：某个 worktree 需要动共享文件时，**回到 `main` 改**，然后其余 worktree `git merge main` 跟进。

> 绝不在模块分支上改共享文件——那会把"三方各自的独立改动"变成"手工解同一文件的冲突"，工作树隔离的意义就没了。

### 13.2 顺序：阶段 0 必须先在 main 落地

**卡 0-1（Host 契约）与卡 0-2（最小通道）是三个模块的公共地基**，三个 worktree 都要调它。如果在分支上各自实现，会产出**三份互不兼容的 Host 调用**。

正确顺序：

1. **先在 `main` 上完成卡 0-1、0-2**（契约 + 能跑通一次真实调用）
2. 三个 worktree 各自 `git merge main`，拿到契约与通道
3. 再分别开工：辩论间 1-1、1-4、1-5（**1-2、1-3 已作废**）/ 辩论树 2-1、2-2、2-4（**2-3 已作废**）/ 事件推演 4-1…4-4

### 13.3 合流与收尾

1. **分支内自测**：跑该模块的测试，全绿再合
2. **逐个合回 `main`**（建议顺序：辩论树 → 辩论间 → 事件推演；三者独占文件不同，理论上无冲突）
3. **每合一个，立刻在 `main` 上重跑全部五套测试**（195 项）——防止"单独绿、合起来红"
4. 全部合完 → **在 `main` 上重跑 `prototypes/build-app.mjs`** 重新生成 `prototypes/zhengming-app.html`
5. 清理：`git worktree remove <path>`；分支可留作记录

### 13.4 两个环境注意

**（1）依赖分布。** `node_modules` 是 gitignore 的，不会进 worktree；本机 `npm` 又不可用。

- `prototypes/**` 的测试**零依赖**，`node xxx.test.mjs` 直接能跑——三个模块的主战场在这里，**worktree 不需要任何依赖**。
- `web/` 是 Vite 工程，**需要 `node_modules`**（主工作区已从 runi 复制了一份，约 116 MB）。三个 worktree 建立时 `web/` 还不存在，所以它们没有这份依赖。
  某分支要在 worktree 里跑 `web/` 测试时，`git merge main` 后在 worktree 的 `web/` 下再复制/联接一份依赖即可；或者干脆回主工作区跑（`web/` 的改动按 §13.1 本就不该在模块分支上做）。

**（2）检出后仍是 CRLF。** 本机 `core.autocrlf=true` 且无 `.gitattributes`，所以 worktree 里的原型文件依旧是 CRLF 换行——**§2.7 那条"跨行正则必须写 `\r?\n`"在 worktree 里同样适用**。
