import type {
  ActAdvanceResult,
  CanonEntry,
  EventReplay,
  Ledger,
  LedgerDelta,
  LedgerKey,
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

/** 五维的固定顺序 —— UI 渲染与请求体构造共用，保证顺序稳定。 */
export const LEDGER_KEYS: LedgerKey[] = ["time", "money", "relation", "health", "opportunity"];

/**
 * 五维的中文名 —— 也是发给 Host 的 `LedgerEntry.key` 取值（契约 §0.7）。
 *
 * 传中文有两个好处：模型看得懂，且回参倾向于沿用同一组词，归一化命中率显著更高。
 */
export const LEDGER_KEY_LABELS: Record<LedgerKey, string> = {
  time: "时间",
  money: "钱",
  relation: "关系",
  health: "健康",
  opportunity: "机会",
};

/** 归一化别名表：中文标签 / 英文键 / 模型常见变体 → 五维。 */
const LEDGER_KEY_ALIASES: Record<string, LedgerKey> = {
  时间: "time",
  time: "time",
  钱: "money",
  金钱: "money",
  费用: "money",
  花费: "money",
  money: "money",
  关系: "relation",
  人情: "relation",
  人际: "relation",
  relation: "relation",
  健康: "health",
  身体: "health",
  health: "health",
  机会: "opportunity",
  机遇: "opportunity",
  机会成本: "opportunity",
  opportunity: "opportunity",
};

/**
 * 把模型给出的账本维度归一到五维。
 *
 * 契约 §0.7：PRD 把账本定死为五维，模型不得自造；**归一化不了就返回 null**，
 * 由调用方丢弃该条——绝不静默塞进别的维度（那会伪造出一条玩家没付过的代价）。
 */
export function normalizeLedgerKey(raw: string): LedgerKey | null {
  const key = String(raw ?? "").trim();
  if (!key) return null;
  const direct = LEDGER_KEY_ALIASES[key];
  if (direct) return direct;
  const lower = key.toLowerCase();
  if (LEDGER_KEY_ALIASES[lower]) return LEDGER_KEY_ALIASES[lower];
  // 兜底：条目名里包含维度词（如「时间成本」「金钱支出」）
  const hit = (Object.keys(LEDGER_KEY_ALIASES) as string[]).find((alias) => key.includes(alias));
  return hit ? LEDGER_KEY_ALIASES[hit] : null;
}

/**
 * 把模型给出的关系对象解析成角色位 id。
 *
 * 契约 §0.7 的 `RelationEntry.target` / `relationDeltas[].target` 由模型自由给出，
 * 实测可能是 id、角色名、或「配偶（partner）」这类混合写法，故三级匹配。
 * 全部落空返回 null，由调用方丢弃该条（不阻断整幕）。
 */
export function resolveRelationTarget(target: string, positions: Position[]): string | null {
  const value = String(target ?? "").trim();
  if (!value) return null;
  const byId = positions.find((position) => position.id === value);
  if (byId) return byId.id;
  const byName = positions.find((position) => position.name === value);
  if (byName) return byName.id;
  const fuzzy = positions.find(
    (position) => value.includes(position.name) || position.name.includes(value),
  );
  return fuzzy ? fuzzy.id : null;
}

/** 角色位 id → 名字（发给 Host 时用名字，模型更容易对齐）。 */
export function positionName(positionId: string, positions: Position[]): string {
  return positions.find((position) => position.id === positionId)?.name ?? positionId;
}

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
  const signatures = new Set(
    positions.map((position) => `${position.visible.join("|")}\n${position.resources}`),
  );
  if (positions.length >= 2 && signatures.size < 2) errors.push(error("positions", "角色位的信息范围与资源必须有差异"));
  const positionIds = new Set(positions.map((position) => position.id));
  positions.forEach((position, index) => {
    if (!position.id.trim()) errors.push(error(`positions[${index}].id`, "角色 id 不能为空"));
    if (!position.name.trim()) errors.push(error(`positions[${index}].name`, "角色位名称不能为空"));
    if (!position.visible.length || position.visible.some((item) => !item.trim())) {
      errors.push(error(`positions[${index}].visible`, "可见信息范围必须逐条列出，不能为空"));
    }
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
  actIndex: number,
  endingActCount: number,
): ValidationResult {
  const errors: ValidationResult["errors"] = [];
  // 结局标记由**前端按幕数归一化**（2026-09-14）：走到第几幕、何时终局是
  // endingCondition.actCount 定的硬节奏，不依赖模型自觉。实测模型会提前或
  // 滞后置位 atEnding，把它当校验对象只会把随机性变成整幕失败。
  result.atEnding = actIndex + 1 >= endingActCount;
  if (!result.outcome.trim()) errors.push(error("outcome", "后果不能为空"));
  if (!result.nextScene.month.trim()) errors.push(error("nextScene.month", "下一幕时间不能为空"));
  if (!result.nextScene.text.trim()) errors.push(error("nextScene.text", "下一幕处境不能为空"));
  if (result.moves.length < 2 || result.moves.length > 3) errors.push(error("moves", "每幕必须有 2 到 3 个动作"));
  // 关系目标完整性**不在此处校验**：契约 §6 的硬拒收清单里没有这一项，且 `target` 由模型
  // 自由给出（真机实测会给「林女士」这类简称）。解析不了的条目由 applyRelations 丢弃——
  // 少一条态度变化，远好过因为一个称谓就废掉整幕（玩家只能干等重试）。
  if (hasCanonField(result)) errors.push(error("$", "幕推进结果不得包含 canon"));
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

/**
 * 归一化一条可见事实，用于比对：去掉空白与中英文标点、统一小写。
 *
 * 模型的「逐字摘取」几乎不会是字节级相同——常多一个句号、少一个顿号，
 * 所以必须在归一化之后比对，否则会把同一句话判成越界，整幕白跑。
 */
function normalizeFact(text: string): string {
  return String(text ?? "")
    .replace(/[\s\u3000]+/g, "")
    .replace(/[，。、；：！？·．,.;:!?"'（）()\[\]【】「」『』—-]/g, "")
    .toLowerCase();
}

/** 反向包含（模型把原文精简了）只在足够长时启用，避免「条件」这种短串误放。 */
const MIN_REVERSE_MATCH_LENGTH = 4;

/**
 * 角色位信息范围校验（契约 §6 硬约束、§0.7 形状）。
 *
 * `visibleFacts` 里**落在 `position.visible` 之外**的条目被**丢弃**（2026-09-14 起）：
 * 越界内容不进「知道」列表即无泄露——过滤本身就是完整的防护，再把整幕废掉
 * 只是惩罚玩家（真机实测模型偶尔会补一句范围外事实，废幕率不可接受）。
 *
 * 判定规则：归一化后**互相包含**——模型照抄、带标点差异、或适度精简都算通过。
 *
 * @returns 被丢弃的越界条目（调用方据此 console.warn 留痕）
 */
export function filterWithinVisible(result: ActAdvanceResult, position: Position): string[] {
  const allowed = position.visible.map(normalizeFact).filter(Boolean);
  const dropped: string[] = [];
  result.nextScene.visibleFacts = result.nextScene.visibleFacts.filter((fact) => {
    const needle = normalizeFact(fact);
    const hit =
      needle.length > 0 &&
      allowed.some(
        (item) =>
          needle.includes(item) ||
          (needle.length >= MIN_REVERSE_MATCH_LENGTH && item.includes(needle)),
      );
    if (!hit) dropped.push(fact);
    return hit;
  });
  return dropped;
}

/** 应用本幕账本增量。key 先归一到五维，归一化不了的条目按契约 §0.7 丢弃。 */
export function applyLedger(ledger: Ledger, deltas: LedgerDelta[]): Ledger {
  const next: Ledger = { ...EMPTY_LEDGER, ...ledger };
  deltas.forEach((delta) => {
    const key = normalizeLedgerKey(delta.key);
    if (!key) return;
    next[key] = next[key] + (Number(delta.delta) || 0);
  });
  return next;
}

/**
 * 应用本幕关系增量。
 *
 * `target` 先解析成角色位 id，解析不了则丢弃该条；态度值钳制在 -100..100
 * （与种子数据、`relationGate` 的取值范围一致）。
 */
export function applyRelations(
  relations: Record<string, number>,
  deltas: RelationDelta[],
  positions: Position[],
): Record<string, number> {
  const next = { ...relations };
  deltas.forEach((delta) => {
    const id = resolveRelationTarget(delta.target, positions);
    if (!id) return;
    next[id] = Math.max(-100, Math.min(100, (next[id] ?? 0) + (Number(delta.delta) || 0)));
  });
  return next;
}

export function relationGate(move: Move, relations: Record<string, number>): boolean {
  if (!move.relationGate) return true;
  return (relations[move.relationGate.positionId] ?? -100) >= move.relationGate.minimum;
}
