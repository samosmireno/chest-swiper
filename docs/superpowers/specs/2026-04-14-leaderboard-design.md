# Leaderboard Design

**Date:** 2026-04-14  
**Project:** Who Would You Screen?  
**Scope:** Player identity capture + localStorage leaderboard + summary layout

---

## Overview

Add a leaderboard to the ADA conference kiosk. Players enter a username (required) and optional email before starting. At the end of a session, their score is saved to localStorage and displayed in a leaderboard panel next to the results summary. The current player's row is highlighted. Scores persist across sessions on the same machine.

---

## Data Model

### New type — `LeaderboardEntry` (added to `src/types/index.ts`)

```typescript
export interface LeaderboardEntry {
  username: string
  email?: string
  score: number      // correct * 100 + maxStreak * 50
  correct: number
  total: number
  timestamp: number  // Date.now() at session end — identifies current player's row
}
```

Stored as a JSON array in localStorage under key `wwys_leaderboard`. Sorted by score descending.

### `GameState` additions (in `src/types/index.ts`)

```typescript
username: string              // empty string until SET_PLAYER
email: string                 // empty string until SET_PLAYER
maxStreak: number             // peak streak this session
lastLeaderboardTimestamp: number  // timestamp of the most recently saved entry (0 if none)
```

### Score formula

```
score = correct * 100 + maxStreak * 50
```

---

## GameContext Changes (`src/context/GameContext.tsx`)

### New action

```typescript
{ type: 'SET_PLAYER'; username: string; email: string }
```

### Reducer changes

| Action | Change |
|--------|--------|
| `SET_PLAYER` | Stores `username` and `email` in state. No screen transition. |
| `SWIPE` | Tracks `maxStreak` (peak streak, never decreases mid-session). On last card: calculates score, writes `LeaderboardEntry` to `wwys_leaderboard` in localStorage, stores `timestamp` in `state.lastLeaderboardTimestamp`. |
| `RESET` | Clears `username`, `email`, `maxStreak`, `lastLeaderboardTimestamp` back to initial values (`''`, `''`, `0`, `0`). |

### localStorage helpers

New `loadLeaderboard()` and `saveLeaderboard(entries)` helpers following the existing `loadCumulativeStats` / `saveCumulativeStats` pattern. Key: `wwys_leaderboard`.

---

## AttractScreen Changes (`src/components/AttractScreen.tsx`)

- Remove full-screen `onClick={onStart}` handler from the wrapper div.
- Replace the bare "Tap to Start" button with a player entry form:
  - **Username input** — required, `type="text"`, placeholder `"Enter your name"`
  - **Email input** — optional, `type="email"`, placeholder `"Email (optional)"`
  - **Disclaimer** — small text below email: `"By entering your email you consent to your data being collected for research purposes."`
  - **Start button** — disabled and visually muted when `username.trim()` is empty; on click dispatches `SET_PLAYER` then `START_GAME`.
- Animated card fan and title/how-to-play strip remain unchanged.
- `AttractScreen` calls `useGame()` directly to dispatch `SET_PLAYER` + `START_GAME` internally. The `onStart` prop is removed — the component is self-contained for this flow.

---

## New Components

### `src/components/SummaryView.tsx`

Wrapper rendered by `App.tsx` for the `'summary'` screen (replaces the bare `<SummaryPanel />`).

Layout:
- `flex flex-col sm:flex-row h-screen w-screen`
- Left: `<SummaryPanel />` — `flex-1`, scrollable
- Right: `<LeaderboardPanel />` — `sm:w-80`, full height, its own scroll

### `src/components/LeaderboardPanel.tsx`

| Concern | Detail |
|---------|--------|
| Data source | Reads `wwys_leaderboard` from localStorage on mount |
| Sort order | Score descending |
| Pagination | `const LEADERBOARD_PAGE_SIZE = 5` at top of file (change here to adjust) |
| Row content | Rank, username, score, correct/total |
| Current player | Row highlighted via `state.lastLeaderboardTimestamp` match |
| Initial page | Opens on the page containing the current player's row |
| Controls | Prev / Next buttons at bottom of panel |

---

## SummaryPanel Changes (`src/components/SummaryPanel.tsx`)

Sticky header updated from `Results: X/Y` to `Results: X/Y  •  Score: Z` using the score calculated from state.

---

## App.tsx Changes

```tsx
// Before
{state.screen === 'summary' && <SummaryPanel />}

// After
{state.screen === 'summary' && <SummaryView />}
```

Import `SummaryView` instead of `SummaryPanel` (SummaryPanel is still used, just composed inside SummaryView).

---

## Files Changed / Created

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `LeaderboardEntry`, extend `GameState` |
| `src/context/GameContext.tsx` | Add `SET_PLAYER` action, update `SWIPE` / `RESET`, add localStorage helpers |
| `src/components/AttractScreen.tsx` | Replace tap-to-start with player entry form |
| `src/components/SummaryPanel.tsx` | Add score to sticky header |
| `src/components/SummaryView.tsx` | **New** — side-by-side wrapper |
| `src/components/LeaderboardPanel.tsx` | **New** — paginated leaderboard |
| `src/App.tsx` | Swap `SummaryPanel` → `SummaryView` in router |

`src/components/SummaryScreen.tsx` — not touched (unused component).

---

## Out of Scope

- Backend sync or cross-device leaderboard (single machine only)
- Score persistence across `wwys_stats` reset
- Leaderboard admin / clear functionality
- Email validation beyond browser-native `type="email"`
