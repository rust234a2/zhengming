# 辩论树模块实施计划

> 依据：`debate-tree-PRD.md`、`IMPLEMENTATION-PATH.md`、`prototypes/debate-tree-v2.html` 及当前 `web/` 实现。执行顺序对应实施路径卡 2-1 至 2-4；每阶段验收通过后再进入下一阶段。

## 目标与非目标

目标是把 `?view=debate` 从内存演示升级为可长期保存、可继续参与的辩论树：支持渐进展开、三派论点、追问与回应、单用户投票、立场统计、真实 Host 追问建议，并为知乎冷启动提供稳定导入接口。（**2026-09-14**：原「为辩论间终局提供导入接口」已随卡 2-3 作废——辩论间 v0.4 去树化，对局产物改落独立对局报告。Agent 只指出可追问之处，不判断论点对错。）

本计划不实现辩论间的匹配/实时对局、事件推演规则、用户认证或服务端密钥管理，也不涉及原 `?view=force` 力导向视图的 d3 布局（**该视图已于 2026-09-13 随 D3 拍板下线、代码移除**）。无限画布版留作后续视图；本期先完成移动端和桌面端均可用的缩进树。`prototypes/zhengming-app.html` 和其他生成文件不手改。

## 现状盘点

- `web/src/App.tsx` 已将 `?view=debate` 路由到 `DebateTreePrototype.tsx`，相关样式集中在 `web/src/styles.css`。
- **2026-09-14 更新**：组件内嵌的 `INITIAL_TREE` 已删除，改为 `web/src/data/debateTreeSeed.ts`（生成物，122 个真实知乎议题）。节点模型移到 `web/src/types/debateTree.ts`，遍历/统计/成树/投票语义抽到纯函数层 `web/src/ui/debateTreeUi.ts`（59 项单测），本地记忆在 `web/src/ui/debateTreeStorage.ts`（12 项单测）。**仍未做**：文档层（`DebateTreeDocument` + revision）、`debateTreeRepository.ts`、`debateTreeState.ts` 的 reducer——树的增删改还不落盘，刷新即回种子态。
- 规则迁移（深度 ≤4、单节点子 ≤8、追问 ≤3、纯表态拦截）**仍未迁入**；`submitNode` 只校验非空。追问已改为「我自己追问」并由用户署名，禁用了本地伪造 `agentHint` 的那条路径（原实现会把模板字符串回写成「Agent 建议」，属伪造 Agent 输出）。
- **2026-09-14 更新**：详情面板的「开实时辩论间 →」定向出口**已删除**（PRD v0.2）。它指向 `?view=room&topic=<议题>`，但房间侧从不消费 `topic`（`roomStorage.readRoomFromUrl()` 只读 `room` / `side`），且两边议题池口径不同（树 122 个种子 vs 房间 16 个可开局，交集仅 16），点过去只会落到启动台。已同步清理 `.dt-detail-actions a.dt-button` 死规则、两份原型（`prototypes/debate-tree-prototype.html` 与重建的 `zhengming-app.html`，节点详情 + 图谱议题详情共两处），并新增测试守门。**顶栏的模块级导航「辩论树 | 争议地图 | 辩论间」保留**——那是三模块互跳，不是本模块的定向出口。
- `prototypes/debate-tree-v2.html` 已验证添加论点/追问、回应继承立场、深度 4、子节点 8、追问 3、投票、三派统计和失衡判定；`node prototypes/debate-tree-v2.test.mjs` 当前为 **40/40 通过**。它是规则迁移基线，不是生产数据源。
- `web/src/data/debateGraph.ts` 使用另一套 `topic/side/argument/evidence/...` 图模型，原仅服务 `?view=force`（**该视图已于 2026-09-13 随 D3 拍板下线，文件已移除**），且本就不能直接作为辩论树 schema。
- `docs/design/host-contract.md` 与 `zhengming-server/` 均已落地；树侧尚未接 Host（卡 2-2）。

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

> 状态（2026-09-14）：第 2 条**已部分落地**——`INITIAL_TREE` 移出组件后由生成器负责产出（`data/debateTreeSeed.ts`），字段按 PRD 补齐到 `types/debateTree.ts`；但 `migrateLegacyTree()` 未写（旧的嵌套 mock 已在本次一并删除，没有需要迁移的存量），第 1、3 条（document / repository / reducer / 规则校验）仍未动。

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
- 知乎冷启动**已于 2026-09-14 落地数据侧**：生成器在 `research/debate-tree/gen-tree-seeds.mjs`，产物 `web/src/data/debateTreeSeed.ts`。与原计划的三处偏差（不新采集、不重复做立场抽取、产物名为 seed 而非 import）已记在 `IMPLEMENTATION-PATH.md` 卡 2-4 的进展块里。三条溯源通道：`claims`（真实论点 + 答主 + 赞同数 + 原文链接）、`answers`（真实回答摘要，立场未标注，**不冒充论点**）、`question`（仅题干）。
- 两条随冷启动新立的硬规则：**知乎赞同数 ≠ 平台投票**（分开两个字段，UI 也分开展示）；**真实原文节选同样要过禁用词表**（命中即整段省略节选，保留论点与链接）。
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
