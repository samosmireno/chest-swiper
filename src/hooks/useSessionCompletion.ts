import { useEffect, useRef } from "react";
import type { CumulativeStats, PatientProfile, SessionResult } from "../types";
import { saveCumulativeStats } from "../utils/statsStorage";
import { addLeaderboardEntry, buildLeaderboardEntry } from "../leaderboard";
import { useSheetsSubmission } from "./useSheetsSubmission";

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
  const { submitSession } = useSheetsSubmission();
  const savedSessionId = useRef("");

  useEffect(() => {
    if (
      screen !== "summary" ||
      lastSessionId === "" ||
      lastSessionId === savedSessionId.current
    )
      return;

    savedSessionId.current = lastSessionId;
    // Submit first: the sheet is the record, local storage only a cache.
    submitSession({ firstName, lastName, email, specialty, sessionResults, deck, maxStreak, sessionId: lastSessionId });
    saveCumulativeStats(cumulativeStats);
    const username = `${firstName} ${lastName}`;
    addLeaderboardEntry(
      buildLeaderboardEntry(username, email, sessionResults, maxStreak, lastSessionId),
    );
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
    submitSession,
  ]);
}
