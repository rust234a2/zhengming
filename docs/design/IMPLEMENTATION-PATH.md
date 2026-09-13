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
| 0-1 | 定稿 Host 契约 | — | ☐ |
| 0-2 | 打通最小可调用通道 | 0-1、D1 | ☐ |
| 1-1 | 对手改由模型生成 | 0-2 | ☐ |
| 1-2 | 承认校验走真 Host | 0-2 | ☐ |
| 1-3 | 概念对齐走真 Host | 0-2 | ☐ |
| 1-4 | 终局评估走真 Host | 0-2 | ☐ |
| 1-5 | 匹配算法落地 | 1-1…1-4、D2 | ☐ |
| 2-1 | 树 schema 可持久化 | 1-5 | ☐ |
| 2-2 | Agent 追问点走真 Host | 2-1 | ☐ |
| 2-3 | 辩论间终局上树（打通） | 2-1、1-4 | ☐ |
| 2-4 | 知乎冷启动建树 | 2-1 | ☐ |
| 3-1 | 地图 → 力导向图 | 2-3 | ☐ |
| 3-2 | 力导向图 → 树 | 3-1 | ☐ |
| 3-3 | 地图数据作冷启动种子 | 2-1、3-1 | ☐ |
| 4-1 | 事件库 schema + 准入检查 | 0-2 | ☐ |
| 4-2 | 入库真实事件 ×3 | 4-1 | ☐ |
| 4-3 | Host 推演追问走真 Host | 4-2 | ☐ |
| 5-1 | 重建集成应用 | 全部原型改动 | ☐ |
| 5-2 | 部署 | 5-1 | ☐ |
| 5-3 | OAuth 真登录 | 5-2、D2 | ☐ |

**三个决策点（需要用户拍板，AI 不许自己决定）**

| 编号 | 问题 | 影响 |
|---|---|---|
| **D1** | Host 走「原型 + Node 后端」还是「移入 runi-desktop + core 会话通道」 | 决定阶段 0 的全部工作形态 |
| **D2** | 匹配公式的 `style` 信号是否取用户知乎收藏/关注 | 取则 OAuth 必须从阶段 5 提前到卡 1-5 之前，整个顺序重排 |
| **D3** | 力导向图（`?view=force`）保留还是下线 | 它的 PRD 已于 2026-09-13 移除，目前有代码无文档 |

---

## 1. 起点：什么已经真实，什么是演的

**动手前必须读完这张表**，否则会做错优先级。

| 模块 | 交互 | 数据 | LLM | 结论 |
|---|---|---|---|---|
| 跨议题争议地图 | ✅ | ✅ 真实知乎检索 | ✅ 真实 DeepSeek 管线 | **唯一端到端真实的模块** |
| 实时辩论间 | ✅ 七阶段完整 | ❌ 硬编码脚本 Bot | ❌ 选项匹配模拟 | 全模拟 |
| 辩论树 | ✅ | ❌ mock | ❌ Agent 追问是模拟 | 全模拟 |
| 事件推演 | ✅ | ❌ 1 个事件、静态占比 | ❌ | 全模拟 |
| 力导向图 | ✅ | ❌ 21 节点 mock | — | 全模拟 |

**一句话概括起点**：交互设计已经验证透了，**业务内核 100% 是模拟的**。所有"真人""真模型""真数据"的部分都还没接。

**证据（每条都可直接查证，不要凭印象）**

- `prototypes/debate-room-prototype.html:405` — `startMatch()` 是 `await sleep(1000)` 然后显示预置对手，**没有任何匹配逻辑**
- `prototypes/debate-room-prototype.html:326-334` — `BOT_TREE / BOT_OPENING / BOT_QUESTION / BOT_ANSWERS` 全是硬编码常量
- `prototypes/debate-room-prototype.html:316-325` — `CONCEPTS` 用 `ok:true / false` 字段模拟 Host 判定
- `runi-desktop/src/data/debateGraph.ts` — 力导向图的 21 节点 mock
- `research/controversy-map/extract-claims.mjs` — **「争鸣」原型线里唯一真的在调 LLM 的代码**（runi-core 侧另有一整套 provider 实现，见 §2.3），是本手册反复引用的参考实现

---

## 2. 不可违反的约束

违反任何一条都会返工，其中 2.1 会被评审当场抓到。

### 2.1 产品红线（四条，贯穿所有模块）

| 红线 | 含义 | 自检方法 |
|---|---|---|
| **不判输赢** | 没有任何"谁赢"的字段、分数排名或文案 | 全局搜 `winner\|rank\|胜负\|赢了\|败` |
| **追问权替代验证权** | Agent 只追问、不裁判 | 搜 `谬误\|偷换\|你错了\|错误\|对错` 必须 0 命中 |
| **先承认再推进** | 复述未通过忠实校验，不许发言 | 校验函数必须能**真的拒绝**（造一个偷换用例验证） |
| **模拟与事实分离** | 事件推演终局前不泄露真实走向 | 终局前 DOM 里搜不到真实选项文本 |

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
   │   1-1 对手 → 1-2 承认 → 1-3 概念 → 1-4 评估    │
   │   → 1-5 匹配算法（阶段灵魂）                    │
   └───────────────────┬──────────────────────────┘
                       ▼
   ┌──────────────────────────────────────────────┐
   │ 阶段 2  辩论树 · 真沉淀 + 真追问                │
   │   2-1 schema → 2-2 追问 → 2-3 上树 → 2-4 冷启动 │
   └───────────────────┬──────────────────────────┘
                       ▼
   ┌──────────────────────────────────────────────┐
   │ 阶段 3  三段联动  地图 → 力导向图 → 树          │
   └───────────────────┬──────────────────────────┘
                       ▼
   ┌──────────────────────────────────────────────┐
   │ 阶段 4  事件推演 · 真事件库       （可并行/后置）│
   └───────────────────┬──────────────────────────┘
                       ▼
   ┌──────────────────────────────────────────────┐
   │ 阶段 5  集成 · 部署 · OAuth 收口 （外部流程）   │
   └──────────────────────────────────────────────┘
```

**为什么阶段 1 排第一**：赛道命题就叫「灵魂匹配局」，而匹配在原型里只是**一张模拟卡**——产品最核心的主张从未被真实验证过。同时它是唯一"两个真人连接"发生的地方（社交价值在此），也是全链上游（终局 settlement 上树、分歧点进事件推演）。**落差最大**：评审问一句"对手是谁、Host 是真模型吗"就会露馅。

**为什么地图最成熟却排第三**：它是**浏览层/放大器，不是发动机**——不产生新数据、不连接人。三段联动需要树里先有真实数据，否则点进去看到的是 mock。但地图有个被低估的价值：**它是冷启动数据源**（15 个真实议题 + 23 条真实论点可直接喂给树与力导向图，解决"空树"）。

---

## 4. 阶段 0：Host 通道（地基）

**目标**：让"Host"这个角色从"选项匹配模拟"变成**真实可调用的服务**，且所有模块共用同一份契约。

### 卡 0-1 · 定稿 Host 契约（只写文档，不写实现）

- **产出**：`docs/design/host-contract.md`
- **内容**：六个能力，每个都要 JSON schema + **1 个正例 + 1 个反例**

| # | 能力 | 签名 | 用途 |
|---|---|---|---|
| 1 | 概念对齐 | `alignConcepts(topic, stanceA, stanceB) → {concepts:[{key, options:[{text, neutral:boolean}]}]}` | 辩论间 ① |
| 2 | 承认校验 | `checkRestatement(original, restatement) → {faithful:boolean, reason}` | **实现「先承认再推进」** |
| 3 | 结构提示 | `structureHint(statement) → string` | 立论阶段，**只提示结构、不代写内容** |
| 4 | 质询生成 | `makeQuestion(targetClaim, history) → string` | 辩论间 ④ |
| 5 | 中立评估 | `evaluate(transcript) → {dims:{立论,论据,逻辑,回应,表达,规范}, total, grounds[]}` | 辩论间 ⑦ |
| 6 | 终局追问 | `terminalProbes(transcript, userPath, realPath) → [string, string]` | 辩论间 ⑦ / 事件推演 |

- **硬约束**：能力 3/4/5/6 的返回文本必须过**禁用词表**：`错误 | 谬误 | 偷换 | 输赢 | 对错 | 你错了 | 赢了`
- **验收**
  - `docs/design/host-contract.md` 存在，六个能力 schema 齐全，每个都有正/反例
  - 文档中**显式列出**禁用词表
- **完成标志**：用户确认契约（这是一个闸口，不许跳过）

### 卡 0-2 · 打通最小可调用通道（按 D1 选择路线）

**路线 A 步骤**（建议先走这条）

1. **新建 `zhengming-server/`**（Node，零依赖，只用 `node:` 内置模块 + 全局 `fetch`）
   - `server.mjs`：静态托管 + `/api/host/:capability` 路由
   - **key 从 `process.env.DEEPSEEK_API_KEY` 读，不落盘、不进代码、不进日志**
   - 请求体上限 256KB；30s 超时；失败返回结构化错误（不是裸 500）
   > 这会新增一个顶层目录；若只服务原型，退路是放 `prototypes/server.mjs`，但不得把可执行代码放回 `docs/`。
2. **只实现一个能力**打通链路：先做 `checkRestatement`（它最短、判据最清晰）
3. **复用已验证的调用参数**（直接抄 `research/controversy-map/extract-claims.mjs`）：
   - endpoint `https://api.deepseek.com/chat/completions`
   - `model: "deepseek-chat"`
   - `response_format: { type: "json_object" }`
   - 批处理 + 落盘缓存支持续跑（参考同目录 `.claim-cache.json` 的做法）

- **验收**
  - `curl -X POST localhost:<PORT>/api/host/checkRestatement -H 'Content-Type: application/json' -d '{...}'` 返回结构化 JSON
  - **故意传一个偷换的复述**，必须返回 `faithful:false`（不能一律 true）
  - `grep -r "sk-" <产物目录>` → **0 命中**
- **完成标志**：一次真实模型调用能从浏览器点通，且 key 不出现在任何客户端可见文件里

---

## 5. 阶段 1：辩论间 —— 真匹配 + 真 Host ★最高优先

### 卡 1-1 · 对手改由模型生成（先把最假的部分换掉）

- **现状**：`prototypes/debate-room-prototype.html:326-334` 四个硬编码常量
- **目标**：`BOT_*` 常量替换为 `/api/host/opponent/*` 三个调用
  - `opening(stance, tree)` → 立论陈述
  - `answer(question, myTree, style)` → 正面回答，或（**受控地**）回避
  - `question(myTree)` → 一条质询
- **必须保留的可测性**：模型输出仍要落成与 `BOT_TREE` **同构**的结构（结论 / 理由 / 依据），否则下游七个阶段全要改
- **验收**
  - 同一个质询问题调两次，返回**不同但都合规**的回答 → 证明不是复读常量
  - 回答中必须**引用我方的具体论点**（不能是泛泛而谈）
  - `STAGE_NAMES` 七阶段流程仍能走完（跑 `event-replay`/`debate-room` 两套测试）
- **完成标志**：对局中的"对方"会针对你说的话回应

### 卡 1-2 · 承认校验走真 Host

- **现状**：`CONCEPTS` 的 `ok` 字段 + 选项匹配是模拟
- **目标**：接 `checkRestatement`。未通过时给出**描述式**拦截文案
- **验收**
  - 输入一个偷换的复述（"我理解你是说 X"，实际对方说的是 Y）→ `faithful:false`
  - 输入忠实复述 → `true`
  - 拦截文案 **0 命中**禁用词表
- **完成标志**：真的能拦住偷换，而不是永远放行

### 卡 1-3 · 概念对齐走真 Host

- `alignConcepts` 从议题 + 双方立场抽出 2-3 个概念；每个给 1 个中性 + 2 个带倾向的定义；双方不一致时要求重选（**上限 2 次**，超限允许带差异继续并记入档案）
- **验收**：抽出的概念**不是**硬编码的那两个（换议题再试一次，结果应当不同）；不一致时确实拦截
- **完成标志**：概念由议题推导而来

### 卡 1-4 · 终局评估走真 Host

- `evaluate(transcript)` 返回六维分数 + **依据**；依据必须**引用具体发言**
- **保留现有接口形状**（`evaluate() → {dims[6], total, verdict}`），只换内部实现，这样 UI 不用改
- **验收**
  - 雷达图仍正常渲染（六维 **2 字标签**）
  - 终局卡必须含"**不构成胜负判定**"
  - 输出中**无排名、无胜负**
  - 六维等权（`total` 等于六维平均）
- **完成标志**：评分依据能指回真实发言

### 卡 1-5 · 匹配算法落地（阶段 1 的灵魂）

- **目标**：把 `startMatch()`（`prototypes/debate-room-prototype.html:405`）的假实现换成真算法
- **公式**：`score = base × 0.35 + debate × 0.45 + style × 0.20`

| 因子 | 含义 | 数据来源 |
|---|---|---|
| `base` | 议题基础匹配：同议题 + **立场对立度** | 议题立场分布（可复用地图管线的立场抽取） |
| `debate` | 辩论风格 | 历史发言类型分布（反驳/举证/承认/修正/寻共识） |
| `style` | 个人风格 | 追问方式、证据偏好 |

- **冷启动**（无历史）降级顺序：站内行为 → 知乎信号 → 仅 `base`
- **D2 决策**：`style` 是否取用户知乎收藏 / 关注？
  - **取** → OAuth 必须**提前到本卡之前**（先做部署 + 登记回调，见卡 5-2/5-3），整个顺序重排
  - **不取**（用站内行为代理）→ OAuth 安心留在阶段 5
- **验收**
  - **可复现**：同输入同输出（不许有随机、不许依赖时间）
  - **单调性**：造 3 组对照，立场越对立分数越高
  - **不崩**：无历史用户走降级路径，有结果
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

### 卡 2-3 · 辩论间终局上树（打通）

- 辩论间终局产出 `settlement` 节点挂到对应树的 root 下：争议档案（共识 / 分歧 / 未决 / 最强论点 / 回避记录）
- **验收**：走完一局 → 树上出现 settlement 节点 → 内容与终局卡一致
- **完成标志**：**对局产物不再散回时间线**（这是辩论树存在的理由）

### 卡 2-4 · 知乎冷启动建树

- 流程：`search zhihu`（**不是** `question answers`，额度稀缺）→ 按 question id 聚合 → LLM 两步法抽立场 → 生成两级树（root → 三派桶 → 代表论点，带 `source` 溯源）
- **验收**：新建的树第一层 claim 带知乎 `source`，且**立场分布不是一边倒**（最大簇占比 > 70% 判失衡并提示）
- **完成标志**：冷启动不需要人工录数据

---

## 7. 阶段 3：三段联动

### 卡 3-1 · 地图 → 力导向图

- 入口：`?view=map` 点议题 → 载入 `?view=force&topic=<id>`
- **D3 注意**：力导向图现在用 `src/data/debateGraph.ts` 的 mock（21 节点）。改动应在 `debateGraph.ts` 做**视图映射**（root→topic、claim→argument、追问→response…），**保持 SimNode 映射层不动**
- **验收**：点不同议题，力导向图载入不同数据；节点数与源议题一致
- **完成标志**：索引层 → 感知层闭环

### 卡 3-2 · 力导向图 → 树

- 通过 `originRef` / `url` 桥接，点节点可跳进对应辩论树
- **验收**：跳转后树定位到该节点（不是回到根）
- **完成标志**：三段动线（地图选题 → 沙盘看阵型 → 树里开辩）贯通

### 卡 3-3 · 地图数据作冷启动种子

- 把地图已有的 **15 议题 / 23 论点 / 5 主张簇** 转成树的初始节点，解决"空树"问题
- **验收**：新建的树非空、有真实议题与论点、可回溯知乎原问题
- **完成标志**：不再有"新树没内容"

---

## 8. 阶段 4：事件推演 —— 真事件库

> 命名说明：本模块原名「事件复盘器」，2026-09-13 更名为「**事件推演**」。旧名重心在"回顾"，而核心动作是**在岔路口做选择、看模拟后果**；且"复盘器"暗示进来就能看到真实走向，与产品的**剧透保护**第一规则相悖。文件名为历史原因仍为 `event-replay-*`。

### 卡 4-1 · 事件库 schema + 准入检查

- schema：`stages`（事件节点序列）/ `choices`（2-3 选项）/ `outcomes` / `realPath` / `realSource`（知乎溯源）/ `forks`
- **准入底线三条（硬性，不满足不许入库）**
  1. 只收**公共讨论充分**的事件（知乎已有问题/高热度）
  2. 涉及**灾难、伤亡的事件不入库**（推演 ≠ 消费苦难）
  3. 改编规则：人物化名、机构模糊、时间粒度到月
- **验收**：写一个准入检查函数；给 3 个不满足条件的事件样本，全部必须被拒
- **完成标志**：准入是**代码校验**，不是靠人自觉

### 卡 4-2 · 入库 3 个真实事件

- 人工策划 + 知乎事件类回答溯源
- **验收**：每个事件有 ≥2 个岔路口、≥3 种结局、真实路径标记、真实层带知乎链接
- **完成标志**：事件库从 1 个涨到 3 个

### 卡 4-3 · Host 推演追问走真 Host

- 推演中：偏离真实路径的岔路口给一条**假设澄清式**追问（"你选这条路的隐含假设是 X，依据是什么？"），**不评判选择本身**
- 终局：`terminalProbes` 输出 2 条，指向**决策模式**
- **验收**：文案无评判词；追问确为假设澄清式；可一键转成辩论树追问节点
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
# 期望：52 / 41 / 40 / 26 / 36 全通过
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

- **只剩 3 天**：卡 0-1 → 0-2 → 1-1（真对手）+ 1-5（真匹配）。Host 其余能力可暂留半模拟，但**「AI 真的撮合了两个人」这条必须成立**——它是赛道命题本身。
- **只剩 1 天**：做阶段 3 的三段联动。成本最低（界面接口活）、数据已真实、**demo 最安全**——网络故障或没人配对时，它是唯一还能撑住的演示。

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
| **桌面视图归属** | `web/src/ui/DebateTreePrototype.tsx`（`?view=debate`）归**辩论树** worktree；`ControversyMap.tsx`（`?view=map`）与 `DebateForceTree.tsx`（`?view=force`）不属于这三个模块中的任何一个——它们没有对应 worktree，改动直接走 `main`。 |

**规则**：某个 worktree 需要动共享文件时，**回到 `main` 改**，然后其余 worktree `git merge main` 跟进。

> 绝不在模块分支上改共享文件——那会把"三方各自的独立改动"变成"手工解同一文件的冲突"，工作树隔离的意义就没了。

### 13.2 顺序：阶段 0 必须先在 main 落地

**卡 0-1（Host 契约）与卡 0-2（最小通道）是三个模块的公共地基**，三个 worktree 都要调它。如果在分支上各自实现，会产出**三份互不兼容的 Host 调用**。

正确顺序：

1. **先在 `main` 上完成卡 0-1、0-2**（契约 + 能跑通一次真实调用）
2. 三个 worktree 各自 `git merge main`，拿到契约与通道
3. 再分别开工：辩论间 1-1…1-5 / 辩论树 2-1…2-4 / 事件推演 4-1…4-3

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
