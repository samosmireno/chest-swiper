# Who Would You Screen? Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Tinder-style clinical decision game where clinicians swipe to Screen or Monitor patient profiles for T1D, with a live split-screen dashboard showing session stats and community insights.

**Architecture:** Single-page React app with a `useReducer`-based state machine (`idle → playing → summary → idle`). Game state flows from `GameContext` to display components. Framer Motion handles swipe card physics; Recharts renders the community insights bar chart. Cumulative stats persist via `localStorage`.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Recharts, Vitest + Testing Library

---

## File Map

```
src/
├── App.tsx                                  modify — route app screens
├── index.css                                modify — add Tailwind import
├── test/
│   └── setup.ts                             create — Testing Library setup
├── types/
│   └── index.ts                             create — all shared types
├── data/
│   └── profiles.ts                          create — hardcoded patient profiles
├── context/
│   └── GameContext.tsx                      create — useReducer + Provider + localStorage
├── components/
│   ├── AttractScreen.tsx                    create — idle state UI
│   ├── GameScreen.tsx                       create — 60/40 layout wrapper
│   ├── SummaryScreen.tsx                    create — session end UI
│   ├── game/
│   │   ├── GamePanel.tsx                    create — left 60% panel
│   │   ├── CardStack.tsx                    create — Framer Motion swipe stack
│   │   ├── PatientCard.tsx                  create — profile card UI
│   │   ├── ProgressBar.tsx                  create — card N of M
│   │   └── SwipeGuide.tsx                   create — ← Monitor / Screen → buttons
│   └── dashboard/
│       ├── DashboardPanel.tsx               create — right 40% panel
│       ├── FeedbackBox.tsx                  create — last swipe result
│       ├── SessionStats.tsx                 create — correct/missed/accuracy
│       └── CommunityInsights.tsx            create — Recharts most-missed bars
vite.config.ts                               modify — add Tailwind plugin + Vitest config
package.json                                 modify — add test script
```

---

## Task 1: Install dependencies and configure tooling

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `src/index.css`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install framer-motion recharts
```

Expected: Both packages added to `dependencies` in `package.json`.

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Replace `vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 4: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Replace `src/index.css`**

```css
@import "tailwindcss";
```

- [ ] **Step 6: Add test script to `package.json`**

In the `"scripts"` block, add:
```json
"test": "vitest",
"test:ui": "vitest --ui"
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite dev server starts with no errors. Browser shows a blank page (App returns `<></>`).

- [ ] **Step 8: Commit**

```bash
git init
git add package.json package-lock.json vite.config.ts src/index.css src/test/setup.ts
git commit -m "chore: add Tailwind v4, Framer Motion, Recharts, Vitest"
```

---

## Task 2: Define shared types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create `src/types/index.ts`**

```ts
export interface PatientProfile {
  id: string

  // Always present
  ageSex: string
  bmi: number
  familyHistory: string

  // Optional — only rendered when defined
  symptoms?: string
  lifestyle?: string
  autoantibodies?: string
  ethnicity?: string
  customNote?: string

  // Game metadata
  correctAction: 'screen' | 'monitor'
  isDistractor: boolean
  explanation: string
  category: 'T1D' | 'T2D-distractor' | 'LADA' | 'monitor'
}

export interface SessionResult {
  profileId: string
  playerAction: 'screen' | 'monitor'
  correct: boolean
}

export interface CumulativeStats {
  totalSessions: number
  perCard: Record<string, { timesShown: number; timesCorrect: number }>
}

export type AppScreen = 'idle' | 'playing' | 'summary'

export interface GameState {
  screen: AppScreen
  deck: PatientProfile[]
  currentIndex: number
  sessionResults: SessionResult[]
  lastResult: SessionResult | null
  cumulativeStats: CumulativeStats
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add shared types"
```

---

## Task 3: Add patient profile data

**Files:**
- Create: `src/data/profiles.ts`

- [ ] **Step 1: Create `src/data/profiles.ts`**

```ts
import type { PatientProfile } from '../types'

export const profiles: PatientProfile[] = [
  {
    id: 'p1',
    ageSex: '14-year-old male',
    bmi: 22,
    familyHistory: 'Sibling has T1D',
    symptoms: 'Polyuria, polydipsia, 8 lb weight loss over 3 weeks',
    correctAction: 'screen',
    isDistractor: false,
    explanation:
      'Classic T1D presentation: young patient, normal BMI, first-degree relative with T1D, and acute-onset symptoms. Screen for autoantibodies immediately.',
    category: 'T1D',
  },
  {
    id: 'p2',
    ageSex: '9-year-old female',
    bmi: 17,
    familyHistory: 'Mother has T1D',
    autoantibodies: 'Positive GAD65 on prior screen',
    correctAction: 'screen',
    isDistractor: false,
    explanation:
      'First-degree relative of a T1D patient with known positive autoantibodies. Continue screening — she is at high risk for progression to Stage 3 T1D.',
    category: 'T1D',
  },
  {
    id: 'p3',
    ageSex: '13-year-old male',
    bmi: 31,
    familyHistory: 'Father has T2D',
    lifestyle: 'Sedentary, high-sugar diet',
    ethnicity: 'Hispanic/Latino',
    correctAction: 'monitor',
    isDistractor: true,
    explanation:
      'Risk factors point to T2D, not T1D: obesity, sedentary lifestyle, family history of T2D, and Hispanic/Latino ethnicity. Screen for T2D instead.',
    category: 'T2D-distractor',
  },
  {
    id: 'p4',
    ageSex: '42-year-old female',
    bmi: 24,
    familyHistory: 'No family history of diabetes',
    symptoms: 'Gradual-onset hyperglycemia; oral meds failing after 8 months',
    autoantibodies: 'Positive GAD65',
    correctAction: 'screen',
    isDistractor: false,
    explanation:
      '80% of PCPs failed to screen this patient. LADA mimics T2D but progresses to insulin dependence. Positive GAD65 and normal BMI in an adult with failing oral meds = screen for T1D autoantibodies.',
    category: 'LADA',
  },
  {
    id: 'p5',
    ageSex: '55-year-old male',
    bmi: 33,
    familyHistory: 'Mother and brother have T2D',
    lifestyle: 'Sedentary office worker',
    symptoms: 'Fatigue, increased thirst',
    correctAction: 'monitor',
    isDistractor: true,
    explanation:
      'Multiple T2D risk factors: obesity, strong T2D family history, age >45, sedentary lifestyle. Monitor for T2D progression. No T1D risk factors present.',
    category: 'T2D-distractor',
  },
  {
    id: 'p6',
    ageSex: '11-year-old male',
    bmi: 20,
    familyHistory: 'Father has T1D',
    correctAction: 'screen',
    isDistractor: false,
    explanation:
      'First-degree relative of a T1D patient. Screening for autoantibodies is recommended even without symptoms (TrialNet). Early detection enables Stage 2 diagnosis before DKA.',
    category: 'T1D',
  },
  {
    id: 'p7',
    ageSex: '12-year-old female',
    bmi: 29,
    familyHistory: 'No family history of T1D; grandmother has T2D',
    lifestyle: 'Sedentary, drinks 2+ sodas daily',
    ethnicity: 'African American',
    correctAction: 'monitor',
    isDistractor: true,
    explanation:
      'Pediatric obesity with T2D risk factors: high BMI, T2D family history, African American ethnicity, sedentary lifestyle. No T1D indicators. Screen for T2D, not T1D.',
    category: 'T2D-distractor',
  },
  {
    id: 'p8',
    ageSex: '50-year-old female',
    bmi: 23,
    familyHistory: 'No family history of diabetes',
    symptoms: 'New "T2D" diagnosis 6 months ago; HbA1c rising despite metformin',
    correctAction: 'screen',
    isDistractor: false,
    explanation:
      '62% of PCPs missed this patient. Normal-BMI adult with new diabetes failing oral medication is a red flag for LADA. Test for GAD65 and other T1D autoantibodies.',
    category: 'LADA',
  },
  {
    id: 'p9',
    ageSex: '38-year-old male',
    bmi: 27,
    familyHistory: 'Father has T2D',
    lifestyle: 'Moderately active',
    symptoms: 'Prediabetes on recent labs (fasting glucose 108 mg/dL)',
    correctAction: 'monitor',
    isDistractor: true,
    explanation:
      'Prediabetes with T2D family history and mildly elevated BMI. No T1D risk factors. Monitor with lifestyle intervention and repeat glucose in 3 months.',
    category: 'T2D-distractor',
  },
  {
    id: 'p10',
    ageSex: '23-year-old female',
    bmi: 19,
    familyHistory: 'No family history of diabetes',
    symptoms: 'DKA presentation: nausea, vomiting, blood glucose 450 mg/dL',
    correctAction: 'screen',
    isDistractor: false,
    explanation:
      'DKA with normal BMI in a young adult strongly suggests T1D. ~85% of T1D cases have no family history. Screen and treat immediately.',
    category: 'T1D',
  },
  {
    id: 'p11',
    ageSex: '32-year-old female',
    bmi: 26,
    familyHistory: 'No family history of T1D',
    symptoms: 'Gestational diabetes during last pregnancy (resolved post-partum)',
    lifestyle: 'Moderately active',
    correctAction: 'monitor',
    isDistractor: true,
    explanation:
      'History of gestational diabetes is a T2D risk factor, not a T1D indicator. Monitor with annual HbA1c. No T1D risk factors present.',
    category: 'T2D-distractor',
  },
  {
    id: 'p12',
    ageSex: '36-year-old male',
    bmi: 22,
    familyHistory: 'Sister has T1D',
    symptoms: 'Unexplained weight loss, polydipsia, fasting glucose 280 mg/dL',
    correctAction: 'screen',
    isDistractor: false,
    explanation:
      'Adult sibling of a T1D patient with classic symptoms and markedly elevated glucose. High suspicion for T1D or LADA. Screen for autoantibodies and consider insulin initiation.',
    category: 'T1D',
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/data/profiles.ts
git commit -m "feat: add patient profile data"
```

---

## Task 4: Game reducer and context

**Files:**
- Create: `src/context/GameContext.tsx`
- Create: `src/context/GameContext.test.ts`

- [ ] **Step 1: Write failing tests in `src/context/GameContext.test.ts`**

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { gameReducer, initialState } from './GameContext'
import { profiles } from '../data/profiles'

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('gameReducer', () => {
  it('START_GAME sets screen to playing and loads a shuffled full deck', () => {
    const state = gameReducer(initialState, { type: 'START_GAME' })
    expect(state.screen).toBe('playing')
    expect(state.deck).toHaveLength(profiles.length)
    expect(state.currentIndex).toBe(0)
    expect(state.sessionResults).toHaveLength(0)
    expect(state.lastResult).toBeNull()
  })

  it('SWIPE records correct result and advances index', () => {
    let state = gameReducer(initialState, { type: 'START_GAME' })
    const topCard = state.deck[0]
    state = gameReducer(state, {
      type: 'SWIPE',
      profileId: topCard.id,
      action: topCard.correctAction,
    })
    expect(state.currentIndex).toBe(1)
    expect(state.sessionResults).toHaveLength(1)
    expect(state.lastResult?.correct).toBe(true)
    expect(state.screen).toBe('playing')
  })

  it('SWIPE records incorrect result when wrong action chosen', () => {
    let state = gameReducer(initialState, { type: 'START_GAME' })
    const topCard = state.deck[0]
    const wrongAction = topCard.correctAction === 'screen' ? 'monitor' : 'screen'
    state = gameReducer(state, {
      type: 'SWIPE',
      profileId: topCard.id,
      action: wrongAction,
    })
    expect(state.lastResult?.correct).toBe(false)
  })

  it('SWIPE on last card transitions to summary and increments totalSessions', () => {
    let state = gameReducer(initialState, { type: 'START_GAME' })
    for (let i = 0; i < state.deck.length; i++) {
      const card = state.deck[i]
      state = gameReducer(state, {
        type: 'SWIPE',
        profileId: card.id,
        action: card.correctAction,
      })
    }
    expect(state.screen).toBe('summary')
    expect(state.cumulativeStats.totalSessions).toBe(1)
    expect(Object.keys(state.cumulativeStats.perCard)).toHaveLength(profiles.length)
  })

  it('SWIPE on last card records timesShown and timesCorrect in perCard', () => {
    let state = gameReducer(initialState, { type: 'START_GAME' })
    const firstCard = state.deck[0]
    // Swipe correctly on first card, then exhaust the rest
    state = gameReducer(state, {
      type: 'SWIPE',
      profileId: firstCard.id,
      action: firstCard.correctAction,
    })
    for (let i = 1; i < state.deck.length; i++) {
      const card = state.deck[i]
      state = gameReducer(state, { type: 'SWIPE', profileId: card.id, action: card.correctAction })
    }
    const stats = state.cumulativeStats.perCard[firstCard.id]
    expect(stats.timesShown).toBe(1)
    expect(stats.timesCorrect).toBe(1)
  })

  it('RESET returns to idle and clears session results', () => {
    let state = gameReducer(initialState, { type: 'START_GAME' })
    state = gameReducer(state, {
      type: 'SWIPE',
      profileId: state.deck[0].id,
      action: state.deck[0].correctAction,
    })
    state = gameReducer(state, { type: 'RESET' })
    expect(state.screen).toBe('idle')
    expect(state.sessionResults).toHaveLength(0)
    expect(state.lastResult).toBeNull()
    expect(state.deck).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: All tests fail with "Cannot find module './GameContext'".

- [ ] **Step 3: Create `src/context/GameContext.tsx`**

```tsx
import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from 'react'
import { profiles } from '../data/profiles'
import type {
  GameState,
  PatientProfile,
  SessionResult,
  CumulativeStats,
} from '../types'

// ─── Actions ────────────────────────────────────────────────
type GameAction =
  | { type: 'START_GAME' }
  | { type: 'SWIPE'; profileId: string; action: 'screen' | 'monitor' }
  | { type: 'RESET' }

// ─── localStorage helpers ────────────────────────────────────
const STORAGE_KEY = 'wwys_stats'

function loadCumulativeStats(): CumulativeStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : { totalSessions: 0, perCard: {} }
  } catch {
    return { totalSessions: 0, perCard: {} }
  }
}

function saveCumulativeStats(stats: CumulativeStats): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
}

// ─── Shuffle ─────────────────────────────────────────────────
function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ─── Cumulative stats update ─────────────────────────────────
function updateCumulativeStats(
  current: CumulativeStats,
  results: SessionResult[],
): CumulativeStats {
  const perCard = { ...current.perCard }
  for (const result of results) {
    const existing = perCard[result.profileId] ?? { timesShown: 0, timesCorrect: 0 }
    perCard[result.profileId] = {
      timesShown: existing.timesShown + 1,
      timesCorrect: existing.timesCorrect + (result.correct ? 1 : 0),
    }
  }
  return { totalSessions: current.totalSessions + 1, perCard }
}

// ─── Initial state ────────────────────────────────────────────
export const initialState: GameState = {
  screen: 'idle',
  deck: [],
  currentIndex: 0,
  sessionResults: [],
  lastResult: null,
  cumulativeStats: { totalSessions: 0, perCard: {} },
}

// ─── Reducer ─────────────────────────────────────────────────
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...state,
        screen: 'playing',
        deck: shuffle(profiles),
        currentIndex: 0,
        sessionResults: [],
        lastResult: null,
      }

    case 'SWIPE': {
      const profile = state.deck[state.currentIndex] as PatientProfile
      const correct = action.action === profile.correctAction
      const result: SessionResult = {
        profileId: action.profileId,
        playerAction: action.action,
        correct,
      }
      const newResults = [...state.sessionResults, result]
      const newIndex = state.currentIndex + 1
      const isLastCard = newIndex >= state.deck.length

      if (isLastCard) {
        const newStats = updateCumulativeStats(state.cumulativeStats, newResults)
        saveCumulativeStats(newStats)
        return {
          ...state,
          screen: 'summary',
          currentIndex: newIndex,
          sessionResults: newResults,
          lastResult: result,
          cumulativeStats: newStats,
        }
      }

      return {
        ...state,
        currentIndex: newIndex,
        sessionResults: newResults,
        lastResult: result,
      }
    }

    case 'RESET':
      return {
        ...state,
        screen: 'idle',
        deck: [],
        currentIndex: 0,
        sessionResults: [],
        lastResult: null,
      }

    default:
      return state
  }
}

// ─── Context ─────────────────────────────────────────────────
interface GameContextValue {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, {
    ...initialState,
    cumulativeStats: loadCumulativeStats(),
  })

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/context/GameContext.tsx src/context/GameContext.test.ts
git commit -m "feat: add game reducer, context, and localStorage persistence"
```

---

## Task 5: AttractScreen

**Files:**
- Create: `src/components/AttractScreen.tsx`

- [ ] **Step 1: Create `src/components/AttractScreen.tsx`**

```tsx
interface AttractScreenProps {
  onStart: () => void
}

export function AttractScreen({ onStart }: AttractScreenProps) {
  return (
    <div
      className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-white"
      onClick={onStart}
    >
      <div className="text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
          PCP / ENDO Boards
        </p>
        <h1 className="text-4xl font-black tracking-tight text-gray-900">
          "Who Would You Screen?"
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          T1D vs. T2D Risk Factors — Speed Challenge
        </p>
      </div>

      <button
        className="rounded-full bg-gray-900 px-10 py-3 text-sm font-bold uppercase tracking-widest text-white hover:bg-gray-700 active:scale-95"
        onClick={(e) => {
          e.stopPropagation()
          onStart()
        }}
      >
        Tap to Start
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Wire into App.tsx temporarily to verify it renders**

Replace `src/App.tsx`:

```tsx
import { AttractScreen } from './components/AttractScreen'

function App() {
  return <AttractScreen onStart={() => console.log('start')} />
}

export default App
```

- [ ] **Step 3: Check browser — should show title and "Tap to Start" button**

```bash
npm run dev
```

Expected: White screen with title and button centered.

- [ ] **Step 4: Revert App.tsx to blank**

```tsx
function App() {
  return <></>
}

export default App
```

- [ ] **Step 5: Commit**

```bash
git add src/components/AttractScreen.tsx src/App.tsx
git commit -m "feat: add AttractScreen"
```

---

## Task 6: PatientCard

**Files:**
- Create: `src/components/game/PatientCard.tsx`

- [ ] **Step 1: Create `src/components/game/PatientCard.tsx`**

```tsx
import type { PatientProfile } from '../../types'

interface PatientCardProps {
  profile: PatientProfile
}

const OPTIONAL_FIELDS: Array<{
  key: keyof PatientProfile
  label: string
}> = [
  { key: 'symptoms', label: 'Symptoms' },
  { key: 'lifestyle', label: 'Lifestyle' },
  { key: 'autoantibodies', label: 'Antibodies' },
  { key: 'ethnicity', label: 'Ethnicity' },
  { key: 'customNote', label: 'Note' },
]

export function PatientCard({ profile }: PatientCardProps) {
  return (
    <div className="flex h-full w-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-md">
      {/* Header */}
      <div className="mb-4 border-b border-gray-100 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Patient Profile
        </p>
        <p className="mt-1 text-lg font-bold text-gray-900">{profile.ageSex}</p>
      </div>

      {/* Always-present fields */}
      <div className="flex flex-col gap-3">
        <FieldRow label="BMI" value={String(profile.bmi)} />
        <FieldRow label="Family Hx" value={profile.familyHistory} />

        {/* Optional fields */}
        {OPTIONAL_FIELDS.map(({ key, label }) =>
          profile[key] ? (
            <FieldRow key={key} label={label} value={String(profile[key])} />
          ) : null,
        )}
      </div>
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-20 shrink-0 pt-0.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <span className="text-sm leading-snug text-gray-700">{value}</span>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/game/PatientCard.tsx
git commit -m "feat: add PatientCard component"
```

---

## Task 7: CardStack (Framer Motion swipe)

**Files:**
- Create: `src/components/game/CardStack.tsx`

- [ ] **Step 1: Create `src/components/game/CardStack.tsx`**

```tsx
import {
  forwardRef,
  useImperativeHandle,
} from 'react'
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  type PanInfo,
} from 'framer-motion'
import { PatientCard } from './PatientCard'
import type { PatientProfile } from '../../types'

// ─── DraggableCard ────────────────────────────────────────────

export interface DraggableCardHandle {
  triggerSwipe: (direction: 'screen' | 'monitor') => void
}

interface DraggableCardProps {
  profile: PatientProfile
  onSwipe: (direction: 'screen' | 'monitor') => void
}

const DraggableCard = forwardRef<DraggableCardHandle, DraggableCardProps>(
  ({ profile, onSwipe }, ref) => {
    const x = useMotionValue(0)
    const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12])
    const screenOpacity = useTransform(x, [0, 80, 150], [0, 0.7, 1])
    const monitorOpacity = useTransform(x, [-150, -80, 0], [1, 0.7, 0])
    const controls = useAnimation()

    const commitSwipe = async (direction: 'screen' | 'monitor') => {
      const targetX = direction === 'screen' ? 600 : -600
      await controls.start({
        x: targetX,
        opacity: 0,
        transition: { duration: 0.3, ease: 'easeOut' },
      })
      onSwipe(direction)
    }

    useImperativeHandle(ref, () => ({ triggerSwipe: commitSwipe }))

    const handleDragEnd = (_: never, info: PanInfo) => {
      if (info.offset.x > 120) {
        commitSwipe('screen')
      } else if (info.offset.x < -120) {
        commitSwipe('monitor')
      } else {
        controls.start({
          x: 0,
          transition: { type: 'spring', stiffness: 400, damping: 30 },
        })
      }
    }

    return (
      <motion.div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ x, rotate }}
        animate={controls}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
      >
        <PatientCard profile={profile} />

        {/* Screen indicator overlay */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-emerald-500/20"
          style={{ opacity: screenOpacity }}
        >
          <span className="text-lg font-bold tracking-wide text-emerald-700">
            SCREEN →
          </span>
        </motion.div>

        {/* Monitor indicator overlay */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-red-500/20"
          style={{ opacity: monitorOpacity }}
        >
          <span className="text-lg font-bold tracking-wide text-red-700">
            ← MONITOR
          </span>
        </motion.div>
      </motion.div>
    )
  },
)

DraggableCard.displayName = 'DraggableCard'

// ─── CardStack ───────────────────────────────────────────────

export interface CardStackHandle {
  triggerSwipe: (direction: 'screen' | 'monitor') => void
}

interface CardStackProps {
  deck: PatientProfile[]
  currentIndex: number
  onSwipe: (direction: 'screen' | 'monitor') => void
}

export const CardStack = forwardRef<CardStackHandle, CardStackProps>(
  ({ deck, currentIndex, onSwipe }, ref) => {
    const draggableRef = useImperativeHandle(ref, () => ({
      triggerSwipe: (direction: 'screen' | 'monitor') => {
        // Delegate to the DraggableCard via its own ref
        draggableCardRef.current?.triggerSwipe(direction)
      },
    }))

    // Inner ref for the actual draggable card
    const draggableCardRef = useImperativeHandle(ref, () => ({
      triggerSwipe: (direction: 'screen' | 'monitor') => {
        draggableCardInnerRef.current?.triggerSwipe(direction)
      },
    }))

    const draggableCardInnerRef = useImperativeHandle(ref as never, () => ({
      triggerSwipe: (_: never) => {},
    })) as unknown as React.RefObject<DraggableCardHandle>

    // Simpler approach: use a local ref internally
    void draggableRef
    void draggableCardRef

    return null // placeholder — see corrected version below
  },
)
```

Wait — the nested `useImperativeHandle` approach above is wrong. Use a single inner ref pattern instead. Replace the file entirely with this corrected version:

- [ ] **Step 2: Replace `src/components/game/CardStack.tsx` with the corrected implementation**

```tsx
import { forwardRef, useImperativeHandle, useRef } from 'react'
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  type PanInfo,
} from 'framer-motion'
import { PatientCard } from './PatientCard'
import type { PatientProfile } from '../../types'

// ─── DraggableCard ────────────────────────────────────────────

export interface DraggableCardHandle {
  triggerSwipe: (direction: 'screen' | 'monitor') => void
}

interface DraggableCardProps {
  profile: PatientProfile
  onSwipe: (direction: 'screen' | 'monitor') => void
}

const DraggableCard = forwardRef<DraggableCardHandle, DraggableCardProps>(
  ({ profile, onSwipe }, ref) => {
    const x = useMotionValue(0)
    const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12])
    const screenOpacity = useTransform(x, [0, 80, 150], [0, 0.7, 1])
    const monitorOpacity = useTransform(x, [-150, -80, 0], [1, 0.7, 0])
    const controls = useAnimation()

    const commitSwipe = async (direction: 'screen' | 'monitor') => {
      const targetX = direction === 'screen' ? 600 : -600
      await controls.start({
        x: targetX,
        opacity: 0,
        transition: { duration: 0.3, ease: 'easeOut' },
      })
      onSwipe(direction)
    }

    useImperativeHandle(ref, () => ({ triggerSwipe: commitSwipe }))

    const handleDragEnd = (_: never, info: PanInfo) => {
      if (info.offset.x > 120) {
        commitSwipe('screen')
      } else if (info.offset.x < -120) {
        commitSwipe('monitor')
      } else {
        controls.start({
          x: 0,
          transition: { type: 'spring', stiffness: 400, damping: 30 },
        })
      }
    }

    return (
      <motion.div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ x, rotate }}
        animate={controls}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
      >
        <PatientCard profile={profile} />

        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-emerald-500/20"
          style={{ opacity: screenOpacity }}
        >
          <span className="text-lg font-bold tracking-wide text-emerald-700">
            SCREEN →
          </span>
        </motion.div>

        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-red-500/20"
          style={{ opacity: monitorOpacity }}
        >
          <span className="text-lg font-bold tracking-wide text-red-700">
            ← MONITOR
          </span>
        </motion.div>
      </motion.div>
    )
  },
)
DraggableCard.displayName = 'DraggableCard'

// ─── CardStack ───────────────────────────────────────────────

export interface CardStackHandle {
  triggerSwipe: (direction: 'screen' | 'monitor') => void
}

interface CardStackProps {
  deck: PatientProfile[]
  currentIndex: number
  onSwipe: (direction: 'screen' | 'monitor') => void
}

export const CardStack = forwardRef<CardStackHandle, CardStackProps>(
  ({ deck, currentIndex, onSwipe }, ref) => {
    const draggableRef = useRef<DraggableCardHandle>(null)

    useImperativeHandle(ref, () => ({
      triggerSwipe: (direction) => draggableRef.current?.triggerSwipe(direction),
    }))

    // Show up to 3 cards: current + next 2 (rendered back to front)
    const visibleProfiles = deck.slice(currentIndex, currentIndex + 3)

    return (
      <div className="relative h-80 w-60">
        {[...visibleProfiles].reverse().map((profile, reversedIndex) => {
          const stackPosition = visibleProfiles.length - 1 - reversedIndex
          const isTop = stackPosition === 0

          if (isTop) {
            return (
              <DraggableCard
                key={profile.id}
                ref={draggableRef}
                profile={profile}
                onSwipe={onSwipe}
              />
            )
          }

          return (
            <motion.div
              key={profile.id}
              className="absolute inset-0 pointer-events-none"
              style={{
                scale: 1 - stackPosition * 0.04,
                y: stackPosition * 8,
                rotate: stackPosition % 2 === 0 ? -2 : 2,
                opacity: 1 - stackPosition * 0.3,
                zIndex: -stackPosition,
              }}
            >
              <PatientCard profile={profile} />
            </motion.div>
          )
        })}
      </div>
    )
  },
)
CardStack.displayName = 'CardStack'
```

- [ ] **Step 3: Commit**

```bash
git add src/components/game/CardStack.tsx
git commit -m "feat: add CardStack with Framer Motion drag interaction"
```

---

## Task 8: ProgressBar and SwipeGuide

**Files:**
- Create: `src/components/game/ProgressBar.tsx`
- Create: `src/components/game/SwipeGuide.tsx`

- [ ] **Step 1: Create `src/components/game/ProgressBar.tsx`**

```tsx
interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.min((current / total) * 100, 100)

  return (
    <div className="flex w-full items-center gap-3">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-gray-900 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400">
        {current} / {total}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/game/SwipeGuide.tsx`**

```tsx
interface SwipeGuideProps {
  onTap: (direction: 'screen' | 'monitor') => void
}

export function SwipeGuide({ onTap }: SwipeGuideProps) {
  return (
    <div className="flex w-full max-w-xs items-center justify-between">
      <button
        className="flex flex-col items-center gap-1 text-red-500 active:scale-95"
        onClick={() => onTap('monitor')}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-red-400 text-xl">
          ←
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest">
          Monitor
        </span>
      </button>

      <button
        className="flex flex-col items-center gap-1 text-emerald-600 active:scale-95"
        onClick={() => onTap('screen')}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-emerald-500 text-xl">
          →
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest">
          Screen
        </span>
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/game/ProgressBar.tsx src/components/game/SwipeGuide.tsx
git commit -m "feat: add ProgressBar and SwipeGuide"
```

---

## Task 9: GamePanel

**Files:**
- Create: `src/components/game/GamePanel.tsx`

- [ ] **Step 1: Create `src/components/game/GamePanel.tsx`**

```tsx
import { forwardRef, useRef } from 'react'
import { CardStack, type CardStackHandle } from './CardStack'
import { ProgressBar } from './ProgressBar'
import { SwipeGuide } from './SwipeGuide'
import type { PatientProfile } from '../../types'

export interface GamePanelHandle {
  triggerSwipe: (direction: 'screen' | 'monitor') => void
}

interface GamePanelProps {
  deck: PatientProfile[]
  currentIndex: number
  onSwipe: (direction: 'screen' | 'monitor') => void
}

export const GamePanel = forwardRef<GamePanelHandle, GamePanelProps>(
  ({ deck, currentIndex, onSwipe }, ref) => {
    const cardStackRef = useRef<CardStackHandle>(null)

    useImperativeHandle(ref, () => ({
      triggerSwipe: (direction) => cardStackRef.current?.triggerSwipe(direction),
    }))

    return (
      <div className="relative flex flex-[3] flex-col items-center justify-center gap-8 border-r border-gray-100 bg-gray-50 p-6">
        {/* Progress bar at top */}
        <div className="absolute left-6 right-6 top-5">
          <ProgressBar current={currentIndex + 1} total={deck.length} />
        </div>

        {/* Card stack */}
        <CardStack
          ref={cardStackRef}
          deck={deck}
          currentIndex={currentIndex}
          onSwipe={onSwipe}
        />

        {/* Swipe guide at bottom */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
          <SwipeGuide onTap={(dir) => cardStackRef.current?.triggerSwipe(dir)} />
        </div>
      </div>
    )
  },
)
GamePanel.displayName = 'GamePanel'
```

Note: add `useImperativeHandle` to the imports from `'react'` at the top:
```tsx
import { forwardRef, useImperativeHandle, useRef } from 'react'
```

- [ ] **Step 2: Commit**

```bash
git add src/components/game/GamePanel.tsx
git commit -m "feat: add GamePanel"
```

---

## Task 10: FeedbackBox and SessionStats

**Files:**
- Create: `src/components/dashboard/FeedbackBox.tsx`
- Create: `src/components/dashboard/SessionStats.tsx`

- [ ] **Step 1: Create `src/components/dashboard/FeedbackBox.tsx`**

```tsx
import type { SessionResult, PatientProfile } from '../../types'

interface FeedbackBoxProps {
  lastResult: SessionResult | null
  deck: PatientProfile[]
}

export function FeedbackBox({ lastResult, deck }: FeedbackBoxProps) {
  if (!lastResult) {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Previous Swipe
        </p>
        <p className="text-sm text-gray-400 italic">Swipe a card to see feedback</p>
      </div>
    )
  }

  const profile = deck.find((p) => p.id === lastResult.profileId)
  const isCorrect = lastResult.correct

  return (
    <div
      className={`rounded-xl border p-4 ${
        isCorrect
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-red-200 bg-red-50'
      }`}
    >
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
        Previous Swipe
      </p>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}
        />
        <span
          className={`text-sm font-bold ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}
        >
          {isCorrect ? 'Correct' : 'Missed'} —{' '}
          {lastResult.playerAction === 'screen' ? 'Screened' : 'Monitored'}
        </span>
      </div>
      {profile && (
        <p className="text-sm leading-relaxed text-gray-600">{profile.explanation}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/dashboard/SessionStats.tsx`**

```tsx
interface SessionStatsProps {
  correct: number
  missed: number
}

export function SessionStats({ correct, missed }: SessionStatsProps) {
  const total = correct + missed
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100)

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
        This Session
      </p>
      <div className="flex justify-around text-center">
        <Stat value={correct} label="Correct" />
        <Stat value={missed} label="Missed" />
        <Stat value={`${accuracy}%`} label="Accuracy" />
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-black text-gray-900">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/FeedbackBox.tsx src/components/dashboard/SessionStats.tsx
git commit -m "feat: add FeedbackBox and SessionStats dashboard components"
```

---

## Task 11: CommunityInsights

**Files:**
- Create: `src/components/dashboard/CommunityInsights.tsx`

- [ ] **Step 1: Create `src/components/dashboard/CommunityInsights.tsx`**

```tsx
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { profiles } from '../../data/profiles'
import type { CumulativeStats } from '../../types'

interface CommunityInsightsProps {
  stats: CumulativeStats
}

interface ChartRow {
  label: string
  missRate: number
}

function getMostMissed(stats: CumulativeStats, topN = 5): ChartRow[] {
  return Object.entries(stats.perCard)
    .filter(([, { timesShown }]) => timesShown > 0)
    .map(([id, { timesShown, timesCorrect }]) => {
      const profile = profiles.find((p) => p.id === id)
      return {
        label: profile?.ageSex ?? id,
        missRate: Math.round(((timesShown - timesCorrect) / timesShown) * 100),
      }
    })
    .sort((a, b) => b.missRate - a.missRate)
    .slice(0, topN)
}

const BAR_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']

export function CommunityInsights({ stats }: CommunityInsightsProps) {
  const data = getMostMissed(stats)

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-gray-100 bg-gray-50 p-4 overflow-hidden">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
        Community Insights
      </p>
      <p className="mb-3 text-sm font-bold text-gray-800">Most Missed Profiles</p>

      {data.length === 0 ? (
        <p className="text-sm italic text-gray-400">
          Data will appear after the first completed session.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={110}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number) => [`${value}% missed`, '']}
              contentStyle={{ fontSize: 11 }}
            />
            <Bar dataKey="missRate" radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={BAR_COLORS[index] ?? BAR_COLORS[BAR_COLORS.length - 1]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/CommunityInsights.tsx
git commit -m "feat: add CommunityInsights Recharts component"
```

---

## Task 12: DashboardPanel

**Files:**
- Create: `src/components/dashboard/DashboardPanel.tsx`

- [ ] **Step 1: Create `src/components/dashboard/DashboardPanel.tsx`**

```tsx
import { FeedbackBox } from './FeedbackBox'
import { SessionStats } from './SessionStats'
import { CommunityInsights } from './CommunityInsights'
import type { SessionResult, PatientProfile, CumulativeStats } from '../../types'

interface DashboardPanelProps {
  lastResult: SessionResult | null
  deck: PatientProfile[]
  sessionResults: SessionResult[]
  cumulativeStats: CumulativeStats
}

export function DashboardPanel({
  lastResult,
  deck,
  sessionResults,
  cumulativeStats,
}: DashboardPanelProps) {
  const correct = sessionResults.filter((r) => r.correct).length
  const missed = sessionResults.filter((r) => !r.correct).length

  return (
    <div className="flex flex-[2] flex-col gap-3 bg-white p-4">
      <FeedbackBox lastResult={lastResult} deck={deck} />
      <SessionStats correct={correct} missed={missed} />
      <CommunityInsights stats={cumulativeStats} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/DashboardPanel.tsx
git commit -m "feat: add DashboardPanel"
```

---

## Task 13: GameScreen

**Files:**
- Create: `src/components/GameScreen.tsx`

- [ ] **Step 1: Create `src/components/GameScreen.tsx`**

```tsx
import { useGame } from '../context/GameContext'
import { GamePanel } from './game/GamePanel'
import { DashboardPanel } from './dashboard/DashboardPanel'

export function GameScreen() {
  const { state, dispatch } = useGame()
  const { deck, currentIndex, sessionResults, lastResult, cumulativeStats } = state

  const handleSwipe = (direction: 'screen' | 'monitor') => {
    const profile = deck[currentIndex]
    if (!profile) return
    dispatch({ type: 'SWIPE', profileId: profile.id, action: direction })
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <GamePanel
        deck={deck}
        currentIndex={currentIndex}
        onSwipe={handleSwipe}
      />
      <DashboardPanel
        lastResult={lastResult}
        deck={deck}
        sessionResults={sessionResults}
        cumulativeStats={cumulativeStats}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GameScreen.tsx
git commit -m "feat: add GameScreen with 60/40 layout"
```

---

## Task 14: SummaryScreen

**Files:**
- Create: `src/components/SummaryScreen.tsx`

- [ ] **Step 1: Create `src/components/SummaryScreen.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useGame } from '../context/GameContext'

const RESET_DELAY_SECONDS = 10

export function SummaryScreen() {
  const { state, dispatch } = useGame()
  const { sessionResults } = state
  const [countdown, setCountdown] = useState(RESET_DELAY_SECONDS)

  const correct = sessionResults.filter((r) => r.correct).length
  const total = sessionResults.length
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100)

  useEffect(() => {
    if (countdown <= 0) {
      dispatch({ type: 'RESET' })
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, dispatch])

  return (
    <div
      className="flex h-screen w-screen cursor-pointer flex-col items-center justify-center gap-10 bg-white"
      onClick={() => dispatch({ type: 'RESET' })}
    >
      <h2 className="text-2xl font-black text-gray-900">Session Complete</h2>

      <div className="flex items-center gap-16">
        <StatBlock value={total} label="Cards Played" />
        <div className="h-16 w-px bg-gray-200" />
        <StatBlock value={correct} label="Correct" />
        <div className="h-16 w-px bg-gray-200" />
        <StatBlock value={`${accuracy}%`} label="Accuracy" />
      </div>

      <p className="text-sm text-gray-400">
        Tap anywhere to restart · Resetting in {countdown}s
      </p>
    </div>
  )
}

function StatBlock({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-6xl font-black text-gray-900">{value}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SummaryScreen.tsx
git commit -m "feat: add SummaryScreen with auto-reset countdown"
```

---

## Task 15: Wire up App and GameProvider

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace `src/App.tsx`**

```tsx
import { GameProvider, useGame } from './context/GameContext'
import { AttractScreen } from './components/AttractScreen'
import { GameScreen } from './components/GameScreen'
import { SummaryScreen } from './components/SummaryScreen'

function GameRouter() {
  const { state, dispatch } = useGame()

  if (state.screen === 'idle') {
    return <AttractScreen onStart={() => dispatch({ type: 'START_GAME' })} />
  }
  if (state.screen === 'playing') {
    return <GameScreen />
  }
  return <SummaryScreen />
}

function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  )
}

export default App
```

- [ ] **Step 2: Run the dev server and do a full manual smoke test**

```bash
npm run dev
```

Verify each step manually:
1. Attract screen appears on load
2. "Tap to Start" transitions to game screen
3. 60/40 split is visible (card left, dashboard right)
4. Cards show all profile fields correctly
5. Drag a card right past threshold → flies off, feedback panel updates green
6. Drag a card left past threshold → flies off, feedback panel updates red
7. Drag a card partially and release → snaps back
8. Tap "← Monitor" button → card animates left
9. Tap "Screen →" button → card animates right
10. Progress bar advances with each swipe
11. Session stats update (correct/missed/accuracy)
12. Complete all cards → summary screen appears
13. Summary auto-resets to attract screen after 10s
14. Community Insights bar chart appears after first completed session
15. `localStorage` key `wwys_stats` contains data after session (check DevTools)

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: All 6 reducer tests pass.

- [ ] **Step 4: Final commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up App with GameProvider and screen routing"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Attract/idle screen — Task 5
- ✅ Card swipe (Framer Motion, drag + tap buttons) — Task 7
- ✅ Screen/Monitor decision — Tasks 7, 9, 13
- ✅ Distractors (T2D cards in profile data) — Task 3
- ✅ 60/40 split layout — Task 13
- ✅ Feedback panel (last swipe result + explanation) — Task 10
- ✅ Session stats (correct/missed/accuracy) — Task 10
- ✅ Community Insights (most-missed bar chart) — Task 11
- ✅ Summary screen with auto-reset — Task 14
- ✅ localStorage cumulative stats — Task 4
- ✅ State machine (idle → playing → summary → idle) — Tasks 4, 15
- ✅ Tailwind light theme — all component tasks
- ✅ Patient profile data (12 profiles, mixed T1D/T2D/LADA/monitor) — Task 3

**Type consistency check:**
- `GameAction` uses `profileId` + `action` — matches `SWIPE` dispatch in `GameScreen` ✅
- `CardStackHandle.triggerSwipe` → `DraggableCardHandle.triggerSwipe` → `commitSwipe` — chain is consistent ✅
- `DashboardPanel` receives `sessionResults: SessionResult[]` — computes correct/missed inline ✅
- `CommunityInsights` receives `stats: CumulativeStats` — reads `stats.perCard` ✅
- `FeedbackBox` receives `deck: PatientProfile[]` to look up explanation by `lastResult.profileId` ✅
