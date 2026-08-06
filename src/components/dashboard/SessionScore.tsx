import { useGame } from '../../context/GameContext'
import { scoreTotal } from '../../game/scoring'

export function SessionScore() {
  const { state, cases } = useGame()
  const { correct, score } = scoreTotal(cases, state.answers)
  const answered = Object.keys(state.answers).length
  return (
    <div className="shrink-0 border-b border-purple-accent/30 p-4 text-center">
      <p className="mb-3 font-display text-xl font-extrabold uppercase tracking-[0.2em] text-white">This Session</p>
      <div className="flex justify-around">
        <Stat value={score} label="Points" />
        <Stat value={`${correct}/${answered}`} label="Correct" />
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-4xl font-extrabold text-white">{value}</p>
      <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white/60">{label}</p>
    </div>
  )
}
