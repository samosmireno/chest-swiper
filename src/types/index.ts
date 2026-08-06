export interface AnswerOption {
  id: string
  label: string
}

export interface CaseQuestion {
  id: string                 // e.g. "c1q1"
  prompt: string
  context?: string[]         // "case continuation" labs/history shown above the prompt
  options: AnswerOption[]    // 2–5
  correctOptionId: string
  explanation?: string       // optional; empty for v1 (faculty deliver rationale live)
  weight?: number            // optional override; default = options.length * 50
}

export interface CaseDiscussion {
  context?: string[]
  prompts: string[]
}

export interface CaseIntro {
  narrative: string[]
  breakout: string[]
  image?: string
  ageSex?: string            // e.g. "11-year-old girl" — shown as card subtitle
}

export interface SummitCase {
  id: string                 // "case1"
  patientName: string
  intro: CaseIntro
  questions: CaseQuestion[]
  discussion: CaseDiscussion
}

export type Step =
  | { kind: 'home' }
  | { kind: 'intro'; caseIndex: number }
  | { kind: 'question'; caseIndex: number; questionIndex: number }
  | { kind: 'discussion'; caseIndex: number }
  | { kind: 'summary' }

export type IdentityType = 'user' | 'team'

export interface Identity {
  name: string
  email: string
  specialty: string
  type: IdentityType
}

export interface AnswerRecord {
  questionId: string
  caseId: string
  chosenOptionId: string
  chosenLabel: string
  correct: boolean
  points: number      // base weight only (clean multiple of 50)
  speedBonus: number  // 0 when incorrect
}

export interface GameState {
  steps: Step[]
  cursor: number
  answers: Record<string, AnswerRecord>   // keyed by questionId
  identity: Identity | null
  sessionId: string
  startedAt: number | null
  questionShownAt: number | null   // when the current question step became active
}
