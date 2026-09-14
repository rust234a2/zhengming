/**
 * 深挖检索（宽搜之后的「深而窄」几何）。
 *
 * 约束：zhihu-cli --count 上限 10（服务端硬限制，实测 INVALID_ARGUMENT）。
 * 因此深挖 = 每题两次检索变体：
 *   A) 议题完整标题（排序最聚焦本题）
 *   B) 标题核心词（去掉问号截断，捕捉不同排序下的回答）
 * 两路合计约 10-16 条/题，去重后由 merge-sources 取点赞 top-8。
 * 幂等：raw-deep/<zid>.json / <zid>b.json 存在且非空则跳过。只用 search 通道。
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CLI = "C:\\Users\\Lenovo\\AppData\\Local\\ZhihuCLI\\current\\zhihu-cli.exe";
const RAW = path.join(DIR, "raw-deep");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function runSearch(query) {
  let out = "";
  try {
    out = execFileSync(
      CLI,
      ["search", "zhihu", "--query", query, "--count", "10", "--timeout", "90s"],
      { encoding: "utf8", timeout: 100000, maxBuffer: 32 * 1024 * 1024 },
    );
  } catch (e) {
    out = String(e.stdout || "");
  }
  return out || "{}";
}

function itemCount(out) {
  try {
    return ((JSON.parse(out).Data || {}).Items || []).length;
  } catch {
    return -1; // 明确的错误返回
  }
}

const { picked } = JSON.parse(fs.readFileSync(path.join(DIR, "deep-dive.json"), "utf8"));
fs.mkdirSync(RAW, { recursive: true });

const coreTitle = (t) =>
  t.replace(/[??？?！!。.,，、;；:：（）()「」"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 18);

let done = 0;
for (const t of picked) {
  // 变体 A：完整标题
  const pathA = path.join(RAW, `${t.zhihuId}.json`);
  if (!fs.existsSync(pathA) || itemCount(fs.readFileSync(pathA, "utf8")) <= 0) {
    const out = runSearch(t.title);
    const n = itemCount(out);
    fs.writeFileSync(pathA, out, "utf8");
    process.stdout.write(`[A zh-${t.zhihuId}] ${n} 条 ... `);
    await sleep(3000);
  } else {
    process.stdout.write(`[A zh-${t.zhihuId}] skip ... `);
  }

  // 变体 B：标题核心词
  const core = coreTitle(t.title);
  const pathB = path.join(RAW, `${t.zhihuId}b.json`);
  if (core && (!fs.existsSync(pathB) || itemCount(fs.readFileSync(pathB, "utf8")) <= 0)) {
    const out = runSearch(core);
    const n = itemCount(out);
    fs.writeFileSync(pathB, out, "utf8");
    console.log(`[B] ${n} 条`);
    await sleep(3000);
  } else {
    console.log(`[B] skip`);
  }
  done++;
}
console.log(`DONE ${done}/${picked.length}`);
