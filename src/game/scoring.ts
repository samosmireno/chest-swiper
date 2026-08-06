import type { AnswerRecord, CaseQuestion, SummitCase } from '../types'
import { SPEED_BONUS_COEFF, SPEED_FULL_MS, SPEED_ZERO_MS } from '../config'

export function questionWeight(q: CaseQuestion): number {
  return q.weight ?? q.options.length * 50
}

// Time→points decay: full bonus inside the grace window, linear to zero at the
// cap. Bounded so the per-case total can never overturn an accuracy difference.
export function speedBonus(weight: number, elapsedMs: number): number {
  const factor =
    elapsedMs <= SPEED_FULL_MS
      ? 1
      : elapsedMs >= SPEED_ZERO_MS
        ? 0
        : (SPEED_ZERO_MS - elapsedMs) / (SPEED_ZERO_MS - SPEED_FULL_MS)
  return Math.round(SPEED_BONUS_COEFF * weight * factor)
}

export interface ScoreLine {
  correct: number
  total: number
  score: number // base + speed bonus
  bonus: number // speed bonus portion only (for display breakdown)
}

export function scoreCase(c: SummitCase, answers: Record<string, AnswerRecord>): ScoreLine {
  let correct = 0
  let score = 0
  let bonus = 0
  for (const q of c.questions) {
    const a = answers[q.id]
    if (a?.correct) {
      correct += 1
      score += a.points + a.speedBonus
      bonus += a.speedBonus
    }
  }
  return { correct, total: c.questions.length, score, bonus }
}

export function scoreTotal(cases: SummitCase[], answers: Record<string, AnswerRecord>): ScoreLine {
  return cases.reduce<ScoreLine>(
    (acc, c) => {
      const line = scoreCase(c, answers)
      return {
        correct: acc.correct + line.correct,
        total: acc.total + line.total,
        score: acc.score + line.score,
        bonus: acc.bonus + line.bonus,
      }
    },
    { correct: 0, total: 0, score: 0, bonus: 0 },
  )
}
