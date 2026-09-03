import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameDispatch } from "../context/useGame";
import { prefetchRemoteSubmissions } from "../utils/remoteSubmissions";
import { shuffle } from "../utils/shuffle";
import type { PatientProfile } from "../types";
import { EntryPanel, type PlayerEntry } from "./EntryPanel";

const STACK_STYLES = [
  { rotate: 0, x: 0, opacity: 1 },
  { rotate: -5, x: -10, opacity: 0.55 },
  { rotate: -12, x: -20, opacity: 0.3 },
  { rotate: -18, x: -30, opacity: 0 },
];

/* Attract-screen card — Figma "Card Client 1" (node 32:167), 238×363. The
   game card's glass surface / glow ring / avatar frame at mini scale: avatar
   65×80 (2px gradient stroke, r8) at (20,36), label DM Sans SemiBold 10/26
   +2px, age Roboto Bold 12/24, bullets DM Sans 12/16 white with 4px gold
   dots at x=14. Each of this deck's label/value fields takes one bullet row,
   the label as a gold run ahead of the value (see PatientCard). Rendered
   inside the .patient-card wrapper in the fan below. */
function MiniCard({ profile }: { profile: PatientProfile }) {
  return (
    <div className="relative z-10 flex h-full w-full flex-col">
      <div className="flex shrink-0 items-start gap-2 pt-9 pr-3 pl-5">
        <div className="bg-avatar-stroke h-20 w-[4.0625rem] shrink-0 rounded-lg p-0.5">
          <img
            src={profile.image}
            alt={profile.ageSex}
            className="pointer-events-none h-full w-full rounded-md object-cover"
            draggable={false}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="type-card-label text-gold-accent text-[0.625rem]/[1.625rem]">
            Patient Profile
          </p>
          <p className="type-card-age text-off-white text-xs/6">
            {profile.ageSex}
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 pt-4 pr-3 pb-4 pl-3.5">
        {profile.fields.map((field) => (
          <div key={field.label} className="flex items-start gap-1.5">
            <span className="bg-gold-accent mt-1.5 h-1 w-1 shrink-0 rounded-full" />
            <p className="type-card-body text-xs/4 text-white">
              <span className="text-gold-accent font-semibold">
                {field.label}:{" "}
              </span>
              {field.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface StackCard {
  id: number;
  profileIdx: number;
}

export function AttractScreen() {
  const { dispatch, profiles } = useGameDispatch();

  // Warm the shared submissions fetch during form entry so the game-screen
  // panel (chart or leaderboard) mounts with data instead of updating mid-play.
  useEffect(() => {
    prefetchRemoteSubmissions();
  }, []);

  const [stack, setStack] = useState<StackCard[]>([
    { id: 0, profileIdx: 0 },
    { id: 1, profileIdx: 1 % profiles.length },
    { id: 2, profileIdx: 2 % profiles.length },
  ]);
  const nextId = useRef(3);
  const [newestId, setNewestId] = useState<number | null>(null);

  useEffect(() => {
    if (profiles.length === 0) return;
    const interval = setInterval(() => {
      const newId = nextId.current;
      nextId.current += 1;
      setNewestId(newId);
      setStack(([, mid, back]) => {
        const newCard: StackCard = {
          id: newId,
          profileIdx: (back.profileIdx + 1) % profiles.length,
        };
        return [mid, back, newCard];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [profiles.length]);

  if (profiles.length === 0) return null;

  function handleStart(player: PlayerEntry) {
    dispatch({ type: "SET_PLAYER", ...player });
    dispatch({ type: "START_GAME", deck: shuffle(profiles) });
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-start gap-8 overflow-y-auto px-6 py-10 sm:justify-center sm:flex-row sm:gap-16 sm:px-16 sm:py-0">
      {/* Animated card fan. The front card stays centred on the screen as in
          Figma "Frame 1"; the heading (node 148:357, "Card title" style)
          hangs above it out of flow — its bottom 3rem (design: 47px) over the
          card's top — so it doesn't push the fan down. */}
      <div className="relative hidden h-[22.6875rem] w-[14.875rem] shrink-0 sm:block">
        <p className="type-card-title text-off-white absolute bottom-full left-1/2 mb-12 -translate-x-1/2 whitespace-nowrap">
          Complete All {profiles.length} Cases!
        </p>
        <AnimatePresence>
          {[...stack].reverse().map(({ id, profileIdx }, reversedIdx) => {
            const stackPos = stack.length - 1 - reversedIdx;
            const isFront = stackPos === 0;
            const profile = profiles[profileIdx];

            return (
              <motion.div
                key={id}
                className="absolute inset-0"
                style={{ zIndex: 3 - stackPos }}
                initial={{
                  ...STACK_STYLES[Math.min(stackPos + 1, 3)],
                  ...(id === newestId ? { scale: 0.88 } : {}),
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
                  id === newestId
                    ? {
                        type: "spring",
                        stiffness: 280,
                        damping: 24,
                        delay: 0.5,
                      }
                    : { type: "spring", stiffness: 300, damping: 25, delay: 0 }
                }
              >
                {/* Bob wrapper IS the glass card so ring, shadow and content bob
                    together. Its own compositor layer: it bobs forever, so the
                    glow ring must not re-rasterize per frame. */}
                <motion.div
                  className="patient-card patient-card-shadow absolute inset-0"
                  animate={isFront ? { y: [0, -8, 0] } : { y: 0 }}
                  transition={
                    isFront
                      ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                      : { type: "spring", stiffness: 300, damping: 25 }
                  }
                  style={{ willChange: "transform" }}
                >
                  <div className="patient-card-glow" aria-hidden />
                  {isFront ? (
                    <MiniCard profile={profile} />
                  ) : stackPos === 1 ? (
                    <div className="relative z-10 h-full w-full pt-9 pl-5">
                      <p className="type-card-label text-gold-accent text-[0.625rem]/[1.625rem]">
                        Patient Profile
                      </p>
                      <p className="type-card-age text-off-white/60 text-xs/6">
                        {profile.ageSex}
                      </p>
                    </div>
                  ) : null}
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <EntryPanel onStart={handleStart} />
    </div>
  );
}
