import type { PatientProfile, SessionResult } from "../types";
import { APP_VERSION, SHEETS_WEBHOOK_URL } from "../config";
import { calculateScore, computeSpeedBonus, computeTotalMs } from "../leaderboard";

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
  const speedBonus = computeSpeedBonus(sessionResults);
  const score = calculateScore(cardsCorrect, maxStreak, speedBonus);

  const payload: Record<string, string | number> = {
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
    speed_bonus: speedBonus,
    total_ms: computeTotalMs(sessionResults),
  };

  // Sheet columns are card_p{n}_*; profile IDs are c{n} — strip prefix and rekey
  for (const result of sessionResults) {
    const n = result.profileId.replace(/^[a-z]+/, "");
    payload[`card_p${n}_correct`] = result.correct ? "yes" : "no";
    payload[`card_p${n}_ms`] = result.elapsedMs;
  }

  return payload;
}

export function useSheetsSubmission() {
  return {
    submitSession: (params: SubmitSessionParams) => {
      if (!SHEETS_WEBHOOK_URL) return;

      // Apps Script doesn't respond to CORS preflight — no-cors bypasses it.
      // Response is opaque so we can't verify success, but the row still lands.
      fetch(SHEETS_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(params)),
      }).catch((err) => console.error("[wwys] Sheet submission failed:", err));
    },
  };
}
