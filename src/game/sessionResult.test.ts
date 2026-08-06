import { describe, it, expect } from 'vitest'
import { summarizeSession } from './sessionResult'
import { makeInitialState } from './machine'
import { cases } from '../data/cases'
import type { AnswerRecord, GameState, Identity } from '../types'

const identity: Identity = { name: 'Table 4', email: 'a@b.co', specialty: '', type: 'team' }

function rec(qid: string, caseId: string, label: string, correct: boolean, points: number): AnswerRecord {
  return { questionId: qid, caseId, chosenOptionId: 'x', chosenLabel: label, correct, points, speedBonus: 0 }
}

const answers: Record<string, AnswerRecord> = {
  c1q1: rec('c1q1', 'case1', 'Yes', true, 100),
  c1q2: rec('c1q2', 'case1', 'HbA1c', false, 0),
  c1q3: rec('c1q3', 'case1', 'Stage 1 T1D', true, 200),
  c2q1: rec('c2q1', 'case2', 'Stage 1 T1D', true, 250),
  c2q2: rec('c2q2', 'case2', 'Structured monitoring for signs and symptoms of diabetes', true, 150),
  c2q3: rec('c2q3', 'case2', 'Stage 2 T1D', true, 200),
}

const NOW = 1_700_000_000_000

function stateWith(overrides: Partial<GameState> = {}): GameState {
  return { ...makeInitialState(cases), answers, identity, sessionId: 'sess-1', ...overrides }
}

describe('summarizeSession', () => {
  it('passes through identity, sessionId, and the supplied now', () => {
    const r = summarizeSession(stateWith(), cases, NOW)
    expect(r.identity).toEqual(identity)
    expect(r.sessionId).toBe('sess-1')
    expect(r.completedAt).toBe(NOW)
  })

  it('computes duration from startedAt and now', () => {
    const r = summarizeSession(stateWith({ startedAt: NOW - 120_000 }), cases, NOW)
    expect(r.durationSeconds).toBe(120)
  })

  it('reports zero duration when the session never started', () => {
    const r = summarizeSession(stateWith({ startedAt: null }), cases, NOW)
    expect(r.durationSeconds).toBe(0)
  })

  it('rolls up total and per-case score lines', () => {
    const r = summarizeSession(stateWith(), cases, NOW)
    expect(r.total).toEqual({ correct: 5, total: 6, score: 900, bonus: 0 })
    expect(r.cases[0].line).toEqual({ correct: 2, total: 3, score: 300, bonus: 0 })
    expect(r.cases[1].line).toEqual({ correct: 3, total: 3, score: 600, bonus: 0 })
  })

  it('captures a per-question answer cell for every question in order', () => {
    const r = summarizeSession(stateWith(), cases, NOW)
    expect(r.cases[0].caseId).toBe('case1')
    expect(r.cases[0].answers[1]).toEqual({ questionId: 'c1q2', chosenLabel: 'HbA1c', correct: false })
    expect(r.cases[1].answers[0]).toMatchObject({ questionId: 'c2q1', correct: true })
  })

  it('emits empty/false cells for unanswered questions', () => {
    const r = summarizeSession(stateWith({ answers: {} }), cases, NOW)
    expect(r.cases[0].answers[0]).toEqual({ questionId: 'c1q1', chosenLabel: '', correct: false })
    expect(r.total).toEqual({ correct: 0, total: 6, score: 0, bonus: 0 })
  })
})
