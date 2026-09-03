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
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-start gap-4 px-4 pt-4 pb-6 sm:min-h-0 sm:w-auto sm:flex-3 sm:gap-6 sm:px-6 sm:pt-14 sm:pb-6">
      {/* sm:pt-14 = the design's 56px from the frame top to the progress dots
          (Figma Frame 2, row 37:926 at y=54 + 3px inset). */}
      <div className="w-full">
        <ProgressBar
          current={currentIndex}
          total={deck.length}
          results={results}
        />
      </div>

      {/* Label, card and buttons centre in the space left below the progress
          row. gap-6 = the design's 24px from the label's line box to the
          card's top and from the card's bottom to the button row (Figma
          Frame 2). */}
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-6">
        {/* Figma "SWIPE A CARD" (node 36:867), above the card: DM Sans Bold
            30.4/33.44 with 0.608px tracking in off-white, no shadow — 30/33
            with 1px tracking on the px grid; 24/32 below md for the phone
            layout. Faded (not removed) while the rationale is open — Frames
            3/4 drop it — so the column doesn't reflow mid-animation. */}
        <span
          aria-hidden={overlayOpen}
          className={`font-dm-sans text-off-white text-center text-2xl/8 font-bold tracking-[0.0625rem] transition-opacity duration-150 md:text-[1.875rem]/[2.0625rem] ${
            overlayOpen ? "opacity-0" : "opacity-100"
          }`}
        >
          SWIPE A CARD
        </span>
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
              visibility:hidden → laid out, no hit-testing, out of the a11y
              tree. opacity-0 on top: Chrome still paints the VerdictBadge's
              SVG filter region under visibility:hidden (a faint square showed
              through the card), and a zero-alpha compositing group swallows
              that leak without changing what gets laid out. */}
          {currentProfile && sessionResults.length === 0 && (
            <div className="invisible absolute inset-0 opacity-0" aria-hidden>
              <RationaleOverlay
                profile={currentProfile}
                result={{
                  profileId: currentProfile.id,
                  playerSide: "left",
                  correct: false,
                  elapsedMs: 0,
                }}
                onAdvance={noop}
              />
            </div>
          )}
          <AnimatePresence>
            {overlayOpen && currentProfile && lastResult && (
              <RationaleOverlay
                profile={currentProfile}
                result={lastResult}
                onAdvance={onAdvance}
              />
            )}
          </AnimatePresence>
          {/* Milestone toast, astride the card's top edge (see StreakBanner). */}
          <StreakBanner streak={streak} />
        </div>

        {/* Choice-button row. The swipe guide is faded + inert while the
            overlay is open, never unmounted — removing it from the flow
            reflows the whole column mid-animation. The advance button
            (Figma "Buttons/Next Case", node 52:1634) is layered over the
            faded guide's button row rather than swapped in, for the same
            reason: it takes the choice buttons' line, centred under the card. */}
        <div className="relative w-full">
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
          {/* h-16 = the .btn-card row's min-height, so the button centres on
              the same line as the choice buttons. */}
          <div
            inert={!overlayOpen}
            className={`absolute inset-x-0 bottom-0 flex h-16 items-center justify-center transition-opacity duration-150 ${
              overlayOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            <button type="button" className="btn-outline" onClick={onAdvance}>
              {isLastCard ? "See Results" : "Next Case"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
