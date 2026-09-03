import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface PlayerEntry {
  firstName: string;
  lastName: string;
  email: string;
  specialty: string;
}

interface EntryPanelProps {
  onStart: (player: PlayerEntry) => void;
}

const HOW_TO_PLAY = [
  "Read the patient’s profile card",
  "What is your next clinical action?",
  "Swipe or tap to choose",
];

const SPECIALTIES = [
  { value: "Allergy/Immunology", label: "Allergy/Immunology" },
  { value: "Pediatrics", label: "Pediatrics" },
  {
    value: "Primary Care, Family Medicine, or Internal Medicine",
    label: "Primary Care, Family Medicine, or Internal Medicine",
  },
  { value: "Pulmonology", label: "Pulmonology" },
  { value: "Advanced Practice Provider", label: "Advanced Practice Provider" },
  { value: "Other", label: "Other (please indicate)" },
];

/* Attract-screen entry panel — Figma "Card 2" (node 32:117), 402×597.
   Teal glass slab (.entry-panel) holding the title, how-to-play list, player
   form and CTA. All spacing is the design's px expressed in rem so the panel
   scales with the kiosk root font-size:

     top 36 · title BC Bold 32/33 · 30 · HOW TO PLAY 16/26 · 4 · 3 rows 16/24
     (gap 4) · 24 · names 40 · 16 · email 40 · 16 · specialty 127 · 8 ·
     consent 8/24 · 8 · CTA 49 · bottom 36  = 597

   This project's title runs to two lines and its specialty list to six
   rows, so the panel stands ~80px taller than the frame; the attract
   screen scrolls if a viewport is ever too short for it. */
export function EntryPanel({ onStart }: EntryPanelProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [otherText, setOtherText] = useState("");

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canStart) return;
    onStart({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      specialty: specialtyValue,
    });
  }

  return (
    <div className="entry-panel w-full max-w-[25.125rem] px-6 pt-9 pb-9">
      {/* "Card title" (.type-card-title), off-white */}
      <h1 className="type-card-title text-off-white text-center">
        Swipe or Miss:
        <br />
        Asthma &amp; COPD Decisions
      </h1>

      {/* How-to-play — heading inset 9px, steps inset 13px from the field edge */}
      <div className="mt-[1.875rem]">
        <p className="type-card-label text-gold-accent pl-[0.5625rem] leading-[1.625rem]">
          How to Play
        </p>
        <ol className="mt-1 flex flex-col gap-1 pl-[0.8125rem]">
          {HOW_TO_PLAY.map((text, i) => (
            <li key={text} className="flex items-start gap-2">
              <span className="step-badge mt-1" aria-hidden>
                {i + 1}
              </span>
              <span className="font-dm-sans text-base/6 text-white">{text}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Player entry form */}
      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col"
        noValidate
      >
        {/* Names: 160 + 16 + 178 in the design; stacked below sm */}
        <div className="flex flex-col gap-4 sm:grid sm:grid-cols-[10rem_minmax(0,1fr)]">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            aria-label="First name"
            required
            autoComplete="off"
            className="entry-field"
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            aria-label="Last name"
            required
            autoComplete="off"
            className="entry-field"
          />
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (optional)"
          aria-label="Email (optional)"
          autoComplete="off"
          className="entry-field mt-4"
        />

        {/* Specialty — Figma "What is your specialty" (node 16:806), 354×127 */}
        <fieldset className="border-mid-teal mt-4 rounded-lg border-[1.5px] px-[0.9375rem] pt-[0.6875rem] pb-[1.0625rem]">
          <legend className="sr-only">What is your specialty?</legend>
          <p
            className="font-dm-sans text-gold-accent text-xs/4 font-semibold tracking-[0.125rem] uppercase"
            aria-hidden
          >
            What is your specialty?
          </p>
          <div className="mt-[0.1875rem] flex flex-col gap-[0.375rem]">
            {SPECIALTIES.map(({ value, label }) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-[0.5625rem] pl-px"
              >
                <input
                  type="radio"
                  name="specialty"
                  value={value}
                  checked={specialty === value}
                  onChange={() => setSpecialty(value)}
                  className="radio-dot"
                />
                <span className="font-dm-sans text-xs/4 text-white">{label}</span>
              </label>
            ))}
          </div>
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
                  aria-label="Please indicate your specialty"
                  autoComplete="off"
                  className="entry-field mt-2 h-8 text-xs/4"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </fieldset>

        {/* Consent — DM Sans 8/24, white, centred */}
        <p className="font-dm-sans mt-2 text-center text-[0.5rem]/4 text-white sm:leading-6">
          By entering your email you consent to your data being collected for
          research purposes.
        </p>

        {/* "Buttons Gold" instance scaled to 0.84: Roboto 21.9/18.5, 54×15 pad */}
        <button
          type="submit"
          disabled={!canStart}
          className="btn-gold mt-2 max-w-full self-center px-6 py-[0.9375rem] text-[1.375rem]/[1.1875rem] sm:px-[3.375rem]"
        >
          Let’s get started
        </button>
      </form>
    </div>
  );
}
