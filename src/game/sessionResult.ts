import type { GameState, Identity, SummitCase } from '../types'
import { scoreCase, scoreTotal, type ScoreLine } from './scoring'

export interface AnswerCell {
  questionId: string
  chosenLabel: string
  correct: boolean
}

export interface CaseResult {
  caseId: string
  line: ScoreLine
  answers: AnswerCell[]
}

// The canonical scored outcome of a completed Session. Derived once; every
// egress sink (leaderboard, webform payload, analytics) is a projection of it.
export interface SessionResult {
  identity: Identity | null
  sessionId: string
  completedAt: number // epoch ms — the single "now" for the whole emit
  durationSeconds: number
  total: ScoreLine
  cases: CaseResult[]
}

export function summarizeSession(
  state: GameState,
  cases: SummitCase[],
  now: number,
): SessionResult {
  const caseResults: CaseResult[] = cases.map((c) => ({
    caseId: c.id,
    line: scoreCase(c, state.answers),
    answers: c.questions.map((q) => {
      const a = state.answers[q.id]
      return {
        questionId: q.id,
        chosenLabel: a?.chosenLabel ?? '',
        correct: a?.correct ?? false,
      }
    }),
  }))

  return {
    identity: state.identity,
    sessionId: state.sessionId,
    completedAt: now,
    durationSeconds: state.startedAt ? Math.round((now - state.startedAt) / 1000) : 0,
    total: scoreTotal(cases, state.answers),
    cases: caseResults,
  }
}
