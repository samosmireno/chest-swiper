import { useEffect, useRef } from "react";
import type { CumulativeStats, PatientProfile, SessionResult } from "../types";
import { saveCumulativeStats } from "../utils/statsStorage";
import { addLeaderboardEntry, buildLeaderboardEntry, calculateScore } from "../leaderboard";
import { computeSessionStats } from "../utils/sessionStats";
import { useAnalytics } from "./useAnalytics";
import { useWebformSubmission } from "./useWebformSubmission";

interface SessionCompletionState {
  screen: "idle" | "playing" | "summary";
  lastSessionId: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty: string;
  sessionResults: SessionResult[];
  deck: PatientProfile[];
  maxStreak: number;
  cumulativeStats: CumulativeStats;
}

export function useSessionCompletion({
  screen,
  lastSessionId,
  firstName,
  lastName,
  email,
  specialty,
  sessionResults,
  deck,
  maxStreak,
  cumulativeStats,
}: SessionCompletionState): void {
  const { trackGameCompleted } = useAnalytics();
  const { submitSession } = useWebformSubmission();
  const gameStartedAt = useRef<number | null>(null);
  const savedSessionId = useRef("");

  useEffect(() => {
    if (screen === "playing") {
      gameStartedAt.current = Date.now();
    }
  }, [screen]);

  useEffect(() => {
    if (
      screen !== "summary" ||
      lastSessionId === "" ||
      lastSessionId === savedSessionId.current
    )
      return;

    savedSessionId.current = lastSessionId;
    saveCumulativeStats(cumulativeStats);
    const username = `${firstName} ${lastName}`;
    addLeaderboardEntry(
      buildLeaderboardEntry(username, email, sessionResults, maxStreak, lastSessionId),
    );
    submitSession({ firstName, lastName, email, specialty, sessionResults, deck, maxStreak, sessionId: lastSessionId });

    const { correct, total } = computeSessionStats(sessionResults);
    trackGameCompleted({
      score: calculateScore(correct, maxStreak),
      correct,
      total,
      accuracy_pct: Math.round((correct / total) * 100),
      max_streak: maxStreak,
      duration_seconds: gameStartedAt.current
        ? Math.round((Date.now() - gameStartedAt.current) / 1000)
        : 0,
    });
  }, [
    screen,
    lastSessionId,
    cumulativeStats,
    firstName,
    lastName,
    email,
    specialty,
    sessionResults,
    maxStreak,
    deck,
    trackGameCompleted,
    submitSession,
  ]);
}
