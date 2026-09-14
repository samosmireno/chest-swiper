import { SummaryPanel } from "./SummaryPanel";
import { LeaderboardPanel } from "./LeaderboardPanel";

export function SummaryView() {
  return (
    <div className="flex h-full w-full flex-col overflow-y-auto sm:flex-row sm:overflow-hidden">
      {/* h-viewport below sm so SummaryPanel's h-full resolves against something:
          without it the pane is auto-height, its own flex-1 scroller never
          becomes one, and the "Results:" header and the TRY AGAIN footer
          scroll away above and below ~9,000px of case cards. With it the
          phone gets the same fixed header / scrolling list / fixed footer as
          sm+, and the leaderboard is the screen below. */}
      <div className="h-viewport flex-none overflow-hidden sm:h-auto sm:flex-1">
        <SummaryPanel />
      </div>
      {/* Figma "Frame 6": the leaderboard box is 360px wide (22.5rem at the
          kiosk root); it stays 320 on the narrower sm/md widths. */}
      <div className="min-h-viewport shrink-0 sm:h-auto sm:min-h-0 sm:w-80 lg:w-[22.5rem]">
        <LeaderboardPanel />
      </div>
    </div>
  );
}
