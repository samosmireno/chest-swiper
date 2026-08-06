import {
  DRUPAL_SUBMIT_URL,
  DRUPAL_CSRF_URL,
  DRUPAL_RESULTS_URL,
  SHEETS_WEBHOOK_URL,
  APP_VERSION,
  LEADERBOARD_WINDOW_MS,
} from './config'
import { buildPayload, type Payload } from './game/payload'
import type { SessionResult } from './game/sessionResult'

export interface RawSubmission {
  [key: string]: string | number | undefined
}

// A backend the app can both write a Session result to and read matching
// results back from. Each adapter owns its own transport quirks (CSRF, no-cors,
// response shape) and self-gates on whether its config URL is set.
export interface SubmissionTransport {
  readonly name: string
  submit(payload: Payload): Promise<void>
  fetchResults(): Promise<RawSubmission[]>
}

// A row is shown when it was submitted within the rolling display window. This
// is the leaderboard's event boundary, replacing per-summit summit_id gating.
// submitted_at round-trips verbatim from both Drupal and the Sheets fallback
// (the .gs writes it as plain text via setNumberFormat("@")), so comparing
// absolute UTC instants is timezone-safe. A future instant (clock skew) still
// shows; anything older than the window is dropped.
function withinWindow(raw: RawSubmission['submitted_at']): boolean {
  const submitted = new Date(String(raw ?? '')).getTime()
  if (Number.isNaN(submitted)) return false
  return Date.now() - submitted < LEADERBOARD_WINDOW_MS
}

// Sheets coerces "1.0" → 1 as a number, so compare app_version numerically.
export function matchesSubmission(sub: RawSubmission): boolean {
  return Number(sub.app_version) === Number(APP_VERSION) && withinWindow(sub.submitted_at)
}

// Attribute a raw submission row to a case. Trust an explicit case_id; otherwise
// infer it from which single caseN_total column is populated (single-case rows).
// Cumulative legacy rows (two+ totals) are ambiguous and return null — they are
// filtered out of every per-case board.
export function rowCase(sub: RawSubmission): string | null {
  const explicit = sub.case_id != null && String(sub.case_id) !== '' ? String(sub.case_id) : ''
  if (explicit) return explicit
  const played: string[] = []
  for (const key of Object.keys(sub)) {
    const m = key.match(/^case(\d+)_total$/)
    if (m && sub[key] != null && String(sub[key]) !== '') played.push(`case${m[1]}`)
  }
  return played.length === 1 ? played[0] : null
}

// ─── Adapters ───────────────────────────────────────────────────────────────

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch(`${DRUPAL_CSRF_URL}?t=${Date.now()}`, { credentials: 'include' })
  if (!res.ok) throw new Error(`CSRF fetch failed: HTTP ${res.status}`)
  return res.text()
}

export const drupalTransport: SubmissionTransport = {
  name: 'drupal',

  async submit(payload) {
    if (!DRUPAL_SUBMIT_URL) return
    const token = await fetchCsrfToken()
    const res = await fetch(DRUPAL_SUBMIT_URL, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  },

  async fetchResults() {
    if (!DRUPAL_RESULTS_URL) return []
    const res = await fetch(DRUPAL_RESULTS_URL)
    if (!res.ok) throw new Error(`Drupal GET failed: HTTP ${res.status}`)
    const body: unknown = await res.json()
    return Array.isArray(body)
      ? (body as RawSubmission[])
      : ((body as { data?: RawSubmission[] }).data ?? [])
  },
}

export const sheetsTransport: SubmissionTransport = {
  name: 'sheets',

  async submit(payload) {
    if (!SHEETS_WEBHOOK_URL) return
    // no-cors → opaque response; we can't read status, so this is fire-and-forget.
    await fetch(SHEETS_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  },

  async fetchResults() {
    if (!SHEETS_WEBHOOK_URL) return []
    const res = await fetch(SHEETS_WEBHOOK_URL)
    if (!res.ok) throw new Error(`Sheets GET failed: HTTP ${res.status}`)
    const body: unknown = await res.json()
    return Array.isArray(body) ? (body as RawSubmission[]) : []
  },
}

// ─── Gateway ──────────────────────────────────────────────────────────────

export interface SubmissionGateway {
  submitResult(result: SessionResult): void
  fetchResults(): Promise<RawSubmission[]>
}

export function makeSubmissionGateway(transports: SubmissionTransport[]): SubmissionGateway {
  return {
    // Write policy: fan out to every transport. Each catches its own failure so
    // one dead backend never blocks the others.
    submitResult(result) {
      const payload = buildPayload(result)
      for (const t of transports) {
        t.submit(payload).catch((err) => console.warn(`[detect] ${t.name} submission failed`, err))
      }
    },

    // Read policy: try transports in priority order, return the first non-empty
    // set of matching rows. Drupal is preferred; Sheets is the fallback.
    async fetchResults() {
      for (const t of transports) {
        try {
          const rows = (await t.fetchResults()).filter(matchesSubmission)
          if (rows.length > 0) return rows
        } catch (err) {
          console.warn(`[detect] ${t.name} fetch failed`, err)
        }
      }
      return []
    },
  }
}

export const submissions = makeSubmissionGateway([drupalTransport, sheetsTransport])
