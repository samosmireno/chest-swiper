import { useGame } from "../context/GameContext";
import { scoreCase } from "../game/scoring";
import { DashboardPanel } from "./dashboard/DashboardPanel";

export function SummaryScreen() {
  const { state, cases } = useGame();
  const activeCase = cases[0];
  const line = scoreCase(activeCase, state.answers);

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto sm:flex-row sm:overflow-hidden">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
        <h1 className="font-display text-4xl font-extrabold tracking-wide text-white uppercase">
          Results
        </h1>
        <p className="text-white/70">{state.identity?.name}</p>

        <div className="from-gold-400/20 rounded-2xl bg-linear-to-b to-transparent px-12 py-8">
          <p className="font-display text-gold-400 text-sm font-bold tracking-widest uppercase">
            {activeCase.patientName}
          </p>
          <p className="font-display text-6xl font-extrabold text-white">
            {line.score}
          </p>
          <p className="text-sm text-white/60">
            {line.correct}/{line.total} correct
          </p>
          {line.bonus > 0 && (
            <p className="text-gold-400 text-sm font-semibold">
              {line.score - line.bonus} base + {line.bonus} speed
            </p>
          )}
        </div>
      </div>

      <DashboardPanel focusCurrentPlayer />
    </div>
  );
}
