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

// ─── Drupal Webform API ───────────────────────────────────────
// DRUPAL_SUBMIT_URL  — POST endpoint for webform submissions
// DRUPAL_RESULTS_URL — GET endpoint returning all raw submissions as JSON
// DRUPAL_WEBFORM_ID  — webform machine name (e.g. "wwys_results")
// APP_VERSION        — bump this when card content changes to filter old submissions
//
// In dev, requests are routed through the Vite proxy (/drupal-api → Drupal origin)
// to avoid CORS blocks from localhost. In production the full URL is used directly.
const DRUPAL_ORIGIN = import.meta.env.DEV
  ? "/drupal-api"
  : "https://detect-t1d-insightstoaction.impetusdigital.com";

export const DRUPAL_SUBMIT_URL = ""; //`${DRUPAL_ORIGIN}/webform_rest/submit?_format=json`;
export const DRUPAL_CSRF_URL = `${DRUPAL_ORIGIN}/session/token`;
export const DRUPAL_RESULTS_URL = `${DRUPAL_ORIGIN}/api/wwys_results_data_endo`;
export const DRUPAL_WEBFORM_ID = "who_would_you_swipe_results_endo";
export const APP_VERSION = "1.2";

// ─── Google Sheets fallback ───────────────────────────────────
// Receives submissions when Drupal is unavailable (empty URL or non-2xx/network error).
// Set to the Apps Script web app URL after deploying sheets/wwys-fallback.gs.
export const SHEETS_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbzxBaIQ2Mp8JymKhxWBxY60VVU4TR5LMqLo9pECG4ucpqfSBxdUsHP8v5DqHa4InglGeA/exec";
