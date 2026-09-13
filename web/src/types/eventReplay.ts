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
