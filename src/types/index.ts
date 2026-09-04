export type SwipeSide = 'left' | 'right'

export type CardTopic = 'asthma' | 'copd'

export interface PatientProfile {
  id: string

  // First name — its own gold line above the age line on every card (Figma
  // "Card Client 2", node 2004:557)
  name: string
  ageSex: string
  image: string
  // Clinical profile bullets, shipped verbatim from the source deck
  bullets: string[]
  // Abbreviation key printed at the foot of the card, verbatim from the slide
  footnote: string

  // The two clinical choices — labels are case-specific
  leftOption: string
  rightOption: string
  // Set when the option labels are unusually long, so the swipe buttons use
  // a smaller font (and wider layout on desktop) to fit the text.
  longOptions?: boolean
  correctSide: SwipeSide

  topic: CardTopic
  explanation: string
}

export interface SessionResult {
  profileId: string
  playerSide: SwipeSide
  correct: boolean
  // Time from the card becoming interactive to the swipe/tap commit
  elapsedMs: number
}

// The visible session clock. Same edges as SessionResult.elapsedMs, summed:
// it runs while a card is interactive and pauses at the swipe/tap commit, so
// rationale-reading never counts.
export interface ClockState {
  // Interactive time of the cards swiped so far (ms) — equals the sum of the
  // session results' elapsedMs
  accumulatedMs: number
  // performance.now() when the current card became interactive; null while
  // the clock is paused
  runningSince: number | null
}

export interface CumulativeStats {
  totalSessions: number
  perCard: Record<string, { timesShown: number; timesCorrect: number }>
}

export type AppScreen = 'idle' | 'playing' | 'summary'

export interface GameState {
  screen: AppScreen
  deck: PatientProfile[]
  currentIndex: number
  sessionResults: SessionResult[]
  lastResult: SessionResult | null
  cumulativeStats: CumulativeStats
  streak: number
  // Player identity (set by SET_PLAYER before game starts)
  firstName: string
  lastName: string
  email: string          // empty string means no email provided
  specialty: string
  maxStreak: number
  lastSessionId: string
  clock: ClockState
}
