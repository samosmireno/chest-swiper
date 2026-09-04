import {
  forwardRef,
  memo,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
} from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  type PanInfo,
} from "framer-motion";
import { PatientCard, PatientCardContent } from "./PatientCard";
import type { PatientProfile, SwipeSide } from "../../types";
import { uiScale } from "../../utils/uiScale";

// ─── DraggableCard ────────────────────────────────────────────

export interface DraggableCardHandle {
  triggerSwipe: (side: SwipeSide) => void;
}

interface DraggableCardProps {
  profile: PatientProfile;
  onSwipe: (side: SwipeSide, elapsedMs: number) => void;
  // Clock edges, with the performance.now() timestamps the card measures
  // elapsedMs from — so the session clock and the speed bonus agree exactly.
  onShown?: (at: number) => void;
  onCommit?: (at: number) => void;
}

const DraggableCard = forwardRef<DraggableCardHandle, DraggableCardProps>(
  ({ profile, onSwipe, onShown, onCommit }, ref) => {
    const x = useMotionValue(0);
    const s = uiScale();
    const rotate = useTransform(x, [-300 * s, 0, 300 * s], [-12, 0, 12]);
    const rightOpacity = useTransform(x, [0, 80 * s, 150 * s], [0, 0.7, 1]);
    const leftOpacity = useTransform(x, [-150 * s, -80 * s, 0], [1, 0.7, 0]);
    const controls = useAnimation();
    // Speed-bonus clock start. The top card is unmounted while the rationale
    // overlay is open and mounts (keyed by profile) the moment it becomes
    // interactive, so mount time IS the "card shown" edge.
    const shownAtRef = useRef(0);
    // An effect event, so the mount effect below stays mount-only: a parent
    // re-render handing down a new callback must not re-stamp the edge.
    const reportShown = useEffectEvent((at: number) => onShown?.(at));
    useEffect(() => {
      const at = performance.now();
      shownAtRef.current = at;
      reportShown(at);
    }, []);

    const commitSwipe = async (side: SwipeSide) => {
      // Clock stops at the commit, before the fly-off animation, so the
      // 300ms animation isn't charged to the player.
      const committedAt = performance.now();
      const elapsedMs = Math.round(committedAt - shownAtRef.current);
      onCommit?.(committedAt);
      const targetX = (side === "right" ? 600 : -600) * uiScale();
      await controls.start({
        x: targetX,
        opacity: 0,
        transition: { duration: 0.3, ease: "easeOut" },
      });
      onSwipe(side, elapsedMs);
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
      } else if (
        info.offset.x / scale < -80 ||
        (flick && info.velocity.x < 0)
      ) {
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
        className="touch-none! absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ x, rotate, willChange: "transform" }}
        animate={controls}
        drag="x"
        dragMomentum={false}
        onDragEnd={handleDragEnd}
      >
        <PatientCard profile={profile} />

        {/* Right-swipe stamp — tinted to match the right (gold) choice button.
            willChange promotes it to its own compositor
            layer: its opacity changes every dragged frame, and without the
            layer that repaint re-rasterizes the whole card — glow shadows
            included — which is what dropped mid-range phones to ~35fps. */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-end justify-center rounded-card bg-gold-accent/25 px-6 pb-6"
          style={{ opacity: rightOpacity, willChange: "opacity" }}
        >
          <span className="font-display text-center text-base leading-tight font-bold tracking-[0.08em] text-gold-accent sm:text-lg">
            {profile.rightOption} →
          </span>
        </motion.div>

        {/* Left-swipe stamp — teal like the left choice button; same layer
            promotion as the right stamp */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-end justify-center rounded-card bg-teal-accent/25 px-6 pb-6"
          style={{ opacity: leftOpacity, willChange: "opacity" }}
        >
          <span className="font-display text-center text-base leading-tight font-bold tracking-[0.08em] text-teal-accent sm:text-lg">
            ← {profile.leftOption}
          </span>
        </motion.div>
      </motion.div>
    );
  },
);
DraggableCard.displayName = "DraggableCard";

// ─── StackSizer ──────────────────────────────────────────────

/* Sizes the stack: every profile's card content laid out invisibly in one
   grid cell, so the box is exactly as tall as the deck's tallest card. The
   cards themselves are absolute (they drag, fly off and fan out), so nothing
   else would give the box a content height, and a fixed height would either
   clip the six-bullet cases or force their type smaller. Laid out once per
   game: memoized on the deck, which is one array per START_GAME. */
const StackSizer = memo(function StackSizer({
  deck,
}: {
  deck: PatientProfile[];
}) {
  return (
    <div className="pointer-events-none invisible grid" aria-hidden>
      {deck.map((profile) => (
        <div
          key={profile.id}
          className="col-start-1 row-start-1 flex flex-col"
        >
          <PatientCardContent profile={profile} />
        </div>
      ))}
    </div>
  );
});

// ─── CardStack ───────────────────────────────────────────────

export interface CardStackHandle {
  triggerSwipe: (side: SwipeSide) => void;
}

interface CardStackProps {
  deck: PatientProfile[];
  currentIndex: number;
  onSwipe: (side: SwipeSide, elapsedMs: number) => void;
  onShown?: (at: number) => void;
  onCommit?: (at: number) => void;
  locked?: boolean;
}

export const CardStack = forwardRef<CardStackHandle, CardStackProps>(
  ({ deck, currentIndex, onSwipe, onShown, onCommit, locked = false }, ref) => {
    const draggableCardRef = useRef<DraggableCardHandle>(null);
    const s = uiScale();

    useImperativeHandle(ref, () => ({
      triggerSwipe: (side) => draggableCardRef.current?.triggerSwipe(side),
    }));

    // Show up to 3 cards: current + next 2 (rendered back to front)
    const visibleProfiles = deck.slice(currentIndex, currentIndex + 3);

    // The box is the tallest card's height (StackSizer) over a floor: the
    // design's 440×480 on md+, and 32rem below md — enough for the rationale
    // overlay (absolute over this box) to show the longest case's three
    // sentence paragraphs without scrolling on a 390px phone.
    return (
      <div className="relative min-h-128 w-76 sm:w-80 md:min-h-120 md:w-110">
        <StackSizer deck={deck} />
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
                onShown={onShown}
                onCommit={onCommit}
              />
            );
          }

          return (
            <motion.div
              key={profile.id}
              className="pointer-events-none absolute inset-0"
              style={{ willChange: "transform, opacity" }}
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
