// debate-room-prototype.html v0.3 结构化对局 运行时测试（Node DOM 桩）
// 用法: node debate-room.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'debate-room-prototype.html'), 'utf8');
let script = (html.match(/<script>([\s\S]*?)<\/script>/) || [])[1];
if (!script) { console.error('未找到 <script>'); process.exit(1); }
script = script.replace(/\nstartMatch\(\);\s*$/, '\n');   /* 启动行交由测试控制 */

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
    onclick: null, oninput: null, onchange: null, scrollTop: 0,
  };
}
const documentStub = {
  getElementById: id => makeEl(id),
  createElement: t => makeEl('el:'+t+':'+Math.random()),
  addEventListener(){}, querySelectorAll(){ return []; },
};
const windowStub = { addEventListener(){}, location:{ href:'', reload(){} } };

let pending = [];
const setTimeoutStub = fn => { pending.push(fn); return pending.length; };
const flushAsync = async () => { while (pending.length) { pending.shift()(); await Promise.resolve(); } };

const V = new Function('document','window','console','setTimeout','clearTimeout','setInterval','clearInterval',
  script + `
  return { CONCEPTS, BOT_TREE, QTYPES, FREE_TYPES, TIERS, AI_DIMS,
    startMatch, enterRoom, pickConcept, submitPreTree, submitOpening, submitAnswer,
    submitCrossQuestion, submitFree, submitClosing, showEnd, acknowledge, resetRoom,
    evaluate, showEndcard, closeEndcard,
    state:()=>state, mp:()=>mp, newNodes:()=>newNodes, evasions:()=>evasions, conceptTries:()=>conceptTries,
    mpLog:()=>mpLog, revised:()=>revised, transcript:()=>transcript };
`)(documentStub, windowStub, console, setTimeoutStub, ()=>{}, ()=>1, ()=>{});

let pass = 0, fail = 0;
const ok = (c,n,x) => { if(c){pass++;console.log('  ✓ '+n);} else {fail++;console.error('  ✗ '+n+(x?' — '+JSON.stringify(x):''));} };

/* ---------- 场景1: 数据完整性 ---------- */
console.log('场景1 流程数据');
ok(V.CONCEPTS.length === 2 && V.CONCEPTS.every(c => c.opts.length === 3 && c.opts.filter(o=>o.ok).length === 1), '2 个概念 × 3 定义，各 1 中性项');
ok(V.QTYPES.length === 5, '5 种问题类型');
ok(V.FREE_TYPES.includes('承认') && V.FREE_TYPES.includes('修正'), '发言类型含承认/修正');
ok(V.TIERS.every((t,i)=>i===0||t[1]>V.TIERS[i-1][1]), '段位门槛单调递增');
ok(V.BOT_TREE.reasons.length === 2, '对方预提交树有 2 条理由');

/* ---------- 场景2: 匹配进入 ---------- */
console.log('场景2 匹配进入');
const p1 = V.startMatch(); await flushAsync(); await p1;
ok(makeEl('m-btn').disabled === false, '匹配完成');
makeEl('m-btn').onclick();
ok(V.state() === 'concept', '进入概念对齐');

/* ---------- 场景3: 概念对齐（拦截与放行） ---------- */
console.log('场景3 概念对齐');
V.pickConcept(1, 0);
ok(V.state() === 'concept' && V.conceptTries() === 1, '定义不一致被拦截，要求重选');
V.pickConcept(0, 0);
ok(V.state() === 'pretree', '定义一致 → 进入论证树预提交');
ok(V.newNodes() > 0, '双方定义上板');

/* ---------- 场景4: 论证树预提交 ---------- */
console.log('场景4 论证树预提交');
V.submitPreTree('该去','' ,'','依据');
ok(V.state() === 'pretree', '缺理由被拦截');
V.submitPreTree('该辞职去','窗口期有政策依据','','教育局公开文件');
await flushAsync();
ok(V.state() === 'opening', '预提交 → 对方立论 → 进入立论阶段');
ok(V.newNodes() >= 6, '两棵论证树都上板');

/* ---------- 场景5: 立论 ---------- */
console.log('场景5 立论');
V.submitOpening('','');
ok(V.state() === 'opening', '空立论被拦截');
V.submitOpening('我的开篇陈述：结论、理由、标准','教育局公开文件');
await flushAsync(); await flushAsync();
ok(V.state() === 'cross-answer', '立论 → 对方质询到来');

/* ---------- 场景6: 质询轮 ---------- */
console.log('场景6 质询轮');
V.submitAnswer('短');
ok(V.state() === 'cross-answer', '过短回答被拦截');
V.submitAnswer('因为调动政策对高级职称教师放宽了年龄限制，有公开文件可查');
ok(V.state() === 'cross-ask', '正面回答 → 轮到我质询');
V.submitCrossQuestion(1, 2, '如果「外调收益不确定」的前提不成立，你的结论还站得住吗？');
await flushAsync(); await flushAsync();
ok(V.state() === 'cross-react', '对方回答 → 三选一反应');
makeEl('rc-evade').onclick();
ok(V.evasions() === 1 && V.state() === 'free', '指出回避记入档案 → 自由对辩');

/* ---------- 场景7: 自由对辩（修正标记） ---------- */
console.log('场景7 自由对辩');
V.submitFree('修正','我把「窗口期不等人」修正为「窗口期正在收窄」');
await flushAsync(); await flushAsync();
ok(V.revised() === true && V.state() === 'closing', '修正被记录 → 进入结辩');

/* ---------- 场景8: 结辩 ---------- */
console.log('场景8 结辩');
V.submitClosing(0, '', false, '');
ok(V.state() === 'closing', '空结辩被拦截');
V.submitClosing(0, '回应对方的最强点：风险确实存在，但可以用两地往返对冲', true, '修正后的表述');
await flushAsync(); await flushAsync();
ok(V.state() === 'end', '结辩 → 终局');
ok(makeEl('mask').classList.contains('show'), '争议档案弹出');
ok(makeEl('radar-box').innerHTML.includes('<svg'), '结构画像雷达图渲染');
ok(makeEl('mp-list').innerHTML.includes('完成完整对局'), '段位结算含 MP 明细');

/* ---------- 场景9: 段位结算 ---------- */
console.log('场景9 段位结算');
V.acknowledge(0);        /* 互认：承认对方一条论点 */
V.showEnd();
const total = V.mpLog().reduce((s,x)=>s+x[1],0);
ok(V.mp() === total && V.mp() >= 20, `鸣声值合计 ${V.mp()} ≥ 20（含对手承认 +3）`);
ok(V.mpLog().some(x => x[0] === '论点被对手承认'), '承认计入 MP');
ok(makeEl('tier-steps').innerHTML.includes('启鸣'), '段位进度渲染');

/* ---------- 场景9.5: AI 中立评估 ---------- */
console.log('场景9.5 AI 中立评估');
const ev = V.evaluate();
ok(V.AI_DIMS.length === 6 && ev.dims.length === 6, '评估输出六个维度');
ok(V.AI_DIMS.every(k => k.length === 2), '雷达维度标签均为 2 字（立论/论据/逻辑/回应/表达/规范）');
ok(ev.dims.every(d => d.v >= 0 && d.v <= 100 && d.r && d.r.length > 4), '各维含 0-100 分数与具体评分依据');
ok(ev.total === Math.round(ev.dims.reduce((s,x)=>s+x.v,0)/6), '综合得分 = 六维等权平均');
ok(makeEl('e-ai').innerHTML.includes('AI 中立评估') && makeEl('e-ai').innerHTML.includes('不构成胜负判定'), '终局卡渲染 AI 总结（含不判胜负声明）');
ok(makeEl('radar-box').innerHTML.includes('立论') && makeEl('radar-box').innerHTML.includes('规范'), '雷达图使用新六维标签');
ok(V.transcript().length >= 8 && V.transcript().every(x => !/[<>]/.test(x.text)), 'transcript 记录全场发言且已剥离 HTML');

/* ---------- 场景9.6: 报告关闭与重开 ---------- */
console.log('场景9.6 报告关闭与重开');
V.closeEndcard();
ok(makeEl('mask').classList.contains('show') === false, '✕ 关闭报告弹窗');
ok(makeEl('composer').innerHTML.includes('查看对局报告') && makeEl('composer').innerHTML.includes('再来一局'), '结束态操作区（重开报告 / 再来一局）');
makeEl('re-open').onclick();
ok(makeEl('mask').classList.contains('show'), '重开报告弹窗');
V.closeEndcard();
makeEl('re-again').onclick();
ok(V.state() === 'idle' && V.mp() === 0 && V.transcript().length === 0, '结束态可直接再来一局（状态清零）');
V.showEnd();             /* 重建终局态，供后续场景使用 */
await flushAsync();
ok(makeEl('mask').classList.contains('show'), 'showEnd 仍可完整重建终局');

/* ---------- 场景10: 重置 ---------- */
console.log('场景10 重置');
makeEl('mask').classList.remove('show');
V.resetRoom();
ok(V.state() === 'idle' && V.mp() === 0 && V.newNodes() === 0, '重置清空全部对局状态');

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
