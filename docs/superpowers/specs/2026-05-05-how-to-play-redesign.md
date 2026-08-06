# How to Play — Redesign Spec

**Date:** 2026-05-05

## Problem

The current "how to play" strip in `AttractScreen.tsx` shows only arrows and labels (← Monitor / 👆 / → Screen). It doesn't explain what "Screen" and "Monitor" mean medically, what the player is actually deciding, or that both swipe and button inputs are available.

## Solution

Replace the icon strip with a compact numbered-steps block that frames the clinical decision and names both input methods.

## Design

### Layout

A contained block inside the existing dark panel, matching its visual style.

```
HOW TO PLAY

① Read the patient's profile card
② Does this patient need T1D autoantibody screening?
③ Swipe or tap — ← Monitor  ·  Screen →
```

### Styling

| Element | Value |
|---|---|
| "HOW TO PLAY" label | `#c9921f`, 9px, uppercase, `letterSpacing: 0.18em` |
| Numbered circles | `rgba(155,48,255,0.3)` bg, `rgba(155,48,255,0.6)` border, `#c9a6ff` text |
| Step text | `rgba(255,255,255,0.75)`, 10–11px |
| "← Monitor" | `#ffe082` bold |
| "Screen →" | `#b9f6ca` bold |
| Container | `rgba(255,255,255,0.04)` bg, `1px solid rgba(255,255,255,0.08)` border, `border-radius: 8px`, `padding: 14px 16px` |

### File to modify

`src/components/AttractScreen.tsx` — lines 244–303 (the `{/* How-to-play strip */}` section)

No new files, no new components. The existing `SwipeGuide.tsx` buttons already support the tap interaction; this change only updates the instructional copy on the attract screen.

## Verification

1. Run `npm run dev` and open the attract screen
2. Confirm the "How to Play" block shows 3 numbered steps
3. Confirm "← Monitor" renders in yellow and "Screen →" in green
4. Confirm the block fits within the existing panel without overflow on mobile (portrait) and desktop
5. Confirm no regressions to the card fan animation or the form below
