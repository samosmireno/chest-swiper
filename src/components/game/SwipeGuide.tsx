import type { SwipeSide } from "../../types";

interface SwipeGuideProps {
  leftOption: string;
  rightOption: string;
  longOptions?: boolean;
  onTap: (side: SwipeSide) => void;
}

export function SwipeGuide({
  leftOption,
  rightOption,
  longOptions = false,
  onTap,
}: SwipeGuideProps) {
  // Long labels get a smaller font; on desktop the text is smaller still while
  // the buttons keep the full row width, so the copy wraps onto fewer lines.
  // Font size lives in classes (not inline style) so the md: override wins.
  const labelFontClass = longOptions
    ? "text-[clamp(0.62rem,3.4vw,0.9rem)] md:text-[1rem]"
    : "text-[clamp(0.8rem,1.8vw,1.2rem)]";
  const labelMaxWidth = longOptions ? "40ch" : "22ch";

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <span
        className="font-display text-xl font-black tracking-[0.18em] text-white uppercase sm:text-2xl md:text-3xl"
        style={{
          textShadow:
            "0 2px 12px rgba(0,0,0,0.9), 0 0 40px rgba(155,48,255,0.5)",
        }}
      >
        SWIPE A CARD
      </span>

      <div className="flex w-full items-stretch gap-3">
        <button
          className={`btn-monitor font-display text-gold-200 flex min-h-16 min-w-0 flex-1 cursor-pointer items-center gap-2 px-4 py-3 font-black tracking-[0.06em] outline-none focus:outline-none focus-visible:outline-none md:min-h-20 md:px-5 md:py-4 ${labelFontClass}`}
          onClick={() => onTap("left")}
          style={{
            textShadow: "0 0 12px rgba(255,200,0,0.9), 0 1px 0 rgba(0,0,0,0.5)",
          }}
        >
          <span className="shrink-0">&#9668;</span>
          <span
            className="mx-auto min-w-0 text-center leading-tight text-balance"
            style={{ maxWidth: labelMaxWidth }}
          >
            {leftOption}
          </span>
        </button>

        <button
          className={`btn-screen font-display flex min-h-16 min-w-0 flex-1 cursor-pointer items-center gap-2 px-4 py-3 font-black tracking-[0.06em] text-blue-100 outline-none focus:outline-none focus-visible:outline-none md:min-h-20 md:px-5 md:py-4 ${labelFontClass}`}
          onClick={() => onTap("right")}
          style={{
            textShadow:
              "0 0 12px rgba(56,189,248,0.9), 0 1px 0 rgba(0,0,0,0.5)",
          }}
        >
          <span
            className="mx-auto min-w-0 text-center leading-tight text-balance"
            style={{ maxWidth: labelMaxWidth }}
          >
            {rightOption}
          </span>
          <span className="shrink-0">&#9658;</span>
        </button>
      </div>
    </div>
  );
}
