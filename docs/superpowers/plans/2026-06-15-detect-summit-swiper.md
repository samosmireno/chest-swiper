# DETECT Summit Swiper Implementation Plan (Sub-branch 2 — tap-button grid)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the DETECT in-portal summit swiper — 2 facilitated cases, each with an intro screen, 3 difficulty-weighted multiple-choice questions with immediate feedback, and an open-discussion screen, followed by a scored summary with a per-summit leaderboard.

**Architecture:** Fork the ADA app in place on `portal`. Keep ADA's transport/leaderboard/analytics/kiosk infrastructure; replace the data model (`SummitCase → CaseQuestion → AnswerOption`), the reducer (a derived **step list** walked by a single `cursor`), and all UI (tap-button grid, no swipe). Answers are stored keyed by `questionId`; scoring is per-correct weighted by option count (`optionCount × 50`).

**Tech Stack:** React 19 + TypeScript, Vite, Tailwind v4, framer-motion, recharts, vitest + Testing Library, react-ga4. Drupal Webform REST + Google Sheets fallback.

**Companion docs:** Design spec `docs/superpowers/specs/2026-06-15-detect-summit-swiper-design.md`. Cross-layout variant `docs/superpowers/plans/2026-06-15-detect-cross-layout-variant.md`.

**Conventions:** No commits unless the user asks (see project memory). `npm run test` = vitest, `npm run build` = `tsc -b && vite build`, `npm run lint`. Run `npm run build` after UI-heavy tasks to catch type errors.

---

## File structure

**Create:**

- `src/types/index.ts` (replace contents) — new model + state types.
- `src/data/cases.ts` — Emma + James content (verbatim from spec §4).
- `src/config.ts` (replace) — Drupal/Sheets URLs (kept), `SUMMIT_ID`, `LOGIN_INFO_URL`, `SHOW_LEADERBOARD`, scoring + kiosk constants.
- `src/game/steps.ts` — derive the ordered `Step[]` from cases.
- `src/game/scoring.ts` — `questionWeight`, `scoreCase`, `scoreTotal`.
- `src/context/GameContext.tsx` (replace) — reducer + provider + completion wiring.
- `src/hooks/useLoginInfo.ts` — fetch login identity, fall back to team entry.
- `src/leaderboard.ts` (replace) — entry shape + local store + score passthrough.
- `src/hooks/useWebformSubmission.ts` (replace `buildPayload`) — new payload.
- `src/utils/remoteSubmissions.ts` (modify) — filter by `summit_id`.
- `src/hooks/useDrupalLeaderboard.ts` (modify) — adapt fields + 10s polling.
- `src/hooks/useSessionCompletion.ts` (replace) — new completion inputs.
- `src/hooks/useAnalytics.ts` (modify) — DETECT events.
- `src/components/HomeScreen.tsx`, `CaseIntroScreen.tsx`, `QuestionScreen.tsx`, `DiscussionScreen.tsx`, `SummaryScreen.tsx`, `RestartButton.tsx`.
- `src/components/question/OptionGrid.tsx`, `FeedbackBanner.tsx`.
- `src/components/dashboard/DashboardPanel.tsx` (replace), `SessionScore.tsx`, `LeaderboardPanel.tsx` (move/adapt).
- `src/App.tsx` (replace) — router by step kind.

**Delete after wiring:** `src/data/profiles.ts`, `src/components/game/CardStack.tsx`, `SwipeGuide.tsx`, `StreakBanner.tsx`, `ProgressBar.tsx`, `PatientCard.tsx`, `RationaleOverlay.tsx`, `GamePanel.tsx`, `GameScreen.tsx`, `AttractScreen.tsx`, `SummaryView.tsx`, `SummaryPanel.tsx`, `components/dashboard/CommunityInsights.tsx`, `components/dashboard/SessionStats.tsx`, `utils/sessionStats.ts`, `utils/shuffle.ts`, `utils/statsStorage.ts`, `hooks/useCommunityStats.ts`, `context/GameContext.test.ts` (replaced by new reducer tests).

---

## Task 1: Data model types

**Files:**

- Replace: `src/types/index.ts`

- [ ] **Step 1: Write the new types**

```ts
// src/types/index.ts
export interface AnswerOption {
  id: string;
  label: string;
}

export interface CaseQuestion {
  id: string; // e.g. "c1q1"
  prompt: string;
  context?: string[]; // "case continuation" labs/history shown above the prompt
  options: AnswerOption[]; // 2–5
  correctOptionId: string;
  explanation?: string; // optional; empty for v1 (faculty deliver rationale live)
  weight?: number; // optional override; default = options.length * 50
}

export interface CaseDiscussion {
  context?: string[];
  prompts: string[];
}

export interface CaseIntro {
  narrative: string[];
  breakout: string[];
  image?: string;
}

export interface SummitCase {
  id: string; // "case1"
  patientName: string;
  intro: CaseIntro;
  questions: CaseQuestion[];
  discussion: CaseDiscussion;
}

export type Step =
  | { kind: "home" }
  | { kind: "intro"; caseIndex: number }
  | { kind: "question"; caseIndex: number; questionIndex: number }
  | { kind: "discussion"; caseIndex: number }
  | { kind: "summary" };

export type IdentityType = "user" | "team";

export interface Identity {
  name: string;
  email: string;
  specialty: string;
  type: IdentityType;
}

export interface AnswerRecord {
  questionId: string;
  caseId: string;
  chosenOptionId: string;
  chosenLabel: string;
  correct: boolean;
  points: number;
}

export interface GameState {
  steps: Step[];
  cursor: number;
  answers: Record<string, AnswerRecord>; // keyed by questionId
  identity: Identity | null;
  sessionId: string;
  startedAt: number | null;
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc -b --noEmit`
Expected: errors only from files that still import the old `PatientProfile`/`SwipeSide` (those are replaced in later tasks). No errors _within_ `types/index.ts`.

---

## Task 2: Cases data

**Files:**

- Create: `src/data/cases.ts`

- [ ] **Step 1: Author the cases (content from spec §4)**

```ts
// src/data/cases.ts
import type { SummitCase } from "../types";

const BREAKOUT = [
  "Break into small groups at your table (2–3).",
  "Answer on a single iPad in small groups.",
  "Answer the follow-up case questions as a table.",
];

export const cases: SummitCase[] = [
  {
    id: "case1",
    patientName: "Emma",
    intro: {
      narrative: [
        "Emma is an 11-year-old girl brought to clinic by her mother for a routine well-child visit before starting middle school. She is healthy, active in soccer, and has no significant past medical history.",
        "During the visit, her mother mentions that Emma's older brother was diagnosed with T1D at age 13 after presenting to the ED in DKA.",
        "Emma currently feels well and denies any symptoms.",
      ],
      breakout: BREAKOUT,
    },
    questions: [
      {
        id: "c1q1",
        prompt: "Should she be tested for type 1 diabetes now?",
        context: [
          "11-year-old girl presenting for a routine well-child visit before starting middle school",
          "Family history of T1D (older brother)",
          "Currently feels well and denies any symptoms of diabetes.",
        ],
        options: [
          { id: "yes", label: "Yes" },
          { id: "no", label: "No" },
        ],
        correctOptionId: "yes",
      },
      {
        id: "c1q2",
        prompt: "How would you test Emma for diabetes?",
        options: [
          { id: "fpg", label: "Fasting glucose" },
          { id: "a1c", label: "HbA1c" },
          { id: "aab", label: "Islet autoantibodies" },
        ],
        correctOptionId: "aab",
      },
      {
        id: "c1q3",
        prompt: "What is the most likely interpretation of Emma's results?",
        context: [
          "Emma undergoes screening through a T1D screening program",
          "Autoantibody results: GAD-65 (+), IA-2 (+), Insulin (−), ZnT8 (−)",
          "Glycemic parameters: Fasting glucose = 92 mg/dL, HbA1c = 5.3%",
        ],
        options: [
          { id: "none", label: "No evidence of T1D" },
          { id: "s1", label: "Stage 1 T1D" },
          { id: "s2", label: "Stage 2 T1D" },
          { id: "s3", label: "Stage 3 T1D" },
        ],
        correctOptionId: "s1",
      },
    ],
    discussion: {
      context: [
        "Emma undergoes repeat testing",
        "2-hr OGTT = 145 mg/dL, HbA1c 5.8%",
        "She remains asymptomatic",
      ],
      prompts: [
        "How would you counsel her family about the meaning of these results?",
        "How should the management evolve now based on these results?",
      ],
    },
  },
  {
    id: "case2",
    patientName: "James",
    intro: {
      narrative: [
        "34-year-old elementary school teacher.",
        "Mother was diagnosed with T1D in her 40s (initially diagnosed as T2D). After her diagnosis was clarified, James enrolled in TrialNet 2 years ago.",
        "Initial screening results (from 2 years ago): GAD-65 (+), IA-2, IAA & ZnT8 (−).",
        "BMI: 24 kg/m². Exam otherwise unremarkable.",
      ],
      breakout: BREAKOUT,
    },
    questions: [
      {
        id: "c2q1",
        prompt: "What best describes James' status?",
        context: [
          "Repeat screening: GAD-65 & ZnT8 positive (2 autoantibodies).",
          "Current labs: Fasting glucose 91 mg/dL, A1C = 5.3%, OGTT 2-hr = 123 mg/dL",
          "Symptoms: None",
        ],
        options: [
          { id: "s1", label: "Stage 1 T1D" },
          { id: "s2", label: "Stage 2 T1D" },
          { id: "s3", label: "Stage 3 T1D" },
          { id: "s4", label: "Stage 4 T1D" },
        ],
        correctOptionId: "s1",
      },
      {
        id: "c2q2",
        prompt: "What would your treatment recommendation be now?",
        context: [
          "Repeat screening: GAD-65 & ZnT8 positive (2 autoantibodies).",
          "Current labs: Fasting glucose 91 mg/dL, A1C = 5.3%, OGTT 2-hr = 123 mg/dL",
          "Symptoms: None",
        ],
        options: [
          {
            id: "insulin",
            label: "Start basal insulin to preserve beta cell function",
          },
          {
            id: "monitor",
            label: "Structured monitoring for signs and symptoms of diabetes",
          },
          { id: "teplizumab", label: "Refer for teplizumab now" },
        ],
        correctOptionId: "monitor",
      },
      {
        id: "c2q3",
        prompt: "What best describes James' status now?",
        context: [
          "Repeat antibodies confirm GAD65 and ZnT8A.",
          "Current labs: Fasting glucose 108 mg/dL; HbA1C 5.9%; 2-hr OGTT 174 mg/dL",
          "Symptoms: increased fatigue but no other symptoms reported",
        ],
        options: [
          { id: "s1", label: "Stage 1 T1D" },
          { id: "s2", label: "Stage 2 T1D" },
          { id: "s3", label: "Stage 3 T1D" },
          { id: "s4", label: "Stage 4 T1D" },
        ],
        correctOptionId: "s2",
      },
    ],
    discussion: {
      context: [
        "Repeat antibodies confirm GAD65 and ZnT8A.",
        "Current labs: Fasting glucose 108 mg/dL; HbA1C 5.9%; 2-hr OGTT 174 mg/dL",
        "Symptoms: increased fatigue but no other symptoms reported",
      ],
      prompts: [
        "How would you counsel James about the meaning of these results?",
        "How should the management evolve now based on these results?",
      ],
    },
  },
];
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc -b --noEmit` — expect no errors from `src/data/cases.ts`.

---

## Task 3: Scoring utilities (TDD)

**Files:**

- Create: `src/game/scoring.ts`
- Test: `src/game/scoring.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/game/scoring.test.ts
import { describe, it, expect } from "vitest";
import { questionWeight, scoreCase, scoreTotal } from "./scoring";
import { cases } from "../data/cases";
import type { AnswerRecord } from "../types";

function answer(
  q: { id: string; correctOptionId: string },
  caseId: string,
  points: number,
  correct = true,
): AnswerRecord {
  return {
    questionId: q.id,
    caseId,
    chosenOptionId: correct ? q.correctOptionId : "wrong",
    chosenLabel: "x",
    correct,
    points: correct ? points : 0,
  };
}

describe("questionWeight", () => {
  it("defaults to optionCount * 50", () => {
    expect(questionWeight(cases[0].questions[0])).toBe(100); // 2 options
    expect(questionWeight(cases[0].questions[1])).toBe(150); // 3
    expect(questionWeight(cases[1].questions[0])).toBe(250); // 5
  });
  it("honors an explicit weight override", () => {
    expect(questionWeight({ ...cases[0].questions[0], weight: 999 })).toBe(999);
  });
});

describe("scoreCase", () => {
  it("sums points + correct count for answered questions", () => {
    const c = cases[0];
    const answers: Record<string, AnswerRecord> = {
      c1q1: answer(c.questions[0], "case1", 100),
      c1q2: answer(c.questions[1], "case1", 150, false), // wrong
      c1q3: answer(c.questions[2], "case1", 200),
    };
    expect(scoreCase(c, answers)).toEqual({ correct: 2, total: 3, score: 300 });
  });
  it("treats unanswered questions as zero", () => {
    expect(scoreCase(cases[0], {})).toEqual({ correct: 0, total: 3, score: 0 });
  });
});

describe("scoreTotal", () => {
  it("sums all cases", () => {
    const answers: Record<string, AnswerRecord> = {
      c1q1: answer(cases[0].questions[0], "case1", 100),
      c2q1: answer(cases[1].questions[0], "case2", 250),
    };
    expect(scoreTotal(cases, answers)).toEqual({
      correct: 2,
      total: 6,
      score: 350,
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- scoring` — Expected: FAIL ("questionWeight is not a function").

- [ ] **Step 3: Implement**

```ts
// src/game/scoring.ts
import type { AnswerRecord, CaseQuestion, SummitCase } from "../types";

export function questionWeight(q: CaseQuestion): number {
  return q.weight ?? q.options.length * 50;
}

export interface ScoreLine {
  correct: number;
  total: number;
  score: number;
}

export function scoreCase(
  c: SummitCase,
  answers: Record<string, AnswerRecord>,
): ScoreLine {
  let correct = 0;
  let score = 0;
  for (const q of c.questions) {
    const a = answers[q.id];
    if (a?.correct) {
      correct += 1;
      score += a.points;
    }
  }
  return { correct, total: c.questions.length, score };
}

export function scoreTotal(
  cases: SummitCase[],
  answers: Record<string, AnswerRecord>,
): ScoreLine {
  return cases.reduce<ScoreLine>(
    (acc, c) => {
      const line = scoreCase(c, answers);
      return {
        correct: acc.correct + line.correct,
        total: acc.total + line.total,
        score: acc.score + line.score,
      };
    },
    { correct: 0, total: 0, score: 0 },
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- scoring` — Expected: PASS.

---

## Task 4: Step-list builder (TDD)

**Files:**

- Create: `src/game/steps.ts`
- Test: `src/game/steps.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/game/steps.test.ts
import { describe, it, expect } from "vitest";
import { buildSteps } from "./steps";
import { cases } from "../data/cases";

describe("buildSteps", () => {
  const steps = buildSteps(cases);

  it("starts with home and ends with summary", () => {
    expect(steps[0]).toEqual({ kind: "home" });
    expect(steps[steps.length - 1]).toEqual({ kind: "summary" });
  });

  it("lays out intro → 3 questions → discussion per case in order", () => {
    // home + (intro + 3q + discussion) * 2 + summary = 1 + 5 + 5 + 1 = 12
    expect(steps).toHaveLength(12);
    expect(steps[1]).toEqual({ kind: "intro", caseIndex: 0 });
    expect(steps[2]).toEqual({
      kind: "question",
      caseIndex: 0,
      questionIndex: 0,
    });
    expect(steps[4]).toEqual({
      kind: "question",
      caseIndex: 0,
      questionIndex: 2,
    });
    expect(steps[5]).toEqual({ kind: "discussion", caseIndex: 0 });
    expect(steps[6]).toEqual({ kind: "intro", caseIndex: 1 });
    expect(steps[10]).toEqual({ kind: "discussion", caseIndex: 1 });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- steps` — Expected: FAIL ("buildSteps is not a function").

- [ ] **Step 3: Implement**

```ts
// src/game/steps.ts
import type { Step, SummitCase } from "../types";

export function buildSteps(cases: SummitCase[]): Step[] {
  const steps: Step[] = [{ kind: "home" }];
  cases.forEach((c, caseIndex) => {
    steps.push({ kind: "intro", caseIndex });
    c.questions.forEach((_, questionIndex) =>
      steps.push({ kind: "question", caseIndex, questionIndex }),
    );
    steps.push({ kind: "discussion", caseIndex });
  });
  steps.push({ kind: "summary" });
  return steps;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- steps` — Expected: PASS.

---

## Task 5: Reducer + GameContext (TDD for reducer)

**Files:**

- Replace: `src/context/GameContext.tsx`
- Create: `src/context/GameContext.test.ts`

- [ ] **Step 1: Write the failing reducer test**

```ts
// src/context/GameContext.test.ts
import { describe, it, expect } from "vitest";
import { gameReducer, makeInitialState } from "./GameContext";
import { cases } from "../data/cases";

function start() {
  return makeInitialState(cases);
}

describe("gameReducer", () => {
  it("initial state is on the home step with no answers", () => {
    const s = start();
    expect(s.steps[s.cursor]).toEqual({ kind: "home" });
    expect(Object.keys(s.answers)).toHaveLength(0);
    expect(s.identity).toBeNull();
  });

  it("SET_IDENTITY stores identity", () => {
    const s = gameReducer(start(), {
      type: "SET_IDENTITY",
      identity: { name: "Table 4", email: "", specialty: "", type: "team" },
    });
    expect(s.identity).toEqual({
      name: "Table 4",
      email: "",
      specialty: "",
      type: "team",
    });
  });

  it("NEXT from home advances to case1 intro and stamps startedAt", () => {
    const s = gameReducer(start(), { type: "NEXT" });
    expect(s.steps[s.cursor]).toEqual({ kind: "intro", caseIndex: 0 });
    expect(s.startedAt).not.toBeNull();
  });

  it("ANSWER records correctness + weighted points for the current question", () => {
    let s = start();
    s = gameReducer(s, { type: "NEXT" }); // intro
    s = gameReducer(s, { type: "NEXT" }); // c1q1
    s = gameReducer(s, { type: "ANSWER", optionId: "yes" }); // correct
    expect(s.answers.c1q1).toMatchObject({
      questionId: "c1q1",
      caseId: "case1",
      chosenOptionId: "yes",
      chosenLabel: "Yes",
      correct: true,
      points: 100,
    });
  });

  it("ANSWER with wrong option scores zero points", () => {
    let s = start();
    s = gameReducer(s, { type: "NEXT" });
    s = gameReducer(s, { type: "NEXT" });
    s = gameReducer(s, { type: "ANSWER", optionId: "no" });
    expect(s.answers.c1q1).toMatchObject({ correct: false, points: 0 });
  });

  it("ANSWER is a no-op when not on a question step", () => {
    const s = start(); // home
    const after = gameReducer(s, { type: "ANSWER", optionId: "yes" });
    expect(after).toBe(s);
  });

  it("ANSWER does not advance the cursor", () => {
    let s = start();
    s = gameReducer(s, { type: "NEXT" });
    s = gameReducer(s, { type: "NEXT" });
    const cursor = s.cursor;
    s = gameReducer(s, { type: "ANSWER", optionId: "yes" });
    expect(s.cursor).toBe(cursor);
  });

  it("NEXT into the summary step stamps a sessionId", () => {
    let s = start();
    // walk to the last step before summary
    while (s.steps[s.cursor].kind !== "summary") {
      s = gameReducer(s, { type: "NEXT" });
    }
    expect(s.steps[s.cursor]).toEqual({ kind: "summary" });
    expect(s.sessionId).not.toBe("");
  });

  it("NEXT does not advance past summary", () => {
    let s = start();
    while (s.steps[s.cursor].kind !== "summary")
      s = gameReducer(s, { type: "NEXT" });
    const at = s.cursor;
    s = gameReducer(s, { type: "NEXT" });
    expect(s.cursor).toBe(at);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- GameContext` — Expected: FAIL ("makeInitialState is not a function").

- [ ] **Step 3: Implement the reducer + provider**

```tsx
// src/context/GameContext.tsx
import { createContext, useContext, useReducer, type ReactNode } from "react";
import type { AnswerRecord, GameState, Identity, SummitCase } from "../types";
import { buildSteps } from "../game/steps";
import { questionWeight } from "../game/scoring";
import { useSessionCompletion } from "../hooks/useSessionCompletion";

export type GameAction =
  | { type: "SET_IDENTITY"; identity: Identity }
  | { type: "ANSWER"; optionId: string }
  | { type: "NEXT" }
  | { type: "RESET" };

export function makeInitialState(cases: SummitCase[]): GameState {
  return {
    steps: buildSteps(cases),
    cursor: 0,
    answers: {},
    identity: null,
    sessionId: "",
    startedAt: null,
  };
}

// Module-scoped so the reducer (pure) can resolve question content by step.
let CASES: SummitCase[] = [];

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_IDENTITY":
      return { ...state, identity: action.identity };

    case "ANSWER": {
      const step = state.steps[state.cursor];
      if (step.kind !== "question") return state;
      const question = CASES[step.caseIndex].questions[step.questionIndex];
      const option = question.options.find((o) => o.id === action.optionId);
      if (!option) return state;
      const correct = option.id === question.correctOptionId;
      const record: AnswerRecord = {
        questionId: question.id,
        caseId: CASES[step.caseIndex].id,
        chosenOptionId: option.id,
        chosenLabel: option.label,
        correct,
        points: correct ? questionWeight(question) : 0,
      };
      return { ...state, answers: { ...state.answers, [question.id]: record } };
    }

    case "NEXT": {
      const current = state.steps[state.cursor];
      if (current.kind === "summary") return state;
      const nextCursor = state.cursor + 1;
      const next = state.steps[nextCursor];
      return {
        ...state,
        cursor: nextCursor,
        startedAt: current.kind === "home" ? Date.now() : state.startedAt,
        sessionId:
          next.kind === "summary" && state.sessionId === ""
            ? crypto.randomUUID()
            : state.sessionId,
      };
    }

    case "RESET":
      return makeInitialState(CASES);

    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  cases: SummitCase[];
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({
  children,
  cases,
}: {
  children: ReactNode;
  cases: SummitCase[];
}) {
  CASES = cases;
  const [state, dispatch] = useReducer(gameReducer, cases, makeInitialState);

  useSessionCompletion(state, cases);

  return (
    <GameContext.Provider value={{ state, dispatch, cases }}>
      {children}
    </GameContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
```

> Note: `CASES` is assigned in both `makeInitialState`-callers and the provider; the reducer reads it for pure question lookup. Tests call `makeInitialState(cases)` which sets nothing — so the test file must also set it. Adjust: export a `setCases` for tests, OR have the reducer accept cases. **Simpler:** in the test, import `cases` and call `gameReducer` after the provider isn't mounted, so set `CASES` explicitly. To keep the reducer pure and testable, add at top of the test file: `import { __setCases } from './GameContext'` and call it. Implement `export function __setCases(c: SummitCase[]) { CASES = c }` and call it in `makeInitialState` too.

- [ ] **Step 3b: Make `CASES` set deterministically**

Add to `GameContext.tsx`:

```ts
// eslint-disable-next-line react-refresh/only-export-components
export function __setCases(c: SummitCase[]): void {
  CASES = c;
}
```

And set it inside `makeInitialState`:

```ts
export function makeInitialState(cases: SummitCase[]): GameState {
  CASES = cases;
  return {
    /* ...as above... */
  };
}
```

(The provider's `CASES = cases` line then becomes redundant but harmless; keep it for clarity.)

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- GameContext` — Expected: PASS. (`makeInitialState(cases)` in `start()` sets `CASES`, so the reducer resolves questions.)

---

## Task 6: Config

**Files:**

- Replace: `src/config.ts`

- [ ] **Step 1: Write config**

```ts
// src/config.ts
// ─── Kiosk scaling (unchanged from ADA — projector insurance) ───
export const KIOSK_DESIGN_W = 1440;
export const KIOSK_DESIGN_H = 810;
export const KIOSK_THRESHOLD_W = 1920;
export const KIOSK_THRESHOLD_H = 1080;

// ─── Scoring ───
export const POINTS_PER_OPTION = 50; // points = optionCount * POINTS_PER_OPTION

// ─── Summit / event ───
// Bump per summit so the leaderboard shows only this event's tables.
export const SUMMIT_ID = "2026-06-23";

// ─── Leaderboard ───
export const LEADERBOARD_PAGE_SIZE = 10;
export const LEADERBOARD_POLL_MS = 10_000;
export const SHOW_LEADERBOARD = true;

// ─── Login info (portal SSO) ───
// Empty → always fall back to the team-name entry screen.
// When the portal team provides the endpoint, set it here and adapt useLoginInfo.
export const LOGIN_INFO_URL = "";

// ─── Drupal Webform API (unchanged transport) ───
const DRUPAL_ORIGIN = import.meta.env.DEV
  ? "/drupal-api"
  : "https://detect-t1d-insightstoaction.impetusdigital.com";

export const DRUPAL_SUBMIT_URL = `${DRUPAL_ORIGIN}/webform_rest/submit?_format=json`;
export const DRUPAL_CSRF_URL = `${DRUPAL_ORIGIN}/session/token`;
export const DRUPAL_RESULTS_URL = `${DRUPAL_ORIGIN}/api/detect_summit_results`;
export const DRUPAL_WEBFORM_ID = "detect_summit_swiper_results";
export const APP_VERSION = "1.0";

// ─── Google Sheets fallback ───
export const SHEETS_WEBHOOK_URL = ""; // set after deploying the Apps Script fallback
```

> The portal team must create the Drupal webform `detect_summit_swiper_results` and the
> results endpoint `/api/detect_summit_results` with the fields in spec §6. Confirm these
> machine names with them before the summit; update here if they differ.

- [ ] **Step 2: Type-check** — `npx tsc -b --noEmit` (errors only from not-yet-updated importers).

---

## Task 7: Leaderboard store + entry shape

**Files:**

- Replace: `src/leaderboard.ts`
- Test: `src/leaderboard.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/leaderboard.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  addLeaderboardEntry,
  getLeaderboard,
  buildLeaderboardEntry,
} from "./leaderboard";

beforeEach(() => localStorage.clear());

describe("leaderboard store", () => {
  it("buildLeaderboardEntry captures score/correct/total/name/sessionId", () => {
    const e = buildLeaderboardEntry("Table 4", "", 950, 5, 6, "sess-1");
    expect(e).toMatchObject({
      username: "Table 4",
      score: 950,
      correct: 5,
      total: 6,
      sessionId: "sess-1",
    });
    expect(e.timestamp).toBeGreaterThan(0);
  });

  it("omits empty email", () => {
    expect(
      buildLeaderboardEntry("Table 4", "", 0, 0, 6, "s").email,
    ).toBeUndefined();
  });

  it("getLeaderboard returns entries sorted by score desc", () => {
    addLeaderboardEntry(buildLeaderboardEntry("A", "", 300, 0, 6, "s1"));
    addLeaderboardEntry(buildLeaderboardEntry("B", "", 900, 0, 6, "s2"));
    expect(getLeaderboard().map((e) => e.username)).toEqual(["B", "A"]);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `npm run test -- leaderboard` → FAIL.

- [ ] **Step 3: Implement**

```ts
// src/leaderboard.ts
export interface LeaderboardEntry {
  username: string;
  email?: string;
  score: number;
  correct: number;
  total: number;
  sessionId: string;
  timestamp: number;
}

const LEADERBOARD_KEY = "detect_leaderboard";

function load(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : [];
  } catch {
    return [];
  }
}

function save(entries: LeaderboardEntry[]): void {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
}

export function getLeaderboard(): LeaderboardEntry[] {
  return load().sort((a, b) => b.score - a.score);
}

export function addLeaderboardEntry(entry: LeaderboardEntry): void {
  save([...load(), entry]);
}

export function buildLeaderboardEntry(
  username: string,
  email: string,
  score: number,
  correct: number,
  total: number,
  sessionId: string,
): LeaderboardEntry {
  return {
    username,
    email: email || undefined,
    score,
    correct,
    total,
    sessionId,
    timestamp: Date.now(),
  };
}
```

- [ ] **Step 4: Run to verify it passes** — `npm run test -- leaderboard` → PASS.

---

## Task 8: Payload builder + submission (TDD for payload)

**Files:**

- Replace: `src/hooks/useWebformSubmission.ts`
- Create: `src/game/payload.ts`
- Test: `src/game/payload.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/game/payload.test.ts
import { describe, it, expect } from "vitest";
import { buildPayload } from "./payload";
import { cases } from "../data/cases";
import type { AnswerRecord, Identity } from "../types";

const identity: Identity = {
  name: "Table 4",
  email: "",
  specialty: "",
  type: "team",
};

function rec(
  qid: string,
  caseId: string,
  label: string,
  correct: boolean,
  points: number,
): AnswerRecord {
  return {
    questionId: qid,
    caseId,
    chosenOptionId: "x",
    chosenLabel: label,
    correct,
    points,
  };
}

describe("buildPayload", () => {
  const answers: Record<string, AnswerRecord> = {
    c1q1: rec("c1q1", "case1", "Yes", true, 100),
    c1q2: rec("c1q2", "case1", "HbA1c", false, 0),
    c1q3: rec("c1q3", "case1", "Stage 1 T1D", true, 200),
    c2q1: rec("c2q1", "case2", "Stage 1 T1D", true, 250),
    c2q2: rec(
      "c2q2",
      "case2",
      "Structured monitoring for signs and symptoms of diabetes",
      true,
      150,
    ),
    c2q3: rec("c2q3", "case2", "Stage 2 T1D", true, 200),
  };
  const p = buildPayload({
    cases,
    answers,
    identity,
    sessionId: "sess-1",
    durationSeconds: 120,
  });

  it("includes identity + summit metadata", () => {
    expect(p.participant_name).toBe("Table 4");
    expect(p.identity_type).toBe("team");
    expect(p.summit_id).toBe("2026-06-23");
    expect(p.session_id).toBe("sess-1");
    expect(p.duration_seconds).toBe(120);
  });

  it("computes per-case and total scores", () => {
    expect(p.case1_correct).toBe(2);
    expect(p.case1_score).toBe(300);
    expect(p.case2_correct).toBe(3);
    expect(p.case2_score).toBe(600);
    expect(p.total_correct).toBe(5);
    expect(p.total_questions).toBe(6);
    expect(p.total_score).toBe(900);
  });

  it("captures each chosen answer label + correctness flag", () => {
    expect(p.c1q2_answer).toBe("HbA1c");
    expect(p.c1q2_correct).toBe("no");
    expect(p.c2q1_answer).toBe("Stage 1 T1D");
    expect(p.c2q1_correct).toBe("yes");
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `npm run test -- payload` → FAIL.

- [ ] **Step 3: Implement the payload builder**

```ts
// src/game/payload.ts
import type { AnswerRecord, Identity, SummitCase } from "../types";
import { scoreCase, scoreTotal } from "./scoring";
import { APP_VERSION, DRUPAL_WEBFORM_ID, SUMMIT_ID } from "../config";

export interface BuildPayloadArgs {
  cases: SummitCase[];
  answers: Record<string, AnswerRecord>;
  identity: Identity | null;
  sessionId: string;
  durationSeconds: number;
}

export type Payload = Record<string, string | number>;

export function buildPayload({
  cases,
  answers,
  identity,
  sessionId,
  durationSeconds,
}: BuildPayloadArgs): Payload {
  const total = scoreTotal(cases, answers);
  const payload: Payload = {
    webform_id: DRUPAL_WEBFORM_ID,
    app_version: APP_VERSION,
    summit_id: SUMMIT_ID,
    session_id: sessionId,
    participant_name: identity?.name ?? "",
    identity_type: identity?.type ?? "team",
    email: identity?.email ?? "",
    specialty: identity?.specialty ?? "",
    submitted_at: new Date().toISOString(),
    duration_seconds: durationSeconds,
    total_correct: total.correct,
    total_questions: total.total,
    total_score: total.score,
  };

  cases.forEach((c, i) => {
    const line = scoreCase(c, answers);
    payload[`case${i + 1}_correct`] = line.correct;
    payload[`case${i + 1}_total`] = line.total;
    payload[`case${i + 1}_score`] = line.score;
    c.questions.forEach((q, qi) => {
      const a = answers[q.id];
      payload[`c${i + 1}q${qi + 1}_answer`] = a?.chosenLabel ?? "";
      payload[`c${i + 1}q${qi + 1}_correct`] = a?.correct ? "yes" : "no";
    });
  });

  return payload;
}
```

- [ ] **Step 4: Run to verify it passes** — `npm run test -- payload` → PASS.

- [ ] **Step 5: Rewrite the submission hook to use it**

```tsx
// src/hooks/useWebformSubmission.ts
import {
  DRUPAL_SUBMIT_URL,
  DRUPAL_CSRF_URL,
  SHEETS_WEBHOOK_URL,
} from "../config";
import {
  buildPayload,
  type BuildPayloadArgs,
  type Payload,
} from "../game/payload";

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch(`${DRUPAL_CSRF_URL}?t=${Date.now()}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`CSRF fetch failed: HTTP ${res.status}`);
  return res.text();
}

async function postToDrupal(payload: Payload): Promise<void> {
  const token = await fetchCsrfToken();
  const res = await fetch(DRUPAL_SUBMIT_URL, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": token },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export function useWebformSubmission() {
  return {
    submitSession: (args: BuildPayloadArgs) => {
      const payload = buildPayload(args);
      if (DRUPAL_SUBMIT_URL) {
        postToDrupal(payload).catch((err) =>
          console.warn("[detect] Drupal submission failed", err),
        );
      }
      if (SHEETS_WEBHOOK_URL) {
        fetch(SHEETS_WEBHOOK_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch((err) =>
          console.error("[detect] Sheet submission failed:", err),
        );
      }
    },
  };
}
```

- [ ] **Step 6: Type-check** — `npx tsc -b --noEmit` (remaining errors only from not-yet-updated files).

---

## Task 9: Remote submissions — filter by summit

**Files:**

- Modify: `src/utils/remoteSubmissions.ts`

- [ ] **Step 1: Update the filter to match both app version and summit**

Replace `matchesVersion` and its uses:

```ts
import {
  DRUPAL_RESULTS_URL,
  SHEETS_WEBHOOK_URL,
  APP_VERSION,
  SUMMIT_ID,
} from "../config";

export interface RawSubmission {
  [key: string]: string | number | undefined;
}

function matches(sub: RawSubmission): boolean {
  return (
    Number(sub.app_version) === Number(APP_VERSION) &&
    String(sub.summit_id) === SUMMIT_ID
  );
}
```

Then in `fetchRemoteSubmissions`, replace both `.filter(matchesVersion)` calls with `.filter(matches)`. Keep the Drupal→Sheets fallback structure identical to the ADA version.

- [ ] **Step 2: Type-check** — `npx tsc -b --noEmit`.

---

## Task 10: Drupal leaderboard hook — adapt fields + polling

**Files:**

- Replace: `src/hooks/useDrupalLeaderboard.ts`

- [ ] **Step 1: Implement with new fields + 10s polling**

```ts
// src/hooks/useDrupalLeaderboard.ts
import { useEffect, useState } from "react";
import type { LeaderboardEntry } from "../leaderboard";
import { getLeaderboard } from "../leaderboard";
import { DRUPAL_RESULTS_URL, LEADERBOARD_POLL_MS } from "../config";
import {
  fetchRemoteSubmissions,
  type RawSubmission,
} from "../utils/remoteSubmissions";

function transform(subs: RawSubmission[]): LeaderboardEntry[] {
  return subs
    .map((sub) => ({
      username: String(sub.participant_name ?? ""),
      email: sub.email ? String(sub.email) : undefined,
      score: Number(sub.total_score),
      correct: Number(sub.total_correct),
      total: Number(sub.total_questions),
      sessionId: String(sub.session_id ?? sub.submitted_at),
      timestamp: new Date(String(sub.submitted_at)).getTime(),
    }))
    .sort((a, b) => b.score - a.score);
}

function attachCurrentPlayer(
  entries: LeaderboardEntry[],
  sessionId: string,
): LeaderboardEntry[] {
  const local = getLeaderboard().find((e) => e.sessionId === sessionId);
  if (!local) return entries;
  const idx = entries.findIndex((e) => e.sessionId === sessionId);
  if (idx >= 0) return entries;
  return [...entries, local].sort((a, b) => b.score - a.score);
}

export function useDrupalLeaderboard(sessionId: string): {
  entries: LeaderboardEntry[];
  loading: boolean;
} {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() =>
    getLeaderboard(),
  );
  const [loading, setLoading] = useState(!!DRUPAL_RESULTS_URL);

  useEffect(() => {
    if (!DRUPAL_RESULTS_URL) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const subs = await fetchRemoteSubmissions();
        if (cancelled || subs.length === 0) return;
        let result = transform(subs);
        if (sessionId) result = attachCurrentPlayer(result, sessionId);
        setEntries(result);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    tick();
    const id = setInterval(tick, LEADERBOARD_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [sessionId]);

  return { entries, loading };
}
```

> Since DETECT submissions carry a real `session_id` (UUID), the current-player match is
> exact — simpler than ADA's timestamp-window heuristic.

- [ ] **Step 2: Type-check** — `npx tsc -b --noEmit`.

---

## Task 11: Session completion (submit + leaderboard on summary)

**Files:**

- Replace: `src/hooks/useSessionCompletion.ts`

- [ ] **Step 1: Implement**

```ts
// src/hooks/useSessionCompletion.ts
import { useEffect, useRef } from "react";
import type { GameState, SummitCase } from "../types";
import { addLeaderboardEntry, buildLeaderboardEntry } from "../leaderboard";
import { scoreTotal } from "../game/scoring";
import { useWebformSubmission } from "./useWebformSubmission";
import { useAnalytics } from "./useAnalytics";

export function useSessionCompletion(
  state: GameState,
  cases: SummitCase[],
): void {
  const { submitSession } = useWebformSubmission();
  const { trackGameCompleted } = useAnalytics();
  const saved = useRef("");

  const onSummary = state.steps[state.cursor]?.kind === "summary";

  useEffect(() => {
    if (
      !onSummary ||
      state.sessionId === "" ||
      state.sessionId === saved.current
    )
      return;
    saved.current = state.sessionId;

    const total = scoreTotal(cases, state.answers);
    const durationSeconds = state.startedAt
      ? Math.round((Date.now() - state.startedAt) / 1000)
      : 0;

    addLeaderboardEntry(
      buildLeaderboardEntry(
        state.identity?.name ?? "Table",
        state.identity?.email ?? "",
        total.score,
        total.correct,
        total.total,
        state.sessionId,
      ),
    );

    submitSession({
      cases,
      answers: state.answers,
      identity: state.identity,
      sessionId: state.sessionId,
      durationSeconds,
    });

    trackGameCompleted({
      score: total.score,
      correct: total.correct,
      total: total.total,
      duration_seconds: durationSeconds,
    });
  }, [
    onSummary,
    state.sessionId,
    state.answers,
    state.identity,
    state.startedAt,
    cases,
    submitSession,
    trackGameCompleted,
  ]);
}
```

- [ ] **Step 2: Update analytics hook**

```ts
// src/hooks/useAnalytics.ts
import ReactGA from "react-ga4";

interface GameCompletedParams {
  score: number;
  correct: number;
  total: number;
  duration_seconds: number;
}

interface QuestionAnsweredParams {
  question_id: string;
  chosen_label: string;
  correct: boolean;
}

export function useAnalytics() {
  return {
    trackGameStarted: (identityType: string) =>
      ReactGA.event("summit_started", { identity_type: identityType }),
    trackGameCompleted: (params: GameCompletedParams) =>
      ReactGA.event("summit_completed", params),
    trackQuestionAnswered: (params: QuestionAnsweredParams) =>
      ReactGA.event("question_answered", params),
  };
}
```

- [ ] **Step 3: Type-check** — `npx tsc -b --noEmit`.

---

## Task 12: Login info hook (identity with team fallback)

**Files:**

- Create: `src/hooks/useLoginInfo.ts`

- [ ] **Step 1: Implement**

```ts
// src/hooks/useLoginInfo.ts
import { useEffect, useState } from "react";
import type { Identity } from "../types";
import { LOGIN_INFO_URL } from "../config";

export type LoginState =
  | { status: "loading" }
  | { status: "user"; identity: Identity } // resolved from portal
  | { status: "fallback" }; // show team-name entry

// Adapter: map the portal's response to our Identity. Update field names when the
// portal team provides the real contract.
function adapt(raw: unknown): Identity | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const first = typeof r.firstName === "string" ? r.firstName : "";
  const last = typeof r.lastName === "string" ? r.lastName : "";
  const display =
    typeof r.displayName === "string"
      ? r.displayName
      : `${first} ${last}`.trim();
  if (!display) return null;
  return {
    name: display,
    email: typeof r.email === "string" ? r.email : "",
    specialty: typeof r.specialty === "string" ? r.specialty : "",
    type: "user",
  };
}

export function useLoginInfo(): LoginState {
  const [state, setState] = useState<LoginState>(() =>
    LOGIN_INFO_URL ? { status: "loading" } : { status: "fallback" },
  );

  useEffect(() => {
    if (!LOGIN_INFO_URL) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(LOGIN_INFO_URL, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const identity = adapt(await res.json());
        if (cancelled) return;
        setState(
          identity ? { status: "user", identity } : { status: "fallback" },
        );
      } catch (err) {
        console.warn(
          "[detect] login info fetch failed; falling back to team entry",
          err,
        );
        if (!cancelled) setState({ status: "fallback" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
```

- [ ] **Step 2: Type-check** — `npx tsc -b --noEmit`.

---

## Task 13: OptionGrid + FeedbackBanner components

**Files:**

- Create: `src/components/question/OptionGrid.tsx`
- Create: `src/components/question/FeedbackBanner.tsx`

- [ ] **Step 1: OptionGrid — layout 2/3/4/5 (5 = 2 over 3), distinct non-green colors, feedback states**

```tsx
// src/components/question/OptionGrid.tsx
import type { AnswerOption } from "../../types";

// Distinct non-green, non-red neutral hues (red/green reserved for feedback).
const PALETTE = [
  "from-blue-500 to-blue-700",
  "from-purple-500 to-purple-700",
  "from-fuchsia-500 to-fuchsia-700", // magenta
  "from-amber-500 to-amber-700",
  "from-cyan-500 to-cyan-700",
];

// Row layout per option count: 5 → [2,3]; 4 → [2,2]; 3 → [3]; 2 → [2]; default single rows.
function rowsFor(n: number): number[] {
  switch (n) {
    case 5:
      return [2, 3];
    case 4:
      return [2, 2];
    case 3:
      return [3];
    case 2:
      return [2];
    default:
      return Array(n).fill(1);
  }
}

interface OptionGridProps {
  options: AnswerOption[];
  correctOptionId: string;
  chosenOptionId: string | null; // null = not answered yet
  onChoose: (optionId: string) => void;
}

export function OptionGrid({
  options,
  correctOptionId,
  chosenOptionId,
  onChoose,
}: OptionGridProps) {
  const answered = chosenOptionId !== null;
  const rows = rowsFor(options.length);

  let idx = 0;
  return (
    <div className="flex w-full flex-col gap-3">
      {rows.map((count, rowIdx) => {
        const slice = options.slice(idx, idx + count);
        idx += count;
        return (
          <div
            key={rowIdx}
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
          >
            {slice.map((opt) => {
              const palette = PALETTE[options.indexOf(opt) % PALETTE.length];
              const isCorrect = opt.id === correctOptionId;
              const isChosen = opt.id === chosenOptionId;
              let stateClass = `bg-gradient-to-b ${palette} text-white`;
              if (answered) {
                if (isCorrect)
                  stateClass =
                    "bg-gradient-to-b from-green-500 to-green-700 text-white ring-2 ring-green-300";
                else if (isChosen)
                  stateClass =
                    "bg-gradient-to-b from-red-500 to-red-700 text-white ring-2 ring-red-300";
                else stateClass = "bg-white/10 text-white/50";
              }
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={answered}
                  onClick={() => onChoose(opt.id)}
                  className={`min-h-20 rounded-2xl px-4 py-4 text-center text-base leading-tight font-bold shadow-lg transition-transform active:scale-[0.98] disabled:active:scale-100 ${stateClass}`}
                >
                  {answered && isCorrect && <span className="mr-1">✓</span>}
                  {answered && isChosen && !isCorrect && (
                    <span className="mr-1">✗</span>
                  )}
                  {opt.label}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: FeedbackBanner — correct/incorrect + Continue (+ optional explanation)**

```tsx
// src/components/question/FeedbackBanner.tsx
interface FeedbackBannerProps {
  correct: boolean;
  points: number;
  explanation?: string;
  isLastQuestionInCase: boolean;
  onContinue: () => void;
}

export function FeedbackBanner({
  correct,
  points,
  explanation,
  isLastQuestionInCase,
  onContinue,
}: FeedbackBannerProps) {
  return (
    <div className="bg-panel/90 flex w-full flex-col items-center gap-3 rounded-2xl p-5 text-center">
      <p
        className={`font-display text-2xl font-extrabold tracking-wide uppercase ${correct ? "text-green-400" : "text-red-400"}`}
      >
        {correct ? `Correct  +${points}` : "Not quite"}
      </p>
      {explanation && (
        <p className="max-w-prose text-sm text-white/80">{explanation}</p>
      )}
      <button
        type="button"
        onClick={onContinue}
        className="from-gold-400 to-gold-600 font-display text-dark-900 rounded-full bg-gradient-to-b px-8 py-2.5 text-sm font-bold tracking-widest uppercase shadow-lg active:scale-[0.98]"
      >
        {isLastQuestionInCase ? "Continue to discussion" : "Continue"}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Build** — `npm run build`. Expected: components compile (App not wired yet → may still error on old imports until Task 17).

---

## Task 14: QuestionScreen

**Files:**

- Create: `src/components/QuestionScreen.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/QuestionScreen.tsx
import { useGame } from "../context/GameContext";
import { useAnalytics } from "../hooks/useAnalytics";
import { OptionGrid } from "./question/OptionGrid";
import { FeedbackBanner } from "./question/FeedbackBanner";
import { DashboardPanel } from "./dashboard/DashboardPanel";

export function QuestionScreen({
  caseIndex,
  questionIndex,
}: {
  caseIndex: number;
  questionIndex: number;
}) {
  const { state, dispatch, cases } = useGame();
  const { trackQuestionAnswered } = useAnalytics();
  const c = cases[caseIndex];
  const q = c.questions[questionIndex];
  const answer = state.answers[q.id] ?? null;
  const isLastInCase = questionIndex === c.questions.length - 1;

  const handleChoose = (optionId: string) => {
    if (state.answers[q.id]) return;
    dispatch({ type: "ANSWER", optionId });
    const opt = q.options.find((o) => o.id === optionId);
    trackQuestionAnswered({
      question_id: q.id,
      chosen_label: opt?.label ?? "",
      correct: opt?.id === q.correctOptionId,
    });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto sm:flex-row sm:overflow-hidden">
      <div className="flex flex-1 flex-col items-center justify-start gap-5 px-5 pt-10 pb-6 sm:justify-center">
        <p className="font-display text-gold-400 text-sm font-bold tracking-[0.2em] uppercase">
          Case {caseIndex + 1}: {c.patientName} · Question {questionIndex + 1}{" "}
          of {c.questions.length}
        </p>

        {q.context && (
          <ul className="bg-panel/70 w-full max-w-2xl space-y-1 rounded-2xl p-4 text-sm text-white/85">
            {q.context.map((line, i) => (
              <li key={i}>• {line}</li>
            ))}
          </ul>
        )}

        <h2 className="font-display max-w-2xl text-center text-2xl font-extrabold text-white">
          {q.prompt}
        </h2>

        <div className="w-full max-w-2xl">
          <OptionGrid
            options={q.options}
            correctOptionId={q.correctOptionId}
            chosenOptionId={answer?.chosenOptionId ?? null}
            onChoose={handleChoose}
          />
        </div>

        {answer && (
          <div className="w-full max-w-2xl">
            <FeedbackBanner
              correct={answer.correct}
              points={answer.points}
              explanation={q.explanation}
              isLastQuestionInCase={isLastInCase}
              onContinue={() => dispatch({ type: "NEXT" })}
            />
          </div>
        )}
      </div>

      <DashboardPanel />
    </div>
  );
}
```

- [ ] **Step 2: Build** — `npm run build` (DashboardPanel built in Task 16).

---

## Task 15: Home, CaseIntro, Discussion, Summary screens + RestartButton

**Files:**

- Create: `src/components/HomeScreen.tsx`, `CaseIntroScreen.tsx`, `DiscussionScreen.tsx`, `SummaryScreen.tsx`, `RestartButton.tsx`

- [ ] **Step 1: RestartButton (corner, confirm, reload)**

```tsx
// src/components/RestartButton.tsx
export function RestartButton() {
  const handleClick = () => {
    if (window.confirm("Start over? This table's progress will be lost.")) {
      window.location.reload();
    }
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Restart"
      className="fixed top-4 right-4 z-50 rounded-full bg-white/10 px-3 py-2 text-xs font-bold tracking-widest text-white/70 uppercase backdrop-blur hover:bg-white/20"
    >
      ↻ Restart
    </button>
  );
}
```

- [ ] **Step 2: HomeScreen (login greeting OR team-name entry + how-to-play)**

```tsx
// src/components/HomeScreen.tsx
import { useState } from "react";
import { useGame } from "../context/GameContext";
import { useLoginInfo } from "../hooks/useLoginInfo";
import { useAnalytics } from "../hooks/useAnalytics";

export function HomeScreen() {
  const { dispatch } = useGame();
  const login = useLoginInfo();
  const { trackGameStarted } = useAnalytics();
  const [team, setTeam] = useState("");

  const begin = (type: "user" | "team") => {
    if (login.status === "user") {
      dispatch({ type: "SET_IDENTITY", identity: login.identity });
    } else {
      dispatch({
        type: "SET_IDENTITY",
        identity: {
          name: team.trim() || "Table",
          email: "",
          specialty: "",
          type: "team",
        },
      });
    }
    trackGameStarted(type);
    dispatch({ type: "NEXT" });
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 px-6 text-center">
      <h1 className="font-display text-4xl font-extrabold tracking-wide text-white uppercase sm:text-5xl">
        DETECT Summit Case Challenge
      </h1>

      <div className="max-w-lg space-y-2 text-white/80">
        <p className="font-display text-gold-400 text-lg font-bold tracking-widest uppercase">
          How to play
        </p>
        <p>
          Work through two patient cases as a table. Read each case, then answer
          three questions together on this iPad. Harder questions are worth more
          points — see how your table ranks on the leaderboard.
        </p>
      </div>

      {login.status === "loading" ? (
        <p className="text-white/50">Loading…</p>
      ) : login.status === "user" ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-white">
            Welcome,{" "}
            <span className="text-gold-400 font-bold">
              {login.identity.name}
            </span>
          </p>
          <StartButton onClick={() => begin("user")} />
        </div>
      ) : (
        <div className="flex w-full max-w-sm flex-col items-center gap-4">
          <input
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            placeholder="Enter your table / team name"
            className="focus:ring-gold-400 w-full rounded-xl bg-white/10 px-4 py-3 text-center text-white placeholder:text-white/40 focus:ring-2 focus:outline-none"
          />
          <StartButton onClick={() => begin("team")} />
        </div>
      )}
    </div>
  );
}

function StartButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="from-gold-400 to-gold-600 font-display text-dark-900 rounded-full bg-gradient-to-b px-12 py-3 text-lg font-bold tracking-widest uppercase shadow-lg active:scale-[0.98]"
    >
      Start
    </button>
  );
}
```

- [ ] **Step 3: CaseIntroScreen (narrative + breakout, Continue)**

```tsx
// src/components/CaseIntroScreen.tsx
import { useGame } from "../context/GameContext";

export function CaseIntroScreen({ caseIndex }: { caseIndex: number }) {
  const { dispatch, cases } = useGame();
  const c = cases[caseIndex];
  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-display text-gold-400 text-sm font-bold tracking-[0.2em] uppercase">
        Case {caseIndex + 1}: {c.patientName}
      </p>
      <div className="space-y-3 text-left text-white/90">
        {c.intro.narrative.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
      <div className="bg-panel/70 w-full rounded-2xl p-4 text-left">
        <p className="font-display mb-2 text-sm font-bold tracking-widest text-white/60 uppercase">
          At your table
        </p>
        <ul className="space-y-1 text-sm text-white/85">
          {c.intro.breakout.map((line, i) => (
            <li key={i}>• {line}</li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={() => dispatch({ type: "NEXT" })}
        className="from-gold-400 to-gold-600 font-display text-dark-900 rounded-full bg-gradient-to-b px-10 py-3 text-base font-bold tracking-widest uppercase shadow-lg active:scale-[0.98]"
      >
        Begin Case {caseIndex + 1}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: DiscussionScreen (prompts + Continue)**

```tsx
// src/components/DiscussionScreen.tsx
import { useGame } from "../context/GameContext";

export function DiscussionScreen({ caseIndex }: { caseIndex: number }) {
  const { dispatch, cases, state } = useGame();
  const c = cases[caseIndex];
  const isLastCase = caseIndex === cases.length - 1;
  const d = c.discussion;
  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-display text-gold-400 text-sm font-bold tracking-[0.2em] uppercase">
        Case {caseIndex + 1}: {c.patientName} · Open Discussion
      </p>
      {d.context && (
        <ul className="bg-panel/70 w-full space-y-1 rounded-2xl p-4 text-left text-sm text-white/85">
          {d.context.map((line, i) => (
            <li key={i}>• {line}</li>
          ))}
        </ul>
      )}
      <div className="space-y-4">
        {d.prompts.map((p, i) => (
          <p key={i} className="font-display text-xl font-bold text-white">
            {p}
          </p>
        ))}
      </div>
      <p className="text-sm text-white/50">
        Discuss as a table, then continue when you're ready.
      </p>
      <button
        type="button"
        onClick={() => dispatch({ type: "NEXT" })}
        className="from-gold-400 to-gold-600 font-display text-dark-900 rounded-full bg-gradient-to-b px-10 py-3 text-base font-bold tracking-widest uppercase shadow-lg active:scale-[0.98]"
      >
        {isLastCase ? "See your results" : "Continue to Case 2"}
      </button>
      {/* state referenced to keep hook stable across renders */}
      <span className="hidden">{state.cursor}</span>
    </div>
  );
}
```

- [ ] **Step 5: SummaryScreen (per-case + total, leaderboard via DashboardPanel)**

```tsx
// src/components/SummaryScreen.tsx
import { useGame } from "../context/GameContext";
import { scoreCase, scoreTotal } from "../game/scoring";
import { DashboardPanel } from "./dashboard/DashboardPanel";

export function SummaryScreen() {
  const { state, cases } = useGame();
  const total = scoreTotal(cases, state.answers);

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto sm:flex-row sm:overflow-hidden">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
        <h1 className="font-display text-4xl font-extrabold tracking-wide text-white uppercase">
          Results
        </h1>
        <p className="text-white/70">{state.identity?.name}</p>

        <div className="flex flex-wrap justify-center gap-6">
          {cases.map((c, i) => {
            const line = scoreCase(c, state.answers);
            return (
              <div key={c.id} className="bg-panel/70 rounded-2xl px-8 py-5">
                <p className="font-display text-gold-400 text-sm font-bold tracking-widest uppercase">
                  Case {i + 1}: {c.patientName}
                </p>
                <p className="font-display text-3xl font-extrabold text-white">
                  {line.correct}/{line.total}
                </p>
                <p className="text-sm text-white/60">{line.score} pts</p>
              </div>
            );
          })}
        </div>

        <div className="from-gold-400/20 rounded-2xl bg-gradient-to-b to-transparent px-10 py-6">
          <p className="font-display text-gold-400 text-sm font-bold tracking-widest uppercase">
            Total Score
          </p>
          <p className="font-display text-5xl font-extrabold text-white">
            {total.score}
          </p>
          <p className="text-sm text-white/60">
            {total.correct}/{total.total} correct
          </p>
        </div>
      </div>

      <DashboardPanel />
    </div>
  );
}
```

- [ ] **Step 6: Build** — `npm run build` (DashboardPanel in Task 16, App in Task 17).

---

## Task 16: Dashboard — SessionScore + Leaderboard, drop Community Insights

**Files:**

- Replace: `src/components/dashboard/DashboardPanel.tsx`
- Create: `src/components/dashboard/SessionScore.tsx`
- Create/Move: `src/components/dashboard/LeaderboardPanel.tsx`

- [ ] **Step 1: SessionScore (live running score from answers)**

```tsx
// src/components/dashboard/SessionScore.tsx
import { useGame } from "../../context/GameContext";
import { scoreTotal } from "../../game/scoring";

export function SessionScore() {
  const { state, cases } = useGame();
  const { correct, score } = scoreTotal(cases, state.answers);
  const answered = Object.keys(state.answers).length;
  return (
    <div className="border-purple-accent/30 shrink-0 border-b p-4 text-center">
      <p className="font-display mb-3 text-xl font-extrabold tracking-[0.2em] text-white uppercase">
        This Session
      </p>
      <div className="flex justify-around">
        <Stat value={score} label="Points" />
        <Stat value={`${correct}/${answered}`} label="Correct" />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-4xl font-extrabold text-white">{value}</p>
      <p className="font-display text-sm font-bold tracking-[0.2em] text-white/60 uppercase">
        {label}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: LeaderboardPanel (adapt from ADA — uses sessionId, new fields)**

```tsx
// src/components/dashboard/LeaderboardPanel.tsx
import { useGame } from "../../context/GameContext";
import { useDrupalLeaderboard } from "../../hooks/useDrupalLeaderboard";

export function LeaderboardPanel() {
  const { state } = useGame();
  const { entries, loading } = useDrupalLeaderboard(state.sessionId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-purple-accent/30 bg-panel/95 flex h-12 shrink-0 items-center justify-center border-b">
        <p className="font-display text-lg font-extrabold tracking-[0.18em] text-white uppercase">
          Leaderboard
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <p className="py-8 text-center text-sm text-white/30">
            Loading scores…
          </p>
        ) : entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/30">
            No scores yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.slice(0, 20).map((entry, i) => {
              const isCurrent = entry.sessionId === state.sessionId;
              return (
                <div
                  key={entry.sessionId || `${entry.timestamp}-${i}`}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ${isCurrent ? "bg-gold-400/10 ring-gold-400/40 ring-1" : "bg-white/5"}`}
                >
                  <span className="w-6 shrink-0 text-sm font-black text-white/35">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-sm font-semibold text-white">
                    {entry.username}
                    {isCurrent && (
                      <span className="text-gold-400 ml-2 text-xs font-bold">
                        YOU
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm font-black text-white">
                    {entry.score}
                  </span>
                  <span className="shrink-0 text-xs text-white/35">
                    {entry.correct}/{entry.total}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: DashboardPanel (SessionScore + Leaderboard under it; flag-gated)**

```tsx
// src/components/dashboard/DashboardPanel.tsx
import { SessionScore } from "./SessionScore";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { SHOW_LEADERBOARD } from "../../config";

export function DashboardPanel() {
  return (
    <div className="border-purple-accent/25 bg-panel/80 flex w-full flex-col border-l sm:w-80 sm:shrink-0 lg:w-96">
      <SessionScore />
      {SHOW_LEADERBOARD && <LeaderboardPanel />}
    </div>
  );
}
```

- [ ] **Step 4: Build** — `npm run build` (App in Task 17).

---

## Task 17: App router + provider wiring

**Files:**

- Replace: `src/App.tsx`

- [ ] **Step 1: Implement the step-kind router**

```tsx
// src/App.tsx
import { Component, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { GameProvider, useGame } from "./context/GameContext";
import { cases } from "./data/cases";
import { HomeScreen } from "./components/HomeScreen";
import { CaseIntroScreen } from "./components/CaseIntroScreen";
import { QuestionScreen } from "./components/QuestionScreen";
import { DiscussionScreen } from "./components/DiscussionScreen";
import { SummaryScreen } from "./components/SummaryScreen";
import { RestartButton } from "./components/RestartButton";
import { useKioskScale } from "./hooks/useKioskScale";
import { KIOSK_DESIGN_W, KIOSK_DESIGN_H } from "./config";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-white">
          <p className="text-lg font-bold text-gray-900">
            Something went wrong.
          </p>
          <button
            className="rounded-full bg-gray-900 px-8 py-2 text-sm font-bold tracking-widest text-white uppercase"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const transition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 },
};

function Router() {
  const { state } = useGame();
  const step = state.steps[state.cursor];
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${step.kind}-${state.cursor}`}
        className="h-full w-full"
        {...transition}
      >
        {step.kind === "home" && <HomeScreen />}
        {step.kind === "intro" && (
          <CaseIntroScreen caseIndex={step.caseIndex} />
        )}
        {step.kind === "question" && (
          <QuestionScreen
            caseIndex={step.caseIndex}
            questionIndex={step.questionIndex}
          />
        )}
        {step.kind === "discussion" && (
          <DiscussionScreen caseIndex={step.caseIndex} />
        )}
        {step.kind === "summary" && <SummaryScreen />}
      </motion.div>
    </AnimatePresence>
  );
}

function BackgroundVideo() {
  return (
    <video
      className="absolute inset-0 h-full w-full object-cover"
      src="./bg_video.mp4"
      poster="./bg_fallback.jpg"
      autoPlay
      muted
      loop
      playsInline
    />
  );
}

const Content = () => (
  <>
    <BackgroundVideo />
    <div
      className="pointer-events-none absolute inset-0 z-3"
      style={{ background: "var(--gradient-overlay)" }}
      aria-hidden
    />
    <div className="relative z-10 h-full w-full">
      <GameProvider cases={cases}>
        <RestartButton />
        <Router />
      </GameProvider>
    </div>
  </>
);

function App() {
  const scale = useKioskScale();
  if (scale === null) {
    return (
      <ErrorBoundary>
        <div className="relative h-screen w-screen overflow-hidden">
          <Content />
        </div>
      </ErrorBoundary>
    );
  }
  return (
    <ErrorBoundary>
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-black">
        <MotionConfig
          transformPagePoint={(p) => ({ x: p.x / scale, y: p.y / scale })}
        >
          <div
            className="relative shrink-0 origin-center overflow-hidden"
            style={{
              width: KIOSK_DESIGN_W,
              height: KIOSK_DESIGN_H,
              transform: `scale(${scale})`,
            }}
          >
            <Content />
          </div>
        </MotionConfig>
      </div>
    </ErrorBoundary>
  );
}

export default App;
```

- [ ] **Step 2: Build** — `npm run build`. Expected: PASS once old files are deleted (next task).

---

## Task 18: Delete dead ADA files

**Files:** delete the list in "File structure → Delete after wiring."

- [ ] **Step 1: Remove old files**

```bash
git rm src/data/profiles.ts \
  src/components/game/CardStack.tsx src/components/game/SwipeGuide.tsx \
  src/components/game/StreakBanner.tsx src/components/game/ProgressBar.tsx \
  src/components/game/PatientCard.tsx src/components/game/RationaleOverlay.tsx \
  src/components/game/GamePanel.tsx src/components/GameScreen.tsx \
  src/components/AttractScreen.tsx src/components/SummaryView.tsx \
  src/components/SummaryPanel.tsx src/components/dashboard/CommunityInsights.tsx \
  src/components/dashboard/SessionStats.tsx src/utils/sessionStats.ts \
  src/utils/shuffle.ts src/utils/statsStorage.ts src/hooks/useCommunityStats.ts
```

(If a file was already deleted/renamed, drop it from the command.)

- [ ] **Step 2: Grep for stale imports**

Run: `grep -rn "profiles\|PatientProfile\|SwipeSide\|CardStack\|useCommunityStats\|sessionStats\|statsStorage\|SummaryView\|AttractScreen" src/`
Expected: no matches (other than the new files' own unrelated text). Fix any.

- [ ] **Step 3: Full verification**

Run: `npm run test` — Expected: all suites pass.
Run: `npm run lint` — Expected: no errors.
Run: `npm run build` — Expected: clean build.

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`, open at iPad-landscape width (~1194×834 via devtools device toolbar). Walk the full flow: team name → Case 1 intro → 3 questions (verify 2/3/4-option layouts, green ✓/red ✗ feedback, points) → discussion → Case 2 (verify the 5-option 2+3 layout on Q1) → discussion → summary (per-case + total). Confirm the Restart button reloads after confirm. With `DRUPAL_RESULTS_URL` reachable, confirm the leaderboard shows "YOU"; otherwise it falls back to the local entry.

---

## Self-review notes

- **Spec coverage:** model (T1), cases content (T2), scoring/weights (T3), step flow (T4), reducer/state (T5), config/SUMMIT_ID/flags (T6), leaderboard store (T7), payload (T8), summit-filter (T9), polling leaderboard (T10), completion/submit (T11), identity+fallback (T12), option grid incl. 5→2+3 & no-green/feedback colors (T13), question screen w/ immediate feedback (T14), home/intro/discussion/summary + restart (T15), dashboard w/ leaderboard under score, Community Insights dropped (T16), router + brand video/theme + kiosk (T17), cleanup (T18). All §2 decisions mapped.
- **Login endpoint** is intentionally stubbed (`LOGIN_INFO_URL=''`) → team fallback; only `useLoginInfo.adapt` changes when the contract arrives.
- **Drupal field/endpoint names** (`detect_summit_swiper_results`, `/api/detect_summit_results`) must be confirmed with the portal team and the Sheets fallback URL set before 6/23.

```

```
