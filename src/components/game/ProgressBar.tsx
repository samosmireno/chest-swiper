import type React from "react";

interface ProgressBarProps {
  current: number;
  total: number;
  results?: boolean[];
}

function Diamond({
  filled,
  isCurrent,
  result,
}: {
  filled: boolean;
  isCurrent: boolean;
  result?: boolean;
}) {
  const color =
    result === true
      ? "var(--color-blue-400)"
      : result === false
        ? "var(--color-red-400)"
        : filled
          ? isCurrent
            ? "var(--color-magenta-500)"
            : "var(--color-purple-400)"
          : "var(--color-dark-700)";

  const stroke =
    result === true
      ? "var(--color-blue-600)"
      : result === false
        ? "var(--color-red-700)"
        : filled
          ? isCurrent
            ? "var(--color-magenta-600)"
            : "var(--color-purple-500)"
          : "var(--color-purple-950)";

  const glow =
    result === true
      ? "drop-shadow(0 0 4px var(--color-blue-400)) drop-shadow(0 0 10px var(--color-blue-400))"
      : result === false
        ? "drop-shadow(0 0 4px var(--color-red-400)) drop-shadow(0 0 10px var(--color-red-400))"
        : isCurrent
          ? "drop-shadow(0 0 4px var(--color-magenta-500)) drop-shadow(0 0 10px var(--color-magenta-500))"
          : filled
            ? "drop-shadow(0 0 3px var(--color-purple-400)) drop-shadow(0 0 7px var(--color-purple-400))"
            : "none";

  return (
    <svg
      className="size-5 shrink-0 lg:size-8"
      viewBox="0 0 20 20"
      style={{ filter: glow }}
    >
      <polygon
        points="10,1 19,10 10,19 1,10"
        fill={color}
        stroke={stroke}
        strokeWidth="1.5"
      />
    </svg>
  );
}

const counterStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "1.35rem",
  fontWeight: 800,
  color: "white",
  letterSpacing: "0.05em",
  padding: "1px 10px",
  minWidth: "3.375rem",
  textAlign: "center",
  lineHeight: 1.3,
  textShadow: "var(--text-shadow-white-sm)",
  borderRadius: "4px",
};

export function ProgressBar({ current, total, results }: ProgressBarProps) {
  return (
    /* Mobile: counter on top, gems below. sm+: gems centered, counter absolute right */
    <div className="relative flex w-full flex-col items-center gap-2">
      {/* Counter — centred on mobile, absolute right on sm+ */}
      <div
        className="border-2 border-white/35 md:absolute md:top-1/2 md:right-0 md:-translate-y-1/2"
        style={counterStyle}
      >
        {current}/{total}
      </div>

      {/* Diamond gem row — always centered */}
      <div className="flex w-full items-center justify-center gap-1 md:gap-2">
        {Array.from({ length: total }, (_, i) => (
          <Diamond
            key={i}
            filled={i <= current}
            isCurrent={i === current}
            result={results?.[i]}
          />
        ))}
      </div>
    </div>
  );
}
