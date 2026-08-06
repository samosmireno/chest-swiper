import ReactGA from 'react-ga4'

interface GameCompletedParams {
  score: number
  correct: number
  total: number
  duration_seconds: number
}

interface QuestionAnsweredParams {
  question_id: string
  chosen_label: string
  correct: boolean
}

export function useAnalytics() {
  return {
    trackGameStarted: (identityType: string) =>
      ReactGA.event('summit_started', { identity_type: identityType }),

    trackGameCompleted: (params: GameCompletedParams) =>
      ReactGA.event('summit_completed', params),

    trackQuestionAnswered: (params: QuestionAnsweredParams) =>
      ReactGA.event('question_answered', params),
  }
}
