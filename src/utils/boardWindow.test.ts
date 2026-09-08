import { describe, it, expect } from 'vitest'
import { parseBoardWindow, getLeaderboardWindowMs } from './boardWindow'
import { LEADERBOARD_WINDOW_MS } from '../config'

const HOUR = 3_600_000
const FALLBACK = 5 * HOUR

describe('parseBoardWindow', () => {
  it('falls back when the param is absent', () => {
    expect(parseBoardWindow(null, FALLBACK)).toBe(FALLBACK)
    expect(parseBoardWindow(undefined, null)).toBeNull()
  })

  it('"all" means enduring (no window)', () => {
    expect(parseBoardWindow('all', FALLBACK)).toBeNull()
    expect(parseBoardWindow(' ALL ', FALLBACK)).toBeNull()
  })

  it('parses minutes, hours and days', () => {
    expect(parseBoardWindow('90m', FALLBACK)).toBe(90 * 60_000)
    expect(parseBoardWindow('12h', FALLBACK)).toBe(12 * HOUR)
    expect(parseBoardWindow('3d', FALLBACK)).toBe(72 * HOUR)
    expect(parseBoardWindow('1.5h', FALLBACK)).toBe(1.5 * HOUR)
  })

  it('a bare number is hours', () => {
    expect(parseBoardWindow('8', FALLBACK)).toBe(8 * HOUR)
  })

  it('falls back on junk, zero and negatives rather than emptying the board', () => {
    for (const bad of ['', 'soon', '0', '0h', '-2h', '2w', 'h']) {
      expect(parseBoardWindow(bad, FALLBACK), bad).toBe(FALLBACK)
    }
  })
})

describe('getLeaderboardWindowMs', () => {
  function withSearch(search: string, fn: () => void) {
    const before = window.location.href
    window.history.replaceState(null, '', search || window.location.pathname)
    try {
      fn()
    } finally {
      window.history.replaceState(null, '', before)
    }
  }

  it('uses the config default with no ?board param', () => {
    withSearch('', () => {
      expect(getLeaderboardWindowMs()).toBe(LEADERBOARD_WINDOW_MS)
    })
  })

  it('reads ?board from the page URL', () => {
    withSearch('?board=all', () => {
      expect(getLeaderboardWindowMs()).toBeNull()
    })
    withSearch('?fps=1&board=2d', () => {
      expect(getLeaderboardWindowMs()).toBe(48 * HOUR)
    })
  })
})
