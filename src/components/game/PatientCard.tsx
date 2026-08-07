import type { PatientProfile } from "../../types";

interface PatientCardProps {
  profile: PatientProfile;
}

export function PatientCard({ profile }: PatientCardProps) {
  return (
    /* Metallic bronze/gold frame — gradient background with padding acts as the border */
    <div
      className="bg-metallic-border relative h-full w-full rounded-xl p-1"
      style={{
        boxShadow:
          "0 0 30px rgba(180,130,0,0.35), 0 0 60px rgba(100,60,0,0.2), inset 0 0 8px rgba(255,200,50,0.1)",
      }}
    >
      {/* Dark interior with subtle grid texture */}
      <div
        className="relative flex h-full w-full flex-col overflow-hidden rounded-[10px]"
        style={{
          background:
            "linear-gradient(160deg, var(--color-dark-800) 0%, var(--color-dark-900) 60%, var(--color-dark-950) 100%)",
          backgroundImage:
            "linear-gradient(160deg, var(--color-dark-800) 0%, var(--color-dark-900) 100%), linear-gradient(rgba(255,190,40,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,190,40,0.04) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 1.5rem 1.5rem, 1.5rem 1.5rem",
        }}
      >
        {/* Cinematic hero — photo and its darkening layer are continuous
            absolute layers (no clipped sub-box), so no half-lit photo row can
            show at the seam. The overlay goes opaque across the image's bottom
            edge, then fades back to transparent so the body keeps its grid. */}
        <img
          src={profile.image}
          alt={profile.ageSex}
          className="pointer-events-none absolute inset-x-0 top-0 h-40 w-full object-cover object-top sm:h-48 md:h-64"
          draggable={false}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, transparent 28%, rgba(13,9,0,0.8) 44%, var(--color-dark-900) 52%)",
          }}
        />

        {/* Age/sex overlaid on the photo */}
        <div className="relative flex h-40 shrink-0 flex-col justify-end p-4 text-center sm:h-48 md:h-64">
          <p
            className="font-display text-gold-500 text-sm font-bold tracking-[0.2em] uppercase md:text-base"
            style={{ textShadow: "0 0 8px rgba(0,0,0,0.9)" }}
          >
            Patient Profile
          </p>
          <p
            className="mt-0.5 text-lg font-black text-white md:text-2xl"
            style={{ textShadow: "0 2px 6px rgba(0,0,0,0.95)" }}
          >
            {profile.ageSex}
          </p>
        </div>

        {/* Body */}
        <div className="relative flex min-h-0 flex-1 flex-col p-4 pt-3">
          {/* Fields */}
          <div className="flex flex-col gap-2.5 md:gap-3">
            {profile.fields.map((field) => (
              <FieldRow
                key={field.label}
                label={field.label}
                value={field.value}
              />
            ))}
          </div>
        </div>

        {/* Glowing bottom bar */}
        <div
          className="absolute right-[15%] bottom-0 left-[15%] h-0.5"
          style={{
            background: "var(--gradient-glow-bar)",
            boxShadow:
              "0 0 8px var(--color-gold-400), 0 0 18px rgba(240,192,64,0.5)",
          }}
        />
      </div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 md:gap-4">
      <span className="font-display text-gold-500 w-28 shrink-0 pr-1 text-xs font-bold tracking-[0.12em] uppercase sm:w-24 md:w-28 md:text-sm">
        {label}
      </span>
      <span className="text-xs leading-snug text-gray-100 md:text-sm">
        {value}
      </span>
    </div>
  );
}
