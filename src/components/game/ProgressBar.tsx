import { memo } from "react";

interface ProgressBarProps {
  current: number;
  total: number;
  results?: boolean[];
}

type DotState = "unreached" | "current" | "correct" | "false";

/* Figma "Stages of progress:" (node 37:997) — the four component variants.
   A swiped card carries its verdict; the live card is cream; the rest are
   grey. Memoized: only the 1-2 dots whose props change re-render per swipe. */
const Dot = memo(function Dot({ state }: { state: DotState }) {
  return (
    <span
      className="progress-dot size-5 sm:size-6"
      data-state={state}
      aria-hidden
    />
  );
});

export function ProgressBar({ current, total, results }: ProgressBarProps) {
  return (
    /* Mobile: counter on top, dots below. md: dots centred, counter pinned to
       the column's right edge (the 60% game column is too narrow for the
       design placement). lg+: Figma Frame 2 — the dot row (37:926) centred on
       the column with the counter pill (36:924) hanging 24px off its right
       end, vertically centred on the dots. The root is the md containing
       block; the group becomes it at lg so left-full measures from the dots. */
    <div className="relative flex w-full flex-col items-center">
      <div className="flex flex-col-reverse items-center gap-4 md:block lg:relative">
        {/* Progress-dot row (Figma row 52:1566: 24px discs, 12px gap) */}
        <div
          className="flex items-center gap-1.5 sm:gap-3"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={current}
          aria-label={`Case ${current + 1} of ${total}`}
        >
          {Array.from({ length: total }, (_, i) => {
            const result = results?.[i];
            const state: DotState =
              result === true
                ? "correct"
                : result === false
                  ? "false"
                  : i === current
                    ? "current"
                    : "unreached";
            return <Dot key={i} state={state} />;
          })}
        </div>

        {/* Case counter (Figma "Frame 4", node 42:1162) — 1-based case number */}
        <div
          className="case-counter md:absolute md:top-1/2 md:right-0 md:-translate-y-1/2 lg:right-auto lg:left-full lg:ml-6"
          aria-hidden
        >
          {current + 1}/{total}
        </div>
      </div>
    </div>
  );
}
