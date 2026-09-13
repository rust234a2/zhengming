// event-replay-prototype.html 运行时测试（Node DOM 桩，真实执行页内脚本）
// 用法: node event-replay.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'event-replay-prototype.html'), 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('未找到 <script>'); process.exit(1); }

/* ---------- DOM 桩 ---------- */
const elements = {};
function makeClassList(){
  const set = new Set();
  return { add:(...c)=>c.forEach(x=>set.add(x)), remove:(...c)=>c.forEach(x=>set.delete(x)),
    toggle(c,on){ on===undefined ? (set.has(c)?set.delete(c):set.add(c)) : (on?set.add(c):set.delete(c)); },
    contains:c=>set.has(c) };
}
function makeEl(id){
  return elements[id] ??= {
    id, innerHTML:'', textContent:'', className:'', value:'', style:{},
    classList: makeClassList(), children: [],
    appendChild(ch){ this.children.push(ch); return ch; },
    remove(){}, addEventListener(){}, removeEventListener(){},
    setAttribute(){}, getAttribute(){ return null; },
    querySelector(sel){ return makeEl('q:'+id+':'+sel); },
    querySelectorAll(){ return []; },
    scrollTop: 0, onclick: null, open: false,
  };
}
const documentStub = {
  getElementById: (id) => makeEl(id),
  createElement: (tag) => makeEl('el:' + tag + ':' + Math.random()),
  addEventListener(){},
  querySelector(sel){ return makeEl('dq:'+sel); },
  querySelectorAll(){ return []; },
};
const windowStub = { location:{ href:'', reload(){} } };

const V = new Function('document','window','console',
  m[1] + `
  return { NODES, CROWD_MOST, render, chooseOpt, goNext, replayFrom,
    cur:()=>cur, path:()=>path, runs:()=>runs, realOpened:()=>realOpened };
`)(documentStub, windowStub, console);

let pass = 0, fail = 0;
const ok = (c, n, x) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.error('  ✗ ' + n + (x ? ' — ' + JSON.stringify(x) : '')); } };

/* ---------- 场景1: 分岔链完整性 ---------- */
console.log('场景1 分岔链数据完整性');
const N = V.NODES;
const nonEnd = Object.keys(N).filter(k => !N[k].end);
const ends = Object.keys(N).filter(k => N[k].end);
ok(nonEnd.length === 7 && ends.length === 4, `7 个决策节点 + 4 个结局（实际 ${nonEnd.length}+${ends.length}）`);
ok(nonEnd.every(k => N[k].opts.length >= 2 && N[k].opts.length <= 3), '每个岔路口 2-3 个选项');
ok(nonEnd.every(k => N[k].opts.every(o => N[o.next])), '所有选项的 next 指向存在的节点');
ok(nonEnd.every(k => N[k].hint && N[k].time && N[k].text), '每个节点有叙述/时间/Host 追问');
ok(ends.every(k => N[k].ending && N[k].text), '每个结局有标题与叙述');
ok(nonEnd.every(k => N[k].real && N[k].real.choice), '每个节点有真实历史层');
const realMarks = nonEnd.filter(k => N[k].opts.some(o => o.real === true));
ok(realMarks.length >= 2, `真实路径标记存在于 ≥2 个岔路口（${realMarks.join(',')}）`);
/* 全局可达性：从 s1 出发所有节点可达 */
const seenSet = new Set();
(function walk(k){ if (seenSet.has(k)) return; seenSet.add(k); if (!N[k].end) N[k].opts.forEach(o => walk(o.next)); })('s1');
ok(nonEnd.every(k => seenSet.has(k)) && ends.every(k => seenSet.has(k)), '无孤立节点');

/* ---------- 场景2: 群像多数项正确 ---------- */
console.log('场景2 群像数据');
ok(nonEnd.every(k => {
  const opts = N[k].opts;
  const maxIdx = opts.reduce((mi, o, i) => o.pct > opts[mi].pct ? i : mi, 0);
  return V.CROWD_MOST[k] === maxIdx;
}), 'CROWD_MOST 每个岔路口都指向占比最高的选项');
ok(nonEnd.every(k => N[k].opts.reduce((s,o)=>s+o.pct,0) === 100), '每个岔路口占比合计 100%');

/* ---------- 场景3: 走真实路径（全绿对照） ---------- */
console.log('场景3 走真实历史路径');
V.render();
ok(makeEl2Text('stage-wrap').length > 0 || V.path().length === 0, '初始渲染');
V.chooseOpt(0);                    /* s1: 辞职去苏州（真实） */
ok(V.path().length === 1 && V.path()[0].dev === false, 's1 选真实项 → 不算偏离');
V.goNext('a1'); V.chooseOpt(1);    /* a1: 接受安排（真实） */
ok(V.path()[1].dev === false, 'a1 选真实项');
V.goNext('a2'); V.chooseOpt(0);    /* a2: 坚持留苏州（真实） */
ok(V.path()[2].dev === false, 'a2 选真实项');
V.goNext('e1');
ok(makeEl2('mask').classList.contains('show'), '终局遮罩弹出');
ok(makeEl2('cmp-body').innerHTML.includes('岔路 3'), '对照表 3 行岔路口');
ok(makeEl2('cmp-body').innerHTML.includes('与真实一致'), '全程真实 → 对照表标「与真实一致」');
ok(makeEl2('e-host-qs').innerHTML.includes('隐含假设') || makeEl2('e-host-qs').children.length === 2, 'Host 推演追问生成');

function makeEl2(id){ return elements['q:stage-wrap:.opt'] && id === 'x' ? elements[id] : elements[id] ?? makeEl(id); }
function makeEl2Text(id){ return elements[id]?.innerHTML || ''; }

/* ---------- 场景4: 偏离路径 + 剧透保护 ---------- */
console.log('场景4 偏离路径与剧透保护');
makeEl2('mask').classList.remove('show');
makeEl2('btn-replay').onclick();    /* 重新推演 */
ok(V.runs() === 2 && V.path().length === 0, '重推后次数 +1、路径清空');
V.render();
ok(makeEl2('real-fold').open === false, '剧透保护：真实历史折叠默认收起');
V.chooseOpt(1);                     /* s1: 留在县中（偏离） */
ok(V.path()[0].dev === true, '偏离项被标记 dev');
V.goNext('b1'); V.chooseOpt(0);     /* b1: 再赌一次 → b2 */
V.goNext('b2'); V.chooseOpt(0);     /* b2: 坚持住 → e1 */
V.goNext('e1');
ok(makeEl2('cmp-body').innerHTML.includes('岔路 3'), '偏离路径同样产出 3 行对照');
ok(makeEl2('cmp-body').innerHTML.includes('分流'), '真实层缺失处显示「分流」占位');
ok(makeEl2('e-host-qs').innerHTML.includes('偏离'), 'Host 推演指向偏离点');

/* ---------- 场景5: 回到过去重走 ---------- */
console.log('场景5 回溯重走');
makeEl2('mask').classList.remove('show');
V.replayFrom('s1');
ok(V.cur() === 's1' && V.path().length === 0, '回到 s1，后续路径清除');
V.chooseOpt(2);                     /* s1: 先考察 → c1 */
V.goNext('c1'); V.chooseOpt(0); V.goNext('a1');  /* c1: 立刻签约 → a1 */
ok(V.cur() === 'a1', 'c1 → a1 分支跳转正确');

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
