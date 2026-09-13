import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { selectClusterLinks } from "./build-map-core.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const cross = JSON.parse(fs.readFileSync(path.join(dir, "cross-links.json"), "utf8"));
const selected = selectClusterLinks(cross.links);

assert(selected.length > 0, "应有可用于聚簇的 same-claim 边");
assert(selected.every((link) => link.relation === "same-claim"), "聚簇输入不得含 rebuts");
assert.equal(
  selected.length,
  cross.links.filter((link) => link.relation === "same-claim").length,
  "不得漏掉 same-claim 边",
);

const synthetic = selectClusterLinks([
  { relation: "same-claim", label: "共享主张" },
  { relation: "rebuts", label: "冲突标签" },
]);
assert.deepEqual(synthetic.map((link) => link.label), ["共享主张"]);

console.log(`build-map 聚簇关系过滤通过：${selected.length} 条 same-claim，已排除 ${cross.links.length - selected.length} 条 rebuts`);
