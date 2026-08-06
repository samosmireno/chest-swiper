import { useEffect, useRef } from "react";
import { useGame } from "../../context/GameContext";
import { useDrupalLeaderboard } from "../../hooks/useDrupalLeaderboard";
import { caseNumber } from "../../case";

export function LeaderboardPanel({
  focusCurrentPlayer = false,
}: {
  focusCurrentPlayer?: boolean;
}) {
  const { state, cases } = useGame();
  const caseId = cases[0]?.id ?? "";
  const { entries, loading } = useDrupalLeaderboard(state.sessionId, caseId);

  const n = caseNumber(caseId);
  const heading = n ? `Case ${n} Leaderboard` : "Leaderboard";

  const scrollRef = useRef<HTMLDivElement>(null);
  const currentRowRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    if (!focusCurrentPlayer || hasScrolledRef.current) return;
    const container = scrollRef.current;
    const row = currentRowRef.current;
    if (!container || !row) return;
    // Only act when the panel is its own scroll context (sm+ side panel).
    // On the stacked/mobile layout the container isn't scrollable, so this
    // is a no-op and the page is never moved.
    if (container.scrollHeight <= container.clientHeight) return;
    container.scrollTop =
      row.offsetTop - container.clientHeight / 2 + row.clientHeight / 2;
    hasScrolledRef.current = true;
  }, [focusCurrentPlayer, entries]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-purple-accent/30 bg-panel/95 flex h-12 shrink-0 items-center justify-center border-b">
        <p className="font-display text-lg font-extrabold tracking-[0.18em] text-white uppercase">
          {heading}
        </p>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
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
            {entries.map((entry, i) => {
              const isCurrent = entry.sessionId === state.sessionId;
              return (
                <div
                  key={entry.sessionId || `${entry.timestamp}-${i}`}
                  ref={isCurrent ? currentRowRef : undefined}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ${isCurrent ? "bg-gold-400/10 ring-gold-400/40 ring-1" : "bg-white/5"}`}
                >
                  <span className="w-6 shrink-0 text-sm font-black text-white/35">
                    {i + 1}
                  </span>
                  <span className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold wrap-break-word text-white">
                    {entry.username}
                    {isCurrent && (
                      <span className="text-gold-400 ml-2 text-xs font-bold">
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
    </div>
  );
}
