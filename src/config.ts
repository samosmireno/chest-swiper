// ─── Streak milestones ────────────────────────────────────────
// Sorted ascending. Each entry triggers a banner and an optional custom label.
// Only a 12-streak can mean a flawless 12-card deck, so "perfect" waits for
// the finale; 10 is just a milestone here (it could follow a miss).
export const STREAK_MILESTONES: { streak: number; label: string }[] = [
  { streak: 3, label: "IN A ROW" },
  { streak: 5, label: "IN A ROW" },
  { streak: 7, label: "IN A ROW" },
  { streak: 10, label: "IN A ROW" },
  { streak: 12, label: "PERFECT" },
];

// ─── Leaderboard ─────────────────────────────────────────────
export const LEADERBOARD_PAGE_SIZE = 10;

// Rolling window: only show entries within this span of the newest entry.
// Scopes the board to the current summit without per-event manual edits.
// Anchored to the newest entry (not the device clock) so a wrong kiosk clock
// can't silently empty the board mid-summit.
// null = enduring board: every score-compatible entry ever submitted.
// The kiosk URL overrides this per deployment without a rebuild —
// `?board=all` for enduring, `?board=12h` / `?board=3d` / `?board=90m` for a
// window. See src/utils/boardWindow.ts.
export const LEADERBOARD_WINDOW_MS: number | null = 12 * 60 * 60 * 1000; // 12h

// Oldest APP_VERSION whose scores compare with today's: same deck size and
// same formula. 2.0 introduced the 12-card asthma & COPD deck (1.x was the
// 15-card T1D deck, so its scores sit on a different scale); 2.1 was copy
// and payload only, 2.2–2.4 copy only. The leaderboard admits everything from here up, so a
// copy-edit bump never wipes an enduring board. The community miss-rate
// chart stays on the exact APP_VERSION, since card wording did change
// between bumps. Raise this whenever the deck or the scoring formula changes.
export const LEADERBOARD_MIN_VERSION = "2.0";

// ─── Game screen ─────────────────────────────────────────────
// Which panel fills the dashboard below the session stats during play:
// "insights" = community miss-rate charts, "leaderboard" = the same
// leaderboard as the summary screen.
export type GameScreenPanel = "insights" | "leaderboard";
export const GAME_SCREEN_PANEL: GameScreenPanel = "leaderboard";

// ─── Scoring ─────────────────────────────────────────────────
// score = correct × ACCURACY + maxStreak × STREAK + speed bonus
//
// Accuracy must always win: no arrangement of fewer correct answers may
// outscore more correct answers, whatever the streak or speed. That is NOT
// guaranteed by "streak total < one accuracy step" here — it's a property
// of the 12-card deck, proven exhaustively in src/leaderboard.test.ts over
// every outcome pattern. The binding case is 8/12 with an 8-streak (884
// with max speed) vs 9/12 with the misses spread out (streak 3 → 930).
// Raising STREAK past 18, changing the deck size, or growing the speed
// budget breaks it; the test fails loudly if any of those move.
export const ACCURACY_POINTS_PER_CARD = 100;
export const STREAK_POINTS_PER_CARD = 10;

// Speed bonus — hidden per-card timer: starts when the card becomes
// interactive, stops at the swipe/tap commit (before the fly-off), so time
// reading the rationale never counts. Correct answers earn the full per-card
// bonus inside the grace window, decaying linearly to zero after it. The
// total budget (12 × 0.5 = 6) sits below the 10-pt streak step, so speed can
// only split players the accuracy/streak formula scores identically — never
// reorder.
export const SPEED_BONUS_MAX_PER_CARD = 0.5;
export const SPEED_BONUS_GRACE_MS = 5_000;
export const SPEED_BONUS_ZERO_MS = 30_000;

// ─── Google Sheets storage ────────────────────────────────────
// Primary (and only) submission store. An Apps Script web app fronts the
// sheet: POST appends a submission row, GET returns all rows as JSON.
// Set to the web app URL after deploying sheets/wwys-results.gs.
// APP_VERSION — bump this when card content or scoring changes to filter old
// submissions. 1.2/1.3 = the 15-card T1D deck; 2.0 = the 12-card severe
// asthma & COPD deck (cases from documents/cases.pptx), same scoring formula
// as 1.3; 2.1 = the same deck with the slides' verbatim bullets, name line
// and abbreviation footnote, a visible session clock, and total_ms in the
// payload (the leaderboard's time column) — scoring unchanged; 2.2 = the
// client's copy review of the Figma export (footnotes, bullet and rationale
// edits) — scoring unchanged; 2.3 = the client's second-round comment
// (IgE keyed in the Miles footnote) — scoring unchanged; 2.4 = the third
// round (BMI and GI keyed in the Owen footnote) — scoring unchanged.
export const APP_VERSION = "2.4";
export const SHEETS_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbyhd-XYgDH09KYR5rZAOADVJ6nx5f9N42dkPbFiJbcvSKakJ57gXSONnLp1uNyI9Es-/exec";
