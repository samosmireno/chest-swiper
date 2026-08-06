import { DRUPAL_RESULTS_URL, SHEETS_WEBHOOK_URL, APP_VERSION } from "../config";

export interface RawSubmission {
  [key: string]: string | number | undefined;
}

// Sheets coerces "1.0" → 1 as a number, so compare numerically.
function matchesVersion(sub: RawSubmission): boolean {
  return Number(sub.app_version) === Number(APP_VERSION);
}

async function fetchDrupal(): Promise<RawSubmission[]> {
  const res = await fetch(DRUPAL_RESULTS_URL);
  if (!res.ok) throw new Error(`Drupal GET failed: HTTP ${res.status}`);
  const body: unknown = await res.json();
  return Array.isArray(body)
    ? (body as RawSubmission[])
    : ((body as { data?: RawSubmission[] }).data ?? []);
}

async function fetchSheets(): Promise<RawSubmission[]> {
  const res = await fetch(SHEETS_WEBHOOK_URL);
  if (!res.ok) throw new Error(`Sheets GET failed: HTTP ${res.status}`);
  const body: unknown = await res.json();
  return Array.isArray(body) ? (body as RawSubmission[]) : [];
}

/**
 * Fetches version-filtered submissions from Drupal, falling back to Sheets.
 * Returns [] if DRUPAL_RESULTS_URL is not configured, both sources fail,
 * or neither has data matching APP_VERSION.
 */
export async function fetchRemoteSubmissions(): Promise<RawSubmission[]> {
  if (!DRUPAL_RESULTS_URL) return [];

  let subs: RawSubmission[] = [];

  try {
    const drupalSubs = await fetchDrupal();
    subs = drupalSubs.filter(matchesVersion);
  } catch (err) {
    console.warn("[wwys] Drupal fetch failed", err);
  }

  if (subs.length === 0 && SHEETS_WEBHOOK_URL) {
    console.info("[wwys] No versioned Drupal data — trying Sheets");
    try {
      const sheetSubs = await fetchSheets();
      subs = sheetSubs.filter(matchesVersion);
    } catch (err) {
      console.warn("[wwys] Sheets fetch failed", err);
    }
  }

  return subs;
}
