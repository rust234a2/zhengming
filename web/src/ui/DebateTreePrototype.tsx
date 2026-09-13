import { useMemo, useState } from "react";

type BranchKind = "support" | "oppose";

interface DebateNode {
  id: string;
  text: string;
  author: string;
  role: string;
  kind: BranchKind | "root";
  votes: number;
  evidence?: string;
  children: DebateNode[];
}

const INITIAL_TREE: DebateNode = {
  id: "root",
  text: "大学生应该先实习，还是先做科研？",
  author: "知乎问题",
  role: "决策咨询 · 校园 / 职场",
  kind: "root",
  votes: 0,
  children: [
    {
      id: "support-1",
      text: "对大多数想进入技术行业的学生，实习应当优先。",
      author: "林默",
      role: "产品经理 · 3 年经验",
      kind: "support",
      votes: 28,
      evidence: "职业试错成本更低",
      children: [
        {
          id: "support-1-a",
          text: "真实业务能更早暴露兴趣与能力边界。",
          author: "苏禾",
          role: "应届生",
          kind: "support",
          votes: 11,
          children: [],
        },
        {
          id: "oppose-1-a",
          text: "短期实习的岗位内容可能无法代表长期职业方向。",
          author: "周行",
          role: "研究生 · 计算机",
          kind: "oppose",
          votes: 9,
          children: [],
        },
      ],
    },
    {
      id: "oppose-1",
      text: "如果计划读研或走研究路线，科研经历更值得优先。",
      author: "周行",
      role: "研究生 · 计算机",
      kind: "oppose",
      votes: 21,
      evidence: "长期积累不可压缩",
      children: [
        {
          id: "support-2-a",
          text: "科研训练能建立提出问题和验证假设的能力。",
          author: "白昼",
          role: "实验室研究员",
          kind: "support",
          votes: 15,
          children: [],
        },
      ],
    },
  ],
};

function updateNode(tree: DebateNode, id: string, update: (node: DebateNode) => DebateNode): DebateNode {
  if (tree.id === id) {
    return update(tree);
  }
  return { ...tree, children: tree.children.map((child) => updateNode(child, id, update)) };
}

function findNode(tree: DebateNode, id: string): DebateNode | null {
  if (tree.id === id) {
    return tree;
  }
  for (const child of tree.children) {
    const match = findNode(child, id);
    if (match) {
      return match;
    }
  }
  return null;
}

function countNodes(tree: DebateNode): number {
  return 1 + tree.children.reduce((count, child) => count + countNodes(child), 0);
}

function NodeCard({
  node,
  depth,
  selectedId,
  collapsed,
  onSelect,
  onToggle,
}: {
  node: DebateNode;
  depth: number;
  selectedId: string;
  collapsed: Set<string>;
  onSelect(id: string): void;
  onToggle(id: string): void;
}) {
  const isSelected = node.id === selectedId;
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed.has(node.id);
  const branchLabel = node.kind === "support" ? "支持" : node.kind === "oppose" ? "反对" : "议题";

  return (
    <div className={`debate-node-wrap depth-${Math.min(depth, 3)}`}>
      <button
        type="button"
        className={`debate-node ${node.kind} ${isSelected ? "selected" : ""}`}
        onClick={() => onSelect(node.id)}
        aria-pressed={isSelected}
      >
        <span className="debate-node-bar" aria-hidden="true" />
        <span className="debate-node-content">
          <span className="debate-node-topline">
            <span className="debate-node-kind">{branchLabel}</span>
            <span className="debate-node-votes">{node.kind === "root" ? "中心命题" : `${node.votes} 赞同`}</span>
          </span>
          <strong>{node.text}</strong>
          <span className="debate-node-meta">
            {node.author} · {node.role}
          </span>
          {node.evidence ? <span className="debate-node-evidence">{node.evidence}</span> : null}
        </span>
        {hasChildren ? (
          <span
            className="debate-node-toggle"
            role="button"
            tabIndex={0}
            aria-label={isCollapsed ? "展开分支" : "折叠分支"}
            onClick={(event) => {
              event.stopPropagation();
              onToggle(node.id);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                onToggle(node.id);
              }
            }}
          >
            {isCollapsed ? "+" : "−"}
          </span>
        ) : null}
      </button>
      {hasChildren && !isCollapsed ? (
        <div className="debate-children">
          {node.children.map((child) => (
            <NodeCard
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              collapsed={collapsed}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DebateTreePrototype() {
  const [tree, setTree] = useState(INITIAL_TREE);
  const [selectedId, setSelectedId] = useState("root");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [branchKind, setBranchKind] = useState<BranchKind>("support");
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState("决策辩论");
  const [notice, setNotice] = useState("选择一个节点，开始补充你的理由");

  const selectedNode = useMemo(() => findNode(tree, selectedId) || tree, [tree, selectedId]);
  const nodeCount = countNodes(tree);

  function toggleNode(id: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submitBranch() {
    const text = draft.trim();
    if (!text) {
      setNotice("先写下一个具体观点，再加入论证树");
      return;
    }
    const newId = `${branchKind}-${Date.now()}`;
    setTree((current) => updateNode(current, selectedNode.id, (node) => ({
      ...node,
      children: [
        ...node.children,
        {
          id: newId,
          text,
          author: "你",
          role: "刚刚加入",
          kind: branchKind,
          votes: 0,
          children: [],
        },
      ],
    })));
    setSelectedId(newId);
    setDraft("");
    setNotice(branchKind === "support" ? "已加入支持分支" : "已加入反对分支");
  }

  return (
    <main className="debate-app">
      <header className="debate-topbar">
        <div className="debate-brand"><span className="debate-brand-mark">知</span><span>知辩</span></div>
        <nav className="debate-nav" aria-label="主导航">
          <button type="button" className="active">讨论树</button>
          <button type="button">我的讨论</button>
          <button type="button">发现话题</button>
        </nav>
        <div className="debate-top-actions">
          <span className="debate-live-dot"><i /> 12 人在线</span>
          <button type="button" className="debate-ghost-button" aria-label="通知">通知 <span>3</span></button>
          <button type="button" className="debate-avatar" aria-label="个人菜单">L</button>
        </div>
      </header>

      <section className="debate-context">
        <div>
          <div className="debate-breadcrumb">校园成长 <span>/</span> 选择与路径</div>
          <h1>大学生应该先实习，还是先做科研？</h1>
          <p>把“选哪个”拆成可回应的理由。每个人都可以从任意观点继续向下论证。</p>
        </div>
        <div className="debate-context-actions">
          <span className="debate-status-chip"><i /> 实时讨论中</span>
          <button type="button" className="debate-outline-button">分享</button>
          <button type="button" className="debate-primary-button">邀请讨论</button>
        </div>
      </section>

      <div className="debate-layout">
        <aside className="debate-sidebar">
          <div className="debate-sidebar-section">
            <div className="debate-section-label">讨论模式</div>
            <div className="debate-mode-list">
              {["决策辩论", "观点圆桌", "经验路线"].map((item) => (
                <button key={item} type="button" className={mode === item ? "selected" : ""} onClick={() => setMode(item)}>
                  <span className={`debate-mode-dot ${item === "观点圆桌" ? "coral" : item === "经验路线" ? "green" : ""}`} />
                  {item}
                  {item === mode ? <span className="debate-mode-check">✓</span> : null}
                </button>
              ))}
            </div>
          </div>
          <div className="debate-sidebar-section debate-room-stats">
            <div className="debate-section-label">讨论概览</div>
            <div className="debate-stat-row"><span>观点节点</span><strong>{nodeCount}</strong></div>
            <div className="debate-stat-row"><span>已形成分支</span><strong>{tree.children.length}</strong></div>
            <div className="debate-stat-row"><span>待回应</span><strong className="blue">4</strong></div>
          </div>
          <div className="debate-sidebar-section debate-people-section">
            <div className="debate-section-label">正在讨论</div>
            <div className="debate-people">
              <span className="person-avatar blue-avatar">林</span>
              <span className="person-avatar yellow-avatar">周</span>
              <span className="person-avatar dark-avatar">苏</span>
              <span className="person-avatar more-avatar">+9</span>
            </div>
            <p>AI 正在寻找还没有被表达的角度</p>
          </div>
          <div className="debate-sidebar-foot"><span className="ai-spark">✦</span> AI 主持已开启</div>
        </aside>

        <section className="debate-canvas" aria-label="辩论树">
          <div className="debate-canvas-toolbar">
            <span><strong>论证树</strong> <em>按关联关系展开</em></span>
            <div className="debate-toolbar-actions">
              <button type="button" aria-label="缩小">−</button>
              <span>100%</span>
              <button type="button" aria-label="放大">+</button>
              <button type="button" className="fit-button">适应画布</button>
            </div>
          </div>
          <div className="debate-tree-stage">
            <div className="debate-tree-guide guide-one" />
            <div className="debate-tree-guide guide-two" />
            <NodeCard node={tree} depth={0} selectedId={selectedId} collapsed={collapsed} onSelect={setSelectedId} onToggle={toggleNode} />
          </div>
        </section>

        <aside className="debate-inspector">
          <div className="debate-inspector-heading">
            <span className="debate-section-label">节点详情</span>
            <button type="button" aria-label="关闭详情">×</button>
          </div>
          <div className={`debate-inspector-tag ${selectedNode.kind}`}>{selectedNode.kind === "root" ? "中心命题" : selectedNode.kind === "support" ? "支持观点" : "反对观点"}</div>
          <h2>{selectedNode.text}</h2>
          <div className="debate-inspector-author"><span className="inspector-mini-avatar">{selectedNode.author.slice(0, 1)}</span><span><strong>{selectedNode.author}</strong><small>{selectedNode.role}</small></span></div>
          <div className="debate-inspector-divider" />
          <div className="debate-section-label">AI 观察</div>
          <p className="debate-ai-note"><span className="ai-spark">✦</span> 这个观点关注的是<strong>{selectedNode.evidence || "选择背后的个人条件"}</strong>，建议继续追问它成立的前提。</p>
          <div className="debate-suggested-question"><span>下一步可以问</span><p>在什么条件下，这个观点不成立？</p><button type="button" onClick={() => setDraft("在什么条件下，这个观点不成立？")}>引用问题 <span>↗</span></button></div>
          <div className="debate-inspector-divider" />
          <div className="debate-section-label">添加你的观点</div>
          <div className="debate-branch-toggle" role="group" aria-label="选择观点方向">
            <button type="button" className={branchKind === "support" ? "selected support" : ""} onClick={() => setBranchKind("support")}><i /> 支持</button>
            <button type="button" className={branchKind === "oppose" ? "selected oppose" : ""} onClick={() => setBranchKind("oppose")}><i /> 反对</button>
          </div>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="写下一个具体理由……" rows={4} />
          <button type="button" className="debate-submit-button" onClick={submitBranch}>加入论证树 <span>→</span></button>
          <p className="debate-form-notice">{notice}</p>
        </aside>
      </div>
    </main>
  );
}
