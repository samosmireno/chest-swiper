import { SummaryPanel } from "./SummaryPanel";
import { LeaderboardPanel } from "./LeaderboardPanel";

export function SummaryView() {
  return (
    <div className="flex h-full w-full flex-col overflow-y-auto sm:flex-row sm:overflow-hidden">
      <div className="flex-none sm:flex-1 sm:overflow-hidden">
        <SummaryPanel />
      </div>
      {/* Figma "Frame 6": the leaderboard box is 360px wide (22.5rem at the
          kiosk root); it stays 320 on the narrower sm/md widths. */}
      <div className="min-h-dvh shrink-0 sm:h-auto sm:min-h-0 sm:w-80 lg:w-[22.5rem]">
        <LeaderboardPanel />
      </div>
    </div>
  );
}
