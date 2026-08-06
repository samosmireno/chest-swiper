import { useState } from "react";
import type { Identity, SummitCase } from "../types";
import { useAnalytics } from "../hooks/useAnalytics";

export function LandingScreen({
  cases,
  preselectedCaseId,
  onStart,
}: {
  cases: SummitCase[];
  preselectedCaseId: string | null;
  onStart: (selectedCase: SummitCase, identity: Identity) => void;
}) {
  const { trackGameStarted } = useAnalytics();
  const [team, setTeam] = useState("");
  const isValid = team.trim().length > 0;

  const begin = (selectedCase: SummitCase) => {
    const identity: Identity = {
      name: team.trim(),
      email: "",
      specialty: "",
      type: "team",
    };
    trackGameStarted("team");
    onStart(selectedCase, identity);
  };

  const steps = [
    "Enter your team name",
    "Pick your case, then read it as a group",
    "Swipe the patient card toward your answer, or tap an option button \n(↑ ← → ↓)",
    "See how your group ranks on the leaderboard",
  ];

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 py-10 short:py-5">
      <div
        className="bg-panel/90 border-purple-accent/40 flex w-full max-w-md flex-col items-center gap-6 rounded-3xl border px-7 py-8 text-center backdrop-blur-lg short:gap-3 short:py-5 sm:gap-7"
        style={{
          boxShadow:
            "0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
        }}
      >
        <h1
          className="font-display text-3xl leading-tight font-black text-white uppercase short:text-2xl sm:text-4xl sm:short:text-3xl"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}
        >
          DETECT Summit
          <br />
          Case Challenge
        </h1>

        {/* How-to-play */}
        <div className="w-full rounded-2xl px-4 py-2 text-left">
          <p className="text-gold-500 mb-2.5 text-sm font-semibold tracking-[0.18em] uppercase short:mb-1.5">
            How to Play
          </p>
          <div className="flex flex-col gap-2.5 shorter:gap-1.5">
            {steps.map((text, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="bg-purple-accent/30 border-purple-accent/60 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold text-purple-300">
                  {i + 1}
                </span>
                <span className="text-sm leading-snug whitespace-pre-line text-white/75 shorter:text-xs">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Team name (always shown) */}
        <input
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          placeholder="Enter your team name"
          autoComplete="off"
          className="border-purple-accent/55 w-full rounded-full border-[1.5px] bg-white/10 px-5 py-3 text-center text-sm text-white transition-colors duration-150 outline-none placeholder:text-white/45 short:py-2.5"
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(155,48,255,1)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(155,48,255,0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(155,48,255,0.55)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />

        {/* Case picker */}
        <div className="flex w-full flex-col gap-3 short:gap-2">
          {cases.map((c, i) => {
            const emphasized = c.id === preselectedCaseId;
            return (
              <button
                key={c.id}
                type="button"
                disabled={!isValid}
                onClick={() => begin(c)}
                className={`font-display flex w-full flex-col items-center rounded-full px-8 py-3 font-black tracking-[0.18em] text-white uppercase transition-transform short:py-2 ${
                  isValid ? "cursor-pointer active:scale-95" : "cursor-not-allowed opacity-40"
                } ${
                  emphasized
                    ? "ring-gold-400/70 ring-2"
                    : "ring-purple-accent/40 ring-1"
                }`}
                style={{
                  background: emphasized
                    ? "var(--gradient-btn-gold)"
                    : "rgba(155,48,255,0.18)",
                  boxShadow: !isValid
                    ? "none"
                    : emphasized
                      ? "0 0 24px rgba(245,200,66,0.5), 0 4px 12px rgba(0,0,0,0.4)"
                      : "0 4px 12px rgba(0,0,0,0.4)",
                }}
              >
                <span className="text-[0.95rem]">Case {i + 1}</span>
                <span className="text-xs font-semibold tracking-[0.12em] text-white/70">
                  {c.patientName}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
