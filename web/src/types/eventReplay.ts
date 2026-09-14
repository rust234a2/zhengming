export interface EventHeader {
  id: string;
  title: string;
  background: string;
  adaptation: {
    peopleAliased: true;
    organizationsObscured: true;
    timeGranularity: "month";
  };
  admission: {
    publiclyDiscussed: true;
    disasterOrCasualty: false;
    reviewedAt: string;
  };
  endingCondition: { kind: "actCount"; actCount: number };
}

export interface Position {
  id: string;
  name: string;
  stake: string;
  visible: string;
  resources: string;
  canDo: string[];
  relations: { to: string; attitude: number }[];
}

export interface Act {
  index: number;
  month: string;
  text: string;
}

export interface CanonSource {
  url: string;
  excerpt: string;
  reviewedAt: string;
}

export interface CanonEntry {
  actIndex: number;
  month: string;
  development: string;
  sources: CanonSource[];
}

export interface EventReplay {
  header: EventHeader;
  positions: Position[];
  acts: Act[];
  canon: CanonEntry[];
}

export interface Move {
  id: string;
  text: string;
  costHint: string;
  implicitAssumption: string;
  label: string;
  relationGate?: { positionId: string; minimum: number };
}

export interface LedgerDelta {
  time?: number;
  money?: number;
  relation?: number;
  health?: number;
  opportunity?: number;
}

export type Ledger = Required<LedgerDelta>;

export interface RelationDelta {
  positionId: string;
  amount: number;
}

export interface ActAdvanceResult {
  outcome: string;
  nextScene: { month: string; text: string; visibleFacts: string[] };
  moves: Move[];
  relationDeltas: RelationDelta[];
  ledgerDeltas: LedgerDelta[];
  atEnding: boolean;
}

export interface ValidationResult {
  ok: boolean;
  errors: { path: string; message: string }[];
}

/** 一幕「已作出的决定 + 它的后果」——固化进 history，不可撤销（本版无回溯）。 */
export interface PlayedAct {
  actIndex: number;
  moveId: string;
  moveText: string;
  moveLabel: string;
  /** 该决定的后果叙事（模型生成，固化后不得改写） */
  outcome: string;
  ledgerDeltas: LedgerDelta[];
  relationDeltas: RelationDelta[];
}

export interface EndingCard {
  title: string;
  text: string;
}

/**
 * 运行态。全部可从 `history` + `acts` 派生，不另存总账。
 *
 * `actIndex` 的语义：**玩家正在做决定的这一幕**。开局选完角色位后为 0；
 * 做出选择并拿到后果后 +1；`actIndex >= endingCondition.actCount` 即收束。
 */
export interface ReplayState {
  eventId: string;
  /** 未选角色位时为 null —— 此时只能选角色位，不能做任何决定 */
  positionId: string | null;
  actIndex: number;
  /** 本幕处境（模型生成，限定在角色位 visible 内） */
  currentScene: string;
  /** 本幕可选动作（结构字段：必须等完整 JSON 校验通过才可交互） */
  currentMoves: Move[];
  history: PlayedAct[];
  ledger: Ledger;
  relations: Record<string, number>;
  /** 请求中：禁用其他动作 */
  pending: boolean;
  pendingMoveId: string | null;
  /** 「这一步暂时无法推进」等失败态文案；不把半截输出冒充结果 */
  pendingError: string | null;
  /** 流式增量：边到边渲染用。流结束（且校验通过）前不写入 currentScene */
  streamingOutcome: string;
  ended: boolean;
  ending: EndingCard | null;
  canonRevealed: boolean;
  /** 展开揭示前恒为 null —— 保证 DOM 里不渲染任何原作内容 */
  canon: CanonEntry[] | null;
}

export type ReplayAction =
  /** 选定角色位，随后由调用方触发开局（chosenMoveId = null）的幕推进 */
  | { type: "SELECT_POSITION"; positionId: string }
  /** 玩家选定一个动作：进入 pending，禁用其他动作 */
  | { type: "ACT_CHOSEN"; moveId: string }
  /** 流式叙事增量（只影响渲染，不影响结构字段） */
  | { type: "ADVANCE_STREAM"; text: string }
  /** 幕推进成功：chosenMoveId 为 null 表示开局，不落 history */
  | { type: "ADVANCE_SUCCEEDED"; chosenMoveId: string | null; result: ActAdvanceResult }
  | { type: "ADVANCE_FAILED"; message: string }
  /** 整幕重试：清掉上一轮半截文本，重新进入 pending */
  | { type: "RETRY" }
  | { type: "ENDING_RECEIVED"; ending: EndingCard }
  /** 终局可选揭示；仅在 ended 之后可用 */
  | { type: "REVEAL_CANON"; canon: CanonEntry[] }
  /** 换角色位重玩：清空全部运行态（代价不可撤销，故无 REWIND） */
  | { type: "RESTART" };
