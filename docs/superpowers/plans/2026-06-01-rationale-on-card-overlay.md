# Rationale-on-card Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dashboard "Previous swipe" rationale box with an in-place overlay on the just-swiped card, so the rationale is always paired with the card it explains. User must tap "Next case →" (or "See results →" on the final card) to advance.

**Architecture:** Split the reducer's `SWIPE` action into two actions: `SWIPE` (records the result, updates streak/stats, but does NOT advance `currentIndex` or transition to summary) and `ADVANCE` (bumps `currentIndex`, transitions to summary on the last card). The overlay is open whenever `lastResult.profileId === deck[currentIndex].id`. While open, the top card is locked (non-draggable) and a new `RationaleOverlay` component slides up from the bottom of the card. The dashboard's `FeedbackBox` is removed.

**Tech Stack:** React 19, TypeScript, framer-motion, Tailwind. Vitest + React Testing Library for tests.

---

## File Structure

**New:**
- `src/components/game/RationaleOverlay.tsx` — the on-card overlay (icon, headline, correct-answer line if wrong, rationale paragraph, Next button)

**Modified:**
- `src/context/GameContext.tsx` — add `ADVANCE` action; remove summary transition from `SWIPE`; switch analytics effect trigger from `currentIndex` to `sessionResults.length`
- `src/context/GameContext.test.ts` — update reducer tests for new semantics; add `ADVANCE` tests
- `src/components/GameScreen.tsx` — pass `onAdvance` to `GamePanel`
- `src/components/game/GamePanel.tsx` — render `RationaleOverlay` when `lastResult` matches active card; hide `SwipeGuide` while overlay open; remove the burst ✓/✗ animation (superseded by overlay icon)
- `src/components/game/CardStack.tsx` — accept `locked` prop; render plain `PatientCard` (no `DraggableCard`) when locked
- `src/components/dashboard/DashboardPanel.tsx` — remove `FeedbackBox` slot
- `src/types/index.ts` — (no change anticipated; verify `GameState` already exposes everything we need)

**Deleted:**
- `src/components/dashboard/FeedbackBox.tsx`

---

## Task 1: Update reducer — split SWIPE / add ADVANCE

**Files:**
- Modify: `src/context/GameContext.tsx`
- Test: `src/context/GameContext.test.ts`

- [ ] **Step 1: Update reducer tests for new SWIPE semantics + add ADVANCE tests**

Replace the existing SWIPE-related tests in `src/context/GameContext.test.ts` so they reflect: `SWIPE` records the result, updates streak/stats, but does NOT advance `currentIndex` and does NOT transition to summary; a new `ADVANCE` action does that.

Add this block inside the existing `describe('gameReducer', ...)`, replacing the four tests `'SWIPE records correct result and advances index'`, `'SWIPE records incorrect result when wrong side chosen'`, `'SWIPE on last card transitions to summary and increments totalSessions'`, and `'SWIPE on last card records timesShown and timesCorrect in perCard'`:

```ts
  it('SWIPE records correct result without advancing index', () => {
    let state = gameReducer(initialState, { type: 'START_GAME', deck: profiles })
    const topCard = state.deck[0]
    state = gameReducer(state, {
      type: 'SWIPE',
      profileId: topCard.id,
      side: topCard.correctSide,
    })
    expect(state.currentIndex).toBe(0)
    expect(state.sessionResults).toHaveLength(1)
    expect(state.lastResult?.correct).toBe(true)
    expect(state.screen).toBe('playing')
  })

  it('SWIPE records incorrect result when wrong side chosen', () => {
    let state = gameReducer(initialState, { type: 'START_GAME', deck: profiles })
    const topCard = state.deck[0]
    const wrongSide = topCard.correctSide === 'left' ? 'right' : 'left'
    state = gameReducer(state, {
      type: 'SWIPE',
      profileId: topCard.id,
      side: wrongSide,
    })
    expect(state.lastResult?.correct).toBe(false)
    expect(state.currentIndex).toBe(0)
  })

  it('ADVANCE bumps currentIndex when not on last card', () => {
    let state = gameReducer(initialState, { type: 'START_GAME', deck: profiles })
    const topCard = state.deck[0]
    state = gameReducer(state, { type: 'SWIPE', profileId: topCard.id, side: topCard.correctSide })
    state = gameReducer(state, { type: 'ADVANCE' })
    expect(state.currentIndex).toBe(1)
    expect(state.screen).toBe('playing')
  })

  it('ADVANCE on last card transitions to summary and increments totalSessions', () => {
    let state = gameReducer(initialState, { type: 'START_GAME', deck: profiles })
    for (let i = 0; i < state.deck.length; i++) {
      const card = state.deck[i]
      state = gameReducer(state, { type: 'SWIPE', profileId: card.id, side: card.correctSide })
      state = gameReducer(state, { type: 'ADVANCE' })
    }
    expect(state.screen).toBe('summary')
    expect(state.cumulativeStats.totalSessions).toBe(1)
    expect(Object.keys(state.cumulativeStats.perCard)).toHaveLength(profiles.length)
    expect(state.lastSessionId).not.toBe('')
  })

  it('ADVANCE on last card records timesShown and timesCorrect in perCard', () => {
    let state = gameReducer(initialState, { type: 'START_GAME', deck: profiles })
    const firstCard = state.deck[0]
    state = gameReducer(state, { type: 'SWIPE', profileId: firstCard.id, side: firstCard.correctSide })
    state = gameReducer(state, { type: 'ADVANCE' })
    for (let i = 1; i < state.deck.length; i++) {
      const card = state.deck[i]
      const wrong = card.correctSide === 'left' ? 'right' : 'left'
      state = gameReducer(state, { type: 'SWIPE', profileId: card.id, side: wrong })
      state = gameReducer(state, { type: 'ADVANCE' })
    }
    expect(state.cumulativeStats.perCard[firstCard.id]).toEqual({ timesShown: 1, timesCorrect: 1 })
    const second = state.deck[1]
    expect(state.cumulativeStats.perCard[second.id]).toEqual({ timesShown: 1, timesCorrect: 0 })
  })

  it('ADVANCE with no swipes is a no-op', () => {
    let state = gameReducer(initialState, { type: 'START_GAME', deck: profiles })
    const before = state
    state = gameReducer(state, { type: 'ADVANCE' })
    expect(state).toBe(before)
  })
```

- [ ] **Step 2: Run reducer tests to verify they fail**

Run: `npm test -- src/context/GameContext.test.ts --run`
Expected: FAIL — the new `ADVANCE` action doesn't exist yet; SWIPE still advances `currentIndex`.

- [ ] **Step 3: Update the reducer**

In `src/context/GameContext.tsx`:

(a) Update the `GameAction` union to add `ADVANCE`:

```ts
type GameAction =
  | { type: "START_GAME"; deck: PatientProfile[] }
  | { type: "SET_PLAYER"; firstName: string; lastName: string; email: string; specialty: string }
  | { type: "SWIPE"; profileId: string; side: SwipeSide }
  | { type: "ADVANCE" }
  | { type: "RESET" };
```

(b) Replace the `case "SWIPE":` block with a version that records the result but leaves `currentIndex` and `screen` alone:

```ts
    case "SWIPE": {
      const profile = state.deck[state.currentIndex];
      if (!profile) return state;
      const correct = action.side === profile.correctSide;
      const result: SessionResult = {
        profileId: action.profileId,
        playerSide: action.side,
        correct,
      };
      const newResults = [...state.sessionResults, result];
      const newStreak = correct ? state.streak + 1 : 0;
      const newMaxStreak = Math.max(state.maxStreak, newStreak);

      return {
        ...state,
        sessionResults: newResults,
        lastResult: result,
        streak: newStreak,
        maxStreak: newMaxStreak,
      };
    }
```

(c) Add a new `case "ADVANCE":` immediately after `SWIPE`:

```ts
    case "ADVANCE": {
      // No-op if there's no pending swipe to advance past
      if (state.sessionResults.length <= state.currentIndex) return state;
      const newIndex = state.currentIndex + 1;
      const isLastCard = newIndex >= state.deck.length;

      if (isLastCard) {
        const newStats = updateCumulativeStats(
          state.cumulativeStats,
          state.sessionResults,
        );
        return {
          ...state,
          screen: "summary",
          currentIndex: newIndex,
          cumulativeStats: newStats,
          lastSessionId: crypto.randomUUID(),
        };
      }

      return { ...state, currentIndex: newIndex };
    }
```

- [ ] **Step 4: Update the analytics effect trigger**

In the same file, the `useEffect` that tracks card decisions currently keys off `currentIndex !== prevCardIndex.current`. Since `currentIndex` no longer changes on swipe, this must key off `sessionResults.length`. Replace the existing tracking effect (the second `useEffect` in `GameProvider`, the one that calls `trackCardDecision`) with:

```ts
  const prevResultsLength = useRef(0);

  // Reset per-swipe tracking refs on each new session
  useEffect(() => {
    if (screen === "playing") {
      prevResultsLength.current = 0;
      prevStreak.current = 0;
    }
  }, [screen]);

  // Track card decisions and streak milestones after each swipe
  useEffect(() => {
    if (!lastResult || sessionResults.length === prevResultsLength.current) return;
    const swipedCardIndex = sessionResults.length - 1;
    prevResultsLength.current = sessionResults.length;

    const profile = deck.find((p) => p.id === lastResult.profileId);
    if (profile) {
      const chosenLabel =
        lastResult.playerSide === "left"
          ? profile.leftOption
          : profile.rightOption;
      trackCardDecision({
        profile_id: lastResult.profileId,
        patient_topic: profile.topic,
        player_action: chosenLabel,
        correct: lastResult.correct,
        streak_at_time: streak,
        card_index: swipedCardIndex,
      });
    }

    if (streak > prevStreak.current && STREAK_MILESTONES.some((m) => m.streak === streak)) {
      trackStreakMilestone(streak);
    }
    prevStreak.current = streak;
  }, [sessionResults.length, lastResult, streak, deck, trackCardDecision, trackStreakMilestone]);
```

Also remove the now-unused `prevCardIndex` ref declaration (replace `const prevCardIndex = useRef(0);` with nothing; the new `prevResultsLength` declaration above replaces it). Keep the existing `const prevStreak = useRef(0);` declaration.

Also remove `currentIndex` from the destructuring at the top of `GameProvider` if it becomes unused; `sessionResults` is already destructured.

- [ ] **Step 5: Run reducer tests to verify they pass**

Run: `npm test -- src/context/GameContext.test.ts --run`
Expected: PASS — all reducer tests green.

- [ ] **Step 6: Type-check**

Run: `npm run build`
Expected: PASS (or, if there are downstream type errors in `GameScreen.tsx`/`GamePanel.tsx` that we haven't fixed yet, leave them — they'll be fixed in Task 3+. Note any errors and proceed.)

- [ ] **Step 7: Commit**

```bash
git add src/context/GameContext.tsx src/context/GameContext.test.ts
git commit -m "refactor(game): split SWIPE into SWIPE+ADVANCE actions"
```

---

## Task 2: Build the `RationaleOverlay` component

**Files:**
- Create: `src/components/game/RationaleOverlay.tsx`

- [ ] **Step 1: Create the overlay component**

Create `src/components/game/RationaleOverlay.tsx`:

```tsx
import { motion } from "framer-motion";
import type { PatientProfile, SessionResult } from "../../types";

interface RationaleOverlayProps {
  profile: PatientProfile;
  result: SessionResult;
  isLastCard: boolean;
  onAdvance: () => void;
}

export function RationaleOverlay({
  profile,
  result,
  isLastCard,
  onAdvance,
}: RationaleOverlayProps) {
  const correctLabel =
    profile.correctSide === "left" ? profile.leftOption : profile.rightOption;
  const buttonLabel = isLastCard ? "See results →" : "Next case →";

  return (
    <motion.div
      key={profile.id}
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute inset-0 z-20 flex cursor-pointer flex-col justify-between rounded-xl bg-slate-900/92 p-5 backdrop-blur-sm"
      onClick={onAdvance}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onAdvance();
      }}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className={`flex h-20 w-20 items-center justify-center rounded-full border-4 text-5xl ${
            result.correct
              ? "border-emerald-400 text-emerald-400"
              : "border-red-400 text-red-400"
          }`}
        >
          {result.correct ? "✓" : "✗"}
        </div>
        <p
          className={`font-display text-2xl font-extrabold tracking-wide ${
            result.correct ? "text-emerald-300" : "text-red-300"
          }`}
        >
          {result.correct ? "Correct" : "Not quite"}
        </p>
        {!result.correct && (
          <p className="text-base font-semibold text-amber-300">
            Correct answer: &ldquo;{correctLabel}&rdquo;
          </p>
        )}
      </div>

      <p className="px-1 text-base leading-snug text-white/90">
        {profile.explanation}
      </p>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdvance();
          }}
          className="font-display rounded-lg bg-magenta-500 px-5 py-3 text-base font-bold tracking-wide text-white shadow-lg hover:bg-magenta-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta-300"
        >
          {buttonLabel}
        </button>
      </div>
    </motion.div>
  );
}
```

Notes for the engineer:
- The whole overlay is clickable as a forgiving fallback; the button calls `stopPropagation` so a click on the button doesn't double-fire.
- `bg-magenta-500` matches the existing palette used elsewhere in `ProgressBar.tsx` (the project uses Tailwind v4 with custom CSS vars). If `magenta-500` isn't a class in this codebase, fall back to `bg-purple-500` — but check `src/index.css` first for the exact token name. Do NOT invent new colors.
- The overlay positions absolutely inside the card's relative container (the card stack wrapper at `CardStack.tsx:121`).

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: PASS for this file (TS errors elsewhere from earlier task are OK at this stage).

- [ ] **Step 3: Commit**

```bash
git add src/components/game/RationaleOverlay.tsx
git commit -m "feat(game): add RationaleOverlay component"
```

---

## Task 3: Lock CardStack while overlay is open

**Files:**
- Modify: `src/components/game/CardStack.tsx`

- [ ] **Step 1: Add `locked` prop to `CardStack`**

In `src/components/game/CardStack.tsx`, update the `CardStackProps` interface and the component so that when `locked` is true, the top card renders as a plain (non-draggable) `PatientCard`. Replace the existing `CardStackProps` interface and `CardStack` body with:

```tsx
interface CardStackProps {
  deck: PatientProfile[];
  currentIndex: number;
  onSwipe: (side: SwipeSide) => void;
  locked?: boolean;
}

export const CardStack = forwardRef<CardStackHandle, CardStackProps>(
  ({ deck, currentIndex, onSwipe, locked = false }, ref) => {
    const draggableCardRef = useRef<DraggableCardHandle>(null);

    useImperativeHandle(ref, () => ({
      triggerSwipe: (side) => draggableCardRef.current?.triggerSwipe(side),
    }));

    // Show up to 3 cards: current + next 2 (rendered back to front)
    const visibleProfiles = deck.slice(currentIndex, currentIndex + 3);

    return (
      <div className="relative h-100 w-60 sm:w-[320px] md:h-120 md:w-110">
        {[...visibleProfiles].reverse().map((profile, reversedIndex) => {
          const stackPosition = visibleProfiles.length - 1 - reversedIndex;
          const isTop = stackPosition === 0;

          if (isTop) {
            if (locked) {
              return (
                <div key={profile.id} className="absolute inset-0">
                  <PatientCard profile={profile} />
                </div>
              );
            }
            return (
              <DraggableCard
                key={profile.id}
                ref={draggableCardRef}
                profile={profile}
                onSwipe={onSwipe}
              />
            );
          }

          return (
            <motion.div
              key={profile.id}
              className="pointer-events-none absolute inset-0"
              initial={{
                scale: 1 - (stackPosition + 1) * 0.04,
                y: (stackPosition + 1) * 8,
                rotate: (stackPosition + 1) % 2 === 0 ? -2 : 2,
                opacity: 0,
                zIndex: -stackPosition,
              }}
              animate={{
                scale: 1 - stackPosition * 0.04,
                y: stackPosition * 8,
                rotate: stackPosition % 2 === 0 ? -2 : 2,
                opacity: 1 - stackPosition * 0.3,
                zIndex: -stackPosition,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <PatientCard profile={profile} />
            </motion.div>
          );
        })}
      </div>
    );
  },
);
CardStack.displayName = "CardStack";
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: still failing because `GamePanel` and `GameScreen` aren't updated yet; that's fine.

- [ ] **Step 3: Commit**

```bash
git add src/components/game/CardStack.tsx
git commit -m "feat(game): support locked state in CardStack"
```

---

## Task 4: Wire overlay into GamePanel, dispatch ADVANCE from GameScreen

**Files:**
- Modify: `src/components/GameScreen.tsx`
- Modify: `src/components/game/GamePanel.tsx`

- [ ] **Step 1: Add `onAdvance` to GameScreen**

Replace the body of `src/components/GameScreen.tsx` with:

```tsx
import { useEffect } from "react";
import { useGame } from "../context/GameContext";
import { useCommunityStats } from "../hooks/useCommunityStats";
import { shuffle } from "../utils/shuffle";
import { GamePanel } from "./game/GamePanel";
import { DashboardPanel } from "./dashboard/DashboardPanel";
import type { SwipeSide } from "../types";

export function GameScreen() {
  const { state, dispatch, profiles } = useGame();
  const { deck, currentIndex, sessionResults, lastResult, cumulativeStats } =
    state;
  const { stats: communityStats } = useCommunityStats(cumulativeStats);

  // DEMO: Auto-start when skipping AttractScreen (demo mode)
  useEffect(() => {
    if (deck.length === 0) dispatch({ type: "START_GAME", deck: shuffle(profiles) });
  }, [deck.length, dispatch, profiles]);

  const handleSwipe = (side: SwipeSide) => {
    const profile = deck[currentIndex];
    if (!profile) return;
    dispatch({ type: "SWIPE", profileId: profile.id, side });
  };

  const handleAdvance = () => dispatch({ type: "ADVANCE" });

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto sm:flex-row sm:overflow-hidden">
      <GamePanel
        deck={deck}
        currentIndex={currentIndex}
        onSwipe={handleSwipe}
        onAdvance={handleAdvance}
      />
      <DashboardPanel
        deck={deck}
        sessionResults={sessionResults}
        cumulativeStats={communityStats}
      />
    </div>
  );
}
```

Note: `lastResult` is dropped from `DashboardPanel`'s props because the `FeedbackBox` is being removed (Task 5).

- [ ] **Step 2: Render `RationaleOverlay` in `GamePanel` and lock the stack**

Replace the body of `src/components/game/GamePanel.tsx` with:

```tsx
import { useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { CardStack, type CardStackHandle } from "./CardStack";
import { ProgressBar } from "./ProgressBar";
import { SwipeGuide } from "./SwipeGuide";
import { StreakBanner } from "./StreakBanner";
import { RationaleOverlay } from "./RationaleOverlay";
import { useGame } from "../../context/GameContext";
import type { PatientProfile, SwipeSide } from "../../types";

interface GamePanelProps {
  deck: PatientProfile[];
  currentIndex: number;
  onSwipe: (side: SwipeSide) => void;
  onAdvance: () => void;
}

export function GamePanel({ deck, currentIndex, onSwipe, onAdvance }: GamePanelProps) {
  const cardStackRef = useRef<CardStackHandle>(null);
  const { state } = useGame();
  const { streak, lastResult, sessionResults } = state;
  const results = sessionResults.map((r) => r.correct);
  const currentProfile = deck[currentIndex];

  // Overlay is open iff the latest swipe corresponds to the currently-displayed card.
  const overlayOpen =
    !!lastResult && !!currentProfile && lastResult.profileId === currentProfile.id;
  const isLastCard = currentIndex === deck.length - 1;

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center gap-6 border-r-0 border-b border-gray-100 px-6 py-8 sm:min-h-0 sm:w-auto sm:flex-3 sm:justify-center sm:gap-8 sm:border-b-0 sm:px-6 sm:pb-6 sm:pt-16">
      <StreakBanner streak={streak} />

      <div className="w-full sm:absolute sm:top-5 sm:right-6 sm:left-6 sm:w-auto">
        <ProgressBar
          current={currentIndex}
          total={deck.length}
          results={results}
        />
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <CardStack
            ref={cardStackRef}
            deck={deck}
            currentIndex={currentIndex}
            onSwipe={onSwipe}
            locked={overlayOpen}
          />
          <AnimatePresence>
            {overlayOpen && currentProfile && lastResult && (
              <RationaleOverlay
                profile={currentProfile}
                result={lastResult}
                isLastCard={isLastCard}
                onAdvance={onAdvance}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="w-full">
          {currentProfile && !overlayOpen && (
            <SwipeGuide
              leftOption={currentProfile.leftOption}
              rightOption={currentProfile.rightOption}
              onTap={(side) => cardStackRef.current?.triggerSwipe(side)}
            />
          )}
        </div>
      </div>

      <img
        src="./t1d-logo.webp"
        alt="DETECT1D"
        className="hidden h-auto w-40 object-contain sm:absolute sm:bottom-4 sm:left-4 sm:block"
      />
    </div>
  );
}
```

Notable changes:
- Burst ✓/✗ animation removed (superseded by the persistent overlay icon).
- `motion` import removed because the burst was the only consumer in this file; `AnimatePresence` remains for the overlay mount/unmount.
- `SwipeGuide` hidden while overlay is up so its tap buttons can't fire against a locked card.
- `CardStack` receives `locked={overlayOpen}`.

- [ ] **Step 3: Type-check + lint**

Run: `npm run build && npm run lint`
Expected: PASS. If `RationaleOverlay`'s `bg-magenta-500` class is unrecognised by Tailwind, fix it now per the note in Task 2 Step 1 by inspecting `src/index.css` for the actual color token and using that token (e.g. `bg-purple-500` or a custom class).

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`

In a browser:
1. Start a game — first card appears, no overlay.
2. Swipe right (or left) — card stays in place, overlay slides up from bottom showing ✓/✗, headline, rationale, and a "Next case →" button.
3. Tap "Next case →" — overlay disappears, next card appears.
4. Try dragging the card while the overlay is up — card must not move.
5. Try tapping the swipe-guide buttons while the overlay is up — they must not be visible/clickable.
6. Reach the final card. Overlay's button should say "See results →" and tapping it should go to the summary screen.
7. Verify the summary screen has the same content as before (per-case rows, score, etc.) — no regression.
8. Verify the dashboard's right column no longer shows the "Previous swipe" box (it shouldn't be visible at all — but `FeedbackBox` is still rendered until Task 5. Confirm anyway that the in-card overlay works end-to-end.)

- [ ] **Step 5: Commit**

```bash
git add src/components/GameScreen.tsx src/components/game/GamePanel.tsx
git commit -m "feat(game): show rationale overlay on swiped card, advance on tap"
```

---

## Task 5: Remove `FeedbackBox` from dashboard

**Files:**
- Modify: `src/components/dashboard/DashboardPanel.tsx`
- Delete: `src/components/dashboard/FeedbackBox.tsx`

- [ ] **Step 1: Remove the FeedbackBox slot and prop**

Replace the body of `src/components/dashboard/DashboardPanel.tsx` with:

```tsx
import { SessionStats } from "./SessionStats";
import { CommunityInsights } from "./CommunityInsights";
import { computeSessionStats } from "../../utils/sessionStats";
import type {
  SessionResult,
  PatientProfile,
  CumulativeStats,
} from "../../types";

interface DashboardPanelProps {
  deck: PatientProfile[];
  sessionResults: SessionResult[];
  cumulativeStats: CumulativeStats;
}

export function DashboardPanel({
  sessionResults,
  cumulativeStats,
}: DashboardPanelProps) {
  const { correct, missed, accuracy } = computeSessionStats(sessionResults);

  return (
    <div
      className="flex min-h-screen w-full flex-col sm:min-h-0 sm:overflow-hidden sm:w-auto sm:flex-2 lg:flex-1 bg-panel/80 border-l border-purple-accent/25"
    >
      <SessionStats correct={correct} missed={missed} accuracy={accuracy} />
      <CommunityInsights stats={cumulativeStats} />
    </div>
  );
}
```

Note: `deck` is kept in the interface because removing it would break the call site in `GameScreen.tsx`. If after this change `deck` is genuinely unused in `DashboardPanel`, remove it from both the interface and the `<DashboardPanel deck=…/>` call site in `GameScreen.tsx` (Task 4 Step 1). Verify by reading the file — if `deck` is not referenced in any prop/render, drop it from both ends in this step.

- [ ] **Step 2: Delete `FeedbackBox.tsx`**

Run: `rm src/components/dashboard/FeedbackBox.tsx`

- [ ] **Step 3: Type-check + lint**

Run: `npm run build && npm run lint`
Expected: PASS.

- [ ] **Step 4: Re-run all tests**

Run: `npm test -- --run`
Expected: PASS.

- [ ] **Step 5: Final smoke test**

Run: `npm run dev` and play one full session from attract → game → summary. Confirm:
- Dashboard right column shows only `SessionStats` + `CommunityInsights` (no "Previous swipe" box).
- Overlay still appears on every swipe and dismisses correctly.
- Final card → "See results →" → summary view.
- Analytics events still fire (check browser console / GA debugger if instrumented) — `card_decision` should fire once per swipe with the correct `card_index`.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/DashboardPanel.tsx src/components/dashboard/FeedbackBox.tsx
git commit -m "refactor(dashboard): remove FeedbackBox now that rationale shows on card"
```

---

## Self-Review Notes

- **Spec coverage:** Q1 (pause-then-advance) → Task 4; Q2 (overlay on card) → Task 2; Q3 (remove FeedbackBox) → Task 5; Q4 (Next button + tap-to-dismiss) → Task 2; Q5 (update score on swipe) → Task 1 reducer keeps streak/results update in SWIPE; Q6 (defer currentIndex via ADVANCE action) → Task 1; Q7 ("See results →" on last card) → Task 2 + Task 4 (`isLastCard`); Q8 (lock card) → Task 3; Q9 (overlay content layout) → Task 2; Q10a (slide-up 200ms) → Task 2 motion props; Q10b (streak banner updates on swipe) → unchanged because `streak` still updates in SWIPE; Q10c (delete FeedbackBox) → Task 5.
- **Burst removal** is mentioned in Task 4 Step 2; this is a small piece of scope not explicitly grilled, justified because the overlay icon supersedes it. If client wants the burst preserved as a celebration, add it back as a follow-up.
- **`magenta-500` token risk** is flagged at Task 2 Step 1 and Task 4 Step 3.
