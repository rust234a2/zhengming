import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * 争鸣独立前端工程（三张图）。
 *
 * 与 runi-desktop 的关系：这套代码原本是 Runi 桌面端里的三个视图，
 * 2026-09-13 抽出为独立工程。现在它不依赖 runi-protocol / Tauri / 后端，
 * 只依赖 react 与 d3，构建产物是纯静态站点。
 *
 * 部署：用 `vite build` 的产物（`base: "./"` 保证相对路径可移植）。
 * 若要改成直接部署 Vite 服务本身，需把 server.host 改成 "0.0.0.0"
 * 并保留 allowedHosts: true，否则反向代理的域名会被 Vite 拒绝。
 */
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5299,
    strictPort: false,
    allowedHosts: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
  },
});
