import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import type { GameState, Identity, SummitCase } from '../types'
import { makeGameReducer, makeInitialState, type GameAction } from '../game/machine'
import { useSessionCompletion } from '../hooks/useSessionCompletion'

interface GameContextValue {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  cases: SummitCase[]
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({
  children,
  cases,
  initialIdentity = null,
}: {
  children: ReactNode
  cases: SummitCase[]
  initialIdentity?: Identity | null
}) {
  const reducer = useMemo(() => makeGameReducer(cases), [cases])
  const [state, dispatch] = useReducer(reducer, null, () => makeInitialState(cases, initialIdentity))

  useSessionCompletion(state, cases)

  return <GameContext.Provider value={{ state, dispatch, cases }}>{children}</GameContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
