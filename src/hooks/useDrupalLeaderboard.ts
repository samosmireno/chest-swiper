import { useEffect, useState } from 'react'
import type { LeaderboardEntry } from '../leaderboard'
import { getLeaderboard } from '../leaderboard'
import { DRUPAL_RESULTS_URL, LEADERBOARD_POLL_MS, LEADERBOARD_WINDOW_MS } from '../config'
import { submissions, rowCase, type RawSubmission } from '../submissions'

// Local-storage fallback mirror of the remote withinWindow gate: only entries
// completed within the rolling display window belong on the board, so stale
// rows from a prior summit/day never leak in when there's no remote data yet.
function recentLocal(caseId: string): LeaderboardEntry[] {
  return getLeaderboard(caseId).filter((e) => Date.now() - e.timestamp < LEADERBOARD_WINDOW_MS)
}

function transform(subs: RawSubmission[]): LeaderboardEntry[] {
  return subs
    .map((sub) => ({
      username: String(sub.participant_name ?? ''),
      email: sub.email ? String(sub.email) : undefined,
      caseId: rowCase(sub) ?? '',
      score: Number(sub.total_score),
      correct: Number(sub.total_correct),
      total: Number(sub.total_questions),
      sessionId: String(sub.session_id ?? sub.submitted_at),
      timestamp: new Date(String(sub.submitted_at)).getTime(),
    }))
    .sort((a, b) => b.score - a.score)
}

function attachCurrentPlayer(
  entries: LeaderboardEntry[],
  sessionId: string,
  caseId: string,
): LeaderboardEntry[] {
  const local = getLeaderboard(caseId).find((e) => e.sessionId === sessionId)
  if (!local) return entries
  const idx = entries.findIndex((e) => e.sessionId === sessionId)
  if (idx >= 0) return entries
  return [...entries, local].sort((a, b) => b.score - a.score)
}

export function useDrupalLeaderboard(
  sessionId: string,
  caseId: string,
): { entries: LeaderboardEntry[]; loading: boolean } {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => recentLocal(caseId))
  const [loading, setLoading] = useState(!!DRUPAL_RESULTS_URL)

  useEffect(() => {
    if (!DRUPAL_RESULTS_URL) return
    let cancelled = false

    const tick = async () => {
      try {
        const subs = (await submissions.fetchResults()).filter((s) => rowCase(s) === caseId)
        if (cancelled || subs.length === 0) return
        let result = transform(subs)
        if (sessionId) result = attachCurrentPlayer(result, sessionId, caseId)
        setEntries(result)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    tick()
    const id = setInterval(tick, LEADERBOARD_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [sessionId, caseId])

  return { entries, loading }
}
