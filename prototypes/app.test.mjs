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
/* 辩论间一条 await 链可能压着多个 setTimeout（对方立论 → 立论结构 → 质询…），多冲几轮排干 */
const settle = async (n = 10) => { for (let i = 0; i < n; i++) await flushAsync(); };
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

/* ---------- 场景3: 辩论间全流程（v0.6 选边制撮合 · 轮次制对局） ---------- */
console.log('场景3 辩论间');
W.App.go('room');
ok(makeEl('room-panel').style.display === 'flex', '房间面板显示');
ok(makeEl('match').classList.contains('hide') === false, '匹配遮罩出现');
ok(makeEl('detail').style.display === 'none', '节点详情框在辩论间隐藏');
makeEl('m-btn').disabled = true;   /* 模拟 HTML 初始 disabled 属性（DOM 桩不解析标记） */
ok(makeEl('m-claims').innerHTML.includes('正方') && makeEl('m-claims').innerHTML.includes('反方'), '预设论点对渲染（正反两边可选）');
ok(makeEl('m-btn').disabled === true, '未选边前不能进入对局');
const pp = W.Room._debug.pickSide('pro'); await flushAsync(); await pp;
ok(makeEl('m-btn').disabled === false, '选边后撮合完成（池空 → Bot 兜底）');
ok(makeEl('m-found').innerHTML.includes('Bot'), '撮合理由展示 Bot 兜底路径');
makeEl('m-btn').onclick();
await settle();
ok(W.Room._debug.state() === 'brief', '进入房间直接到立论（无概念对齐阶段）');
ok(W.Room._debug.mySide() === 'pro' && W.Room._debug.oppSide() === 'con', '选边结果进入房间状态');
W.Room._debug.submitBrief('「窗口期」＝调动政策仍开放的时期', '该辞职去', '窗口期有政策依据', '', '教育局公开文件');
ok(W.Room._debug.state() === 'opening', '立论结构 → 开篇陈述');
ok(W.Room._debug.records() >= 9, '双方立论结构（含定义）已登记（未建树）');
W.Room._debug.submitOpening('我的开篇陈述', '公开数据');
await settle();
ok(W.Room._debug.state() === 'cross-answer', '立论 → 对方质询');
const firstAnswer=W.Room._debug.submitAnswer('因为调动政策放宽了年龄限制，有公开文件');
await settle();await firstAnswer;
ok(W.Room._debug.state() === 'cross-answer' && W.Room._debug.botQuestionCount() === 2, '首次回答 → 对方继续追问一次');
W.Room._debug.submitAnswer('我的标准是优先避免不可逆的机会损失，家庭成本可以提前缓冲');
ok(W.Room._debug.state() === 'cross-ask', '质询次数达到上限 → 自动轮到我质询');
ok(W.Room._debug.botBriefItems().length === 5, '质询靶点 = 定义 / 结论 / 理由1 / 理由2 / 依据');
W.Room._debug.submitCrossQuestion(0, 0, '你的「高风险动作」定义排除了什么？');
await settle();
ok(W.Room._debug.state() === 'cross-react', '质询对方定义条目 → 可接受或继续追问');
makeEl('rc-acc').onclick();
ok(W.Room._debug.state() === 'free', '接受 → 自由对辩');
W.Room._debug.submitFree('承认', '我方承认对方的中考风险判断');
await settle();
ok(W.Room._debug.state() === 'closing', '自由对辩 → 结辩');
W.Room._debug.submitClosing('分歧在权重；按不可逆优先，结论仍是该去', false, '');
await settle();
ok(W.Room._debug.state() === 'end', '结辩 → 终局');
ok(makeEl('room-mask').classList.contains('show'), '对局报告弹出');
ok(makeEl('radar-box').innerHTML.includes('<svg'), '结构画像雷达图渲染');
ok(makeEl('mp-list').innerHTML.includes('完成完整对局'), '段位结算含 MP 明细');
ok(!html.includes('btn-settle'), '辩论间已移除辩论树集成出口');
ok(!/winner/.test(html) && !/rank(?!Candidates)/.test(html), '集成产物无 winner / rank 字段（rankCandidates 为撮合排序函数名）');
ok(!html.includes('pickConcept') && !html.includes('CONCEPTS'), '集成产物无概念对齐残留符号');

/* ---------- 场景4: 重置辩论间 ---------- */
console.log('场景4 重置');
W.App.resetRoom();
ok(makeEl('match').classList.contains('hide') === false, '重置后回到匹配');
ok(W.Room._debug.state() === 'idle' && W.Room._debug.records() === 0, '对局状态清零');
ok(W.Room._debug.admitted().length === 0, '承认记录清零');

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
