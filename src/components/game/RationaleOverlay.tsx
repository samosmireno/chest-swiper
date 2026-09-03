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
          scrollable overflow. */}
      <div
        className={`relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto pr-6 pl-8 md:pr-[2.125rem] md:pl-12 ${
          result.correct ? "pt-10 md:pt-15" : "pt-7 md:pt-11"
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
        <div className="type-rationale-body text-off-white mt-4 flex flex-col gap-[1.125rem] md:mt-[1.125rem]">
          {splitSentences(profile.explanation).map((sentence, i) => (
            <p key={i}>{sentence}</p>
          ))}
        </div>
      </div>

      {/* Verdict — ring bottom-centred (design: 101.75px ring, 51px above the
          card's bottom edge). On md+ "NOT QUITE!" hangs off the ring's left
          edge as designed, 10px away and its centre ~7px above the ring's;
          the wrapper is sized to the ring (the label is absolute), so the
          pulse (both verdicts) breathes about the ring's centre and, when
          incorrect, carries the label with it. Below md the 304px card has no room to the left
          of the ring (the label would sit almost on the card's edge), so the
          label stacks centred above the ring instead; the ring stays
          bottom-anchored and the body scroller absorbs the extra height. */}
      <div className="relative z-10 flex shrink-0 justify-center pt-2 pb-9 md:pt-4 md:pb-12">
        <div className="verdict-pulse relative flex flex-col items-center gap-1.5 md:block">
          {!result.correct && (
            <span className="type-verdict-label text-alert-red whitespace-nowrap md:absolute md:top-[calc(50%-0.4375rem)] md:right-full md:mr-2.5 md:-translate-y-1/2">
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
