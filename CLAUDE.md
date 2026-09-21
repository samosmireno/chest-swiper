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
(`public/bg_video.mp4` + poster) is the client's lungs-and-crowd clip, cut
from the ignored 10 s master `documents/bg_video_source.mp4` into a 9 s loop
(frames 24–215, then its calm close-up tail 216–239 dissolves into the wide
opening 0–23, so it wraps without a cut) and encoded 720p H.264 CRF 28;
the poster is the loop's first frame. The master carries Gemini's sparkle
watermark at (1137–1184, 577–624); the shipped loop has it unblended (the
blend of white at alpha 0.315 inverted, then per-pixel residue fitted out
over the 240 frames), so re-cutting from the master means removing it again.
Cards carry the
slides' `bullets` under a gold `name` line and the age line (`PatientCard`,
`SummaryPanel`, the attract-screen mini card), with the abbreviation
`footnote` at the foot of the game and attract cards; abbreviations used only
in a rationale go in `explanationFootnote`, under the rationale (overlay and
summary). Copy is the slides' verbatim text plus the client's copy-review
edits, which win where they differ (listed at the top of `profiles.ts`;
footnote rules enforced by `profiles.test.ts`). Every card shares one type
size: `CardStack` and the attract fan size themselves to the deck's tallest
card with an invisible sizer rather than shrinking the copy.

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo — one `CONTEXT.md` at the root. See `docs/agents/domain.md`.
