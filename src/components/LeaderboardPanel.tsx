import { useState } from "react";
import { useGameState } from "../context/useGame";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { LEADERBOARD_PAGE_SIZE } from "../config";
import { formatClock } from "../utils/formatClock";

export function LeaderboardPanel() {
  const state = useGameState();
  const { entries, loading } = useLeaderboard(state.lastSessionId);
  // null until the player paginates manually; until then the board follows
  // the current player's page automatically as entries arrive.
  const [pageOverride, setPageOverride] = useState<number | null>(null);

  const totalPages = Math.max(
    1,
    Math.ceil(entries.length / LEADERBOARD_PAGE_SIZE),
  );

  const currentPlayerIndex = state.lastSessionId
    ? entries.findIndex((e) => e.sessionId === state.lastSessionId)
    : -1;

  const autoPage =
    currentPlayerIndex >= 0
      ? Math.floor(currentPlayerIndex / LEADERBOARD_PAGE_SIZE)
      : 0;

  // Clamp so a changing entry list can never leave the page out of range.
  const page = Math.min(pageOverride ?? autoPage, totalPages - 1);

  const pageEntries = entries.slice(
    page * LEADERBOARD_PAGE_SIZE,
    page * LEADERBOARD_PAGE_SIZE + LEADERBOARD_PAGE_SIZE,
  );

  return (
    /* Figma "Frame 6" (node 52:1670): a full-height box on the scene — 2px
       mid-teal stroke, charcoal @ 40% fill, 16px radius on the top-left
       corner only (it runs off the bottom of the screen and its right edge
       is the screen edge). Header row 72px (title + 2px rule), rows inset
       23px from the box, 40px tall at a 64px pitch. Paddings are the design's
       outer-edge offsets minus the 2px border, in rem. */
    <section
      aria-label="Leaderboard"
      className="border-mid-teal bg-charcoal/40 flex h-full flex-col rounded-tl-2xl border-2"
    >
      {/* Header — "Leaderboard title 2" (20/32) over the Line 2 rule */}
      <h2 className="type-panel-title text-off-white border-mid-teal shrink-0 border-b-2 px-[1.375rem] pt-[1.375rem] pb-[0.9375rem] text-xl/8">
        Leaderboard
      </h2>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto px-[1.4375rem] pt-8 pb-6">
        {loading ? (
          <p className="font-dm-sans text-off-white pt-1.5 text-center text-base/6">
            Loading scores…
          </p>
        ) : entries.length === 0 ? (
          <p className="font-dm-sans text-off-white pt-1.5 text-center text-base/6">
            No scores yet.
          </p>
        ) : (
          <ol className="flex flex-col gap-6">
            {pageEntries.map((entry, i) => {
              const rank = page * LEADERBOARD_PAGE_SIZE + i + 1;
              const isCurrent = entry.sessionId === state.lastSessionId;
              return (
                /* "Leaderboard Score" (node 52:1763): rank | name [YOU] … mm:ss score n/12 */
                <li
                  key={entry.sessionId || `${entry.timestamp}-${i}`}
                  className="border-light-mint/60 flex h-10 items-center rounded-lg border-2 pr-[0.6875rem] pl-[0.8125rem]"
                >
                  {/* Rank column is 22px in the design; a two-digit rank keeps
                      its natural width plus a 4px gap instead of touching the name */}
                  <span className="type-lb-points text-gold-accent min-w-[1.375rem] shrink-0 pr-1">
                    {rank}
                  </span>
                  <span className="type-lb-name text-off-white min-w-0 truncate">
                    {entry.username}
                  </span>
                  {isCurrent && (
                    <span className="font-dm-sans text-gold-accent ml-2 shrink-0 text-base/6 font-bold">
                      YOU
                    </span>
                  )}
                  {/* Time column (node 2024:2732): the session clock's
                      total, light-mint DM Sans between the name and the score */}
                  <span className="font-dm-sans text-light-mint ml-auto shrink-0 pl-2 text-base/6 tabular-nums">
                    {formatClock(entry.totalMs)}
                  </span>
                  <span className="type-lb-points text-off-white ml-2 shrink-0">
                    {entry.score}
                  </span>
                  <span className="font-dm-sans text-light-mint ml-2 shrink-0 text-base/6">
                    {entry.correct}/{entry.total}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Pagination — not in the Figma frame: small Next Case buttons either
          side of a small case counter, under a rule mirroring the header's.
          Same box height as the header (2px rule + 69px, over the box's 2px
          bottom edge) so its rule meets the summary pane's TRY AGAIN footer
          rule across the screen at every root — px borders don't scale with
          the rem paddings, hence the calc. */}
      {totalPages > 1 && (
        <div className="border-mid-teal flex h-[calc(4.3125rem_+_2px)] shrink-0 items-center justify-between border-t-2 px-[1.4375rem]">
          <button
            type="button"
            className="btn-outline btn-outline-sm"
            onClick={() => setPageOverride(Math.max(0, page - 1))}
            disabled={page === 0}
            aria-label="Previous page"
          >
            Prev
          </button>
          <span className="case-counter case-counter-sm" aria-live="polite">
            {page + 1}/{totalPages}
          </span>
          <button
            type="button"
            className="btn-outline btn-outline-sm"
            onClick={() => setPageOverride(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
