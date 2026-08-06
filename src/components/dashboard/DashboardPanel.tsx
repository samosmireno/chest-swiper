import { SessionStats } from "./SessionStats";
import { CommunityInsights } from "./CommunityInsights";
import { computeSessionStats } from "../../utils/sessionStats";
import type {
  SessionResult,
  CumulativeStats,
} from "../../types";

interface DashboardPanelProps {
  sessionResults: SessionResult[];
  cumulativeStats: CumulativeStats;
}

export function DashboardPanel({
  sessionResults,
  cumulativeStats,
}: DashboardPanelProps) {
  const { correct, missed, accuracy } = computeSessionStats(sessionResults);

  return (
    <div
      className="flex min-h-screen w-full flex-col sm:min-h-0 sm:overflow-hidden sm:w-auto sm:flex-2 lg:flex-1 bg-panel/80 border-l border-purple-accent/25"
    >
      <SessionStats correct={correct} missed={missed} accuracy={accuracy} />
      <CommunityInsights stats={cumulativeStats} />
    </div>
  );
}
