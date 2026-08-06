import { describe, it, expect } from 'vitest'
import { buildPayload, localDateTag } from './payload'
import { summarizeSession } from './sessionResult'
import { makeInitialState } from './machine'
import { cases } from '../data/cases'
import type { AnswerRecord, Identity } from '../types'

const identity: Identity = { name: 'Table 4', email: '', specialty: '', type: 'team' }

function rec(qid: string, caseId: string, label: string, correct: boolean, points: number): AnswerRecord {
  return { questionId: qid, caseId, chosenOptionId: 'x', chosenLabel: label, correct, points, speedBonus: 0 }
}

describe('localDateTag', () => {
  it('formats a local date as zero-padded YYYY-MM-DD', () => {
    // Constructed from local components, so this is timezone-independent.
    expect(localDateTag(new Date(2026, 6, 4, 20, 30))).toBe('2026-07-04')
    expect(localDateTag(new Date(2026, 11, 9, 0, 5))).toBe('2026-12-09')
  })
})

describe('buildPayload', () => {
  const answers: Record<string, AnswerRecord> = {
    c1q1: rec('c1q1', 'case1', 'Yes', true, 100),
    c1q2: rec('c1q2', 'case1', 'HbA1c', false, 0),
    c1q3: rec('c1q3', 'case1', 'Stage 1 T1D', true, 200),
    c2q1: rec('c2q1', 'case2', 'Stage 1 T1D', true, 250),
    c2q2: rec('c2q2', 'case2', 'Structured monitoring for signs and symptoms of diabetes', true, 150),
    c2q3: rec('c2q3', 'case2', 'Stage 2 T1D', true, 200),
  }
  const NOW = 1_700_000_000_000
  const state = { ...makeInitialState(cases), answers, identity, sessionId: 'sess-1', startedAt: NOW - 120_000 }
  const p = buildPayload(summarizeSession(state, cases, NOW))

  it('includes identity + summit metadata', () => {
    expect(p.participant_name).toBe('Table 4')
    expect(p.identity_type).toBe('team')
    // summit_id is now the submission's own local date, not a fixed constant.
    expect(p.summit_id).toBe(localDateTag(new Date(NOW)))
    expect(p.session_id).toBe('sess-1')
    expect(p.duration_seconds).toBe(120)
  })

  it('computes per-case and total scores', () => {
    expect(p.case1_correct).toBe(2)
    expect(p.case1_score).toBe(300)
    expect(p.case2_correct).toBe(3)
    expect(p.case2_score).toBe(600)
    expect(p.total_correct).toBe(5)
    expect(p.total_questions).toBe(6)
    expect(p.total_score).toBe(900)
  })

  it('captures each chosen answer label + correctness flag', () => {
    expect(p.c1q2_answer).toBe('HbA1c')
    expect(p.c1q2_correct).toBe('no')
    expect(p.c2q1_answer).toBe('Stage 1 T1D')
    expect(p.c2q1_correct).toBe('yes')
  })
})

describe('buildPayload — single-case session', () => {
  const NOW = 1_700_000_000_000
  const case2Answers: Record<string, AnswerRecord> = {
    c2q1: rec('c2q1', 'case2', 'Stage 1 T1D', true, 250),
    c2q2: rec('c2q2', 'case2', 'Structured monitoring for signs and symptoms of diabetes', true, 150),
    c2q3: rec('c2q3', 'case2', 'Stage 2 T1D', true, 200),
  }
  const state = {
    ...makeInitialState([cases[1]], identity),
    answers: case2Answers,
    sessionId: 'sess-2',
    startedAt: NOW - 60_000,
  }
  const p = buildPayload(summarizeSession(state, [cases[1]], NOW))

  it('tags the row with the real case_id', () => {
    expect(p.case_id).toBe('case2')
  })

  it('emits case2_* columns and no case1_* columns', () => {
    expect(p.case2_correct).toBe(3)
    expect(p.case2_score).toBe(600)
    expect(p.c2q1_answer).toBe('Stage 1 T1D')
    expect(p.c2q1_correct).toBe('yes')
    expect(p.case1_score).toBeUndefined()
    expect(p.c1q1_answer).toBeUndefined()
  })

  it('total_* equals the single case score', () => {
    expect(p.total_score).toBe(600)
    expect(p.total_correct).toBe(3)
    expect(p.total_questions).toBe(3)
  })
})
