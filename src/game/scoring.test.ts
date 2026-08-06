import { describe, it, expect } from 'vitest'
import { questionWeight, scoreCase, scoreTotal, speedBonus } from './scoring'
import { cases } from '../data/cases'
import type { AnswerRecord } from '../types'

function answer(
  q: { id: string; correctOptionId: string },
  caseId: string,
  points: number,
  correct = true,
  bonus = 0,
): AnswerRecord {
  return {
    questionId: q.id,
    caseId,
    chosenOptionId: correct ? q.correctOptionId : 'wrong',
    chosenLabel: 'x',
    correct,
    points: correct ? points : 0,
    speedBonus: correct ? bonus : 0,
  }
}

describe('speedBonus', () => {
  it('awards full 0.2*weight at or under the grace window (≤10s)', () => {
    expect(speedBonus(100, 0)).toBe(20)
    expect(speedBonus(150, 10_000)).toBe(30)
    expect(speedBonus(200, 5_000)).toBe(40)
  })
  it('awards zero at or past the zero point (≥60s)', () => {
    expect(speedBonus(200, 60_000)).toBe(0)
    expect(speedBonus(200, 120_000)).toBe(0)
  })
  it('decays linearly between grace and zero', () => {
    // halfway through the 10s..60s ramp (35s) → half of full
    expect(speedBonus(200, 35_000)).toBe(20)
    expect(speedBonus(100, 35_000)).toBe(10)
  })
})

describe('questionWeight', () => {
  it('defaults to optionCount * 50', () => {
    expect(questionWeight(cases[0].questions[0])).toBe(100) // 2 options
    expect(questionWeight(cases[0].questions[1])).toBe(150) // 3
    expect(questionWeight(cases[1].questions[0])).toBe(200) // 4
  })
  it('honors an explicit weight override', () => {
    expect(questionWeight({ ...cases[0].questions[0], weight: 999 })).toBe(999)
  })
})

describe('scoreCase', () => {
  it('sums base points + speed bonus + correct count', () => {
    const c = cases[0]
    const answers: Record<string, AnswerRecord> = {
      c1q1: answer(c.questions[0], 'case1', 100, true, 15),
      c1q2: answer(c.questions[1], 'case1', 150, false), // wrong
      c1q3: answer(c.questions[2], 'case1', 200, true, 40),
    }
    expect(scoreCase(c, answers)).toEqual({ correct: 2, total: 3, score: 355, bonus: 55 })
  })
  it('treats unanswered questions as zero', () => {
    expect(scoreCase(cases[0], {})).toEqual({ correct: 0, total: 3, score: 0, bonus: 0 })
  })
})

describe('scoreTotal', () => {
  it('sums all cases', () => {
    const answers: Record<string, AnswerRecord> = {
      c1q1: answer(cases[0].questions[0], 'case1', 100),
      c2q1: answer(cases[1].questions[0], 'case2', 200),
    }
    expect(scoreTotal(cases, answers)).toEqual({ correct: 2, total: 6, score: 300, bonus: 0 })
  })
})
