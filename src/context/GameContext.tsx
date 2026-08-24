import { useMemo, useReducer, type ReactNode } from "react";
import type { PatientProfile } from "../types";
import { useSessionCompletion } from "../hooks/useSessionCompletion";
import { loadCumulativeStats } from "../utils/statsStorage";
import { gameReducer, initialState } from "./gameReducer";
import {
  GameDispatchContext,
  GameScreenContext,
  GameStateContext,
} from "./useGame";

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
    deck,
  } = state;

  useSessionCompletion({ screen, lastSessionId, firstName, lastName, email, specialty, sessionResults, deck, maxStreak, cumulativeStats });

  const dispatchValue = useMemo(() => ({ dispatch, profiles }), [profiles]);

  return (
    <GameDispatchContext.Provider value={dispatchValue}>
      <GameScreenContext.Provider value={state.screen}>
        <GameStateContext.Provider value={state}>
          {children}
        </GameStateContext.Provider>
      </GameScreenContext.Provider>
    </GameDispatchContext.Provider>
  );
}
