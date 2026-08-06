import type React from "react";

interface SessionStatsProps {
  correct: number;
  missed: number;
  accuracy: number;
}

function Stat({
  value,
  label,
}: {
  value: number | string | React.ReactNode;
  label: string;
}) {
  return (
    <div className="text-center">
      <p className="font-display font-extrabold text-4xl text-white text-shadow-white md:text-5xl">
        {value}
      </p>
      <p className="font-display font-bold tracking-[0.2em] text-sm text-white/60 uppercase md:text-base">
        {label}
      </p>
    </div>
  );
}

export function SessionStats({ correct, missed, accuracy }: SessionStatsProps) {

  return (
    <div
      className="shrink-0 p-4 border-b border-purple-accent/30"
    >
      <p className="font-display font-extrabold tracking-[0.2em] text-xl text-white mb-3 text-center uppercase">
        This Session
      </p>
      <div className="flex justify-around">
        <Stat value={correct} label="Correct" />
        <Stat value={missed} label="Missed" />
      </div>
      <div className="mt-3 flex justify-center">
        <Stat
          value={
            <span>
              <span
                className="text-gold-400"
                style={{ textShadow: "0 0 16px rgba(245,200,66,0.6)" }}
              >
                {accuracy}
              </span>
              <span className="text-3xl text-white/60">%</span>
            </span>
          }
          label="Accuracy"
        />
      </div>
    </div>
  );
}
