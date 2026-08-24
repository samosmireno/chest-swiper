import { useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { CardStack, type CardStackHandle } from "./CardStack";
import { ProgressBar } from "./ProgressBar";
import { SwipeGuide } from "./SwipeGuide";
import { StreakBanner } from "./StreakBanner";
import { RationaleOverlay } from "./RationaleOverlay";
import { useGameState } from "../../context/useGame";
import type { PatientProfile, SwipeSide } from "../../types";

interface GamePanelProps {
  deck: PatientProfile[];
  currentIndex: number;
  onSwipe: (side: SwipeSide, elapsedMs: number) => void;
  onAdvance: () => void;
}

const noop = () => {};

export function GamePanel({ deck, currentIndex, onSwipe, onAdvance }: GamePanelProps) {
  const cardStackRef = useRef<CardStackHandle>(null);
  const state = useGameState();
  const { streak, lastResult, sessionResults } = state;
  const results = sessionResults.map((r) => r.correct);
  const currentProfile = deck[currentIndex];

  // Overlay is open iff the latest swipe corresponds to the currently-displayed card.
  const overlayOpen =
    !!lastResult && !!currentProfile && lastResult.profileId === currentProfile.id;
  const isLastCard = currentIndex === deck.length - 1;

  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-start gap-4 border-r-0 border-b border-gray-100 px-4 pt-4 pb-6 sm:min-h-0 sm:w-auto sm:flex-3 sm:gap-6 sm:border-b-0 sm:px-6 sm:pt-5 sm:pb-6">
      <StreakBanner streak={streak} />

      <div className="w-full">
        <ProgressBar
          current={currentIndex}
          total={deck.length}
          results={results}
        />
      </div>

      {/* Cards center in the space left below the progress bar */}
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-4">
        <div className="relative">
          <CardStack
            ref={cardStackRef}
            deck={deck}
            currentIndex={currentIndex}
            onSwipe={onSwipe}
            locked={overlayOpen}
          />
          {/* One-time pre-warm: lay out the overlay's text styles while the
              first card idles. Its first real mount otherwise pays font
              shaping for all its styles in one frame, mid-fly-off (measured
              ~130ms of Layout at 20x CPU throttle; ~4ms once warm).
              visibility:hidden → laid out, never painted, no hit-testing. */}
          {currentProfile && sessionResults.length === 0 && (
            <div className="invisible absolute inset-0" aria-hidden>
              <RationaleOverlay
                profile={currentProfile}
                result={{
                  profileId: currentProfile.id,
                  playerSide: "left",
                  correct: false,
                  elapsedMs: 0,
                }}
                isLastCard={false}
                onAdvance={noop}
              />
            </div>
          )}
          <AnimatePresence>
            {overlayOpen && currentProfile && lastResult && (
              <RationaleOverlay
                profile={currentProfile}
                result={lastResult}
                isLastCard={isLastCard}
                onAdvance={onAdvance}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Faded + inert while the overlay is open, never unmounted — removing
            it from the flow reflows the whole column mid-animation. */}
        <div
          inert={overlayOpen}
          className={`w-full transition-opacity duration-150 ${
            overlayOpen ? "opacity-0" : "opacity-100"
          }`}
        >
          {currentProfile && (
            <SwipeGuide
              leftOption={currentProfile.leftOption}
              rightOption={currentProfile.rightOption}
              longOptions={currentProfile.longOptions}
              onTap={(side) => cardStackRef.current?.triggerSwipe(side)}
            />
          )}
        </div>
      </div>

      <img
        src="./t1d-logo.webp"
        alt="DETECT1D"
        className="hidden h-auto w-40 object-contain sm:absolute sm:bottom-4 sm:left-4 sm:block"
      />
    </div>
  );
}
