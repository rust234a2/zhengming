# zhengming-server

争鸣的服务端：**Host（LLM 七能力）** 与 **辩论间实时房间（WebSocket）** 两件事，单进程单端口。

对应设计文档：

- `docs/design/host-contract.md`（v1.2，七能力契约 · 已确认）
- `docs/design/debate-room-ROLLOUT.md`（落地计划 S1–S6）
- `docs/design/debate-room-PRD.md`（v0.6，产品规则）

---

## 快速开始

```bash
# 1. 配置 key（两种方式任选；不配也能跑：Host 走降级启发式，响应带 degraded:true）
#    方式 A（推荐）：写进 zhengming-server/.env —— 服务端启动时自动加载，不必每次 export
cp .env.example .env && vi .env        # 填 STEPFUN_API_KEY=sk-...
#    方式 B：临时 export（已有环境变量优先，会覆盖 .env）
export STEPFUN_API_KEY="sk-..."        # Windows PowerShell: $env:STEPFUN_API_KEY="sk-..."

# 2. 启动（默认 127.0.0.1:5300）
cd zhengming-server
node server.mjs

# 3. 自检
curl http://127.0.0.1:5300/api/health
```

### `.env` 的行为

由 `lib/env.mjs` 加载（零依赖，不为一个小功能引入 dotenv）：

- 查找顺序：`ZHENGMING_ENV` 指定路径 → `zhengming-server/.env`
- **已有的环境变量优先**，文件不覆盖——临时覆盖行为不受影响
- 支持 `#` 注释、`export KEY=VALUE`、单双引号包裹、`KEY=value # 行内注释`
- **只打印文件名与键名，绝不打印值**；`.gitignore` 已排除 `.env`

跑测试：

```bash
node --test test/host.test.mjs test/server.test.mjs   # 41 项单测（含 HTTP/WS 集成）
node --test test/env.test.mjs                         # 5 项：.env 加载 + 真实 StepFun 连通性
# 或
npm test
```

> `env.test.mjs` 里有一项**会真打 StepFun** 验证连通性与 key 不外泄；未配 key 时自动 SKIP，不判失败（离线可跑）。

端到端对局冒烟（会真起服务、开两个 WS 客户端、走完五阶段并校验报告落盘）：

```bash
node test/e2e-room.mjs
```

> 跑之前先确保领域模块已编译：`cd ../web && npm run build:domain`

---

## 路由

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/health` | 健康检查。**只报有没有配 key，绝不下发 key** |
| `POST` | `/api/host/:capability` | Host 七能力，统一信封。能力名见下 |
| `GET` | `/api/topics` | 真实议题与论点对（`?paired=1` 只看成对议题） |
| `GET` | `/api/rooms` | 房间列表 |
| `POST` | `/api/rooms` | 新建房间（可带 `{topicId}` 绑定议题） |
| `GET` | `/api/rooms/:id` | 房间快照（内存优先，退回 `rooms/<id>.json`） |
| `WS` | `/ws/room?roomId=<id>` | 房间实时通道 |

### Host 七能力

`structureHint` · `makeQuestion` · `evaluate` · `terminalProbes` · `actAdvance` · `replayEnding` · `replayCanon`

辩论间只消费前三个 + 事件推演的三个；`replayCanon` 是独立通道（终局可选揭示，推演期间绝不调用）。

```bash
curl -X POST http://127.0.0.1:5300/api/host/structureHint \
  -H 'Content-Type: application/json' \
  -d '{"statement":"43 岁该辞职去苏州——窗口期不等人","requestId":"demo-1"}'
```

统一信封：

```jsonc
{ "ok": true,  "capability": "structureHint", "requestId": "demo-1", "result": "…" }
{ "ok": false, "error": { "code": "UPSTREAM", "message": "…", "requestId": "demo-1" } }
```

错误码：`VALIDATION` ｜ `CAPABILITY_NOT_FOUND` ｜ `PAYLOAD_TOO_LARGE` ｜ `TIMEOUT` ｜ `UPSTREAM` ｜ `CONTENT_REJECTED`

---

## WebSocket 消息契约

**客户端 → 服务端**

```jsonc
{ "type": "join",   "roomId": "room-xxx", "seatToken": "可选，重连用", "side": "pro|con", "name": "显示名" }
{ "type": "action", "roomId": "room-xxx", "action": { "kind": "pickSide|submitBrief|submitOpening|ask|answer|react|freeSpeak|submitClosing|leave", "payload": {} } }
{ "type": "leave",  "roomId": "room-xxx" }
```

**服务端 → 客户端**

```jsonc
{ "type": "joined", "roomId": "…", "side": "pro", "seatToken": "…", "resumed": false }
{ "type": "state",  "roomId": "…", "state": { /* 权威快照，客户端整体替换本地状态 */ } }
{ "type": "event",  "roomId": "…", "event": { "kind": "seatJoined|seatLeft|seatResumed", "at": "…" } }
{ "type": "error",  "code": "…", "message": "…" }
```

**规则**：所有动作先过 `transition()`；不合法则回 `error` 且**不动状态**。

---

## 领域内核共享（重要）

`ROLLOUT §2` 定了一条纪律：**服务端不复制业务规则**，而是 import 与前端**同一份** `domain/debateRoom.ts` 纯函数。

`server.mjs` 按以下顺序找领域模块，找到即用：

1. 环境变量 `ZHENGMING_DOMAIN` 指定的路径
2. `web/dist-domain/domain/debateRoom.js`
3. `web/src/domain/debateRoom.mjs`

**都找不到时**：服务端仍能启动，但用内置最小兜底 `transition()`——除 `leave` 外的动作一律回 `DOMAIN_MODULE_MISSING`，启动日志会打显著告警。

把前端 TS 编译成服务端可 import 的产物：

```bash
cd web
npm run build:domain
```

该脚本做两件事：`tsc` 编译 → `scripts/fix-domain-imports.mjs` 给相对 import 补 `.js` 扩展名
（Node 原生 ESM 要求显式扩展名，否则服务端 `import` 报 `ERR_MODULE_NOT_FOUND`）。

**服务端不手写 RoomState**：房间初始状态必须由 `createRoomState()` 构造，席位占满时用 `openRoom()` 跃迁到
`opening`。服务端曾因手写精简状态缺 `briefs` 字段，导致所有动作被领域层拒收——现在靠「单一构造入口」避免复发。

---

## 产品红线的服务端落点

| 红线 | 实现位置 |
|---|---|
| **不判输赢** | `lib/contract.mjs` 的 `BANNED_WORDS`（`错误/谬误/偷换/输赢/对错/你错了/赢了`），对**模型输出**与**用户发言**双向扫描，命中即拒 |
| **追问权替代验证权** | `lib/host.mjs` 的 `RESULT_CHECKS.makeQuestion` —— 返回值必须**恰好一个问号**，打包追问直接 `CONTENT_REJECTED` |
| **模拟与事实分离** | `lib/host.mjs` 的 `assertIsolation()` —— 能力 5/6 入参出现 `canon`/`realChoice`/`realPath` 等键即 `VALIDATION`；`replayCanon` 丢弃一切非 https 来源条目，不编造 |
| **不代写** | `lib/prompts.mjs` 的 `structureHint` 提示词显式禁止给出可粘贴内容；降级实现只按关键词判断缺失要素，天然无法代写 |
| **provenance** | `/api/topics` 直接读 `research/controversy-map/claims.json`，保留真实 `author` / `voteUp` / 知乎 `url` |

---

## 密钥与数据安全

- `STEPFUN_API_KEY` **只在服务端 `process.env` 读取**：不落盘、不进日志、不下发前端。
- 测试有专门断言：上游返回的报错信息里若含 key，也必须被拦掉（`host.test.mjs`「上游报错信息不把 key 透出」）。
- `rooms/<id>.json` 含用户输入（可能含个人经历），因此 **`.gitignore` 已排除**，且仅存本地。
- 房间状态在**内存**中；服务端重启后房间丢失，但已落盘的报告可通过 `GET /api/rooms/:id` 回读。

---

## 无 key 降级

读不到 `STEPFUN_API_KEY` 时，`/api/host/*` 走 `lib/prompts.mjs` 的启发式实现，响应形如：

```jsonc
{ "ok": true, "capability": "evaluate", "requestId": "…",
  "result": { "dims": {…}, "total": 76, "grounds": [...] },
  "degraded": true,
  "degradedReason": "STEPFUN_API_KEY is not set on the server" }
```

前端**必须**据 `degraded` 在界面明示「模拟」，绝不静默假装是真实模型输出。
降级实现同样过结构校验与禁用词扫描——它不会产出比真实调用更差的数据形状。

---

## 已知限制

- 房间只在内存，无持久化恢复（报告落盘可回读，进行中的对局重启即丢）。
- 不做鉴权：本地开发定位，任何人都能连 `ws://127.0.0.1:5300/ws/room`。
- WS 不支持分片消息（控制帧除外），客户端一次发送完整 JSON。
- 流式（`stream: true`）当前**未转发**：能力 5/6 按一次性完整响应处理。契约 §0.4 的 SSE/NDJSON 转发留待事件推演模块落地时补。
- `replayCanon` 依赖上游给出可访问 https 来源；给不出时返回空数组而非编造，所以这条通道常常是空的——这是设计意图，不是缺陷。
