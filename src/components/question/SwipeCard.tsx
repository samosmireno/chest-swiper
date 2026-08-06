import { forwardRef, useImperativeHandle, useState } from 'react'
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimationControls,
  useReducedMotion,
  type PanInfo,
} from 'framer-motion'
import type { AnswerOption } from '../../types'
import {
  ARROW,
  POS_TINT,
  dominantDir,
  flickDir,
  flyOffTarget,
  isOutward,
  positionsFor,
  type Pos,
} from './cross'

export interface SwipeCardHandle {
  // Fly the card off toward a position and register that option (used by button taps).
  commit: (pos: Pos) => void
}

interface SwipeCardProps {
  patientName: string
  ageSex?: string
  image?: string
  labs: string[] // q.context, or the intro narrative when a question has none
  options: AnswerOption[]
  onActivePosChange: (pos: Pos | null) => void
  onCommit: (optionId: string) => void
}

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(function SwipeCard(
  { patientName, ageSex, image, labs, options, onActivePosChange, onCommit },
  ref,
) {
  const positions = positionsFor(options.length)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  // Card leans into a horizontal drag, endo-style; vertical drags stay upright.
  const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12])
  const controls = useAnimationControls()
  const reduceMotion = useReducedMotion()
  const [drag, setDrag] = useState<{ pos: Pos | null; t: number }>({ pos: null, t: 0 })
  const [committed, setCommitted] = useState(false)

  async function commit(pos: Pos) {
    const idx = positions.indexOf(pos)
    if (idx === -1 || committed) return
    setCommitted(true)
    setDrag({ pos: null, t: 0 })
    onActivePosChange(null)
    if (!reduceMotion) {
      await controls.start({
        ...flyOffTarget(pos),
        opacity: 0,
        transition: { duration: 0.32, ease: 'easeOut' },
      })
    }
    onCommit(options[idx].id)
  }

  useImperativeHandle(ref, () => ({ commit }))

  function handleDrag(_e: unknown, info: PanInfo) {
    if (committed) return
    const dir = dominantDir(info.offset.x, info.offset.y)
    const active = dir && positions.includes(dir) ? dir : null
    const mag = Math.max(Math.abs(info.offset.x), Math.abs(info.offset.y))
    setDrag({ pos: active, t: active ? Math.min(mag / 150, 1) : 0 })
    onActivePosChange(active)
  }

  function handleDragEnd(_e: unknown, info: PanInfo) {
    if (committed) return
    // Commit on distance, or on a fast flick even when the drag was short.
    const dir =
      dominantDir(info.offset.x, info.offset.y) ?? flickDir(info.velocity.x, info.velocity.y)
    if (dir && positions.includes(dir)) {
      void commit(dir)
    } else {
      setDrag({ pos: null, t: 0 })
      onActivePosChange(null)
      controls.start({ x: 0, y: 0, transition: { type: 'spring', stiffness: 380, damping: 30 } })
    }
  }

  // Endo-style drag readout: tint color + "direction + answer" for the active drag.
  const readout = (() => {
    if (!drag.pos) return null
    const oi = positions.indexOf(drag.pos)
    const label = options[oi].label
    return {
      color: POS_TINT[oi % POS_TINT.length],
      text: isOutward(drag.pos) ? `${label} ${ARROW[drag.pos]}` : `${ARROW[drag.pos]} ${label}`,
    }
  })()

  return (
    <motion.div
      className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing"
      style={{ x, y, rotate, willChange: 'transform' }}
      animate={controls}
      drag={!committed}
      dragSnapToOrigin={false}
      dragElastic={0.25}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
    >
      <CompactCaseCard name={patientName} ageSex={ageSex} image={image} labs={labs} />

      {readout && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
          <div
            className="absolute inset-0"
            style={{ background: readout.color, opacity: 0.14 + drag.t * 0.34 }}
          />
          <div
            className="absolute inset-x-0 bottom-0 flex items-end justify-center p-4"
            style={{ opacity: 0.35 + drag.t * 0.65 }}
          >
            <span
              className="font-display rounded-full px-4 py-1.5 text-center text-base leading-tight font-black text-white"
              style={{ background: 'rgba(0,0,0,0.6)', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
            >
              {readout.text}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
})

// Compact framed card: small photo/name hero + labs (or patient recap) body.
function CompactCaseCard({
  name,
  ageSex,
  image,
  labs,
}: {
  name: string
  ageSex?: string
  image?: string
  labs: string[]
}) {
  return (
    <div
      className="bg-metallic-border relative h-full w-full rounded-xl p-1 select-none"
      style={{ boxShadow: '0 0 30px rgba(180,130,0,0.35), 0 0 60px rgba(100,60,0,0.2)' }}
    >
      <div
        className="relative flex h-full w-full flex-col overflow-hidden rounded-[10px]"
        style={{
          background:
            'linear-gradient(160deg, var(--color-dark-800) 0%, var(--color-dark-900) 60%, var(--color-dark-950) 100%)',
        }}
      >
        {image ? (
          <>
            <img
              src={image}
              alt={name}
              className="pointer-events-none absolute inset-x-0 top-0 h-44 w-full object-cover object-top short:h-32 shorter:h-28"
              draggable={false}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, transparent 104px, rgba(13,9,0,0.85) 150px, var(--color-dark-900) 176px)',
              }}
            />
          </>
        ) : (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 flex h-44 items-center justify-center short:h-32 shorter:h-28"
            style={{ background: 'linear-gradient(160deg, var(--color-dark-700, #2a1a00), var(--color-dark-900))' }}
          >
            <span className="font-display text-gold-500/40 text-6xl font-black shorter:text-5xl">{name.charAt(0)}</span>
          </div>
        )}

        <div className="relative flex h-44 shrink-0 flex-col justify-end p-4 text-center short:h-32 shorter:h-28 shorter:p-3">
          <p
            className="font-display text-gold-500 text-xs font-bold tracking-[0.2em] uppercase"
            style={{ textShadow: '0 0 8px rgba(0,0,0,0.9)' }}
          >
            Patient Profile
          </p>
          <p className="text-lg font-black text-white shorter:text-base" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.95)' }}>
            {name}
            {ageSex ? ` · ${ageSex}` : ''}
          </p>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-5 pt-3 text-left short:gap-1.5 short:p-4 short:pt-2 shorter:gap-1 shorter:p-3 shorter:pt-2">
          {labs.map((line, i) => (
            <p key={i} className="text-sm leading-snug text-gray-200 shorter:text-xs">
              • {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
