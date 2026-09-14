/**
 * 辩论间 · 分阶段输入区
 *
 * 与原型一致：每个阶段只有一种输入形态，消灭「面对空白输入框不知道说什么」。
 *
 * 三条硬约束在 UI 上的体现：
 *  1. **不代写**：立论表单的 placeholder 只提示"写什么要素"，不预填成句内容；
 *     预设论点只作为**草稿参考**展示在旁，用户必须自己敲进输入框。
 *  2. **追问权替代验证权**：质询区只有「选靶点 + 提一个问题」，没有「判定对方」的按钮。
 *  3. **禁打包追问**：问号多于 1 个时提交按钮直接禁用，并给出原因。
 */

import { useMemo, useState } from "react";

import type {
  BriefItemKey,
  EvidenceStatus,
  FreeType,
  OpeningBrief,
  Reaction,
  RoomAction,
} from "../../types/debateRoom";
import { EVIDENCE_STATUSES } from "../../types/debateRoom";
import type { ComposerSpec } from "../debateRoomUi";
import { canSubmitAction, describeBriefItem } from "../debateRoomUi";
import { findBannedWords } from "../../domain/roomClient";

/* ═══════════════ 通用小件 ═══════════════ */

function BannedHint({ text }: { text: string }) {
  const hits = findBannedWords(text);
  if (!hits.length) return null;
  return (
    <p className="dr-warn">
      这段话里有平台不接受的表述（{hits.join("、")}）。争鸣只记录分歧、不评判立场，换个说法再提交。
    </p>
  );
}

function Counter({ text, min, max }: { text: string; min?: number; max?: number }) {
  const length = Array.from(text).length;
  return (
    <span className={`dr-count ${min && length > 0 && length < min ? "short" : ""}`}>
      {length}
      {min ? ` / 至少 ${min}` : ""}
      {max ? ` · 上限 ${max}` : ""}
    </span>
  );
}

/* ═══════════════ ① 立论结构 ═══════════════ */

interface BriefFormProps {
  /** 本方预设论点（来自争议地图管线的真实论点，仅作草稿参考） */
  presetClaim?: string | null;
  presetAuthor?: string;
  presetUrl?: string;
  onSubmit: (brief: OpeningBrief) => void;
  disabled?: boolean;
}

function BriefForm({ presetClaim, presetAuthor, presetUrl, onSubmit, disabled }: BriefFormProps) {
  const [definition, setDefinition] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [reason1, setReason1] = useState("");
  const [reason2, setReason2] = useState("");
  const [evidence, setEvidence] = useState("");
  const [status, setStatus] = useState<EvidenceStatus | "">("");
  const [touched, setTouched] = useState(false);

  const reasons = [reason1, reason2].filter((reason) => reason.trim());
  const brief: OpeningBrief = {
    definition: definition.trim() || undefined,
    conclusion: conclusion.trim(),
    reasons,
    evidence: evidence.trim() || undefined,
    evidenceStatus: status || undefined,
  };
  const action: RoomAction = { kind: "submitBrief", brief };
  const ok = canSubmitAction(action);
  const banned = findBannedWords([definition, conclusion, reason1, reason2, evidence].join(" "));

  /** 把预设论点用进结论框（用户仍需自己确认/改写，不是自动提交） */
  function usePreset() {
    if (presetClaim) setConclusion(presetClaim);
  }

  return (
    <div className="dr-form">
      <div className="dr-form-head">
        <b>① 立论结构</b>
        <span>这段结构是你本条发言的骨架，也是对方质询时要瞄准的靶子。双方各自填写、互不可见。</span>
      </div>

      {presetClaim ? (
        <div className="dr-preset">
          <div className="dr-preset-label">
            来自知乎的真实论点（草稿参考 · 可改可弃）
            {presetAuthor ? <em>{presetAuthor} · 赞同 {presetUrl ? "" : ""}</em> : null}
          </div>
          <p>{presetClaim}</p>
          <div className="dr-preset-actions">
            <button type="button" className="dr-mini" onClick={usePreset} disabled={disabled}>
              用它作结论起点
            </button>
            {presetUrl ? (
              <a className="dr-mini ghost" href={presetUrl} target="_blank" rel="noreferrer noopener">
                看原文
              </a>
            ) : null}
            <span className="dr-preset-note">必须自己改写——不能跳过立论直接开打。</span>
          </div>
        </div>
      ) : null}

      <label className="dr-field">
        <span className="dr-field-label">
          关键定义 <i>可选</i>
        </span>
        <input
          value={definition}
          onChange={(event) => setDefinition(event.target.value)}
          placeholder="如：窗口期＝……（对方可以选中这一条来质询）"
          disabled={disabled}
        />
      </label>

      <label className="dr-field">
        <span className="dr-field-label">
          核心结论 <i>必填</i>
        </span>
        <input
          value={conclusion}
          onChange={(event) => { setConclusion(event.target.value); setTouched(true); }}
          placeholder="你最终主张什么？一句话说完。"
          disabled={disabled}
        />
      </label>

      <label className="dr-field">
        <span className="dr-field-label">
          理由 1 <i>必填</i>
        </span>
        <input
          value={reason1}
          onChange={(event) => setReason1(event.target.value)}
          placeholder="支撑结论的第一条理由"
          disabled={disabled}
        />
      </label>

      <label className="dr-field">
        <span className="dr-field-label">
          理由 2 <i>可选，最多两条</i>
        </span>
        <input
          value={reason2}
          onChange={(event) => setReason2(event.target.value)}
          placeholder="把最重要的两条留下就够了"
          disabled={disabled}
        />
      </label>

      <label className="dr-field">
        <span className="dr-field-label">
          依据 <i>可选</i>
        </span>
        <input
          value={evidence}
          onChange={(event) => setEvidence(event.target.value)}
          placeholder="支撑理由的事实或来源"
          disabled={disabled}
        />
      </label>

      {evidence.trim() ? (
        <label className="dr-field">
          <span className="dr-field-label">
            证据状态 <i>填了依据就要标注</i>
          </span>
          <select value={status} onChange={(event) => setStatus(event.target.value as EvidenceStatus)} disabled={disabled}>
            <option value="">请选择七档之一</option>
            {EVIDENCE_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <BannedHint text={[definition, conclusion, reason1, reason2, evidence].join(" ")} />

      {touched && !ok && !banned.length ? (
        <p className="dr-hint-line">
          {!conclusion.trim()
            ? "Host：核心结论不能为空——你最终主张什么？"
            : reasons.length < 1
              ? "Host：至少需要一条理由——结论不会因为重复而成立。"
              : "Host：填了依据就请标注它的证据状态。"}
        </p>
      ) : null}

      <div className="dr-form-foot">
        <Counter text={conclusion} min={1} />
        <button type="button" className="dr-submit" onClick={() => onSubmit(brief)} disabled={disabled || !ok}>
          提交立论结构
        </button>
      </div>
    </div>
  );
}

/* ═══════════════ ② 质询：选靶点 + 提问 ═══════════════ */

interface AskFormProps {
  targets: { key: BriefItemKey; text: string }[];
  onAsk: (targetItem: BriefItemKey, question: string) => void;
  onRequestHint: (targetItem: BriefItemKey, draft: string) => void;
  hint?: string | null;
  hintLoading?: boolean;
  disabled?: boolean;
}

function AskForm({ targets, onAsk, onRequestHint, hint, hintLoading, disabled }: AskFormProps) {
  const [target, setTarget] = useState<BriefItemKey | null>(targets[0]?.key ?? null);
  const [question, setQuestion] = useState("");

  const marks = (question.match(/[?？]/g) ?? []).length;
  const action: RoomAction | null = target ? { kind: "ask", targetItem: target, question } : null;
  const ok = Boolean(action && canSubmitAction(action));
  const targetText = targets.find((item) => item.key === target)?.text ?? "";
  const tooMany = marks > 1;

  return (
    <div className="dr-form">
      <div className="dr-form-head">
        <b>② 质询轮 · 提问</b>
        <span>选对方立论结构里的一个条目发问。一问一答——只问一个问题，不许打包追问。</span>
      </div>

      <div className="dr-targets">
        {targets.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`dr-target ${target === item.key ? "on" : ""}`}
            onClick={() => setTarget(item.key)}
            disabled={disabled}
          >
            <b>{item.key}</b>
            <span>{item.text}</span>
          </button>
        ))}
      </div>

      {target ? <p className="dr-target-note">{describeBriefItem(target)}</p> : null}
      {targetText ? <blockquote className="dr-quote">{targetText}</blockquote> : null}

      <label className="dr-field">
        <span className="dr-field-label">你的问题 <i>恰好一个问号</i></span>
        <textarea
          rows={2}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="针对上面这个条目，问一个具体的问题。"
          disabled={disabled}
        />
      </label>

      <BannedHint text={question} />
      {tooMany ? <p className="dr-warn">一次只问一个问题——把多余的问号收起来。</p> : null}

      <div className="dr-form-foot">
        <button
          type="button"
          className="dr-mini"
          onClick={() => target && onRequestHint(target, question)}
          disabled={disabled || !target || hintLoading}
        >
          {hintLoading ? "Host 正在看…" : "让 Host 给个结构提示"}
        </button>
        <button type="button" className="dr-submit" onClick={() => target && onAsk(target, question)} disabled={disabled || !ok}>
          提交质询
        </button>
      </div>

      {hint ? <div className="dr-host-hint"><b>Host</b>{hint}</div> : null}
    </div>
  );
}

/* ═══════════════ ② 回答 ═══════════════ */

function AnswerForm({
  prompt,
  targetItem,
  onSubmit,
  hint,
  hintLoading,
  onRequestHint,
  disabled,
}: {
  prompt: string;
  targetItem?: BriefItemKey;
  onSubmit: (text: string) => void;
  hint?: string | null;
  hintLoading?: boolean;
  onRequestHint: () => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const ok = canSubmitAction({ kind: "answer", text });
  return (
    <div className="dr-form">
      <div className="dr-form-head">
        <b>② 质询轮 · 回答</b>
        <span>正面回答这个问题。答得太短不算交锋——Host 会拦下来。</span>
      </div>

      <blockquote className="dr-quote">
        {targetItem ? <span className="dr-quote-tag">瞄准「{targetItem}」</span> : null}
        {prompt}
      </blockquote>

      <textarea
        rows={4}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="直接回答对方的问题。承认不确定也可以，但要说明边界在哪。"
        disabled={disabled}
      />

      <BannedHint text={text} />

      <div className="dr-form-foot">
        <div className="dr-foot-left">
          <Counter text={text} min={6} />
          <button type="button" className="dr-mini" onClick={onRequestHint} disabled={disabled || hintLoading}>
            {hintLoading ? "Host 正在看…" : "让 Host 给个结构提示"}
          </button>
        </div>
        <button type="button" className="dr-submit" onClick={() => onSubmit(text)} disabled={disabled || !ok}>
          提交回答
        </button>
      </div>

      {hint ? <div className="dr-host-hint"><b>Host</b>{hint}</div> : null}
    </div>
  );
}

/* ═══════════════ ② 接受或继续追问 ═══════════════ */

function ReactForm({
  spec,
  onReact,
  disabled,
}: {
  spec: ComposerSpec;
  onReact: (reaction: Reaction) => void;
  disabled?: boolean;
}) {
  return (
    <div className="dr-form">
      <div className="dr-form-head">
        <b>② 质询轮 · 你的回应</b>
        <span>接受只表示结束本轮，不代表同意对方立场；是否回避由终局 AI 评价。</span>
      </div>

      {spec.reactingTo ? <blockquote className="dr-quote">你问的：{spec.reactingTo}</blockquote> : null}

      <div className="dr-reactions">
        {(spec.reactions ?? []).map((option) => (
          <button
            key={option.value}
            type="button"
            className={`dr-reaction ${option.value}`}
            onClick={() => onReact(option.value)}
            disabled={disabled}
          >
            <b>{option.label}</b>
            <span>{option.hint}</span>
          </button>
        ))}
      </div>

      {spec.pressUsed ? (
        <p className="dr-hint-line">继续追问每方限 1 次；第二次回答完成后系统会自动推进。</p>
      ) : null}
    </div>
  );
}

/* ═══════════════ ③ 自由对辩 ═══════════════ */

function FreeForm({
  freeTypes,
  onSubmit,
  disabled,
}: {
  freeTypes: FreeType[];
  onSubmit: (freeType: FreeType, text: string, revisedTo?: string) => void;
  disabled?: boolean;
}) {
  const [freeType, setFreeType] = useState<FreeType>("反驳");
  const [text, setText] = useState("");
  const [revisedTo, setRevisedTo] = useState("");

  const action: RoomAction = { kind: "freeSpeak", freeType, text, revisedTo: revisedTo || undefined };
  const ok = canSubmitAction(action);

  const hints: Record<FreeType, string> = {
    反驳: "指向对方某条立论或发言提出反对——会被归入分歧",
    举证: "补充事实性证据——会作为证据进入七档状态",
    承认: "接受对方某条论证有道理。仅作语义标注，不影响任何结算",
    修正: "修改本方先前的表述。原表述的痕迹会保留，历史可见",
    寻共识: "提出双方可能都接受的表述——会进入报告的共识栏",
  };

  return (
    <div className="dr-form">
      <div className="dr-form-head">
        <b>③ 自由对辩</b>
        <span>本轮每方 1 次发言机会。先标注类型，再写内容。</span>
      </div>

      <div className="dr-types">
        {freeTypes.map((type) => (
          <button
            key={type}
            type="button"
            className={`dr-type ${freeType === type ? "on" : ""}`}
            onClick={() => setFreeType(type)}
            disabled={disabled}
          >
            {type}
          </button>
        ))}
      </div>
      <p className="dr-target-note">{hints[freeType]}</p>

      <textarea
        rows={4}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={freeType === "寻共识" ? "提出一个你觉得双方都可能会接受的表述。" : "写你的发言内容。"}
        disabled={disabled}
      />

      {freeType === "修正" ? (
        <label className="dr-field">
          <span className="dr-field-label">
            修正后的表述 <i>必填</i>
          </span>
          <input value={revisedTo} onChange={(event) => setRevisedTo(event.target.value)} placeholder="改完之后，你的表述是什么？" disabled={disabled} />
        </label>
      ) : null}

      <BannedHint text={text} />

      <div className="dr-form-foot">
        <Counter text={text} min={1} />
        <button type="button" className="dr-submit" onClick={() => onSubmit(freeType, text, revisedTo || undefined)} disabled={disabled || !ok}>
          提交发言
        </button>
      </div>
    </div>
  );
}

/* ═══════════════ ④ 结辩 ═══════════════ */

function ClosingForm({
  onSubmit,
  disabled,
}: {
  onSubmit: (text: string, revision?: { from: string; to: string }) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [withRevision, setWithRevision] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const revision = withRevision ? { from: from.trim(), to: to.trim() } : undefined;
  const ok = canSubmitAction({ kind: "submitClosing", text }) && (!withRevision || Boolean(revision!.from && revision!.to));

  return (
    <div className="dr-form">
      <div className="dr-form-head">
        <b>④ 结辩</b>
        <span>做结构化收束：本场在哪里交锋、你保留了哪些、修正了哪些。不要求承认对方，也不要求对方承认你。</span>
      </div>

      <textarea
        rows={5}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="回顾本场：你的结论有没有变化？质询里哪个问题最关键？"
        disabled={disabled}
      />

      <label className="dr-check">
        <input type="checkbox" checked={withRevision} onChange={(event) => setWithRevision(event.target.checked)} disabled={disabled} />
        <span>我要附带一条修正（保留修正前后的对照）</span>
      </label>

      {withRevision ? (
        <div className="dr-revision-row">
          <input value={from} onChange={(event) => setFrom(event.target.value)} placeholder="修正前的表述" disabled={disabled} />
          <span>→</span>
          <input value={to} onChange={(event) => setTo(event.target.value)} placeholder="修正后的表述" disabled={disabled} />
        </div>
      ) : null}

      <BannedHint text={text} />

      <div className="dr-form-foot">
        <Counter text={text} min={1} />
        <button type="button" className="dr-submit" onClick={() => onSubmit(text, revision)} disabled={disabled || !ok}>
          提交结辩
        </button>
      </div>
    </div>
  );
}

/* ═══════════════ 统一出口 ═══════════════ */

export interface ComposerProps {
  spec: ComposerSpec;
  preset?: { claim?: string | null; author?: string; url?: string };
  currentBriefTarget?: BriefItemKey;
  hostHint?: string | null;
  hostHintLoading?: boolean;
  disabled?: boolean;
  onBrief: (brief: OpeningBrief) => void;
  onOpening: (text: string) => void;
  onAsk: (targetItem: BriefItemKey, question: string) => void;
  onAnswer: (text: string) => void;
  onReact: (reaction: Reaction) => void;
  onFree: (freeType: FreeType, text: string, revisedTo?: string) => void;
  onClosing: (text: string, revision?: { from: string; to: string }) => void;
  onRequestHint: (context: string, targetItem?: BriefItemKey) => void;
}

/**
 * 按 `spec.kind` 渲染对应输入区。等待态只显示提示，不给任何可输入的控件
 * ——避免用户对着不能用的输入框反复敲。
 */
export function Composer(props: ComposerProps) {
  const { spec, disabled } = props;

  const body = useMemo(() => {
    switch (spec.kind) {
      case "brief":
        return (
          <BriefForm
            presetClaim={props.preset?.claim}
            presetAuthor={props.preset?.author}
            presetUrl={props.preset?.url}
            onSubmit={props.onBrief}
            disabled={disabled}
          />
        );
      case "opening":
        return (
          <OpeningForm hint={props.hostHint} loading={props.hostHintLoading} onHint={() => props.onRequestHint("opening")} onSubmit={props.onOpening} disabled={disabled} />
        );
      case "ask":
        return (
          <AskForm
            targets={spec.targets ?? []}
            onAsk={props.onAsk}
            onRequestHint={(targetItem, draft) => props.onRequestHint(draft ? `question:${draft}` : "question", targetItem)}
            hint={props.hostHint}
            hintLoading={props.hostHintLoading}
            disabled={disabled}
          />
        );
      case "answer":
        return (
          <AnswerForm
            prompt={spec.prompt ?? ""}
            targetItem={props.currentBriefTarget}
            onSubmit={props.onAnswer}
            hint={props.hostHint}
            hintLoading={props.hostHintLoading}
            onRequestHint={() => props.onRequestHint("answer")}
            disabled={disabled}
          />
        );
      case "react":
        return <ReactForm spec={spec} onReact={props.onReact} disabled={disabled} />;
      case "free":
        return <FreeForm freeTypes={spec.freeTypes ?? []} onSubmit={props.onFree} disabled={disabled} />;
      case "closing":
        return <ClosingForm onSubmit={props.onClosing} disabled={disabled} />;
      default:
        return (
          <div className="dr-waiting">
            <span className="dr-waiting-dot" />
            <p>{spec.hint}</p>
          </div>
        );
    }
  }, [spec, props, disabled]);

  return <div className="dr-composer">{body}</div>;
}

/** 开篇陈述：独立成件，因为它有专属的「五要素提示」 */
function OpeningForm({
  onSubmit,
  hint,
  loading,
  onHint,
  disabled,
}: {
  onSubmit: (text: string) => void;
  hint?: string | null;
  loading?: boolean;
  onHint: () => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const ok = canSubmitAction({ kind: "submitOpening", text });
  return (
    <div className="dr-form">
      <div className="dr-form-head">
        <b>① 开篇陈述</b>
        <span>按「定义 → 结论 → 理由 → 依据 → 判断标准」把立论讲完整。Host 只做结构提示，不代写。</span>
      </div>

      <div className="dr-outline">
        {["定义", "结论", "理由", "依据", "判断标准"].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>

      <textarea
        rows={6}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="把刚才填的结构用完整的话说出来。"
        disabled={disabled}
      />

      <BannedHint text={text} />

      <div className="dr-form-foot">
        <div className="dr-foot-left">
          <Counter text={text} min={1} />
          <button type="button" className="dr-mini" onClick={onHint} disabled={disabled || loading}>
            {loading ? "Host 正在看…" : "让 Host 给个结构提示"}
          </button>
        </div>
        <button type="button" className="dr-submit" onClick={() => onSubmit(text)} disabled={disabled || !ok}>
          提交开篇陈述
        </button>
      </div>

      {hint ? <div className="dr-host-hint"><b>Host</b>{hint}</div> : null}
    </div>
  );
}
