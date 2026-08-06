import type { SessionResult } from "../types";

export interface SessionStats {
  correct: number;
  missed: number;
  total: number;
  accuracy: number;
}

export function computeSessionStats(results: SessionResult[]): SessionStats {
  const correct = results.filter((r) => r.correct).length;
  const total = results.length;
  const missed = total - correct;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { correct, missed, total, accuracy };
}
