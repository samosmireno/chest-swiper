import type { PatientProfile, SessionResult } from "../types";
import {
  DRUPAL_SUBMIT_URL,
  DRUPAL_CSRF_URL,
  DRUPAL_WEBFORM_ID,
  APP_VERSION,
  SHEETS_WEBHOOK_URL,
} from "../config";
import { calculateScore } from "../leaderboard";

interface SubmitSessionParams {
  firstName: string;
  lastName: string;
  email: string;
  specialty: string;
  sessionResults: SessionResult[];
  deck: PatientProfile[];
  maxStreak: number;
  sessionId: string;
}

function buildPayload({
  firstName,
  lastName,
  email,
  specialty,
  sessionResults,
  deck,
  maxStreak,
  sessionId,
}: SubmitSessionParams): Record<string, string | number> {
  const cardsCorrect = sessionResults.filter((r) => r.correct).length;
  const score = calculateScore(cardsCorrect, maxStreak);

  const payload: Record<string, string | number> = {
    webform_id: DRUPAL_WEBFORM_ID,
    app_version: APP_VERSION,
    username: `${firstName} ${lastName}`,
    email,
    specialty,
    session_id: sessionId,
    submitted_at: new Date().toISOString(),
    score,
    cards_correct: cardsCorrect,
    cards_total: deck.length,
    max_streak: maxStreak,
  };

  // Webform expects card_p{n}_correct; profile IDs are c{n} — strip prefix and rekey
  for (const result of sessionResults) {
    const n = result.profileId.replace(/^[a-z]+/, "");
    payload[`card_p${n}_correct`] = result.correct ? "yes" : "no";
  }

  return payload;
}

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch(`${DRUPAL_CSRF_URL}?t=${Date.now()}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`CSRF fetch failed: HTTP ${res.status}`);
  return res.text();
}

async function postToDrupal(payload: Record<string, string | number>) {
  const token = await fetchCsrfToken();
  const res = await fetch(DRUPAL_SUBMIT_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export function useWebformSubmission() {
  return {
    submitSession: (params: SubmitSessionParams) => {
      const payload = buildPayload(params);

      // Fire both in parallel. Sheets is always the guaranteed record;
      // Drupal gets it when available. If Drupal fails, Sheets still has the row.
      if (DRUPAL_SUBMIT_URL) {
        postToDrupal(payload).catch((err) =>
          console.warn("[wwys] Drupal submission failed", err)
        );
      }

      if (SHEETS_WEBHOOK_URL) {
        // Apps Script doesn't respond to CORS preflight — no-cors bypasses it.
        // Response is opaque so we can't verify success, but the row still lands.
        fetch(SHEETS_WEBHOOK_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch((err) => console.error("[wwys] Sheet submission failed:", err));
      }
    },
  };
}
