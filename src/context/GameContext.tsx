import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { GameState, PatientProfile, SessionResult, CumulativeStats, SwipeSide } from "../types";
import { useAnalytics } from "../hooks/useAnalytics";
import { useSessionCompletion } from "../hooks/useSessionCompletion";
import { loadCumulativeStats } from "../utils/statsStorage";
import { STREAK_MILESTONES } from "../config";

// ─── Actions ────────────────────────────────────────────────
type GameAction =
  | { type: "START_GAME"; deck: PatientProfile[] }
  | { type: "SET_PLAYER"; firstName: string; lastName: string; email: string; specialty: string }
  | { type: "SWIPE"; profileId: string; side: SwipeSide }
  | { type: "ADVANCE" }
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
// eslint-disable-next-line react-refresh/only-export-components
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
};

// ─── Reducer ─────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
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
      };

    case "SWIPE": {
      const profile = state.deck[state.currentIndex];
      if (!profile) return state;
      const correct = action.side === profile.correctSide;
      const result: SessionResult = {
        profileId: action.profileId,
        playerSide: action.side,
        correct,
      };
      const newResults = [...state.sessionResults, result];
      const newStreak = correct ? state.streak + 1 : 0;
      const newMaxStreak = Math.max(state.maxStreak, newStreak);

      return {
        ...state,
        sessionResults: newResults,
        lastResult: result,
        streak: newStreak,
        maxStreak: newMaxStreak,
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
      };

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────
interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  profiles: PatientProfile[];
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({
  children,
  profiles,
}: {
  children: ReactNode;
  profiles: PatientProfile[];
}) {
  const [state, dispatch] = useReducer(gameReducer, {
    ...initialState,
    cumulativeStats: loadCumulativeStats(),
  });

  const { trackCardDecision, trackStreakMilestone } = useAnalytics();

  const prevResultsLength = useRef(0);
  const prevStreak = useRef(0);

  const {
    screen,
    lastSessionId,
    cumulativeStats,
    firstName,
    lastName,
    email,
    specialty,
    sessionResults,
    maxStreak,
    lastResult,
    streak,
    deck,
  } = state;

  useSessionCompletion({ screen, lastSessionId, firstName, lastName, email, specialty, sessionResults, deck, maxStreak, cumulativeStats });

  // Reset per-swipe tracking refs on each new session
  useEffect(() => {
    if (screen === "playing") {
      prevResultsLength.current = 0;
      prevStreak.current = 0;
    }
  }, [screen]);

  // Track card decisions and streak milestones after each swipe
  useEffect(() => {
    if (!lastResult || sessionResults.length === prevResultsLength.current) return;
    const swipedCardIndex = sessionResults.length - 1;
    prevResultsLength.current = sessionResults.length;

    const profile = deck.find((p) => p.id === lastResult.profileId);
    if (profile) {
      const chosenLabel =
        lastResult.playerSide === "left"
          ? profile.leftOption
          : profile.rightOption;
      trackCardDecision({
        profile_id: lastResult.profileId,
        patient_topic: profile.topic,
        player_action: chosenLabel,
        correct: lastResult.correct,
        streak_at_time: streak,
        card_index: swipedCardIndex,
      });
    }

    if (streak > prevStreak.current && STREAK_MILESTONES.some((m) => m.streak === streak)) {
      trackStreakMilestone(streak);
    }
    prevStreak.current = streak;
  }, [sessionResults.length, lastResult, streak, deck, trackCardDecision, trackStreakMilestone]);

  return (
    <GameContext.Provider value={{ state, dispatch, profiles }}>
      {children}
    </GameContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
