/**
 * 极简 .env 加载器（零依赖）
 *
 * 为什么不用 dotenv：服务端 package.json 刻意保持零 dependencies，
 * 而我们需要的能力只有「逐行 KEY=VALUE」这一点点。
 *
 * 硬约束（契约 §0.4）：
 *   - 只往 process.env 里塞，**不打印值**，不写日志，不回传客户端；
 *   - 已存在的环境变量优先（显式 export 的胜出，方便临时覆盖）；
 *   - 文件不存在时静默返回，不报错（部署环境常直接用系统环境变量）。
 *
 * 用法：在 server.mjs 最顶部 `import "./lib/env.mjs";` —— 副作用式加载。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** 默认查找路径：zhengming-server/.env，可用 ZHENGMING_ENV 指定其它文件 */
const DEFAULT_ENV_PATHS = [
  process.env.ZHENGMING_ENV,
  path.resolve(HERE, "..", ".env"),
].filter(Boolean);

/**
 * 解析 .env 文本 → {KEY: VALUE}。
 * 支持：`#` 整行注释、`export KEY=VALUE`、单/双引号包裹的值、值内的 `#` 不被截断。
 */
export function parseEnv(text) {
  const out = {};
  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    let key = line.slice(0, eq).trim();
    if (key.startsWith("export ")) key = key.slice("export ".length).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    let value = line.slice(eq + 1).trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2);
    if (quoted) {
      value = value.slice(1, -1);
    } else {
      // 未加引号：行内 ` #` 之后视为注释
      const hash = value.search(/\s#/);
      if (hash >= 0) value = value.slice(0, hash).trim();
    }
    if (value !== "") out[key] = value;
  }
  return out;
}

/**
 * 加载 .env 到 process.env（不覆盖已有值）。
 * @returns {{loaded: string|null, keys: string[]}} 命中的文件与注入的键名（**不含值**）
 */
export function loadEnv(paths = DEFAULT_ENV_PATHS, env = process.env) {
  for (const candidate of paths) {
    if (!candidate) continue;
    let text;
    try {
      if (!fs.existsSync(candidate)) continue;
      text = fs.readFileSync(candidate, "utf8");
    } catch {
      continue;
    }
    const parsed = parseEnv(text);
    const keys = [];
    for (const [key, value] of Object.entries(parsed)) {
      if (env[key] === undefined || env[key] === "") {
        env[key] = value;
        keys.push(key);
      }
    }
    return { loaded: candidate, keys };
  }
  return { loaded: null, keys: [] };
}

// 副作用式自动加载（被 import 即生效）
const result = loadEnv();
if (result.loaded) {
  // 只报文件名与键名，绝不报值
  console.log(`[zhengming] loaded ${result.keys.length} var(s) from ${path.basename(result.loaded)}: ${result.keys.join(", ") || "(none new)"}`);
}
