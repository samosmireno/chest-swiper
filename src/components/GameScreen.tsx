import { useEffect } from "react";
import { useGame } from "../context/GameContext";
import { useCommunityStats } from "../hooks/useCommunityStats";
import { shuffle } from "../utils/shuffle";
import { GamePanel } from "./game/GamePanel";
import { DashboardPanel } from "./dashboard/DashboardPanel";
import type { SwipeSide } from "../types";

export function GameScreen() {
  const { state, dispatch, profiles } = useGame();
  const { deck, currentIndex, sessionResults, cumulativeStats } = state;
  const { stats: communityStats } = useCommunityStats(cumulativeStats);

  // DEMO: Auto-start when skipping AttractScreen (demo mode)
  useEffect(() => {
    if (deck.length === 0) dispatch({ type: "START_GAME", deck: shuffle(profiles) });
  }, [deck.length, dispatch, profiles]);

  const handleSwipe = (side: SwipeSide) => {
    const profile = deck[currentIndex];
    if (!profile) return;
    dispatch({ type: "SWIPE", profileId: profile.id, side });
  };

  const handleAdvance = () => dispatch({ type: "ADVANCE" });

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto sm:flex-row sm:overflow-hidden">
      <GamePanel
        deck={deck}
        currentIndex={currentIndex}
        onSwipe={handleSwipe}
        onAdvance={handleAdvance}
      />
      <DashboardPanel
        sessionResults={sessionResults}
        cumulativeStats={communityStats}
      />
    </div>
  );
}
