import { useState, useEffect } from "react";
import type { CumulativeStats } from "../types";
import { SHEETS_WEBHOOK_URL } from "../config";
import { getRemoteSubmissions } from "../utils/remoteSubmissions";
import type { RawSubmission } from "../utils/remoteSubmissions";

function transformSubmissions(submissions: RawSubmission[]): CumulativeStats {
  const perCard: CumulativeStats["perCard"] = {};

  for (const sub of submissions) {
    for (const [key, value] of Object.entries(sub)) {
      const match = key.match(/^card_(.+)_correct$/);
      if (!match) continue;
      // Apps Script writes "" for cards absent from a submission — those
      // blanks must not count as shown or they dilute the miss rates.
      if (value !== "yes" && value !== "no") continue;
      const profileId = `c${match[1].replace(/^p/, "")}`;
      const existing = perCard[profileId] ?? { timesShown: 0, timesCorrect: 0 };
      perCard[profileId] = {
        timesShown: existing.timesShown + 1,
        timesCorrect: existing.timesCorrect + (value === "yes" ? 1 : 0),
      };
    }
  }

  return { totalSessions: submissions.length, perCard };
}

export function useCommunityStats(fallback: CumulativeStats): {
  stats: CumulativeStats;
  loading: boolean;
} {
  const [data, setData] = useState<CumulativeStats | null>(null);
  const [loading, setLoading] = useState(!!SHEETS_WEBHOOK_URL);

  useEffect(() => {
    if (!SHEETS_WEBHOOK_URL) return;

    // Normally already in flight from the attract screen's prefetch;
    // getRemoteSubmissions self-starts to cover demo mode, which skips
    // straight to the game.
    let cancelled = false;
    getRemoteSubmissions().then((subs) => {
      if (cancelled) return;
      if (subs.length > 0) setData(transformSubmissions(subs));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats: data ?? fallback, loading };
}
