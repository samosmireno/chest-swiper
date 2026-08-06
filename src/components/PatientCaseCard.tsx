interface PatientCaseCardProps {
  name: string
  ageSex?: string
  image?: string
  narrative: string[]
}

// Endo-style framed patient card chrome, with the case narrative as the body.
export function PatientCaseCard({ name, ageSex, image, narrative }: PatientCaseCardProps) {
  return (
    <div
      className="bg-metallic-border relative h-full w-full rounded-xl p-1"
      style={{
        boxShadow:
          '0 0 30px rgba(180,130,0,0.35), 0 0 60px rgba(100,60,0,0.2), inset 0 0 8px rgba(255,200,50,0.1)',
      }}
    >
      <div
        className="relative flex h-full w-full flex-col overflow-hidden rounded-[10px]"
        style={{
          background:
            'linear-gradient(160deg, var(--color-dark-800) 0%, var(--color-dark-900) 60%, var(--color-dark-950) 100%)',
          backgroundImage:
            'linear-gradient(160deg, var(--color-dark-800) 0%, var(--color-dark-900) 100%), linear-gradient(rgba(255,190,40,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,190,40,0.04) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 24px 24px, 24px 24px',
        }}
      >
        {/* Photo hero — continuous absolute layers so no seam shows */}
        {image ? (
          <>
            <img
              src={image}
              alt={name}
              className="pointer-events-none absolute inset-x-0 top-0 h-56 w-full object-cover object-top short:h-40 shorter:h-36"
              draggable={false}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, transparent 120px, rgba(13,9,0,0.8) 188px, var(--color-dark-900) 224px)',
              }}
            />
          </>
        ) : (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 flex h-56 items-center justify-center short:h-40 shorter:h-36"
            style={{ background: 'linear-gradient(160deg, var(--color-dark-700, #2a1a00), var(--color-dark-900))' }}
          >
            <span className="font-display text-gold-500/40 text-7xl font-black shorter:text-6xl">{name.charAt(0)}</span>
          </div>
        )}

        {/* Name + age/sex overlaid on the hero */}
        <div className="relative flex h-56 shrink-0 flex-col justify-end p-4 text-center short:h-40 shorter:h-36 shorter:p-3">
          <p
            className="font-display text-gold-500 text-sm font-bold tracking-[0.2em] uppercase"
            style={{ textShadow: '0 0 8px rgba(0,0,0,0.9)' }}
          >
            Patient Profile
          </p>
          <p className="mt-0.5 text-2xl font-black text-white shorter:text-xl" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.95)' }}>
            {name}
          </p>
          {ageSex && (
            <p className="text-sm font-semibold text-white/70" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.95)' }}>
              {ageSex}
            </p>
          )}
        </div>

        {/* Narrative body — only this scrolls if a case ever overflows */}
        <div className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-5 pt-3 text-left short:gap-2 short:p-4 short:pt-2 shorter:text-xs">
          {narrative.map((line, i) => (
            <p key={i} className="text-sm leading-relaxed text-gray-200 shorter:text-xs shorter:leading-snug">
              {line}
            </p>
          ))}
        </div>

        {/* Glowing bottom bar */}
        <div
          className="absolute right-[15%] bottom-0 left-[15%] h-0.5"
          style={{
            background: 'var(--gradient-glow-bar)',
            boxShadow: '0 0 8px var(--color-gold-400), 0 0 18px rgba(240,192,64,0.5)',
          }}
        />
      </div>
    </div>
  )
}
