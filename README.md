# 争鸣（Dissensus）

在知乎的问题社区上，用「辩论」替代「点赞」作为连接方式——把观点不同的人撮合到一起，用硬规则保证交锋质量，把每一次交锋沉淀为社区公共资产。

知乎黑客松「灵魂匹配局：社区连接与兴趣社交」参赛作品。

---

## 本仓库与 runi 的关系

2026-09-13 从 `runi` monorepo 独立成仓，分两步：

1. 迁出 `docs/`（文档 + 原型 + 运行时测试 + 数据管线）
2. 把 Runi 桌面端里的**三个争鸣视图**抽出为 `web/` 独立前端工程

| | 内容 |
|---|---|
| **本仓库 `zhengming/`** | 争鸣的**全部**产品代码与文档：`docs/` + `web/` |
| **`../runi/`（Runi monorepo）** | Runi 桌面端应用本身。**已不再包含任何争鸣代码** |

抽出的三个视图原先挂在 Runi 的 `App.tsx` 路由上，现在各自是 `web/` 里的独立入口：

| 视图 | 入口 | 文件 |
|---|---|---|
| 跨议题争议地图 | `?view=map` | `web/src/ui/ControversyMap.tsx` |
| 力导向辩论图 | `?view=force` | `web/src/ui/DebateForceTree.tsx` |
| 辩论树（桌面版） | `?view=debate` | `web/src/ui/DebateTreePrototype.tsx` |

搬迁时确认了一件好事：这三个视图**原本就与 Runi 完全解耦**——只依赖 `react` 与 `d3`，不碰 runi-protocol / Tauri / 后端状态。真正共享的只有 `App.tsx` 的路由分支与 `styles.css` 里的样式块，都已按区块切开搬走（样式块是自包含的：CSS 变量就定义在各组件自己的根类里）。

**现在本仓库对 runi 没有任何依赖，包括数据管线**——`build-ts.mjs` 的输出已改指 `web/src/data/controversyMap.ts`（同仓库内），不再跨仓写入。

## 目录

```
zhengming/
├── docs/design/                    产品设计与实现（零依赖）
│   ├── README.md                   ★ 总纲（产品全景、核心洞察、四条红线、演示路线）
│   ├── IMPLEMENTATION-PATH.md      ★ AI 执行手册（20 张任务卡 + 验收命令 + 3 个决策点）
│   ├── debate-tree-PRD.md          辩论树
│   ├── debate-room-PRD.md          实时辩论间（含撮合流程）
│   ├── event-replay-PRD.md         事件推演
│   ├── controversy-map-PRD.md      跨议题争议地图
│   ├── *-prototype.html            四个交互原型（可直接打开）
│   ├── *.test.mjs                  五套运行时测试（node 直跑）
│   ├── build-app.mjs               把三个原型组装成 zhengming-app.html
│   └── zhengming-app.html          生成物，禁止手改
├── docs/research/                  调研与数据层
│   ├── zhihu-post-taxonomy.md      知乎语料分类与可辩性调研
│   ├── ai-social-products.md       AI 社交产品调研
│   ├── controversy-map/            争议地图六步数据管线（真实知乎检索 + LLM）
│   └── zhihu-corpus/               知乎语料采集/分类/立场均衡脚本
└── web/                            ★ 桌面三视图（Vite + React 18 + TS + d3）
    ├── src/ui/                     三张图：ControversyMap / DebateForceTree / DebateTreePrototype
    ├── src/data/                   数据（controversyMap 由管线生成）
    ├── src/types/                  图模型类型
    ├── src/App.tsx                 ?view= 路由壳 + 落地页
    ├── src/styles.css              从 runi 切出的争鸣样式块（自包含）
    └── tests/                      vitest（56 项）
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

**桌面三视图前端工程**（在 `web/` 下）—— 基线 **56 项全绿**（controversyMap 26 + debateForceTree 30）

```bash
cd web
"$NODE" ./node_modules/typescript/bin/tsc -b        # 类型检查
"$NODE" ./node_modules/vitest/vitest.mjs run        # 测试（约 45s）
"$NODE" ./node_modules/vite/bin/vite.js build       # 构建 → dist/（纯静态，可部署）
"$NODE" ./node_modules/vite/bin/vite.js             # 本地开发服务器（127.0.0.1:5299）
```

> `node_modules` 已随迁入一并复制（约 116 MB / 8200 文件），**不需要 `npm install`**。
> 它是 gitignore 的，所以新克隆的仓库需要自己装依赖——但那台机器上 npm 可用时再装即可。
>
> 打开方式：开发服务器或 `dist/` 均可，用 `?view=map` / `?view=force` / `?view=debate` 切换，不带参数是落地索引页。

## 环境注意（踩过的坑）

- **`npm` 不可用**，用绝对路径 node；bash 缺 coreutils（`ls` / `cat` / `rm` / `head` / `dirname` 全报 command not found）→ 文件操作走 node `fs`
- **换行是 CRLF**（`core.autocrlf=true`，无 `.gitattributes`）→ 写跨行正则必须用 `\r?\n`，只写 `\n` 会**静默失配**
- **知乎 CLI 不在 PATH**：`C:\Users\Lenovo\AppData\Local\ZhihuCLI\current\zhihu-cli.exe`；`status` 需带 `--skill-version 0.2.1 --min-cli-version 0.1.0`；`search zhihu --count` 上限 10
- **自检字符串必须在真实产物里真的可能出现**，否则守卫是安慰剂——写完守卫请故意不修，验证它确实会报错

## 并行开发

辩论树 / 辩论间 / 事件推演三个模块各有一个 git worktree（在仓库内 `.worktrees/`，已 gitignore）。归属划分、共享文件禁区、合流顺序见 `docs/design/IMPLEMENTATION-PATH.md` **§13**。
