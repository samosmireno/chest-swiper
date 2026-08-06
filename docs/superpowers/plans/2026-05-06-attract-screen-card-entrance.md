# Attract Screen Card Entrance Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** New cards deal into the back of the stack after the front card exits, instead of appearing invisibly mid-cycle.

**Architecture:** A `newestId` ref tracks the most recently added card's ID. Each card checks this ref at render time to pick its transition delay — 0s for cards that are just shifting positions, 0.5s for the new card entering from deeper in the deck. The new card's `initial` state adds `scale: 0.88` to the existing opacity-0 position so it reads as coming from behind.

**Tech Stack:** React 19, Framer Motion, TypeScript

---

### Task 1: Add `newestId` ref and set it on each cycle

**Files:**
- Modify: `src/components/AttractScreen.tsx`

The `newestId` ref will hold the `id` of the card most recently pushed onto the stack. It must be set *before* the state update so the value is available during the render that follows.

- [ ] **Step 1: Add the ref**

In `AttractScreen`, directly after the `nextId` ref declaration (line 73), add:

```tsx
const newestId = useRef<number | null>(null);
```

- [ ] **Step 2: Set `newestId` inside the `setStack` callback**

Replace the existing `setInterval` callback (lines 78–85) with:

```tsx
const interval = setInterval(() => {
  setStack(([, mid, back]) => {
    const newCard: StackCard = {
      id: nextId.current,
      profileIdx: (back.profileIdx + 1) % profiles.length,
    };
    newestId.current = nextId.current;
    nextId.current += 1;
    return [mid, back, newCard];
  });
}, 4000);
```

- [ ] **Step 3: Verify the app still compiles and runs**

```bash
npm run dev
```

Open the app and confirm the attract screen still cycles cards (no visual change yet expected).

---

### Task 2: Update card transition logic to sequence the entrance

**Files:**
- Modify: `src/components/AttractScreen.tsx`

Three changes to the `motion.div` that wraps each card:

1. Remove the blanket `delay: 0.3` from the default transition — shifting cards should snap forward immediately.
2. New cards (where `id === newestId.current`) get `delay: 0.5` and a softer spring.
3. The new card's `initial` prop gets `scale: 0.88` added to the existing opacity-0 deep-stack position.

- [ ] **Step 1: Update the motion.div**

Replace the outer `motion.div` (the one with `key={id}`, lines 113–131) with:

```tsx
<motion.div
  key={id}
  className="absolute inset-0"
  style={{ zIndex: 3 - stackPos }}
  initial={{
    ...STACK_STYLES[Math.min(stackPos + 1, 3)],
    ...(id === newestId.current ? { scale: 0.88 } : {}),
  }}
  animate={STACK_STYLES[stackPos]}
  exit={{
    opacity: 0,
    x: id % 2 === 0 ? -300 : 300,
    rotate: id % 2 === 0 ? -8 : 8,
    zIndex: 50,
    transition: { duration: 0.4, ease: "easeIn" },
  }}
  transition={
    id === newestId.current
      ? { type: "spring", stiffness: 280, damping: 24, delay: 0.5 }
      : { type: "spring", stiffness: 300, damping: 25, delay: 0 }
  }
>
```

- [ ] **Step 2: Verify the animation sequence**

```bash
npm run dev
```

Watch the attract screen cycle. You should see:
1. Front card flies off left or right (0.4s)
2. Stack snaps forward immediately (no perceptible delay)
3. ~0.1s pause, then a new card deals in from behind (scales up from 0.88, fades in from opacity 0, slides from rotate -18 / x -30 to rotate -12 / x -20)

- [ ] **Step 3: Commit**

```bash
git add src/components/AttractScreen.tsx
git commit -m "fix: deal new cards into stack after exit animation completes"
```
