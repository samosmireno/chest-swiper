export type SwipeSide = 'left' | 'right'

export type CardTopic = 'asthma' | 'copd'

export interface ProfileField {
  label: string
  value: string
}

export interface PatientProfile {
  id: string

  ageSex: string
  image: string
  fields: ProfileField[]

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
}
