# 争鸣 · Host 契约

版本 v1.2（草稿） · 2026-09-14 · 对应任务卡 **0-1**（`IMPLEMENTATION-PATH.md`）
状态：**已确认**（2026-09-14 用户拍板接真实 LLM 并指定 StepFun 上游，闸口通过，可开卡 0-2）。

> **v1.2 变更（2026-09-14，升级上游为 StepFun）**
>
> - **变更动因**：用户指定 Host 上游改用**阶跃星辰 StepFun**（原为 DeepSeek）。
> - **本次改动**：① §0.3 参数基线改为 StepFun 的 OpenAI 兼容端点与 `step-3.7-flash`；② §0.2 密钥环境变量 `DEEPSEEK_API_KEY` → `STEPFUN_API_KEY`；③ 状态从「待用户确认」改为**已确认**（闸口通过）。
> - **保留不动**：七个能力签名、统一信封、错误码枚举、幂等与重试、禁用词表、`Turn` 形状、隔离硬约束。
> - **本条作废**：v1.1 中一切 DeepSeek 专有表述（`api.deepseek.com`、`deepseek-chat`、`DEEPSEEK_API_KEY`）。
>
> 能力编号与 `IMPLEMENTATION-PATH.md` 卡 0-1 能力表一致（2026-09-13 起为 **7 个能力**；原「概念对齐 `alignConcepts`」随辩论间 v0.5 移除、「承认校验 `checkRestatement`」随 **D6 拍板不落复述闸门** 移除，编号两轮整体前移）。签名如有出入，以该表为准并回改本文档。

---

## 0. 通用约定

### 0.1 调用信封

通道按 **D1 已拍板：路线 A** 写死信封，`zhengming-server/` 承载：

```
POST /api/host/:capability        # capability ∈ 能力 1..7 的机器名
Content-Type: application/json    # 请求体上限 256KB，超限拒收
超时：30s
```

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
- 需要结构化输出的能力（3/4/5/6/7）用 `response_format: {type:"json_object"}`
- 能力 5/6 另开 `stream: true`（见 0.4）
- 建议 `temperature: 0.5`（平台默认，收敛稳定）；结构化能力可下调至 0.3

### 0.4 流式（仅能力 5/6，D4 已拍板）

- 服务端以 SSE（`text/event-stream`）或 NDJSON 分块转发模型增量。
- 客户端解析规则（与 `event-replay-PLAN.md` §3.3 一致）：
  1. 叙事字段（`outcome`、`nextScene.text`）边到边渲染；
  2. 结构字段（`moves[]` 等）必须等完整 JSON 到齐并过 `validateActAdvanceResult` + `assertWithinVisible` + `assertNoCanonLeak` 后才可交互；
  3. 流中断即失败态，重试**整幕重新生成**；
  4. 禁用词过滤在**流结束后**对完整文本执行。

### 0.5 禁用词表（硬约束）

**能力 1/2/3/4/5/6/7 的全部返回文本**（含嵌套字段、流式拼合后的完整文本）不得出现：

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

## 4. 终局追问 `terminalProbes`

**用途**：事件推演终局的两条决策模式追问（辩论间 v0.6 对局报告不含终局追问，是否恢复待定）。**只呈现给玩家，不做任何导出或跳转**（2026-09-13 拍板：事件推演为纯单人体验，无辩论树/辩论间联动）。

**请求** `terminalProbes(position: Position, history: SceneLog[], ledger: LedgerEntry[], relations: RelationEntry[])`

> **隔离约束（2026-09-13 修订）**：入参**不得含 `canon` / `realChoice` / 真实发展线**——终局追问与原作揭示（能力 7）相互独立：玩家可以只看追问而不展开原作，追问里出现任何"现实中发生了什么"都属隔离破防。旧签名的 `realPath` 参数**作废**。

**响应载荷**：`[string, string]` —— 恰好两条问题，各 ≤60 字，均指向**玩家的决策模式**（不对照史实）。

**正例**

```jsonc
["你在三次决定里都选了风险更低的一边——这是处境使然，还是你的风格？", "两次账本告急你都没向家人求助——你默认的关系支持是靠得住的吗？"]
```

**反例**（拒收：返回 1 条或 3 条；或追问里夹带评价如"你当初的选择是对是错"）。

---

## 5. 幕推进 `actAdvance`（事件推演核心）

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
- `nextScene.visibleFacts` ⊆ `position.visible` 所允许的信息范围，越界拒收（`assertWithinVisible`）；
- 入参序列化后**不得含 `canon` / `realChoice` / 真实人物真名**（见 §9）；
- 已生成的 `outcome` 作为锁定条件注入后续调用，不得改写 `history` 里的既成事实。

**正例**：2-3 张 `moves`，`text` 为玩家可执行的动作，`implicitAssumption` 一句话点出该动作默认成立的前提，`costHint` 非评判性描述代价。

**反例**（拒收）：`moves` 只有 1 张；或 `visibleFacts` 出现该角色位不可能知道的信息；或 `text` 中出现"你错了"。

---

## 6. 结局生成 `replayEnding`（事件推演终局叙述）

**用途**：与走过的路径连贯的终局叙述。**流式**（0.4）。

**请求** `replayEnding(position: Position, history: SceneLog[], ledger: LedgerEntry[], relations: RelationEntry[])`

**响应载荷** `{ title: string; text: string }`（`text` ≤400 字；分享/导出强制携带「**架空推演**」标识，由前端添加）。

**正例**：`title` 短语式（≤12 字），`text` 收束于角色位视角，不评价玩家选择。

**反例**（拒收）：文本含"你赢了/输了"或对照史实宣判玩家的选择正确与否。

---

## 7. 原作揭示 `replayCanon`（事件推演终局可选揭示）

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

## 8. 隔离硬约束（能力 5/6，必须写成单测）

- `actAdvance` / `replayEnding` 的**调用参数序列化后**，不得包含 `canon` / `realChoice` / 真实人物真名。沉浸式下模型本来就不需要原作，调用隔离是天然属性，但仍须写成单测断言（spy 捕获实际请求体）。
- 原作数据只进入能力 7，且能力 7 **仅在终局可选揭示时被调用**。
- 能力 5 的 `visibleFacts` 越界即拒收（服务端 `assertWithinVisible` + 客户端二次校验）。

## 9. 验收清单（卡 0-1）

- [ ] 本文档存在，七个能力 schema 齐全，每个都有正/反例
- [ ] 禁用词表显式列出，能力 5/6 隔离约束显式列出
- [ ] 统一错误结构与流式规则已定义
- [ ] **用户确认契约**（闸口，通过后才开卡 0-2）
