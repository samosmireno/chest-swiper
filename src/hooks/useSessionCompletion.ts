import { useEffect, useRef } from 'react'
import type { GameState, SummitCase } from '../types'
import { addLeaderboardEntry, buildLeaderboardEntry } from '../leaderboard'
import { summarizeSession } from '../game/sessionResult'
import { submissions } from '../submissions'
import { useAnalytics } from './useAnalytics'

export function useSessionCompletion(state: GameState, cases: SummitCase[]): void {
  const { trackGameCompleted } = useAnalytics()
  const saved = useRef('')

  const onSummary = state.steps[state.cursor]?.kind === 'summary'

  useEffect(() => {
    if (!onSummary || state.sessionId === '' || state.sessionId === saved.current) return
    saved.current = state.sessionId

    const result = summarizeSession(state, cases, Date.now())

    addLeaderboardEntry(buildLeaderboardEntry(result))
    submissions.submitResult(result)
    trackGameCompleted({
      score: result.total.score,
      correct: result.total.correct,
      total: result.total.total,
      duration_seconds: result.durationSeconds,
    })
  }, [onSummary, state.sessionId, state, cases, trackGameCompleted])
}
