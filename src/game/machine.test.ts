import { describe, it, expect } from 'vitest'
import { makeGameReducer, makeInitialState } from './machine'
import { cases } from '../data/cases'
import type { Identity } from '../types'

const reducer = makeGameReducer(cases)

function start() {
  return makeInitialState(cases)
}

describe('gameReducer', () => {
  it('initial state is on the first case intro with no answers', () => {
    const s = start()
    expect(s.steps[s.cursor]).toEqual({ kind: 'intro', caseIndex: 0 })
    expect(Object.keys(s.answers)).toHaveLength(0)
    expect(s.identity).toBeNull()
    expect(s.startedAt).toBeNull()
  })

  it('makeInitialState accepts an initial identity', () => {
    const identity: Identity = { name: 'Table 4', email: '', specialty: '', type: 'team' }
    expect(makeInitialState(cases, identity).identity).toEqual(identity)
  })

  it('SET_IDENTITY stores identity', () => {
    const s = reducer(start(), {
      type: 'SET_IDENTITY',
      identity: { name: 'Table 4', email: '', specialty: '', type: 'team' },
    })
    expect(s.identity).toEqual({ name: 'Table 4', email: '', specialty: '', type: 'team' })
  })

  it('NEXT from the intro advances to the first question and stamps startedAt', () => {
    const s = reducer(start(), { type: 'NEXT' })
    expect(s.steps[s.cursor]).toEqual({ kind: 'question', caseIndex: 0, questionIndex: 0 })
    expect(s.startedAt).not.toBeNull()
  })

  it('ANSWER records correctness + weighted points for the current question', () => {
    let s = start()
    s = reducer(s, { type: 'NEXT' }) // c1q1
    s = reducer(s, { type: 'ANSWER', optionId: 'yes' }) // correct
    expect(s.answers.c1q1).toMatchObject({
      questionId: 'c1q1',
      caseId: 'case1',
      chosenOptionId: 'yes',
      chosenLabel: 'Yes',
      correct: true,
      points: 100,
    })
  })

  it('ANSWER with wrong option scores zero points', () => {
    let s = start()
    s = reducer(s, { type: 'NEXT' })
    s = reducer(s, { type: 'ANSWER', optionId: 'no' })
    expect(s.answers.c1q1).toMatchObject({ correct: false, points: 0 })
  })

  it('NEXT into a question stamps questionShownAt', () => {
    const s = reducer(start(), { type: 'NEXT' }) // → c1q1
    expect(s.questionShownAt).not.toBeNull()
  })

  it('ANSWER awards full speed bonus when answered immediately', () => {
    let s = start()
    s = reducer(s, { type: 'NEXT' }) // c1q1, weight 100
    s = reducer(s, { type: 'ANSWER', optionId: 'yes' })
    expect(s.answers.c1q1).toMatchObject({ correct: true, points: 100, speedBonus: 20 })
  })

  it('wrong ANSWER earns no speed bonus', () => {
    let s = start()
    s = reducer(s, { type: 'NEXT' })
    s = reducer(s, { type: 'ANSWER', optionId: 'no' })
    expect(s.answers.c1q1).toMatchObject({ correct: false, points: 0, speedBonus: 0 })
  })

  it('ANSWER is a no-op when not on a question step', () => {
    const s = start() // intro
    const after = reducer(s, { type: 'ANSWER', optionId: 'yes' })
    expect(after).toBe(s)
  })

  it('ANSWER does not advance the cursor', () => {
    let s = start()
    s = reducer(s, { type: 'NEXT' })
    const cursor = s.cursor
    s = reducer(s, { type: 'ANSWER', optionId: 'yes' })
    expect(s.cursor).toBe(cursor)
  })

  it('NEXT into the summary step stamps a sessionId', () => {
    let s = start()
    while (s.steps[s.cursor].kind !== 'summary') s = reducer(s, { type: 'NEXT' })
    expect(s.steps[s.cursor]).toEqual({ kind: 'summary' })
    expect(s.sessionId).not.toBe('')
  })

  it('NEXT does not advance past summary', () => {
    let s = start()
    while (s.steps[s.cursor].kind !== 'summary') s = reducer(s, { type: 'NEXT' })
    const at = s.cursor
    s = reducer(s, { type: 'NEXT' })
    expect(s.cursor).toBe(at)
  })
})
