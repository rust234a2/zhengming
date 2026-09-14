import { useEffect, useMemo, useRef, useState } from "react";

import {
  DEBATE_TREE_SEEDS,
  DEFAULT_TREE_SEED_ID,
  TREE_SEED_STATS,
  findTreeSeed,
} from "../data/debateTreeSeed";
import type { DebateTreeSeed, DebateTreeNode, Stance } from "../types/debateTree";

import { ControversyMap } from "./ControversyMap";
import {
  STANCE_LABEL,
  applyVote,
  buildTreeFromSeed,
  findNode,
  findPath,
  groupSeeds,
  maxShareText,
  rootNodeId,
  seedBadges,
  seedMatchesQuery,
  shortText,
  sourceVoteText,
  stanceOf,
  treeStats,
  updateNode,
} from "./debateTreeUi";
import { readExpanded, rememberSeed, resolveInitialSeed, writeExpanded, writeSeedToUrl } from "./debateTreeStorage";

type ViewMode = "tree" | "graph";

/** 追问必须指向具体内容——低于这个字数基本是纯表态（PRD §6 反模式） */
const MIN_QUESTION_CHARS = 6;

function scrollCardIntoView(id: string): void {
  const el = document.getElementById(`dt-card-${id}`);
  if (el && typeof el.scrollIntoView === "function") {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

/* ═══════════════ 议题库 ═══════════════ */

function TopicLibrary({ seeds, currentId, onPick, onClose }: {
  seeds: readonly DebateTreeSeed[];
  currentId: string;
  onPick(id: string): void;
  onClose(): void;
}) {
  const [query, setQuery] = useState("");
  const groups = useMemo(
    () => groupSeeds(seeds.filter((seed) => seedMatchesQuery(seed, query))),
    [seeds, query],
  );
  const matched = groups.reduce((sum, group) => sum + group.items.length, 0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="dt-library-mask"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="dt-library" role="dialog" aria-modal="true" aria-labelledby="dt-library-title">
        <header className="dt-library-head">
          <div>
            <h2 id="dt-library-title">议题库</h2>
            <p>
              全部 <b>{seeds.length}</b> 个议题都来自真实知乎问题；当前匹配 <b>{matched}</b> 个。

              <span className="dt-library-src">来源：知乎立场抽取管线 · 真实回答采集 · 题干门禁</span>
            </p>
          </div>
          <button type="button" className="dt-button ghost" onClick={onClose}>关闭</button>
        </header>
        <input
          className="dt-library-search"
          type="search"
          value={query}
          autoFocus
          aria-label="搜索议题"
          placeholder="搜题干、答主或理由类型"
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="dt-library-list">
          {groups.map((group) => (
            <section key={group.tier} className="dt-library-group">
              <h3>
                {group.label} <b>{group.items.length}</b>
              </h3>
              <p className="dt-library-hint">{group.hint}</p>
              {group.items.map((seed) => (
                <button
                  key={seed.id}
                  type="button"
                  className={`dt-library-item ${seed.id === currentId ? "on" : ""}`}
                  aria-current={seed.id === currentId ? "true" : undefined}
                  onClick={() => onPick(seed.id)}
                >
                  <strong>{seed.title}</strong>
                  <span className="dt-badges">
                    {seedBadges(seed).map((badge) => (
                      <i key={badge.label} className={`dt-badge ${badge.tone}`}>{badge.label}</i>
                    ))}
                  </span>
                </button>
              ))}
            </section>
          ))}
          {matched === 0 ? <p className="dt-empty">没有匹配的议题</p> : null}
        </div>
      </section>
    </div>
  );
}

/* ═══════════════ 节点 ═══════════════ */

function NodeRow({ node, expanded, selectedId, onSelect, onToggle, onVote, onQuickAdd }: {
  node: DebateTreeNode;
  expanded: Set<string>;
  selectedId: string | null;
  onSelect(id: string): void;
  onToggle(id: string): void;
  onVote(id: string, direction: "up" | "down"): void;
  onQuickAdd(id: string, stance: Stance): void;
}) {
  const isOpen = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const stance = stanceOf(node);
  const label = node.type === "root" ? "议题" : node.type === "question" ? "追问" : STANCE_LABEL[stance as Stance];
  const voteTotal = node.votes ? node.votes.up - node.votes.down : 0;
  const originVote = sourceVoteText(node);
  /** 节点与标签共用的立场类名；统一用领域层的 neutral，不再有 neu 这一套写法 */
  const stanceClass = node.type === "question" ? "question" : node.type === "root" ? "root" : stance;

  return (
    <div className={`dt-row ${node.type === "root" ? "root-row" : ""}`}>
      <article
        id={`dt-card-${node.id}`}
        className={`dt-node ${node.type === "root" ? "root" : stanceClass} ${selectedId === node.id ? "selected" : ""}`}
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
          <button type="button" onClick={(event) => { event.stopPropagation(); onQuickAdd(node.id, "pro"); }}>＋支持</button>
          <button type="button" onClick={(event) => { event.stopPropagation(); onQuickAdd(node.id, "con"); }}>＋反对</button>
          {node.type === "root" ? <button type="button" onClick={(event) => { event.stopPropagation(); onQuickAdd(node.id, "neutral"); }}>＋看条件</button> : null}
        </div>
        <div className="dt-node-header">
          <span className={`dt-tag ${stanceClass}`}>{label}</span>
          {node.type === "root" ? <span className="dt-root-tag">根主张</span> : null}
          {hasChildren ? (
            <button
              type="button"
              className="dt-fold"
              aria-label={isOpen ? `收起 ${node.text}` : `展开 ${node.children.length} 条回应：${node.text}`}
              onClick={(event) => { event.stopPropagation(); onToggle(node.id); }}
            >
              {isOpen ? "收起" : `展开 ${node.children.length} 条回应`} {isOpen ? "▲" : "▼"}
            </button>
          ) : null}
        </div>
        <strong className="dt-node-text">{node.text}</strong>
        {node.source?.quote ? <span className="dt-evidence"><b>原文节选</b>{node.source.quote}</span> : null}
        {node.evidence ? <span className="dt-evidence"><b>依据</b>{node.evidence}</span> : null}
        <div className="dt-node-meta">
          {node.author ? <span className="dt-author">{node.author}</span> : null}
          {node.authorBadge ? <span className="dt-badge-chip">{node.authorBadge}</span> : null}
          {node.votes ? (
            <span className="dt-votes" aria-label="争鸣平台投票">
              <button
                type="button"
                className={node.viewerVote === "up" ? "on" : ""}
                aria-label={`赞同 ${node.text}`}
                aria-pressed={node.viewerVote === "up"}
                onClick={(event) => { event.stopPropagation(); onVote(node.id, "up"); }}
              >▲</button>
              <b>{voteTotal}</b>
              <button
                type="button"
                className={node.viewerVote === "down" ? "on" : ""}
                aria-label={`反对 ${node.text}`}
                aria-pressed={node.viewerVote === "down"}
                onClick={(event) => { event.stopPropagation(); onVote(node.id, "down"); }}
              >▼</button>
            </span>
          ) : null}
          {originVote ? <span className="dt-src-votes" title="知乎赞同数（来源热度），与平台投票无关">{originVote}</span> : null}
          {node.type === "question" && node.answered === false ? <span className="dt-awaiting">待回应</span> : null}
          {node.source?.url ? (
            <a href={node.source.url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
              {node.type === "root" ? "知乎原问题" : "源自知乎回答"}
            </a>
          ) : null}
        </div>
      </article>
      {hasChildren && isOpen ? (
        <div className="dt-branch">
          {node.children.map((child) => (
            <NodeRow
              key={child.id}
              node={child}
              expanded={expanded}
              selectedId={selectedId}
              onSelect={onSelect}
              onToggle={onToggle}
              onVote={onVote}
              onQuickAdd={onQuickAdd}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MiniMap({ tree, expanded, selectedId }: { tree: DebateTreeNode; expanded: Set<string>; selectedId: string | null }) {
  const W = 52;
  const H = 20;
  const GX = 14;
  const GY = 30;
  const pos = new Map<string, { x: number; y: number }>();
  let leaf = 0;
  let maxDepth = 0;

  function place(node: DebateTreeNode, depth: number): void {
    maxDepth = Math.max(maxDepth, depth);
    const kids = expanded.has(node.id) ? node.children : [];
    if (!kids.length) {
      pos.set(node.id, { x: leaf * (W + GX) + W / 2, y: depth });
      leaf += 1;
    } else {
      kids.forEach((k) => place(k, depth + 1));
      const xs = kids.map((k) => pos.get(k.id)!.x);
      pos.set(node.id, { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: depth });
    }
  }
  place(tree, 0);

  const visible: DebateTreeNode[] = [];
  (function collect(node: DebateTreeNode) {
    visible.push(node);
    if (expanded.has(node.id)) node.children.forEach(collect);
  })(tree);

  const width = Math.max(leaf * (W + GX) - GX, W);
  const height = (maxDepth + 1) * (H + GY) - GY;
  const py = (d: number): number => d * (H + GY);
  const colorOf = (node: DebateTreeNode): string => {
    if (node.type === "root" || node.type === "question") return "#056DE8";
    return node.stance === "pro" ? "#056DE8" : node.stance === "con" ? "#121212" : "#a9aebc";
  };

  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
  (function walk(node: DebateTreeNode) {
    if (!expanded.has(node.id)) return;
    for (const child of node.children) {
      const p = pos.get(node.id)!;
      const c = pos.get(child.id)!;
      edges.push({ x1: p.x, y1: p.y, x2: c.x, y2: c.y });
      walk(child);
    }
  })(tree);

  return (
    <svg className="dt-minimap-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="树状缩略图">
      {edges.map((e, i) => (
        <line key={i} x1={e.x1} y1={py(e.y1) + H} x2={e.x2} y2={py(e.y2)} stroke="#d5dae4" strokeWidth={1} />
      ))}
      {visible.map((node) => {
        const p = pos.get(node.id)!;
        const color = colorOf(node);
        const selected = node.id === selectedId;
        return (
          <rect
            key={node.id}
            x={p.x - W / 2}
            y={py(p.y)}
            width={W}
            height={H}
            rx={4}
            fill={selected ? color : "none"}
            stroke={color}
            strokeWidth={selected ? 2 : 1.5}
            strokeDasharray={node.type === "question" ? "3 2" : undefined}
          />
        );
      })}
    </svg>
  );
}

/** 根节点详情里的真实语料：立场聚类分布 + 未标注立场的真实回答 */
function RootEvidence({ seed }: { seed: DebateTreeSeed }) {
  const maxCount = Math.max(1, ...seed.clusters.map((cluster) => cluster.count));
  return (
    <>
      {seed.clusterMeta ? (
        <div className="dt-clusters">
          <div className="dt-panel-title">知乎回答的立场分布</div>
          <p className="dt-clusters-note">
            语料对 <b>{seed.clusterMeta.total}</b> 条回答做了立场聚类，其中 <b>{seed.clusterMeta.valid}</b> 条有明确立场，
            最大簇「{seed.clusterMeta.topCluster}」占 {seed.clusterMeta.ratio}%。
          </p>
          {seed.clusters.map((cluster) => (
            <div key={cluster.label} className="dt-cluster-row">
              <span>{cluster.label}</span>
              <i style={{ width: `${(cluster.count / maxCount) * 100}%` }} />
              <b>{cluster.count}</b>
            </div>
          ))}
        </div>
      ) : null}
      {seed.answerSamples.length ? (
        <div className="dt-answers">
          <div className="dt-panel-title">真实回答 <b>{seed.answerSamples.length}</b> 条</div>
          <p className="dt-answers-note">立场未经标注，未作为一级论点——它们是真实回答的并列展示。</p>
          <ul>
            {seed.answerSamples.map((sample) => (
              <li key={sample.url}>
                <a href={sample.url} target="_blank" rel="noreferrer">{shortText(sample.summary, 64)}</a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

/* ═══════════════ 工作区（每个议题一份状态，切换议题靠 key 重挂载） ═══════════════ */

function TreeWorkspace({ seed, onPickSeed }: { seed: DebateTreeSeed; onPickSeed(id: string): void }) {
  const [tree, setTree] = useState<DebateTreeNode>(() => buildTreeFromSeed(seed));
  const [expanded, setExpanded] = useState<Set<string>>(() => readExpanded(seed.id));
  const [selectedId, setSelectedId] = useState<string | null>(() => rootNodeId(seed.id));
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [modal, setModal] = useState<{ parentId: string; stance: Stance; kind: "claim" | "question" } | null>(null);
  const [draft, setDraft] = useState("");
  const [evidence, setEvidence] = useState("");
  const [view, setView] = useState<ViewMode>("tree");
  const draftRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedNode = useMemo(() => (selectedId ? findNode(tree, selectedId) : null), [tree, selectedId]);
  const stats = useMemo(() => treeStats(tree), [tree]);
  const modalParent = modal ? findNode(tree, modal.parentId) : null;

  /** PRD F6：冲突 = **同一父节点下**立场相反且内容相关的 claim。不是「全树随便取相反的」。 */
  const conflicts = useMemo(() => {
    if (!selectedNode || selectedNode.type !== "claim") return [];
    const stance = stanceOf(selectedNode);
    if (stance !== "pro" && stance !== "con") return [];
    const path = findPath(tree, selectedNode.id);
    const parentId = path && path.length >= 2 ? path[path.length - 2] : null;
    const parent = parentId ? findNode(tree, parentId) : null;
    if (!parent) return [];
    return parent.children.filter(
      (child) => child.id !== selectedNode.id && child.type === "claim" && (stanceOf(child) === "pro" || stanceOf(child) === "con") && stanceOf(child) !== stance,
    );
  }, [selectedNode, tree]);

  function persistExpanded(next: Set<string>) {
    setExpanded(next);
    writeExpanded(seed.id, next);
  }

  /** 与原型一致：点击节点 = 选中并展开它的下一级（含祖先路径），不收起 */
  function selectNode(id: string) {
    const path = findPath(tree, id) ?? [];
    const next = new Set(expanded);
    path.forEach((item) => next.add(item));
    persistExpanded(next);
    setSelectedId(id);
  }

  function toggleNode(id: string) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    persistExpanded(next);
  }

  function vote(id: string, direction: "up" | "down") {
    setTree((current) => updateNode(current, id, (node) => applyVote(node, direction)));
  }

  function openAdd(parentId: string, stance: Stance) {
    const parent = findNode(tree, parentId);
    setModal({ parentId, stance: parent?.type === "question" ? (parent.stance as Stance) : stance, kind: "claim" });
    setDraft("");
    setEvidence("");
  }

  /** 用户自己的追问。**不再**在本地编一句「Agent 建议」回写 agentHint——那是伪造 Agent 输出。 */
  function openQuestion(parentId: string) {
    const parent = findNode(tree, parentId);
    if (!parent) return;
    setModal({ parentId, stance: parent.type === "root" ? "neutral" : (parent.stance as Stance), kind: "question" });
    setDraft("");
    setEvidence("");
  }

  function submitModal() {
    if (!modal) return;
    const text = draft.trim();
    if (!text || (modal.kind === "question" && text.length < MIN_QUESTION_CHARS)) {
      draftRef.current?.focus();
      return;
    }

    const parentId = modal.parentId;
    const id = `${seed.id}:local-${modal.kind}-${Date.now()}`;
    const node: DebateTreeNode = modal.kind === "question"
      ? {
          id,
          type: "question",
          stance: modal.stance,
          text,
          author: "我",
          votes: null,
          viewerVote: null,
          answered: false,
          children: [],
        }
      : {
          id,
          type: "claim",
          stance: modal.stance,
          text,
          author: "我",
          evidence: evidence.trim() || undefined,
          votes: { up: 1, down: 0 },
          viewerVote: "up",
          children: [],
        };

    setTree((current) => updateNode(current, parentId, (parent) => ({ ...parent, children: [...parent.children, node] })));
    const next = new Set(expanded);
    next.add(parentId);
    persistExpanded(next);
    setSelectedId(id);
    setModal(null);
  }

  function jumpTo(id: string) {
    selectNode(id);
    scrollCardIntoView(id);
  }

  return (
    <main className="debate-app">
      <header className="dt-topbar">
        <span className="dt-logo">争鸣</span>
        <button
          type="button"
          className="dt-crumb"
          onClick={() => setLibraryOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={libraryOpen}
        >
          <span className="dt-crumb-label">辩论树</span>
          <b>{shortText(seed.title, 24)}</b>
          <i className="dt-crumb-caret" aria-hidden="true">▾</i>
          <em className="dt-crumb-count">{TREE_SEED_STATS.topics} 个真实议题</em>
        </button>
        <span className="dt-spacer" />
        <nav className="dt-nav" aria-label="模块切换">
          <a className="on" href="?view=debate" aria-current="page">辩论树</a>
          <a href="?view=map">争议地图</a>
          <a href="?view=room">辩论间</a>
        </nav>
        <div className="dt-vbtns" role="group" aria-label="视图切换">
          <button type="button" className={view === "tree" ? "on" : ""} aria-pressed={view === "tree"} onClick={() => setView("tree")}>缩进树</button>
          <button type="button" className={view === "graph" ? "on" : ""} aria-pressed={view === "graph"} onClick={() => setView("graph")}>争议地图</button>
        </div>
        <button type="button" className="dt-button ghost" title="多人共同编辑尚未接入服务端">邀请加入</button>
        <button type="button" className="dt-button primary" onClick={() => persistExpanded(new Set())}>收起全树</button>
      </header>

      {view === "graph" ? (
        <div style={{ height: "calc(100vh - 52px)", padding: 16, boxSizing: "border-box" }}>
          <ControversyMap />
        </div>
      ) : (
        <>
          <section className="dt-topic">
            <span className="dt-topic-tag">知乎议题溯源</span>
            <h1>{seed.title}</h1>
            <p>
              建局于真实知乎问题 · <a href={seed.url} target="_blank" rel="noreferrer">查看原问题</a>
              {seed.answerCount ? <> · 语料收录 <b>{seed.answerCount}</b> 条回答</> : null}
              {seed.claims.length ? <> · 一级论点 <b>{seed.claims.length}</b> 条</> : null}
            </p>
            <div className="dt-balance" aria-label="立场分布">
              <div className="dt-balance-bar">
                <i className="pro" style={{ width: `${stats.counts.pro / Math.max(stats.total, 1) * 100}%` }} />
                <i className="neutral" style={{ width: `${stats.counts.neutral / Math.max(stats.total, 1) * 100}%` }} />
                <i className="con" style={{ width: `${stats.counts.con / Math.max(stats.total, 1) * 100}%` }} />
              </div>
              <div className="dt-legend">
                <span><i className="pro" />支持 <b>{stats.counts.pro}</b></span>
                <span><i className="neutral" />看条件 <b>{stats.counts.neutral}</b></span>
                <span><i className="con" />反对 <b>{stats.counts.con}</b></span>
                <span>追问 <b>{stats.counts.question}</b></span>
                <span>最大簇占比 <b>{maxShareText(stats)}</b></span>
                {stats.imbalanced ? <span className="warning">最大簇占比过高，建议补充反方立场</span> : null}
              </div>
            </div>
          </section>

          <div className="dt-layout">
            <section className="dt-tree-panel" aria-label="辩论树">
              <div className="dt-panel-title">点击节点展开下一级 · 每一级都可添加支持 / 反对</div>
              <NodeRow
                node={tree}
                expanded={expanded}
                selectedId={selectedId}
                onSelect={selectNode}
                onToggle={toggleNode}
                onVote={vote}
                onQuickAdd={openAdd}
              />
            </section>

            <aside className="dt-detail">
              <section className="dt-detail-section dt-minimap">
                <div className="dt-panel-title">树状缩略图</div>
                <MiniMap tree={tree} expanded={expanded} selectedId={selectedId} />
                <div className="dt-minimap-legend">
                  <span><i className="dt-mm-swatch" style={{ borderColor: "#056DE8" }} />支持 / 议题</span>
                  <span><i className="dt-mm-swatch" style={{ borderColor: "#121212" }} />反对</span>
                  <span><i className="dt-mm-swatch" style={{ borderColor: "#a9aebc" }} />看条件</span>
                  <span><i className="dt-mm-swatch" style={{ borderColor: "#056DE8", borderStyle: "dashed" }} />追问</span>
                  <span><i className="dt-mm-swatch fill" style={{ borderColor: "#121212" }} />当前选中</span>
                </div>
              </section>

              <section className="dt-detail-section">
                <div className="dt-panel-title">节点详情</div>
                {!selectedNode ? (
                  <p className="dt-empty">在左侧选择一个节点</p>
                ) : (
                  <>
                    <div className="dt-detail-type">
                      <span className={`dt-tag ${selectedNode.type === "question" ? "question" : selectedNode.type === "root" ? "root" : selectedNode.stance}`}>
                        {selectedNode.type === "root" ? "议题" : selectedNode.type === "question" ? "追问" : STANCE_LABEL[selectedNode.stance as Stance]}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--dt-muted)" }}>
                        立场：{selectedNode.type === "root" ? "—" : STANCE_LABEL[selectedNode.stance as Stance]}
                      </span>
                    </div>
                    <h2>{selectedNode.text}</h2>
                    {selectedNode.source?.quote ? (
                      <p className="dt-detail-evidence"><b>原文节选：</b>{selectedNode.source.quote}</p>
                    ) : null}
                    {selectedNode.evidence ? <p className="dt-detail-evidence"><b>依据：</b>{selectedNode.evidence}</p> : null}
                    <div className="dt-node-meta" style={{ marginBottom: 12 }}>
                      {selectedNode.author ? <span className="dt-author">{selectedNode.author}</span> : null}
                      {selectedNode.authorBadge ? <span className="dt-badge-chip">{selectedNode.authorBadge}</span> : null}
                      {selectedNode.votes ? (
                        <span className="dt-votes">
                          <button
                            type="button"
                            className={selectedNode.viewerVote === "up" ? "on" : ""}
                            aria-label={`赞同 ${selectedNode.text}`}
                            aria-pressed={selectedNode.viewerVote === "up"}
                            onClick={() => vote(selectedNode.id, "up")}
                          >▲</button>
                          <b>{selectedNode.votes.up - selectedNode.votes.down}</b>
                          <button
                            type="button"
                            className={selectedNode.viewerVote === "down" ? "on" : ""}
                            aria-label={`反对 ${selectedNode.text}`}
                            aria-pressed={selectedNode.viewerVote === "down"}
                            onClick={() => vote(selectedNode.id, "down")}
                          >▼</button>
                        </span>
                      ) : null}
                      {sourceVoteText(selectedNode) ? <span className="dt-src-votes">{sourceVoteText(selectedNode)}</span> : null}
                    </div>

                    {selectedNode.agentHint ? (
                      <div className="dt-agent-card">
                        <b>Agent 追问建议</b>
                        <p>{selectedNode.agentHint}</p>
                      </div>
                    ) : null}

                    {selectedNode.source?.url ? (
                      <p className="dt-source">
                        {selectedNode.type === "root" ? "知乎原问题" : "知乎回答"}：
                        <a href={selectedNode.source.url} target="_blank" rel="noreferrer">查看原文</a>
                      </p>
                    ) : null}

                    {selectedNode.type === "root" ? (
                      <>
                        <p className="dt-seed-note"><b>数据来源：</b>{seed.note}</p>
                        <RootEvidence seed={seed} />
                      </>
                    ) : null}

                    <div className="dt-detail-actions">
                      <button type="button" className="dt-button primary" onClick={() => openAdd(selectedNode.id, "pro")}>添加支持论点</button>
                      <button type="button" className="dt-button ghost" onClick={() => openAdd(selectedNode.id, "con")}>添加反对论点</button>
                      {selectedNode.type !== "question" ? (
                        <button type="button" className="dt-button ghost" onClick={() => openQuestion(selectedNode.id)}>追问此节点</button>
                      ) : null}
                    </div>

                    {conflicts.length ? (
                      <div className="dt-conflict">
                        <span>同一父节点下的对向节点</span>
                        {conflicts.slice(0, 3).map((conflict) => (
                          <button key={conflict.id} type="button" className="dt-conflict-item" onClick={() => jumpTo(conflict.id)}>{conflict.text}</button>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}
              </section>
            </aside>
          </div>
        </>
      )}

      {libraryOpen ? (
        <TopicLibrary
          seeds={DEBATE_TREE_SEEDS}
          currentId={seed.id}
          onPick={onPickSeed}
          onClose={() => setLibraryOpen(false)}
        />
      ) : null}

      {modal ? (
        <div
          className="dt-modal-mask"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModal(null);
          }}
        >
          <section className="dt-modal" role="dialog" aria-modal="true" aria-labelledby="dt-modal-title">
            <h2 id="dt-modal-title">{modal.kind === "question" ? "追问这个节点" : "添加子论点"}</h2>
            <p>
              将作为「{STANCE_LABEL[modal.stance]}」
              {modal.kind === "question" ? "追问" : "挂在"}：
              {shortText(modalParent?.text ?? "", 40)}
            </p>
            {modal.kind === "claim" ? (
              <div className="dt-stance-picker" role="group" aria-label="选择立场">
                {(["pro", "con", "neutral"] as Stance[]).map((stance) => (
                  <button
                    key={stance}
                    type="button"
                    disabled={modalParent?.type === "question"}
                    className={modal.stance === stance ? "selected" : ""}
                    onClick={() => setModal({ ...modal, stance })}
                  >{STANCE_LABEL[stance]}</button>
                ))}
              </div>
            ) : null}
            <textarea
              ref={draftRef}
              aria-label={modal.kind === "question" ? "追问内容" : "论点内容"}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={modal.kind === "question" ? "指出你想澄清的具体依据或前提" : "一句话说明你的论点。为什么成立？"}
            />
            {modal.kind === "claim" ? (
              <textarea
                aria-label="论点依据"
                className="evidence"
                value={evidence}
                onChange={(event) => setEvidence(event.target.value)}
                placeholder="依据（可选）：数据、来源或亲身经历——回应时直接给出证据，不单独成节点"
              />
            ) : null}
            <p className="dt-modal-hint">
              规则：必须回应父节点的<em>具体内容</em>；纯表态（如“我就是不同意”）不会通过。
              {modal.kind === "question" ? " 追问由你署名，不会冒充 Agent 建议。" : null}
            </p>
            <div className="dt-modal-actions">
              <button type="button" className="dt-button ghost" onClick={() => setModal(null)}>取消</button>
              <button type="button" className="dt-button primary" onClick={submitModal}>发布到树上</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

/* ═══════════════ 外壳 ═══════════════ */

export function DebateTreePrototype() {
  const [seedId, setSeedId] = useState(() => resolveInitialSeed(DEBATE_TREE_SEEDS, DEFAULT_TREE_SEED_ID, findTreeSeed));
  const seed = findTreeSeed(seedId) ?? DEBATE_TREE_SEEDS[0];

  function pickSeed(id: string) {
    setSeedId(id);
    rememberSeed(id);
    writeSeedToUrl(id);
  }

  // key 换掉即重挂载：树、展开态、选中态、弹层全部随议题重置，不必手写同步逻辑
  return <TreeWorkspace key={seed.id} seed={seed} onPickSeed={pickSeed} />;
}
