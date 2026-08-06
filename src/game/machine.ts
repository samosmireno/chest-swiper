import type { AnswerRecord, GameState, Identity, SummitCase } from '../types'
import { buildSteps } from './steps'
import { questionWeight, speedBonus } from './scoring'

export type GameAction =
  | { type: 'SET_IDENTITY'; identity: Identity }
  | { type: 'ANSWER'; optionId: string }
  | { type: 'NEXT' }
  | { type: 'RESET' }

export function makeInitialState(cases: SummitCase[], identity: Identity | null = null): GameState {
  return {
    steps: buildSteps(cases),
    cursor: 0,
    answers: {},
    identity,
    sessionId: '',
    startedAt: null,
    questionShownAt: null,
  }
}

// Bind the reducer to the Case set it scores against. The returned reducer is
// pure: it resolves question/option content from the closed-over `cases`, never
// from ambient state.
export function makeGameReducer(cases: SummitCase[]) {
  return function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case 'SET_IDENTITY':
        return { ...state, identity: action.identity }

      case 'ANSWER': {
        const step = state.steps[state.cursor]
        if (step.kind !== 'question') return state
        const question = cases[step.caseIndex].questions[step.questionIndex]
        const option = question.options.find((o) => o.id === action.optionId)
        if (!option) return state
        const correct = option.id === question.correctOptionId
        const elapsedMs =
          state.questionShownAt != null ? Date.now() - state.questionShownAt : Infinity
        const weight = questionWeight(question)
        const record: AnswerRecord = {
          questionId: question.id,
          caseId: cases[step.caseIndex].id,
          chosenOptionId: option.id,
          chosenLabel: option.label,
          correct,
          points: correct ? weight : 0,
          speedBonus: correct ? speedBonus(weight, elapsedMs) : 0,
        }
        return { ...state, answers: { ...state.answers, [question.id]: record } }
      }

      case 'NEXT': {
        const current = state.steps[state.cursor]
        if (current.kind === 'summary') return state
        const nextCursor = state.cursor + 1
        const next = state.steps[nextCursor]
        return {
          ...state,
          cursor: nextCursor,
          startedAt:
            current.kind === 'intro' && state.startedAt === null ? Date.now() : state.startedAt,
          questionShownAt: next.kind === 'question' ? Date.now() : state.questionShownAt,
          sessionId:
            next.kind === 'summary' && state.sessionId === ''
              ? crypto.randomUUID()
              : state.sessionId,
        }
      }

      case 'RESET':
        return makeInitialState(cases)

      default:
        return state
    }
  }
}
