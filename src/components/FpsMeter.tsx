import { useEffect, useRef } from "react";

/* Tiny live frame meter for on-device perf triage (?fps=1). Shows frames
   per second and how many frames in the last second ran long (>33ms ≈ two
   missed vsyncs at 60Hz — a visible hitch). */
export function FpsMeter() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let windowStart = last;
    let frames = 0;
    let long = 0;

    const loop = (t: number) => {
      frames += 1;
      if (t - last > 33.4) long += 1;
      last = t;
      if (t - windowStart >= 1000 && ref.current) {
        ref.current.textContent = `${frames} fps · ${long} long`;
        frames = 0;
        long = 0;
        windowStart = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed top-1 left-1 z-50 rounded bg-black/70 px-2 py-0.5 font-mono text-xs text-green-400"
    />
  );
}
