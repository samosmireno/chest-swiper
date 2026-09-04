import { useGameDispatch, useGameState } from "../context/useGame";
import {
  calculateScore,
  computeSpeedBonus,
  computeTotalMs,
  scoreBreakdown,
} from "../leaderboard";
import { computeSessionStats } from "../utils/sessionStats";
import { formatClock } from "../utils/formatClock";
import { VerdictBadge } from "./game/VerdictBadge";
import type { PatientProfile, SessionResult } from "../types";

function labelForSide(profile: PatientProfile, side: "left" | "right"): string {
  return side === "left" ? profile.leftOption : profile.rightOption;
}

function otherSide(side: "left" | "right"): "left" | "right" {
  return side === "left" ? "right" : "left";
}

/* Glass shell shared by every card in the list — Figma "New card" (node
   52:1951): the .entry-panel recipe (see index.css), 760px wide in the frame,
   content inset 37px from the sides and 40px from the top. Below md the
   insets tighten for the ~300px mobile card. */
const CARD_SHELL =
  "entry-panel px-5 pt-6 pb-6 md:px-[2.3125rem] md:pt-10 md:pb-10";

/* Score breakdown — Figma "New card" (node 52:1951) on Frame 7 (52:1653):
   the same glass shell as the case cards, "SCORE BREAKDOWN" in gold with
   the total beside it ("Leaderboard Points Number 1" at 32px, node
   2014:8012), then four 72px rows at a 96px pitch (nodes 52:2025, 2014:8013,
   2014:8015, 2014:8021): 1.9px mid-teal stroke, 10.3px radius, the label
   (the "SUMMARY" style, off-white) 17px in with its detail (8/12, 3) set
   Regular after it, and the value in light-mint Barlow 32/16 at the right.
   The TOTAL TIME row is the odd one out: gold text on a light-mint @ 21%
   fill. Row, type and stroke sizes are the design's px in rem on the 1/8
   rem grid (.score-row / .type-score-value in index.css). Speed stays a
   bare value — the per-card timer is never disclosed. */
function ScoreBreakdown({
  correct,
  total,
  maxStreak,
  speedBonus,
  totalMs,
  score,
}: {
  correct: number;
  total: number;
  maxStreak: number;
  speedBonus: number;
  totalMs: number;
  score: number;
}) {
  const parts = scoreBreakdown(correct, maxStreak, speedBonus);
  const rows = [
    {
      label: "Accuracy",
      detail: `${correct}/${total}`,
      value: `${parts.accuracy}`,
    },
    { label: "Best streak", detail: `${maxStreak}`, value: `+${parts.streak}` },
    { label: "Speed bonus", detail: null, value: `+${parts.speedBonus}` },
  ];

  return (
    <section aria-label="Score breakdown" className={CARD_SHELL}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="type-summary-label text-gold-accent">Score breakdown</h2>
        <p className="type-score-value text-gold-accent">{score}</p>
      </div>
      {/* Rows at the design's 96px pitch: 72px tall + 24px gap on md+ */}
      <ul className="mt-5 flex flex-col gap-4 md:mt-7 md:gap-6">
        {rows.map((row) => (
          <li key={row.label} className="score-row">
            <span className="type-summary-label text-off-white">
              {row.label}
            </span>
            {row.detail !== null && (
              <span className="type-summary-body text-off-white ml-4">
                {row.detail}
              </span>
            )}
            <span className="type-score-value text-light-mint ml-auto pl-3">
              {row.value}
            </span>
          </li>
        ))}
        {/* Total time — the session clock's final reading (node 2014:8021) */}
        <li className="score-row bg-light-mint/20 text-gold-accent">
          <span className="type-summary-label">Total time</span>
          <span className="type-score-value ml-auto pl-3">
            {formatClock(totalMs)}
          </span>
        </li>
      </ul>
    </section>
  );
}

/* Answer pills — Figma nodes 52:1978 / 52:2032 (the incorrect card) and
   115:582 / 115:585 (the correct card): hug-width pills, 1.9px stroke,
   15.6px apart. Two tones: "wrong" is a salmon fill (255,154,154 @ 29%)
   with the False Red stroke and "Incorrect Font Red" text; "right" is a
   white @ 20% fill with the Correct Blue stroke and "Correct Font Blue" text.
   The player's pick always comes first as "You: …", in the tone of its
   outcome; the other option follows as "Correct: …" (blue, when the player
   was wrong) or "Incorrect: …" (red, when the player was right).

   The design sets them at DM Sans SemiBold 20/30 with 24.5px side padding
   (61.5px tall); they're taken down to 16/24 with 18px side padding (48px
   tall, 19px radius) so short pairs share the card's content row. Long
   labels wrap inside the pill and the row wraps when a pair can't share it —
   this deck's shared-decision-making cases do at every width. */
function AnswerPill({
  prefix,
  label,
  tone,
}: {
  prefix: string;
  label: string;
  tone: "wrong" | "right";
}) {
  return (
    <span
      className={`type-summary-pill inline-flex items-baseline gap-2 rounded-[1.1875rem] border-2 px-[1.125rem] py-2.5 ${
        tone === "wrong"
          ? "border-alert-red bg-[rgba(255,154,154,0.29)] text-incorrect-red"
          : "border-info-blue bg-white/20 text-correct-blue"
      }`}
    >
      <span className="shrink-0">{prefix}</span>
      <span>{label}</span>
    </span>
  );
}

/* One case — Figma "New card" (node 52:1951). Vertical rhythm from the
   design (px at a 16px root): "SUMMARY" + verdict row at 40; "Patient N:"
   (light-mint) + age (off-white, both "Card client age Large") at 94; bullets
   from 130 with 6px gold dots 20px in and the text 15px after; answer pills
   at 306; the Rationale box (2px mid-teal stroke, 10px radius, Roboto Bold
   20/24 title, DM Sans 20.5/30.8 → 31 body) at 397. The bullets are the
   case's verbatim slide bullets, as on the game card. */
function ResultCard({
  index,
  result,
  profile,
}: {
  index: number;
  result: SessionResult;
  profile: PatientProfile;
}) {
  return (
    <article className={CARD_SHELL}>
      {/* Header row — "SUMMARY" (gold) … verdict ring + label: 28px ring,
          4px gap. Node 52:2050: "False Answer" ring and INCORRECT both in
          "Incorrect Font Red"; node 115:561: "Checkmark" ring and CORRECT in
          success green. */}
      <div className="flex items-center justify-between gap-4">
        <p className="type-summary-label text-gold-accent">Summary</p>
        <p
          className={`type-summary-label flex items-center gap-1 ${
            result.correct ? "text-success-green" : "text-incorrect-red"
          }`}
        >
          <VerdictBadge
            correct={result.correct}
            className="size-6 md:size-7"
            colorClassName="text-current"
          />
          {result.correct ? "Correct" : "Incorrect"}
        </p>
      </div>

      {/* "Patient N: Name" in light-mint, the age line in off-white — both
          "Card client age Large" (Results Case 2, nodes 115:552 / 115:553) */}
      <p className="type-card-age mt-4 flex flex-wrap items-baseline gap-x-3.5 max-md:text-lg/6 md:mt-[1.3125rem]">
        <span className="text-light-mint">
          Patient {index + 1}: {profile.name}
        </span>
        <span className="text-off-white">{profile.ageSex}</span>
      </p>

      {/* Verbatim case bullets, one row each */}
      <ul className="mt-2 pl-4 md:mt-3 md:pl-5">
        {profile.bullets.map((bullet) => (
          <li key={bullet} className="flex gap-[0.5625rem]">
            <span
              className="bg-gold-accent mt-[0.5625rem] size-1.5 shrink-0 rounded-full md:mt-[0.6875rem]"
              aria-hidden
            />
            <span className="type-summary-body text-off-white">{bullet}</span>
          </li>
        ))}
      </ul>

      {/* Answer pills — the player's pick first, then the other option */}
      <div className="mt-6 flex flex-wrap gap-3 md:mt-10">
        <AnswerPill
          prefix="You:"
          label={labelForSide(profile, result.playerSide)}
          tone={result.correct ? "right" : "wrong"}
        />
        <AnswerPill
          prefix={result.correct ? "Incorrect:" : "Correct:"}
          label={labelForSide(profile, otherSide(result.playerSide))}
          tone={result.correct ? "wrong" : "right"}
        />
      </div>

      {/* Rationale — node 52:2025 */}
      <div className="border-mid-teal mt-5 rounded-[0.625rem] border-2 px-4 pt-4 pb-4 md:mt-[1.875rem] md:px-[1.1875rem] md:pt-[1.375rem] md:pb-6">
        <p className="font-roboto text-off-white text-lg/6 font-bold md:text-xl/6">
          Rationale:
        </p>
        <p className="type-summary-body text-off-white mt-2 md:mt-2.5 md:leading-[1.9375rem]">
          {profile.explanation}
        </p>
      </div>
    </article>
  );
}

export function SummaryPanel() {
  const state = useGameState();
  const { dispatch } = useGameDispatch();
  const { sessionResults, deck } = state;

  const { correct, total } = computeSessionStats(sessionResults);
  const speedBonus = computeSpeedBonus(sessionResults);
  const totalMs = computeTotalMs(sessionResults);
  const score = calculateScore(correct, state.maxStreak, speedBonus);

  const profileMap = new Map<string, PatientProfile>(
    deck.map((p) => [p.id, p]),
  );

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header — Figma "Frame 6" (node 52:1653) top bar: "RESULTS:"
          ("Leaderboard title 2", 20/32) beside the case counter in light-mint
          (node 52:1674) and "SCORE: n" in gold ("Leaderboard Points Number 1",
          24/16, node 52:2000),
          over the 2px mid-teal Line 2 rule at y=73 — level with the
          leaderboard box's header rule, so the two lines meet across the
          screen. The height is composed the way that header is (2px box
          edge + 22px + 32px line + 15px + 2px rule) rather than as one rem
          value: the borders are px and don't scale with the root font-size,
          so an all-rem 73 only lines up at a 16px root and drifts by a few
          px as the viewport scales. The design insets the text 80px from the
          left; the 6px top pad reproduces its slightly-below-centre text
          placement (matching the leaderboard title's 22px top inset). */}
      <p className="border-mid-teal flex h-[calc(4.3125rem_+_4px)] shrink-0 items-center gap-3 border-b-2 px-6 pt-1.5 md:pl-20">
        <span className="type-panel-title text-off-white text-xl/8">
          Results:
        </span>
        <span className="case-counter border-light-mint text-light-mint">
          {correct}/{total}
        </span>
        <span className="type-lb-points text-gold-accent">Score: {score}</span>
      </p>

      {/* Scrollable card list — the design's 760px column, 40px under the
          rule, centred in the pane (the design pins it beside a client logo
          tile this project doesn't carry). */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[47.5rem] flex-col gap-6 px-4 pt-6 pb-8 md:gap-8 md:pt-10 md:pb-10">
          <ScoreBreakdown
            correct={correct}
            total={total}
            maxStreak={state.maxStreak}
            speedBonus={speedBonus}
            totalMs={totalMs}
            score={score}
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

      {/* Sticky TRY AGAIN footer — not in the frame: a bar in the leaderboard
          box's dress (2px mid-teal rule, charcoal @ 40% fill), header-height,
          holding the gold CTA. Fixed (not min-) height, composed like the
          header above, so its rule stays level with the leaderboard pager's
          (LeaderboardPanel.tsx) at every root: 2px rule + 69px + the box's
          2px bottom edge, mirroring the top. The 58px button centres in the
          69. */}
      <div className="border-mid-teal bg-charcoal/40 flex h-[calc(4.3125rem_+_4px)] shrink-0 items-center justify-center border-t-2 px-6">
        <button
          className="btn-gold"
          onClick={() => dispatch({ type: "RESET" })}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
