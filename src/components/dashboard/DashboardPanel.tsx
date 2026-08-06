import { SessionScore } from "./SessionScore";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { SHOW_LEADERBOARD } from "../../config";

export function DashboardPanel({
  focusCurrentPlayer = false,
}: {
  focusCurrentPlayer?: boolean;
}) {
  return (
    <div className="border-purple-accent/25 bg-panel/80 flex w-full flex-col border-l sm:w-64 sm:shrink-0 xl:w-96">
      <SessionScore />
      {SHOW_LEADERBOARD && (
        <LeaderboardPanel focusCurrentPlayer={focusCurrentPlayer} />
      )}
    </div>
  );
}
