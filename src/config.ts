// ─── Kiosk scaling (unchanged from ADA — projector insurance) ───
export const KIOSK_DESIGN_W = 1440;
export const KIOSK_DESIGN_H = 810;
export const KIOSK_THRESHOLD_W = 1920;
export const KIOSK_THRESHOLD_H = 1080;

// ─── Scoring ───
export const POINTS_PER_OPTION = 50; // points = optionCount * POINTS_PER_OPTION

// Speed bonus: faster *correct* answers earn up to SPEED_BONUS_COEFF * weight.
// Max total per case (0.2 * (100+150+200) = 90) stays under the smallest
// question weight (100), so accuracy can never be overturned by speed.
export const SPEED_BONUS_COEFF = 0.2;
export const SPEED_FULL_MS = 10_000; // answered within this → full bonus
export const SPEED_ZERO_MS = 60_000; // answered after this → zero bonus

// ─── Summit / event ───
// summit_id is written to every submission as a data label only (the leaderboard
// gates on the rolling window below, not on this). It's now derived per-submission
// as that submission's own date — see buildPayload in game/payload.ts — so each
// summit is tagged with its actual date with zero per-event config.

// Rolling display window: the leaderboard shows only entries submitted within
// this many ms of now. This *replaces* summit_id gating — "the last 12h" is the
// current event's boundary, self-resetting between summits with zero config or
// sheet edits. Safe as long as consecutive summits are >12h apart in wall time.
export const LEADERBOARD_WINDOW_MS = 12 * 60 * 60 * 1000;

// ─── Leaderboard ───
export const LEADERBOARD_PAGE_SIZE = 10;
export const LEADERBOARD_POLL_MS = 10_000;
export const SHOW_LEADERBOARD = true;

// ─── Login info (portal SSO) ───
// Empty → always fall back to the team-name entry screen.
// When the portal team provides the endpoint, set it here and adapt useLoginInfo.
export const LOGIN_INFO_URL = "";

// ─── Drupal Webform API (unchanged transport) ───
const DRUPAL_ORIGIN = import.meta.env.DEV
  ? "/drupal-api"
  : "https://detect-t1d-insightstoaction.impetusdigital.com";

export const DRUPAL_SUBMIT_URL = `${DRUPAL_ORIGIN}/webform_rest/submit?_format=json`;
export const DRUPAL_CSRF_URL = `${DRUPAL_ORIGIN}/session/token`;
export const DRUPAL_RESULTS_URL = `${DRUPAL_ORIGIN}/api/detect_summit_results`;
export const DRUPAL_WEBFORM_ID = "detect_summit_results";
export const APP_VERSION = "1.0";

// ─── Google Sheets fallback ───
export const SHEETS_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbyGGaes80--oVp9h-pccume9fBugn6uaZd-30Zx_TQJ42Zv9kIVUASVoFJP9V_kA_qj8A/exec";
