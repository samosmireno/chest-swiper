// Leaderboard window, resolved per page load. The config constant is the
// default; the kiosk URL overrides it so an operator can pick per event
// without a rebuild:
//   ?board=all   enduring board — every score-compatible entry ever
//   ?board=12h   rolling window (h = hours, d = days, m = minutes;
//   ?board=3d    a bare number means hours)
// Anything unparseable falls back to the config default.

import { LEADERBOARD_WINDOW_MS } from "../config";

const UNIT_MS: Record<string, number> = {
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** `null` means enduring (no window). */
export function parseBoardWindow(
  raw: string | null | undefined,
  fallback: number | null,
): number | null {
  if (raw == null) return fallback;
  const value = raw.trim().toLowerCase();
  if (value === "all") return null;
  const match = /^(\d+(?:\.\d+)?)\s*(m|h|d)?$/.exec(value);
  if (!match) return fallback;
  const amount = Number(match[1]);
  if (!(amount > 0)) return fallback;
  return amount * UNIT_MS[match[2] ?? "h"];
}

export function getLeaderboardWindowMs(): number | null {
  return parseBoardWindow(
    new URLSearchParams(window.location.search).get("board"),
    LEADERBOARD_WINDOW_MS,
  );
}
