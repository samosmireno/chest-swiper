import { describe, it, expect, beforeEach } from 'vitest'
import { addLeaderboardEntry, getLeaderboard, buildLeaderboardEntry } from './leaderboard'
import type { SessionResult } from './game/sessionResult'

beforeEach(() => localStorage.clear())

function result(overrides: Partial<SessionResult> = {}): SessionResult {
  return {
    identity: { name: 'Table 4', email: '', specialty: '', type: 'team' },
    sessionId: 'sess-1',
    completedAt: 1_700_000_000_000,
    durationSeconds: 60,
    total: { correct: 5, total: 6, score: 950, bonus: 0 },
    cases: [],
    ...overrides,
  }
}

describe('leaderboard store', () => {
  it('buildLeaderboardEntry projects score/correct/total/name/sessionId from the result', () => {
    const e = buildLeaderboardEntry(result())
    expect(e).toMatchObject({ username: 'Table 4', score: 950, correct: 5, total: 6, sessionId: 'sess-1' })
    expect(e.timestamp).toBe(1_700_000_000_000)
  })

  it('falls back to "Table" when the session has no identity', () => {
    expect(buildLeaderboardEntry(result({ identity: null })).username).toBe('Table')
  })

  it('omits empty email', () => {
    expect(buildLeaderboardEntry(result()).email).toBeUndefined()
  })

  it('getLeaderboard returns entries sorted by score desc', () => {
    addLeaderboardEntry(buildLeaderboardEntry(result({ sessionId: 's1', total: { correct: 0, total: 6, score: 300, bonus: 0 }, identity: { name: 'A', email: '', specialty: '', type: 'team' } })))
    addLeaderboardEntry(buildLeaderboardEntry(result({ sessionId: 's2', total: { correct: 0, total: 6, score: 900, bonus: 0 }, identity: { name: 'B', email: '', specialty: '', type: 'team' } })))
    expect(getLeaderboard().map((e) => e.username)).toEqual(['B', 'A'])
  })

  it('buildLeaderboardEntry records the caseId from the first case', () => {
    const e = buildLeaderboardEntry(
      result({ cases: [{ caseId: 'case2', line: { correct: 0, total: 0, score: 0, bonus: 0 }, answers: [] }] }),
    )
    expect(e.caseId).toBe('case2')
  })

  it('getLeaderboard(caseId) returns only that case, sorted by score desc', () => {
    const make = (sessionId: string, caseId: string, score: number) =>
      buildLeaderboardEntry(
        result({
          sessionId,
          total: { correct: 0, total: 3, score, bonus: 0 },
          cases: [{ caseId, line: { correct: 0, total: 3, score, bonus: 0 }, answers: [] }],
          identity: { name: sessionId, email: '', specialty: '', type: 'team' },
        }),
      )
    addLeaderboardEntry(make('a', 'case1', 100))
    addLeaderboardEntry(make('b', 'case2', 900))
    addLeaderboardEntry(make('c', 'case1', 300))
    expect(getLeaderboard('case1').map((e) => e.username)).toEqual(['c', 'a'])
    expect(getLeaderboard('case2').map((e) => e.username)).toEqual(['b'])
  })
})
