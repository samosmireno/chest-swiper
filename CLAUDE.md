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
proven exhaustively in `src/leaderboard.test.ts`). A session clock
(`SessionClock`, teal while a card is live, gold while its rationale is open)
runs on the speed bonus's edges; its total is the summary's TOTAL TIME row and
the leaderboard's time column (`total_ms` in the payload). Results POST to a
Google Apps Script webhook (`sheets/wwys-results.gs`, URL in `src/config.ts`);
bump `APP_VERSION` there whenever card content or scoring changes.

## Styling

The look is the gold Figma design of the sibling `../t2i-swiper` project
(its commit `4f04ef8`, before that client moved to violet). `src/index.css`
carries the palette tokens (`dark-teal`, `mid-teal`, `gold-accent`,
`light-mint`, `charcoal`, `off-white`, …), the `.btn-gold` / `.btn-teal` /
`.btn-outline` buttons, the `.patient-card` and `.entry-panel` glass shells
and the `.type-*` text ramp, each annotated with its Figma node; components
use those classes plus Tailwind utilities. The scene art
(`public/bg_video.mp4` + poster) is shared with t2i-swiper. Cards carry the
slides' verbatim `bullets` under a gold `name` line and the age line, with the
slide's abbreviation `footnote` at the foot (`PatientCard`, `SummaryPanel`, the
attract-screen mini card). Every card shares one type size: `CardStack` and
the attract fan size themselves to the deck's tallest card with an invisible
sizer rather than shrinking the copy.

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo — one `CONTEXT.md` at the root. See `docs/agents/domain.md`.
