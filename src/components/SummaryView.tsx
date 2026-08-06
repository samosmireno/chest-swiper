import { SummaryPanel } from "./SummaryPanel";
import { LeaderboardPanel } from "./LeaderboardPanel";

export function SummaryView() {
  return (
    <div className="flex h-full w-full flex-col overflow-y-auto sm:flex-row sm:overflow-hidden">
      <div className="flex-none sm:flex-1 sm:overflow-hidden">
        <SummaryPanel />
      </div>
      <div className="min-h-screen shrink-0 sm:min-h-0 sm:h-auto sm:w-80">
        <LeaderboardPanel />
      </div>
    </div>
  );
}
