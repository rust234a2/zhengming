// debate-tree-prototype.html 关系图谱模块运行时测试（Node DOM 桩）
// 用法: node debate-graph.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'debate-tree-prototype.html'), 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('未找到 <script>'); process.exit(1); }

/* ---------- DOM 桩 ---------- */
const elements = {};
function makeClassList(){
  const set = new Set();
  return {
    add:(...c)=>c.forEach(x=>set.add(x)),
    remove:(...c)=>c.forEach(x=>set.delete(x)),
    toggle:(c,on)=>{ on===undefined ? (set.has(c)?set.delete(c):set.add(c)) : (on?set.add(c):set.delete(c)); },
    contains:c=>set.has(c),
    _set:set,
  };
}
function makeEl(id){
  return elements[id] ??= {
    id, innerHTML:'', textContent:'', className:'', value:'', style:{},
    classList: makeClassList(),
    children: [],
    appendChild(ch){ this.children.push(ch); return ch; },
    remove(){}, 
    addEventListener(){},
    removeEventListener(){},
    setAttribute(){}, getAttribute(){ return null; },
    getBoundingClientRect(){ return { left:0, top:0, width:940, height:660 }; },
  };
}
function makeSvgEl(tag){
  const el = {
    tag, innerHTML:'', children: [],
    classList: makeClassList(),
    appendChild(ch){ this.children.push(ch); return ch; },
    remove(){},
    addEventListener(){},
    setAttribute(){}, getAttribute(){ return null; },
  };
  return el;
}
const documentStub = {
  getElementById: (id) => makeEl(id),
  createElementNS: (_ns, tag) => makeSvgEl(tag),
  addEventListener(){},
  querySelectorAll(){ return []; },
};
const windowStub = { addEventListener(){}, open(){} };

const exports_ = new Function('document', 'window', 'console', 'setInterval', 'clearInterval',
  m[1] + `
  return { tree, selectedId,
    renderTree, selectNode,
    CLUSTERS, TOPICS, GLINKS, GW, GH,
    initGraph, switchView, graphStep, graphDraw, graphRestart,
    selectGraphTopic, gNodes:()=>gNodes, gLinkEls:()=>gLinkEls,
    gSel:()=>gSel, gAlpha:()=>gAlpha, gTimer:()=>gTimer,
    gCenterId:()=>gCenterId, gHops:()=>gHops,
    graphAddNode, graphRemoveNode, graphSetCenter, layoutScale,
    pickCenterByDegree, ringR, EXTRA_TOPICS,
    graphDragPulse, endGraphDrag,
    startDrag:(n)=>{ gDragNode=n; gDragMoved=false; gDragStart={x:0,y:0}; n.fx=n.x; n.fy=n.y; graphDragPulse(); },
    endDrag:()=>endGraphDrag(),
    gDragNode:()=>gDragNode };
`)(documentStub, windowStub, console,
   ()=>1,                       /* setInterval 桩：不真正定时 */
   ()=>{});

const V = exports_;
let pass = 0, fail = 0;
function ok(cond, name, extra){
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.error('  ✗ ' + name + (extra ? ' — ' + JSON.stringify(extra) : '')); }
}

/* ---------- 场景1: 初始加载（树视图不受影响） ---------- */
console.log('场景1 初始加载');
ok(V.tree && typeof V.tree === 'object' && !!V.tree.id, 'tree 数据加载');
ok(typeof V.renderTree === 'function', '脚本无 ReferenceError');
V.renderTree();
ok(makeEl('tree').innerHTML.length > 0, '树渲染成功');

/* ---------- 场景2: 切到图谱，initGraph 构建 ---------- */
console.log('场景2 切换到关系图谱');
V.switchView('graph');
ok(V.gNodes().length === V.TOPICS.length, `节点数 ${V.gNodes().length} = 议题数 ${V.TOPICS.length}`);
ok(V.gLinkEls().length === V.GLINKS.length, `连线数 ${V.gLinkEls().length} = ${V.GLINKS.length}`);
ok(makeEl('g-legend').innerHTML.includes('教育选择'), '图例渲染');
ok(makeEl('graph-panel').style.display === 'block', '图谱面板显示');
ok(makeEl('tree-panel').style.display === 'none', '树面板隐藏');
ok(makeEl('mm-card').style.display === 'none', '树状缩略图在图谱视图隐藏');
ok(makeEl('detail-body').innerHTML.length > 0 || makeEl('detail').innerHTML.length > 0, '右侧详情有内容');

/* ---------- 场景3: 中心辐射布局收敛验证 ---------- */
console.log('场景3 中心辐射布局 600 步');
const N = V.gNodes();
for (let i = 0; i < 600; i++) { V.graphStep(); V.graphDraw(); }
const finite = N.every(n => Number.isFinite(n.x) && Number.isFinite(n.y));
ok(finite, '所有坐标有限');
const inBounds = N.every(n => n.x >= 0 && n.x <= 940 && n.y >= 0 && n.y <= 660);
ok(inBounds, '所有节点在画布内');
ok(V.gAlpha() < 0.05, `alpha 已衰减 (${V.gAlpha().toFixed(4)})`);

/* 中心节点：度数最高者当选，位置恒定在画布中心 */
const center = N.find(n => n.id === V.gCenterId());
ok(!!center, `中心节点已选定（${center && center.t}）`);
ok(Math.abs(center.x - 470) < 1 && Math.abs(center.y - 330) < 1, '中心节点固定在画布中心');

/* 圆身不重叠（去拥挤核心指标） */
let overlapCircle = 0, minPair = Infinity, pairSum = 0, pairCnt = 0;
for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++){
  const dx = N[i].x - N[j].x, dy = N[i].y - N[j].y;
  const d = Math.sqrt(dx*dx + dy*dy);
  if (d < N[i].r + N[j].r) overlapCircle++;
  if (d < minPair) minPair = d;
  pairSum += d; pairCnt++;
}
ok(overlapCircle === 0, `圆身零重叠（重叠对 ${overlapCircle}）`);
ok(minPair > 45, `最小节点间距 ${minPair.toFixed(1)}px > 45px`);
const avgPair = pairSum / pairCnt;
ok(avgPair > 130, `平均节点间距 ${avgPair.toFixed(1)}px > 130px`);
console.log(`    平均间距 ${avgPair.toFixed(1)}px / 最小 ${minPair.toFixed(1)}px`);

/* 径向分层：hop1 环带贴合目标半径，且明显比 hop2 更靠近中心 */
const hops = V.gHops();
const dCenter = n => Math.hypot(n.x - center.x, n.y - center.y);
const h1 = N.filter(n => hops[n.id] === 1), h2 = N.filter(n => hops[n.id] === 2);
ok(h1.length >= 2 && h2.length >= 2, `跳数分层存在（hop1=${h1.length} hop2=${h2.length}）`);
const avg1 = h1.reduce((s,n)=>s+dCenter(n),0)/h1.length;
const avg2 = h2.reduce((s,n)=>s+dCenter(n),0)/h2.length;
ok(avg1 > V.ringR(1) - 70 && avg1 < V.ringR(1) + 70, `hop1 环带贴合目标半径（${avg1.toFixed(0)} ≈ ${V.ringR(1).toFixed(0)}±70）`);
ok(avg2 > avg1 + 60, `hop2 平均距离 ${avg2.toFixed(0)} > hop1 ${avg1.toFixed(0)} + 60（层次清晰）`);
console.log(`    hop1 平均 ${avg1.toFixed(0)}px / hop2 平均 ${avg2.toFixed(0)}px`);

/* ---------- 场景3.5: 中心切换 ---------- */
console.log('场景3.5 切换中心节点');
const oldCenter = V.gCenterId();
V.graphSetCenter('t2');
ok(V.gCenterId() === 't2', 'gCenterId 切换为 t2');
for (let i = 0; i < 600; i++) { V.graphStep(); V.graphDraw(); }
const c2 = V.gNodes().find(n => n.id === 't2');
ok(Math.abs(c2.x - 470) < 1 && Math.abs(c2.y - 330) < 1, '新中心固定在画布中心');
const stillFinite = V.gNodes().every(n => Number.isFinite(n.x) && Number.isFinite(n.y));
ok(stillFinite, '切换后坐标全部有限');

/* ---------- 场景3.6: 动态重布局（节点数量变化） ---------- */
console.log('场景3.6 动态重布局');
const before = V.gNodes().length;
V.graphAddNode(V.EXTRA_TOPICS[0], 't1');   /* +1 节点连到 t1 */
V.graphAddNode(V.EXTRA_TOPICS[1], 't6');   /* +1 节点连到 t6 */
ok(V.gNodes().length === before + 2, `节点 +2（${before} → ${before + 2}）`);
for (let i = 0; i < 600; i++) { V.graphStep(); V.graphDraw(); }
const addFinite = V.gNodes().every(n => Number.isFinite(n.x) && Number.isFinite(n.y))
  && V.gNodes().every(n => n.x >= 0 && n.x <= 940 && n.y >= 0 && n.y <= 660);
ok(addFinite, '新增后全部坐标有限且在画布内');
let addOverlap = 0;
const N2 = V.gNodes();
for (let i = 0; i < N2.length; i++) for (let j = i + 1; j < N2.length; j++){
  const d = Math.hypot(N2[i].x - N2[j].x, N2[i].y - N2[j].y);
  if (d < N2[i].r + N2[j].r) addOverlap++;
}
ok(addOverlap === 0, `增量后仍零重叠（重叠对 ${addOverlap}）`);
const cc = V.gNodes().find(n => n.id === V.gCenterId());
ok(Math.abs(cc.x - 470) < 1 && Math.abs(cc.y - 330) < 1, '增量后中心位置纹丝不动');
const rmId = V.gNodes().find(n => !n.cur && n.id !== V.gCenterId()).id;
V.graphRemoveNode(rmId);
ok(V.gNodes().length === before + 1, `移除 1 节点（${before + 2} → ${before + 1}）`);
for (let i = 0; i < 400; i++) { V.graphStep(); V.graphDraw(); }
const rmFinite = V.gNodes().every(n => Number.isFinite(n.x) && Number.isFinite(n.y));
ok(rmFinite, '删除后重新收敛、坐标有限');
const scaleUp = V.layoutScale();
ok(scaleUp > 0.75 && scaleUp <= 1.6, `布局缩放因子自适应（${scaleUp.toFixed(2)}）`);

/* ---------- 场景3.7: 拖拽交互（对齐 d3 dragstart/drag/dragend 语义） ---------- */
console.log('场景3.7 拖拽交互');
for (let i = 0; i < 600; i++) { V.graphStep(); V.graphDraw(); }   /* 先完全冷却 */
ok(V.gAlpha() < 0.05 && !V.gTimer(), '拖拽前模拟已冷却停表');

const dragN = V.gNodes().find(n => n.id === 't1');
const n0 = { x: dragN.x, y: dragN.y };
/* dragstart：按下钉当前位、加热到 0.3 */
V.startDrag(dragN);
ok(dragN.fx === n0.x && dragN.fy === n0.y, '按下即钉在当前位置（dragstart fx/fy）');
ok(V.gAlpha() >= 0.3 && !!V.gTimer(), '拖拽脉冲：alpha ≥ 0.3 且模拟重启');

/* drag：拖到 (200,150)，邻居应被带动 */
const nbIds = V.gLinkEls().filter(l => l.s === 't1' || l.t === 't1')
  .map(l => l.s === 't1' ? l.t : l.s);
const nbBefore = nbIds.map(id => { const n = V.gNodes().find(x => x.id === id); return { id, x: n.x, y: n.y }; });
for (let i = 0; i < 12; i++) {
  dragN.fx = 200; dragN.fy = 150; dragN.x = 200; dragN.y = 150;
  V.graphStep(); V.graphDraw();
}
let nbMoved = 0;
nbBefore.forEach(b => {
  const n = V.gNodes().find(x => x.id === b.id);
  if (Math.hypot(n.x - b.x, n.y - b.y) > 2) nbMoved++;
});
ok(nbMoved >= Math.min(2, nbIds.length), `邻居被带动（${nbMoved}/${nbIds.length} 位移 > 2px）`);

/* dragend：松手解除固定 —— 旧实现 fx/fy 残留导致节点永久钉死，此为核心修复 */
V.endDrag();
ok(dragN.fx === null && dragN.fy === null, '松手解除 fx/fy 固定（dragend）');
ok(V.gDragNode() === null, '拖拽引用已清空');
for (let i = 0; i < 500; i++) { V.graphStep(); V.graphDraw(); }
ok(Math.hypot(dragN.x - 200, dragN.y - 150) > 60, `松手后节点回弹重新参与布局（距拖拽点 ${Math.hypot(dragN.x - 200, dragN.y - 150).toFixed(0)}px）`);
const dragFinite = V.gNodes().every(n => Number.isFinite(n.x) && Number.isFinite(n.y))
  && V.gNodes().every(n => n.x >= 0 && n.x <= 940 && n.y >= 0 && n.y <= 660);
ok(dragFinite, '拖拽回弹后全部节点仍有限且在画布内');

/* 中心节点拖拽：拖拽中可移动，松手弹回画布中心 */
const cid = V.gCenterId();
const cn = V.gNodes().find(n => n.id === cid);
V.startDrag(cn);
cn.fx = 700; cn.fy = 200; cn.x = 700; cn.y = 200;
V.graphStep(); V.graphDraw();
ok(Math.abs(cn.x - 700) < 1 && Math.abs(cn.y - 200) < 1, '中心节点拖拽中跟随 fx/fy');
V.endDrag();
for (let i = 0; i < 300; i++) { V.graphStep(); V.graphDraw(); }
ok(Math.abs(cn.x - 470) < 1 && Math.abs(cn.y - 330) < 1, '中心节点松手弹回画布中心');

/* 冷却后再脉冲：停表状态可重新点火 */
for (let i = 0; i < 2000; i++) { V.graphStep(); V.graphDraw(); }
ok(!V.gTimer(), '长时间冷却后停表');
V.graphDragPulse();
ok(V.gAlpha() >= 0.3 && !!V.gTimer(), '冷却后 graphDragPulse 重新点火');
V.endDrag();

/* ---------- 场景4: 选中议题 ---------- */
console.log('场景4 选中议题交互');
V.selectGraphTopic('t1');
ok(V.gSel() === 't1', 'gSel = t1');
const detailHtml = (makeEl('detail-body').innerHTML || '') + (makeEl('detail').innerHTML || '');
ok(detailHtml.includes('立场') || detailHtml.includes('支持'), '详情含立场分布');
ok(detailHtml.includes('辩论树'), '详情含进入辩论树入口');
V.graphDraw();
ok(true, 'graphDraw 高亮路径无异常');

/* ---------- 场景5: 切回树视图 ---------- */
console.log('场景5 切回缩进树');
V.switchView('tree');
ok(makeEl('tree-panel').style.display === '', '树面板恢复显示');
ok(makeEl('mm-card').style.display === '', '树状缩略图在树视图恢复');
ok(makeEl('graph-panel').style.display === 'none', '图谱面板隐藏');
ok(V.gTimer() === null, '力导定时器已停止');
V.renderTree();
ok(makeEl('tree').innerHTML.includes('辞职去'), '树正常重建');

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
