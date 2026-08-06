# Per-Case Sessions & Per-Case Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the game from "one session plays all cases, cumulative leaderboard" into "one session plays one case chosen up front, with a leaderboard scoped to that case."

**Architecture:** A "session" becomes a single case. Case selection lives *above* the game machine: a new `LandingScreen` (team name + a button per case) captures the team name and the chosen case, then `App` mounts `GameProvider cases={[selectedCase]}`. The machine is already parameterized by a case set, so it needs no structural change beyond dropping its `home` step and accepting an initial identity. The leaderboard is one physical store partitioned by `case_id`: the payload is keyed by the real `case.id` (compatible with the existing `case1_*`/`case2_*` webform fields), and the read filters rows to the current case — trusting `case_id` if present, else inferring it from which `caseN_*` columns are populated.

**Tech Stack:** React 19 + TypeScript, Vite, Vitest, Tailwind, framer-motion.

## Global Constraints

- **Do NOT commit unless the user explicitly asks.** (Standing user instruction — overrides any "commit" step.) Each task ends at green tests / green build instead.
- **No new dependencies.**
- Logic changes are TDD (Vitest). UI changes are verified with `npm run build` (`tsc -b && vite build`) + `npm run lint` + manual `npm run dev`, since the repo has no component tests.
- Run a single Vitest file with: `npx vitest run <path>`.
- `SUMMIT_ID` stays `"2026-06-23"`. No backend schema changes are required by us; the only *additive* backend ask is a `case_id` field on the webform (the read has an inference fallback so the feature works even without it).
- Identity type stays `"team"` for all on-site play. Empty team name falls back to `"Table"` — no required-name gate.
- Both case buttons are always available (no time-gating). Buttons render one-per-case from the case set, not hardcoded to two.

---

### Task 1: Reshape the game machine to a single-case flow

Drop the `home` step from the generated flow (selection now lives above the machine), stamp `startedAt` when leaving the intro, and let `makeInitialState` accept an initial identity. `{ kind: 'home' }` **stays in the `Step` union** (harmless, avoids cross-task type breakage) — it is simply never emitted.

**Files:**
- Modify: `src/game/steps.ts`
- Modify: `src/game/machine.ts`
- Test: `src/game/steps.test.ts`
- Test: `src/game/machine.test.ts`

**Interfaces:**
- Consumes: `SummitCase`, `Step`, `GameState`, `Identity` from `src/types`.
- Produces:
  - `buildSteps(cases: SummitCase[]): Step[]` — now starts at the first case's `intro` (no `home`), ends at `summary`.
  - `makeInitialState(cases: SummitCase[], identity?: Identity | null): GameState` — `identity` defaults to `null`; `startedAt` is `null` at init.
  - `makeGameReducer(cases)` reducer: `NEXT` stamps `startedAt` on the `intro → question` transition.

- [ ] **Step 1: Update `buildSteps` test to the no-home layout**

Replace the body of `src/game/steps.test.ts` with:

```ts
import { describe, it, expect } from 'vitest'
import { buildSteps } from './steps'
import { cases } from '../data/cases'

describe('buildSteps', () => {
  const steps = buildSteps(cases)

  it('starts with the first case intro and ends with summary', () => {
    expect(steps[0]).toEqual({ kind: 'intro', caseIndex: 0 })
    expect(steps[steps.length - 1]).toEqual({ kind: 'summary' })
  })

  it('lays out intro → 3 questions → discussion per case in order, no home step', () => {
    // (intro + 3q + discussion) * 2 + summary = 5 + 5 + 1 = 11
    expect(steps).toHaveLength(11)
    expect(steps[1]).toEqual({ kind: 'question', caseIndex: 0, questionIndex: 0 })
    expect(steps[3]).toEqual({ kind: 'question', caseIndex: 0, questionIndex: 2 })
    expect(steps[4]).toEqual({ kind: 'discussion', caseIndex: 0 })
    expect(steps[5]).toEqual({ kind: 'intro', caseIndex: 1 })
    expect(steps[9]).toEqual({ kind: 'discussion', caseIndex: 1 })
  })

  it('builds a one-case flow when given a single case', () => {
    const single = buildSteps([cases[1]])
    // intro + 3q + discussion + summary = 6, intro caseIndex is 0 within the set
    expect(single).toHaveLength(6)
    expect(single[0]).toEqual({ kind: 'intro', caseIndex: 0 })
    expect(single[5]).toEqual({ kind: 'summary' })
  })
})
```

- [ ] **Step 2: Run the steps test to verify it fails**

Run: `npx vitest run src/game/steps.test.ts`
Expected: FAIL — `steps[0]` is still `{ kind: 'home' }` and length is 12.

- [ ] **Step 3: Drop `home` from `buildSteps`**

Replace `src/game/steps.ts` with:

```ts
import type { Step, SummitCase } from '../types'

export function buildSteps(cases: SummitCase[]): Step[] {
  const steps: Step[] = []
  cases.forEach((c, caseIndex) => {
    steps.push({ kind: 'intro', caseIndex })
    c.questions.forEach((_, questionIndex) =>
      steps.push({ kind: 'question', caseIndex, questionIndex }),
    )
    steps.push({ kind: 'discussion', caseIndex })
  })
  steps.push({ kind: 'summary' })
  return steps
}
```

- [ ] **Step 4: Run the steps test to verify it passes**

Run: `npx vitest run src/game/steps.test.ts`
Expected: PASS

- [ ] **Step 5: Update the machine test for the no-home flow + initial identity**

Replace `src/game/machine.test.ts` with:

```ts
import { describe, it, expect } from 'vitest'
import { makeGameReducer, makeInitialState } from './machine'
import { cases } from '../data/cases'
import type { Identity } from '../types'

const reducer = makeGameReducer(cases)

function start() {
  return makeInitialState(cases)
}

describe('gameReducer', () => {
  it('initial state is on the first case intro with no answers', () => {
    const s = start()
    expect(s.steps[s.cursor]).toEqual({ kind: 'intro', caseIndex: 0 })
    expect(Object.keys(s.answers)).toHaveLength(0)
    expect(s.identity).toBeNull()
    expect(s.startedAt).toBeNull()
  })

  it('makeInitialState accepts an initial identity', () => {
    const identity: Identity = { name: 'Table 4', email: '', specialty: '', type: 'team' }
    expect(makeInitialState(cases, identity).identity).toEqual(identity)
  })

  it('SET_IDENTITY stores identity', () => {
    const s = reducer(start(), {
      type: 'SET_IDENTITY',
      identity: { name: 'Table 4', email: '', specialty: '', type: 'team' },
    })
    expect(s.identity).toEqual({ name: 'Table 4', email: '', specialty: '', type: 'team' })
  })

  it('NEXT from the intro advances to the first question and stamps startedAt', () => {
    const s = reducer(start(), { type: 'NEXT' })
    expect(s.steps[s.cursor]).toEqual({ kind: 'question', caseIndex: 0, questionIndex: 0 })
    expect(s.startedAt).not.toBeNull()
  })

  it('ANSWER records correctness + weighted points for the current question', () => {
    let s = start()
    s = reducer(s, { type: 'NEXT' }) // c1q1
    s = reducer(s, { type: 'ANSWER', optionId: 'yes' }) // correct
    expect(s.answers.c1q1).toMatchObject({
      questionId: 'c1q1',
      caseId: 'case1',
      chosenOptionId: 'yes',
      chosenLabel: 'Yes',
      correct: true,
      points: 100,
    })
  })

  it('ANSWER with wrong option scores zero points', () => {
    let s = start()
    s = reducer(s, { type: 'NEXT' })
    s = reducer(s, { type: 'ANSWER', optionId: 'no' })
    expect(s.answers.c1q1).toMatchObject({ correct: false, points: 0 })
  })

  it('ANSWER is a no-op when not on a question step', () => {
    const s = start() // intro
    const after = reducer(s, { type: 'ANSWER', optionId: 'yes' })
    expect(after).toBe(s)
  })

  it('ANSWER does not advance the cursor', () => {
    let s = start()
    s = reducer(s, { type: 'NEXT' })
    const cursor = s.cursor
    s = reducer(s, { type: 'ANSWER', optionId: 'yes' })
    expect(s.cursor).toBe(cursor)
  })

  it('NEXT into the summary step stamps a sessionId', () => {
    let s = start()
    while (s.steps[s.cursor].kind !== 'summary') s = reducer(s, { type: 'NEXT' })
    expect(s.steps[s.cursor]).toEqual({ kind: 'summary' })
    expect(s.sessionId).not.toBe('')
  })

  it('NEXT does not advance past summary', () => {
    let s = start()
    while (s.steps[s.cursor].kind !== 'summary') s = reducer(s, { type: 'NEXT' })
    const at = s.cursor
    s = reducer(s, { type: 'NEXT' })
    expect(s.cursor).toBe(at)
  })
})
```

- [ ] **Step 6: Run the machine test to verify it fails**

Run: `npx vitest run src/game/machine.test.ts`
Expected: FAIL — `makeInitialState` ignores the identity arg and the initial step is still `home`.

- [ ] **Step 7: Update `makeInitialState` and the `NEXT` transition**

In `src/game/machine.ts`, replace `makeInitialState` (lines 11-20) with:

```ts
export function makeInitialState(cases: SummitCase[], identity: Identity | null = null): GameState {
  return {
    steps: buildSteps(cases),
    cursor: 0,
    answers: {},
    identity,
    sessionId: '',
    startedAt: null,
  }
}
```

In the same file, in the `NEXT` case, change the `startedAt` line from:

```ts
          startedAt: current.kind === 'home' ? Date.now() : state.startedAt,
```

to:

```ts
          startedAt:
            current.kind === 'intro' && state.startedAt === null ? Date.now() : state.startedAt,
```

(Leave `RESET` and the rest of the reducer unchanged.)

- [ ] **Step 8: Run both tests to verify they pass**

Run: `npx vitest run src/game/steps.test.ts src/game/machine.test.ts`
Expected: PASS

- [ ] **Step 9: Run the full suite + typecheck to confirm nothing else broke**

Run: `npx vitest run && npm run build`
Expected: All tests PASS; build succeeds (`home` remains a valid—if unused—`Step` member, so `App.tsx`/`RestartButton.tsx` still typecheck).

---

### Task 2: Key the payload by real case id + emit `case_id`

Stop keying cases positionally (`case${i+1}`). Derive the field number from the real `case.id` (`"case1"` → `1`) so a single-case Case 2 session emits `case2_*` / `c2q*` (matching the existing webform fields), and add a top-level `case_id`.

**Files:**
- Modify: `src/game/payload.ts`
- Test: `src/game/payload.test.ts`

**Interfaces:**
- Consumes: `SessionResult` (`.cases: CaseResult[]`, each with `caseId`, `line`, `answers`) from `src/game/sessionResult`.
- Produces: `buildPayload(result: SessionResult): Payload` — payload now includes `case_id: string`; case columns are keyed by the case's real number.

- [ ] **Step 1: Add a failing single-case payload test**

Append this `describe` block to `src/game/payload.test.ts`:

```ts
describe('buildPayload — single-case session', () => {
  const NOW = 1_700_000_000_000
  const case2Answers: Record<string, AnswerRecord> = {
    c2q1: rec('c2q1', 'case2', 'Stage 1 T1D', true, 250),
    c2q2: rec('c2q2', 'case2', 'Structured monitoring for signs and symptoms of diabetes', true, 150),
    c2q3: rec('c2q3', 'case2', 'Stage 2 T1D', true, 200),
  }
  const state = {
    ...makeInitialState([cases[1]], identity),
    answers: case2Answers,
    sessionId: 'sess-2',
    startedAt: NOW - 60_000,
  }
  const p = buildPayload(summarizeSession(state, [cases[1]], NOW))

  it('tags the row with the real case_id', () => {
    expect(p.case_id).toBe('case2')
  })

  it('emits case2_* columns and no case1_* columns', () => {
    expect(p.case2_correct).toBe(3)
    expect(p.case2_score).toBe(600)
    expect(p.c2q1_answer).toBe('Stage 1 T1D')
    expect(p.c2q1_correct).toBe('yes')
    expect(p.case1_score).toBeUndefined()
    expect(p.c1q1_answer).toBeUndefined()
  })

  it('total_* equals the single case score', () => {
    expect(p.total_score).toBe(600)
    expect(p.total_correct).toBe(3)
    expect(p.total_questions).toBe(3)
  })
})
```

- [ ] **Step 2: Run the payload test to verify it fails**

Run: `npx vitest run src/game/payload.test.ts`
Expected: FAIL — `p.case_id` is `undefined` and the single case is emitted as `case1_*` (positional index 0).

- [ ] **Step 3: Key columns by real case number + add `case_id`**

Replace `src/game/payload.ts` with:

```ts
import type { SessionResult } from './sessionResult'
import { APP_VERSION, DRUPAL_WEBFORM_ID, SUMMIT_ID } from '../config'

export type Payload = Record<string, string | number>

// Case ids are "case1"/"case2"; the webform columns (case1_*, c1q*, …) use the
// same numbering, so derive the column number from the id rather than array
// position. A single-case Case 2 session then writes case2_* / c2q*, never case1_*.
function caseNumber(caseId: string): number {
  const m = caseId.match(/(\d+)$/)
  return m ? Number(m[1]) : 0
}

export function buildPayload(result: SessionResult): Payload {
  const { identity, sessionId, completedAt, durationSeconds, total, cases } = result
  const payload: Payload = {
    webform_id: DRUPAL_WEBFORM_ID,
    app_version: APP_VERSION,
    summit_id: SUMMIT_ID,
    case_id: cases[0]?.caseId ?? '',
    session_id: sessionId,
    participant_name: identity?.name ?? '',
    identity_type: identity?.type ?? 'team',
    email: identity?.email ?? '',
    specialty: identity?.specialty ?? '',
    submitted_at: new Date(completedAt).toISOString(),
    duration_seconds: durationSeconds,
    total_correct: total.correct,
    total_questions: total.total,
    total_score: total.score,
  }

  cases.forEach((c) => {
    const n = caseNumber(c.caseId)
    payload[`case${n}_correct`] = c.line.correct
    payload[`case${n}_total`] = c.line.total
    payload[`case${n}_score`] = c.line.score
    c.answers.forEach((a, qi) => {
      payload[`c${n}q${qi + 1}_answer`] = a.chosenLabel
      payload[`c${n}q${qi + 1}_correct`] = a.correct ? 'yes' : 'no'
    })
  })

  return payload
}
```

- [ ] **Step 4: Run the payload test to verify it passes**

Run: `npx vitest run src/game/payload.test.ts`
Expected: PASS — both the original multi-case block (still emits `case1_*`/`case2_*`, `case_id` = `"case1"`) and the new single-case block pass.

---

### Task 3: Tag leaderboard entries with `caseId`

Each local leaderboard entry records which case it belongs to, and `getLeaderboard` can filter by case.

**Files:**
- Modify: `src/leaderboard.ts`
- Test: `src/leaderboard.test.ts`

**Interfaces:**
- Consumes: `SessionResult` (`.cases[0].caseId`).
- Produces:
  - `LeaderboardEntry` gains `caseId: string`.
  - `getLeaderboard(caseId?: string): LeaderboardEntry[]` — when `caseId` is given, returns only that case's entries, sorted by score desc.
  - `buildLeaderboardEntry(result)` sets `caseId` from `result.cases[0]?.caseId ?? ''`.

- [ ] **Step 1: Add failing tests for per-case entries**

Append to `src/leaderboard.test.ts` (inside the existing `describe('leaderboard store', …)` block, before its closing `})`):

```ts
  it('buildLeaderboardEntry records the caseId from the first case', () => {
    const e = buildLeaderboardEntry(
      result({ cases: [{ caseId: 'case2', line: { correct: 0, total: 0, score: 0 }, answers: [] }] }),
    )
    expect(e.caseId).toBe('case2')
  })

  it('getLeaderboard(caseId) returns only that case, sorted by score desc', () => {
    const make = (sessionId: string, caseId: string, score: number) =>
      buildLeaderboardEntry(
        result({
          sessionId,
          total: { correct: 0, total: 3, score },
          cases: [{ caseId, line: { correct: 0, total: 3, score }, answers: [] }],
          identity: { name: sessionId, email: '', specialty: '', type: 'team' },
        }),
      )
    addLeaderboardEntry(make('a', 'case1', 100))
    addLeaderboardEntry(make('b', 'case2', 900))
    addLeaderboardEntry(make('c', 'case1', 300))
    expect(getLeaderboard('case1').map((e) => e.username)).toEqual(['c', 'a'])
    expect(getLeaderboard('case2').map((e) => e.username)).toEqual(['b'])
  })
```

- [ ] **Step 2: Run the leaderboard test to verify it fails**

Run: `npx vitest run src/leaderboard.test.ts`
Expected: FAIL — `e.caseId` is `undefined` and `getLeaderboard` takes no argument.

- [ ] **Step 3: Add `caseId` to the entry, filter in `getLeaderboard`**

In `src/leaderboard.ts`:

Add `caseId` to the interface (after `email?: string`):

```ts
export interface LeaderboardEntry {
  username: string
  email?: string
  caseId: string
  score: number
  correct: number
  total: number
  sessionId: string
  timestamp: number
}
```

Replace `getLeaderboard` with:

```ts
export function getLeaderboard(caseId?: string): LeaderboardEntry[] {
  const entries = load()
  return entries
    .filter((e) => !caseId || e.caseId === caseId)
    .sort((a, b) => b.score - a.score)
}
```

In `buildLeaderboardEntry`, add the `caseId` field to the returned object (after `email`):

```ts
    caseId: result.cases[0]?.caseId ?? '',
```

- [ ] **Step 4: Run the leaderboard test to verify it passes**

Run: `npx vitest run src/leaderboard.test.ts`
Expected: PASS — the existing `getLeaderboard()` (no-arg) test still returns all entries.

---

### Task 4: Determine a submission's case (`rowCase`) — trust then infer

Add the helper the read path uses to attribute a raw submission row to a case: trust `case_id` when present, otherwise infer it from which single `caseN_total` column is populated. Cumulative legacy rows (≥2 totals) return `null` and get filtered out.

**Files:**
- Modify: `src/submissions.ts`
- Test: `src/submissions.test.ts`

**Interfaces:**
- Consumes: `RawSubmission` (`Record<string, string | number | undefined>`).
- Produces: `rowCase(sub: RawSubmission): string | null`.

- [ ] **Step 1: Add a failing `rowCase` test block**

Append to `src/submissions.test.ts`:

First, add `rowCase` to the **existing** import from `./submissions` at the top of the file (merge — do not add a second import statement, which ESLint would flag):

```ts
import {
  matchesSubmission,
  makeSubmissionGateway,
  rowCase,
  type RawSubmission,
  type SubmissionTransport,
} from './submissions'
```

Then append the test block:

```ts
describe('rowCase', () => {
  it('trusts an explicit case_id', () => {
    expect(rowCase({ case_id: 'case2', case1_total: 3 })).toBe('case2')
  })

  it('infers case2 from a populated case2_total when case1_total is absent', () => {
    expect(rowCase({ case2_total: 3, case2_score: 600 })).toBe('case2')
  })

  it('infers case1 likewise', () => {
    expect(rowCase({ case1_total: 3, case1_score: 300 })).toBe('case1')
  })

  it('returns null for a cumulative legacy row with both totals', () => {
    expect(rowCase({ case1_total: 3, case2_total: 3 })).toBeNull()
  })

  it('returns null when no case column is populated', () => {
    expect(rowCase({ session_id: 'x' })).toBeNull()
  })
})
```

(Note: `describe`, `expect`, `it` are already imported at the top of the file. Add only the `rowCase` import shown — or fold it into the existing import from `./submissions` if you prefer; keep one import per symbol.)

- [ ] **Step 2: Run the submissions test to verify it fails**

Run: `npx vitest run src/submissions.test.ts`
Expected: FAIL — `rowCase` is not exported.

- [ ] **Step 3: Implement and export `rowCase`**

In `src/submissions.ts`, add this exported function just after the `matchesSubmission` function (around line 44):

```ts
// Attribute a raw submission row to a case. Trust an explicit case_id; otherwise
// infer it from which single caseN_total column is populated (single-case rows).
// Cumulative legacy rows (two+ totals) are ambiguous and return null — they are
// filtered out of every per-case board.
export function rowCase(sub: RawSubmission): string | null {
  const explicit = sub.case_id != null && String(sub.case_id) !== '' ? String(sub.case_id) : ''
  if (explicit) return explicit
  const played: string[] = []
  for (const key of Object.keys(sub)) {
    const m = key.match(/^case(\d+)_total$/)
    if (m && sub[key] != null && String(sub[key]) !== '') played.push(`case${m[1]}`)
  }
  return played.length === 1 ? played[0] : null
}
```

- [ ] **Step 4: Run the submissions test to verify it passes**

Run: `npx vitest run src/submissions.test.ts`
Expected: PASS (all existing gateway/`matchesSubmission` tests plus the new `rowCase` block).

---

### Task 5: Filter the live leaderboard to the current case

Wire the case scope through the read: the panel passes the current session's case id, and `useDrupalLeaderboard` keeps only rows whose `rowCase` matches.

**Files:**
- Modify: `src/hooks/useDrupalLeaderboard.ts`
- Modify: `src/components/dashboard/LeaderboardPanel.tsx`

**Interfaces:**
- Consumes: `rowCase` (Task 4), `getLeaderboard(caseId)` (Task 3), `useGame()` (`.cases`, `.state.sessionId`).
- Produces: `useDrupalLeaderboard(sessionId: string, caseId: string): { entries; loading }` — entries are scoped to `caseId` (remote + local).

- [ ] **Step 1: Scope the hook by case**

In `src/hooks/useDrupalLeaderboard.ts`:

Update the `rowCase` import line (it currently imports `submissions, type RawSubmission`):

```ts
import { submissions, rowCase, type RawSubmission } from '../submissions'
```

Replace `attachCurrentPlayer` and the hook with:

```ts
function attachCurrentPlayer(
  entries: LeaderboardEntry[],
  sessionId: string,
  caseId: string,
): LeaderboardEntry[] {
  const local = getLeaderboard(caseId).find((e) => e.sessionId === sessionId)
  if (!local) return entries
  const idx = entries.findIndex((e) => e.sessionId === sessionId)
  if (idx >= 0) return entries
  return [...entries, local].sort((a, b) => b.score - a.score)
}

export function useDrupalLeaderboard(
  sessionId: string,
  caseId: string,
): { entries: LeaderboardEntry[]; loading: boolean } {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => getLeaderboard(caseId))
  const [loading, setLoading] = useState(!!DRUPAL_RESULTS_URL)

  useEffect(() => {
    if (!DRUPAL_RESULTS_URL) return
    let cancelled = false

    const tick = async () => {
      try {
        const subs = (await submissions.fetchResults()).filter((s) => rowCase(s) === caseId)
        if (cancelled || subs.length === 0) return
        let result = transform(subs)
        if (sessionId) result = attachCurrentPlayer(result, sessionId, caseId)
        setEntries(result)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    tick()
    const id = setInterval(tick, LEADERBOARD_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [sessionId, caseId])

  return { entries, loading }
}
```

- [ ] **Step 2: Pass the current case id from the panel**

In `src/components/dashboard/LeaderboardPanel.tsx`, change the `useGame` destructure and hook call near the top of the component:

```ts
  const { state, cases } = useGame();
  const caseId = cases[0]?.id ?? "";
  const { entries, loading } = useDrupalLeaderboard(state.sessionId, caseId);
```

- [ ] **Step 3: Typecheck + lint + full suite**

Run: `npm run build && npm run lint && npx vitest run`
Expected: build succeeds, lint clean, all tests pass.

---

### Task 6: URL helper to read the preselected case

A tiny pure helper that maps `?case=1` / `?case=2` (also tolerant of `?case=case2`) to a case id, for deep-link preselection on the landing screen.

**Files:**
- Create: `src/url.ts`
- Test: `src/url.test.ts`

**Interfaces:**
- Produces: `caseIdFromParam(search: string): string | null`.

- [ ] **Step 1: Write the failing test**

Create `src/url.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { caseIdFromParam } from './url'

describe('caseIdFromParam', () => {
  it('maps ?case=1 to case1', () => {
    expect(caseIdFromParam('?case=1')).toBe('case1')
  })

  it('maps ?case=2 to case2', () => {
    expect(caseIdFromParam('?case=2')).toBe('case2')
  })

  it('tolerates ?case=case2', () => {
    expect(caseIdFromParam('?case=case2')).toBe('case2')
  })

  it('returns null when absent', () => {
    expect(caseIdFromParam('')).toBeNull()
    expect(caseIdFromParam('?foo=bar')).toBeNull()
  })

  it('returns null for a non-numeric value', () => {
    expect(caseIdFromParam('?case=abc')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/url.test.ts`
Expected: FAIL — module `./url` does not exist.

- [ ] **Step 3: Implement the helper**

Create `src/url.ts`:

```ts
// Map the ?case= query param to a case id for deep-link preselection.
// Accepts "1" / "2" (or "case2") → "case1" / "case2". Anything else → null.
export function caseIdFromParam(search: string): string | null {
  const raw = new URLSearchParams(search).get('case')
  if (!raw) return null
  const m = raw.match(/(\d+)$/)
  return m ? `case${m[1]}` : null
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/url.test.ts`
Expected: PASS

---

### Task 7: Build the `LandingScreen` (team name + case picker)

A pre-game screen, rendered above the machine, that always shows the team-name field and a button per case. Tapping a case starts a session for that case. The deep-linked case (if any) is visually emphasized. Borrows the existing `HomeScreen` styling.

**Files:**
- Create: `src/components/LandingScreen.tsx`

**Interfaces:**
- Consumes: `SummitCase`, `Identity` (`src/types`), `useAnalytics` (`trackGameStarted`).
- Produces:

```ts
export function LandingScreen(props: {
  cases: SummitCase[]
  preselectedCaseId: string | null
  onStart: (selectedCase: SummitCase, identity: Identity) => void
}): JSX.Element
```

  - `onStart` is called with the chosen case and an identity built as
    `{ name: team.trim() || 'Table', email: '', specialty: '', type: 'team' }`.

- [ ] **Step 1: Create the component**

Create `src/components/LandingScreen.tsx`:

```tsx
import { useState } from "react";
import type { Identity, SummitCase } from "../types";
import { useAnalytics } from "../hooks/useAnalytics";

export function LandingScreen({
  cases,
  preselectedCaseId,
  onStart,
}: {
  cases: SummitCase[];
  preselectedCaseId: string | null;
  onStart: (selectedCase: SummitCase, identity: Identity) => void;
}) {
  const { trackGameStarted } = useAnalytics();
  const [team, setTeam] = useState("");

  const begin = (selectedCase: SummitCase) => {
    const identity: Identity = {
      name: team.trim() || "Table",
      email: "",
      specialty: "",
      type: "team",
    };
    trackGameStarted("team");
    onStart(selectedCase, identity);
  };

  const steps = [
    "Enter your team name",
    "Pick your case, then read it as a group",
    "Swipe the patient card toward your answer, or tap an option button \n(↑ ← → ↓)",
    "See how your group ranks on the leaderboard",
  ];

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 py-10">
      <div
        className="bg-panel/90 border-purple-accent/40 flex w-full max-w-md flex-col items-center gap-6 rounded-3xl border px-7 py-8 text-center backdrop-blur-lg sm:gap-7"
        style={{
          boxShadow:
            "0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
        }}
      >
        <h1
          className="font-display text-3xl leading-tight font-black text-white uppercase sm:text-4xl"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}
        >
          DETECT Summit
          <br />
          Case Challenge
        </h1>

        {/* How-to-play */}
        <div className="w-full rounded-2xl px-4 py-2 text-left">
          <p className="text-gold-500 mb-2.5 text-sm font-semibold tracking-[0.18em] uppercase">
            How to Play
          </p>
          <div className="flex flex-col gap-2.5">
            {steps.map((text, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="bg-purple-accent/30 border-purple-accent/60 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold text-purple-300">
                  {i + 1}
                </span>
                <span className="text-sm leading-snug whitespace-pre-line text-white/75">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Team name (always shown) */}
        <input
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          placeholder="Enter your team name"
          autoComplete="off"
          className="border-purple-accent/55 w-full rounded-full border-[1.5px] bg-white/10 px-5 py-3 text-center text-sm text-white transition-colors duration-150 outline-none placeholder:text-white/45"
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(155,48,255,1)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(155,48,255,0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(155,48,255,0.55)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />

        {/* Case picker */}
        <div className="flex w-full flex-col gap-3">
          {cases.map((c, i) => {
            const emphasized = c.id === preselectedCaseId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => begin(c)}
                className={`font-display flex w-full cursor-pointer flex-col items-center rounded-full px-8 py-3 font-black tracking-[0.18em] text-white uppercase transition-transform active:scale-95 ${
                  emphasized
                    ? "ring-gold-400/70 ring-2"
                    : "ring-purple-accent/40 ring-1"
                }`}
                style={{
                  background: emphasized
                    ? "var(--gradient-btn-gold)"
                    : "rgba(155,48,255,0.18)",
                  boxShadow: emphasized
                    ? "0 0 24px rgba(245,200,66,0.5), 0 4px 12px rgba(0,0,0,0.4)"
                    : "0 4px 12px rgba(0,0,0,0.4)",
                }}
              >
                <span className="text-[0.95rem]">Case {i + 1}</span>
                <span className="text-xs font-semibold tracking-[0.12em] text-white/70">
                  {c.patientName}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck the new component (it is not wired in yet)**

Run: `npm run build`
Expected: build succeeds. `HomeScreen` is still imported by `App.tsx` at this point — that is fine; it is removed in Task 8.

---

### Task 8: Wire selection above the provider in `App`

`Content` holds the `selection` state. Before a case is chosen it renders `LandingScreen`; after, it mounts `GameProvider cases={[selectedCase]}` with the captured identity. `GameProvider` forwards the initial identity into the machine. The `Router` loses its dead `home` branch and `HomeScreen` is deleted.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/context/GameContext.tsx`
- Delete: `src/components/HomeScreen.tsx`

**Interfaces:**
- Consumes: `LandingScreen` (Task 7), `caseIdFromParam` (Task 6), `makeInitialState(cases, identity)` (Task 1), `Identity`, `SummitCase`.
- Produces: `GameProvider` accepts an optional `initialIdentity?: Identity | null` prop.

- [ ] **Step 1: Forward an initial identity through `GameProvider`**

Replace `src/context/GameContext.tsx` with:

```tsx
import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import type { GameState, Identity, SummitCase } from '../types'
import { makeGameReducer, makeInitialState, type GameAction } from '../game/machine'
import { useSessionCompletion } from '../hooks/useSessionCompletion'

interface GameContextValue {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  cases: SummitCase[]
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({
  children,
  cases,
  initialIdentity = null,
}: {
  children: ReactNode
  cases: SummitCase[]
  initialIdentity?: Identity | null
}) {
  const reducer = useMemo(() => makeGameReducer(cases), [cases])
  const [state, dispatch] = useReducer(reducer, null, () => makeInitialState(cases, initialIdentity))

  useSessionCompletion(state, cases)

  return <GameContext.Provider value={{ state, dispatch, cases }}>{children}</GameContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
```

- [ ] **Step 2: Restructure `App` — landing vs. game**

In `src/App.tsx`:

Replace the imports of `HomeScreen` with `LandingScreen` and add the others. Change:

```ts
import { HomeScreen } from './components/HomeScreen'
```

to:

```ts
import { LandingScreen } from './components/LandingScreen'
import { caseIdFromParam } from './url'
import type { Identity, SummitCase } from './types'
```

Also add `useMemo` and `useState` to the existing React import at the top:

```ts
import { Component, useMemo, useState, type ReactNode } from 'react'
```

In the `Router` function, delete the `home` line:

```ts
        {step.kind === 'home' && <HomeScreen />}
```

Replace the `Content` arrow component with:

```tsx
type Selection = { case: SummitCase; identity: Identity }

function Content() {
  const [selection, setSelection] = useState<Selection | null>(null)
  const preselectedCaseId = useMemo(() => caseIdFromParam(window.location.search), [])

  return (
    <>
      <BackgroundVideo />
      <div
        className="pointer-events-none absolute inset-0 z-3"
        style={{ background: 'var(--gradient-overlay)' }}
        aria-hidden
      />
      <div className="relative z-10 h-full w-full">
        {selection === null ? (
          <LandingScreen
            cases={cases}
            preselectedCaseId={preselectedCaseId}
            onStart={(selectedCase, identity) => setSelection({ case: selectedCase, identity })}
          />
        ) : (
          <GameProvider
            key={selection.case.id}
            cases={[selection.case]}
            initialIdentity={selection.identity}
          >
            <RestartButton />
            <Router />
          </GameProvider>
        )}
      </div>
    </>
  )
}
```

(`Content` is referenced as `<Content />` in both `App` branches; converting it from a `const` arrow to a function declaration keeps those call sites valid.)

- [ ] **Step 3: Delete the obsolete `HomeScreen`**

Run: `rm src/components/HomeScreen.tsx`

- [ ] **Step 4: Typecheck, lint, and confirm no stragglers reference HomeScreen/home**

Run: `grep -rn "HomeScreen" src; grep -rn "kind === 'home'\|kind === \"home\"" src; npm run build && npm run lint`
Expected: the first `grep` (HomeScreen) prints nothing. The second prints exactly one line — `src/components/RestartButton.tsx` — which is the expected dead guard (see note below). Build + lint clean.

> If `grep` flags `src/components/RestartButton.tsx` (`state.steps[state.cursor].kind === "home"`): that guard is now permanently false (the button shows throughout the case and reloads the page on confirm — the desired re-entry behavior). Leave it; it stays valid because `home` remains in the `Step` union. No change required.

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`
Verify in the browser:
- Landing shows team-name field + Case 1 / Case 2 buttons.
- Loading `/?case=2` emphasizes the Case 2 button.
- Entering a team name and tapping Case 2 starts at Case 2's intro; finishing reaches the summary with a leaderboard.
- The Restart button reloads to the landing; `?case=2` re-emphasizes Case 2.

---

### Task 9: Collapse the summary to a single case

With one case per session the per-case box and the "Total" box are the same number twice. Show one clean score block for the selected case; keep the case-scoped leaderboard panel.

**Files:**
- Modify: `src/components/SummaryScreen.tsx`

**Interfaces:**
- Consumes: `useGame()` (`.cases[0]`, `.state.answers`, `.state.identity`), `scoreCase`, `DashboardPanel`.

- [ ] **Step 1: Rewrite the summary body**

Replace `src/components/SummaryScreen.tsx` with:

```tsx
import { useGame } from "../context/GameContext";
import { scoreCase } from "../game/scoring";
import { DashboardPanel } from "./dashboard/DashboardPanel";

export function SummaryScreen() {
  const { state, cases } = useGame();
  const activeCase = cases[0];
  const line = scoreCase(activeCase, state.answers);

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto sm:flex-row sm:overflow-hidden">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
        <h1 className="font-display text-4xl font-extrabold tracking-wide text-white uppercase">
          Results
        </h1>
        <p className="text-white/70">{state.identity?.name}</p>

        <div className="from-gold-400/20 rounded-2xl bg-linear-to-b to-transparent px-12 py-8">
          <p className="font-display text-gold-400 text-sm font-bold tracking-widest uppercase">
            {activeCase.patientName}
          </p>
          <p className="font-display text-6xl font-extrabold text-white">
            {line.score}
          </p>
          <p className="text-sm text-white/60">
            {line.correct}/{line.total} correct
          </p>
        </div>
      </div>

      <DashboardPanel focusCurrentPlayer />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npm run build && npm run lint`
Expected: clean.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`
Play one case to completion. Confirm the summary shows a single score block (case name + points + correct/total) and the leaderboard panel beside it lists only this case's teams.

---

## Final verification

- [ ] **Run the full test suite + build + lint**

Run: `npx vitest run && npm run build && npm run lint`
Expected: all tests pass, build succeeds, lint clean.

- [ ] **End-to-end manual run**

Run: `npm run dev`, then:
1. Land on `/` → team field + Case 1 / Case 2 buttons.
2. Enter "Table A", tap Case 1 → play through → summary shows Case 1 score + a Case-1-only leaderboard.
3. Reload to `/?case=2` → Case 2 emphasized → enter "Table A", tap Case 2 → play → summary shows a Case-2-only leaderboard (independent of Case 1).
4. Tap Restart mid-case → page reloads to the landing.

---

## Spec coverage check

- Team-name field always shown (even "logged in") → Task 7 (no login gate) + Task 8.
- Case-select entry screen (Case 1 / Case 2) → Task 7.
- Deep links per case (`?case=`) → Task 6 + Task 8 (preselect; refresh-safe).
- One session = one case → Tasks 1, 8.
- Leaderboard shown at the end of each case → Tasks 1, 9 (each case ends in its own summary + panel).
- Per-case leaderboard (split, not cumulative) → Tasks 2 (`case_id` + per-case columns), 3 (local store), 4 (`rowCase`), 5 (read filter).
- Backend-independent (no `case_id` field required) → Task 4 inference fallback.
- No admin/reset button → intentionally omitted (per grilling Q7).
- `SUMMIT_ID` unchanged → Global Constraints.

## Backend dependency (hand to client)

The only additive ask: add a **`case_id`** text field to the `detect_summit_results` webform and include it in the results View. Values are `"case1"` / `"case2"`. If it is not added, the read still partitions correctly via column inference (Task 4) — but confirm the View returns the per-case columns (`case1_total`, `case2_total`, …) rather than aggregating them, since the inference fallback relies on them.
