# Context

Domain glossary for *Who Would You Screen?* — a kiosk case-challenge game played by tables/teams at DETECT/ADA summits. Use these terms in code, tests, and proposals; don't drift to synonyms.

## Glossary

- **Case** — one patient scenario: an intro (narrative + breakout), a sequence of Questions, and a discussion. Defined in `src/data/cases.ts` (`SummitCase`).
- **Question** — a single multiple-choice prompt within a Case, with one correct option and a weight. Scored via `questionWeight` (`src/game/scoring.ts`).
- **Identity** — who is playing: a portal-resolved user or a self-entered Table name. Resolved by `useLoginInfo`.
- **Session** — one play-through of the Case set by a Table/user, from Home through Summary. Identified by `sessionId`, carries the Identity, start time, and the answers given. The play-through is driven by the **Step machine** (`src/game/machine.ts`).
- **Session result** — the canonical scored outcome of a completed Session: identity, duration, total score line, and per-Case results (each with per-Question answer cells). Produced once by `summarizeSession` (`src/game/sessionResult.ts`). Every egress sink — leaderboard entry, webform payload, analytics event — is a projection of the Session result, never a re-derivation from raw state.
- **Leaderboard** — the ranked board of Session results for the current summit. Written locally (`src/leaderboard.ts`) and read back from remote submissions (`src/hooks/useDrupalLeaderboard.ts`).
- **Submission transport** — one backend the app can both write a Session result to and read matching results back from. Each adapter (Drupal, Sheets) owns its own transport quirks and self-gates on its config URL (`src/submissions.ts`). The **submission gateway** holds the transports and the two policies that sit above them: write fans out to all transports; read returns the first non-empty set of matching rows in priority order (Drupal preferred, Sheets fallback).
