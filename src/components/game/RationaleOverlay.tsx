import { motion } from "framer-motion";
import type { PatientProfile, SessionResult } from "../../types";

interface RationaleOverlayProps {
  profile: PatientProfile;
  result: SessionResult;
  isLastCard: boolean;
  onAdvance: () => void;
}

export function RationaleOverlay({
  profile,
  result,
  isLastCard,
  onAdvance,
}: RationaleOverlayProps) {
  const correctLabel =
    profile.correctSide === "left" ? profile.leftOption : profile.rightOption;
  const buttonLabel = isLastCard ? "See results →" : "Next case →";

  return (
    <motion.div
      key={profile.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="bg-panel/92 absolute inset-0 z-20 flex cursor-pointer flex-col gap-3 overflow-y-auto rounded-xl p-4 backdrop-blur-sm sm:gap-4 sm:p-5"
      onClick={onAdvance}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onAdvance();
      }}
    >
      <div className="flex flex-col items-center gap-2 text-center sm:gap-3">
        <div className="flex items-center gap-5 sm:gap-6">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full border-4 text-3xl sm:h-20 sm:w-20 sm:text-5xl ${
              result.correct
                ? "border-green-400 text-green-400"
                : "border-red-400 text-red-400"
            }`}
          >
            {result.correct ? "✓" : "✗"}
          </div>
          <p
            className={`font-display text-xl font-extrabold tracking-wide sm:text-2xl ${
              result.correct ? "text-green-400" : "text-red-300"
            }`}
          >
            {result.correct ? "Correct" : "Not quite"}
          </p>
        </div>
        {!result.correct && (
          <p className="text-sm font-semibold text-amber-300 sm:text-base">
            Correct answer: &ldquo;{correctLabel}&rdquo;
          </p>
        )}
      </div>

      <p className="flex-1 px-1 text-sm leading-snug text-white/90 sm:text-base">
        {profile.explanation}
      </p>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdvance();
          }}
          className="font-display bg-magenta-500 hover:bg-magenta-600 cursor-pointer rounded-lg px-5 py-2 text-base font-bold tracking-wide text-white shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 sm:py-3"
        >
          {buttonLabel}
        </button>
      </div>
    </motion.div>
  );
}
