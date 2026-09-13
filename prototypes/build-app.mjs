// build-app.mjs — 把辩论树/辩论间/事件推演三个原型组装为单页应用 zhengming-app.html
// 用法: node build-app.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(dir, f), 'utf8');
const tree = read('debate-tree-prototype.html');
const room = read('debate-room-prototype.html');
const replay = read('event-replay-prototype.html');

let fail = 0;
const need = (s, what) => { if (!s.includes(what)) { console.error('✗ 缺少锚点: ' + what); fail++; } };
need(room, '<div class="mask" id="mask"'); need(room, '<div class="toast" id="toast"');
need(room, 'id="match"'); need(room, 'startMatch();');
need(replay, '<div class="mask" id="mask"'); need(replay, '<div class="toast" id="toast"');
need(replay, 'render();'); need(tree, '<div class="vbtns">');
if (fail) process.exit(1);

/* ───── 提取工具 ───── */
const between = (s, a, b) => s.slice(s.indexOf(a) + a.length, s.indexOf(b));
const inner = (s, tag) => (s.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`)) || [])[1] || '';

/* 房间各片段 */
const roomMain = inner(room, 'main');
const matchStart = room.lastIndexOf('<div', room.indexOf('id="match"'));
const roomMatch = room.slice(matchStart, room.indexOf('<div class="mask" id="mask"'));
const roomMask = room.slice(room.indexOf('<div class="mask" id="mask"'), room.indexOf('<div class="toast"'));
const roomToast = room.slice(room.indexOf('<div class="toast"'), room.indexOf('<script>'));
const roomCssLines = inner(room, 'style').split('\n').filter(l => {
  const t = l.trim();
  return !/^(:root|\*|body|header|\.logo|\.crumb|\.spacer|\.btn|main|\.m-hint)/.test(t);
}).join('\n');
let roomJs = between(room, '<script>', '</script>').replace(/\nstartMatch\(\);\s*$/, '\n');

/* 推演各片段 */
const erMain = inner(replay, 'main');
const erMask = replay.slice(replay.indexOf('<div class="mask" id="mask"'), replay.indexOf('<div class="toast"'));
const erToast = replay.slice(replay.indexOf('<div class="toast"'), replay.indexOf('<script>'));
const erCssLines = inner(replay, 'style').split('\n').filter(l => {
  const t = l.trim();
  return !/^(:root|\*|body|header|\.logo|\.crumb|\.spacer|\.btn|main)/.test(t);
}).join('\n');
let erJs = between(replay, '<script>', '</script>').replace(/\nrender\(\);\s*$/, '\n');

/* ───── 改名（防 id/class 冲突）───── */
const roomHtmlFrag = (roomMain + roomMatch + roomMask + roomToast)
  .replaceAll('class="mask" id="mask"', 'class="room-mask" id="room-mask"')
  .replaceAll('id="toast"', 'id="room-toast"')
  .replaceAll('class="legend"', 'class="r-legend"')
  .replaceAll('onclick="location.reload()"', 'onclick="App.resetRoom()"')
  .replaceAll("onclick=\"location.href='debate-tree-prototype.html'\"", 'onclick="App.go(\'tree\')"');
const roomCss = roomCssLines
  .replaceAll('.mask{', '.room-mask{').replaceAll('.mask.show', '.room-mask.show')
  .replaceAll('.legend{', '.r-legend{');
roomJs = roomJs
  .replaceAll("getElementById('mask')", "getElementById('room-mask')")
  .replaceAll("getElementById('toast')", "getElementById('room-toast')")
  .replaceAll("location.href='debate-tree-prototype.html'", "App.go('tree')");

const erHtmlFrag = (erMain + erMask + erToast)
  .replaceAll('class="mask" id="mask"', 'class="er-mask" id="er-mask"')
  .replaceAll('class="toast" id="toast"', 'class="er-toast" id="er-toast"')
  .replaceAll('class="legend"', 'class="er-legend"')
  .replaceAll('class="conseq stage"', 'class="conseq er-stage"')
  .replaceAll('class="stage"', 'class="er-stage"')
  .replaceAll('class="col-c" id="stage-wrap"', 'id="stage-wrap"')
  .replaceAll('onclick="location.reload()"', 'onclick="App.resetReplay()"')
  .replaceAll("onclick=\"location.href='debate-tree-prototype.html'", "onclick=\"App.go('tree')\"");
const erCss = erCssLines
  .replaceAll('.mask{', '.er-mask{').replaceAll('.mask.show', '.er-mask.show')
  .replaceAll('.toast{', '.er-toast{')
  .replaceAll('.legend{', '.er-legend{')
  .replaceAll('.stage{', '.er-stage{')
  .replaceAll('.col-c{', '#stage-wrap{')
  .replaceAll('.col-l{', '#er-panel .col-l{')
  .replaceAll('.col-r{', '#er-panel .col-r{');
erJs = erJs
  .replaceAll("getElementById('mask')", "getElementById('er-mask')")
  .replaceAll("getElementById('toast')", "getElementById('er-toast')")
  .replaceAll('class="stage"', 'class="er-stage"')
  .replaceAll("className='conseq stage'", "className='conseq er-stage'");

/* ───── 模块 IIFE 包装 + 对外钩子 ───── */
const roomScript = `/* ═══════════ 模块：实时辩论间（debate-room） ═══════════ */
;(function(){
${roomJs}
/* —— 集成钩子 —— */
let roomStarted = false;
window.Room = {
  init(){
    if(roomStarted) return;
    roomStarted = true;
    startMatch();
  },
  reset(){ resetRoom(); },
  _debug:{ enterRoom, pickConcept, submitPreTree, submitOpening, submitAnswer,
    submitCrossQuestion, submitFree, submitClosing, acknowledge, showEnd, resetRoom,
    evaluate, CONCEPTS, BOT_TREE, TIERS,
    state:()=>state, mp:()=>mp, newNodes:()=>newNodes, evasions:()=>evasions,
    transcript:()=>transcript }
};
})();`;

const erScript = `/* ═══════════ 模块：事件推演（event-replay） ═══════════ */
;(function(){
${erJs}
/* —— 集成钩子 —— */
let erInited = false;
window.Replay = {
  init(){
    if(erInited) return;
    erInited = true;
    render();
  },
  reset(){
    runs = 1; path = []; cur = 's1';
    document.getElementById('er-mask').classList.remove('show');
    render();
  },
  _debug:{ chooseOpt, goNext, NODES, cur:()=>cur, path:()=>path }
};
})();`;

/* ───── 树壳改造 ───── */
let app = tree;

/* 1) 移除头部旧的事件推演跳转链接
   注意：源原型是 CRLF 换行，正则末尾必须写 \r?\n，只写 \n 会静默失配。 */
app = app.replace(/  <a href="event-replay-prototype\.html"[\s\S]*?<\/a>\r?\n/, '');
if (app.includes('event-replay-prototype.html')) { console.error('✗ 旧事件推演链接未移除'); fail++; }

/* 2) vbtns 扩为四个 Tab */
app = app.replace(/<div class="vbtns">[\s\S]*?<\/div>/, `<div class="vbtns">
    <button id="vb-tree" class="on" onclick="switchView('tree')">辩论树</button>
    <button id="vb-graph" onclick="switchView('graph')">议题图谱</button>
    <button id="vb-room" onclick="switchView('room')">实时辩论间</button>
    <button id="vb-replay" onclick="switchView('replay')">事件推演</button>
  </div>`);
if (!app.includes('vb-replay')) { console.error('✗ vbtns 未替换'); fail++; }

/* 3) switchView 扩为四视图 */
const oldSwitch = app.match(/function switchView\(v\)\{[\s\S]*?\n\}/)[0];
const newSwitch = `function switchView(v){
  document.getElementById('vb-tree').classList.toggle('on',v==='tree');
  document.getElementById('vb-graph').classList.toggle('on',v==='graph');
  document.getElementById('vb-room').classList.toggle('on',v==='room');
  document.getElementById('vb-replay').classList.toggle('on',v==='replay');
  document.getElementById('tree-panel').style.display = v==='tree' ? '' : 'none';
  document.getElementById('graph-panel').style.display = v==='graph' ? 'block' : 'none';
  document.getElementById('room-panel').style.display = v==='room' ? 'flex' : 'none';
  document.getElementById('er-panel').style.display = v==='replay' ? 'flex' : 'none';
  document.getElementById('topic-strip').style.display = v==='tree' ? '' : 'none';
  document.getElementById('mm-card').style.display = v==='tree' ? '' : 'none';
  document.getElementById('detail').style.display = (v==='tree'||v==='graph') ? '' : 'none';
  if(v==='graph'){
    if(!gNodes.length){ initGraph(); }
    else graphRestart(false);
    if(!gSel) renderGraphDetail();
  }
  if(v==='tree'){
    if(gTimer){ clearInterval(gTimer); gTimer=null; }
    renderTree();
    if(selectedId) selectNode(selectedId);
    else document.getElementById('detail-body').innerHTML='<div class="d-empty">在左侧选择一个节点</div>';
  }
  if(v==='room'){ window.Room && window.Room.init(); }
  if(v==='replay'){ window.Replay && window.Replay.init(); }
}`;
app = app.replace(oldSwitch, newSwitch);

/* 4) 模块内跳转 → 视图切换 */
app = app.replaceAll("onclick=\"location.href='debate-room-prototype.html'\"", "onclick=\"switchView('room')\"");
if (app.includes('debate-room-prototype.html')) { console.error('✗ 辩论间 href 未替换干净'); fail++; }

/* 5) 树脚本尾部挂 App 全局 */
app = app.replace(
  "document.getElementById('mask').addEventListener('click',e=>{ if(e.target.id==='mask') closeModal(); });",
  `document.getElementById('mask').addEventListener('click',e=>{ if(e.target.id==='mask') closeModal(); });
/* —— 集成路由 —— */
window.App = {
  go: v => switchView(v),
  resetRoom: () => window.Room && window.Room.reset(),
  resetReplay: () => window.Replay && window.Replay.reset(),
};`);

/* 6) 注入 CSS（树壳样式之后） */
app = app.replace('</style>', `/* ── 集成：辩论间 / 事件推演 面板 ── */
#room-panel{flex:1;display:none;gap:12px;min-width:0;overflow-x:auto}
#er-panel{flex:1;display:none;gap:12px;min-width:0;overflow-x:auto}
:root{--real:#5a6474}
${roomCss}
${erCss}
</style>`);

/* 7) 注入面板 HTML（main 末尾） */
app = app.replace('</main>', `<section id="room-panel" style="display:none">
${roomHtmlFrag}
  </section>
  <section id="er-panel" style="display:none">
${erHtmlFrag}
  </section>
</main>`);

/* 8) 注入模块脚本（树脚本之后） */
app = app.replace('</body>', `<script>
${roomScript}
</script>
<script>
${erScript}
</script>
</body>`);

/* 9) 标题 */
app = app.replace('<title>争鸣 · 辩论树交互原型</title>', '<title>争鸣 · 集成交互原型</title>');

if (fail) { console.error('构建失败'); process.exit(1); }
writeFileSync(join(dir, 'zhengming-app.html'), app);
console.log('✓ 已生成 zhengming-app.html (' + Math.round(app.length/1024) + ' KB)');
