import {
  SHEETS_WEBHOOK_URL,
  APP_VERSION,
  LEADERBOARD_MIN_VERSION,
} from "../config";

export interface RawSubmission {
  [key: string]: string | number | undefined;
}

// Sheets coerces "1.0" → 1 as a number, so compare numerically. (Minor
// versions must stay single-digit for this to order correctly — "2.10"
// would be stored as 2.1 by the sheet anyway.)
function versionOf(sub: RawSubmission): number {
  return Number(sub.app_version);
}

/** Rows written by this exact build — same deck wording, same scoring. */
export function matchesCurrentVersion(sub: RawSubmission): boolean {
  return versionOf(sub) === Number(APP_VERSION);
}

/** Rows whose score is comparable with today's formula (see config). */
function isScoreCompatible(sub: RawSubmission): boolean {
  return versionOf(sub) >= Number(LEADERBOARD_MIN_VERSION);
}

/**
 * Fetches score-compatible submissions (APP_VERSION >= LEADERBOARD_MIN_VERSION)
 * from the Sheets web app. Consumers that need the exact build filter
 * further with matchesCurrentVersion. Returns [] if SHEETS_WEBHOOK_URL is
 * not configured, the fetch fails, or no rows qualify.
 */
async function fetchRemoteSubmissions(): Promise<RawSubmission[]> {
  if (!SHEETS_WEBHOOK_URL) return [];

  try {
    const res = await fetch(SHEETS_WEBHOOK_URL);
    if (!res.ok) throw new Error(`Sheets GET failed: HTTP ${res.status}`);
    const body: unknown = await res.json();
    const subs = Array.isArray(body) ? (body as RawSubmission[]) : [];
    return subs.filter(isScoreCompatible);
  } catch (err) {
    console.warn("[wwys] Sheets fetch failed", err);
    return [];
  }
}

// One shared fetch per attract→game→summary cycle: the community-stats chart
// and both leaderboard mounts (game screen and summary) read the same response
// instead of each issuing their own GET.
let pending: Promise<RawSubmission[]> | null = null;

/**
 * Starts a fresh shared fetch. Called from the attract screen so the response
 * lands while the player is still filling the form — if it only began when
 * the game screen mounted, it would arrive seconds into play and the
 * consumer's data mount would block a random frame (measured landing
 * mid-drag on the chart panel). Refetches on every call: the kiosk cycles
 * many sessions per page load, and each attract visit should pull fresh
 * community numbers.
 */
export function prefetchRemoteSubmissions(): void {
  if (!SHEETS_WEBHOOK_URL) return;
  pending = fetchRemoteSubmissions();
}

/**
 * The current cycle's submissions. Self-starts if no prefetch ran (demo mode
 * skips the attract screen). Never rejects — resolves [] on failure.
 */
export function getRemoteSubmissions(): Promise<RawSubmission[]> {
  if (!pending) pending = fetchRemoteSubmissions();
  return pending;
}
