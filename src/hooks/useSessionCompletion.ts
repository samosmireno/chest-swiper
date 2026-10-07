import { useEffect, useRef } from "react";
import type { PatientProfile, SessionResult } from "../types";
import { buildLeaderboardEntry, setSessionEntry } from "../leaderboard";
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
    // The sheet is the only record; nothing is kept locally.
    submitSession({ firstName, lastName, email, specialty, sessionResults, deck, maxStreak, sessionId: lastSessionId });
    const username = `${firstName} ${lastName}`;
    setSessionEntry(
      buildLeaderboardEntry(username, email, sessionResults, maxStreak, lastSessionId),
    );
  }, [
    screen,
    lastSessionId,
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
