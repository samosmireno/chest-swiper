# Who Would You Screen? — Design Spec

**Date:** 2026-04-10  
**Deadline:** ADA Conference, June 4 2026  
**Stack:** React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion + Recharts

---

## Overview

A fast-paced, Tinder-style clinical decision game for the PCP/ENDO Boards conference booth. Clinicians are presented with rapid-fire patient profile cards and must decide: **Screen** (swipe right) or **Monitor** (swipe left) for T1D. The game includes distractors (T2D risk factor profiles) to test the clinician's ability to distinguish T1D from T2D screening protocols. A live dashboard aggregates cumulative results across all sessions at the conference.

Deployed on a large landscape touchscreen at the ADA conference booth.

---

## Stack

| Package | Purpose |
|---|---|
| `react` + `typescript` | UI + type safety (already installed) |
| `vite` | Dev server + build (already installed) |
| `tailwindcss` | Utility styling |
| `framer-motion` | Swipe card drag + animation |
| `recharts` | Dashboard bar charts |

---

## Data Model

### PatientProfile

```typescript
interface PatientProfile {
  id: string;

  // Always present
  ageSex: string;        // e.g. "14-year-old male"
  bmi: number;           // e.g. 22
  familyHistory: string; // e.g. "Cousin has T1D"

  // Optional fields (shown only when defined)
  symptoms?: string;       // e.g. "Polyuria, unexplained weight loss"
  lifestyle?: string;      // e.g. "Sedentary, high-carb diet"
  autoantibodies?: string; // e.g. "Positive GAD65"
  ethnicity?: string;      // e.g. "Hispanic/Latino"
  customNote?: string;     // Free-form clinical detail

  // Game metadata
  correctAction: 'screen' | 'monitor';
  isDistractor: boolean;   // true = T2D risk factor card
  explanation: string;     // Shown in feedback panel after swipe
  category: 'T1D' | 'T2D-distractor' | 'LADA' | 'monitor';
}
```

Profiles are stored in `src/data/profiles.ts` as a typed array. No backend required for the initial prototype.

### CumulativeStats (localStorage)

```typescript
interface CumulativeStats {
  totalSessions: number;
  perCard: Record<string, {
    timesShown: number;
    timesCorrect: number;
  }>;
}
```

Persisted to `localStorage` under the key `wwys_stats`. Survives page refreshes at the conference. The "Most Missed" bar chart derives from cards where `timesCorrect / timesShown` is lowest.

### GameState

```typescript
type AppScreen = 'idle' | 'playing' | 'summary';

interface SessionResult {
  profileId: string;
  playerAction: 'screen' | 'monitor';
  correct: boolean;
}

interface GameState {
  screen: AppScreen;
  deck: PatientProfile[];          // shuffled profiles for current session
  currentIndex: number;            // index of the top card
  sessionResults: SessionResult[]; // results so far this session
  lastResult: SessionResult | null; // drives FeedbackBox
  cumulativeStats: CumulativeStats;
}
```

---

## App State Machine

```
idle → playing → summary → idle
```

| State | Description |
|---|---|
| `idle` | Attract screen shown. Waits for tap to start. |
| `playing` | Card deck active. Player swipes through all cards. |
| `summary` | Session results shown. Auto-resets to `idle` after 10 seconds. |

### Session lifecycle

1. Player taps attract screen → state transitions to `playing`
2. Cards are shuffled and presented one at a time
3. Player swipes right (Screen) or left (Monitor) — or taps the buttons
4. After each swipe: feedback panel updates, next card appears
5. After all cards are exhausted → state transitions to `summary`
6. Summary screen shows session score; auto-resets to `idle` after 10s (or on tap)
7. Cumulative stats written to `localStorage` at session end

---

## Layout

**Landscape split: 60% game panel / 40% dashboard panel**

```
┌─────────────────────────────┬───────────────────────┐
│                             │                       │
│        GAME PANEL (60%)     │   DASHBOARD (40%)     │
│                             │                       │
│  [progress bar]             │  [Feedback box]       │
│                             │  [Session stats]      │
│  [Card stack — draggable]   │  [Community Insights] │
│                             │   Most Missed bars    │
│  ← Monitor     Screen →     │                       │
└─────────────────────────────┴───────────────────────┘
```

---

## Component Architecture

```
App
├── GameProvider              — context + useReducer + localStorage sync
│
├── AttractScreen             — idle state
│   └── [Tap to start button]
│
├── GameScreen                — playing state
│   ├── GamePanel             — left 60%
│   │   ├── ProgressBar       — "7 / 20" + fill bar
│   │   ├── CardStack         — Framer Motion, top card draggable
│   │   │   └── PatientCard   — renders profile fields
│   │   └── SwipeGuide        — ← Monitor  |  Screen →
│   │
│   └── DashboardPanel        — right 40%
│       ├── FeedbackBox       — correct/incorrect + explanation text
│       ├── SessionStats      — correct / missed / accuracy
│       └── CommunityInsights — Recharts bar chart of most missed
│
└── SummaryScreen             — summary state
    └── [Auto-reset countdown]
```

---

## Card Interaction (Framer Motion)

- The top card in the stack is draggable on the x-axis
- Drag threshold: **120px** — past this, the card commits to the chosen direction
- On release past threshold: card animates off-screen (fly-out), correct/incorrect determined
- On release before threshold: card snaps back to center
- During drag: card rotates slightly (±10°) and overlays a tinted indicator (green tint = Screen, red tint = Monitor)
- Tap buttons (← Monitor / Screen →) trigger the same animation programmatically for touch accessibility
- The two cards beneath the top card are visible but non-interactive (stacked, slightly rotated, scaled down)

---

## Dashboard Panel

### FeedbackBox
- Shows result of the **most recent swipe only**
- Green border + "Correct" badge, or red border + "Missed" badge
- Explanation text from `profile.explanation`
- Empty / placeholder state before first swipe

### SessionStats
- Three numbers: Correct / Missed / Accuracy %
- Updates live after each swipe

### CommunityInsights — Most Missed
- Recharts `BarChart` (horizontal bars)
- Derives top 3–5 most-missed profiles from `CumulativeStats.perCard`
- Shows profile label + miss percentage
- Updates at session end (not live mid-session, to keep data meaningful)
- Requires at least 1 completed session to show data; shows placeholder copy before first session

---

## Attract Screen

- Displays the game title and a prominent "Tap to Start" button
- Shown between sessions; designed to draw booth visitors in
- No timer — waits indefinitely until tapped

---

## Summary Screen

- Shows: Cards Played / Correct / Accuracy %
- Auto-resets to `idle` after **10 seconds** (countdown shown)
- Can also be dismissed early by tapping anywhere

---

## File Structure

```
src/
├── main.tsx
├── App.tsx                    — mounts GameProvider, routes states
├── context/
│   └── GameContext.tsx        — useReducer + context + localStorage sync
├── data/
│   └── profiles.ts            — hardcoded PatientProfile array (full deck, shuffled each session)
├── components/
│   ├── AttractScreen.tsx
│   ├── GameScreen.tsx         — composes GamePanel + DashboardPanel
│   ├── SummaryScreen.tsx
│   ├── game/
│   │   ├── GamePanel.tsx      — left 60% wrapper
│   │   ├── CardStack.tsx
│   │   ├── PatientCard.tsx
│   │   ├── ProgressBar.tsx
│   │   └── SwipeGuide.tsx
│   └── dashboard/
│       ├── DashboardPanel.tsx
│       ├── FeedbackBox.tsx
│       ├── SessionStats.tsx
│       └── CommunityInsights.tsx
└── types/
    └── index.ts               — PatientProfile, CumulativeStats, GameState
```

---

## Out of Scope (v1)

- Backend / API for profile management
- Admin panel for editing cards
- User accounts or leaderboard
- Countdown timer during gameplay
- Multi-language support
