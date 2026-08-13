import { useState, useEffect } from "react";
import { useGame } from "../context/useGame";
import { useDrupalLeaderboard } from "../hooks/useDrupalLeaderboard";
import { LEADERBOARD_PAGE_SIZE } from "../config";

export function LeaderboardPanel() {
  const { state } = useGame();
  const { entries, loading } = useDrupalLeaderboard(state.lastSessionId);
  const [page, setPage] = useState(0);

  const totalPages = Math.max(
    1,
    Math.ceil(entries.length / LEADERBOARD_PAGE_SIZE),
  );

  const currentPlayerIndex = state.lastSessionId
    ? entries.findIndex((e) => e.sessionId === state.lastSessionId)
    : -1;

  // Scroll to current player's page once entries arrive from Drupal.
  // Also resets page when entries change so we never end up out of range.
  useEffect(() => {
    if (currentPlayerIndex >= 0) {
      setPage(Math.floor(currentPlayerIndex / LEADERBOARD_PAGE_SIZE));
    } else {
      setPage(0);
    }
  }, [currentPlayerIndex, entries.length]);

  const pageEntries = entries.slice(
    page * LEADERBOARD_PAGE_SIZE,
    page * LEADERBOARD_PAGE_SIZE + LEADERBOARD_PAGE_SIZE,
  );

  return (
    <div
      className="flex h-full flex-col bg-panel/85 border-l border-t border-purple-accent/25"
    >
      {/* Header */}
      <div
        className="flex h-14 shrink-0 items-center px-6 bg-panel/95 border-b border-purple-accent/30"
      >
        <p className="font-display font-extrabold tracking-[0.18em] text-white text-xl uppercase">
          Leaderboard
        </p>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="py-8 text-center text-sm text-white/30">
            Loading scores…
          </p>
        ) : entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/30">
            No scores yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {pageEntries.map((entry, i) => {
              const rank = page * LEADERBOARD_PAGE_SIZE + i + 1;
              const isCurrent =
                entry.sessionId === state.lastSessionId;
              return (
                <div
                  key={entry.sessionId || `${entry.timestamp}-${i}`}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 ${isCurrent ? "bg-gold-400/10" : "bg-white/5"}`}
                  style={
                    isCurrent
                      ? { boxShadow: "inset 0 0 0 1px rgba(251,191,36,0.35)" }
                      : undefined
                  }
                >
                  <span className="w-6 shrink-0 text-sm font-black text-white/35">
                    {rank}
                  </span>
                  <span className="flex-1 truncate text-sm font-semibold text-white">
                    {entry.username}
                    {isCurrent && (
                      <span className="ml-2 text-xs font-bold text-gold-400">
                        YOU
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm font-black text-white">
                    {entry.score}
                  </span>
                  <span className="shrink-0 text-xs text-white/35">
                    {entry.correct}/{entry.total}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="flex h-14 shrink-0 items-center justify-between px-4 border-t border-purple-accent/20"
        >
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="font-display tracking-[0.15em] rounded-full px-4 py-1.5 text-xs font-bold uppercase transition-colors disabled:opacity-30 text-white/55 bg-white/10"
          >
            ← Prev
          </button>
          <span className="text-xs text-white/30">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="font-display tracking-[0.15em] rounded-full px-4 py-1.5 text-xs font-bold uppercase transition-colors disabled:opacity-30 text-white/55 bg-white/10"
          >
            Next →
          </button>
        </div>
      )}

    </div>
  );
}
