import { describe, it, expect } from 'vitest'
import { gameReducer, initialState } from './GameContext'
import { buildLeaderboardEntry } from '../leaderboard'
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
    })
    expect(state.currentIndex).toBe(0)
    expect(state.sessionResults).toHaveLength(1)
    expect(state.lastResult?.correct).toBe(true)
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
    })
    expect(state.lastResult?.correct).toBe(false)
    expect(state.currentIndex).toBe(0)
  })

  it('ADVANCE bumps currentIndex when not on last card', () => {
    let state = gameReducer(initialState, { type: 'START_GAME', deck: profiles })
    const topCard = state.deck[0]
    state = gameReducer(state, { type: 'SWIPE', profileId: topCard.id, side: topCard.correctSide })
    state = gameReducer(state, { type: 'ADVANCE' })
    expect(state.currentIndex).toBe(1)
    expect(state.screen).toBe('playing')
  })

  it('ADVANCE on last card transitions to summary and increments totalSessions', () => {
    let state = gameReducer(initialState, { type: 'START_GAME', deck: profiles })
    for (let i = 0; i < state.deck.length; i++) {
      const card = state.deck[i]
      state = gameReducer(state, { type: 'SWIPE', profileId: card.id, side: card.correctSide })
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
    state = gameReducer(state, { type: 'SWIPE', profileId: firstCard.id, side: firstCard.correctSide })
    state = gameReducer(state, { type: 'ADVANCE' })
    for (let i = 1; i < state.deck.length; i++) {
      const card = state.deck[i]
      const wrong = card.correctSide === 'left' ? 'right' : 'left'
      state = gameReducer(state, { type: 'SWIPE', profileId: card.id, side: wrong })
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
    { profileId: 'c1', playerSide: 'right' as const, correct: true },
    { profileId: 'c2', playerSide: 'left' as const, correct: false },
    { profileId: 'c3', playerSide: 'right' as const, correct: true },
  ]

  it('computes score as correct*100 + maxStreak*50', () => {
    const entry = buildLeaderboardEntry('DrSmith', 'smith@h.com', results, 2, 'session-1')
    expect(entry.score).toBe(2 * 100 + 2 * 50) // 300
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
