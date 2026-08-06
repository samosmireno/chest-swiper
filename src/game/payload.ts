import type { SessionResult } from './sessionResult'
import { APP_VERSION, DRUPAL_WEBFORM_ID } from '../config'
import { caseNumber } from '../case'

export type Payload = Record<string, string | number>

// YYYY-MM-DD in the kiosk's *local* timezone, so summit_id reflects the actual
// event date even for evening submissions that would roll into the next UTC day.
export function localDateTag(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function buildPayload(result: SessionResult): Payload {
  const { identity, sessionId, completedAt, durationSeconds, total, cases } = result
  const submittedAt = new Date(completedAt)
  const payload: Payload = {
    webform_id: DRUPAL_WEBFORM_ID,
    app_version: APP_VERSION,
    // This submission's own date, in the kiosk's local timezone — so each summit
    // is tagged with its actual event date (submitted_at below stays UTC).
    summit_id: localDateTag(submittedAt),
    case_id: cases[0]?.caseId ?? '',
    session_id: sessionId,
    participant_name: identity?.name ?? '',
    identity_type: identity?.type ?? 'team',
    email: identity?.email ?? '',
    specialty: identity?.specialty ?? '',
    submitted_at: submittedAt.toISOString(),
    duration_seconds: durationSeconds,
    total_correct: total.correct,
    total_questions: total.total,
    total_score: total.score,
  }

  cases.forEach((c) => {
    const n = caseNumber(c.caseId)
    payload[`case${n}_correct`] = c.line.correct
    payload[`case${n}_total`] = c.line.total
    payload[`case${n}_score`] = c.line.score
    c.answers.forEach((a, qi) => {
      payload[`c${n}q${qi + 1}_answer`] = a.chosenLabel
      payload[`c${n}q${qi + 1}_correct`] = a.correct ? 'yes' : 'no'
    })
  })

  return payload
}
