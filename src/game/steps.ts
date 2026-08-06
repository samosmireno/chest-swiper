import type { Step, SummitCase } from '../types'

export function buildSteps(cases: SummitCase[]): Step[] {
  const steps: Step[] = []
  cases.forEach((c, caseIndex) => {
    steps.push({ kind: 'intro', caseIndex })
    c.questions.forEach((_, questionIndex) =>
      steps.push({ kind: 'question', caseIndex, questionIndex }),
    )
    steps.push({ kind: 'discussion', caseIndex })
  })
  steps.push({ kind: 'summary' })
  return steps
}
