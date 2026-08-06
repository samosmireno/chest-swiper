import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "../context/GameContext";
import { useAnalytics } from "../hooks/useAnalytics";
import { shuffle } from "../utils/shuffle";
import type { PatientProfile } from "../types";

const STACK_STYLES = [
  { rotate: 0, x: 0, opacity: 1 },
  { rotate: -5, x: -10, opacity: 0.55 },
  { rotate: -12, x: -20, opacity: 0.3 },
  { rotate: -18, x: -30, opacity: 0 },
];

function MiniCard({ profile }: { profile: PatientProfile }) {
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[13px]"
      style={{ background: "var(--color-dark-900)" }}
    >
      {/* Photo and its darkening layer are continuous absolute layers — no box
          seam between image and body, so no half-lit photo row can show. */}
      <img
        src={profile.image}
        alt={profile.ageSex}
        className="pointer-events-none absolute inset-x-0 top-0 h-40 w-full object-cover object-top"
        draggable={false}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 24%, rgba(13,9,0,0.85) 42%, var(--color-dark-900) 50%, var(--color-dark-900) 100%)",
        }}
      />

      <div className="relative flex h-40 shrink-0 flex-col justify-end p-3 text-center">
        <p
          className="text-gold-500 text-[10px] font-semibold tracking-[0.2em] uppercase"
          style={{ textShadow: "0 0 8px rgba(0,0,0,0.9)" }}
        >
          Patient Profile
        </p>
        <p
          className="text-sm font-bold text-gray-100"
          style={{ textShadow: "0 2px 6px rgba(0,0,0,0.95)" }}
        >
          {profile.ageSex}
        </p>
      </div>

      <div className="relative min-h-0 flex-1 p-4">
        <div className="space-y-1.5">
          {profile.fields.slice(0, 2).map((field) => (
            <div key={field.label}>
              <p className="text-gold-500 text-[9px] font-semibold tracking-[0.15em] uppercase">
                {field.label}
              </p>
              <p className="line-clamp-2 text-xs text-gray-300">
                {field.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StackCard {
  id: number;
  profileIdx: number;
}

export function AttractScreen() {
  const { dispatch, profiles } = useGame();
  const { trackGameStarted } = useAnalytics();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [otherText, setOtherText] = useState("");

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

  const SPECIALTIES = [
    "Adult/general endocrinology or diabetology",
    "Pediatric endocrinology or diabetology",
    "Primary Care, Family Medicine, or Internal Medicine",
    "Diabetes educator / CDCES",
    "Other",
  ];

  const specialtyValue =
    specialty === "Other"
      ? otherText.trim()
        ? `Other: ${otherText.trim()}`
        : ""
      : specialty;

  const canStart =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    specialtyValue !== "";

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!canStart) return;
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();
    dispatch({
      type: "SET_PLAYER",
      firstName: trimmedFirst,
      lastName: trimmedLast,
      email: trimmedEmail,
      specialty: specialtyValue,
    });
    dispatch({ type: "START_GAME", deck: shuffle(profiles) });
    trackGameStarted(`${trimmedFirst} ${trimmedLast}`, trimmedEmail.length > 0);
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-start gap-8 overflow-y-auto px-6 py-10 sm:justify-center sm:flex-row sm:gap-16 sm:px-16 sm:py-0">
      {/* Animated card fan */}
      <div className="relative hidden h-72 w-56 shrink-0 sm:block sm:h-80 sm:w-60">
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
                {/* Bob wrapper contains ALL visuals so border + shadow bob together */}
                <motion.div
                  className="bg-metallic-border absolute inset-0 rounded-2xl p-0.75"
                  animate={isFront ? { y: [0, -8, 0] } : { y: 0 }}
                  transition={
                    isFront
                      ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                      : { type: "spring", stiffness: 300, damping: 25 }
                  }
                  style={{
                    boxShadow:
                      "0 0 24px rgba(180,130,0,0.3), 0 0 48px rgba(100,60,0,0.15)",
                  }}
                >
                  <div
                    className="h-full w-full rounded-[13px]"
                    style={{
                      background:
                        "linear-gradient(160deg, var(--color-dark-800) 0%, var(--color-dark-900) 60%, var(--color-dark-950) 100%)",
                    }}
                  >
                    {isFront ? (
                      <MiniCard profile={profile} />
                    ) : stackPos === 1 ? (
                      <div className="h-full w-full p-5">
                        <p className="text-gold-500 text-[10px] font-semibold tracking-[0.2em] uppercase">
                          Patient Profile
                        </p>
                        <p className="mt-1 text-sm font-bold text-gray-400">
                          {profile.ageSex}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Title + how-to-play + form — contained panel */}
      <div
        className="bg-panel/90 border-purple-accent/40 flex w-full max-w-md flex-col items-center gap-6 rounded-3xl border px-7 py-8 text-center backdrop-blur-lg sm:gap-7"
        style={{
          boxShadow:
            "0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
        }}
      >
        <h1
          className="font-display text-3xl leading-tight font-black text-white sm:text-4xl"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}
        >
          Swipe or Miss:
          <br />
          T1D Decisions
        </h1>

        {/* How-to-play */}
        <div className="w-full rounded-2xl px-4 py-2 text-left">
          <p className="text-gold-500 mb-2.5 text-sm font-semibold tracking-[0.18em] uppercase">
            How to Play
          </p>
          <div className="flex flex-col gap-2.5">
            {[
              "Read the patient's profile card",
              "What is your next clinical action?",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="bg-purple-accent/30 border-purple-accent/60 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold text-purple-300">
                  {i + 1}
                </span>
                <span className="text-sm leading-snug text-white/75">
                  {text}
                </span>
              </div>
            ))}
            <div className="flex items-start gap-2.5">
              <span className="bg-purple-accent/30 border-purple-accent/60 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold text-purple-300">
                3
              </span>
              <div className="flex w-full flex-col gap-1">
                <span className="text-sm leading-snug text-white/70">
                  Swipe or tap to choose
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Player entry form */}
        <form onSubmit={handleStart} className="flex w-full flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              required
              autoComplete="off"
              className="border-purple-accent/55 min-w-0 flex-1 rounded-full border-[1.5px] bg-white/10 px-5 py-3 text-sm text-white transition-colors duration-150 outline-none placeholder:text-white/45"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(155,48,255,1)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(155,48,255,0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(155,48,255,0.55)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              required
              autoComplete="off"
              className="border-purple-accent/55 min-w-0 flex-1 rounded-full border-[1.5px] bg-white/10 px-5 py-3 text-sm text-white transition-colors duration-150 outline-none placeholder:text-white/45"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(155,48,255,1)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(155,48,255,0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(155,48,255,0.55)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional)"
            autoComplete="off"
            className="border-purple-accent/55 rounded-full border-[1.5px] bg-white/10 px-5 py-3 text-sm text-white transition-colors duration-150 outline-none placeholder:text-white/45"
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(155,48,255,1)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(155,48,255,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(155,48,255,0.55)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />

          {/* Specialty selection */}
          <div className="border-purple-accent/30 flex flex-col gap-1.5 rounded-2xl border bg-white/5 px-4 py-3 text-left">
            <p className="text-gold-500 mb-0.5 text-[10px] font-semibold tracking-[0.18em] uppercase">
              What is your specialty?
            </p>
            {SPECIALTIES.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-start gap-2.5"
              >
                <input
                  type="radio"
                  name="specialty"
                  value={option}
                  checked={specialty === option}
                  onChange={() => setSpecialty(option)}
                  className="accent-purple-500 mt-0.5 shrink-0"
                />
                <span className="text-xs leading-snug text-white/80">{option}</span>
              </label>
            ))}
            <AnimatePresence>
              {specialty === "Other" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <input
                    type="text"
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    placeholder="Please indicate your specialty"
                    autoComplete="off"
                    className="border-purple-accent/55 mt-1.5 w-full rounded-full border-[1.5px] bg-white/10 px-4 py-2 text-xs text-white outline-none placeholder:text-white/40"
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(155,48,255,1)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(155,48,255,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(155,48,255,0.55)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-[10px] leading-relaxed text-white/45">
            By entering your email you consent to your data being collected for
            research purposes.
          </p>
          <button
            type="submit"
            disabled={!canStart}
            className="font-display cursor-pointer rounded-full px-12 py-3 text-[0.95rem] font-black tracking-[0.22em] text-white uppercase transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              background: "var(--gradient-btn-gold)",
              boxShadow:
                "0 0 24px rgba(245,200,66,0.5), 0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            Start
          </button>
        </form>
      </div>
    </div>
  );
}
