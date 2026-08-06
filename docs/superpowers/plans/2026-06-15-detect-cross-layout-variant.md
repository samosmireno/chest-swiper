# DETECT Summit Swiper — Cross-Layout Variant (Sub-branch 1)

> **Status:** Documented, not yet built. This is the **alternative** answer-interaction to show the client alongside the shipped tap-button-grid build (sub-branch 2). It is a **delta** on top of the main plan — read `2026-06-15-detect-summit-swiper.md` first; everything there applies except where overridden below.

**Goal:** Same two-case summit swiper, but answers are chosen via a **+-shaped (up/down/left/right) button layout under the patient card**, with **swipe gestures** wired to the four directions — recreating the ADA "swipe" feel that the client visually requested.

**Why a separate doc:** The cross has a hard structural limit (4 directions) that collides with real content (one question has 5 options) and brings back the swipe-physics layer we deleted. It is genuinely different work, so it lives as its own variant to build only if the client prefers it after seeing both.

---

## The blocking constraint — resolve BEFORE building

Question **C2Q1** (slide 15) has **5 options**: Pre-T1D / Stage 1 / Stage 2 / Stage 3 / Stage 4 (correct = Stage 1). A +-cross has **4 positions**. There is no clean 5→4 mapping, so this variant **requires a content decision the client/faculty must approve** (this is an accredited CME activity — we cannot silently drop a distractor):

- **Option A (recommended if cross is chosen):** drop `Pre-T1D` — it is the least formal staging term and not part of the standard Stage 1–4 framework — leaving Stage 1–4 (1-in-4). Faculty sign-off required.
- **Option B:** merge `Stage 3` + `Stage 4` into one "Stage 3/4" button. Changes the discrimination; faculty sign-off required.
- **Option C:** keep this single question as a 5-button fallback list (the grid layout from sub-branch 2) and use the cross only for the 2/3/4-option questions. Mixed interaction model.

**Do not start implementation until one of A/B/C is signed off and recorded here.**

---

## Direction mapping (per option count)

The cross renders only the positions an N-option question needs, each a distinct non-green color (red/green reserved for feedback):

| Options | Positions used | Layout |
|---------|----------------|--------|
| 2 | left, right | horizontal pair |
| 3 | up, left, right | T-shape |
| 4 | up, down, left, right | full cross |
| 5 | **not supported** → resolve via A/B/C above | — |

Position→option assignment is by option order (option[0]=up or left per count). Because positions carry **no clinical meaning** here (unlike ADA's semantic left/right), color + label are the only signal — make labels legible inside each button.

---

## Delta vs. the main plan

**Unchanged:** Tasks 1–12 (model, cases, scoring, steps, reducer, config, leaderboard, payload, submission, remote filter, completion, login). The data model already supports this — `AnswerOption[]` + `correctOptionId` is layout-agnostic.

> One data caveat: if the client approves dropping/merging an option for C2Q1, edit `src/data/cases.ts` accordingly **and** note it in the spec's answer-key section. Keep the full 5 options if Option C is chosen.

**Replace Task 13 (OptionGrid) with `CrossButtons`:**
- Create `src/components/question/CrossButtons.tsx` rendering up/down/left/right buttons positioned around a center, showing only the positions for the current option count.
- Each button: distinct palette color (neutral), `✓`/green + `✗`/red feedback states identical to the grid version, disabled after answer.
- Props identical to `OptionGrid` (`options`, `correctOptionId`, `chosenOptionId`, `onChoose`) so `QuestionScreen` swaps one import.

**Restore the swipe layer (deleted in sub-branch 2):**
- Re-create a gesture surface (adapt ADA's `CardStack` drag handling, `src/components/game/CardStack.tsx` in git history pre-cleanup) over the patient/case card.
- Map drag-release direction → the option at that position → dispatch `ANSWER` with that option id. A drag toward an unused position (e.g. "down" on a 3-option question) is ignored.
- Keep tap-on-cross-button as an equal alternative to swipe (accessibility + the shared-iPad reality where swiping is awkward when passing the device).

**`QuestionScreen` change:** swap `<OptionGrid .../>` for `<CrossButtons .../>` and mount the swipe surface around the card. Everything else (context, prompt, feedback banner, dashboard) is unchanged.

**Feedback:** identical — green ✓ correct / red ✗ chosen-wrong, `+points`, Continue.

---

## Implementation tasks (delta only)

### Task 13′: CrossButtons component
- Create `src/components/question/CrossButtons.tsx` with the position table above; same feedback color logic as `OptionGrid` (see main plan Task 13 Step 1). Guard: if `options.length > 4`, render the grid fallback (import `OptionGrid`) so the app never crashes on the unresolved 5-option case.
- Build: `npm run build`.

### Task 14′: Swipe surface
- Recover `CardStack` drag logic from git (`git show <pre-cleanup-sha>:src/components/game/CardStack.tsx`) and adapt: replace left/right-only with 4-direction release detection returning `'up'|'down'|'left'|'right'`.
- Create `src/components/question/SwipeCard.tsx` wrapping the case card; map direction → position → option id via the same per-count table; call `onChoose`.
- Lock gestures once answered (mirror ADA's `locked` prop).

### Task 15′: Wire into QuestionScreen
- In `src/components/QuestionScreen.tsx`, render `SwipeCard` around the card and `CrossButtons` beneath it; both call the same `handleChoose`.
- Manual test at iPad-landscape: verify 2-opt (L/R), 3-opt (T), 4-opt (full cross) for both tap and swipe; verify the C2Q1 5-option path renders the resolved layout (A/B grid or C fallback).

---

## Open items to record before/while building
- [ ] Client/faculty decision on C2Q1 5→4 (A drop Pre-T1D / B merge 3+4 / C keep 5 as grid). Record choice + date here.
- [ ] Confirm color assignments per position read clearly for the longest labels (the treatment question C2Q2 has a very long option).
- [ ] Decide whether swipe is enabled at all, or cross-tap only (swiping a shared iPad mid-table is clumsy; tap-only on the cross may be the better compromise and removes the recovered `CardStack` risk).
