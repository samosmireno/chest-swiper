/**
 * Formats a duration as the session clock and the leaderboard show it:
 * `mm:ss`, whole seconds floored (a second is shown only once the player has
 * finished it), minutes running on past 59 rather than wrapping — Figma
 * "digital-timer-value" (component 52:2012) shows 00:03 / 02:32 / 04:32.
 */
export function formatClock(ms: number): string {
  // Non-finite input (a row without total_ms) reads as zero, not "NaN:NaN".
  const totalSeconds = Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 1000)) : 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
