interface SessionStatsProps {
  correct: number;
  missed: number;
  accuracy: number;
}

/* One value-over-label stat. `gap` is the space between the value's 32px
   line box and its label: 12px under correct/missed (nodes 47:1387/8 →
   47:1390/2), 3px under accuracy (47:1389 → 47:1391), per the design. */
function Stat({
  value,
  label,
  valueClassName = "text-off-white",
  gap = "gap-3",
}: {
  value: string | number;
  label: string;
  valueClassName?: string;
  gap?: string;
}) {
  return (
    <div className={`flex flex-col items-center text-center ${gap}`}>
      <p className={`type-stat-value ${valueClassName}`}>{value}</p>
      <p className="type-stat-label text-light-mint">{label}</p>
    </div>
  );
}

/* Game-screen "This session" box — Figma "Frame 3" (node 47:1384): a 360×250
   box at the top of the dashboard column with a 2px mid-teal stroke, 16px
   radius on the left corners only (its right edge is the screen edge) and a
   light-mint @ 20% fill over the scene. Header row 72px tall (title + 2px
   mid-teal rule), then correct/missed side by side and accuracy centred
   below in gold. Paddings are the design's outer-edge offsets minus the
   2px border, in rem so it scales with the kiosk root. */
export function SessionStats({ correct, missed, accuracy }: SessionStatsProps) {
  return (
    <section
      aria-label="This session"
      className="border-mid-teal bg-light-mint/20 shrink-0 rounded-l-2xl border-2"
    >
      <h2 className="type-panel-title text-off-white border-mid-teal border-b-2 px-[1.375rem] pt-[1.375rem] pb-[0.9375rem]">
        This session
      </h2>
      <div className="px-[1.125rem] pt-[1.4375rem] pb-[1.375rem]">
        {/* Two 160px columns inside the 320px content row → centres at 100
            and 260 of the 360px box, as in the design. */}
        <div className="grid grid-cols-2">
          <Stat value={correct} label="correct" />
          <Stat value={missed} label="missed" />
        </div>
        <div className="mt-[0.1875rem] flex justify-center">
          <Stat
            value={`${accuracy}%`}
            label="accuracy"
            valueClassName="text-gold-accent"
            gap="gap-[0.1875rem]"
          />
        </div>
      </div>
    </section>
  );
}
