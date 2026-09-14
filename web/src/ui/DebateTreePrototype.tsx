import { useMemo, useState } from "react";

type Stance = "pro" | "con" | "neu";
type NodeType = "root" | "claim" | "question";

interface DebateNode {
  id: string;
  type: NodeType;
  stance: Stance | "root";
  text: string;
  author: string;
  votes: { up: number; down: number } | null;
  evidence?: string;
  agentHint?: string;
  answered?: boolean;
  source?: { url: string; quote: string };
  children: DebateNode[];
}

const INITIAL_TREE: DebateNode = {
  id: "root",
  type: "root",
  stance: "root",
  text: "43 岁县中物理老师考上苏州头部公办校（正式编制），该不该辞职去？",
  author: "建局助手",
  votes: { up: 41, down: 18 },
  children: [
    {
      id: "p1",
      type: "claim",
      stance: "pro",
      text: "苏州编制含金量远高于县中，职业天花板和资源都不是一个量级",
      author: "物理组张老师",
      votes: { up: 18, down: 6 },
      evidence: "苏州头部校的教研经费、实验设备与竞赛通道，县中通常不具备",
      children: [
        { id: "p1q", type: "question", stance: "pro", text: "苏州头部校高手云集，你的排位可能从县中前列变成中游，“天花板更高”还成立吗？", author: "Agent 建议追问", votes: null, answered: false, children: [] },
      ],
    },
    {
      id: "p2",
      type: "claim",
      stance: "pro",
      text: "43 岁是最后的窗口期：再不走，这辈子就定型在县中了",
      author: "过客",
      votes: { up: 14, down: 9 },
      evidence: "40 岁以上跨市调动成功比例下降，但高层次人才引进通道仍存在",
      agentHint: "“最后窗口期”是一个断言。43 岁之后真的没有调动可能，还是概率变低？这是可以追问的点。",
      source: { url: "https://www.zhihu.com/question/2038884733304697602", quote: "多地人才引进政策对高级职称教师放宽年龄限制。" },
      children: [],
    },
    {
      id: "p3",
      type: "claim",
      stance: "con",
      text: "孩子中考在即，搬家是高风险动作，家庭稳定优先于个人发展",
      author: "两个孩子的妈",
      votes: { up: 16, down: 8 },
      children: [
        { id: "p3q", type: "question", stance: "con", text: "“高风险”具体指升学路径断裂、心理适应，还是无人照护？不同损失需要不同解法。", author: "Agent 建议追问", votes: null, answered: false, children: [] },
        { id: "p3a", type: "claim", stance: "con", text: "苏州头部校竞争烈度高，43 岁转入可能被安排非核心岗位", author: "隔壁老王", votes: { up: 9, down: 5 }, agentHint: "“非核心岗位”是假设还是事实？学校的年龄结构与岗位分配有数据吗？这是可以追问的点。", children: [] },
      ],
    },
    { id: "p4", type: "claim", stance: "con", text: "县城生活成本低、房价已消化，去苏州背房贷等于把余生押给一套房", author: "财务自由观察", votes: { up: 10, down: 7 }, evidence: "按苏州头部校周边房价估算，月供约占家庭收入 45%", children: [] },
    { id: "p5", type: "claim", stance: "neu", text: "关键变量是编制性质、住房支持与岗位安排，谈妥了再去", author: "理性人", votes: { up: 13, down: 2 }, children: [] },
  ],
};

const STANCE_LABEL: Record<Stance, string> = { pro: "支持", con: "反对", neu: "看条件" };
const EXPANDED_KEY = "zhengming.debateTree.expanded";

function findNode(node: DebateNode, id: string): DebateNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function findPath(node: DebateNode, id: string, path: string[] = []): string[] | null {
  const next = [...path, node.id];
  if (node.id === id) return next;
  for (const child of node.children) {
    const found = findPath(child, id, next);
    if (found) return found;
  }
  return null;
}

function updateNode(node: DebateNode, id: string, update: (target: DebateNode) => DebateNode): DebateNode {
  if (node.id === id) return update(node);
  return { ...node, children: node.children.map((child) => updateNode(child, id, update)) };
}

function walkTree(node: DebateNode, callback: (target: DebateNode) => void) {
  callback(node);
  node.children.forEach((child) => walkTree(child, callback));
}

function initialExpanded(): Set<string> {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(EXPANDED_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function stanceClass(node: DebateNode) {
  return node.type === "question" ? "question" : node.stance;
}

function NodeRow({ node, expanded, selectedId, onSelect, onVote, onQuickAdd }: {
  node: DebateNode;
  expanded: Set<string>;
  selectedId: string | null;
  onSelect(id: string): void;
  onVote(id: string, direction: 1 | -1): void;
  onQuickAdd(id: string, stance: Stance): void;
}) {
  const isOpen = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const label = node.type === "root" ? "议题" : node.type === "question" ? "追问" : STANCE_LABEL[node.stance as Stance];
  return (
    <div className={`dt-row ${node.type === "root" ? "root-row" : ""}`}>
      <article
        className={`dt-node ${node.type === "root" ? "root" : ""} ${stanceClass(node)} ${selectedId === node.id ? "selected" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => onSelect(node.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(node.id);
          }
        }}
        aria-label={`${label}：${node.text}`}
      >
        <div className="dt-quick-actions" aria-label="快速添加">
          <button type="button" onClick={(event) => { event.stopPropagation(); onQuickAdd(node.id, "pro"); }}>+ 支持</button>
          <button type="button" onClick={(event) => { event.stopPropagation(); onQuickAdd(node.id, "con"); }}>+ 反对</button>
          {node.type === "root" ? <button type="button" onClick={(event) => { event.stopPropagation(); onQuickAdd(node.id, "neu"); }}>+ 看条件</button> : null}
        </div>
        <div className="dt-node-header">
          <span className={`dt-tag ${stanceClass(node)}`}>{label}</span>
          {node.type === "root" ? <span className="dt-root-tag">根主张</span> : null}
          {hasChildren ? <span className="dt-fold">{isOpen ? "收起" : `展开 ${node.children.length} 条回应`} <b>{isOpen ? "▲" : "▼"}</b></span> : null}
        </div>
        <strong className="dt-node-text">{node.text}</strong>
        {node.evidence ? <span className="dt-evidence"><b>依据</b>{node.evidence}</span> : null}
        <div className="dt-node-meta">
          <span>{node.author}</span>
          {node.votes ? <span className="dt-votes" aria-label="投票"><button type="button" aria-label={`赞同 ${node.text}`} onClick={(event) => { event.stopPropagation(); onVote(node.id, 1); }}>▲</button><b>{node.votes.up - node.votes.down}</b><button type="button" aria-label={`反对 ${node.text}`} onClick={(event) => { event.stopPropagation(); onVote(node.id, -1); }}>▼</button></span> : null}
          {node.type === "question" && node.answered === false ? <span className="dt-awaiting">待回应</span> : null}
          {node.source ? <a href={node.source.url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>源自知乎回答</a> : null}
        </div>
      </article>
      {hasChildren && isOpen ? <div className="dt-branch">{node.children.map((child) => <NodeRow key={child.id} node={child} expanded={expanded} selectedId={selectedId} onSelect={onSelect} onVote={onVote} onQuickAdd={onQuickAdd} />)}</div> : null}
    </div>
  );
}

function MiniMap({ tree, expanded, selectedId }: { tree: DebateNode; expanded: Set<string>; selectedId: string | null }) {
  const visible: { node: DebateNode; depth: number }[] = [];
  function collect(node: DebateNode, depth: number) {
    visible.push({ node, depth });
    if (expanded.has(node.id)) node.children.forEach((child) => collect(child, depth + 1));
  }
  collect(tree, 0);
  const width = 250;
  const rowHeight = 22;
  const height = Math.max(38, visible.length * rowHeight + 8);
  return <svg className="dt-minimap-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="树状缩略图">{visible.map(({ node, depth }, index) => {
    const y = index * rowHeight + 5;
    const x = depth * 22 + 4;
    const color = node.type === "root" || node.stance === "pro" ? "#056de8" : node.stance === "con" ? "#121212" : "#a9aebc";
    return <rect key={node.id} x={x} y={y} width={Math.max(52, 168 - depth * 12)} height={14} rx={3} fill={node.id === selectedId ? color : "none"} stroke={color} strokeWidth={node.id === selectedId ? 2 : 1.2} strokeDasharray={node.type === "question" ? "3 2" : undefined} />;
  })}</svg>;
}

export function DebateTreePrototype() {
  const [tree, setTree] = useState(INITIAL_TREE);
  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ parentId: string; stance: Stance } | null>(null);
  const [draft, setDraft] = useState("");
  const [evidence, setEvidence] = useState("");
  const [notice, setNotice] = useState("");
  const selectedNode = useMemo(() => selectedId ? findNode(tree, selectedId) : null, [tree, selectedId]);
  const stats = useMemo(() => {
    const counts = { pro: 0, con: 0, neu: 0, question: 0 };
    walkTree(tree, (node) => {
      if (node.type === "question") counts.question += 1;
      else if (node.stance !== "root") counts[node.stance] += 1;
    });
    const total = counts.pro + counts.con + counts.neu || 1;
    return { counts, total, imbalanced: Math.max(counts.pro, counts.con, counts.neu) / total > 0.7 };
  }, [tree]);

  function persistExpanded(next: Set<string>) {
    setExpanded(next);
    window.localStorage.setItem(EXPANDED_KEY, JSON.stringify([...next]));
  }

  function selectNode(id: string) {
    const path = findPath(tree, id) ?? [];
    const next = new Set(expanded);
    path.forEach((item) => next.add(item));
    if (expanded.has(id)) next.delete(id);
    persistExpanded(next);
    setSelectedId(id);
  }

  function vote(id: string, direction: 1 | -1) {
    setTree((current) => updateNode(current, id, (node) => node.votes ? { ...node, votes: direction === 1 ? { ...node.votes, up: node.votes.up + 1 } : { ...node.votes, down: node.votes.down + 1 } } : node));
  }

  function openAdd(parentId: string, stance: Stance) {
    const parent = findNode(tree, parentId);
    setModal({ parentId, stance: parent?.type === "question" ? parent.stance as Stance : stance });
    setDraft("");
    setEvidence("");
    setNotice("");
  }

  function submitNode() {
    if (!modal || draft.trim().length < 4) {
      setNotice("请具体回应父节点，至少写 4 个字。");
      return;
    }
    const id = `node-${Date.now()}`;
    const node: DebateNode = { id, type: "claim", stance: modal.stance, text: draft.trim(), author: "我", votes: { up: 1, down: 0 }, evidence: evidence.trim() || undefined, children: [] };
    setTree((current) => updateNode(current, modal.parentId, (parent) => ({ ...parent, children: [...parent.children, node] })));
    const next = new Set(expanded);
    next.add(modal.parentId);
    persistExpanded(next);
    setSelectedId(id);
    setModal(null);
  }

  function addAgentQuestion(node: DebateNode) {
    if (!node.agentHint) return;
    const id = `question-${Date.now()}`;
    const question: DebateNode = { id, type: "question", stance: node.stance === "root" ? "neu" : node.stance, text: node.agentHint.replace("这是可以追问的点。", "请回应这一点。"), author: "我（采纳 Agent 建议）", votes: null, answered: false, children: [] };
    setTree((current) => updateNode(current, node.id, (target) => ({ ...target, agentHint: undefined, children: [...target.children, question] })));
    const next = new Set(expanded);
    next.add(node.id);
    persistExpanded(next);
    setSelectedId(id);
  }

  return (
    <main className="debate-app">
      <header className="dt-topbar"><span className="dt-logo">争鸣</span><span className="dt-crumb">辩论树 · <b>县中教师辞职局</b></span><span className="dt-spacer" /><button type="button" className="dt-button ghost">邀请加入</button><button type="button" className="dt-button primary" onClick={() => persistExpanded(new Set())}>收起全树</button></header>
      <section className="dt-topic">
        <span className="dt-topic-tag">知乎议题溯源</span><h1>{tree.text}</h1><p>建局于知乎真实问题 · 参与者 7 人 · 由回答摘要自动归纳生成</p>
        <div className="dt-balance" aria-label="立场分布"><div className="dt-balance-bar"><i className="pro" style={{ width: `${stats.counts.pro / stats.total * 100}%` }} /><i className="neu" style={{ width: `${stats.counts.neu / stats.total * 100}%` }} /><i className="con" style={{ width: `${stats.counts.con / stats.total * 100}%` }} /></div><div className="dt-legend"><span><i className="pro" />支持 <b>{stats.counts.pro}</b></span><span><i className="neu" />看条件 <b>{stats.counts.neu}</b></span><span><i className="con" />反对 <b>{stats.counts.con}</b></span><span>追问 <b>{stats.counts.question}</b></span>{stats.imbalanced ? <span className="warning">最大簇占比过高，建议补充反方立场</span> : null}</div></div>
      </section>
      <div className="dt-layout">
        <section className="dt-tree-panel" aria-label="辩论树"><div className="dt-panel-title">点击节点展开下一级 · 每一级都可添加支持 / 反对</div><NodeRow node={tree} expanded={expanded} selectedId={selectedId} onSelect={selectNode} onVote={vote} onQuickAdd={openAdd} /></section>
        <aside className="dt-detail">
          <section className="dt-detail-section dt-minimap"><div className="dt-panel-title">树状缩略图</div><MiniMap tree={tree} expanded={expanded} selectedId={selectedId} /><div className="dt-minimap-legend"><span>蓝 · 支持</span><span>黑 · 反对</span><span>灰 · 看条件</span><span>虚线 · 追问</span></div></section>
          <section className="dt-detail-section"><div className="dt-panel-title">节点详情</div>{!selectedNode ? <p className="dt-empty">在左侧选择一个节点</p> : <><div className="dt-detail-type"><span className={`dt-tag ${stanceClass(selectedNode)}`}>{selectedNode.type === "root" ? "议题" : selectedNode.type === "question" ? "追问" : STANCE_LABEL[selectedNode.stance as Stance]}</span></div><h2>{selectedNode.text}</h2>{selectedNode.evidence ? <p className="dt-detail-evidence"><b>依据：</b>{selectedNode.evidence}</p> : null}<p className="dt-detail-author">{selectedNode.author}</p>{selectedNode.agentHint ? <div className="dt-agent-card"><b>Agent 追问建议</b><p>{selectedNode.agentHint}</p><button type="button" className="dt-button primary" onClick={() => addAgentQuestion(selectedNode)}>以此追问</button></div> : null}{selectedNode.source ? <p className="dt-source">知乎回答摘要：“{selectedNode.source.quote}”<br /><a href={selectedNode.source.url} target="_blank" rel="noreferrer">查看原文</a></p> : null}<div className="dt-detail-actions"><button type="button" className="dt-button primary" onClick={() => openAdd(selectedNode.id, "pro")}>添加支持论点</button><button type="button" className="dt-button ghost" onClick={() => openAdd(selectedNode.id, "con")}>添加反对论点</button></div></>}</section>
        </aside>
      </div>
      {modal ? <div className="dt-modal-mask" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}><section className="dt-modal" role="dialog" aria-modal="true" aria-labelledby="dt-modal-title"><h2 id="dt-modal-title">添加子论点</h2><p>回应：{findNode(tree, modal.parentId)?.text}</p><div className="dt-stance-picker" role="group" aria-label="选择立场">{(["pro", "con", "neu"] as Stance[]).map((stance) => <button key={stance} type="button" className={modal.stance === stance ? "selected" : ""} onClick={() => setModal({ ...modal, stance })}>{STANCE_LABEL[stance]}</button>)}</div><textarea aria-label="论点内容" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="一句话说明你的论点。为什么成立？" /><textarea aria-label="论点依据" className="evidence" value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="依据（可选）：数据、来源或亲身经历" /><p className="dt-modal-hint">必须回应父节点的具体内容；纯表态不会通过。</p>{notice ? <p className="dt-modal-error" role="alert">{notice}</p> : null}<div className="dt-modal-actions"><button type="button" className="dt-button ghost" onClick={() => setModal(null)}>取消</button><button type="button" className="dt-button primary" onClick={submitNode}>发布到树上</button></div></section></div> : null}
    </main>
  );
}
