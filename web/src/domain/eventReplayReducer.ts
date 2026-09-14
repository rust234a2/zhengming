/**
 * 事件推演 · 运行态 reducer（纯函数，无 IO）
 *
 * 设计要点（对齐 event-replay-PLAN.md §3.2）：
 *  - 只有一条前进轴：**没有 REWIND**——代价不可撤销是本版的核心体验。
 *  - 结构字段与叙事字段分离：流式增量只进 `streamingOutcome`，只有完整结果
 *    （已过 `validateActAdvanceResult` + `filterWithinVisible` + `assertNoCanonLeak`）
 *    才能把 `currentScene` / `currentMoves` 换掉。**绝不允许玩家点到半成品动作**。
 *  - 失败即失败：`ADVANCE_FAILED` 丢弃半截输出、不落 `history`，重试是整幕重来。
 *  - 原作（canon）默认恒为 null，只有终局 `REVEAL_CANON` 才可能非空——
 *    保证展开前 DOM 里搜不到任何原作文本。
 */

import { applyLedger, applyRelations, relationGate } from "./eventReplay";
import type {
  ActAdvanceResult,
  EventReplay,
  Ledger,
  Move,
  PlayedAct,
  ReplayAction,
  ReplayState,
} from "../types/eventReplay";

const EMPTY_LEDGER: Ledger = {
  time: 0,
  money: 0,
  relation: 0,
  health: 0,
  opportunity: 0,
};

export function createInitialReplayState(event: EventReplay): ReplayState {
  return {
    eventId: event.header.id,
    positionId: null,
    actIndex: 0,
    currentScene: "",
    currentMoves: [],
    history: [],
    ledger: { ...EMPTY_LEDGER },
    relations: {},
    pending: false,
    pendingMoveId: null,
    pendingError: null,
    streamingOutcome: "",
    ended: false,
    ending: null,
    canonRevealed: false,
    canon: null,
  };
}

/**
 * 某个动作当前是否可选。
 *
 * 三条门槛：已选角色位 · 未在请求中 · 未收束；外加**关系反向限制**
 * （`relationGate`：关系值不够时该动作被锁定，例如"请伴侣让步"需要关系 ≥ 某值）。
 */
export function canChooseMove(state: ReplayState, move: Move): boolean {
  if (!state.positionId || state.pending || state.ended) return false;
  return relationGate(move, state.relations);
}

/** 关系门槛未满足的原因（描述式，非指控式），供界面解释为何不可选。 */
export function relationGateReason(move: Move): string | null {
  if (!move.relationGate) return null;
  return "这一步需要先改善与对方的关系";
}

export function replayReducer(
  event: EventReplay,
  state: ReplayState,
  action: ReplayAction,
): ReplayState {
  switch (action.type) {
    case "SELECT_POSITION": {
      // 已经开演就不许换位；换角色位必须走 RESTART（代价不可撤销）
      if (state.pending || state.history.length > 0) return state;
      const position = event.positions.find((item) => item.id === action.positionId);
      if (!position) return state;
      const relations: Record<string, number> = {};
      position.relations.forEach((relation) => {
        relations[relation.to] = relation.attitude;
      });
      return {
        ...state,
        positionId: position.id,
        relations,
        actIndex: 0,
        currentScene: "",
        currentMoves: [],
        pending: true,
        pendingMoveId: null,
        pendingError: null,
        streamingOutcome: "",
      };
    }

    case "ACT_CHOSEN": {
      const move = state.currentMoves.find((item) => item.id === action.moveId);
      if (!move) return state;
      if (!canChooseMove(state, move)) return state;
      return {
        ...state,
        pending: true,
        pendingMoveId: move.id,
        pendingError: null,
        streamingOutcome: "",
      };
    }

    case "ADVANCE_STREAM": {
      if (!state.pending) return state;
      return { ...state, streamingOutcome: state.streamingOutcome + action.text };
    }

    case "ADVANCE_SUCCEEDED": {
      if (!state.pending) return state;
      const result: ActAdvanceResult = action.result;
      const settled: ReplayState = {
        ...state,
        pending: false,
        pendingMoveId: null,
        pendingError: null,
        streamingOutcome: "",
        currentScene: result.nextScene.text,
        currentMoves: result.moves,
      };

      // 开局（chosenMoveId === null）：没有"决定"可言，不落 history、不结算
      if (action.chosenMoveId === null) {
        return settled;
      }

      const move = state.currentMoves.find((item) => item.id === action.chosenMoveId);
      if (!move) return state;

      const played: PlayedAct = {
        actIndex: state.actIndex,
        moveId: move.id,
        moveText: move.text,
        moveLabel: move.label,
        outcome: result.outcome,
        ledgerDeltas: result.ledgerDeltas,
        relationDeltas: result.relationDeltas,
      };
      const nextActIndex = state.actIndex + 1;
      const ended = nextActIndex >= event.header.endingCondition.actCount;
      return {
        ...settled,
        actIndex: nextActIndex,
        history: [...state.history, played],
        ledger: applyLedger(state.ledger, result.ledgerDeltas),
        // target 由模型自由给出，需角色位表才能解析回 id（契约 §0.7）
        relations: applyRelations(state.relations, result.relationDeltas, event.positions),
        ended,
        // 收束后不再提供动作——避免"结局之后还能点"
        currentMoves: ended ? [] : result.moves,
      };
    }

    case "ADVANCE_FAILED": {
      if (!state.pending) return state;
      // 半截输出：**留在屏上但标「未完成」**，绝不写 currentScene、绝不落 history。
      // 重试走 RETRY（整幕重新生成，届时才清空这段文本）。
      return {
        ...state,
        pending: false,
        pendingMoveId: null,
        pendingError: action.message,
      };
    }

    case "RETRY": {
      // 整幕重新生成：清掉上一轮残留的半截文本后重新进入 pending
      if (state.ended) return state;
      return {
        ...state,
        pending: true,
        pendingMoveId: null,
        pendingError: null,
        streamingOutcome: "",
      };
    }

    case "ENDING_RECEIVED": {
      if (!state.ended) return state;
      return { ...state, ending: action.ending };
    }

    case "REVEAL_CANON": {
      // 只有收束之后才允许揭示；揭示是一个一次性开关
      if (!state.ended || state.canonRevealed) return state;
      return { ...state, canonRevealed: true, canon: action.canon };
    }

    case "RESTART": {
      return createInitialReplayState(event);
    }

    default:
      return state;
  }
}
