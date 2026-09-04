import type {
  GameState,
  SessionResult,
  CumulativeStats,
  ClockState,
  PatientProfile,
  SwipeSide,
} from "../types";

// ─── Actions ────────────────────────────────────────────────
export type GameAction =
  | { type: "START_GAME"; deck: PatientProfile[] }
  | { type: "SET_PLAYER"; firstName: string; lastName: string; email: string; specialty: string }
  | { type: "SWIPE"; profileId: string; side: SwipeSide; elapsedMs: number }
  | { type: "ADVANCE" }
  // Session-clock edges, stamped with performance.now() by the card itself:
  // the top card became interactive / the swipe or tap committed (before the
  // fly-off — ~300ms before the SWIPE that carries the result).
  | { type: "CARD_SHOWN"; at: number }
  | { type: "CARD_COMMITTED"; at: number }
  | { type: "RESET" };

// ─── Cumulative stats update ─────────────────────────────────
function updateCumulativeStats(
  current: CumulativeStats,
  results: SessionResult[],
): CumulativeStats {
  const perCard = { ...current.perCard };
  for (const result of results) {
    const existing = perCard[result.profileId] ?? {
      timesShown: 0,
      timesCorrect: 0,
    };
    perCard[result.profileId] = {
      timesShown: existing.timesShown + 1,
      timesCorrect: existing.timesCorrect + (result.correct ? 1 : 0),
    };
  }
  return { totalSessions: current.totalSessions + 1, perCard };
}

// ─── Initial state ────────────────────────────────────────────
const pausedClock: ClockState = { accumulatedMs: 0, runningSince: null };

export const initialState: GameState = {
  screen: "idle",
  deck: [],
  currentIndex: 0,
  sessionResults: [],
  lastResult: null,
  cumulativeStats: { totalSessions: 0, perCard: {} },
  streak: 0,
  firstName: "",
  lastName: "",
  email: "",
  specialty: "",
  maxStreak: 0,
  lastSessionId: "",
  clock: pausedClock,
};

// ─── Reducer ─────────────────────────────────────────────────
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME":
      return {
        ...state,
        screen: "playing",
        deck: action.deck,
        currentIndex: 0,
        sessionResults: [],
        lastResult: null,
        streak: 0,
        maxStreak: 0,
        lastSessionId: "",
        clock: pausedClock,
      };

    case "SWIPE": {
      const profile = state.deck[state.currentIndex];
      if (!profile) return state;
      const correct = action.side === profile.correctSide;
      const result: SessionResult = {
        profileId: action.profileId,
        playerSide: action.side,
        correct,
        elapsedMs: action.elapsedMs,
      };
      const newResults = [...state.sessionResults, result];
      const newStreak = correct ? state.streak + 1 : 0;
      const newMaxStreak = Math.max(state.maxStreak, newStreak);
      // The clock normally pauses at CARD_COMMITTED; a SWIPE that finds it
      // still running pauses it here with the same elapsed time, so
      // accumulatedMs always equals the sum of the results' elapsedMs.
      const clock: ClockState =
        state.clock.runningSince === null
          ? state.clock
          : {
              accumulatedMs: state.clock.accumulatedMs + action.elapsedMs,
              runningSince: null,
            };

      return {
        ...state,
        sessionResults: newResults,
        lastResult: result,
        streak: newStreak,
        maxStreak: newMaxStreak,
        clock,
      };
    }

    case "CARD_SHOWN":
      // The top card just became interactive: the clock runs from here.
      if (state.screen !== "playing") return state;
      return { ...state, clock: { ...state.clock, runningSince: action.at } };

    case "CARD_COMMITTED": {
      // The swipe/tap committed: bank this card's interactive time and pause.
      // Rounded the way CardStack rounds elapsedMs, from the same timestamps,
      // so the banked total matches the results to the millisecond.
      const { accumulatedMs, runningSince } = state.clock;
      if (runningSince === null) return state;
      return {
        ...state,
        clock: {
          accumulatedMs: accumulatedMs + Math.max(0, Math.round(action.at - runningSince)),
          runningSince: null,
        },
      };
    }

    case "ADVANCE": {
      if (state.sessionResults.length <= state.currentIndex) return state;
      const newIndex = state.currentIndex + 1;
      const isLastCard = newIndex >= state.deck.length;

      if (isLastCard) {
        const newStats = updateCumulativeStats(
          state.cumulativeStats,
          state.sessionResults,
        );
        return {
          ...state,
          screen: "summary",
          currentIndex: newIndex,
          cumulativeStats: newStats,
          lastSessionId: crypto.randomUUID(),
        };
      }

      return { ...state, currentIndex: newIndex };
    }

    case "SET_PLAYER":
      return {
        ...state,
        firstName: action.firstName,
        lastName: action.lastName,
        email: action.email,
        specialty: action.specialty,
      };

    case "RESET":
      return {
        ...state,
        screen: "idle",
        deck: [],
        currentIndex: 0,
        sessionResults: [],
        lastResult: null,
        streak: 0,
        firstName: "",
        lastName: "",
        email: "",
        specialty: "",
        maxStreak: 0,
        lastSessionId: "",
        clock: pausedClock,
      };

    default:
      return state;
  }
}
