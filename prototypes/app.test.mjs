// zhengming-app.html 集成运行时测试（Node DOM 桩，按文档顺序执行全部 <script>）
// 用法: node app.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'zhengming-app.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (scripts.length !== 3) { console.error('期望 3 个 <script>，实际 ' + scripts.length); process.exit(1); }

/* ---------- DOM 桩 ---------- */
const elements = {};
function makeClassList(){
  const set = new Set();
  return { add:(...c)=>c.forEach(x=>set.add(x)), remove:(...c)=>c.forEach(x=>set.delete(x)),
    toggle:(c,on)=>{ on===undefined ? (set.has(c)?set.delete(c):set.add(c)) : (on?set.add(c):set.delete(c)); },
    contains:c=>set.has(c) };
}
function makeEl(id){
  return elements[id] ??= {
    id, innerHTML:'', textContent:'', className:'', value:'', style:{},
    classList: makeClassList(), children: [], disabled: false, open: false,
    appendChild(ch){ this.children.push(ch); return ch; },
    remove(){}, addEventListener(){}, removeEventListener(){},
    setAttribute(){}, getAttribute(){ return null; },
    querySelector(){ return makeEl('q:'+id); }, querySelectorAll(){ return []; },
    onclick: null, oninput: null, scrollTop: 0,
    getBoundingClientRect(){ return { left:0, top:0, width:940, height:660 }; },
  };
}
function makeSvgEl(tag){
  return { tag, innerHTML:'', children: [], classList: makeClassList(),
    appendChild(ch){ this.children.push(ch); return ch; }, addEventListener(){},
    setAttribute(){}, getAttribute(){ return null; } };
}
const documentStub = {
  getElementById: id => makeEl(id),
  createElement: t => makeEl('el:' + t + ':' + Math.random()),
  createElementNS: (_ns, t) => makeSvgEl(t),
  addEventListener(){}, querySelectorAll(){ return []; },
};
const windowStub = { addEventListener(){}, open(){} };
let pending = [];
const setTimeoutStub = fn => { pending.push(fn); return pending.length; };
const flushAsync = async () => { while (pending.length) { pending.shift()(); await Promise.resolve(); } };
let intervals = [];
const setIntervalStub = fn => { intervals.push(fn); return intervals.length; };
const clearIntervalStub = id => { intervals[id-1] = null; };

/* 按文档顺序执行三个 script（共享全局作用域） */
const allJs = scripts.join('\n;\n');
new Function('document','window','console','setTimeout','clearTimeout','setInterval','clearInterval',
  allJs + `\n;return {};`)(documentStub, windowStub, console, setTimeoutStub, ()=>{}, setIntervalStub, clearIntervalStub);

let pass = 0, fail = 0;
const ok = (c, n, x) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.error('  ✗ ' + n + (x ? ' — ' + JSON.stringify(x) : '')); } };
const W = windowStub;
/* 桩补丁：轮次指示条需要真实的子节点 */
makeEl('round-ind').children = [makeEl('rd0'), makeEl('rd1'), makeEl('rd2')];

/* ---------- 场景1: 装载与全局钩子 ---------- */
console.log('场景1 装载');
ok(typeof W.App === 'object' && typeof W.App.go === 'function', 'App 路由就绪');
ok(typeof W.Room === 'object' && typeof W.Replay === 'object', 'Room / Replay 模块挂载');
ok(makeEl('tree').innerHTML.length > 0, '默认树视图渲染');
ok(makeEl('tree-panel').style.display !== 'none', '树面板可见');
ok(makeEl('room-panel').style.display !== 'flex' && makeEl('er-panel').style.display !== 'flex', '房间/推演面板默认不展开');
ok(makeEl('room-mask').id === 'room-mask' && makeEl('er-mask').id === 'er-mask', '遮罩 id 已隔离（room-mask / er-mask）');

/* ---------- 场景2: 图谱视图 ---------- */
console.log('场景2 图谱');
W.App.go('graph');
ok(makeEl('graph-panel').style.display === 'block' && makeEl('tree-panel').style.display === 'none', '切到图谱');
ok(makeEl('vb-replay').classList.contains('on') === false, 'Tab 高亮正确');

/* ---------- 场景3: 辩论间全流程（v0.3 结构化对局） ---------- */
console.log('场景3 辩论间');
W.App.go('room');
ok(makeEl('room-panel').style.display === 'flex', '房间面板显示');
ok(makeEl('match').classList.contains('hide') === false, '匹配遮罩出现');
ok(makeEl('detail').style.display === 'none', '节点详情框在辩论间隐藏');
await flushAsync();
ok(makeEl('m-btn').disabled === false, '匹配完成');
makeEl('m-btn').onclick();
ok(W.Room._debug.state() === 'concept', '进入概念对齐');
W.Room._debug.pickConcept(0, 0);
ok(W.Room._debug.state() === 'pretree', '定义对齐 → 论证树预提交');
W.Room._debug.submitPreTree('该辞职去', '窗口期有政策依据', '', '教育局公开文件');
await flushAsync(); await flushAsync();
ok(W.Room._debug.state() === 'opening', '预提交 → 对方立论 → 我方立论');
ok(W.Room._debug.newNodes() >= 6, '两棵论证树上板');
W.Room._debug.submitOpening('我的开篇陈述', '公开数据');
await flushAsync(); await flushAsync();
ok(W.Room._debug.state() === 'cross-answer', '立论 → 对方质询');
W.Room._debug.submitAnswer('因为调动政策放宽了年龄限制，有公开文件');
ok(W.Room._debug.state() === 'cross-ask', '回答 → 轮到我质询');
W.Room._debug.submitCrossQuestion(0, 0, '你的证据是什么？');
await flushAsync(); await flushAsync();
ok(W.Room._debug.state() === 'cross-react', '对方回答 → 三选一');
makeEl('rc-acc').onclick();
ok(W.Room._debug.state() === 'free', '接受 → 自由对辩');
W.Room._debug.submitFree('反驳', '我方反驳发言');
await flushAsync(); await flushAsync();
ok(W.Room._debug.state() === 'closing', '自由对辩 → 结辩');
W.Room._debug.submitClosing(0, '回应对方最强点', false, '');
await flushAsync(); await flushAsync();
ok(W.Room._debug.state() === 'end', '结辩 → 终局');
ok(makeEl('room-mask').classList.contains('show'), '争议档案弹出');
ok(makeEl('radar-box').innerHTML.includes('<svg'), '结构画像雷达图渲染');
makeEl('btn-settle').onclick && makeEl('btn-settle').onclick();
ok(makeEl('room-toast').textContent.includes('settlement'), '沉淀提示');

/* ---------- 场景4: 重置辩论间 ---------- */
console.log('场景4 重置');
W.App.resetRoom();
ok(makeEl('match').classList.contains('hide') === false, '重置后回到匹配');
ok(W.Room._debug.state() === 'idle' && W.Room._debug.newNodes() === 0, '对局状态清零');

/* ---------- 场景5: 事件推演 ---------- */
console.log('场景5 事件推演');
W.App.go('replay');
ok(makeEl('er-panel').style.display === 'flex' && makeEl('room-panel').style.display === 'none', '推演面板显示、房间面板隐藏');
ok(W.Replay._debug.cur() === 's1', '推演初始化（真实路径可走）');
const D = W.Replay._debug;
D.chooseOpt(0); D.goNext('a1'); D.chooseOpt(1); D.goNext('a2'); D.chooseOpt(0); D.goNext('e1');
ok(makeEl('er-mask').classList.contains('show'), '推演终局对照卡弹出');
ok(makeEl('cmp-body').innerHTML.includes('与真实一致'), '真实路径对照');
W.App.resetReplay();
ok(D.cur() === 's1' && makeEl('er-mask').classList.contains('show') === false, 'App.resetReplay 生效');

/* ---------- 场景6: 切回辩论树 ---------- */
console.log('场景6 回到树');
W.App.go('tree');
ok(makeEl('tree-panel').style.display === '' && makeEl('er-panel').style.display === 'none', '切回树视图');
ok(makeEl('tree').innerHTML.includes('辞职去'), '树正常重建');
ok(makeEl('mm-card').style.display === '', '缩略图恢复');
ok(makeEl('detail').style.display !== 'none', '节点详情框在树视图恢复');

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
