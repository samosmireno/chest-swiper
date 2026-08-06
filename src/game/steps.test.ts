import { describe, it, expect } from 'vitest'
import { buildSteps } from './steps'
import { cases } from '../data/cases'

describe('buildSteps', () => {
  const steps = buildSteps(cases)

  it('starts with the first case intro and ends with summary', () => {
    expect(steps[0]).toEqual({ kind: 'intro', caseIndex: 0 })
    expect(steps[steps.length - 1]).toEqual({ kind: 'summary' })
  })

  it('lays out intro → 3 questions → discussion per case in order, no home step', () => {
    // (intro + 3q + discussion) * 2 + summary = 5 + 5 + 1 = 11
    expect(steps).toHaveLength(11)
    expect(steps[1]).toEqual({ kind: 'question', caseIndex: 0, questionIndex: 0 })
    expect(steps[3]).toEqual({ kind: 'question', caseIndex: 0, questionIndex: 2 })
    expect(steps[4]).toEqual({ kind: 'discussion', caseIndex: 0 })
    expect(steps[5]).toEqual({ kind: 'intro', caseIndex: 1 })
    expect(steps[9]).toEqual({ kind: 'discussion', caseIndex: 1 })
  })

  it('builds a one-case flow when given a single case', () => {
    const single = buildSteps([cases[1]])
    // intro + 3q + discussion + summary = 6, intro caseIndex is 0 within the set
    expect(single).toHaveLength(6)
    expect(single[0]).toEqual({ kind: 'intro', caseIndex: 0 })
    expect(single[5]).toEqual({ kind: 'summary' })
  })
})
