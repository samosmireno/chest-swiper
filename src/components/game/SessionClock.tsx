import { useEffect, useState } from "react";
import { useGameState } from "../../context/useGame";
import { formatClock } from "../../utils/formatClock";

interface SessionClockProps {
  className?: string;
}

interface LiveReading {
  since: number; // the runningSince this reading belongs to
  seconds: number;
}

/* Session clock — Figma "digital-timer-value" (component 52:2012, placed at
   2009:3371). Counts the time the session's cards have spent interactive, on
   the same edges as the speed bonus: it runs from the moment the top card
   mounts and pauses at the swipe/tap commit, so reading a rationale never
   counts. Teal while running (variant "Default"), gold while paused (variant
   "Paused" — every "Case N Answer Y/N" frame); the styles live in index.css
   (.session-clock).

   The reducer only holds the edges (see ClockState); the ticking is local. A
   rAF loop reads the clock each frame and stores the displayed second — a
   same-value setState bails out, so this component re-renders once a second
   and nothing else in the app re-renders for the clock (the reason
   useGame.ts splits its contexts). rAF rather than a 1s timeout so the
   digits catch up within a frame if the clock's timestamps move. */
export function SessionClock({ className = "" }: SessionClockProps) {
  const { accumulatedMs, runningSince } = useGameState().clock;
  const [live, setLive] = useState<LiveReading | null>(null);

  useEffect(() => {
    if (runningSince === null) return;
    let frame = 0;
    const loop = () => {
      const seconds = Math.floor(
        (accumulatedMs + performance.now() - runningSince) / 1000,
      );
      setLive((prev) =>
        prev && prev.since === runningSince && prev.seconds === seconds
          ? prev
          : { since: runningSince, seconds },
      );
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [accumulatedMs, runningSince]);

  const running = runningSince !== null;
  // Until the loop's first reading of a freshly started card, the banked
  // total is the right value: the card has been interactive for ~0ms.
  const seconds =
    running && live && live.since === runningSince
      ? live.seconds
      : Math.floor(accumulatedMs / 1000);

  return (
    <span
      className={`session-clock ${className}`}
      data-state={running ? "running" : "paused"}
      role="timer"
      aria-live="off"
    >
      {formatClock(seconds * 1000)}
    </span>
  );
}
