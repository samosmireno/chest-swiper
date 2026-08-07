import { forwardRef, useImperativeHandle, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  type PanInfo,
} from "framer-motion";
import { PatientCard } from "./PatientCard";
import type { PatientProfile, SwipeSide } from "../../types";
import { uiScale } from "../../utils/uiScale";

// ─── DraggableCard ────────────────────────────────────────────

export interface DraggableCardHandle {
  triggerSwipe: (side: SwipeSide) => void;
}

interface DraggableCardProps {
  profile: PatientProfile;
  onSwipe: (side: SwipeSide) => void;
}

const DraggableCard = forwardRef<DraggableCardHandle, DraggableCardProps>(
  ({ profile, onSwipe }, ref) => {
    const x = useMotionValue(0);
    const s = uiScale();
    const rotate = useTransform(x, [-300 * s, 0, 300 * s], [-12, 0, 12]);
    const rightOpacity = useTransform(x, [0, 80 * s, 150 * s], [0, 0.7, 1]);
    const leftOpacity = useTransform(x, [-150 * s, -80 * s, 0], [1, 0.7, 0]);
    const controls = useAnimation();

    const commitSwipe = async (side: SwipeSide) => {
      const targetX = (side === "right" ? 600 : -600) * uiScale();
      await controls.start({
        x: targetX,
        opacity: 0,
        transition: { duration: 0.3, ease: "easeOut" },
      });
      onSwipe(side);
    };

    useImperativeHandle(ref, () => ({ triggerSwipe: commitSwipe }));

    const handleDragEnd = (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo,
    ) => {
      const scale = uiScale();
      const flick = Math.abs(info.velocity.x / scale) > 500;
      if (info.offset.x / scale > 80 || (flick && info.velocity.x > 0)) {
        commitSwipe("right");
      } else if (info.offset.x / scale < -80 || (flick && info.velocity.x < 0)) {
        commitSwipe("left");
      } else {
        controls.start({
          x: 0,
          transition: { type: "spring", stiffness: 400, damping: 30 },
        });
      }
    };

    return (
      <motion.div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ x, rotate, willChange: "transform" }}
        animate={controls}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        onDragEnd={handleDragEnd}
      >
        <PatientCard profile={profile} />

        {/* Right-swipe stamp */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-end justify-center rounded-xl bg-sky-500/20 px-6 pb-6"
          style={{ opacity: rightOpacity }}
        >
          <span className="font-display text-center text-base leading-tight font-bold tracking-[0.08em] text-sky-300 sm:text-lg">
            {profile.rightOption} →
          </span>
        </motion.div>

        {/* Left-swipe stamp */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-end justify-center rounded-xl bg-yellow-500/20 px-6 pb-6"
          style={{ opacity: leftOpacity }}
        >
          <span className="font-display text-center text-base leading-tight font-bold tracking-[0.08em] text-yellow-300 sm:text-lg">
            ← {profile.leftOption}
          </span>
        </motion.div>
      </motion.div>
    );
  },
);
DraggableCard.displayName = "DraggableCard";

// ─── CardStack ───────────────────────────────────────────────

export interface CardStackHandle {
  triggerSwipe: (side: SwipeSide) => void;
}

interface CardStackProps {
  deck: PatientProfile[];
  currentIndex: number;
  onSwipe: (side: SwipeSide) => void;
  locked?: boolean;
}

export const CardStack = forwardRef<CardStackHandle, CardStackProps>(
  ({ deck, currentIndex, onSwipe, locked = false }, ref) => {
    const draggableCardRef = useRef<DraggableCardHandle>(null);
    const s = uiScale();

    useImperativeHandle(ref, () => ({
      triggerSwipe: (side) => draggableCardRef.current?.triggerSwipe(side),
    }));

    // Show up to 3 cards: current + next 2 (rendered back to front)
    const visibleProfiles = deck.slice(currentIndex, currentIndex + 3);

    return (
      <div className="relative h-100 w-76 sm:w-80 md:h-120 md:w-110">
        {[...visibleProfiles].reverse().map((profile, reversedIndex) => {
          const stackPosition = visibleProfiles.length - 1 - reversedIndex;
          const isTop = stackPosition === 0;

          if (isTop) {
            if (locked) {
              // The card has just been swiped off-screen; don't re-mount it at
              // center, or it flashes back into view before the overlay covers it.
              return null;
            }
            return (
              <DraggableCard
                key={profile.id}
                ref={draggableCardRef}
                profile={profile}
                onSwipe={onSwipe}
              />
            );
          }

          return (
            <motion.div
              key={profile.id}
              className="pointer-events-none absolute inset-0"
              initial={{
                scale: 1 - (stackPosition + 1) * 0.04,
                y: (stackPosition + 1) * 8 * s,
                rotate: (stackPosition + 1) % 2 === 0 ? -2 : 2,
                opacity: 0,
                zIndex: -stackPosition,
              }}
              animate={{
                scale: 1 - stackPosition * 0.04,
                y: stackPosition * 8 * s,
                rotate: stackPosition % 2 === 0 ? -2 : 2,
                opacity: 1 - stackPosition * 0.3,
                zIndex: -stackPosition,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <PatientCard profile={profile} />
            </motion.div>
          );
        })}
      </div>
    );
  },
);
CardStack.displayName = "CardStack";
