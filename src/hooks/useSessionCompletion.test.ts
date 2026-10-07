import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSessionCompletion } from './useSessionCompletion'
import { profiles } from '../data/profiles'
import { SHEETS_WEBHOOK_URL } from '../config'

// Embedded in a cross-site iframe, the browser can refuse storage outright
// (Chrome incognito or third-party cookies blocked, `sandbox` without
// allow-same-origin), so the game keeps nothing locally: the sheet is the
// only record. Any storage access here throws and fails the test.
function forbidStorage() {
  const denied = () => {
    throw new DOMException('Access is denied for this document.', 'SecurityError')
  }
  vi.stubGlobal('localStorage', { getItem: denied, setItem: denied, removeItem: denied })
}

function finishGame() {
  renderHook(() =>
    useSessionCompletion({
      screen: 'summary',
      lastSessionId: 'session-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      specialty: 'Pediatrics',
      sessionResults: profiles.map((p) => ({
        profileId: p.id,
        playerSide: 'right' as const,
        correct: true,
        elapsedMs: 2_000,
      })),
      deck: profiles,
      maxStreak: profiles.length,
    }),
  )
}

describe('useSessionCompletion', () => {
  beforeEach(forbidStorage)
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('submits the result to the sheet without touching storage', () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response())
    vi.stubGlobal('fetch', fetchMock)

    expect(finishGame).not.toThrow()
    expect(fetchMock).toHaveBeenCalledWith(
      SHEETS_WEBHOOK_URL,
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('drops a failed upload silently', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    finishGame()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(consoleError).not.toHaveBeenCalled()
  })
})
