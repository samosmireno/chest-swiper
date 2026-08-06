# Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add player identity capture (username + optional email), a localStorage leaderboard, and a side-by-side summary layout to the conference kiosk game.

**Architecture:** Player credentials are stored in `GameState` via a new `SET_PLAYER` action dispatched from `AttractScreen` before the game starts. On the final card, the `SWIPE` reducer calculates a score (`correct * 100 + maxStreak * 50`) and saves a `LeaderboardEntry` to `wwys_leaderboard` in localStorage. The summary screen is a new `SummaryView` wrapper that renders `SummaryPanel` and `LeaderboardPanel` side by side (stacked on mobile).

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Vitest, Testing Library

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types/index.ts` | Modify | Add `LeaderboardEntry` type; add 4 fields to `GameState` |
| `src/context/GameContext.tsx` | Modify | Add `SET_PLAYER` action, `maxStreak` tracking, leaderboard localStorage helpers |
| `src/components/AttractScreen.tsx` | Modify | Replace tap-to-start with player entry form |
| `src/components/SummaryPanel.tsx` | Modify | Add score to sticky header |
| `src/components/SummaryView.tsx` | Create | Side-by-side `SummaryPanel` + `LeaderboardPanel` wrapper |
| `src/components/LeaderboardPanel.tsx` | Create | Paginated leaderboard with current-player highlight |
| `src/App.tsx` | Modify | Swap `<SummaryPanel />` → `<SummaryView />` |
| `src/context/GameContext.test.ts` | Modify | Tests for new reducer behavior |

---

## Task 1: Extend types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add `LeaderboardEntry` and extend `GameState`**

Open `src/types/index.ts` and apply these changes:

```typescript
export interface LeaderboardEntry {
  username: string
  email?: string
  score: number       // correct * 100 + maxStreak * 50
  correct: number
  total: number
  timestamp: number   // Date.now() at session end — used to identify current player
}

// In GameState, add these four fields:
export interface GameState {
  screen: AppScreen
  deck: PatientProfile[]
  currentIndex: number
  sessionResults: SessionResult[]
  lastResult: SessionResult | null
  cumulativeStats: CumulativeStats
  streak: number
  // --- new ---
  username: string
  email: string
  maxStreak: number
  lastLeaderboardTimestamp: number
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | head -30
```

Expected: compile errors on `GameContext.tsx` and `GameContext.test.ts` about missing fields in `initialState` — that is correct, they will be fixed in Task 2.

---

## Task 2: Extend GameContext — SET_PLAYER action + localStorage helpers

**Files:**
- Modify: `src/context/GameContext.tsx`
- Modify: `src/context/GameContext.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `src/context/GameContext.test.ts` inside the `describe('gameReducer', ...)` block:

```typescript
it('SET_PLAYER stores username and email in state', () => {
  const state = gameReducer(initialState, {
    type: 'SET_PLAYER',
    username: 'DrSmith',
    email: 'smith@hospital.com',
  })
  expect(state.username).toBe('DrSmith')
  expect(state.email).toBe('smith@hospital.com')
  expect(state.screen).toBe('idle') // no screen transition
})

it('RESET clears username, email, maxStreak, and lastLeaderboardTimestamp', () => {
  let state = gameReducer(initialState, {
    type: 'SET_PLAYER',
    username: 'DrSmith',
    email: 'smith@hospital.com',
  })
  state = gameReducer(state, { type: 'START_GAME' })
  state = gameReducer(state, { type: 'RESET' })
  expect(state.username).toBe('')
  expect(state.email).toBe('')
  expect(state.maxStreak).toBe(0)
  expect(state.lastLeaderboardTimestamp).toBe(0)
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --reporter=verbose 2>&1 | tail -20
```

Expected: 2 failures — `SET_PLAYER` not defined, `username` not found on state.

- [ ] **Step 3: Update `GameContext.tsx`**

**3a.** Add the `SET_PLAYER` action to the `GameAction` union type:

```typescript
type GameAction =
  | { type: 'START_GAME' }
  | { type: 'SET_PLAYER'; username: string; email: string }
  | { type: 'SWIPE'; profileId: string; action: 'screen' | 'monitor' }
  | { type: 'RESET' }
```

**3b.** Add leaderboard localStorage helpers after the existing `saveCumulativeStats` function:

```typescript
const LEADERBOARD_KEY = 'wwys_leaderboard'

function loadLeaderboard(): import('../types').LeaderboardEntry[] {
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveLeaderboard(entries: import('../types').LeaderboardEntry[]): void {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries))
}
```

**3c.** Update `initialState` to include the new fields:

```typescript
export const initialState: GameState = {
  screen: 'idle',
  deck: [],
  currentIndex: 0,
  sessionResults: [],
  lastResult: null,
  cumulativeStats: { totalSessions: 0, perCard: {} },
  streak: 0,
  username: '',
  email: '',
  maxStreak: 0,
  lastLeaderboardTimestamp: 0,
}
```

**3d.** Add `SET_PLAYER` case to the reducer (before `default`):

```typescript
case 'SET_PLAYER':
  return {
    ...state,
    username: action.username,
    email: action.email,
  }
```

**3e.** Update the `RESET` case to clear the new fields:

```typescript
case 'RESET':
  return {
    ...state,
    screen: 'idle',
    deck: [],
    currentIndex: 0,
    sessionResults: [],
    lastResult: null,
    streak: 0,
    username: '',
    email: '',
    maxStreak: 0,
    lastLeaderboardTimestamp: 0,
  }
```

- [ ] **Step 4: Run tests**

```bash
npm test -- --reporter=verbose 2>&1 | tail -20
```

Expected: all existing tests + 2 new tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/context/GameContext.tsx src/context/GameContext.test.ts
git commit -m "feat: extend types and GameContext with player identity fields"
```

---

## Task 3: Track maxStreak and save leaderboard entry on last card

**Files:**
- Modify: `src/context/GameContext.tsx`
- Modify: `src/context/GameContext.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `src/context/GameContext.test.ts` inside `describe('gameReducer', ...)`:

```typescript
it('SWIPE tracks maxStreak — never decreases during session', () => {
  let state = gameReducer(
    { ...initialState, username: 'DrSmith' },
    { type: 'START_GAME' },
  )
  // correct → streak 1, maxStreak 1
  state = gameReducer(state, {
    type: 'SWIPE',
    profileId: state.deck[0].id,
    action: state.deck[0].correctAction,
  })
  expect(state.streak).toBe(1)
  expect(state.maxStreak).toBe(1)

  // wrong → streak 0, maxStreak still 1
  const wrongAction = state.deck[1].correctAction === 'screen' ? 'monitor' : 'screen'
  state = gameReducer(state, {
    type: 'SWIPE',
    profileId: state.deck[1].id,
    action: wrongAction,
  })
  expect(state.streak).toBe(0)
  expect(state.maxStreak).toBe(1)
})

it('SWIPE on last card saves leaderboard entry and sets lastLeaderboardTimestamp', () => {
  const mockSetItem = vi.fn()
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => null),
    setItem: mockSetItem,
  })

  let state = gameReducer(
    { ...initialState, username: 'DrSmith', email: 'smith@h.com' },
    { type: 'START_GAME' },
  )
  // Play through all cards correctly
  for (let i = 0; i < state.deck.length; i++) {
    const card = state.deck[i]
    state = gameReducer(state, {
      type: 'SWIPE',
      profileId: card.id,
      action: card.correctAction,
    })
  }

  expect(state.screen).toBe('summary')
  expect(state.lastLeaderboardTimestamp).toBeGreaterThan(0)

  // Find the leaderboard setItem call
  const leaderboardCall = mockSetItem.mock.calls.find(
    ([key]) => key === 'wwys_leaderboard',
  )
  expect(leaderboardCall).toBeDefined()
  const saved = JSON.parse(leaderboardCall![1])
  expect(saved).toHaveLength(1)
  expect(saved[0].username).toBe('DrSmith')
  expect(saved[0].email).toBe('smith@h.com')
  expect(saved[0].correct).toBe(state.sessionResults.length)
  expect(saved[0].score).toBe(
    saved[0].correct * 100 + saved[0].maxStreak * 50,
  )
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --reporter=verbose 2>&1 | tail -20
```

Expected: 2 new failures.

- [ ] **Step 3: Update the `SWIPE` case in the reducer**

Replace the entire `SWIPE` case in `GameContext.tsx`:

```typescript
case 'SWIPE': {
  const profile = state.deck[state.currentIndex]
  if (!profile) return state
  const correct = action.action === profile.correctAction
  const result: SessionResult = {
    profileId: action.profileId,
    playerAction: action.action,
    correct,
  }
  const newResults = [...state.sessionResults, result]
  const newIndex = state.currentIndex + 1
  const newStreak = correct ? state.streak + 1 : 0
  const newMaxStreak = Math.max(state.maxStreak, newStreak)
  const isLastCard = newIndex >= state.deck.length

  if (isLastCard) {
    const newStats = updateCumulativeStats(state.cumulativeStats, newResults)
    saveCumulativeStats(newStats)

    const correctCount = newResults.filter((r) => r.correct).length
    const score = correctCount * 100 + newMaxStreak * 50
    const timestamp = Date.now()
    const entry: import('../types').LeaderboardEntry = {
      username: state.username,
      email: state.email || undefined,
      score,
      correct: correctCount,
      total: newResults.length,
      timestamp,
    }
    const existing = loadLeaderboard()
    saveLeaderboard([...existing, entry])

    return {
      ...state,
      screen: 'summary',
      currentIndex: newIndex,
      sessionResults: newResults,
      lastResult: result,
      cumulativeStats: newStats,
      streak: newStreak,
      maxStreak: newMaxStreak,
      lastLeaderboardTimestamp: timestamp,
    }
  }

  return {
    ...state,
    currentIndex: newIndex,
    sessionResults: newResults,
    lastResult: result,
    streak: newStreak,
    maxStreak: newMaxStreak,
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- --reporter=verbose 2>&1 | tail -20
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/context/GameContext.tsx src/context/GameContext.test.ts
git commit -m "feat: track maxStreak and save leaderboard entry on session end"
```

---

## Task 4: Update AttractScreen — player entry form

**Files:**
- Modify: `src/components/AttractScreen.tsx`

- [ ] **Step 1: Update `AttractScreen`**

The component needs to use `useGame` to dispatch directly. Replace the entire `AttractScreen` component (keep `MiniCard` unchanged):

```typescript
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { profiles } from "../data/profiles";
import { useGame } from "../context/GameContext";

// MiniCard stays exactly as-is — no changes needed

export function AttractScreen() {
  const { dispatch } = useGame();
  const [cycleIndex, setCycleIndex] = useState(0);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setCycleIndex((prev) => (prev + 1) % profiles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (profiles.length === 0) return null;

  const current = profiles[cycleIndex];
  const next = profiles[(cycleIndex + 1) % profiles.length];

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    dispatch({ type: "SET_PLAYER", username: username.trim(), email: email.trim() });
    dispatch({ type: "START_GAME" });
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-8 bg-white px-6 py-10 sm:flex-row sm:gap-16 sm:px-16 sm:py-0">
      {/* Animated card fan — unchanged */}
      <div className="relative h-72 w-56 shrink-0 sm:h-80 sm:w-60">
        <div
          className="absolute inset-0 rounded-2xl border border-gray-100 bg-white shadow-sm"
          style={{ transform: "rotate(-12deg) translateX(-20px)", opacity: 0.35 }}
        />
        <div
          className="absolute inset-0 rounded-2xl border border-gray-200 bg-white shadow-md"
          style={{ transform: "rotate(-5deg) translateX(-10px)", opacity: 0.6 }}
        >
          <div className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Patient Profile
            </p>
            <p className="mt-1 text-sm font-bold text-gray-500">{next.ageSex}</p>
          </div>
        </div>
        <motion.div
          className="absolute inset-0"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={cycleIndex}
              className="absolute inset-0"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                x: cycleIndex % 2 === 0 ? -300 : 300,
                rotate: cycleIndex % 2 === 0 ? -8 : 8,
                transition: { duration: 0.4, ease: "easeIn" },
              }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <MiniCard
                ageSex={current.ageSex}
                bmi={current.bmi}
                familyHistory={current.familyHistory}
                symptoms={current.symptoms}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Title + how-to-play + form */}
      <div className="flex flex-col items-center gap-6 text-center sm:gap-8">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            PCP / ENDO Boards
          </p>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-gray-900 sm:text-5xl">
            Who Would
            <br />
            You Screen?
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            T1D vs. T2D Risk Factors — Speed Challenge
          </p>
        </div>

        {/* How-to-play strip — unchanged */}
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-bold text-red-400">←</span>
            <span className="text-xs font-bold uppercase tracking-widest text-red-500">
              Monitor
            </span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
            👆
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-bold text-emerald-500">→</span>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Screen
            </span>
          </div>
        </div>

        {/* Player entry form */}
        <form onSubmit={handleStart} className="flex w-full max-w-xs flex-col gap-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            required
            className="rounded-full border border-gray-300 px-5 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional)"
            className="rounded-full border border-gray-300 px-5 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900"
          />
          <p className="text-center text-[10px] leading-relaxed text-gray-400">
            By entering your email you consent to your data being collected for research purposes.
          </p>
          <button
            type="submit"
            disabled={!username.trim()}
            className="rounded-full bg-gray-900 px-12 py-3 text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:bg-gray-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `App.tsx` — remove `onStart` prop**

`AttractScreen` no longer accepts props. In `src/App.tsx`, change:

```tsx
// Before
<AttractScreen onStart={() => dispatch({ type: 'START_GAME' })} />

// After
<AttractScreen />
```

In `GameRouter`, the `dispatch` destructure is no longer needed (AttractScreen handles its own dispatch). Change:

```tsx
// Before
const { state, dispatch } = useGame()

// After
const { state } = useGame()
```

- [ ] **Step 3: Verify it builds**

```bash
npm run build 2>&1 | head -30
```

Expected: clean build (no TypeScript errors).

- [ ] **Step 4: Commit**

```bash
git add src/components/AttractScreen.tsx src/App.tsx
git commit -m "feat: replace tap-to-start with player entry form on attract screen"
```

---

## Task 5: Create LeaderboardPanel

**Files:**
- Create: `src/components/LeaderboardPanel.tsx`

- [ ] **Step 1: Create `LeaderboardPanel.tsx`**

```typescript
import { useState } from 'react'
import { useGame } from '../context/GameContext'
import type { LeaderboardEntry } from '../types'

const LEADERBOARD_PAGE_SIZE = 5

function loadLeaderboardEntries(): LeaderboardEntry[] {
  try {
    const stored = localStorage.getItem('wwys_leaderboard')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function LeaderboardPanel() {
  const { state } = useGame()
  const entries = loadLeaderboardEntries()
    .slice()
    .sort((a, b) => b.score - a.score)

  const totalPages = Math.max(1, Math.ceil(entries.length / LEADERBOARD_PAGE_SIZE))

  // Find the page containing the current player
  const currentPlayerIndex = state.lastLeaderboardTimestamp
    ? entries.findIndex((e) => e.timestamp === state.lastLeaderboardTimestamp)
    : -1
  const defaultPage =
    currentPlayerIndex >= 0
      ? Math.floor(currentPlayerIndex / LEADERBOARD_PAGE_SIZE)
      : 0

  const [page, setPage] = useState(defaultPage)

  const pageEntries = entries.slice(
    page * LEADERBOARD_PAGE_SIZE,
    page * LEADERBOARD_PAGE_SIZE + LEADERBOARD_PAGE_SIZE,
  )

  return (
    <div className="flex h-full flex-col border-t border-gray-100 bg-white sm:border-l sm:border-t-0">
      {/* Header */}
      <div className="shrink-0 bg-gray-900 px-6 py-4">
        <p className="text-xl font-black text-white">Leaderboard</p>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No scores yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pageEntries.map((entry, i) => {
              const rank = page * LEADERBOARD_PAGE_SIZE + i + 1
              const isCurrent = entry.timestamp === state.lastLeaderboardTimestamp
              return (
                <div
                  key={entry.timestamp}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                    isCurrent
                      ? 'bg-amber-50 ring-1 ring-amber-300'
                      : 'bg-gray-50'
                  }`}
                >
                  <span className="w-6 shrink-0 text-sm font-black text-gray-400">
                    {rank}
                  </span>
                  <span className="flex-1 truncate text-sm font-semibold text-gray-900">
                    {entry.username}
                    {isCurrent && (
                      <span className="ml-2 text-xs font-bold text-amber-600">YOU</span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm font-black text-gray-900">
                    {entry.score}
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">
                    {entry.correct}/{entry.total}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="shrink-0 flex items-center justify-between border-t border-gray-100 px-4 py-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-100 disabled:opacity-30"
          >
            ← Prev
          </button>
          <span className="text-xs text-gray-400">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-100 disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npm run build 2>&1 | head -20
```

Expected: no errors from the new file.

- [ ] **Step 3: Commit**

```bash
git add src/components/LeaderboardPanel.tsx
git commit -m "feat: add LeaderboardPanel with pagination and current-player highlight"
```

---

## Task 6: Create SummaryView and update SummaryPanel header

**Files:**
- Create: `src/components/SummaryView.tsx`
- Modify: `src/components/SummaryPanel.tsx`

- [ ] **Step 1: Create `SummaryView.tsx`**

```typescript
import { SummaryPanel } from './SummaryPanel'
import { LeaderboardPanel } from './LeaderboardPanel'

export function SummaryView() {
  return (
    <div className="flex h-screen w-screen flex-col sm:flex-row">
      <div className="flex-1 overflow-hidden">
        <SummaryPanel />
      </div>
      <div className="h-64 shrink-0 sm:h-auto sm:w-80">
        <LeaderboardPanel />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `SummaryPanel.tsx` — add score to header**

In `SummaryPanel.tsx`, add the score calculation and update the sticky header. At the top of `SummaryPanel()`:

```typescript
const correct = sessionResults.filter((r) => r.correct).length
const total = sessionResults.length
const score = correct * 100 + state.maxStreak * 50
```

Update the sticky header `<p>` from:

```tsx
<p className="text-xl font-black text-white">
  Results: {correct}/{total}
</p>
```

to:

```tsx
<p className="text-xl font-black text-white">
  Results: {correct}/{total}
  <span className="ml-3 text-base font-bold opacity-75">Score: {score}</span>
</p>
```

- [ ] **Step 3: Update `App.tsx` — swap `SummaryPanel` → `SummaryView`**

In `src/App.tsx`:

```tsx
// Remove this import:
import { SummaryPanel } from './components/SummaryPanel'

// Add this import:
import { SummaryView } from './components/SummaryView'

// In GameRouter, change:
{state.screen === 'summary' && (
  <motion.div key="summary" {...screenTransition}>
    <SummaryView />
  </motion.div>
)}
```

- [ ] **Step 4: Full build check**

```bash
npm run build 2>&1 | head -30
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 5: Run all tests**

```bash
npm test -- --reporter=verbose 2>&1 | tail -30
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/SummaryView.tsx src/components/SummaryPanel.tsx src/App.tsx
git commit -m "feat: side-by-side summary and leaderboard layout with score in header"
```

---

## Manual Smoke Test Checklist

After all tasks are complete, do a quick manual run (`npm run dev`):

- [ ] Attract screen shows username input, email input, disclaimer text
- [ ] Start button is disabled until username has at least one non-space character
- [ ] After entering a name and clicking Start, the game begins normally
- [ ] Swipe all cards — summary screen appears with `Results: X/Y  •  Score: Z` in the header
- [ ] Leaderboard panel appears to the right (or below on narrow window) with the current player's row highlighted in amber
- [ ] Play a second session — leaderboard now has 2 entries, sorted by score; current player still highlighted
- [ ] Pagination appears once there are more than 5 entries; Prev/Next navigate correctly
- [ ] On narrow browser window (< `sm`), panels stack vertically
