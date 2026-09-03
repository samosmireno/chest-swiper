import { memo } from "react";
import type { PatientProfile, ProfileField } from "../../types";

interface PatientCardProps {
  profile: PatientProfile;
}

/* Figma "Card Client" (node 36:802, instance 41:1073) — 400×433 frosted
   charcoal glass with a gold glow ring (see .patient-card in index.css).
   Geometry below is the design's px at a 16px root, expressed in rem so it
   tracks the kiosk root scaling: avatar 110×135 at (31,26), text column at
   x=153, bullets from y=178 with 8px gold dots at x=25.

   The design's body is a list of verbatim bullets; this deck's cases are
   label/value fields (History, Treatment, Labs…), so each field takes one
   bullet row with its label set as a gold semibold run of the body face
   ahead of the value.

   Memoized: profiles are static module data, so stack cards skip the
   re-render every SWIPE/ADVANCE dispatch triggers app-wide. */
export const PatientCard = memo(function PatientCard({
  profile,
}: PatientCardProps) {
  return (
    <div className="patient-card flex h-full w-full flex-col">
      <div className="patient-card-glow" aria-hidden />
      {/* Header — gradient-framed 4:5 portrait, label + age beside it. The
          text column top-aligns 24px below the avatar top (design), not
          centred. Below md the portrait and age step down a size so the age line
          still fits beside it on the 304px mobile card. */}
      <div className="relative z-10 flex shrink-0 items-start gap-3 pt-[1.625rem] pr-6 pl-[1.9375rem] max-md:pr-5">
        <div className="bg-avatar-stroke h-[6.75rem] w-22 shrink-0 rounded-[0.875rem] p-[0.1875rem] md:h-[8.4375rem] md:w-[6.875rem]">
          <img
            src={profile.image}
            alt={profile.ageSex}
            className="pointer-events-none h-full w-full rounded-[0.6875rem] object-cover"
            draggable={false}
          />
        </div>
        <div className="min-w-0 flex-1 pt-4 md:pt-6">
          <p className="type-card-label text-gold-accent max-md:text-[0.8125rem]/5 max-md:tracking-[0.1em]">
            Patient Profile
          </p>
          <p className="type-card-age text-off-white mt-2 max-md:text-lg/6">
            {profile.ageSex}
          </p>
        </div>
      </div>

      {/* Body — one bullet row per field, one size for every card */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 pt-4 pr-10 pb-6 pl-[1.5625rem]">
        {profile.fields.map((field) => (
          <FieldRow key={field.label} field={field} />
        ))}
      </div>
    </div>
  );
});

function FieldRow({ field }: { field: ProfileField }) {
  return (
    <div className="flex items-start gap-[0.4375rem]">
      <span className="bg-gold-accent mt-1 h-2 w-2 shrink-0 rounded-full" />
      <span className="type-card-body text-off-white">
        <span className="text-gold-accent font-semibold">{field.label}: </span>
        {field.value}
      </span>
    </div>
  );
}
