import { useGame } from "../context/GameContext";
import { PatientCaseCard } from "./PatientCaseCard";
import { caseNumber } from "../case";

export function DiscussionScreen({ caseIndex }: { caseIndex: number }) {
  const { dispatch, cases } = useGame();
  const c = cases[caseIndex];
  const d = c.discussion;
  return (
    <div className="flex h-full w-full items-start justify-center overflow-y-auto px-8 pt-14 pb-10 short:pt-8 short:pb-6 lg:items-center lg:overflow-visible lg:pt-10 lg:short:pt-4">
      <div className="flex w-full max-w-5xl flex-col items-stretch gap-4 lg:h-140 lg:flex-row lg:gap-8 lg:short:h-[31rem] lg:shorter:h-[27rem] xl:h-125 xl:short:h-[29rem]">
        {/* Patient card — stacked above the content below lg, side column at lg+ */}
        <div className="w-full max-w-md shrink-0 self-center lg:h-full lg:w-90 lg:max-w-none xl:w-104">
          <PatientCaseCard
            name={c.patientName}
            ageSex={c.intro.ageSex}
            image={c.intro.image}
            narrative={c.intro.narrative}
          />
        </div>

        {/* Content — below the card when stacked, right column at lg+ */}
        <div className="flex min-w-0 flex-1 flex-col justify-start lg:h-full lg:justify-center">
          <p className="font-display text-center text-sm font-bold tracking-[0.2em] text-white/60 uppercase">
            Case {caseNumber(c.id)} · {c.patientName}
          </p>
          <p className="font-display text-gold-400 text-center text-4xl font-black tracking-[0.12em] uppercase short:text-2xl">
            Open Discussion
          </p>

          <div className="bg-panel/70 mt-2 max-h-none overflow-visible rounded-2xl p-6 text-left short:p-4 lg:max-h-full lg:overflow-y-auto">
            {d.context && (
              <>
                <p className="font-display mb-3 text-sm font-bold tracking-widest text-white/60 uppercase">
                  Background
                </p>
                <ul className="space-y-2.5 text-sm leading-snug text-white/85 shorter:space-y-1.5 shorter:text-xs">
                  {d.context.map((line, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-gold-400">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <div className="my-5 border-t border-white/10" />
              </>
            )}

            <div className="space-y-4 shorter:space-y-2">
              {d.prompts.map((p, i) => (
                <p
                  key={i}
                  className="font-display text-xl font-bold text-white short:text-lg"
                >
                  {p}
                </p>
              ))}
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-white/50 short:mt-2">
            Discuss as a table, then continue when you're ready.
          </p>

          <button
            type="button"
            onClick={() => dispatch({ type: "NEXT" })}
            className="font-display mt-2 cursor-pointer self-center rounded-full px-10 py-3.5 text-base font-black tracking-[0.18em] text-white uppercase transition-transform active:scale-95 short:py-2.5"
            style={{
              background: "var(--gradient-btn-gold)",
              boxShadow:
                "0 0 20px rgba(245,200,66,0.4), 0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            See your results
          </button>
        </div>
      </div>
    </div>
  );
}
