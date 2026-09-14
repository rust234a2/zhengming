# 争鸣网站上线 · 实行路径

版本 v0.2 · 2026-09-14 · 目标：把 `web/`（静态站点）+ `zhengming-server/`（REST + WebSocket）以**单域名网站**形式上线，任何人点链接即可访问。

> **版本变更（v0.1 → v0.2）**：应用户「1.5 天动手时间不够」的诉求，新增 §0.5 极速方案（平台托管，动手约 2–3 小时）与 §0.6 临时演示方案（内网穿透，约 10 分钟）。原 v0.1 的反代正装路径降为**方案 A（正式路线）**，内容保留不动；本版不废除任何原有条目。

---

## 0. 已核实的技术事实（路径的前提）

| 事实 | 出处 | 对部署的含义 |
|---|---|---|
| 前端是纯静态产物，`base: "./"`，仅依赖 react + d3 | `web/vite.config.ts` | 任何静态托管都能放；无需 Node 运行时 |
| 前端所有请求都是**相对地址**：REST 走 `/api/*`，WS 走 `${location.host}/ws/room` | `web/src/ui/useRoom.ts:48`、dev proxy | **同域反向代理即可，前端零改动** |
| 服务端零依赖（Node 原生 http + 手写 WS），`PORT` 默认 5300 | `zhengming-server/server.mjs` | 无 `npm install`，一个进程跑完 |
| **服务端硬编码监听 `127.0.0.1`** | `server.mjs:852` | 上线前必须改为可配置（唯一必改的代码点） |
| Host LLM key 只读 `process.env.STEPFUN_API_KEY`，不设则降级启发式（`degraded:true`） | `lib/host.mjs:332` | 无 key 也能上线演示，设 key 才有真 Host |
| CORS 已是 `*` | `server.mjs:384` | 同域部署下无所谓；跨域方案也不用改 |
| 对局报告落盘 `zhengming-server/rooms/`，**房间状态在内存** | `server.mjs:856` | 进程重启丢房间（MVP 可接受，列入风险表） |

---

## 0.5 极速方案（方案 B）：平台托管，动手约 2–3 小时

思路：**把「反代」的活交给平台，把「两个服务」并成「一个进程」**。给 `server.mjs` 加约 20 行静态托管（前端视图全是 `?view=` 查询参数，没有路径路由，只需兜底 `/` 和 `/assets/*`），Node 进程同时服务 前端 + REST + WS，天然同源——前端依旧零改动、WSS 证书由平台送。

### 步骤

| # | 事项 | 时间 |
|---|---|---|
| 1 | `server.mjs`：加静态目录支持（读 `ZHENGMING_STATIC_DIR`，命中 `/assets/*` 返回文件、其余返回 `index.html`）；监听地址改 `process.env.HOST`（同方案 A 阶段 0 的唯一必改点） | ~1h（含测试） |
| 2 | 仓库推 GitHub；Railway / Render / Fly.io 选一个，**单服务**部署 `zhengming-server/`（零依赖，无 npm install，启动极快）；构建命令留空或 `node -e ""`，启动命令 `node server.mjs` | ~0.5h |
| 3 | 平台环境变量：`HOST=0.0.0.0`、`ZHENGMING_STATIC_DIR=/app/web/dist`（或在服务端启动前跑一次 `npm run build` 的 Dockerfile）、`STEPFUN_API_KEY=...` | ~10min |
| 4 | 用平台分配的域名直接冒烟（开房 → 邀请链接 → Host → 报告） | ~0.5h |

### 与方案 A 的取舍

| | 方案 B 平台托管 | 方案 A 国内 VPS + 备案 |
|---|---|---|
| 动手时间 | **2–3 小时** | ~1.5 天 + 备案等待 1–2 周 |
| 域名 | 平台送的（`*.up.railway.app` 等），**无需备案** | 自有域名，需 ICP 备案 |
| 国内访问 | 不稳定（境外节点，可能慢或被墙） | 稳定 |
| 冷启动 | Render 免费档闲置会休眠（唤醒 30s+）；Railway 付费无此问题 | 无 |
| 适用 | **现在就想让用户用起来、先验证多人体验** | 正式参赛演示、长期运营 |

结论：**先用 B 上线跑起来，A 作为演示前的正式收口**。两者不冲突——B 的第 1 步（静态托管 + HOST）本来就是 A 阶段 0 的子集，代码改动完全复用。

## 0.6 临时演示方案：内网穿透，约 10 分钟

只给评委/朋友临时看一眼，一行部署都不用做：

1. 本机把 `server.mjs` 的静态托管临时指向已构建的 `web/dist`（或直接用 5299 dev server）。
2. `cloudflared tunnel --url http://127.0.0.1:5300`（或 ngrok / 花生壳）拿到一条公网 https 地址。
3. 发链接即可演示。

限制：依赖本机开机、链接每次重启会变、稳定性不适合长期使用——**仅演示用，不算上线**。

---

## 1. 推荐架构（方案 A · 正式路线）：单域名 + 反向代理

```
用户浏览器
   │  https://zhengming.example.com
   ▼
Caddy / Nginx（443, 自动 HTTPS）
   ├── /            → web/dist/ 静态文件
   ├── /api/*       → http://127.0.0.1:5300
   └── /ws/*        → ws://127.0.0.1:5300（Upgrade 透传）
                          │
                          ▼
                  zhengming-server（Node 进程，systemd/pm2 守护）
                          └── STEPFUN_API_KEY（环境变量，不落盘）
```

选这个架构的理由：前端 WS/REST 全是相对路径，同域反代**不改一行前端代码**；也顺带解决了 WSS 证书与跨域问题。

备选：前端与后端拆开托管（前端 Vercel/Netlify + 服务端独立域名，需给前端加服务端地址配置 + WSS 证书，改动多于本方案）；Docker 容器平台（Railway/Fly，省运维但国内访问一般，见 §0.5 方案 B）。**参赛演示优先 A。**

---

## 2. 分阶段执行

### 阶段 0 · 代码准备（约 0.5 天，唯一动代码的阶段）

1. `server.mjs:852`：监听地址从 `"127.0.0.1"` 改为 `process.env.HOST || "127.0.0.1"`（本机开发不受影响，生产设 `HOST=127.0.0.1` 由反代对接；若直接暴露则 `0.0.0.0`）。
2. `rooms/` 落盘目录支持 `ZHENGMING_STORE_DIR` 环境变量（`createServer` 已有 `storeDir` 参数，只差从 env 传入）。
3. 补一个 `zhengming-server/.env.example`（列 `PORT / HOST / STEPFUN_API_KEY / ZHENGMING_STORE_DIR / ZHENGMING_DOMAIN`，不含真实值）。
4. 验证：`web/` 下 `npm run build`；本地起 Caddy（或 nginx）按上面路由表配一遍，`?view=room` 开房、第二浏览器席位加入、Host 发言、终局报告全链路跑通。

### 阶段 1 · 服务器与域名（约 0.5 天）

1. 买一台国内 VPS（轻量云 2C2G 足够，团队内已熟腾讯云）或复用现有机器。
2. 域名解析到服务器；**国内需 ICP 备案**（走腾讯云备案约 1–2 周，是整条路径最长的等待项，建议第 0 天就启动）。不想备案的临时演示方案：用境外 VPS 或平台分配的临时域名，但正式参赛演示强烈建议备案域名。
3. Caddy（推荐，自动 HTTPS）或 Nginx + certbot 按第 1 节路由表配置；WS 透传要点：Nginx 需 `proxy_http_version 1.1` + `Upgrade/Connection` 头；Caddy 无需额外配置。

### 阶段 2 · 进程守护与密钥（约 0.5 天）

1. systemd 单元或 `pm2 start server.mjs --name zhengming`；`Environment=STEPFUN_API_KEY=...` 写在 systemd unit / pm2 ecosystem 里，**不进 git、不进日志**。
2. 建目录 `zhengming-server/rooms/`（报告落盘），纳入备份。
3. 冒烟清单：`GET /api/topics` 200 → 开房 → 邀请链接第二设备加入 → 三回合对局 → 终局报告 → 辩论树/争议地图打开。

### 阶段 3 · 上线后的第一批补强（各 0.5–1 天，按需）

| 项 | 做什么 | 为什么 |
|---|---|---|
| 房间落盘 | `Store` 已有 rooms 目录机制，把房间注册表也落盘或接受重启即清空 | 服务器重启不打断对局 |
| 匿名身份 | 进房间自动分配昵称/席位色 | 多人体验的最小身份方案 |
| PWA | `manifest.json` + 图标 + theme-color | 手机"添加到主屏幕"，半天成本 |
| 移动端兜底 | 辩论树窄屏用缩进树视图 | 画布类交互手机体验差 |

---

## 3. 风险表

| 风险 | 影响 | 对策 |
|---|---|---|
| 房间状态在内存，进程重启即丢 | 对局中断 | 阶段 2 避免重启；阶段 3 落盘 |
| 未备案域名在国内被拦 | 无法访问 | 第 0 天启动备案；备案前用临时域名演练 |
| LLM 上游（StepFun）限流/故障 | Host 降级为启发式（`degraded:true` 已有兜底） | 可接受；监控响应标 |
| 手写 WS 的健壮性未经过公网检验 | 断线/慢网问题 | 前端已有重连与错误码回落；上线后观察 |
| `DEEPSEEK_API_KEY` 旧约定 vs 现行 `STEPFUN_API_KEY` | 文档误导 | 以 `lib/host.mjs` 为准（D9 已定 StepFun） |

---

## 4. 工作量与顺序总览

```
第 0 天  启动域名备案（等待期 1-2 周）＋ 阶段 0 代码准备 + 本地反代演练
第 1 天  买 VPS、装 Caddy、部署、systemd + 密钥 → 临时域名先上线
备案后   切正式域名 → 冒烟清单全绿 → 发链接
其后     匿名身份 → 房间落盘 → PWA（按需）
```
