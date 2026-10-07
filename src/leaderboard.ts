import type { SessionResult } from "./types";
import { computeSessionStats } from "./utils/sessionStats";
import {
  ACCURACY_POINTS_PER_CARD,
  SPEED_BONUS_GRACE_MS,
  SPEED_BONUS_MAX_PER_CARD,
  SPEED_BONUS_ZERO_MS,
  STREAK_POINTS_PER_CARD,
} from "./config";

export interface LeaderboardEntry {
  username: string;
  email?: string;
  score: number; // correct * 100 + maxStreak * 10 + speed bonus (see config.ts)
  correct: number;
  total: number;
  maxStreak: number;
  // Interactive time across the deck (ms) — the sum of the results'
  // elapsedMs, i.e. the session clock's final reading; the leaderboard's
  // time column
  totalMs: number;
  sessionId: string; // stable identity for the session
  timestamp: number; // Date.now() at session end — for display/sorting
}

// The just-finished player's entry, held in memory for this page load only.
// The board itself comes from the sheet; this lets the summary splice in
// the player's YOU row before their submission round-trips. Nothing is
// persisted locally — a result that never reaches the sheet is gone.
let sessionEntry: LeaderboardEntry | null = null;

// The score's three components, kept together so display breakdowns can't
// drift from the actual formula.
export function scoreBreakdown(
  correct: number,
  maxStreak: number,
  speedBonus: number,
): { accuracy: number; streak: number; speedBonus: number } {
  return {
    accuracy: correct * ACCURACY_POINTS_PER_CARD,
    streak: maxStreak * STREAK_POINTS_PER_CARD,
    speedBonus,
  };
}

export function calculateScore(
  correct: number,
  maxStreak: number,
  speedBonus = 0,
): number {
  const parts = scoreBreakdown(correct, maxStreak, speedBonus);
  return parts.accuracy + parts.streak + parts.speedBonus;
}

// Full bonus inside the grace window, linear decay to zero at the cutoff.
function cardSpeedBonus(elapsedMs: number): number {
  const decayMs = SPEED_BONUS_ZERO_MS - SPEED_BONUS_GRACE_MS;
  const pastGrace = elapsedMs - SPEED_BONUS_GRACE_MS;
  if (pastGrace <= 0) return SPEED_BONUS_MAX_PER_CARD;
  if (pastGrace >= decayMs) return 0;
  return SPEED_BONUS_MAX_PER_CARD * (1 - pastGrace / decayMs);
}

// Correct answers only. Per-card bonuses stay fractional; only the session
// total is rounded, so the small per-card scale still separates close runs.
export function computeSpeedBonus(results: SessionResult[]): number {
  return Math.round(
    results
      .filter((r) => r.correct)
      .reduce((sum, r) => sum + cardSpeedBonus(r.elapsedMs), 0),
  );
}

// The session clock's total: every card's interactive time, summed. Same
// edges as the speed bonus (card shown → swipe/tap commit), so rationale
// reading never counts.
export function computeTotalMs(results: SessionResult[]): number {
  return results.reduce((sum, r) => sum + r.elapsedMs, 0);
}

export function setSessionEntry(entry: LeaderboardEntry): void {
  sessionEntry = entry;
}

export function getSessionEntry(sessionId: string): LeaderboardEntry | undefined {
  return sessionEntry?.sessionId === sessionId ? sessionEntry : undefined;
}

export function buildLeaderboardEntry(
  username: string,
  email: string,
  results: SessionResult[],
  maxStreak: number,
  sessionId: string,
): LeaderboardEntry {
  const { correct, total } = computeSessionStats(results);
  return {
    username,
    email: email || undefined,
    score: calculateScore(correct, maxStreak, computeSpeedBonus(results)),
    correct,
    total,
    maxStreak,
    totalMs: computeTotalMs(results),
    sessionId,
    timestamp: Date.now(),
  };
}
