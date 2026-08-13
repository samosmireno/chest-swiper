import { useReducer, type ReactNode } from "react";
import type { PatientProfile } from "../types";
import { useSessionCompletion } from "../hooks/useSessionCompletion";
import { loadCumulativeStats } from "../utils/statsStorage";
import { gameReducer, initialState } from "./gameReducer";
import { GameContext } from "./useGame";

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

  return (
    <GameContext.Provider value={{ state, dispatch, profiles }}>
      {children}
    </GameContext.Provider>
  );
}
