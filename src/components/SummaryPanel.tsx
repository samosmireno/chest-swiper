import { useGameDispatch, useGameState } from "../context/useGame";
import { calculateScore, computeSpeedBonus, scoreBreakdown } from "../leaderboard";
import { computeSessionStats } from "../utils/sessionStats";
import type { PatientProfile, SessionResult } from "../types";

function describePatient(p: PatientProfile): string {
  return p.fields.map((f) => `${f.label}: ${f.value}`).join(". ");
}

function labelForSide(profile: PatientProfile, side: "left" | "right"): string {
  return side === "left" ? profile.leftOption : profile.rightOption;
}

function ScoreBreakdown({
  correct,
  total,
  maxStreak,
  speedBonus,
}: {
  correct: number;
  total: number;
  maxStreak: number;
  speedBonus: number;
}) {
  const parts = scoreBreakdown(correct, maxStreak, speedBonus);
  // Speed stays a bare value — the per-card timer is never disclosed.
  const rows = [
    { label: "Accuracy", detail: `${correct}/${total}`, value: `${parts.accuracy}` },
    { label: "Best streak", detail: `${maxStreak}`, value: `+${parts.streak}` },
    { label: "Speed bonus", detail: null, value: `+${parts.speedBonus}` },
  ];

  return (
    <div
      className="border-purple-accent/45 rounded-2xl border bg-purple-900/90 px-5 py-2"
      style={{
        boxShadow:
          "0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
      }}
    >
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-baseline justify-between border-b border-white/10 py-3 last:border-b-0"
        >
          <span className="font-display text-sm font-black tracking-[0.15em] text-white/85 uppercase">
            {row.label}
          </span>
          <span className="flex items-baseline gap-4">
            {row.detail !== null && (
              <span className="font-mono text-sm font-semibold text-white/50">
                {row.detail}
              </span>
            )}
            <span className="min-w-18 text-right text-xl font-black text-white tabular-nums">
              {row.value}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function ResultCard({
  index,
  result,
  profile,
}: {
  index: number;
  result: SessionResult;
  profile: PatientProfile;
}) {
  const description = describePatient(profile);

  return (
    <div
      className="border-purple-accent/45 rounded-2xl border bg-purple-900/90 p-4"
      style={{
        boxShadow:
          "0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
      }}
    >
      {/* Header row */}
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="font-bold text-white">
          <span className="font-black">Patient {index + 1}:</span>{" "}
          <span className="font-mono text-sm font-semibold text-white/70">
            {profile.ageSex}
          </span>
        </p>
        {result.correct ? (
          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-green-400">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
            Correct
          </span>
        ) : (
          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-red-400">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
            Incorrect
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="mb-3 text-sm text-white/60">{description}</p>
      )}

      {/* Answer badges */}
      <div className="mb-3 flex flex-wrap gap-2">
        {result.correct ? (
          <span className="rounded-full border border-green-400/60 bg-green-400/10 px-3 py-1 text-xs font-bold tracking-widest text-green-400 uppercase">
            Correct: {labelForSide(profile, profile.correctSide)}
          </span>
        ) : (
          <>
            <span className="rounded-full border border-red-300/40 px-3 py-1 text-xs font-bold tracking-widest text-red-300/70 uppercase line-through">
              You: {labelForSide(profile, result.playerSide)}
            </span>
            <span className="rounded-full border border-amber-400/60 px-3 py-1 text-xs font-bold tracking-widest text-amber-400 uppercase">
              Correct: {labelForSide(profile, profile.correctSide)}
            </span>
          </>
        )}
      </div>

      {/* Rationale */}
      <div className="border-purple-accent/20 rounded-xl border bg-black/35 p-3">
        <p className="mb-1 text-xs font-bold text-white/90">Rationale:</p>
        <p className="text-xs leading-relaxed text-white/70">
          {profile.explanation}
        </p>
      </div>
    </div>
  );
}

export function SummaryPanel() {
  const state = useGameState();
  const { dispatch } = useGameDispatch();
  const { sessionResults, deck } = state;

  const { correct, total } = computeSessionStats(sessionResults);
  const speedBonus = computeSpeedBonus(sessionResults);
  const score = calculateScore(correct, state.maxStreak, speedBonus);

  const profileMap = new Map<string, PatientProfile>(
    deck.map((p) => [p.id, p]),
  );

  return (
    <div className="flex h-full w-full flex-col">
      {/* Sticky header */}
      <div className="bg-panel/95 border-purple-accent/30 flex h-14 shrink-0 items-center border-b px-6">
        <p className="font-display text-xl font-extrabold tracking-[0.18em] text-white uppercase">
          Results: {correct}/{total}
          <span className="ml-3 text-base font-bold opacity-60">
            Score: {score}
          </span>
        </p>
      </div>

      {/* Scrollable card list */}
      <div className="bg-panel/75 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 pb-8">
          <ScoreBreakdown
            correct={correct}
            total={total}
            maxStreak={state.maxStreak}
            speedBonus={speedBonus}
          />
          {sessionResults.map((result, i) => {
            const profile = profileMap.get(result.profileId);
            if (!profile) return null;
            return (
              <ResultCard
                key={result.profileId}
                index={i}
                result={result}
                profile={profile}
              />
            );
          })}
        </div>
      </div>

      {/* Sticky TRY AGAIN footer */}
      <div className="bg-panel/90 border-purple-accent/25 flex h-14 shrink-0 items-center justify-center border-t px-6 backdrop-blur">
        <button
          className="font-display cursor-pointer rounded-full px-10 py-3 text-[0.85rem] font-black tracking-[0.2em] text-white uppercase transition-transform active:scale-95"
          style={{
            background: "var(--gradient-btn-gold)",
            boxShadow: "0 0 20px rgba(245,200,66,0.35)",
          }}
          onClick={() => dispatch({ type: "RESET" })}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
