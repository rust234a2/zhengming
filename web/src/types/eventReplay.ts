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
    /** 种子事件恒为 true/false（准入闸门在 validateEventReplay）；生成事件按模型申报 */
    publiclyDiscussed: boolean;
    disasterOrCasualty: boolean;
    reviewedAt: string;
  };
  endingCondition: { kind: "actCount"; actCount: number };
}

export interface Position {
  id: string;
  name: string;
  /** 一句话身份说明，供 Host 提示词使用（可选） */
  role?: string;
  stake: string;
  /**
   * 该角色位**只能知道**什么。
   *
   * 形状是数组（Host 契约 §0.7）：服务端把整份列表拼进提示词，并用它做
   * `nextScene.visibleFacts` 的越界判定，所以必须是逐条一项的集合，不是长句。
   */
  visible: string[];
  resources: string;
  canDo: string[];
  /** 角色位的初始态度（种子数据；运行期态度见 `ReplayState.relations`） */
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

/**
 * Host 契约 §0.8 · 能力 9 `replayCompose` 入参。
 *
 * `timeline` 是用户提供的明确时间节点（每条一句，可为空数组——让模型自行
 * 从事件材料里提炼节拍）；`actCount` 是要生成的幕数（2-5）。
 */
export interface ComposeParams {
  topic: string;
  timeline: string[];
  actCount: number;
}

/**
 * Host 契约 §0.8 · 能力 9 出参：一份**待归一化**的事件脚本。
 *
 * 字段由模型给出，只保证"字符串/数组"级别的形状；id 规范、关系指向、
 * 幕序号等归一化全部在前端 `normalizeComposedEvent` 内完成，
 * 产出标准的 `EventReplay`（canon 恒为空数组）。
 */
export interface ComposedEventScaffold {
  title: string;
  background: string;
  admission: { publiclyDiscussed: boolean; disasterOrCasualty: boolean };
  positions: {
    id: string;
    name: string;
    role: string;
    stake: string;
    visible: string[];
    resources: string;
    canDo: string[];
    relations: { to: string; attitude: number }[];
  }[];
  acts: { index: number; month: string; text: string }[];
}

export interface Move {
  id: string;
  text: string;
  costHint: string;
  implicitAssumption: string;
  label: string;
  relationGate?: { positionId: string; minimum: number };
}

/** 账本五维（PRD §F3）——与 Host 契约 §0.7 的 `LedgerEntry.key` 枚举一一对应。 */
export type LedgerKey = "time" | "money" | "relation" | "health" | "opportunity";

/** 账本累加态（前端内部表示；进出 Host 时在 client/domain 边界转换）。 */
export type Ledger = Record<LedgerKey, number>;

/** Host 契约 §0.7 · 入参：账本条目（累加态快照），`key` 用中文维度名。 */
export interface LedgerEntry {
  key: string;
  value: number;
}

/** Host 契约 §0.7 · 入参：关系条目（累加态快照），`target` 用角色位名。 */
export interface RelationEntry {
  target: string;
  value: number;
}

/**
 * Host 契约 §0.7 · 能力 5 出参：本幕账本增量。
 *
 * `key` 由模型给出，**可能是五维之外的自造词**（服务端只保证它是字符串）。
 * 归一化（映射到 `LedgerKey`，映射不上则丢弃该条）在 `domain/eventReplay.ts`
 * 的 `applyLedger` 内完成，UI 永远看不到未归一的 key。
 */
export interface LedgerDelta {
  key: string;
  delta: number;
  note: string;
}

/**
 * Host 契约 §0.7 · 能力 5 出参：本幕关系增量。
 *
 * `target` 可能是角色位 **id 或名字**（由模型自由给出），归一化在
 * `applyRelations` 内完成；匹配不上任何角色位的条目被丢弃（不阻断整幕）。
 */
export interface RelationDelta {
  target: string;
  delta: number;
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
