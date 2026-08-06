# DETECT Summit Swiper — Design Spec

**Date:** 2026-06-15
**Branch:** `portal`
**Deadline:** First summit **2026-06-23**
**Source content:** `DB-48 DETECT Summits - Starter Slides_v2 (1).pptx` (slides 5–18)

This is the first in-portal (logged-in) tool for the DETECT platform — an adaptation of
the ADA/ENDO "Who Would You Screen?" swiper, restructured around **2 facilitated case
discussions** for the summit series.

---

## 1. Context & use case

- Played at live summits by **small groups of 2–3 at a table, sharing one iPad**.
- Users are **logged into the DETECT portal** when they play.
- Two patient cases (Emma, James). Each case = **1 intro screen → 3 scored questions
  (each with immediate feedback) → 1 open-discussion screen**. A summary follows both cases.
- Faculty lead the room; the app poses questions, captures answers, scores, and shows a
  leaderboard. The deep clinical "why" is delivered live by faculty, **not** in the app.

---

## 2. Decisions (resolved during grilling 2026-06-15)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Codebase strategy | **Fork in place on `portal`.** Reuse ADA infra (transport, leaderboard merge, analytics, kiosk scale, theme); rewrite model/flow/UI. Do **not** keep ADA binary mode. |
| 2 | Data model | Nested **`SummitCase → CaseQuestion → AnswerOption`** with `correctOptionId` (not a side). |
| 3 | Answer interaction | **Tap-button grid** (this build = "sub-branch 2"). No swipe. 5 options laid out **2 + 3**. The cross/swipe layout is documented separately as the variant (sub-branch 1). |
| 4 | Identity | **Hybrid:** fetch logged-in user from a configurable endpoint on load; **fall back to team-name entry**. Endpoint URL not yet provided → fallback is the working default. |
| 5 | Feedback timing | **Immediate per-question** reveal after answering, then Continue. Open-discussion screen is a separate, unscored beat. |
| 6 | Screen flow | Merge intro+breakout into **one intro screen per case**. Model the run as a **derived ordered step list** with a single `cursor`. |
| 7 | Scoring | **Per-correct, difficulty-weighted**: `points = optionCount × 50`. Per-case subtotals + grand total. No streak. Optional `weight` override per question (defaults to derived). |
| 8 | Leaderboard | Reuse ADA local+remote merge; add a **`SUMMIT_ID`** filter, **10s polling**, rendered in `DashboardPanel` **below** session stats (Community Insights dropped). Behind a `SHOW_LEADERBOARD` flag. |
| 9 | Export payload | New flat shape (see §6): per-question chosen-answer label + correctness, per-case subtotals, grand total, identity + `identity_type`, `summit_id`, plus `session_id` + `duration_seconds`. |
| 10 | Restart | Corner button → confirm dialog → **full `window.location.reload()`**. |
| 11 | Device | **iPad landscape only** (baseline ~1194×834). Keep `useKioskScale` as projector insurance. Dashboard sidebar collapsible. |
| 12 | Branding | Reuse DETECT background video + purple/gold theme + Barlow Condensed. Neutral option buttons = distinct **non-green** hues (blue/purple/magenta/amber/cyan). Feedback = **green ✓ / red ✗**. |
| 13 | Rationale content | **None authored** — feedback reveals correct/incorrect + highlights correct option, no paragraph. `explanation?` left optional/empty for the client to fill later. Discussion screens show prompts + Continue only (speaker notes kept out of app). |
| 14 | Misc | Community Insights chart dropped for v1. Stay on `portal` branch. Home screen retained, refactored to: title + login greeting/team-name entry + "how to play". |

---

## 3. Reuse map (from ADA app)

**Copy ~as-is (transport/infra):**
- `useWebformSubmission` plumbing (Drupal CSRF + dual-write to Drupal & Sheets) — **rewrite `buildPayload` only**.
- `remoteSubmissions.ts` (version-filtered fetch + Sheets fallback) — add `summit_id` filter.
- `useDrupalLeaderboard` + `leaderboard.ts` merge logic (optimistic current-player splice) — adapt fields + add polling.
- `useSessionCompletion` (fire-once-on-complete guard).
- `useAnalytics` (rename events).
- `useKioskScale` + kiosk constants — unchanged.
- `index.css` theme tokens + Barlow font — keep; drop `btn-screen`/`btn-monitor`.

**Rewrite:** `types/index.ts`, `GameContext` reducer, `data/*` (cases), `App` router,
all `components/game/*` and `components/*` screens, `components/dashboard/*`.

**Delete:** swipe physics — `CardStack`, `SwipeGuide`, `StreakBanner`, `ProgressBar`
(replaced), `data/profiles.ts`, `CommunityInsights` (v1).

---

## 4. Authored case content (verbatim from deck; answer key verified by ✓ geometry)

> The ✓ glyph is a separate shape at the far right of the correct option's row. Matching
> ✓ coordinates to each option row gives the key below — **clinically consistent throughout.**

### Case 1 — Emma (slides 6–11)

**Intro (6 + 7):**
- Emma is an 11-year-old girl brought to clinic by her mother for a routine well-child visit before starting middle school. She is healthy, active in soccer, and has no significant past medical history.
- During the visit, her mother mentions that Emma's older brother was diagnosed with T1D at age 13 after presenting to the ED in DKA.
- Emma currently feels well and denies any symptoms.

Breakout instructions (shared across both cases):
- Break into small groups at your table (2–3).
- Answer on a single iPad in small groups.
- Answer the follow-up case questions as a table.

**Q1 (slide 8)** — context: 11-year-old girl presenting for a routine well-child visit before starting middle school; Family history of T1D (older brother); Currently feels well and denies any symptoms of diabetes.
Prompt: **"Should she be tested for type 1 diabetes now?"**
Options: `Yes` ✓ / `No` — **correct: Yes** (2 options → 100 pts)

**Q2 (slide 9)** — Prompt: **"How would you test Emma for diabetes?"**
Options: `Fasting glucose` / `HbA1c` / `Islet autoantibodies` ✓ — **correct: Islet autoantibodies** (3 → 150)

**Q3 (slide 10)** — context: Emma undergoes screening through a T1D screening program; Autoantibody results: GAD-65 (+), IA-2 (+), Insulin (−), ZnT8 (−); Glycemic parameters: Fasting glucose = 92 mg/dL, HbA1c = 5.3%.
Prompt: **"What is the most likely interpretation of Emma's results?"**
Options: `No evidence of T1D` / `Stage 1 T1D` ✓ / `Stage 2 T1D` / `Stage 3 T1D` — **correct: Stage 1 T1D** (4 → 200)

**Discussion (slide 11)** — context: Emma undergoes repeat testing; 2-hr OGTT = 145 mg/dL, HbA1c 5.8%; She remains asymptomatic.
Prompts: "How would you counsel her family about the meaning of these results?" / "How should the management evolve now based on these results?"

### Case 2 — James (slides 13–18)

**Intro (13 + 14):**
- 34-year-old elementary school teacher.
- Mother was diagnosed with T1D in her 40s (initially diagnosed as T2D). After her diagnosis was clarified, James enrolled in TrialNet 2 years ago.
- Initial screening results (from 2 years ago): GAD-65 (+), IA-2, IAA & ZnT8 (−).
- BMI: 24 kg/m². Exam otherwise unremarkable.

(Same breakout instructions.)

**Q1 (slide 15)** — context: Repeat screening: GAD-65 & ZnT8 positive (2 autoantibodies); Current labs: Fasting glucose 91 mg/dL, A1C = 5.3%, OGTT 2-hr = 123 mg/dL; Symptoms: None.
Prompt: **"What best describes James' status?"**
Options: `Pre-T1D` / `Stage 1 T1D` ✓ / `Stage 2 T1D` / `Stage 3 T1D` / `Stage 4 T1D` — **correct: Stage 1 T1D** (5 → 250)

**Q2 (slide 16)** — same context as Q1.
Prompt: **"What would your treatment recommendation be now?"**
Options: `Start basal insulin to preserve beta cell function` / `Structured monitoring for signs and symptoms of diabetes` ✓ / `Refer for teplizumab now` — **correct: Structured monitoring for signs and symptoms of diabetes** (3 → 150)

**Q3 (slide 17)** — context: Repeat antibodies confirm GAD65 and ZnT8A; Current labs: Fasting glucose 108 mg/dL; HbA1C 5.9%; 2-hr OGTT 174 mg/dL; Symptoms: increased fatigue but no other symptoms reported.
Prompt: **"What best describes James' status now?"**
Options: `Stage 1 T1D` / `Stage 2 T1D` ✓ / `Stage 3 T1D` / `Stage 4 T1D` — **correct: Stage 2 T1D** (4 → 200)

**Discussion (slide 18)** — same context as Q3.
Prompts: "How would you counsel James about the meaning of these results?" / "How should the management evolve now based on these results?"

**Max possible score:** 100+150+200 (Case 1 = 450) + 250+150+200 (Case 2 = 600) = **1050**.

---

## 5. Screen flow

```
home (login greeting OR team-name entry + how-to-play)
 → case1 intro
 → C1Q1 → feedback → C1Q2 → feedback → C1Q3 → feedback
 → case1 discussion
 → case2 intro
 → C2Q1 → feedback → C2Q2 → feedback → C2Q3 → feedback
 → case2 discussion
 → summary (per-case + total, leaderboard, restart)
```

Restart button (corner, confirm → reload) is available on every screen.

---

## 6. Export payload (flat — for Drupal webform + REST export)

| Field | Type | Notes |
|-------|------|-------|
| `webform_id` | string | e.g. `detect_summit_swiper_results` |
| `app_version` | string | content version, bump on content change |
| `summit_id` | string | event identifier, e.g. `2026-06-23`; leaderboard filters on this |
| `session_id` | string | UUID per play |
| `participant_name` | string | logged-in name or team name |
| `identity_type` | string | `user` \| `team` |
| `email` | string | from login if present, else `""` |
| `specialty` | string | if available, else `""` |
| `submitted_at` | ISO string | |
| `duration_seconds` | number | start → summary |
| `case1_correct` / `case1_total` / `case1_score` | number | total = 3 |
| `case2_correct` / `case2_total` / `case2_score` | number | total = 3 |
| `total_correct` / `total_questions` / `total_score` | number | total_questions = 6 |
| `c1q1_answer` … `c2q3_answer` | string | chosen option **label** (human-readable) |
| `c1q1_correct` … `c2q3_correct` | string | `yes` \| `no` |

---

## 7. Open dependency (non-blocking)

- **Login endpoint contract** is unknown. Build behind `LOGIN_INFO_URL` (empty → always
  fall back to team-name entry). Expected response is adapted in `useLoginInfo`; when the
  portal team provides the real endpoint + shape, only that adapter changes.
```
