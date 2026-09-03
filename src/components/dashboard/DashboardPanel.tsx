import { lazy, Suspense } from "react";
import { SessionStats } from "./SessionStats";
import { LeaderboardPanel } from "../LeaderboardPanel";
import { computeSessionStats } from "../../utils/sessionStats";
import { GAME_SCREEN_PANEL } from "../../config";
import type {
  SessionResult,
  CumulativeStats,
  PatientProfile,
} from "../../types";

// Code-split: recharts (~most of the app bundle) loads with this chunk
// instead of blocking first paint of the attract screen.
const CommunityInsights = lazy(() => import("./CommunityInsights"));

interface DashboardPanelProps {
  sessionResults: SessionResult[];
  cumulativeStats: CumulativeStats;
  profiles: PatientProfile[];
}

export function DashboardPanel({
  sessionResults,
  cumulativeStats,
  profiles,
}: DashboardPanelProps) {
  const { correct, missed, accuracy } = computeSessionStats(sessionResults);

  return (
    // No column-level chrome: each dashboard box carries its own border and
    // fill (Figma "Frame 4", node 47:1383 — the stats box and the leaderboard
    // box sit directly on the scene).
    <div className="flex min-h-dvh w-full flex-col sm:min-h-0 sm:overflow-hidden sm:w-auto sm:flex-2 lg:flex-1">
      <SessionStats correct={correct} missed={missed} accuracy={accuracy} />
      {GAME_SCREEN_PANEL === "leaderboard" ? (
        // min-h-0 so the panel's internal overflow-y-auto can actually scroll
        <div className="min-h-0 flex-1">
          <LeaderboardPanel />
        </div>
      ) : (
        // Insights variant (off by default): dressed like the leaderboard box —
        // 2px mid-teal stroke, charcoal @ 40% fill — so it sits with the
        // session box above it.
        <div className="border-mid-teal bg-charcoal/40 flex min-h-0 flex-1 flex-col rounded-tl-2xl border-2">
          <Suspense fallback={<div className="min-h-64 flex-1" />}>
            <CommunityInsights stats={cumulativeStats} profiles={profiles} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
