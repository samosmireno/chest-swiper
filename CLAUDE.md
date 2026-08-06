# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Type-check then bundle for production (tsc -b && vite build)
npm run lint      # ESLint across the project
npm run preview   # Serve the production build locally
```

No test runner is configured yet.

## Stack

- React 19 + TypeScript, bundled with Vite
- Entry point: `src/main.tsx` → `src/App.tsx`
- The app is currently a blank shell (`App` returns `<></>`); all product logic is yet to be built.

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo — one `CONTEXT.md` at the root. See `docs/agents/domain.md`.
