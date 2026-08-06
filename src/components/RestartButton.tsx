import { useState } from "react"
import { ConfirmModal } from "./ConfirmModal"
import { useGame } from "../context/GameContext"

export function RestartButton({ onRestart }: { onRestart: () => void }) {
  const { state } = useGame()
  const [confirming, setConfirming] = useState(false)

  // On the summary the case is already finished and recorded, so restarting is
  // a non-destructive "go again". Mid-case it discards unsaved answers.
  const onSummary = state.steps[state.cursor].kind === "summary"
  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label="Restart"
        className="bg-panel/80 border-purple-accent/55 text-gold-400 font-display fixed top-3 left-3 z-50 flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-black tracking-[0.18em] uppercase backdrop-blur-lg transition-transform active:scale-95 lg:top-5 lg:left-5 lg:gap-2.5 lg:px-6 lg:py-3 lg:text-sm"
        style={{
          boxShadow: "0 0 16px rgba(155,48,255,0.3), 0 4px 12px rgba(0,0,0,0.4)",
        }}
      >
        <span className="text-lg leading-none">↻</span>
        Restart
      </button>
      <ConfirmModal
        open={confirming}
        title={onSummary ? "Back to start?" : "Start over?"}
        message={
          onSummary
            ? "This returns to the team name and case selection screen to play again."
            : "This clears this case's answers and returns to the team name and case selection screen."
        }
        confirmLabel={onSummary ? "Back to start" : "Restart"}
        cancelLabel={onSummary ? "Stay here" : "Keep playing"}
        destructive={!onSummary}
        onConfirm={onRestart}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}
