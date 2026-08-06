# Drupal Webform API Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a stub integration layer for the Drupal Webform REST API so the app works exactly as-is today, and swapping in real endpoints later requires only filling in constants and possibly adjusting webform field keys.

**Architecture:** Two new hooks — `useWebformSubmission` (fires a POST at session end) and `useCommunityStats` (fetches raw submissions for the community chart on the summary screen). Both are no-ops when their URL constants are empty strings. The session-end POST is wired into the existing `useEffect` in `GameContext`. Community stats are fetched on summary screen mount inside `LeaderboardPanel` and displayed via the existing `CommunityInsights` component.

**Tech Stack:** React 19, TypeScript, native `fetch`, Vite. No test runner configured — skip TDD steps.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/config.ts` | Modify | Add `DRUPAL_SUBMIT_URL`, `DRUPAL_RESULTS_URL`, `DRUPAL_WEBFORM_ID`, `APP_VERSION` |
| `src/hooks/useWebformSubmission.ts` | Create | Build payload + fire POST; no-op when URL empty |
| `src/context/GameContext.tsx` | Modify | Call `submitSession` in existing session-end `useEffect` |
| `src/hooks/useCommunityStats.ts` | Create | Fetch Drupal View JSON → transform to `CumulativeStats`; no-op when URL empty |
| `src/components/LeaderboardPanel.tsx` | Modify | Call `useCommunityStats`, add `CommunityInsights` below leaderboard with loading state |

---

## Task 1: Add Drupal constants to `src/config.ts`

**Files:**
- Modify: `src/config.ts`

- [ ] **Step 1: Add the four constants at the bottom of `src/config.ts`**

```ts
// ─── Drupal Webform API ───────────────────────────────────────
// Leave empty strings until Dan provides the final endpoints.
// DRUPAL_SUBMIT_URL  — POST endpoint for webform submissions
// DRUPAL_RESULTS_URL — GET endpoint returning all raw submissions as JSON
// DRUPAL_WEBFORM_ID  — webform machine name (e.g. "wwys_results")
// APP_VERSION        — bump this when card content changes to filter old submissions
export const DRUPAL_SUBMIT_URL = "";
export const DRUPAL_RESULTS_URL = "";
export const DRUPAL_WEBFORM_ID = "wwys_results";
export const APP_VERSION = "1.0";
```

- [ ] **Step 2: Verify the build still passes**

```bash
npm run build
```

Expected: no TypeScript errors, build succeeds.

---

## Task 2: Create `src/hooks/useWebformSubmission.ts`

**Files:**
- Create: `src/hooks/useWebformSubmission.ts`

**Context:** The Drupal webform expects a flat JSON payload with session-level fields plus one field per card keyed by profile ID (`card_c1_correct` … `card_c13_correct`). The POST fires once at session end, fire-and-forget. When `DRUPAL_SUBMIT_URL` is empty the function returns immediately — the app is unchanged.

The CSRF token flow (Drupal requires `X-CSRF-Token` for logged-in sessions) is not needed for the ADA public page, but the comment marks exactly where to add it when Dan confirms.

- [ ] **Step 1: Create the file**

```ts
import type { PatientProfile, SessionResult } from "../types";
import {
  DRUPAL_SUBMIT_URL,
  DRUPAL_WEBFORM_ID,
  APP_VERSION,
} from "../config";
import { calculateScore } from "../leaderboard";

interface SubmitSessionParams {
  username: string;
  email: string;
  sessionResults: SessionResult[];
  deck: PatientProfile[];
  maxStreak: number;
}

function buildPayload({
  username,
  email,
  sessionResults,
  deck,
  maxStreak,
}: SubmitSessionParams): Record<string, string | number> {
  const cardsCorrect = sessionResults.filter((r) => r.correct).length;
  const score = calculateScore(cardsCorrect, maxStreak);

  const payload: Record<string, string | number> = {
    webform_id: DRUPAL_WEBFORM_ID,
    app_version: APP_VERSION,
    username,
    email,
    submitted_at: new Date().toISOString(),
    score,
    cards_correct: cardsCorrect,
    cards_total: deck.length,
    max_streak: maxStreak,
  };

  // Per-card results keyed by profile ID (e.g. card_c1_correct)
  for (const result of sessionResults) {
    payload[`card_${result.profileId}_correct`] = result.correct ? "yes" : "no";
  }

  return payload;
}

export function useWebformSubmission() {
  return {
    submitSession: (params: SubmitSessionParams) => {
      if (!DRUPAL_SUBMIT_URL) return;

      const payload = buildPayload(params);

      fetch(DRUPAL_SUBMIT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // TODO: add CSRF token when Dan confirms auth requirement:
          // "X-CSRF-Token": <token from GET /session/token>
        },
        body: JSON.stringify(payload),
      }).catch((err) =>
        console.error("[wwys] Webform submission failed:", err),
      );
    },
  };
}
```

- [ ] **Step 2: Verify the build still passes**

```bash
npm run build
```

Expected: no TypeScript errors.

---

## Task 3: Wire `useWebformSubmission` into `GameContext.tsx`

**Files:**
- Modify: `src/context/GameContext.tsx`

**Context:** The existing `useEffect` at line ~243 already fires exactly once per session when `screen === "summary"` and `lastSessionId` changes. It currently calls `addLeaderboardEntry` and `trackGameCompleted`. We add `submitSession` alongside those calls. The hook must be instantiated inside `GameProvider`.

- [ ] **Step 1: Import the hook at the top of `GameContext.tsx`**

Add this import after the existing hook imports:

```ts
import { useWebformSubmission } from "../hooks/useWebformSubmission";
```

- [ ] **Step 2: Instantiate the hook inside `GameProvider`, after the `useAnalytics` call**

Find this line in `GameProvider`:
```ts
const { trackGameCompleted, trackCardDecision, trackStreakMilestone } = useAnalytics();
```

Add immediately after it:
```ts
const { submitSession } = useWebformSubmission();
```

- [ ] **Step 3: Call `submitSession` inside the session-end `useEffect`**

Find the session-end `useEffect`. It currently contains:
```ts
addLeaderboardEntry(
  buildLeaderboardEntry(username, email, sessionResults, maxStreak, lastSessionId),
);
```

Add `submitSession` call immediately after `addLeaderboardEntry(...)`:
```ts
submitSession({ username, email, sessionResults, deck, maxStreak });
```

- [ ] **Step 4: Add `deck` to the `useEffect` dependency array**

The dependency array currently ends with `trackGameCompleted,`. Add `deck` and `submitSession`:

```ts
  ], [
    screen,
    lastSessionId,
    cumulativeStats,
    username,
    email,
    sessionResults,
    maxStreak,
    deck,
    trackGameCompleted,
    submitSession,
  ]);
```

- [ ] **Step 5: Verify the build still passes**

```bash
npm run build
```

Expected: no TypeScript errors.

---

## Task 4: Create `src/hooks/useCommunityStats.ts`

**Files:**
- Create: `src/hooks/useCommunityStats.ts`

**Context:** The Drupal View returns an array of raw submission objects. Each object has flat string fields like `card_c1_correct: "yes"`. We transform this into the `CumulativeStats` shape that `CommunityInsights` already understands. When `DRUPAL_RESULTS_URL` is empty, the hook is a no-op and returns the fallback (localStorage stats) immediately — no loading state shown.

The exact JSON shape from Dan may differ slightly. The regex `^card_(.+)_correct$` will match any profile-ID-keyed card field regardless of the exact ID format, so the transform is robust to card ID changes.

- [ ] **Step 1: Create the file**

```ts
import { useState, useEffect } from "react";
import type { CumulativeStats } from "../types";
import { DRUPAL_RESULTS_URL } from "../config";

interface DrupalSubmission {
  [key: string]: string | number | undefined;
}

function transformSubmissions(submissions: DrupalSubmission[]): CumulativeStats {
  const perCard: CumulativeStats["perCard"] = {};

  for (const sub of submissions) {
    for (const [key, value] of Object.entries(sub)) {
      const match = key.match(/^card_(.+)_correct$/);
      if (!match) continue;
      const profileId = match[1];
      const existing = perCard[profileId] ?? { timesShown: 0, timesCorrect: 0 };
      perCard[profileId] = {
        timesShown: existing.timesShown + 1,
        timesCorrect: existing.timesCorrect + (value === "yes" ? 1 : 0),
      };
    }
  }

  return { totalSessions: submissions.length, perCard };
}

export function useCommunityStats(fallback: CumulativeStats): {
  stats: CumulativeStats;
  loading: boolean;
} {
  const [data, setData] = useState<CumulativeStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!DRUPAL_RESULTS_URL) return;

    setLoading(true);
    fetch(DRUPAL_RESULTS_URL)
      .then((r) => r.json())
      .then((submissions: DrupalSubmission[]) => {
        setData(transformSubmissions(submissions));
      })
      .catch((err) => {
        console.error("[wwys] Community stats fetch failed:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  return { stats: data ?? fallback, loading };
}
```

- [ ] **Step 2: Verify the build still passes**

```bash
npm run build
```

Expected: no TypeScript errors.

---

## Task 5: Wire community stats into `LeaderboardPanel`

**Files:**
- Modify: `src/components/LeaderboardPanel.tsx`

**Context:** `LeaderboardPanel` is the right-side panel on the summary screen. We add `CommunityInsights` below the leaderboard. `useCommunityStats` takes a fallback (localStorage `cumulativeStats` from `useGame`). When loading, show "Loading community data..." instead of the chart. When the URL is empty, `loading` is always false and `stats` is the localStorage fallback — so the chart shows local-only data, exactly as before.

- [ ] **Step 1: Add imports to `LeaderboardPanel.tsx`**

Add these imports after the existing imports:

```ts
import { useCommunityStats } from "../hooks/useCommunityStats";
import { CommunityInsights } from "./dashboard/CommunityInsights";
```

- [ ] **Step 2: Destructure `cumulativeStats` from `useGame` and call the hook**

Find:
```ts
const { state } = useGame();
```

Replace with:
```ts
const { state } = useGame();
const { stats: communityStats, loading: communityLoading } = useCommunityStats(
  state.cumulativeStats,
);
```

- [ ] **Step 3: Add the community stats section below the closing `</div>` of the pagination block**

Find the closing `</div>` that ends the component's return (the outermost `flex flex-col` div). Add the community section just before it:

```tsx
      {/* Community insights — below leaderboard */}
      <div className="border-t border-purple-accent/20 shrink-0">
        {communityLoading ? (
          <p className="py-6 text-center text-xs text-white/35 tracking-widest font-display uppercase">
            Loading community data...
          </p>
        ) : (
          <CommunityInsights stats={communityStats} />
        )}
      </div>
```

- [ ] **Step 4: Verify the build still passes**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 5: Run the dev server and verify the summary screen still works**

```bash
npm run dev
```

Play through all 13 cards and reach the summary screen. Verify:
- Leaderboard renders as before
- Community Insights chart appears below the leaderboard (showing localStorage data since `DRUPAL_RESULTS_URL` is empty)
- No console errors

---

## Swap Checklist (when Dan sends final details)

When the Drupal endpoints and webform keys arrive, do exactly these things — nothing else:

1. In `src/config.ts`: fill in `DRUPAL_SUBMIT_URL`, `DRUPAL_RESULTS_URL`, and confirm `DRUPAL_WEBFORM_ID`
2. If card IDs change from `c1–c13`: update `src/data/profiles.ts` — the payload keys (`card_${profile.id}_correct`) derive automatically
3. If identity fields change to `firstName/lastName/specialty`: update `GameState` in `src/types/index.ts`, the `SET_PLAYER` action in `GameContext.tsx`, the `AttractScreen.tsx` form, and `buildPayload` in `useWebformSubmission.ts`
4. If Drupal requires CSRF token: add the token fetch in `useWebformSubmission.ts` where the TODO comment is
5. If the Drupal View JSON shape differs from `{ [field]: string | number }[]`: adjust `DrupalSubmission` and `transformSubmissions` in `useCommunityStats.ts`
