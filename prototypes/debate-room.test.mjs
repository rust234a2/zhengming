// debate-room-prototype.html v0.6 选边制撮合（论点对 · 选边 · 画像排序 · Bot 兜底） 运行时测试（Node DOM 桩）
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
/* 一条 await 链上可能压着多个 setTimeout（对方立论 → 立论结构 → 质询…），多冲几轮排干 */
const settle = async (n = 10) => { for (let i = 0; i < n; i++) await flushAsync(); };

const V = new Function('document','window','console','setTimeout','clearTimeout','setInterval','clearInterval',
  script + `
  return { CLAIM_PAIR, BOT_SIDES, CANDIDATE_POOL, QTYPES, FREE_TYPES, TIERS, AI_DIMS, STAGE_NAMES,
    startMatch, pickSide, enterRoom, rankCandidates, renderBrief, submitBrief, submitOpening, submitAnswer,
    submitCrossQuestion, submitFree, submitClosing, showEnd, resetRoom, botBriefItems,
    evaluate, showEndcard, closeEndcard, createHostCoordinator,
    state:()=>state, mp:()=>mp, records:()=>records, evasions:()=>evasions,
    mpLog:()=>mpLog, revised:()=>revised, admitted:()=>admitted, transcript:()=>transcript,
    mySide:()=>mySide, oppSide:()=>oppSide };
`)(documentStub, windowStub, console, setTimeoutStub, ()=>{}, ()=>1, ()=>{});

let pass = 0, fail = 0;
const ok = (c,n,x) => { if(c){pass++;console.log('  ✓ '+n);} else {fail++;console.error('  ✗ '+n+(x?' — '+JSON.stringify(x):''));} };

/* ---------- 场景1: 数据完整性 ---------- */
console.log('场景1 流程数据');
ok(V.STAGE_NAMES.length === 5, '阶段表收敛为五阶段');
ok(V.STAGE_NAMES[0] === '立论' && !V.STAGE_NAMES.includes('概念对齐'), '阶段表已无「概念对齐」，以立论开局');
ok(V.CLAIM_PAIR && V.CLAIM_PAIR.pro && V.CLAIM_PAIR.con, '预设论点对：正反两边各 1 条');
ok(V.CLAIM_PAIR.pro.claim.length > 10 && V.CLAIM_PAIR.con.claim.length > 10, '每边含 1 条核心论点 + 立场标签');
ok(typeof V.BOT_SIDES.con.brief.def === 'string' && V.BOT_SIDES.con.brief.def.length > 4, '反方 Bot 立论结构含关键定义（可被质询）');
ok(typeof V.BOT_SIDES.pro.brief.def === 'string' && V.BOT_SIDES.pro.brief.def.length > 4, '正方 Bot 立论结构含关键定义（可被质询）');
ok(V.BOT_SIDES.pro.brief.reasons.length === 2 && V.BOT_SIDES.con.brief.reasons.length === 2, '两边 Bot 立论结构各 2 条理由');
ok(V.botBriefItems().length === 5, '质询靶点 = 定义 / 结论 / 理由1 / 理由2 / 依据');
ok(V.botBriefItems()[0].k === '定义', '定义是第一质询靶点');
const briefShape = V.BOT_SIDES.con.brief;
ok(!('children' in briefShape) && !('parent' in briefShape) && !('nodes' in briefShape), '立论结构不含树字段（无父子边）');

/* ---------- 场景1.5: 撮合排序纯函数（v0.6） ---------- */
console.log('场景1.5 撮合排序纯函数');
const DIMS_A=[60,60,60,60,60,60], DIMS_B=[80,80,80,80,80,80];
const pool=[{id:'a',dims:DIMS_A},{id:'b',dims:DIMS_B},{id:'c'}];
const r1=V.rankCandidates(DIMS_A,pool);
ok(r1.length===3,'全部候选参与排序');
ok(r1[0].id==='a'&&r1[1].id==='b'&&r1[2].id==='c','画像相近者排前；无画像候选排其后');
ok(Math.abs(r1[0].score-1)<1e-9 && Math.abs(r1[1].score-0.8)<1e-9 && r1[2].score===null,'score = 1 − mean(|dim_i − dim_i′|)/100，无画像为 null');
const r2=V.rankCandidates(DIMS_A,pool);
ok(JSON.stringify(r1.map(x=>x.id))===JSON.stringify(r2.map(x=>x.id)),'同输入同输出（稳定排序）');
const r3=V.rankCandidates(null,pool);
ok(r3.every(x=>x.score===null)&&r3.map(x=>x.id).join()==='a,b,c','冷启动（无画像）：不排序、保持候选池原序');
ok(V.CANDIDATE_POOL.length===0,'演示候选池为空 → Bot 兜底路径');

/* ---------- 场景2: 选边与撮合进入 ---------- */
console.log('场景2 选边与撮合进入');
makeEl('m-btn').disabled = true;   /* 模拟 HTML 初始 disabled 属性（DOM 桩不解析标记） */
V.startMatch();
ok(makeEl('m-claims').innerHTML.includes('正方') && makeEl('m-claims').innerHTML.includes('反方'), '开局前出现预设论点对（正反两边可选）');
ok(makeEl('m-btn').disabled === true, '未选边前不能进入对局');
const pp = V.pickSide('pro'); await flushAsync(); await pp;
ok(V.mySide()==='pro' && V.oppSide()==='con', '选边记入状态（允许任选一边）');
ok(makeEl('m-btn').disabled === false, '选边后撮合完成');
ok(makeEl('m-found').innerHTML.includes('Bot') && makeEl('m-found').innerHTML.includes('反方'), '池空走 Bot 兜底，撮合理由可解释（不伪造真人在线）');
makeEl('m-btn').onclick();
await settle();
ok(V.state() === 'brief', '进入房间直接到立论（无定义对齐前置）');
ok(V.records() > 0, '对方立论结构（含定义）已登记');
ok(makeEl('composer').innerHTML.includes('可改可弃'), '预设论点只预填立论草稿（提示可改可弃）');
ok(makeEl('composer').innerHTML.includes(V.CLAIM_PAIR.pro.claim.slice(0, 10)), '结论草稿预填所选边预设论点');

/* ---------- 场景3: 立论结构（定义可选、理由必填） ---------- */
console.log('场景3 立论结构');
V.submitBrief('', '该去', '', '', '');
ok(V.state() === 'brief', '缺理由被拦截');
const rec0 = V.records();
V.submitBrief('「窗口期」＝调动政策仍开放的时期', '该辞职去', '窗口期有政策依据', '', '教育局公开文件');
ok(V.state() === 'opening', '立论结构 → 开篇陈述');
ok(V.records() === rec0 + 4, '立论结构按条目登记（定义 / 结论 / 理由1 / 依据）');
V.resetRoom();
ok(V.state() === 'idle' && V.mySide() === null, '重置回到未选边状态');
const pc = V.pickSide('con'); await flushAsync(); await pc;   /* 换边再开一局：允许守另一边 */
V.enterRoom();
await settle();
const botRec2 = V.records();          /* 第二局：对方立论结构登记数（含定义） */
ok(V.oppSide() === 'pro', '换边后对手改守正方（论点对另一边）');
V.submitBrief('', '结论先行', '唯一理由', '', '');
ok(V.state() === 'opening', '未填定义不阻塞（定义可选）');
ok(V.records() === botRec2 + 2, '未填定义时只登记本方 2 条（结论 / 理由1）');

/* ---------- 场景4: 立论 ---------- */
console.log('场景4 立论');
V.submitOpening('', '');
ok(V.state() === 'opening', '空立论被拦截');
V.submitOpening('我的开篇陈述：定义、结论、理由、标准', '教育局公开文件');
await settle();
ok(V.state() === 'cross-answer', '立论 → 对方质询到来');

/* ---------- 场景5: 质询轮（定义可被质询） ---------- */
console.log('场景5 质询轮');
V.submitAnswer('短');
ok(V.state() === 'cross-answer', '过短回答被拦截');
V.submitAnswer('因为调动政策对高级职称教师放宽了年龄限制，有公开文件可查');
ok(V.state() === 'cross-ask', '正面回答 → 轮到我质询');
V.submitCrossQuestion(0, 0, '你的「高风险动作」定义排除了什么？');
await settle();
ok(V.state() === 'cross-react', '质询对方定义条目 → 对方回答 → 三选一');
makeEl('rc-acc').onclick();
ok(V.state() === 'free', '接受 → 自由对辩');

/* ---------- 场景6: 自由对辩（承认入报告） ---------- */
console.log('场景6 自由对辩');
V.submitFree('承认', '我承认对方「中考年状态波动」这条是真实风险');
await settle();
ok(V.admitted().length === 1 && V.state() === 'closing', '标「承认」的发言进入对局报告 → 结辩');

/* ---------- 场景7: 结辩（不要求承认对方） ---------- */
console.log('场景7 结辩');
V.submitClosing('', false, '');
ok(V.state() === 'closing', '空结辩被拦截');
V.submitClosing('分歧在权重：职业机会收益 vs 家庭稳定风险；按「不可逆优先」，结论仍是该去。', true, '修正后的表述');
await settle();
ok(V.state() === 'end', '结辩 → 终局');
ok(V.revised() === true, '修正保留前后对照');
ok(makeEl('mask').classList.contains('show'), '对局报告弹出');
ok(makeEl('radar-box').innerHTML.includes('<svg'), '结构画像雷达图渲染');
ok(makeEl('mp-list').innerHTML.includes('完成完整对局'), '段位结算含 MP 明细');

/* ---------- 场景8: 段位结算（无对手承认 / 荣誉授予 / 概念对齐加分） ---------- */
console.log('场景8 段位结算');
V.showEnd();
const total = V.mpLog().reduce((s,x)=>s+x[1],0);
ok(V.mp() === total && V.mp() >= 12, `鸣声值合计 ${V.mp()} ≥ 12`);
ok(!V.mpLog().some(x => /承认|荣誉|授予|被对手|概念对齐/.test(x[0])), 'MP 明细无「对手承认 / 荣誉授予 / 概念对齐」条目');
ok(V.mpLog().every(x => x[1] >= 0), 'MP 明细无负向条目（本场未离席）');
ok(makeEl('tier-steps').innerHTML.includes('启鸣'), '段位进度渲染');

/* ---------- 场景8.5: AI 中立评估 ---------- */
console.log('场景8.5 AI 中立评估');
const ev = V.evaluate();
ok(V.AI_DIMS.length === 6 && ev.dims.length === 6, '评估输出六个维度');
ok(V.AI_DIMS.every(k => k.length === 2), '雷达维度标签均为 2 字（立论/论据/逻辑/回应/表达/规范）');
ok(ev.dims.every(d => d.v >= 0 && d.v <= 100 && d.r && d.r.length > 4), '各维含 0-100 分数与具体评分依据');
ok(ev.total === Math.round(ev.dims.reduce((s,x)=>s+x.v,0)/6), '综合得分 = 六维等权平均');
ok(ev.verdict.includes('五阶段') && ev.verdict.includes('不构成胜负判定'), '总结为五阶段口径且声明不判胜负');
ok(!/winner|rank/.test(JSON.stringify(ev)), '评估输出无 winner / rank 字段');
ok(makeEl('e-ai').innerHTML.includes('AI 中立评估'), '终局卡渲染 AI 总结');
ok(makeEl('radar-box').innerHTML.includes('立论') && makeEl('radar-box').innerHTML.includes('规范'), '雷达图使用六维标签');
ok(makeEl('e-ack').innerHTML.includes('中考年状态波动'), '对局报告含「已被承认的论证」');
ok(V.transcript().length >= 8 && V.transcript().every(x => !/[<>]/.test(x.text)), 'transcript 记录全场发言且已剥离 HTML');
ok(!V.transcript().some(x => 'ack' in x), 'transcript 不再记录「互认」字段');

/* ---------- 场景8.6: 报告关闭与重开 ---------- */
console.log('场景8.6 报告关闭与重开');
V.closeEndcard();
ok(makeEl('mask').classList.contains('show') === false, '✕ 关闭报告弹窗');
ok(makeEl('composer').innerHTML.includes('查看对局报告') && makeEl('composer').innerHTML.includes('再来一局'), '结束态操作区（重开报告 / 再来一局）');
ok(!makeEl('composer').innerHTML.includes('辩论树'), '结束态已无辩论树集成入口');
makeEl('re-open').onclick();
ok(makeEl('mask').classList.contains('show'), '重开报告弹窗');
V.closeEndcard();
makeEl('re-again').onclick();
ok(V.state() === 'idle' && V.mp() === 0 && V.transcript().length === 0, '结束态可直接再来一局（状态清零）');
V.showEnd();             /* 重建终局态，供后续场景使用 */
await settle();
ok(makeEl('mask').classList.contains('show'), 'showEnd 仍可完整重建终局');
ok(makeEl('e-ack').innerHTML.includes('本场未标'), '重置后「已被承认的论证」回到空态说明');

/* ---------- 场景9: 重置 ---------- */
console.log('场景9 重置');
makeEl('mask').classList.remove('show');
V.resetRoom();
ok(V.state() === 'idle' && V.mp() === 0 && V.records() === 0, '重置清空全部对局状态');
ok(V.admitted().length === 0 && V.evasions() === 0, '重置清空承认与回避记录');
ok(V.mySide() === null && makeEl('m-claims').innerHTML.includes('正方'), '重置回到选边态（论点对重新可点）');

/* ---------- 场景10: v0.6 静态守卫（源码不得残留打分撮合 / 对齐 / 树 / 互认构件） ---------- */
console.log('场景10 v0.6 静态守卫');
ok(/CLAIM_PAIR/.test(script) && /renderSidePick/.test(script) && /rankCandidates/.test(script), 'v0.6 选边制撮合已落地（论点对 + 选边 + 排序纯函数）');
ok(!/立场对撞/.test(html), '打分撮合文案已移除（选边制）');
ok(!/winner/.test(script) && !/rank(?!Candidates)/.test(script), '脚本无 winner / rank（撮合排序函数名除外）');
ok(!/CONCEPTS|pickConcept|conceptPicks|conceptTries|conceptAgreed|renderConcept|checkConcept|def-opt|c-concept/.test(script), '脚本无概念对齐残留符号');
ok(!/acknowledg|myTree|BOT_TREE|submitPreTree|ackedIdx|newNodes|crossClaim/.test(script), '脚本无 v0.3 树 / 互认残留符号');
ok(!/争议档案|上树|金点|共享画板|预提交/.test(html), '原型文案已无「争议档案 / 上树 / 金点 / 共享画板 / 预提交」');
ok(!/被对手承认|获对方授予|最强证据|最佳修正/.test(html), '原型已无「对手承认 / 荣誉授予」文案');
ok(!html.includes('btn-settle') && !html.includes('沉淀到辩论树'), '已移除「沉淀到辩论树」出口');
ok(!/id="e-go"/.test(html), '已移除「进入辩论树 →」出口');
ok(!/addToBoard/.test(script) && /addRecord/.test(script), '登记动作统一走 addRecord（无上板语义）');
ok(html.includes('bf-def') && /关键定义/.test(html), '立论结构含可选「关键定义」字段');
ok(V.botBriefItems && true, 'botBriefItems 仍暴露给集成层');

/* ---------- 场景11: HostClient seam 与失败重试 ---------- */
console.log('场景11 HostClient seam 与失败重试');
const calls=[];
let failFirst=true;
const coordinator=V.createHostCoordinator({
  structureHint:async payload=>{
    calls.push(payload);
    if(failFirst){failFirst=false;throw new Error('temporary');}
    return {hint:'补充判断标准'};
  },
});
const requestContext={roomId:'r1',turnId:'t1'};
const failed=await coordinator.invoke('structureHint',requestContext,'尚未提交的立论草稿');
ok(failed.status==='error'&&failed.draft==='尚未提交的立论草稿','失败后保留草稿');
const retried=await coordinator.retry('structureHint',requestContext);
ok(retried.status==='success'&&retried.attempts===2,'失败请求可重试');
ok(calls.length===2&&calls[0].requestId===calls[1].requestId,'重试复用同一 requestId');
ok(calls.every(x=>x.roomId==='r1'&&x.turnId==='t1'),'请求携带 roomId + turnId');
ok(calls.every(x=>x.draft==='尚未提交的立论草稿'),'重试使用原始草稿');
const cached=await coordinator.invoke('structureHint',requestContext,'不应覆盖的草稿');
ok(cached===retried&&calls.length===2,'成功响应幂等复用，不重复调用 Host');
let missingContext=false;
try{await coordinator.invoke('structureHint',{roomId:'r1'},'x');}catch(err){missingContext=/turnId/.test(err.message);}
ok(missingContext,'缺少 turnId 时拒绝发起请求');

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
