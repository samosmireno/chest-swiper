import { motion } from 'framer-motion'

interface FeedbackBannerProps {
  correct: boolean
  points: number
  speedBonus: number
  isLastInCase: boolean
  onContinue: () => void
}

// Fills the slot the card flew out of: verdict + Continue.
export function FeedbackBanner({ correct, points, speedBonus, isLastInCase, onContinue }: FeedbackBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="bg-panel/85 flex h-full w-full flex-col items-center justify-center gap-5 rounded-xl border border-white/10 p-6 text-center"
    >
      <div className="flex flex-col items-center gap-1">
        <p
          className={`font-display text-3xl font-extrabold tracking-wide uppercase ${
            correct ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {correct ? `Correct +${points}` : 'Not quite'}
        </p>
        {correct && speedBonus > 0 && (
          <p className="font-display text-gold-400 text-lg font-bold tracking-wide">
            +{speedBonus} speed
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="font-display text-dark-900 cursor-pointer rounded-full px-8 py-2.5 text-sm font-bold tracking-widest uppercase shadow-lg transition-transform active:scale-[0.98]"
        style={{ background: 'var(--gradient-btn-gold)' }}
      >
        {isLastInCase ? 'Continue to discussion' : 'Continue'}
      </button>
    </motion.div>
  )
}
