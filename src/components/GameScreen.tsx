import { useEffect } from "react";
import { useGameDispatch, useGameState } from "../context/useGame";
import { useCommunityStats } from "../hooks/useCommunityStats";
import { shuffle } from "../utils/shuffle";
import { GamePanel } from "./game/GamePanel";
import { DashboardPanel } from "./dashboard/DashboardPanel";
import type { SwipeSide } from "../types";

export function GameScreen() {
  const state = useGameState();
  const { dispatch, profiles } = useGameDispatch();
  const { deck, currentIndex, sessionResults, cumulativeStats } = state;
  const { stats: communityStats } = useCommunityStats(cumulativeStats);

  // DEMO: Auto-start when skipping AttractScreen (demo mode)
  useEffect(() => {
    if (deck.length === 0) dispatch({ type: "START_GAME", deck: shuffle(profiles) });
  }, [deck.length, dispatch, profiles]);

  const handleSwipe = (side: SwipeSide, elapsedMs: number) => {
    const profile = deck[currentIndex];
    if (!profile) return;
    dispatch({ type: "SWIPE", profileId: profile.id, side, elapsedMs });
  };

  const handleAdvance = () => dispatch({ type: "ADVANCE" });

  // Session-clock edges, timestamped by the card (see CardStack).
  const handleCardShown = (at: number) => dispatch({ type: "CARD_SHOWN", at });
  const handleCardCommit = (at: number) => dispatch({ type: "CARD_COMMITTED", at });

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto sm:flex-row sm:overflow-hidden">
      <GamePanel
        deck={deck}
        currentIndex={currentIndex}
        onSwipe={handleSwipe}
        onAdvance={handleAdvance}
        onCardShown={handleCardShown}
        onCardCommit={handleCardCommit}
      />
      <DashboardPanel
        sessionResults={sessionResults}
        cumulativeStats={communityStats}
        profiles={profiles}
      />
    </div>
  );
}
