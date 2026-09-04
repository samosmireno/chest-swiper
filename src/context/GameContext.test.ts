import { describe, it, expect } from 'vitest'
import { gameReducer, initialState } from './gameReducer'
import { buildLeaderboardEntry, calculateScore, computeSpeedBonus, computeTotalMs, scoreBreakdown } from '../leaderboard'
import { profiles } from '../data/profiles'

describe('gameReducer', () => {
  it('START_GAME sets screen to playing with the provided deck', () => {
    const state = gameReducer(initialState, { type: 'START_GAME', deck: profiles })
    expect(state.screen).toBe('playing')
    expect(state.deck).toBe(profiles)
    expect(state.currentIndex).toBe(0)
    expect(state.sessionResults).toHaveLength(0)
    expect(state.lastResult).toBeNull()
  })

  it('SWIPE records correct result without advancing index', () => {
    let state = gameReducer(initialState, { type: 'START_GAME', deck: profiles })
    const topCard = state.deck[0]
    state = gameReducer(state, {
      type: 'SWIPE',
      profileId: topCard.id,
      side: topCard.correctSide,
      elapsedMs: 4000,
    })
    expect(state.currentIndex).toBe(0)
    expect(state.sessionResults).toHaveLength(1)
    expect(state.lastResult?.correct).toBe(true)
    expect(state.lastResult?.elapsedMs).toBe(4000)
    expect(state.screen).toBe('playing')
  })

  it('SWIPE records incorrect result when wrong side chosen', () => {
    let state = gameReducer(initialState, { type: 'START_GAME', deck: profiles })
    const topCard = state.deck[0]
    const wrongSide = topCard.correctSide === 'left' ? 'right' : 'left'
    state = gameReducer(state, {
      type: 'SWIPE',
      profileId: topCard.id,
      side: wrongSide,
      elapsedMs: 4000,
    })
    expect(state.lastResult?.correct).toBe(false)
    expect(state.currentIndex).toBe(0)
  })

  it('ADVANCE bumps currentIndex when not on last card', () => {
    let state = gameReducer(initialState, { type: 'START_GAME', deck: profiles })
    const topCard = state.deck[0]
    state = gameReducer(state, { type: 'SWIPE', profileId: topCard.id, side: topCard.correctSide, elapsedMs: 4000 })
    state = gameReducer(state, { type: 'ADVANCE' })
    expect(state.currentIndex).toBe(1)
    expect(state.screen).toBe('playing')
  })

  it('ADVANCE on last card transitions to summary and increments totalSessions', () => {
    let state = gameReducer(initialState, { type: 'START_GAME', deck: profiles })
    for (let i = 0; i < state.deck.length; i++) {
      const card = state.deck[i]
      state = gameReducer(state, { type: 'SWIPE', profileId: card.id, side: card.correctSide, elapsedMs: 4000 })
      state = gameReducer(state, { type: 'ADVANCE' })
    }
    expect(state.screen).toBe('summary')
    expect(state.cumulativeStats.totalSessions).toBe(1)
    expect(Object.keys(state.cumulativeStats.perCard)).toHaveLength(profiles.length)
    expect(state.lastSessionId).not.toBe('')
  })

  it('ADVANCE on last card records timesShown and timesCorrect in perCard', () => {
    let state = gameReducer(initialState, { type: 'START_GAME', deck: profiles })
    const firstCard = state.deck[0]
    state = gameReducer(state, { type: 'SWIPE', profileId: firstCard.id, side: firstCard.correctSide, elapsedMs: 4000 })
    state = gameReducer(state, { type: 'ADVANCE' })
    for (let i = 1; i < state.deck.length; i++) {
      const card = state.deck[i]
      const wrong = card.correctSide === 'left' ? 'right' : 'left'
      state = gameReducer(state, { type: 'SWIPE', profileId: card.id, side: wrong, elapsedMs: 4000 })
      state = gameReducer(state, { type: 'ADVANCE' })
    }
    expect(state.cumulativeStats.perCard[firstCard.id]).toEqual({ timesShown: 1, timesCorrect: 1 })
    const second = state.deck[1]
    expect(state.cumulativeStats.perCard[second.id]).toEqual({ timesShown: 1, timesCorrect: 0 })
  })

  it('ADVANCE with no swipes is a no-op', () => {
    let state = gameReducer(initialState, { type: 'START_GAME', deck: profiles })
    const before = state
    state = gameReducer(state, { type: 'ADVANCE' })
    expect(state).toBe(before)
  })

  it('RESET returns to idle and clears session results', () => {
    let state = gameReducer(initialState, { type: 'START_GAME', deck: profiles })
    state = gameReducer(state, {
      type: 'SWIPE',
      profileId: state.deck[0].id,
      side: state.deck[0].correctSide,
      elapsedMs: 4000,
    })
    state = gameReducer(state, { type: 'RESET' })
    expect(state.screen).toBe('idle')
    expect(state.sessionResults).toHaveLength(0)
    expect(state.lastResult).toBeNull()
    expect(state.deck).toHaveLength(0)
  })

  it('SET_PLAYER stores firstName, lastName, email, and specialty in state', () => {
    const state = gameReducer(initialState, {
      type: 'SET_PLAYER',
      firstName: 'Dr',
      lastName: 'Smith',
      email: 'smith@hospital.com',
      specialty: 'Adult/general endocrinology or diabetology',
    })
    expect(state.firstName).toBe('Dr')
    expect(state.lastName).toBe('Smith')
    expect(state.email).toBe('smith@hospital.com')
    expect(state.specialty).toBe('Adult/general endocrinology or diabetology')
    expect(state.screen).toBe('idle') // no screen transition
  })

  it('SWIPE tracks maxStreak — never decreases during session', () => {
    let state = gameReducer(
      { ...initialState, firstName: 'Dr', lastName: 'Smith' },
      { type: 'START_GAME', deck: profiles },
    )
    // correct → streak 1, maxStreak 1
    state = gameReducer(state, {
      type: 'SWIPE',
      profileId: state.deck[0].id,
      side: state.deck[0].correctSide,
      elapsedMs: 4000,
    })
    state = gameReducer(state, { type: 'ADVANCE' })
    expect(state.streak).toBe(1)
    expect(state.maxStreak).toBe(1)

    // wrong → streak 0, maxStreak still 1
    const wrongSide = state.deck[1].correctSide === 'left' ? 'right' : 'left'
    state = gameReducer(state, {
      type: 'SWIPE',
      profileId: state.deck[1].id,
      side: wrongSide,
      elapsedMs: 4000,
    })
    state = gameReducer(state, { type: 'ADVANCE' })
    expect(state.streak).toBe(0)
    expect(state.maxStreak).toBe(1)
  })

  it('SWIPE on last card sets lastSessionId to a non-empty string', () => {
    let state = gameReducer(
      { ...initialState, firstName: 'Dr', lastName: 'Smith', email: 'smith@h.com' },
      { type: 'START_GAME', deck: profiles },
    )
    for (let i = 0; i < state.deck.length; i++) {
      const card = state.deck[i]
      state = gameReducer(state, {
        type: 'SWIPE',
        profileId: card.id,
        side: card.correctSide,
        elapsedMs: 4000,
      })
      state = gameReducer(state, { type: 'ADVANCE' })
    }
    expect(state.screen).toBe('summary')
    expect(state.lastSessionId).toBeTruthy()
  })

  it('RESET clears firstName, lastName, specialty, email, maxStreak, and lastSessionId', () => {
    let state = gameReducer(initialState, {
      type: 'SET_PLAYER',
      firstName: 'Dr',
      lastName: 'Smith',
      email: 'smith@hospital.com',
      specialty: 'Diabetes educator / CDCES',
    })
    state = gameReducer(state, { type: 'START_GAME', deck: profiles })
    state = gameReducer(state, { type: 'RESET' })
    expect(state.firstName).toBe('')
    expect(state.lastName).toBe('')
    expect(state.specialty).toBe('')
    expect(state.email).toBe('')
    expect(state.maxStreak).toBe(0)
    expect(state.lastSessionId).toBe('')
  })
})

describe('buildLeaderboardEntry', () => {
  const results = [
    { profileId: 'c1', playerSide: 'right' as const, correct: true, elapsedMs: 3000 },
    { profileId: 'c2', playerSide: 'left' as const, correct: false, elapsedMs: 60000 },
    { profileId: 'c3', playerSide: 'right' as const, correct: true, elapsedMs: 5000 },
  ]

  it('computes score as correct*100 + maxStreak*10 + speed bonus', () => {
    // c1 and c3 both inside the 5s grace window → 0.5 each, summing to 1;
    // c2 is wrong, so its time earns nothing.
    const entry = buildLeaderboardEntry('DrSmith', 'smith@h.com', results, 2, 'session-1')
    expect(entry.score).toBe(2 * 100 + 2 * 10 + 1) // 221
  })

  it('counts correct and total from results', () => {
    const entry = buildLeaderboardEntry('DrSmith', 'smith@h.com', results, 2, 'session-1')
    expect(entry.correct).toBe(2)
    expect(entry.total).toBe(3)
  })

  it('omits email field when email is empty string', () => {
    const entry = buildLeaderboardEntry('DrSmith', '', results, 2, 'session-1')
    expect(entry.email).toBeUndefined()
  })

  it('preserves username, maxStreak, sessionId, and stamps a timestamp', () => {
    const entry = buildLeaderboardEntry('DrSmith', 'smith@h.com', results, 5, 'session-abc')
    expect(entry.username).toBe('DrSmith')
    expect(entry.maxStreak).toBe(5)
    expect(entry.sessionId).toBe('session-abc')
    expect(entry.timestamp).toBeGreaterThan(0)
  })
})

describe('scoreBreakdown', () => {
  it('components always sum to calculateScore', () => {
    const parts = scoreBreakdown(9, 5, 23)
    expect(parts).toEqual({ accuracy: 900, streak: 50, speedBonus: 23 })
    expect(parts.accuracy + parts.streak + parts.speedBonus).toBe(calculateScore(9, 5, 23))
  })
})

describe('computeSpeedBonus', () => {
  const result = (correct: boolean, elapsedMs: number) => ({
    profileId: 'c1',
    playerSide: 'right' as const,
    correct,
    elapsedMs,
  })

  it('awards the full per-card bonus anywhere inside the grace window', () => {
    // 0.5 each — two grace-window cards sum to 1 exactly
    expect(computeSpeedBonus([result(true, 0), result(true, 0)])).toBe(1)
    expect(computeSpeedBonus([result(true, 5000), result(true, 5000)])).toBe(1)
  })

  it('decays linearly between grace and cutoff', () => {
    // midpoint of 5s→30s → 0.25 each; four cards sum to 1 exactly
    const midpoint = Array.from({ length: 4 }, () => result(true, 17500))
    expect(computeSpeedBonus(midpoint)).toBe(1)
  })

  it('awards nothing at or beyond the cutoff', () => {
    expect(computeSpeedBonus([result(true, 30000)])).toBe(0)
    expect(computeSpeedBonus([result(true, 120000)])).toBe(0)
  })

  it('ignores incorrect answers no matter how fast', () => {
    expect(computeSpeedBonus([result(false, 100)])).toBe(0)
  })

  it('rounds the summed total, not each card', () => {
    // 17500ms → 0.25 pts each; per-card rounding would give 0+0+0+0=0
    const midpoint = Array.from({ length: 4 }, () => result(true, 17500))
    expect(computeSpeedBonus(midpoint)).toBe(1)
  })

  it('caps the full-deck total at 8 — below the 10-pt streak step', () => {
    const instantDeck = Array.from({ length: 15 }, () => result(true, 0))
    expect(computeSpeedBonus(instantDeck)).toBe(8) // 15 × 0.5, rounded
  })
})

describe('session clock', () => {
  const start = () => gameReducer(initialState, { type: 'START_GAME', deck: profiles })

  it('START_GAME resets the clock, paused at zero', () => {
    const dirty = { ...initialState, clock: { accumulatedMs: 4200, runningSince: 99 } }
    const state = gameReducer(dirty, { type: 'START_GAME', deck: profiles })
    expect(state.clock).toEqual({ accumulatedMs: 0, runningSince: null })
  })

  it('CARD_SHOWN starts the clock running from the given timestamp', () => {
    const state = gameReducer(start(), { type: 'CARD_SHOWN', at: 1000 })
    expect(state.clock).toEqual({ accumulatedMs: 0, runningSince: 1000 })
  })

  it('CARD_SHOWN is ignored outside play', () => {
    const state = gameReducer(initialState, { type: 'CARD_SHOWN', at: 1000 })
    expect(state).toBe(initialState)
  })

  it('CARD_COMMITTED banks the interactive time, rounded, and pauses', () => {
    let state = gameReducer(start(), { type: 'CARD_SHOWN', at: 1000 })
    state = gameReducer(state, { type: 'CARD_COMMITTED', at: 5400.4 })
    expect(state.clock).toEqual({ accumulatedMs: 4400, runningSince: null })
  })

  it('CARD_COMMITTED while paused is a no-op', () => {
    const state = start()
    expect(gameReducer(state, { type: 'CARD_COMMITTED', at: 5000 })).toBe(state)
  })

  it('SWIPE after CARD_COMMITTED does not count the card twice', () => {
    let state = gameReducer(start(), { type: 'CARD_SHOWN', at: 1000 })
    state = gameReducer(state, { type: 'CARD_COMMITTED', at: 5000 })
    const card = state.deck[0]
    state = gameReducer(state, { type: 'SWIPE', profileId: card.id, side: card.correctSide, elapsedMs: 4000 })
    expect(state.clock).toEqual({ accumulatedMs: 4000, runningSince: null })
  })

  it('SWIPE pauses a clock nobody committed, with the same elapsed time', () => {
    let state = gameReducer(start(), { type: 'CARD_SHOWN', at: 1000 })
    const card = state.deck[0]
    state = gameReducer(state, { type: 'SWIPE', profileId: card.id, side: card.correctSide, elapsedMs: 4000 })
    expect(state.clock).toEqual({ accumulatedMs: 4000, runningSince: null })
  })

  it('ADVANCE leaves the clock paused until the next card is shown', () => {
    let state = gameReducer(start(), { type: 'CARD_SHOWN', at: 1000 })
    state = gameReducer(state, { type: 'CARD_COMMITTED', at: 5000 })
    const card = state.deck[0]
    state = gameReducer(state, { type: 'SWIPE', profileId: card.id, side: card.correctSide, elapsedMs: 4000 })
    state = gameReducer(state, { type: 'ADVANCE' })
    expect(state.clock).toEqual({ accumulatedMs: 4000, runningSince: null })
    state = gameReducer(state, { type: 'CARD_SHOWN', at: 12_000 })
    expect(state.clock).toEqual({ accumulatedMs: 4000, runningSince: 12_000 })
  })

  it('over a full deck the banked time equals the sum of the per-card times, and ends paused', () => {
    let state = start()
    let now = 10_000
    for (let i = 0; i < state.deck.length; i++) {
      const card = state.deck[i]
      state = gameReducer(state, { type: 'CARD_SHOWN', at: now })
      const committedAt = now + 3000 + i * 250.5 // varied, fractional
      state = gameReducer(state, { type: 'CARD_COMMITTED', at: committedAt })
      state = gameReducer(state, {
        type: 'SWIPE',
        profileId: card.id,
        side: card.correctSide,
        elapsedMs: Math.round(committedAt - now),
      })
      state = gameReducer(state, { type: 'ADVANCE' })
      now = committedAt + 8000 // rationale time never counts
    }
    expect(state.screen).toBe('summary')
    const total = computeTotalMs(state.sessionResults)
    expect(state.clock).toEqual({ accumulatedMs: total, runningSince: null })
  })

  it('RESET clears the clock', () => {
    let state = gameReducer(start(), { type: 'CARD_SHOWN', at: 1000 })
    state = gameReducer(state, { type: 'RESET' })
    expect(state.clock).toEqual({ accumulatedMs: 0, runningSince: null })
  })
})

describe('total time', () => {
  const results = [
    { profileId: 'c1', playerSide: 'left' as const, correct: true, elapsedMs: 4000 },
    { profileId: 'c2', playerSide: 'right' as const, correct: false, elapsedMs: 12_500 },
    { profileId: 'c3', playerSide: 'left' as const, correct: true, elapsedMs: 700 },
  ]

  it('computeTotalMs sums every card, right or wrong', () => {
    expect(computeTotalMs(results)).toBe(17_200)
    expect(computeTotalMs([])).toBe(0)
  })

  it('buildLeaderboardEntry carries the total for the time column', () => {
    const entry = buildLeaderboardEntry('Jane Doe', '', results, 2, 'sid-1')
    expect(entry.totalMs).toBe(17_200)
  })
})
