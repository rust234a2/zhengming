/**
 * 把 tsc 产出的领域模块改造成 Node ESM 可直接 import 的形态。
 *
 * 为什么需要这一步：浏览器/打包器允许省略扩展名的 import，
 * 但 Node 的原生 ESM 解析要求显式 `.js`，否则服务端 import 会报 ERR_MODULE_NOT_FOUND。
 *
 * 用法（由 web/package.json 的 build:domain 脚本调用）：
 *   node scripts/fix-domain-imports.mjs dist-domain
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const target = process.argv[2] || "dist-domain";
const root = path.resolve(HERE, "..", target);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : entry.name.endsWith(".js") ? [full] : [];
  });
}

/** 给相对 import/export 补上 .js（已带扩展名或指向目录的跳过） */
function rewrite(source) {
  return source.replace(
    /(\bfrom\s+|\bimport\s*\(\s*)(["'])(\.{1,2}\/[^"']+)(["'])/g,
    (match, prefix, quote, specifier, closing) => {
      if (/\.(js|mjs|cjs|json)$/.test(specifier)) return match;
      return `${prefix}${quote}${specifier}.js${closing}`;
    },
  );
}

if (!fs.existsSync(root)) {
  console.error(`[fix-domain-imports] directory not found: ${root}`);
  process.exit(1);
}

const files = walk(root);
let changed = 0;
for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const patched = rewrite(original);
  if (patched !== original) {
    fs.writeFileSync(file, patched, "utf8");
    changed += 1;
  }
}
console.log(`[fix-domain-imports] ${changed}/${files.length} files patched in ${path.relative(process.cwd(), root)}`);
