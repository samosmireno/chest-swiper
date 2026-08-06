import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STREAK_MILESTONES } from "../../config";

const MILESTONE_STREAKS = STREAK_MILESTONES.map((m) => m.streak);

function getBannerContent(streak: number): { number: string; label: string } {
  const milestone = [...STREAK_MILESTONES].reverse().find((m) => streak >= m.streak);
  return milestone
    ? { number: String(milestone.streak), label: milestone.label }
    : { number: String(streak), label: "IN A ROW" };
}

interface StreakBannerProps {
  streak: number;
}

export function StreakBanner({ streak }: StreakBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!MILESTONE_STREAKS.includes(streak)) return;
    const show = setTimeout(() => setVisible(true), 0);
    const hide = setTimeout(() => setVisible(false), 1800);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
      setVisible(false);
    };
  }, [streak]);

  const { number, label } = getBannerContent(streak);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0, scaleX: 0.85 }}
          animate={{ y: 0, opacity: 1, scaleX: 1 }}
          exit={{ y: -80, opacity: 0, scaleX: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
          className="absolute left-1/2 top-0 z-20 -translate-x-1/2"
        >
          {/* Glow backdrop */}
          <div
            className="absolute inset-0 rounded-b-2xl blur-xl opacity-55"
            style={{
              background:
                "linear-gradient(to right, var(--color-magenta-500), var(--color-purple-600))",
            }}
          />

          {/* Main banner */}
          <div
            className="relative flex items-center gap-3 overflow-hidden rounded-b-2xl px-8 py-3 shadow-2xl"
            style={{
              background:
                "var(--gradient-streak)",
            }}
          >
            {/* Top border highlight */}
            <div className="absolute top-0 right-0 left-0 h-px bg-white/40" />

            {/* Shimmer sweep on entry */}
            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.28) 50%, transparent 62%)",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: "220%" }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.12 }}
            />

            {/* Streak number — large Barlow Condensed */}
            <span
              className="font-display text-5xl leading-none font-black text-white"
            >
              {number}
            </span>

            {/* Label stack */}
            <div className="flex flex-col items-start">
              <span
                className="font-display text-[9px] font-bold tracking-[0.22em] text-white/65 uppercase"
              >
                STREAK
              </span>
              <span
                className="font-display text-sm font-black tracking-widest text-white uppercase leading-tight"
              >
                {label}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
