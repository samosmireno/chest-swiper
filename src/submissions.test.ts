import { describe, it, expect, vi } from 'vitest'
import {
  matchesSubmission,
  makeSubmissionGateway,
  rowCase,
  type RawSubmission,
  type SubmissionTransport,
} from './submissions'
import { APP_VERSION, LEADERBOARD_WINDOW_MS } from './config'
import type { SessionResult } from './game/sessionResult'

// Offsets are expressed relative to the configured window so these stay correct
// if LEADERBOARD_WINDOW_MS changes.
const inWindow = () => new Date(Date.now() - LEADERBOARD_WINDOW_MS / 2).toISOString()
const beforeWindow = () => new Date(Date.now() - LEADERBOARD_WINDOW_MS - 60_000).toISOString()

describe('matchesSubmission', () => {
  it('matches a current-version row submitted within the display window', () => {
    expect(matchesSubmission({ app_version: APP_VERSION, submitted_at: inWindow() })).toBe(true)
  })

  it('coerces app_version numerically (Sheets stores "1.0" as a number)', () => {
    expect(matchesSubmission({ app_version: 1, submitted_at: inWindow() })).toBe(true)
  })

  it('rejects a row submitted before the window (older than the event boundary)', () => {
    expect(matchesSubmission({ app_version: APP_VERSION, submitted_at: beforeWindow() })).toBe(false)
  })

  it('rejects a mismatched app_version even when recent', () => {
    expect(matchesSubmission({ app_version: 99, submitted_at: inWindow() })).toBe(false)
  })

  it('rejects a row with missing or unparseable submitted_at', () => {
    expect(matchesSubmission({ app_version: APP_VERSION })).toBe(false)
    expect(matchesSubmission({ app_version: APP_VERSION, submitted_at: 'not-a-date' })).toBe(false)
  })
})

function fakeTransport(name: string, over: Partial<SubmissionTransport> = {}): SubmissionTransport {
  return {
    name,
    submit: vi.fn(async () => {}),
    fetchResults: vi.fn(async () => []),
    ...over,
  }
}

const result: SessionResult = {
  identity: null,
  sessionId: 'sess-1',
  completedAt: 1_700_000_000_000,
  durationSeconds: 60,
  total: { correct: 1, total: 1, score: 1, bonus: 0 },
  cases: [],
}

const matchingRow = (id: string): RawSubmission => ({
  app_version: APP_VERSION,
  submitted_at: new Date().toISOString(),
  session_id: id,
})

describe('submission gateway — write policy', () => {
  it('fans a submission out to every transport', () => {
    const a = fakeTransport('a')
    const b = fakeTransport('b')
    makeSubmissionGateway([a, b]).submitResult(result)
    expect(a.submit).toHaveBeenCalledTimes(1)
    expect(b.submit).toHaveBeenCalledTimes(1)
  })

  it('isolates failures so one dead transport does not block the others', async () => {
    const dead = fakeTransport('dead', { submit: vi.fn(async () => { throw new Error('down') }) })
    const live = fakeTransport('live')
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => makeSubmissionGateway([dead, live]).submitResult(result)).not.toThrow()
    await Promise.resolve() // flush the caught rejection
    expect(live.submit).toHaveBeenCalledTimes(1)
  })
})

describe('submission gateway — read policy', () => {
  it('returns matching rows from the first non-empty transport', async () => {
    const drupal = fakeTransport('drupal', { fetchResults: vi.fn(async () => [matchingRow('d1')]) })
    const sheets = fakeTransport('sheets', { fetchResults: vi.fn(async () => [matchingRow('s1')]) })
    const rows = await makeSubmissionGateway([drupal, sheets]).fetchResults()
    expect(rows.map((r) => r.session_id)).toEqual(['d1'])
    expect(sheets.fetchResults).not.toHaveBeenCalled()
  })

  it('falls back to the next transport when the first yields nothing', async () => {
    const drupal = fakeTransport('drupal', { fetchResults: vi.fn(async () => []) })
    const sheets = fakeTransport('sheets', { fetchResults: vi.fn(async () => [matchingRow('s1')]) })
    const rows = await makeSubmissionGateway([drupal, sheets]).fetchResults()
    expect(rows.map((r) => r.session_id)).toEqual(['s1'])
  })

  it('skips a throwing transport and tries the next', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const drupal = fakeTransport('drupal', { fetchResults: vi.fn(async () => { throw new Error('500') }) })
    const sheets = fakeTransport('sheets', { fetchResults: vi.fn(async () => [matchingRow('s1')]) })
    const rows = await makeSubmissionGateway([drupal, sheets]).fetchResults()
    expect(rows.map((r) => r.session_id)).toEqual(['s1'])
  })

  it('filters out rows that do not match the current summit/version', async () => {
    const t = fakeTransport('t', {
      fetchResults: vi.fn(async () => [matchingRow('ok'), { app_version: 99, submitted_at: new Date().toISOString() }]),
    })
    const rows = await makeSubmissionGateway([t]).fetchResults()
    expect(rows.map((r) => r.session_id)).toEqual(['ok'])
  })

  it('returns [] when no transport has matching rows', async () => {
    const a = fakeTransport('a', { fetchResults: vi.fn(async () => []) })
    const b = fakeTransport('b', { fetchResults: vi.fn(async () => []) })
    expect(await makeSubmissionGateway([a, b]).fetchResults()).toEqual([])
  })
})

describe('rowCase', () => {
  it('trusts an explicit case_id', () => {
    expect(rowCase({ case_id: 'case2', case1_total: 3 })).toBe('case2')
  })

  it('infers case2 from a populated case2_total when case1_total is absent', () => {
    expect(rowCase({ case2_total: 3, case2_score: 600 })).toBe('case2')
  })

  it('infers case1 likewise', () => {
    expect(rowCase({ case1_total: 3, case1_score: 300 })).toBe('case1')
  })

  it('returns null for a cumulative legacy row with both totals', () => {
    expect(rowCase({ case1_total: 3, case2_total: 3 })).toBeNull()
  })

  it('returns null when no case column is populated', () => {
    expect(rowCase({ session_id: 'x' })).toBeNull()
  })
})
