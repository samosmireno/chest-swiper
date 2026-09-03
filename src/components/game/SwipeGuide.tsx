import type { SwipeSide } from "../../types";

interface SwipeGuideProps {
  leftOption: string;
  rightOption: string;
  longOptions?: boolean;
  onTap: (side: SwipeSide) => void;
}

/* Figma "arrow right" (node 149:593), 22.3×24.9 — a rounded solid chevron in
   off-white. The export's path is drawn pointing left (apex at x=0) and Figma
   mirrors it on the right button (node 166:428), so "right" flips it here;
   the left button (node 166:426) shows it as drawn. Pinned in from the
   button's outer edge (1rem at lg, 0.5rem below where the buttons share a
   phone-width row) and vertically centred, so the label centres on the
   button independently. Inline so it takes the button's rem scale
   (22×25px → 1.375×1.5625rem at lg; 16×18px below, where the buttons share
   a phone-width row). */
function ArrowGlyph({ direction }: { direction: SwipeSide }) {
  return (
    <svg
      viewBox="0 0 22.2983 24.9466"
      className={`text-off-white absolute top-1/2 h-[1.125rem] w-4 -translate-y-1/2 fill-current lg:h-[1.5625rem] lg:w-[1.375rem] ${
        direction === "right"
          ? "right-2 -scale-x-100 lg:right-4"
          : "left-2 lg:left-4"
      }`}
      aria-hidden
    >
      <path d="M18.3998 24.4178L1.60875 14.7233C-0.53625 13.4873 -0.53625 11.4608 1.60875 10.2233L18.4013 0.528815C20.5463 -0.710185 22.2983 0.303815 22.2983 2.77881V22.1678C22.2983 24.6428 20.5433 25.6568 18.4013 24.4178H18.3998Z" />
    </svg>
  );
}

export function SwipeGuide({
  leftOption,
  rightOption,
  longOptions = false,
  onTap,
}: SwipeGuideProps) {
  // Long labels get a smaller font: on phones so both buttons still fit side
  // by side, and one step under the design's 20px from md up (1.125rem) so
  // this deck's 40-55-character shared-decision-making options hold three
  // lines, not four, in the 282px button. Short labels settle at the 20px.
  // Font size lives in classes (not inline style) so the md: override wins.
  const labelFontClass = longOptions
    ? "text-[clamp(0.75rem,3.8vw,1.0625rem)] md:text-[1.125rem]"
    : "text-[clamp(0.9375rem,2.2vw,1.25rem)]";

  return (
    /* Choice-button row — Figma "Buttons Client Cards" (Frame 2, nodes
       166:425 / 166:428): arrow glyph on the outer edge of each button, label
       centred on the button. The label's side padding keeps its text zone
       clear of the glyph on both sides (inset + glyph + gap − the button's
       own 12px padding: 16+22+10−12 = 2.25rem at lg, 8+16+4−12 = 1rem below,
       which leaves phone labels the width they had) and is symmetric so the
       text stays centred. The "SWIPE A CARD" label
       above the card lives in GamePanel. lg+: two fixed 282px columns (design
       frame size); below that the pair shares the row width. */
    <div className="mx-auto flex w-full items-stretch justify-center gap-3 lg:grid lg:w-fit lg:grid-flow-col lg:gap-6">
      <button
        className={`btn-teal btn-card min-w-0 flex-1 lg:w-[17.625rem] lg:flex-none ${labelFontClass}`}
        onClick={() => onTap("left")}
      >
        <ArrowGlyph direction="left" />
        <span className="min-w-0 px-4 text-center text-balance lg:px-9">
          {leftOption}
        </span>
      </button>

      <button
        className={`btn-gold btn-card min-w-0 flex-1 lg:w-[17.625rem] lg:flex-none ${labelFontClass}`}
        onClick={() => onTap("right")}
      >
        <span className="min-w-0 px-4 text-center text-balance lg:px-9">
          {rightOption}
        </span>
        <ArrowGlyph direction="right" />
      </button>
    </div>
  );
}
