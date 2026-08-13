import { SHEETS_WEBHOOK_URL, APP_VERSION } from "../config";

export interface RawSubmission {
  [key: string]: string | number | undefined;
}

// Sheets coerces "1.0" → 1 as a number, so compare numerically.
function matchesVersion(sub: RawSubmission): boolean {
  return Number(sub.app_version) === Number(APP_VERSION);
}

/**
 * Fetches version-filtered submissions from the Sheets web app.
 * Returns [] if SHEETS_WEBHOOK_URL is not configured, the fetch fails,
 * or no rows match APP_VERSION.
 */
export async function fetchRemoteSubmissions(): Promise<RawSubmission[]> {
  if (!SHEETS_WEBHOOK_URL) return [];

  try {
    const res = await fetch(SHEETS_WEBHOOK_URL);
    if (!res.ok) throw new Error(`Sheets GET failed: HTTP ${res.status}`);
    const body: unknown = await res.json();
    const subs = Array.isArray(body) ? (body as RawSubmission[]) : [];
    return subs.filter(matchesVersion);
  } catch (err) {
    console.warn("[wwys] Sheets fetch failed", err);
    return [];
  }
}
