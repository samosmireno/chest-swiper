import { useId } from "react";

/* Figma "Correct Answer" (42:1244) / "False Answer" (47:1333): a 102px ring
   with a 6.14px stroke — success green with a round-capped check, or alert
   red with an X — under two drop shadows (dark 35% @ 3px, accent 20% @ 1px)
   and two inner shadows (white 40% up 1px, dark 30% down 1.5px); the mark
   carries its own 1px drop shadow. Path data and effect chain come from the
   Figma export; strokes use the palette tokens via currentColor. Default
   size is the rationale overlay's: 96px on md+ (101.75 × 440/462.5), 80px
   below; the summary cards pass their own (the same asset at 28px, with the
   "False Answer" ring in the lighter "Incorrect Font Red" via colorClassName
   — node 52:2045). Filter ids are per-instance so several badges can share
   a document. */
export function VerdictBadge({
  correct,
  className = "size-20 md:size-24",
  colorClassName = correct ? "text-success-green" : "text-alert-red",
}: {
  correct: boolean;
  className?: string;
  colorClassName?: string;
}) {
  // useId's delimiters (":r1:" / "«r1»") aren't safe inside url(#…).
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = `verdict-fx-${correct ? "correct" : "false"}-${uid}`;
  // Shadow tints from the export's colour matrices.
  const dark = correct ? "#0a4b3e" : "#4d1711";
  const accent = correct ? "#1abc9c" : "#c0392b";
  const inner = correct ? "#08382f" : "#3a110d";

  return (
    <svg
      viewBox="0 0 102 102"
      className={`block overflow-visible ${className} ${colorClassName}`}
      fill="none"
      aria-hidden
    >
      <defs>
        <filter
          id={`${id}-ring`}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          {/* drop shadow 1: dy 3.07, blur 3.07 */}
          <feGaussianBlur in="SourceAlpha" stdDeviation="3.07" result="b1" />
          <feOffset in="b1" dy="3.07" result="o1" />
          <feFlood floodColor={dark} floodOpacity="0.35" result="c1" />
          <feComposite in="c1" in2="o1" operator="in" result="s1" />
          {/* drop shadow 2: dy 1.02, blur 1.02 */}
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.02" result="b2" />
          <feOffset in="b2" dy="1.02" result="o2" />
          <feFlood floodColor={accent} floodOpacity="0.2" result="c2" />
          <feComposite in="c2" in2="o2" operator="in" result="s2" />
          {/* inner shadow 1: white 40%, dy -1.02, blur 1.02 */}
          <feOffset in="SourceAlpha" dy="-1.02" result="io1" />
          <feGaussianBlur in="io1" stdDeviation="1.02" result="ib1" />
          <feComposite
            in="ib1"
            in2="SourceAlpha"
            operator="arithmetic"
            k2="-1"
            k3="1"
            result="ia1"
          />
          <feFlood floodColor="#fff" floodOpacity="0.4" result="ic1" />
          <feComposite in="ic1" in2="ia1" operator="in" result="i1" />
          {/* inner shadow 2: dark 30%, dy 1.53, blur 1.02 */}
          <feOffset in="SourceAlpha" dy="1.53" result="io2" />
          <feGaussianBlur in="io2" stdDeviation="1.02" result="ib2" />
          <feComposite
            in="ib2"
            in2="SourceAlpha"
            operator="arithmetic"
            k2="-1"
            k3="1"
            result="ia2"
          />
          <feFlood floodColor={inner} floodOpacity="0.3" result="ic2" />
          <feComposite in="ic2" in2="ia2" operator="in" result="i2" />
          <feMerge>
            <feMergeNode in="s1" />
            <feMergeNode in="s2" />
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="i1" />
            <feMergeNode in="i2" />
          </feMerge>
        </filter>
        <filter
          id={`${id}-mark`}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.77" result="b" />
          <feOffset in="b" dy="1.02" result="o" />
          <feFlood floodColor={inner} floodOpacity="0.3" result="c" />
          <feComposite in="c" in2="o" operator="in" result="s" />
          <feMerge>
            <feMergeNode in="s" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle
        cx="51"
        cy="51"
        r="47.8"
        stroke="currentColor"
        strokeWidth="6.14"
        filter={`url(#${id}-ring)`}
      />
      <g
        stroke="currentColor"
        strokeWidth="6.14"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${id}-mark)`}
      >
        {correct ? (
          <path d="M28 52.8 L43.35 68.15 L74.05 33.85" />
        ) : (
          <>
            <path d="M33.86 33.86 L68.14 68.14" />
            <path d="M68.14 33.86 L33.86 68.14" />
          </>
        )}
      </g>
    </svg>
  );
}
