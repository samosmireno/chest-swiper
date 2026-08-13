import { createContext, useContext } from "react";
import type { GameState, PatientProfile } from "../types";
import type { GameAction } from "./gameReducer";

export interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  profiles: PatientProfile[];
}

// Lives outside GameContext.tsx so Fast Refresh never re-runs createContext:
// a re-created context object orphans mounted consumers during HMR.
export const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
