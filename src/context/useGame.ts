import { createContext, useContext } from "react";
import type { GameState, AppScreen, PatientProfile } from "../types";
import type { GameAction } from "./gameReducer";

export interface GameDispatchValue {
  dispatch: React.Dispatch<GameAction>;
  profiles: PatientProfile[];
}

// Three contexts instead of one, so each consumer subscribes to exactly the
// slice it depends on:
//   - screen: the router notifies only on actual screen changes, so play-time
//     dispatches never re-render the tree from the top
//   - dispatch + profiles: referentially stable for the provider's lifetime,
//     so command-only consumers (forms, buttons) never re-render from state
//   - state: for consumers that genuinely track play state
// This keeps any future high-frequency dispatcher (e.g. a per-card countdown
// timer) from re-rendering the whole app every tick.
//
// They live outside GameContext.tsx so Fast Refresh never re-runs
// createContext: a re-created context object orphans mounted consumers
// during HMR.
export const GameScreenContext = createContext<AppScreen | null>(null);
export const GameStateContext = createContext<GameState | null>(null);
export const GameDispatchContext = createContext<GameDispatchValue | null>(
  null,
);

export function useGameScreen(): AppScreen {
  const screen = useContext(GameScreenContext);
  if (screen === null)
    throw new Error("useGameScreen must be used within GameProvider");
  return screen;
}

export function useGameState(): GameState {
  const state = useContext(GameStateContext);
  if (!state) throw new Error("useGameState must be used within GameProvider");
  return state;
}

export function useGameDispatch(): GameDispatchValue {
  const ctx = useContext(GameDispatchContext);
  if (!ctx)
    throw new Error("useGameDispatch must be used within GameProvider");
  return ctx;
}
