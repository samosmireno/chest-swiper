import { motion } from "framer-motion";
import { VerdictBadge } from "./VerdictBadge";
import { splitSentences } from "../../utils/splitSentences";
import type { PatientProfile, SessionResult } from "../../types";

interface RationaleOverlayProps {
  profile: PatientProfile;
  result: SessionResult;
  onAdvance: () => void;
}

/* Figma "Correct Card Answer" (nodes 51:1457 correct / 52:1508 incorrect) —
   the rationale sits on the same frosted charcoal glass slab as the patient
   card (the design frame is "Card Client" at 1.156×, same fills and glow
   ring), so the shell reuses .patient-card/.patient-card-glow. Text column at
   x=50.6 in the 462.5px frame; the verdict ring is bottom-centred with the
   "NOT QUITE!" label hung off its left edge so the ring stays centred in both
   states. Type ramp lives in index.css (.type-rationale-*). The advance
   button now lives in GamePanel, in the choice-button row under the card. */
export function RationaleOverlay({
  profile,
  result,
  onAdvance,
}: RationaleOverlayProps) {
  const correctLabel =
    profile.correctSide === "left" ? profile.leftOption : profile.rightOption;

  return (
    <motion.div
      key={profile.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="patient-card absolute inset-0 z-20 flex cursor-pointer flex-col"
      onClick={onAdvance}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onAdvance();
      }}
    >
      <div className="patient-card-glow" aria-hidden />

      {/* Header + rationale. Design: title top at 63px, off-white (correct —
          node I51:1458;42:1232) or, when incorrect, a "Correct answer:" line
          at 46px with the title in gold directly under it at 70px; body top
          at 113px in both. This block (not the card) is the overflow-safety
          scroller: the card itself must stay
          non-scrolling, because the glow ring is an absolute child that
          bleeds 0.125rem past the card edge and would otherwise register as
          scrollable overflow.

          Below sm the box is only as tall as the deck's tallest phone card
          (no floor, see CardStack), so the overlay's phone ramp steps down
          with it: 20/24px top, 24/20px side padding, 12px between sentences
          and one size smaller type (.type-rationale-* in index.css) — the
          longest rationale then clears the verdict ring without scrolling. */}
      <div
        className={`relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto pr-6 pl-8 max-sm:pr-5 max-sm:pl-6 md:pr-[2.125rem] md:pl-12 ${
          result.correct ? "pt-10 max-sm:pt-6 md:pt-15" : "pt-7 max-sm:pt-5 md:pt-11"
        }`}
      >
        {!result.correct && (
          <p className="type-rationale-prefix text-off-white">
            Correct answer:
          </p>
        )}
        <p
          className={`type-rationale-title ${
            result.correct ? "text-off-white" : "text-gold-accent"
          }`}
        >
          {correctLabel}
        </p>
        {/* One paragraph per sentence with a blank line between — Figma node
            I51:1458;42:1226 sets the rationale as sentence paragraphs split by
            an empty line, so the gap is the body's own line-height. */}
        <div className="type-rationale-body text-off-white mt-4 flex flex-col gap-[1.125rem] max-sm:mt-3 max-sm:gap-3 md:mt-[1.125rem]">
          {splitSentences(profile.explanation).map((sentence, i) => (
            <p key={i}>{sentence}</p>
          ))}
        </div>
        {/* Abbreviations used only in the rationale, keyed at the foot of the
            text column in the card's footnote style — the verdict ring
            stays where it is on every case. */}
        {profile.explanationFootnote && (
          <p className="type-card-footnote text-off-white mt-auto pt-4">
            {profile.explanationFootnote}
          </p>
        )}
      </div>

      {/* Verdict — ring bottom-centred (design: 101.75px ring, 51px above the
          card's bottom edge). "NOT QUITE!" hangs off the ring's left edge as
          designed, 10px away and its centre ~7px above the ring's; the
          wrapper is sized to the ring (the label is absolute), so the pulse
          (both verdicts) breathes about the ring's centre and, when
          incorrect, carries the label with it.

          That placement holds at every width. It used to stack centred
          above the ring below md, on the reading that a 304px card had no
          room beside it — but the card leaves 112px to the left of its
          centred 80px ring, and the 22px label needs 109 of it. Stepping the
          label down to 20px below md buys that back with room to spare, and
          hanging it beside the ring instead of above returns 28px to the body
          scroller; the phone bottom padding drops to 20px (36 in the design's
          proportion) for another 16. Both go to the longest rationales, which
          were losing the end of their last paragraph on a 385×700 phone.

          From xl the bottom padding drops 48 → 32px: that 16px is what lets
          the one-step-larger xl type (index.css) fit the longest rationale
          without scrolling. */}
      <div className="relative z-10 flex shrink-0 justify-center pt-2 pb-5 max-sm:pt-1 max-sm:pb-4 md:pt-4 md:pb-12 xl:pb-8">
        <div className="verdict-pulse relative">
          {!result.correct && (
            <span className="type-verdict-label text-alert-red absolute top-[calc(50%-0.4375rem)] right-full mr-2.5 -translate-y-1/2 whitespace-nowrap max-md:text-[1.25rem]">
              Not quite!
            </span>
          )}
          <VerdictBadge correct={result.correct} />
          <span className="sr-only">
            {result.correct ? "Correct" : "Not quite"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
