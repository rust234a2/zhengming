# 争鸣（Dissensus）

在知乎的问题社区上，用「辩论」替代「点赞」作为连接方式——把观点不同的人撮合到一起，用硬规则保证交锋质量，把每一次交锋沉淀为社区公共资产。

知乎黑客松「灵魂匹配局：社区连接与兴趣社交」参赛作品。

---

## 本仓库与 runi 的关系

2026-09-13 从 `runi` monorepo 的 `docs/` 迁出，独立成仓。

| | 内容 |
|---|---|
| **本仓库 `zhengming/`** | 争鸣的产品文档、交互原型、运行时测试、数据管线。**全部零依赖**，`node` 直接可跑 |
| **`../runi/`（Runi monorepo）** | Runi 桌面端应用。争鸣的**桌面端两图**仍作为视图放在 `runi/runi-desktop/src/ui/`：`?view=map` 跨议题争议地图、`?view=force` 力导向图 |

为什么桌面端那半没搬过来：那三个视图（`ControversyMap` / `DebateForceTree` / `DebateTreePrototype`）与 Runi 桌面端**共享** `App.tsx`、`styles.css`、`tests/setup.ts`，强拆需要改造成独立工程。而实施手册推荐的短期路线（路线 A：原型 + Node 后端）本来就只需要本仓库的内容。

**两端唯一的耦合是数据管线**：`docs/research/controversy-map/build-ts.mjs` 会把生成的数据模块写入 `runi/runi-desktop/src/data/controversyMap.ts`。该路径默认按「两仓同级」推导，可用环境变量 `RUNI_DESKTOP_DATA` 覆盖；其它脚本的路径全部相对脚本自身推导，搬目录不会再断。

## 目录

```
zhengming/
├── docs/design/                    产品设计与实现
│   ├── README.md                   ★ 总纲（产品全景、核心洞察、四条红线、演示路线）
│   ├── IMPLEMENTATION-PATH.md      ★ AI 执行手册（20 张任务卡 + 验收命令 + 3 个决策点）
│   ├── debate-tree-PRD.md          辩论树
│   ├── debate-room-PRD.md          实时辩论间（含撮合流程）
│   ├── event-replay-PRD.md         事件推演
│   ├── controversy-map-PRD.md      跨议题争议地图
│   ├── *-prototype.html            四个交互原型（零依赖，可直接打开）
│   ├── *.test.mjs                  五套运行时测试
│   ├── build-app.mjs               把三个原型组装成 zhengming-app.html
│   └── zhengming-app.html          生成物，禁止手改
└── docs/research/                  调研与数据层
    ├── zhihu-post-taxonomy.md      知乎语料分类与可辩性调研
    ├── ai-social-products.md       AI 社交产品调研
    ├── controversy-map/            争议地图六步数据管线（真实知乎检索 + LLM）
    └── zhihu-corpus/               知乎语料采集/分类/立场均衡脚本
```

## 怎么跑

本机 `npm` / `npx` **不可用**（shim 会触发黑名单 `wsl.exe`），一律用绝对路径调 node：

```bash
NODE="C:/Users/Lenovo/.workbuddy/binaries/node/versions/22.22.2-3/node.exe"
```

**五套运行时测试**（在 `docs/design/` 下）—— 基线 **195 项全绿**

```bash
cd docs/design
for t in debate-graph debate-room debate-tree-v2 event-replay app; do "$NODE" $t.test.mjs; done
# 期望：52 / 41 / 40 / 26 / 36 全通过
```

**重建集成单页应用**（改过任何原型后必做）

```bash
cd docs/design && "$NODE" build-app.mjs
```

**跨议题争议地图数据管线**（需 `DEEPSEEK_API_KEY`；每步产物落盘，可断点续跑）

```bash
cd docs/research/controversy-map
for s in parse extract-claims mine-cross build-map build-ts; do "$NODE" $s.mjs; done
```

> 检索用 `zhihu-cli search zhihu`（完整长文），**不要**用 `question_answers`（仅 100/日且只有 200 字摘要）。

## 环境注意（踩过的坑）

- **`npm` 不可用**，用绝对路径 node；bash 缺 coreutils（`ls` / `cat` / `rm` / `head` / `dirname` 全报 command not found）→ 文件操作走 node `fs`
- **换行是 CRLF**（`core.autocrlf=true`，无 `.gitattributes`）→ 写跨行正则必须用 `\r?\n`，只写 `\n` 会**静默失配**
- **知乎 CLI 不在 PATH**：`C:\Users\Lenovo\AppData\Local\ZhihuCLI\current\zhihu-cli.exe`；`status` 需带 `--skill-version 0.2.1 --min-cli-version 0.1.0`；`search zhihu --count` 上限 10
- **自检字符串必须在真实产物里真的可能出现**，否则守卫是安慰剂——写完守卫请故意不修，验证它确实会报错

## 并行开发

辩论树 / 辩论间 / 事件推演三个模块各有一个 git worktree（在仓库内 `.worktrees/`，已 gitignore）。归属划分、共享文件禁区、合流顺序见 `docs/design/IMPLEMENTATION-PATH.md` **§13**。
