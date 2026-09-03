import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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

/* Milestone toast in the brand dress (.streak-banner in index.css): a
   gold-outlined charcoal pill with the streak count as a gold stat numeral
   and the milestone label in off-white Barlow. Rendered by GamePanel inside
   the card wrapper, so it sits astride the card's top edge — centred, half
   above and half over the card's top padding — clear of the progress dots
   above and of the rationale title below. Pointer-events off: it's transient
   and the overlay beneath is the tap target. */
export function StreakBanner({ streak }: StreakBannerProps) {
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

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
          initial={{ y: -24, opacity: 0, scale: 0.85 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -12, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
          className="pointer-events-none absolute top-0 left-1/2 z-30 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="streak-banner relative overflow-hidden">
            {/* One gold-tinted light sweep on entry (the glow ring's #ffe7ad
                highlight); transform-only so it composites. */}
            {!reduceMotion && (
              <motion.div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(105deg, transparent 38%, rgba(255, 231, 173, 0.32) 50%, transparent 62%)",
                }}
                initial={{ x: "-100%" }}
                animate={{ x: "220%" }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.12 }}
              />
            )}

            {/* Streak count — the session box's gold stat numeral */}
            <span className="type-stat-value text-gold-accent max-md:text-[2.5rem]">
              {number}
            </span>

            {/* Label stack: light-mint eyebrow over the off-white milestone
                label (the panel title with its 32px leading closed up) */}
            <div className="flex flex-col items-start gap-1">
              <span className="type-streak-eyebrow text-light-mint">Streak</span>
              <span className="type-panel-title text-off-white leading-none whitespace-nowrap max-md:text-xl">
                {label}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
