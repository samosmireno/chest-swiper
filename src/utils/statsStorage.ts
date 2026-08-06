import type { CumulativeStats } from "../types";

const STORAGE_KEY = "wwys_stats_v2";

export function loadCumulativeStats(): CumulativeStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { totalSessions: 0, perCard: {} };
  } catch {
    return { totalSessions: 0, perCard: {} };
  }
}

export function saveCumulativeStats(stats: CumulativeStats): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}
