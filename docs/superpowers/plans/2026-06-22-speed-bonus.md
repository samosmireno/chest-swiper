# Speed Bonus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reward faster *correct* answers with a small per-question bonus that breaks score ties, without ever letting a faster table outrank a more-accurate one.

**Architecture:** Capture per-question elapsed time in the game reducer (which already calls `Date.now()`), convert it to a bounded bonus via a pure `speedBonus(weight, elapsedMs)` function, store the bonus on each `AnswerRecord`, and fold it into the existing `ScoreLine.score`. Because the live leaderboard sorts on the Drupal `total_score` field, folding the bonus into score makes the leaderboard order correctly with **no Drupal schema change**.

**Tech Stack:** React 19 + TypeScript, Vite, Vitest.

## Global Constraints

- Coefficient: bonus = `0.2 × questionWeight` at full speed → max **20 / 30 / 40** per question (100/150/200-pt questions).
- Max bonus per case = **90 < 100** (the smallest question weight) → accuracy always wins; speed only re-orders teams tied on correctness.
- Decay: full bonus for elapsed ≤ **10 000 ms**; linear down to **0 at 60 000 ms** (tuned to ~20–30s expected answer times so the pack lands on the slope, not the ceiling).
- `AnswerRecord.points` stays the clean base weight; the bonus is a separate `speedBonus` field.
- `total_correct` stays the clean accuracy field. Only `total_score` / `case{n}_score` absorb the bonus. **No new Drupal columns.**
- Do not commit unless explicitly asked.

---

### Task 1: Speed-bonus constants + pure formula

**Files:**
- Modify: `src/config.ts` (Scoring section, after line 8)
- Modify: `src/game/scoring.ts`
- Test: `src/game/scoring.test.ts`

**Interfaces:**
- Produces: `speedBonus(weight: number, elapsedMs: number): number` from `src/game/scoring.ts`; constants `SPEED_BONUS_COEFF`, `SPEED_FULL_MS`, `SPEED_ZERO_MS` from `src/config.ts`.

- [ ] **Step 1: Add constants to `src/config.ts`** under the Scoring section:

```ts
// ─── Scoring ───
export const POINTS_PER_OPTION = 50; // points = optionCount * POINTS_PER_OPTION

// Speed bonus: faster *correct* answers earn up to SPEED_BONUS_COEFF * weight.
// Max total per case (0.2 * (100+150+200) = 90) stays under the smallest
// question weight (100), so accuracy can never be overturned by speed.
export const SPEED_BONUS_COEFF = 0.2;
export const SPEED_FULL_MS = 30_000; // answered within this → full bonus
export const SPEED_ZERO_MS = 180_000; // answered after this → zero bonus
```

- [ ] **Step 2: Write failing tests** in `src/game/scoring.test.ts` (add import + describe block):

```ts
import { questionWeight, scoreCase, scoreTotal, speedBonus } from './scoring'

describe('speedBonus', () => {
  it('awards full 0.2*weight at or under the grace window', () => {
    expect(speedBonus(100, 0)).toBe(20)
    expect(speedBonus(150, 30_000)).toBe(30)
    expect(speedBonus(200, 10_000)).toBe(40)
  })
  it('awards zero at or past the zero point', () => {
    expect(speedBonus(200, 180_000)).toBe(0)
    expect(speedBonus(200, 999_999)).toBe(0)
  })
  it('decays linearly between grace and zero', () => {
    // halfway through the 30s..180s ramp (105s) → half of full
    expect(speedBonus(200, 105_000)).toBe(20)
    expect(speedBonus(100, 105_000)).toBe(10)
  })
})
```

- [ ] **Step 3: Run tests, verify they fail**

Run: `npx vitest run src/game/scoring.test.ts`
Expected: FAIL — `speedBonus is not a function`.

- [ ] **Step 4: Implement `speedBonus` in `src/game/scoring.ts`** (add import + function near top):

```ts
import { SPEED_BONUS_COEFF, SPEED_FULL_MS, SPEED_ZERO_MS } from '../config'

// Time→points decay: full bonus inside the grace window, linear to zero at the
// cap. Bounded so the per-case total can never overturn an accuracy difference.
export function speedBonus(weight: number, elapsedMs: number): number {
  const factor =
    elapsedMs <= SPEED_FULL_MS
      ? 1
      : elapsedMs >= SPEED_ZERO_MS
        ? 0
        : (SPEED_ZERO_MS - elapsedMs) / (SPEED_ZERO_MS - SPEED_FULL_MS)
  return Math.round(SPEED_BONUS_COEFF * weight * factor)
}
```

- [ ] **Step 5: Run tests, verify they pass**

Run: `npx vitest run src/game/scoring.test.ts`
Expected: PASS.

---

### Task 2: Carry the bonus through types + scoring

**Files:**
- Modify: `src/types/index.ts` (`AnswerRecord` ~line 52, `GameState` ~line 61)
- Modify: `src/game/scoring.ts` (`ScoreLine`, `scoreCase`, `scoreTotal`)
- Test: `src/game/scoring.test.ts`

**Interfaces:**
- Consumes: `speedBonus` (Task 1).
- Produces: `AnswerRecord.speedBonus: number`; `GameState.questionShownAt: number | null`; `ScoreLine` gains `bonus: number`; `ScoreLine.score` = base + bonus.

- [ ] **Step 1: Extend types in `src/types/index.ts`.** Add to `AnswerRecord`:

```ts
export interface AnswerRecord {
  questionId: string
  caseId: string
  chosenOptionId: string
  chosenLabel: string
  correct: boolean
  points: number      // base weight only (clean multiple of 50)
  speedBonus: number  // 0 when incorrect
}
```

Add to `GameState` (after `startedAt`):

```ts
  startedAt: number | null
  questionShownAt: number | null   // when the current question step became active
```

- [ ] **Step 2: Update failing tests in `src/game/scoring.test.ts`.** Update the `answer()` helper to include `speedBonus`, and assert `bonus` in `ScoreLine`:

```ts
function answer(
  q: { id: string; correctOptionId: string },
  caseId: string,
  points: number,
  correct = true,
  bonus = 0,
): AnswerRecord {
  return {
    questionId: q.id,
    caseId,
    chosenOptionId: correct ? q.correctOptionId : 'wrong',
    chosenLabel: 'x',
    correct,
    points: correct ? points : 0,
    speedBonus: correct ? bonus : 0,
  }
}
```

Then update the `scoreCase` "sums" test to include a bonus and check the new shape:

```ts
  it('sums base points + speed bonus + correct count', () => {
    const c = cases[0]
    const answers: Record<string, AnswerRecord> = {
      c1q1: answer(c.questions[0], 'case1', 100, true, 15),
      c1q2: answer(c.questions[1], 'case1', 150, false),
      c1q3: answer(c.questions[2], 'case1', 200, true, 40),
    }
    expect(scoreCase(c, answers)).toEqual({ correct: 2, total: 3, score: 355, bonus: 55 })
  })
```

Update the "treats unanswered as zero" expectation to `{ correct: 0, total: 3, score: 0, bonus: 0 }`, and the `scoreTotal` expectation to include `bonus: 0`.

- [ ] **Step 3: Run tests, verify they fail**

Run: `npx vitest run src/game/scoring.test.ts`
Expected: FAIL — `bonus` missing on result / type errors.

- [ ] **Step 4: Update `src/game/scoring.ts`.** New `ScoreLine` and accumulation:

```ts
export interface ScoreLine {
  correct: number
  total: number
  score: number   // base + speed bonus
  bonus: number   // speed bonus portion only (for display breakdown)
}

export function scoreCase(c: SummitCase, answers: Record<string, AnswerRecord>): ScoreLine {
  let correct = 0
  let score = 0
  let bonus = 0
  for (const q of c.questions) {
    const a = answers[q.id]
    if (a?.correct) {
      correct += 1
      score += a.points + a.speedBonus
      bonus += a.speedBonus
    }
  }
  return { correct, total: c.questions.length, score, bonus }
}

export function scoreTotal(cases: SummitCase[], answers: Record<string, AnswerRecord>): ScoreLine {
  return cases.reduce<ScoreLine>(
    (acc, c) => {
      const line = scoreCase(c, answers)
      return {
        correct: acc.correct + line.correct,
        total: acc.total + line.total,
        score: acc.score + line.score,
        bonus: acc.bonus + line.bonus,
      }
    },
    { correct: 0, total: 0, score: 0, bonus: 0 },
  )
}
```

- [ ] **Step 5: Run tests, verify they pass**

Run: `npx vitest run src/game/scoring.test.ts`
Expected: PASS.

---

### Task 3: Capture timing + bonus in the reducer

**Files:**
- Modify: `src/game/machine.ts`
- Test: `src/game/machine.test.ts`

**Interfaces:**
- Consumes: `speedBonus`, `questionWeight` (scoring); `GameState.questionShownAt`, `AnswerRecord.speedBonus` (Task 2).
- Produces: `ANSWER` stamps `speedBonus`; `NEXT` into a question stamps `questionShownAt`.

- [ ] **Step 1: Write failing tests in `src/game/machine.test.ts`.** Add:

```ts
  it('NEXT into a question stamps questionShownAt', () => {
    const s = reducer(start(), { type: 'NEXT' }) // → c1q1
    expect(s.questionShownAt).not.toBeNull()
  })

  it('ANSWER awards full speed bonus when answered immediately', () => {
    let s = start()
    s = reducer(s, { type: 'NEXT' }) // c1q1, weight 100
    s = reducer(s, { type: 'ANSWER', optionId: 'yes' })
    expect(s.answers.c1q1).toMatchObject({ correct: true, points: 100, speedBonus: 20 })
  })

  it('wrong ANSWER earns no speed bonus', () => {
    let s = start()
    s = reducer(s, { type: 'NEXT' })
    s = reducer(s, { type: 'ANSWER', optionId: 'no' })
    expect(s.answers.c1q1).toMatchObject({ correct: false, points: 0, speedBonus: 0 })
  })
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run src/game/machine.test.ts`
Expected: FAIL — `speedBonus` undefined / `questionShownAt` undefined.

- [ ] **Step 3: Update `src/game/machine.ts`.**

Import: `import { questionWeight, speedBonus } from './scoring'`.

In `makeInitialState`, add `questionShownAt: null,` to the returned object.

In the `ANSWER` case, compute elapsed + bonus:

```ts
      case 'ANSWER': {
        const step = state.steps[state.cursor]
        if (step.kind !== 'question') return state
        const question = cases[step.caseIndex].questions[step.questionIndex]
        const option = question.options.find((o) => o.id === action.optionId)
        if (!option) return state
        const correct = option.id === question.correctOptionId
        const elapsedMs = state.questionShownAt != null ? Date.now() - state.questionShownAt : Infinity
        const record: AnswerRecord = {
          questionId: question.id,
          caseId: cases[step.caseIndex].id,
          chosenOptionId: option.id,
          chosenLabel: option.label,
          correct,
          points: correct ? questionWeight(question) : 0,
          speedBonus: correct ? speedBonus(questionWeight(question), elapsedMs) : 0,
        }
        return { ...state, answers: { ...state.answers, [question.id]: record } }
      }
```

In the `NEXT` case, stamp `questionShownAt` when the destination is a question (add alongside the existing `startedAt`/`sessionId` fields in the returned object):

```ts
          questionShownAt: next.kind === 'question' ? Date.now() : state.questionShownAt,
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npx vitest run src/game/machine.test.ts`
Expected: PASS (existing `points: 100` assertions still hold).

---

### Task 4: Show the bonus to players

**Files:**
- Modify: `src/components/question/FeedbackBanner.tsx`
- Modify: `src/components/QuestionScreen.tsx:68-72`
- Modify: `src/components/SummaryScreen.tsx`

**Interfaces:**
- Consumes: `AnswerRecord.speedBonus`, `ScoreLine.bonus` (Task 2).

- [ ] **Step 1: Add `speedBonus` to `FeedbackBanner`.** Update props + verdict block:

```tsx
interface FeedbackBannerProps {
  correct: boolean
  points: number
  speedBonus: number
  isLastInCase: boolean
  onContinue: () => void
}

export function FeedbackBanner({ correct, points, speedBonus, isLastInCase, onContinue }: FeedbackBannerProps) {
```

Replace the single verdict `<p>` with verdict + optional speed line:

```tsx
      <div className="flex flex-col items-center gap-1">
        <p
          className={`font-display text-3xl font-extrabold tracking-wide uppercase ${
            correct ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {correct ? `Correct +${points}` : 'Not quite'}
        </p>
        {correct && speedBonus > 0 && (
          <p className="font-display text-gold-400 text-lg font-bold tracking-wide">
            +{speedBonus} speed
          </p>
        )}
      </div>
```

- [ ] **Step 2: Pass `speedBonus` from `QuestionScreen.tsx`** (the `<FeedbackBanner ... />` at line 67):

```tsx
            <FeedbackBanner
              correct={answer.correct}
              points={answer.points}
              speedBonus={answer.speedBonus}
              isLastInCase={isLastInCase}
              onContinue={() => dispatch({ type: "NEXT" })}
            />
```

- [ ] **Step 3: Break out base + bonus on `SummaryScreen.tsx`.** Below the `{line.score}` number and the correct line, add a bonus line when present:

```tsx
          <p className="font-display text-6xl font-extrabold text-white">
            {line.score}
          </p>
          <p className="text-sm text-white/60">
            {line.correct}/{line.total} correct
          </p>
          {line.bonus > 0 && (
            <p className="text-gold-400 text-sm font-semibold">
              {line.score - line.bonus} base + {line.bonus} speed
            </p>
          )}
```

- [ ] **Step 4: Type-check + full test run**

Run: `npm run build && npx vitest run`
Expected: build succeeds; all tests pass. Fix any other `AnswerRecord` literals the compiler flags (e.g. in `payload.test.ts`, `sessionResult.test.ts`, `submissions.test.ts`) by adding `speedBonus: 0`.

- [ ] **Step 5: Manual smoke (optional)**

Run: `npm run dev`, play a case answering quickly vs. slowly; confirm `+N speed` appears on correct answers, the summary shows the base/speed breakdown, and the leaderboard total reflects the bonus.

---

## Notes / out of scope
- Reload mid-case already wipes answers today; speed timing rides along — not hardened.
- Idle/slow tables simply earn ~0 bonus (by design).
- No new Drupal columns; raw per-question times are not emitted.
