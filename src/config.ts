// ─── Streak milestones ────────────────────────────────────────
// Sorted ascending. Each entry triggers a banner and an optional custom label.
export const STREAK_MILESTONES: { streak: number; label: string }[] = [
  { streak: 3, label: "IN A ROW" },
  { streak: 5, label: "IN A ROW" },
  { streak: 7, label: "IN A ROW" },
  { streak: 10, label: "PERFECT SO FAR" },
];

// ─── Leaderboard ─────────────────────────────────────────────
export const LEADERBOARD_PAGE_SIZE = 10;

// Rolling window: only show entries within this span of the newest entry.
// Scopes the board to the current summit without per-event manual edits.
// Anchored to the newest entry (not the device clock) so a wrong kiosk clock
// can't silently empty the board mid-summit.
export const LEADERBOARD_WINDOW_MS = 12 * 60 * 60 * 1000; // 12h

// ─── Google Sheets storage ────────────────────────────────────
// Primary (and only) submission store. An Apps Script web app fronts the
// sheet: POST appends a submission row, GET returns all rows as JSON.
// Set to the web app URL after deploying sheets/wwys-results.gs.
// APP_VERSION — bump this when card content changes to filter old submissions.
export const APP_VERSION = "1.2";
export const SHEETS_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbzxBaIQ2Mp8JymKhxWBxY60VVU4TR5LMqLo9pECG4ucpqfSBxdUsHP8v5DqHa4InglGeA/exec";
