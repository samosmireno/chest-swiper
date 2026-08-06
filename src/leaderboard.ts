import type { SessionResult } from "./types";
import { computeSessionStats } from "./utils/sessionStats";

export interface LeaderboardEntry {
  username: string;
  email?: string;
  score: number; // correct * 100 + maxStreak * 50
  correct: number;
  total: number;
  maxStreak: number;
  sessionId: string; // stable identity for the session
  timestamp: number; // Date.now() at session end — for display/sorting
}

const LEADERBOARD_KEY = "wwys_leaderboard";

function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLeaderboard(entries: LeaderboardEntry[]): void {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
}

export function calculateScore(correct: number, maxStreak: number): number {
  return correct * 100 + maxStreak * 50;
}

export function getLeaderboard(): LeaderboardEntry[] {
  return loadLeaderboard().sort((a, b) => b.score - a.score);
}

export function addLeaderboardEntry(entry: LeaderboardEntry): void {
  saveLeaderboard([...loadLeaderboard(), entry]);
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
    score: calculateScore(correct, maxStreak),
    correct,
    total,
    maxStreak,
    sessionId,
    timestamp: Date.now(),
  };
}
