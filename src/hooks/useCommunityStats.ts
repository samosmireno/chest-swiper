import { useState, useEffect } from "react";
import type { CumulativeStats } from "../types";
import { SHEETS_WEBHOOK_URL } from "../config";
import { fetchRemoteSubmissions } from "../utils/remoteSubmissions";
import type { RawSubmission } from "../utils/remoteSubmissions";

function transformSubmissions(submissions: RawSubmission[]): CumulativeStats {
  const perCard: CumulativeStats["perCard"] = {};

  for (const sub of submissions) {
    for (const [key, value] of Object.entries(sub)) {
      const match = key.match(/^card_(.+)_correct$/);
      if (!match) continue;
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

    (async () => {
      try {
        const subs = await fetchRemoteSubmissions();
        if (subs.length > 0) {
          setData(transformSubmissions(subs));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { stats: data ?? fallback, loading };
}
