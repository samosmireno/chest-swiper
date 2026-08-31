# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Type-check then bundle for production (tsc -b && vite build)
npm run lint      # ESLint across the project
npm run preview   # Serve the production build locally
npm test          # Vitest (watch mode; `npx vitest run` for one-shot)
```

## Stack

- React 19 + TypeScript, bundled with Vite; Tailwind v4, Framer Motion, Recharts
- Entry point: `src/main.tsx` → `src/App.tsx`

## What the app is

"Swipe or Miss: Asthma & COPD Decisions" — a kiosk swipe game of severe
asthma and COPD treatment cases (source deck: `documents/cases.pptx`). Flow:
attract screen with player form
(`AttractScreen`) → shuffled 12-card deck, swipe/tap per card with rationale
overlay → summary with score + leaderboard. Case content lives in
`src/data/profiles.ts`. Scoring is correct×100 + maxStreak×10 plus a hidden
speed bonus, weighted so accuracy can never be outranked (see `src/config.ts`;
proven exhaustively in `src/leaderboard.test.ts`). Results POST to a Google
Apps Script webhook (`sheets/wwys-results.gs`, URL in `src/config.ts`); bump
`APP_VERSION` there whenever card content or scoring changes.

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo — one `CONTEXT.md` at the root. See `docs/agents/domain.md`.
