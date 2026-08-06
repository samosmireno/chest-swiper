// Shared geometry for the question-screen swiper: option order ↔ cross position,
// drag-direction detection, fly-off targets. Used by SwipeCard + CrossButtons.

export type Pos = 'up' | 'left' | 'right' | 'down'

// Solid triangle glyphs, matching the endo swipe buttons (◄ ►), with ▲ ▼ for up/down.
export const ARROW: Record<Pos, string> = { up: '▲', left: '◄', right: '►', down: '▼' }

// Tint color per option index (matches the .btn-3d palette mids below).
export const POS_TINT = ['#3b82f6', '#a855f7', '#e879f9', '#f59e0b']
export const PALETTE = ['btn-3d-blue', 'btn-3d-purple', 'btn-3d-magenta', 'btn-3d-amber']

// Option order → cross positions. 2:[L,R] 3:[U,L,R] 4:[U,L,R,D].
export function positionsFor(count: number): Pos[] {
  if (count <= 2) return ['left', 'right']
  if (count === 3) return ['up', 'left', 'right']
  return ['up', 'left', 'right', 'down']
}

export const isOutward = (pos: Pos) => pos === 'right' || pos === 'down'

const SWIPE_THRESHOLD = 70
const FLICK_VELOCITY = 500

export function dominantDir(x: number, y: number): Pos | null {
  if (Math.abs(x) < SWIPE_THRESHOLD && Math.abs(y) < SWIPE_THRESHOLD) return null
  if (Math.abs(x) >= Math.abs(y)) return x > 0 ? 'right' : 'left'
  return y > 0 ? 'down' : 'up'
}

// A fast flick commits even when the drag distance is short (endo-style throw).
export function flickDir(vx: number, vy: number): Pos | null {
  if (Math.abs(vx) < FLICK_VELOCITY && Math.abs(vy) < FLICK_VELOCITY) return null
  if (Math.abs(vx) >= Math.abs(vy)) return vx > 0 ? 'right' : 'left'
  return vy > 0 ? 'down' : 'up'
}

export function flyOffTarget(pos: Pos): { x: number; y: number } {
  switch (pos) {
    case 'left':
      return { x: -700, y: 0 }
    case 'right':
      return { x: 700, y: 0 }
    case 'up':
      return { x: 0, y: -600 }
    case 'down':
      return { x: 0, y: 600 }
  }
}

// Per-question uniform button sizing, derived from the longest label so short-label
// questions (Stage-type) get compact buttons while c2q2's long labels keep room.
export function crossSizing(options: { label: string }[]): {
  width: string
  height: string
  font: string
} {
  const maxLen = Math.max(...options.map((o) => o.label.length))
  if (maxLen > 32) return { width: 'w-52', height: 'h-24 short:h-20 shorter:h-16', font: 'text-base' }
  if (maxLen > 16) return { width: 'w-40', height: 'h-16 short:h-14 shorter:h-13', font: 'text-base' }
  return { width: 'w-36', height: 'h-14 short:h-12 shorter:h-11', font: 'text-lg' }
}
