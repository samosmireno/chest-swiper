import type { AnswerOption } from '../../types'
import { ARROW, PALETTE, crossSizing, positionsFor, type Pos } from './cross'

interface CrossButtonsProps {
  options: AnswerOption[]
  correctOptionId: string
  chosenOptionId: string | null // null = not answered yet
  activePos: Pos | null // highlighted by an in-flight card drag
  onChoose: (optionId: string) => void
}

// Compact d-pad: up / [left · right] / down, hugging a small center. Each button
// carries an outward arrow (↑/←/→/↓) marking its swipe direction; on answer the
// arrow becomes its ✓/✗ verdict mark. Buttons share a per-question size.
export function CrossButtons({
  options,
  correctOptionId,
  chosenOptionId,
  activePos,
  onChoose,
}: CrossButtonsProps) {
  const answered = chosenOptionId !== null
  const positions = positionsFor(options.length)
  const indexByPos = new Map<Pos, number>(positions.map((p, i) => [p, i]))
  const { width, height, font } = crossSizing(options)
  const has = (pos: Pos) => indexByPos.has(pos)

  const renderButton = (pos: Pos) => {
    const idx = indexByPos.get(pos)!
    const opt = options[idx]
    const isCorrect = opt.id === correctOptionId
    const isChosen = opt.id === chosenOptionId
    let colorClass = PALETTE[idx % PALETTE.length]
    if (answered) colorClass = isCorrect ? 'btn-3d-green' : isChosen ? 'btn-3d-red' : 'btn-3d-muted'
    const popClass = answered && (isCorrect || isChosen) ? 'btn-3d-pop' : ''
    const highlightClass = !answered && activePos === pos ? 'scale-[1.06] ring-2 ring-white/70' : ''

    return (
      <button
        key={pos}
        type="button"
        disabled={answered}
        onClick={() => onChoose(opt.id)}
        className={`btn-3d ${colorClass} ${popClass} ${highlightClass} ${width} ${height} ${font} font-display flex cursor-pointer items-center justify-center px-3 text-center leading-tight font-black text-white transition-transform outline-none focus:outline-none disabled:cursor-default`}
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.55)' }}
      >
        {answered ? (
          <>
            {isCorrect && <span className="mr-1">✓</span>}
            {isChosen && !isCorrect && <span className="mr-1">✗</span>}
            {opt.label}
          </>
        ) : (
          <>
            {pos !== 'right' && <span className="mr-1.5 opacity-90">{ARROW[pos]}</span>}
            {opt.label}
            {pos === 'right' && <span className="ml-1.5 opacity-90">{ARROW[pos]}</span>}
          </>
        )}
      </button>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 shorter:gap-1.5">
      {has('up') && renderButton('up')}
      {(has('left') || has('right')) && (
        <div className="flex items-center gap-2 shorter:gap-1.5">
          {has('left') && renderButton('left')}
          {has('right') && renderButton('right')}
        </div>
      )}
      {has('down') && renderButton('down')}
    </div>
  )
}
