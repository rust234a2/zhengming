# 争鸣 · Host 契约

版本 v1.3（草稿） · 2026-09-14 · 对应任务卡 **0-1**（`IMPLEMENTATION-PATH.md`）
状态：**已确认**（2026-09-14 用户拍板接真实 LLM 并指定 StepFun 上游，闸口通过，可开卡 0-2）。

> **v1.3 变更（2026-09-14，增加明确的 AI 对辩能力）**
>
> - 新增能力 4 `opponentTurn`，仅服务于用户明确选择的 AI 对手；后续能力编号顺延。
> - Bot 每次只生成一个动作，动作仍须通过房间共享 `transition()`；上游失败时启发式降级并公开标记。
> - **同日补记（§0.7）**：补齐事件推演公共形状（`EventHeader` / `Position` / `Act` / `LedgerEntry` / `RelationEntry` / `SceneLog`）。这六个类型此前只在能力 5..7 的签名里被**引用**、没有**定义**，前后端只好各自想象，首度联调即报 `400 VALIDATION: ledger must be an array`——本节以服务端既有实现（`zhengming-server/lib/host.mjs`）为准把它们钉死。
>
> **v1.2 变更（2026-09-14，升级上游为 StepFun）**
>
> - **变更动因**：用户指定 Host 上游改用**阶跃星辰 StepFun**（原为 DeepSeek）。
> - **本次改动**：① §0.3 参数基线改为 StepFun 的 OpenAI 兼容端点与 `step-3.7-flash`；② §0.2 密钥环境变量 `DEEPSEEK_API_KEY` → `STEPFUN_API_KEY`；③ 状态从「待用户确认」改为**已确认**（闸口通过）。
> - **保留不动**：原有能力签名、统一信封、错误码枚举、幂等与重试、禁用词表、`Turn` 形状、隔离硬约束。
> - **本条作废**：v1.1 中一切 DeepSeek 专有表述（`api.deepseek.com`、`deepseek-chat`、`DEEPSEEK_API_KEY`）。
>
> 当前共 **9 个能力**。原「概念对齐 `alignConcepts`」与「承认校验 `checkRestatement`」已移除；`opponentTurn` 是 2026-09-14 新增的 AI 席位能力；`replayCompose`（能力 9，事件生成）是同日晚补记的通用化入口，见 §0.8。

---

## 0. 通用约定

### 0.1 调用信封

通道按 **D1 已拍板：路线 A** 写死信封，`zhengming-server/` 承载：

```
POST /api/host/:capability        # capability ∈ 能力 1..9 的机器名
Content-Type: application/json    # 请求体上限 256KB，超限拒收
超时：30s；生成式长文本能力（6 actAdvance / 7 replayEnding / 9 replayCompose）90s
```

> **超时分级（2026-09-14 补记）**：真机实测 actAdvance 单幕生成 P50 ≈ 26s，带 history 的
> 中后幕普遍越过 30s——30s 阈值下 TIMEOUT 是高频事件而非兜底，前端表现为
> 「这一步暂时无法推进/模型响应超时」频发。故能力 6/7/9 放宽到 90s，其余能力维持 30s。

```jsonc
// 成功
{ "ok": true, "capability": "makeQuestion", "requestId": "r-123", "result": <能力专属载荷> }
// 失败
{ "ok": false, "error": { "code": "<ERROR_CODE>", "message": "<给开发者看的英文短句>", "requestId": "r-123" } }
```

`ERROR_CODE` 枚举：`VALIDATION`（入参不过 schema）｜`CAPABILITY_NOT_FOUND`｜`PAYLOAD_TOO_LARGE`｜`TIMEOUT`｜`UPSTREAM`（模型侧 5xx/限流）｜`CONTENT_REJECTED`（返回文本过不了禁用词表或结构校验，服务端重试 1 次后仍失败才回此码）。

### 0.2 幂等与重试

- 每次请求携带 `requestId`；同 `requestId` 重复到达必须返回缓存结果，不得二次计费/二次生成。
- 客户端失败重试保留草稿（辩论间）/ 整幕重试（事件推演），不把半成品冒充结果。
- 密钥（`STEPFUN_API_KEY`）只在服务端环境变量读取，**不落盘、不进日志、不下发前端**；日志脱敏一切 `Authorization` 头。

### 0.3 模型参数基线

已验证的调用参数（StepFun 阶跃星辰，OpenAI 兼容）：

- endpoint `https://api.stepfun.com/v1/chat/completions`
- `model: "step-3.7-flash"`
- 鉴权 `Authorization: Bearer $STEPFUN_API_KEY`
- 需要结构化输出的能力（3/4/5/6/7/8）用 `response_format: {type:"json_object"}`
- 能力 6/7 另开 `stream: true`（见 0.4）
- 建议 `temperature: 0.5`（平台默认，收敛稳定）；结构化能力可下调至 0.3

### 0.4 流式（仅能力 6/7，D4 已拍板）

- 服务端以 SSE（`text/event-stream`）或 NDJSON 分块转发模型增量。
- 客户端解析规则（与 `event-replay-PLAN.md` §3.3 一致）：
  1. 叙事字段（`outcome`、`nextScene.text`）边到边渲染；
  2. 结构字段（`moves[]` 等）必须等完整 JSON 到齐并过 `validateActAdvanceResult`（含 `atEnding` 前端归一化）+ `filterWithinVisible`（越界事实丢弃不展示）+ `assertNoCanonLeak` 后才可交互；
  3. 流中断即失败态，重试**整幕重新生成**；
  4. 禁用词过滤在**流结束后**对完整文本执行。

### 0.5 禁用词表（硬约束）

**能力 1..8 的全部返回文本**（含嵌套字段、流式拼合后的完整文本）不得出现：

```
错误 | 谬误 | 偷换 | 输赢 | 对错 | 你错了 | 赢了
```

命中即视为 `CONTENT_REJECTED`（先由服务端重试 1 次）。这是产品红线「不判输赢 / 追问权替代验证权」在契约层的落点。

### 0.6 发言记录 `Turn`（能力 2/3/4 的公共入参形状）

```ts
interface Turn {
  turnId: string;          // 稳定 id
  authorId: string;        // "user" | "bot" | "host"
  kind: string;            // "brief" | "opening" | "question" | "answer" | "free" | "closing" | ...
  text: string;            // 纯文本，服务端与模型都不得依赖 HTML
  evidenceStatus?: string; // 证据七档（辩论间）
}
```

### 0.7 事件推演公共形状（能力 5/6/7 的入参；2026-09-14 补记）

> **为什么补这一节**：v1.3 之前，能力 5..7 的签名只写了类型名（`LedgerEntry[]`、`SceneLog[]`…），没有结构定义。前端把账本做成「五维累加对象」、把关系做成 `Record<positionId, number>`，服务端按「条目列表」实现，两边各自想象，首度联调第一发请求就是 `400 VALIDATION: ledger must be an array`。本节以**服务端既有实现为准**把这六个类型钉死；此后任何一方改形状，都必须同时改本节。

```ts
interface EventHeader {
  id: string;
  title: string;
  background: string;                                  // 事件背景（不含原作走向）
  endingCondition: { kind: "actCount"; actCount: number };
}

interface Position {
  id: string;
  name: string;        // 角色位名称（如「当事人」「配偶」）
  role?: string;       // 一句话身份说明（供提示词使用）
  stake: string;       // 这个位置押上了什么
  visible: string[];   // 该位置**只能知道**什么，逐条一项；nextScene.visibleFacts 必须落在此集合内
  resources: string;   // 可动用的资源
  canDo: string[];     // 能做与不能做的事
}

interface Act { index: number; month: string; text: string }

interface LedgerEntry {               // 代价账本条目（**累加态**，不是增量）
  key: string;                        // 账本维度，取值见下方枚举
  value: number;                      // 当前累计值
}

interface RelationEntry {             // 关系态（**累加态**）
  target: string;                     // 关系对象，用 Position.name
  value: number;                      // 当前态度值，-100..100
}

interface SceneLog {                  // 已锁定的一幕（既成事实，不得改写）
  actIndex: number;
  month: string;
  moveText: string;                   // 玩家当时选的动作
  outcome: string;                    // 该动作的后果叙事
}
```

**账本维度枚举（`LedgerEntry.key`）**——PRD §F3 定死五维，模型不得自造：

```
时间 | 钱 | 关系 | 健康 | 机会
```

服务端对模型返回的 `ledgerDeltas[].key` 做归一化：命中枚举则采用，**无法归一则丢弃该条**（不得静默塞进别的维度）。客户端构造入参时使用同一组中文键，模型因此倾向于沿用。

**可见事实（`nextScene.visibleFacts`）**——§6 硬约束的粒度定义（2026-09-14 联调补记）：

`visibleFacts` 的每一条必须取自 `Position.visible` 列表（**逐字摘取**：不改写、不合并、不新增）。这条约束同时压住三处写法，缺一处就整幕失败：

| 位置 | 要求 |
|---|---|
| 事件库 `Position.visible` | 必须写成**事实级条目**（如「聘用条件：编制、安家补贴、子女随迁就读」），**不能**写成抽象类别（「聘用条件」）——否则模型无从摘取 |
| 提示词 `prompts.mjs` | 把该列表逐条列给模型，并显式要求「visibleFacts 只能从这里逐字摘取」 |
| 客户端 `assertWithinVisible` | 在**归一化后**做互相包含匹配（容忍标点差异与适度精简），只拦范围外的内容 |

同批提示词硬要求（与本节配套）：`moves` 必须 2-3 张；`relationDeltas[].target` 必须**照抄**其他角色位的名字；`ledgerDeltas[].key` 只能取五维之一，本幕无代价时返回空数组。

**三处「宽容」的取舍**（都要有测试守着；2026-09-14 由两处扩为三处）：

- `ledgerDeltas[].key` 归一化不了 → **丢弃该条**，不得塞进别的维度（否则会伪造出一条玩家没付过的代价）；
- `relationDeltas[].target` 解析不到任何角色位 → **丢弃该条，不阻断整幕**。为一处称谓不精确就废掉整幕（玩家只能干等重试），代价远高于少看一条态度变化。解析用三级匹配：id → 角色名 → 互相包含；
- `nextScene.visibleFacts` 越界条目 → **丢弃不展示**（越界内容不进「知道」列表即无泄露，过滤本身就是完整防护），不再整幕拒收。真机实测模型偶尔会补一句范围外事实，把随机性变成整幕失败不可接受。判定规则：归一化（去空白标点、统一小写）后互相包含。`atEnding` 同理**由前端按幕数归一化**，不作为校验对象——终局节奏是 `endingCondition.actCount` 定的硬规则。

**形状方向（最易混，写死）**

| 位置 | 字段 | 形状 | 语义 |
|---|---|---|---|
| 能力 5/6/7 **入参** | `ledger` | `LedgerEntry[]` | 累加态快照 |
| 能力 5/6/7 **入参** | `relations` | `RelationEntry[]` | 累加态快照 |
| 能力 5 **出参** | `ledgerDeltas` | `{ key, delta, note }[]` | 本幕增量 |
| 能力 5 **出参** | `relationDeltas` | `{ target, delta }[]` | 本幕增量 |

**客户端职责**：内部状态可自由表示（前端即用五维加法器 + `Record`），但**进出 `POST /api/host/*` 的边界必须完成上述转换**，且转换只发生在请求体的构造/解析层（`eventReplayClient.ts`），不得散落到 UI。

### 0.8 事件生成 `replayCompose`（能力 9；2026-09-14 晚补记）

> **动因**：事件推演原本只能玩事件库里预置的三例——「有明显时间线的社会事件」这个类目无法泛化。
> 能力 9 把**事件脚本的起草**也交给 Host：用户给一段事件材料（+ 可选时间线节点 + 幕数），
> 模型产出一份符合 §0.7 形状的事件脚本，前端归一化后与种子事件**同池进入同一运行时**；
> `actAdvance` / `replayEnding` 零改动复用。

**请求** `replayCompose({ topic: string, timeline?: string[], actCount?: number })`

- `topic`：事件主题与背景（非空，≤2000 字符）；
- `timeline`：明确的时间节点，每条 ≤200 字符、至多 8 条（可空——让模型自行提炼节拍）；
- `actCount`：幕数，整数 ∈ [2,5]，缺省 3。**终局节奏由这个数定死**，与 §0.7 的 `atEnding` 前端归一化一致。

**响应载荷**（结构化 JSON，服务端已规格化）：

```jsonc
{
  "title": "事件短题（≤30 字，不含真实人名机构名）",
  "background": "处境背景（时间粒度到月，人物化名）",
  "admission": { "publiclyDiscussed": true, "disasterOrCasualty": false },
  "positions": [ /* §0.7 的 Position 形状：id 为英文短横线 slug、visible 为事实级条目、
                    relations[].to 必须指向已知角色位（服务端丢弃未知指向） */ ],
  "acts": [ /* §0.7 的 Act 形状：index 由服务端重排为 0..n-1，month 为 YYYY-MM */ ]
}
```

**红线落点（服务端 RESULT_CHECKS 硬执行）**：

1. **准入底线 2**：模型按提示词如实申报 `admission.disasterOrCasualty`，置 `true` 即 `CONTENT_REJECTED`（中文原因直接透传给用户：涉及灾难或伤亡的事件不入推演）；
2. **只生成「壳」**：角色位 / 幕节拍 / 信息范围。**不生成 canon**——史实对照必须有人工核实的来源（§7），生成事件一律 `canon: []`，前端据 `compose-` 前缀禁用终局的原作对照揭示入口；
3. **不扮演真实个人**：角色位一律虚构位置、化名、机构模糊（提示词 + `validateEventReplay` 双闸）；
4. **无 key 不硬凑**：`replayCompose` 没有启发式降级——降级硬凑只会产出廉价假结构，直接 `UPSTREAM` 失败。

**前端归一化（`normalizeComposedEvent`）**：事件 id 由前端生成（`compose-<毫秒>`）；幕序号重排连续；幕数即结局条件；关系丢弃未知指向并钳制 ±100；空条目过滤。归一化后必须过与种子事件**同一份** `validateEventReplay`，不过不进推演。

---

## 1. 结构提示 `structureHint`

**用途**：立论阶段**只提示结构、不代写内容**——指出陈述里缺哪个结构要素，不给现成句子。

**请求** `structureHint(statement: string)`

**响应载荷**：`string`（一条面向用户的中文提示，≤60 字，只提结构要素名，不含可直接粘贴的论证内容）。

**正例**

```jsonc
// statement: "43 岁该辞职去苏州——窗口期不等人"
"你的陈述里有结论和一条理由，但没有给出判断标准——按什么标准衡量'该不该'？"
```

**反例**（服务端应拒收的模型输出——代写了内容，违反"不代写"）

```jsonc
"建议你补上：'孩子的适应能力可以通过提前安顿缓解'。"
```

---

## 2. 质询生成 `makeQuestion`

**用途**：辩论间 ②质询轮按对方立论结构条目生成追问；事件推演幕间追问沿用本能力。**一次只问一个问题**，禁打包追问。**本能力同时是卡 0-2 打通链路的第一个能力**（判据清晰：恰好一条问句、0 命中禁用词表）。

**请求**

```ts
makeQuestion(
  targetClaim: { label: string; text: string },  // 质询靶点（立论结构条目或事件推演事实）
  history: Turn[]                                 // 最近若干条发言，按时间序
)
```

**响应载荷**：`string`（一个问题，以「？」结尾，≤50 字，针对 `targetClaim`）。

**正例**

```jsonc
// targetClaim: { label: "依据", text: "苏州近三年面向全国引进骨干教师，公告年龄上限放宽至 45 岁" }
"这个 45 岁上限出自哪一年的哪份公告？现在还能查到吗？"
```

**反例**（拒收：打包了两个问题）

```jsonc
"这个数据是哪年的？另外你觉得孩子能适应吗？"
```

---

## 3. 中立评估 `evaluate`

**用途**：辩论间 ⑤终局，对全场 `transcript` 出六维结构画像。**只衡量论证结构与规范，不构成胜负判定**。

**请求** `evaluate(transcript: Turn[])`

**响应载荷**

```ts
{
  dims: { 立论: number; 论据: number; 逻辑: number; 回应: number; 表达: number; 规范: number }, // 0-100
  total: number,                 // 加权汇总（当前六维等权 1/6），不得作排名语义
  grounds: { dim: string; quote: string; reason: string }[]  // 每条依据必须引用 transcript 中的原话片段
}
```

**正例**

```jsonc
{ "dims": { "立论": 78, "论据": 64, "逻辑": 82, "回应": 71, "表达": 80, "规范": 90 },
  "total": 77,
  "grounds": [ { "dim": "论据", "quote": "近年外调资深教师多先被安排非毕业班", "reason": "全场唯一可查证来源，覆盖单一论点" } ] }
```

**反例**（拒收：grounds 未引用原话 / verdict 含胜负语义如"你在这场辩论里占了上风"）。

---

## 4. AI 席位行动 `opponentTurn`

**用途**：仅在用户明确选择「AI 对辩」后，为明确标注的 Bot 席位生成当前阶段的一个动作。它不是中立 Host 发言，也不得伪装成在线真人。

**请求**

```ts
opponentTurn({
  phase: "opening" | "crossAsk" | "crossAnswer" | "crossReact" | "free" | "closing";
  side: "pro" | "con";
  topic: TopicRef;
  presetClaim: string;
  ownBrief: OpeningBrief | null;
  opponentBrief: OpeningBrief | null;
  transcript: Turn[];
  crossRecords: CrossExamination[];
})
```

**响应载荷**：`{ action: RoomAction }`，其中 `kind` 只能是 `submitBrief`、`submitOpening`、`ask`、`answer`、`react`、`freeSpeak` 或 `submitClosing`。`ask.question` 必须是单个问句。

服务端按权威 `phase` 调用一次，只接受一个动作，并将它交给共享 `transition(state, botSide, action)` 校验和推进。相同权威状态使用相同 `requestId`；立论结构提交数、发言数等状态变化必须进入幂等键，避免复用上一动作。上游失败、输出不合规或领域拒绝时改用确定性动作，并在 `state.host.degraded` 与最终报告中明确记录降级。

**正例**

```json
{ "action": { "kind": "ask", "targetItem": "理由 1", "question": "这条理由在什么条件下不成立？" } }
```

**反例**：一次返回多个动作；`ask` 含多个问号；返回当前阶段不允许的动作；声称 Bot 是真人。

---

## 5. 终局追问 `terminalProbes`

**用途**：事件推演终局的两条决策模式追问（辩论间 v0.6 对局报告不含终局追问，是否恢复待定）。**只呈现给玩家，不做任何导出或跳转**（2026-09-13 拍板：事件推演为纯单人体验，无辩论树/辩论间联动）。

**请求** `terminalProbes(position: Position, history: SceneLog[], ledger: LedgerEntry[], relations: RelationEntry[])`

> **隔离约束（2026-09-13 修订）**：入参**不得含 `canon` / `realChoice` / 真实发展线**——终局追问与原作揭示（能力 8）相互独立：玩家可以只看追问而不展开原作，追问里出现任何"现实中发生了什么"都属隔离破防。旧签名的 `realPath` 参数**作废**。

**响应载荷**：`[string, string]` —— 恰好两条问题，各 ≤60 字，均指向**玩家的决策模式**（不对照史实）。

**正例**

```jsonc
["你在三次决定里都选了风险更低的一边——这是处境使然，还是你的风格？", "两次账本告急你都没向家人求助——你默认的关系支持是靠得住的吗？"]
```

**反例**（拒收：返回 1 条或 3 条；或追问里夹带评价如"你当初的选择是对是错"）。

---

## 6. 幕推进 `actAdvance`（事件推演核心）

**用途**：按角色位与所处推进一幕，产出叙事 + 2-3 张动作卡。**流式**（0.4）。

**请求**

```ts
actAdvance(
  header: EventHeader,      // 事件头（标题/时间跨度等静态元数据）
  position: Position,       // 角色位（含 visible 信息范围）
  acts: Act[],              // 历史时间表（actIndex 对位）
  actIndex: number,
  ledger: LedgerEntry[],    // 代价账本
  relations: RelationEntry[],
  history: SceneLog[],      // 已锁定幕次（含已生成 outcome）
  chosenMoveId: string | null
)
```

**响应载荷**

```ts
{
  outcome: string,                                  // 本幕结果叙事（流式边到边渲染）
  nextScene: { month: string; text: string; visibleFacts: string[] },
  moves: { id: string; text: string; costHint: string;
           implicitAssumption: string; label: string }[],   // **数量必须为 2-3**
  relationDeltas: { target: string; delta: number }[],
  ledgerDeltas: { key: string; delta: number; note: string }[],
  atEnding: boolean
}
```

**硬约束**

- `moves.length ∈ [2,3]`，越界即脏数据拒收；
- `nextScene.visibleFacts` ⊆ `position.visible` 所允许的信息范围，越界条目**丢弃不展示**（2026-09-14 起由整幕拒收放宽，见 §0.7 宽容取舍；`filterWithinVisible`）；
- 入参序列化后**不得含 `canon` / `realChoice` / 真实人物真名**（见 §9）；
- 已生成的 `outcome` 作为锁定条件注入后续调用，不得改写 `history` 里的既成事实。

**正例**：2-3 张 `moves`，`text` 为玩家可执行的动作，`implicitAssumption` 一句话点出该动作默认成立的前提，`costHint` 非评判性描述代价。

**反例**（拒收）：`moves` 只有 1 张；或 `visibleFacts` 出现该角色位不可能知道的信息；或 `text` 中出现"你错了"。

---

## 7. 结局生成 `replayEnding`（事件推演终局叙述）

**用途**：与走过的路径连贯的终局叙述。**流式**（0.4）。

**请求** `replayEnding(position: Position, history: SceneLog[], ledger: LedgerEntry[], relations: RelationEntry[])`

**响应载荷** `{ title: string; text: string }`（`text` ≤400 字；分享/导出强制携带「**架空推演**」标识，由前端添加）。

**正例**：`title` 短语式（≤12 字），`text` 收束于角色位视角，不评价玩家选择。

**反例**（拒收）：文本含"你赢了/输了"或对照史实宣判玩家的选择正确与否。

---

## 8. 原作揭示 `replayCanon`（事件推演终局可选揭示）

**用途**：终局可选地揭示史实对照。**独立通道**：推演期间绝不调用、前端不预取。

**请求** `replayCanon(eventId: string)`

**响应载荷**

```ts
{ canon: { actIndex: number; month: string; development: string;
           sources: { url: string; reviewedAt: string }[] }[] }
```

**硬约束**：`sources[].url` 必须为可访问的 https 知乎链接；`reviewedAt` 必填（人工审核日期）。返回内容标「**史实**」（前端添加）。

**正例**：canon 条目的 `actIndex` 与事件时间表对位，development 为中性史实描述。

**反例**（拒收）：`url` 为 http 或死链；`development` 含对玩家路径的褒贬。

---

## 9. 隔离硬约束（能力 6/7，必须写成单测）

- `actAdvance` / `replayEnding` 的**调用参数序列化后**，不得包含 `canon` / `realChoice` / 真实人物真名。沉浸式下模型本来就不需要原作，调用隔离是天然属性，但仍须写成单测断言（spy 捕获实际请求体）。
- 原作数据只进入能力 8，且能力 8 **仅在终局可选揭示时被调用**。
- 能力 6 的 `visibleFacts` 越界即拒收（服务端 `assertWithinVisible` + 客户端二次校验）。

## 10. 验收清单（卡 0-1）

- [ ] 本文档存在，八个能力 schema 齐全，每个都有正/反例
- [ ] 禁用词表显式列出，能力 6/7 隔离约束显式列出
- [ ] 统一错误结构与流式规则已定义
- [ ] **用户确认契约**（闸口，通过后才开卡 0-2）
