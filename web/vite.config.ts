import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * 争鸣独立前端工程（三张图 + 辩论间）。
 *
 * 与 runi-desktop 的关系：这套代码原本是 Runi 桌面端里的三个视图，
 * 2026-09-13 抽出为独立工程。现在它不依赖 runi-protocol / Tauri / 后端，
 * 只依赖 react 与 d3，构建产物是纯静态站点。
 *
 * 部署：用 `vite build` 的产物（`base: "./"` 保证相对路径可移植）。
 * 若要改成直接部署 Vite 服务本身，需把 server.host 改成 "0.0.0.0"
 * 并保留 allowedHosts: true，否则反向代理的域名会被 Vite 拒绝。
 *
 * 辩论间（?view=room）需要 zhengming-server（默认 127.0.0.1:5300）。
 * 用 dev server 代理转发 /api 与 /ws，避免跨端口跨域（ROLLOUT §8 的优先方案）。
 * 服务端地址可用 ZHENGMING_SERVER 覆盖，例如：ZHENGMING_SERVER=http://127.0.0.1:6001 npm run dev
 */
const SERVER_TARGET = process.env.ZHENGMING_SERVER || "http://127.0.0.1:5300";

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5299,
    strictPort: false,
    allowedHosts: true,
    proxy: {
      "/api": { target: SERVER_TARGET, changeOrigin: true },
      // 服务端监听 /ws/room；这里保持路径原样转发（ws: true 才会走 Upgrade 握手）
      "/ws": { target: SERVER_TARGET, ws: true, changeOrigin: true },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
  },
});
