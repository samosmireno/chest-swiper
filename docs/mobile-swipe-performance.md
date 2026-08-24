# Mobile Swipe Performance

A record of the August 2026 jank hunt: what made swiping feel bad on
mobile, how each cause was measured, what was fixed, and what was ruled
out — so future perf work starts from evidence instead of re-guessing.

Shipped in the `mobile-swipe` branch, merged to `main` as `3ad1a8c`
(commits `760595f`, `75c3c63`, `057b118`, `d3caf21`).

## Symptom

"The app feels jammy, especially swiping, on mobile." Desktop felt fine.

## Root causes (five, all verified)

### 1. The card only tracked 25% of the finger

`DraggableCard` shipped with `dragConstraints={{ left: 0, right: 0 }}` +
`dragElastic={0.25}` from the original skeleton — the card was pinned to
center and all visible drag was elastic overflow. A 150px swipe moved the
card ~37px. This was the dominant "sticky" feel and is invisible to any
frame-rate measurement.

**Fix:** drop the constraints for 1:1 tracking, `dragMomentum={false}` so
release still runs the snap-back/fly-off logic. Swipe-commit thresholds
always used pointer offset, so gameplay is unchanged.

### 2. Diagonal swipes were stolen by the page scroller

framer-motion sets `touch-action: pan-y` on `drag="x"` elements, and the
mobile layout scrolls vertically (dashboard below the game). Swipes with
enough vertical angle got a `pointercancel` after ~2 moves — the card
froze and snapped back while the page scrolled. Reproduced 100% at 45°
upward in emulation.

**Fix:** `touch-none!` on the card. It must be the `!important` Tailwind
variant — framer overwrites inline `style.touchAction`.

### 3. First swipe paid ~30ms of font shaping mid-animation

The rationale overlay's first-ever mount triggered font shaping for all
its text styles in a single frame, exactly as the card fly-off animation
ran (137ms of Layout at 20× CPU throttle; ~4ms on every later mount).
Every player hit this once, on their first swipe.

**Fix:** a `visibility: hidden` pre-warm copy of the overlay mounts while
the first card idles (`GamePanel`, gated on `sessionResults.length === 0`)
— laid out, never painted, removed after the first swipe.

### 4. The glow shadows were re-rasterized every dragged frame

The swipe stamps ("← option / option →") fade in as you drag. Their
opacity lived inside the card's compositor layer, so every dragged frame
re-rasterized the whole card texture — including the 30px+60px Gaussian
glow blurs. On a mid-range phone (Redmi Note 15 Pro) this held drag at
35fps with 5 hitches/second; the advance transition hit 7–10 hitches as
the stack cards' entrance springs re-rasterized the same glows.

**Fix:** `will-change: opacity` on the stamps (own compositor layers →
the card rasters once, then only transforms); `will-change` on the stack
cards and the attract screen's bobbing card; one 32px glow layer on the
card frame instead of 30px+60px; one drop-shadow filter pass per progress
diamond instead of two. Screenshot-verified as visually near-identical.

### 5. Community stats arrived mid-play and mounted the chart in one frame

The Google Sheets fetch started when the game screen mounted, so the
response landed seconds into play — and applying it mounted the entire
Recharts tree in a single blocking frame (~600–1100ms at 20× throttle,
measured landing mid-drag). `startTransition` made it *worse*: continuous
pointer input kept interrupting and restarting the transition render.

**Fix:** prefetch from the attract screen (`prefetchCommunityStats()`),
refreshed per attract visit. The response resolves while the player fills
the form, so the chart mounts *with* data during the screen-fade
transition, when nothing is interactive. The hook self-starts the fetch
only as a demo-mode fallback.

## Ruled out — do not re-litigate these

Each was tested by differential measurement and had **no effect** on the
jank:

- **The background video** (in-emulator and on-device, `?novideo=1`)
- **`backdrop-blur`** on the overlay (on-device, `?noblur=1`)
- Recharts re-rendering per swipe (memoizing the chart moved nothing)
- `content-visibility` containment on the dashboard
- Overlay slide-from-bottom vs. fade-in-place (both compositor-only; the
  current fade is an aesthetic choice, not a perf one)

## Supporting changes

- Leaf memoization: `PatientCard`, `Diamond`, `CommunityInsights`
  (decoupled from game context) — cut the per-dispatch React render ~40%.
- Recharts lazy-loaded: main bundle 707KB → 366KB + 342KB deferred chunk.
- `dvh` units replace `vh` in the app shell so mobile URL-bar collapse
  doesn't jump the layout.

## Results

| Metric | Before | After |
|---|---|---|
| Drag tracking | 25% of finger distance | 1:1 |
| Diagonal swipe registration | lost at ≥45° | all angles |
| Drag (Redmi Note 15 Pro) | 35fps, 5 long/s | ~60fps, 0 long |
| Advance hitches (same device) | 7–10 long frames | 1 |
| Release worst frame (harness, 20× throttle) | 208–234ms | 58–66ms |

The remaining single long frame on advance is the React re-render of the
game subtree per dispatch — accepted as imperceptible.

`GameContext` was subsequently split into three contexts
(`GameScreenContext` / `GameStateContext` / `GameDispatchContext`, hooks
`useGameScreen` / `useGameState` / `useGameDispatch`) so each consumer
subscribes to exactly the slice it depends on. The motivation is a
planned per-card countdown timer: a clock dispatching through the old
single context would have re-rendered the entire app every tick. With the
split, the router only notifies on screen changes and command-only
consumers (forms, buttons) never re-render from state. Any future timer
should keep its ticking state in `GameStateContext` (or local state), and
new components should subscribe to the narrowest hook that serves them.

## Tooling left in place

Query-param triage flags (`src/utils/perfFlags.ts`, zero effect without
params) for future on-device measurement:

- `?fps=1` — live frame meter (fps + long-frame count)
- `?novideo=1` — static poster instead of the background video
- `?noblur=1` — disable backdrop blurs
- `?nofx=1` — disable SVG filters and glow shadows

Protocol: measure a production build (`npm run build && npm run preview
-- --host`), never the dev server. Baseline first, then all flags
combined; individual flags only if the combined run is clearly better.
