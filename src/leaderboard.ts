import type { SessionResult } from './game/sessionResult'

export interface LeaderboardEntry {
  username: string
  email?: string
  caseId: string
  score: number
  correct: number
  total: number
  sessionId: string
  timestamp: number
}

const LEADERBOARD_KEY = 'detect_leaderboard'

function load(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY)
    return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : []
  } catch {
    return []
  }
}

function save(entries: LeaderboardEntry[]): void {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries))
}

export function getLeaderboard(caseId?: string): LeaderboardEntry[] {
  const entries = load()
  return entries
    .filter((e) => !caseId || e.caseId === caseId)
    .sort((a, b) => b.score - a.score)
}

export function addLeaderboardEntry(entry: LeaderboardEntry): void {
  save([...load(), entry])
}

export function buildLeaderboardEntry(result: SessionResult): LeaderboardEntry {
  return {
    username: result.identity?.name ?? 'Table',
    email: result.identity?.email || undefined,
    caseId: result.cases[0]?.caseId ?? '',
    score: result.total.score,
    correct: result.total.correct,
    total: result.total.total,
    sessionId: result.sessionId,
    timestamp: result.completedAt,
  }
}
