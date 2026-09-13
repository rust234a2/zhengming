# 辩论树模块实施计划

> 依据：`debate-tree-PRD.md`、`IMPLEMENTATION-PATH.md`、`prototypes/debate-tree-v2.html` 及当前 `web/` 实现。执行顺序对应实施路径卡 2-1 至 2-4；每阶段验收通过后再进入下一阶段。

## 目标与非目标

目标是把 `?view=debate` 从内存演示升级为可长期保存、可继续参与的辩论树：支持渐进展开、三派论点、追问与回应、单用户投票、立场统计、真实 Host 追问建议，并为辩论间终局和知乎冷启动提供稳定导入接口。Agent 只指出可追问之处，不判断论点对错。

本计划不实现辩论间的匹配/实时对局、事件推演规则、用户认证或服务端密钥管理，也不重写 `?view=force` 的 d3 布局。无限画布版留作后续视图；本期先完成移动端和桌面端均可用的缩进树。`prototypes/zhengming-app.html` 和其他生成文件不手改。

## 现状盘点

- `web/src/App.tsx` 已将 `?view=debate` 路由到 `DebateTreePrototype.tsx`，相关样式集中在 `web/src/styles.css`。
- React 组件内嵌 `INITIAL_TREE`，刷新即丢失；模型只有 `root/support/oppose`、单一赞同数，没有 `neutral`、`question`、来源、时间、双向投票和约束校验。AI 观察与在线人数均为固定文案，缩放按钮没有行为，且没有对应组件测试。
- `prototypes/debate-tree-v2.html` 已验证添加论点/追问、回应继承立场、深度 4、子节点 8、追问 3、投票、三派统计和失衡判定；`node prototypes/debate-tree-v2.test.mjs` 当前为 **40/40 通过**。它是规则迁移基线，不是生产数据源。
- `web/src/data/debateGraph.ts` 使用另一套 `topic/side/argument/evidence/...` 图模型，仅服务 `?view=force`，不能直接作为辩论树 schema。
- `docs/design/host-contract.md` 与 `zhengming-server/` 尚不存在，真实 Host 接入受阶段 0（Host 契约与最小通道）阻塞。

## 数据与状态模型

在 `web/src/types/debateTree.ts` 建立唯一业务模型：

```ts
type Stance = "pro" | "con" | "neutral";
type ViewerVote = "up" | "down" | null;
type DebateTreeNode = RootNode | ClaimNode | QuestionNode;
interface VoteState { up: number; down: number; viewerVote: ViewerVote }
interface DebateTreeDocument {
  schemaVersion: 1; id: string; rootId: string;
  nodes: Record<string, DebateTreeNode>; revision: number; updatedAt: string;
}
```

公共字段为 `id/parentId/type/content/author/createdAt/source?`。`root` 唯一且可投票；`claim` 必有 `stance/votes`，可含内联 `evidence/agentHint`；`question` 继承被追问 claim 的立场，含 `answered`，不含投票。root 下的“三桶”是一级 claim 的 `stance` 分组，不创建额外节点类型。

`web/src/ui/debateTreeState.ts` 保存纯状态转换：`addClaim`、`addQuestion`、`respondToQuestion`、`castVote`、`applyAgentHints` 和 `importTree`，统一执行深度、子节点、追问数、立场继承和纯表态校验。UI 状态单独保存 `selectedId`、`expandedIds`、草稿和 Host 请求状态，避免写回领域文档。投票按 `viewerVote` 替换旧方向，不能重复累加。

`web/src/data/debateTreeRepository.ts` 以 `zhengming.debate-tree.v1:<treeId>` 保存带版本信封的文档，并以独立 key 保存展开态；读取失败或版本未知时返回显式错误，不静默覆盖。后端落地后只替换 repository，不改 reducer 与组件。

## 分阶段实施

### 1. Schema、规则与迁移（卡 2-1）

1. 新增 `web/src/types/debateTree.ts`、`web/src/ui/debateTreeState.ts` 和 `web/src/data/debateTreeRepository.ts`；将 v2 原型中的限制与统计函数迁成无 DOM 的纯函数。
2. 把当前 `INITIAL_TREE` 移到 `web/src/data/debateTreeSeed.ts`，补齐 PRD 字段；提供 `migrateLegacyTree()`，同时接受当前 React mock 和 v2 原型导出的嵌套数据，规范化为节点表。
3. 新增 `web/tests/debateTreeState.test.ts` 与 `debateTreeRepository.test.ts`，覆盖迁移、往返存读、损坏数据、投票改向及全部上限。

完成标准：树不再依赖组件常量，重载后内容和展开态一致；纯函数测试覆盖 v2 的 40 个场景等价行为。

### 2. React 交互闭环（P0）

1. 重构 `web/src/ui/DebateTreePrototype.tsx` 使用 reducer/repository。初始只显示 root；点击仅展开下一层，新增后展开父节点、选中新节点并聚焦编辑框。
2. 在详情区实现三派添加、追问、回应、双向投票、依据、知乎来源和 Agent 提示卡；question 不显示投票，回应立场只读继承。顶部统计按全树 claim 计算，最大簇占比严格 `> 70%` 才提示失衡。
3. 调整 `web/src/styles.css` 的节点、追问、错误、加载/空态及窄屏布局。移除未实现的缩放控件，直到无限画布真正接入。
4. 新增 `web/tests/debateTree.test.tsx`，从用户操作验证渐进展开、选择、提交校验、焦点、持久化恢复、来源跳转和统计刷新。

完成标准：PRD F1-F3 可在 `?view=debate` 独立走通，页面不再展示伪实时或不可操作控件。

### 3. 真实 Host 追问（卡 2-2）

阶段 0 在 main 落地 `docs/design/host-contract.md` 与共享 Host client 后，再新增 `web/src/data/debateTreeHost.ts`。对外只暴露 `requestDebateHints({ treeId, revision, nodes })`，返回 `{ nodeId, hint, suggestedQuestion }[]`，不在组件中绑定 HTTP 或 SSE 细节。

请求前筛选“无依据、无子回应、存在对向冲突”的候选 claim；响应必须校验 revision、节点归属、非空具体追问及禁用评判词。用户点击“以此追问”只预填草稿，确认后才创建 question；成功后清除对应 hint，失败时保留树和可重试状态。

完成标准：固定输入可得到非预制建议；测试中禁用词命中为 0，纯表态仍被前端拒绝，Host 超时/畸形响应不会破坏本地树。

### 4. 上游导入（卡 2-3、2-4）

- 辩论间通过 `importSettlement(treeId, settlement)` 接入，不直接写 repository。这里存在决策门：PRD 限定三类节点，而实施路径要求 `settlement` 节点；开始卡 2-3 前必须在 Host 契约中决定“扩展第四类节点”或“作为 root 级归档附件”，并补迁移版本与验收样例。
- 知乎冷启动在 `research/debate-tree/` 建立可复现管线：复用现有语料，使用 `search zhihu`，按 question id 聚合，再由 Host 两步归纳；产物经 `web/src/data/debateTreeImport.ts` 校验后导入。第一层 claim 尽量保留 `source.url/quote`，来源缺失不得伪造。
- 地图/力导向联动只新增显式 schema adapter；不让 d3 的可变节点污染 `DebateTreeDocument`。

完成标准：一局终局可进入指定树且内容一致；一份真实知乎输入可生成两级、可溯源、可持久化的三派树，并正确显示失衡状态。

## 测试与验收

每阶段运行：

```powershell
node prototypes/debate-tree-v2.test.mjs
cd web
npm test
npm run build
```

涉及 HTML 原型时再运行全部 `prototypes/*.test.mjs` 并执行 `node prototypes/build-app.mjs`。浏览器验收至少覆盖 1440px 桌面与 390px 移动视口：无重叠、键盘可展开/提交、刷新恢复、外链使用安全的新窗口属性。Host 阶段另以失败注入验证超时、重试、旧 revision 和非法文案。

## 风险与依赖

- 阶段 0 未完成前，卡 2-2 只能保留显式 mock，不能把模型 key 或 provider 逻辑放进浏览器。
- `settlement` 与三类型 schema 冲突是卡 2-3 的阻塞决策，必须先更新契约和版本策略。
- localStorage 仅满足单机 MVP，不能保证多人并发、通知或防刷票；服务端化需要 revision/冲突响应和用户身份。
- 知乎采集受额度与来源变化影响；优先 `search zhihu`，缓存原始响应并记录 provenance，不使用日限 100 次的 `question_answers` 作为默认路径。
- `DebateForceTree` 的证据节点与本 PRD“证据内联”冲突，联动必须经过 adapter，禁止共享同一可变对象。

## 完成定义

所有 P0 行为、持久化、迁移与 Host 降级路径均有自动化测试；`npm test`、`npm run build` 和原型基线全绿；PRD 六项验收逐项留有截图或测试证据；无评判词、无浏览器密钥、无手改生成物；卡 2-3/2-4 的输入输出可从来源追踪到树节点。未解决的 `settlement` 决策不得标记模块整体完成。
