import { describe, it, expect } from 'vitest'
import { calculateScore, computeSpeedBonus } from './leaderboard'
import { profiles } from './data/profiles'
import { SPEED_BONUS_MAX_PER_CARD, STREAK_POINTS_PER_CARD } from './config'
import type { SessionResult } from './types'

const DECK_SIZE = profiles.length

/** One session's outcomes, card by card, at a fixed answer time. */
function session(pattern: boolean[], elapsedMs: number): SessionResult[] {
  return pattern.map((correct, i) => ({
    profileId: `c${i}`,
    playerSide: 'right' as const,
    correct,
    elapsedMs,
  }))
}

/** Longest run of correct answers — mirrors the reducer's streak tracking. */
function maxStreakOf(pattern: boolean[]): number {
  let best = 0
  let run = 0
  for (const correct of pattern) {
    run = correct ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

// The scoring weights are tuned so accuracy is never outranked by streak or
// speed. That is not a simple "bonus < one accuracy step" bound — the streak
// term can exceed 100 — so it's checked here by brute force over every
// possible outcome pattern for the real deck. If the deck size or any weight
// in config.ts moves, this is what catches a regression.
describe('scoring: accuracy always wins', () => {
  it(`for all 2^${DECK_SIZE} outcome patterns, more correct answers score strictly higher`, () => {
    // Per correct-count, the best any pattern can do (its streak + full speed)
    // and the worst (its streak, no speed). Dominance holds iff every
    // worst[c+1] beats best[c].
    const best = new Array<number>(DECK_SIZE + 1).fill(-Infinity)
    const worst = new Array<number>(DECK_SIZE + 1).fill(Infinity)

    for (let mask = 0; mask < 1 << DECK_SIZE; mask++) {
      const pattern = Array.from({ length: DECK_SIZE }, (_, i) => Boolean(mask & (1 << i)))
      const correct = pattern.filter(Boolean).length
      const streak = maxStreakOf(pattern)
      const fullSpeed = computeSpeedBonus(session(pattern, 0))
      best[correct] = Math.max(best[correct], calculateScore(correct, streak, fullSpeed))
      worst[correct] = Math.min(worst[correct], calculateScore(correct, streak, 0))
    }

    for (let c = 0; c < DECK_SIZE; c++) {
      expect(worst[c + 1], `${c + 1}/${DECK_SIZE} must always beat ${c}/${DECK_SIZE}`)
        .toBeGreaterThan(best[c])
    }
  })

  it('holds in the binding case: 11/15 on an 11-streak vs 12/15 with the misses spread out', () => {
    // Under the old 50-pt streak weight this reordered (1650+speed vs 1350).
    const elevenStraight = session(
      [...Array.from({ length: 11 }, () => true), false, false, false, false],
      0,
    )
    const twelveSpread = session(
      // Misses every fourth card cap the max streak at 3.
      [true, true, true, false, true, true, true, false, true, true, true, false, true, true, true],
      60_000,
    )
    const a = calculateScore(11, 11, computeSpeedBonus(elevenStraight))
    const b = calculateScore(12, 3, computeSpeedBonus(twelveSpread))
    expect(a).toBe(1216)
    expect(b).toBe(1230)
    expect(b).toBeGreaterThan(a)
  })

  it('speed can never reorder streak among players with equal accuracy', () => {
    // Full-deck speed budget (rounded total) stays below a single streak step.
    const fullDeck = session(Array.from({ length: DECK_SIZE }, () => true), 0)
    expect(computeSpeedBonus(fullDeck)).toBe(Math.round(DECK_SIZE * SPEED_BONUS_MAX_PER_CARD))
    expect(computeSpeedBonus(fullDeck)).toBeLessThan(STREAK_POINTS_PER_CARD)
  })
})
