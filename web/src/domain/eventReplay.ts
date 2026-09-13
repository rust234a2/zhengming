import type {
  ActAdvanceResult,
  CanonEntry,
  EventReplay,
  Ledger,
  LedgerDelta,
  Move,
  Position,
  RelationDelta,
  ValidationResult,
} from "../types/eventReplay";

const EMPTY_LEDGER: Ledger = {
  time: 0,
  money: 0,
  relation: 0,
  health: 0,
  opportunity: 0,
};

function error(path: string, message: string) {
  return { path, message };
}

function hasCanonField(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(
    ([key, child]) => key.toLowerCase() === "canon" || hasCanonField(child),
  );
}

export function validateEventReplay(event: EventReplay): ValidationResult {
  const errors: ValidationResult["errors"] = [];
  const { header, positions, acts, canon } = event;
  if (!header.id.trim()) errors.push(error("header.id", "事件 id 不能为空"));
  if (!header.title.trim()) errors.push(error("header.title", "标题不能为空"));
  if (!header.background.trim()) errors.push(error("header.background", "背景不能为空"));
  if (!header.adaptation.peopleAliased) errors.push(error("header.adaptation.peopleAliased", "人物必须化名"));
  if (!header.adaptation.organizationsObscured) errors.push(error("header.adaptation.organizationsObscured", "机构必须模糊化"));
  if (header.adaptation.timeGranularity !== "month") errors.push(error("header.adaptation.timeGranularity", "时间粒度必须为月"));
  if (!header.admission.publiclyDiscussed) errors.push(error("header.admission.publiclyDiscussed", "事件必须经过公开讨论"));
  if (header.admission.disasterOrCasualty) errors.push(error("header.admission.disasterOrCasualty", "伤亡或灾难事件不得准入"));
  if (!header.admission.reviewedAt.trim()) errors.push(error("header.admission.reviewedAt", "缺少审核时间"));
  if (header.endingCondition.actCount < 2) errors.push(error("header.endingCondition.actCount", "至少需要两幕"));
  if (positions.length < 2) errors.push(error("positions", "至少需要两个角色位"));
  const signatures = new Set(positions.map((position) => `${position.visible}\n${position.resources}`));
  if (positions.length >= 2 && signatures.size < 2) errors.push(error("positions", "角色位的信息范围与资源必须有差异"));
  const positionIds = new Set(positions.map((position) => position.id));
  positions.forEach((position, index) => {
    if (!position.id.trim()) errors.push(error(`positions[${index}].id`, "角色 id 不能为空"));
    position.relations.forEach((relation, relationIndex) => {
      if (!positionIds.has(relation.to)) errors.push(error(`positions[${index}].relations[${relationIndex}].to`, "关系指向未知角色"));
      if (relation.attitude < -100 || relation.attitude > 100) errors.push(error(`positions[${index}].relations[${relationIndex}].attitude`, "关系值必须在 -100 到 100"));
    });
  });
  acts.forEach((act, index) => {
    if (act.index !== index) errors.push(error(`acts[${index}].index`, "幕索引必须从 0 连续递增"));
    if (!act.month.trim() || !act.text.trim()) errors.push(error(`acts[${index}]`, "幕时间和外部事件不能为空"));
  });
  if (acts.length !== header.endingCondition.actCount) errors.push(error("acts", "幕数必须等于结局条件"));
  canon.forEach((entry, index) => {
    if (!acts[entry.actIndex]) errors.push(error(`canon[${index}].actIndex`, "原作轨迹指向未知幕"));
    if (!entry.sources.length) errors.push(error(`canon[${index}].sources`, "原作轨迹必须有来源"));
    entry.sources.forEach((source, sourceIndex) => {
      const path = `canon[${index}].sources[${sourceIndex}]`;
      if (!/^https:\/\/(www\.)?zhihu\.com\//.test(source.url)) errors.push(error(`${path}.url`, "来源必须是 https 知乎链接"));
      if (!source.reviewedAt.trim()) errors.push(error(`${path}.reviewedAt`, "缺少来源审核时间"));
    });
  });
  return { ok: errors.length === 0, errors };
}

export function validateActAdvanceResult(
  result: ActAdvanceResult,
  positionIds: string[],
  actIndex: number,
  endingActCount: number,
): ValidationResult {
  const errors: ValidationResult["errors"] = [];
  if (!result.outcome.trim()) errors.push(error("outcome", "后果不能为空"));
  if (!result.nextScene.month.trim()) errors.push(error("nextScene.month", "下一幕时间不能为空"));
  if (!result.nextScene.text.trim()) errors.push(error("nextScene.text", "下一幕处境不能为空"));
  if (result.moves.length < 2 || result.moves.length > 3) errors.push(error("moves", "每幕必须有 2 到 3 个动作"));
  const known = new Set(positionIds);
  result.relationDeltas.forEach((delta, index) => {
    if (!known.has(delta.positionId)) errors.push(error(`relationDeltas[${index}].positionId`, "关系变化指向未知角色"));
  });
  if (hasCanonField(result)) errors.push(error("$", "幕推进结果不得包含 canon"));
  const shouldEnd = actIndex + 1 >= endingActCount;
  if (result.atEnding !== shouldEnd) errors.push(error("atEnding", "结局标记与幕数不一致"));
  return { ok: errors.length === 0, errors };
}

export function assertNoCanonLeak(text: string, canon: CanonEntry[]): string[] {
  const terms = canon.flatMap((entry) =>
    entry.development
      .split(/[，。；、\s]+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 4),
  );
  return [...new Set(terms.filter((term) => text.includes(term)))];
}

export function assertWithinVisible(
  result: ActAdvanceResult,
  position: Position,
): ValidationResult {
  const allowed = new Set(position.visible.split(/[，、；\n]+/).map((item) => item.trim()).filter(Boolean));
  const errors = result.nextScene.visibleFacts
    .filter((fact) => !allowed.has(fact))
    .map((fact, index) => error(`nextScene.visibleFacts[${index}]`, `信息越界: ${fact}`));
  return { ok: errors.length === 0, errors };
}

export function applyLedger(ledger: Partial<Ledger>, deltas: LedgerDelta[]): Ledger {
  return deltas.reduce<Ledger>((next, delta) => ({
    time: next.time + (delta.time ?? 0),
    money: next.money + (delta.money ?? 0),
    relation: next.relation + (delta.relation ?? 0),
    health: next.health + (delta.health ?? 0),
    opportunity: next.opportunity + (delta.opportunity ?? 0),
  }), { ...EMPTY_LEDGER, ...ledger });
}

export function applyRelations(
  relations: Record<string, number>,
  deltas: RelationDelta[],
): Record<string, number> {
  const next = { ...relations };
  deltas.forEach((delta) => {
    next[delta.positionId] = Math.max(-100, Math.min(100, (next[delta.positionId] ?? 0) + delta.amount));
  });
  return next;
}

export function relationGate(move: Move, relations: Record<string, number>): boolean {
  if (!move.relationGate) return true;
  return (relations[move.relationGate.positionId] ?? -100) >= move.relationGate.minimum;
}
