import { useState, useEffect } from "react";
import type { LeaderboardEntry } from "../leaderboard";
import { getLeaderboard } from "../leaderboard";
import { SHEETS_WEBHOOK_URL, APP_VERSION, LEADERBOARD_WINDOW_MS } from "../config";
import { getRemoteSubmissions } from "../utils/remoteSubmissions";
import type { RawSubmission } from "../utils/remoteSubmissions";

function transformSubmissions(subs: RawSubmission[]): LeaderboardEntry[] {
  return subs
    .map((sub) => ({
      username: String(sub.username ?? ""),
      email: sub.email ? String(sub.email) : undefined,
      score: Number(sub.score),
      correct: Number(sub.cards_correct),
      total: Number(sub.cards_total),
      maxStreak: Number(sub.max_streak),
      totalMs: Number(sub.total_ms),
      // Prefer the round-tripped session_id (stable, exact); fall back to
      // submitted_at for rows written before the session_id column existed.
      sessionId: sub.session_id ? String(sub.session_id) : String(sub.submitted_at),
      timestamp: new Date(String(sub.submitted_at)).getTime(),
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Scopes entries to the current summit by dropping anything older than
 * LEADERBOARD_WINDOW_MS before the newest entry. Anchoring on the newest
 * entry (rather than the device clock) keeps the board correct even if the
 * kiosk clock is wrong. `anchorFloor` lets the just-finished player's local
 * timestamp define the anchor before their row round-trips from the sheet,
 * so the first player of a new summit doesn't see the previous summit's board.
 */
function withinWindow(
  entries: LeaderboardEntry[],
  anchorFloor?: number
): LeaderboardEntry[] {
  if (entries.length === 0) return entries;
  const anchor = Math.max(...entries.map((e) => e.timestamp), anchorFloor ?? 0);
  const cutoff = anchor - LEADERBOARD_WINDOW_MS;
  return entries.filter((e) => e.timestamp >= cutoff);
}

function attachCurrentPlayer(
  entries: LeaderboardEntry[],
  lastSessionId: string
): LeaderboardEntry[] {
  const local = getLeaderboard().find((e) => e.sessionId === lastSessionId);
  if (!local) return entries;

  // Exact join when session_id round-tripped; otherwise fall back to the
  // username + timestamp window (rows without a session_id value).
  const exactIdx = entries.findIndex((e) => e.sessionId === lastSessionId);
  const idx =
    exactIdx >= 0
      ? exactIdx
      : entries.findIndex(
          (e) =>
            e.username === local.username &&
            Math.abs(e.timestamp - local.timestamp) < 10_000
        );

  // Already landed in the sheet: re-tag the remote row with our stable
  // sessionId so it highlights as the current player.
  if (idx >= 0) {
    const result = [...entries];
    result[idx] = { ...result[idx], sessionId: lastSessionId };
    return result;
  }

  // The submit POST races the leaderboard GET and usually loses, so the
  // player's row isn't in the remote results yet. Splice in the local entry
  // (which already holds the correct score and sessionId) so they always see
  // their own result; a later fetch will match-and-re-tag it via the branch above.
  return [...entries, local].sort((a, b) => b.score - a.score);
}

export function useLeaderboard(lastSessionId: string): {
  entries: LeaderboardEntry[];
  loading: boolean;
} {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() =>
    withinWindow(getLeaderboard())
  );
  const [loading, setLoading] = useState(!!SHEETS_WEBHOOK_URL);

  useEffect(() => {
    if (!SHEETS_WEBHOOK_URL) return;

    (async () => {
      try {
        const subs = await getRemoteSubmissions();

        if (subs.length === 0) {
          console.info(`[wwys] No remote data for v${APP_VERSION} — using local`);
          return;
        }

        // Anchor the window on the just-finished player so the first player
        // of a new summit doesn't inherit the previous summit's board.
        const anchorFloor = lastSessionId
          ? getLeaderboard().find((e) => e.sessionId === lastSessionId)?.timestamp
          : undefined;

        // Window before splicing the current player in, so they're never
        // filtered out — they define the anchor and are always shown.
        let result = withinWindow(transformSubmissions(subs), anchorFloor);
        if (lastSessionId) {
          result = attachCurrentPlayer(result, lastSessionId);
        }
        setEntries(result);
      } finally {
        setLoading(false);
      }
    })();
  }, [lastSessionId]);

  return { entries, loading };
}
