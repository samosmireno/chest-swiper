import { memo } from "react";
import type { PatientProfile } from "../../types";

interface PatientCardProps {
  profile: PatientProfile;
}

/* Figma "Card Client 2" (node 2004:557, instance 2009:3373) — 400×433 frosted
   charcoal glass with a gold glow ring (see .patient-card in index.css).
   Geometry below is the design's px at a 16px root, expressed in rem so it
   tracks the kiosk root scaling: avatar 110×135 at (31,26), text column at
   x=153 — "PATIENT PROFILE" at y=55, the first name in gold at 87 and the
   age line under it at 111 — bullets from y=178 with 8px gold dots at x=25,
   and the abbreviation key ("footnote case card text", DM Sans 8px) at the
   foot.

   One type size for every card: the deck's longest case (c6, six bullets)
   makes the card taller rather than the copy smaller — the design's Case 12
   frame grows the same way — and CardStack sizes the whole stack to the
   tallest card (see StackSizer), so the layout never shifts between cards.

   Memoized: profiles are static module data, so stack cards skip the
   re-render every SWIPE/ADVANCE dispatch triggers app-wide. */
export const PatientCard = memo(function PatientCard({
  profile,
}: PatientCardProps) {
  return (
    <div className="patient-card flex h-full w-full flex-col">
      <div className="patient-card-glow" aria-hidden />
      <PatientCardContent profile={profile} />
    </div>
  );
});

/* The card's content without the glass shell — what CardStack lays out
   invisibly, once per profile, to size the stack. */
export function PatientCardContent({ profile }: PatientCardProps) {
  return (
    <>
      {/* Header — gradient-framed 4:5 portrait, label + name + age beside
          it. The text column top-aligns 24px below the avatar top (design),
          not centred. Below md the portrait and the two Roboto lines step
          down a size so they still fit beside it on the 304px mobile card. */}
      <div className="relative z-10 flex shrink-0 items-start gap-3 pt-[1.625rem] pr-6 pl-[1.9375rem] max-md:pr-5">
        <div className="bg-avatar-stroke h-[6.75rem] w-22 shrink-0 rounded-[0.875rem] p-[0.1875rem] md:h-[8.4375rem] md:w-[6.875rem]">
          <img
            src={profile.image}
            alt={`${profile.name}, ${profile.ageSex}`}
            className="pointer-events-none h-full w-full rounded-[0.6875rem] object-cover"
            draggable={false}
          />
        </div>
        <div className="min-w-0 flex-1 pt-4 md:pt-6">
          <p className="type-card-label text-gold-accent max-md:text-[0.8125rem]/5 max-md:tracking-[0.1em]">
            Patient Profile
          </p>
          {/* "Card client age Large" twice: the name in gold, the age line in
              off-white directly under it (node I2009:3373;36:669) */}
          <p className="type-card-age text-gold-accent mt-2 max-md:text-lg/6">
            {profile.name}
          </p>
          <p className="type-card-age text-off-white max-md:text-lg/6">
            {profile.ageSex}
          </p>
        </div>
      </div>

      {/* Body — verbatim case bullets, one size for every card, with the
          abbreviation key pinned to the foot (node I2009:3373;2009:2281) */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 pt-4 pr-10 pb-6 pl-[1.5625rem]">
        {profile.bullets.map((bullet) => (
          <BulletRow key={bullet} text={bullet} />
        ))}
        <p className="type-card-footnote text-off-white mt-auto">
          {profile.footnote}
        </p>
      </div>
    </>
  );
}

function BulletRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-[0.4375rem]">
      <span className="bg-gold-accent mt-1 h-2 w-2 shrink-0 rounded-full" />
      <span className="type-card-body text-off-white">{text}</span>
    </div>
  );
}
