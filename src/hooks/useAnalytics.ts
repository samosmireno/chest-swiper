import ReactGA from "react-ga4";

interface GameCompletedParams {
  score: number;
  correct: number;
  total: number;
  accuracy_pct: number;
  max_streak: number;
  duration_seconds: number;
}

interface CardDecisionParams {
  profile_id: string;
  patient_topic: string;
  player_action: string;
  correct: boolean;
  streak_at_time: number;
  card_index: number;
}

export function useAnalytics() {
  return {
    trackGameStarted: (username: string, hasEmail: boolean) =>
      ReactGA.event("game_started", { username, has_email: hasEmail }),

    trackGameCompleted: (params: GameCompletedParams) =>
      ReactGA.event("game_completed", params),

    trackCardDecision: (params: CardDecisionParams) =>
      ReactGA.event("card_decision", params),

    trackStreakMilestone: (milestone: number) =>
      ReactGA.event("streak_milestone", { milestone }),
  };
}
