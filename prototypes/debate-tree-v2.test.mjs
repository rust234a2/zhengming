// debate-tree-v2.html 运行时测试（Node DOM 桩，真实执行页内脚本）
// 用法: node debate-tree-v2.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'debate-tree-v2.html'), 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('未找到 <script>'); process.exit(1); }

/* ---------- DOM 桩 ---------- */
const elements = {};
function makeEl(id){
  return elements[id] ??= {
    id, innerHTML:'', textContent:'', className:'', value:'',
    classList:{ add(){}, remove(){}, toggle(){} },
    addEventListener(){},
  };
}
const documentStub = {
  getElementById: (id) => makeEl(id),
  addEventListener(){},
  querySelector(sel){ return null; },
  querySelectorAll(sel){
    if (sel === '#columns .col'){
      const inner = makeEl('columns').innerHTML;
      const n = (inner.match(/class="col"/g) || []).length;
      return Array.from({ length: n }, () => ({}));
    }
    return [];
  },
};
const persisted = new Map();
const localStorageStub = {
  getItem(key){ return persisted.has(key) ? persisted.get(key) : null; },
  setItem(key, value){ persisted.set(key, String(value)); },
  removeItem(key){ persisted.delete(key); },
};
const windowStub = { open(){}, localStorage:localStorageStub };

const exports_ = new Function('document', 'window', 'console',
  m[1] + `
  return { tree, byId, parentOf, depthOf, expanded, init, render,
    addClaim, addQuestion, respondToQuestion, vote, doToggle, doVote,
    validQuestionText, stanceStats, isImbalanced, canAddChild, countNodes,
    selfTest, DEPTH_MAX, CHILD_MAX, QUESTION_MAX, TREE_SCHEMA_VERSION,
    snapshotTree, restoreTree, migrateTreeDocument, validateTreeDocument,
    createTreeRepository, loadPersistedTree };
`) (documentStub, windowStub, console);

const V = exports_;
let pass = 0, fail = 0;
function ok(cond, name, extra){
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.error('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
}

/* ---------- 场景 1: 初始化 + 自测 ---------- */
console.log('场景1 初始化与 selfTest');
V.init();
ok(makeEl('testbar').textContent.includes('selfTest ✓'), 'selfTest 全绿', makeEl('testbar').textContent);
ok(makeEl('topic').innerHTML.includes('43岁县中教师'), '议题卡渲染');
ok(documentStub.querySelectorAll('#columns .col').length === 3, '三栏渲染');
ok(makeEl('stats').innerHTML.includes('最大立场占比'), '统计条渲染');

/* ---------- 场景 2: 渐进展开 ---------- */
console.log('场景2 渐进展开');
ok(!V.expanded.has('p1'), '初始 p1 未展开');
V.doToggle('p1');
ok(V.expanded.has('p1'), '点击后 p1 展开');
ok(makeEl('columns').innerHTML.includes('你说的「天花板」'), '展开后可见追问 q1');
V.doToggle('p1');
ok(!V.expanded.has('p1'), '再次点击收起');

/* ---------- 场景 3: 投票 ---------- */
console.log('场景3 投票');
const before = V.byId.p3.votes.up;
V.doVote('p3', 1);
ok(V.byId.p3.votes.up === before + 1, '投票 up+1');

/* ---------- 场景 4: 添加论点入栏 ---------- */
console.log('场景4 添加论点');
const r1 = V.addClaim('root', { stance:'con', text:'新反对论点：家庭支持系统会断裂', evidence:'配偶无法随迁' });
ok(r1.ok, '添加反对论点成功');
ok(typeof V.parentOf[r1.node.id] === 'string', 'parentOf 存字符串 id');
ok(V.depthOf[r1.node.id] === 1, '新节点深度=1');
V.render();
ok(makeEl('columns').innerHTML.includes('家庭支持系统会断裂'), '新论点渲染进反对栏');
const s = V.stanceStats();
ok(s.counts.con === 3 && s.counts.pro === 3 && s.counts.neu === 2, '统计条计数更新', JSON.stringify(s.counts));

/* ---------- 场景 5: 追问 ---------- */
console.log('场景5 追问');
ok(!V.validQuestionText('我就是不同意').ok, '纯表态被拦截');
ok(!V.validQuestionText('为什么').ok, '过短被拦截');
const q0 = V.byId.p3.children.filter(c => c.type === 'question').length;
ok(V.addQuestion('p3', '你说的教育资源升级，具体指升学率还是素质教育资源？').ok, '追问 1');
ok(V.addQuestion('p3', '投入换起点的回报周期有多长，孩子几年级转学来得及？').ok, '追问 2');
ok(V.addQuestion('p3', '如果孩子在原校已是尖子生，转学风险如何评估？').ok, '追问 3');
const r4 = V.addQuestion('p3', '第四个追问应该被拦住的啦');
ok(!r4.ok, '第 4 条追问被上限拦截', r4.ok ? '' : r4.msg);
ok(V.byId.p3.children.filter(c => c.type === 'question').length === q0 + 3, '追问数=q0+3');

/* ---------- 场景 6: 回应追问（立场继承） ---------- */
console.log('场景6 回应追问');
const rr = V.respondToQuestion('q1', { text:'主要指职级晋升，县中高级职称名额太少' });
ok(rr.ok, '回应成功');
ok(rr.node.stance === 'pro', '立场继承父论点 pro', rr.node.stance);
ok(V.byId.q1.answered === true, '追问标记已回应');

/* ---------- 场景 7: 深度上限（从 n2 起链，避免 root 子节点已满） ---------- */
console.log('场景7 深度上限');
let cur = 'n2'; // depth 1
for (let d = 2; d <= V.DEPTH_MAX; d++){
  const r = V.addClaim(cur, { stance:'pro', text:'链条论点 深度' + d + ' 测试内容' });
  ok(r.ok, '深度 ' + d + ' 添加成功');
  cur = r.node.id;
}
const deep = V.addClaim(cur, { stance:'pro', text:'这条应该超深被拦截' });
ok(!deep.ok, '深度 5 被拦截', deep.ok ? '' : deep.msg);

/* ---------- 场景 8: 子节点上限（宿主挂在 p2 下） ---------- */
console.log('场景8 子节点上限');
const host = V.addClaim('p2', { stance:'neu', text:'子节点上限测试宿主论点' }).node;
for (let i = 0; i < V.CHILD_MAX; i++){
  ok(V.addClaim(host.id, { stance:'neu', text:'填充子节点 ' + i + ' 号内容' }).ok, '子节点 ' + (i+1));
}
ok(!V.addClaim(host.id, { stance:'neu', text:'第九个子节点应被拦截' }).ok, '第 9 个子节点被拦截');

/* ---------- 场景 9: 全量变更后 selfTest 仍绿 ---------- */
console.log('场景9 变更后 selfTest');
V.render();
const fails = V.selfTest();
ok(fails.length === 0, 'selfTest 仍全绿', fails.join(' | '));

/* ---------- 场景 10: 失衡判定 ---------- */
console.log('场景10 失衡判定');
ok(V.isImbalanced({ pro:7, neu:1, con:1 }), '7:1:1 判失衡');
ok(!V.isImbalanced({ pro:3, neu:2, con:2 }), '3:2:2 不判失衡');

/* ---------- 场景 11: 版本化持久化与迁移 ---------- */
console.log('场景11 版本化持久化与迁移');
const snapshot = V.snapshotTree();
ok(snapshot.schemaVersion === V.TREE_SCHEMA_VERSION, '快照带 schemaVersion');
ok(Number.isInteger(snapshot.revision) && snapshot.revision > 0, '变更后 revision 已递增');
ok(Array.isArray(snapshot.expanded), '折叠状态进入快照');
const legacy = V.migrateTreeDocument(snapshot.tree);
ok(legacy.schemaVersion === V.TREE_SCHEMA_VERSION && legacy.revision === 0, '旧版裸树可迁移');
const duplicate = JSON.parse(JSON.stringify(snapshot));
duplicate.tree.children[1].id = duplicate.tree.children[0].id;
ok(!V.validateTreeDocument(duplicate).ok, '重复节点 id 被校验拦截');

/* ---------- 场景 12: repository revision 冲突 ---------- */
console.log('场景12 repository revision 冲突');
const isolatedStore = new Map();
const storage = {
  getItem(key){ return isolatedStore.get(key) ?? null; },
  setItem(key, value){ isolatedStore.set(key, value); },
};
const repo = V.createTreeRepository(storage, 'tree');
const first = JSON.parse(JSON.stringify(snapshot));
first.revision = 0;
const saved = repo.save(first, 0);
ok(saved.ok && saved.document.revision === 1, '首次保存 revision=1');
const stale = repo.save(first, 0);
ok(!stale.ok && stale.conflict && stale.actualRevision === 1, '旧 revision 写入被拒绝');
ok(repo.load().document.tree.id === 'root', '仓储可读回合法 root');

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
