import { Component, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { GameProvider, useGame } from './context/GameContext'
import { cases } from './data/cases'
import { LandingScreen } from './components/LandingScreen'
import { caseIdFromParam } from './url'
import type { Identity, SummitCase } from './types'
import { CaseIntroScreen } from './components/CaseIntroScreen'
import { QuestionScreen } from './components/QuestionScreen'
import { DiscussionScreen } from './components/DiscussionScreen'
import { SummaryScreen } from './components/SummaryScreen'
import { RestartButton } from './components/RestartButton'
import { useKioskScale } from './hooks/useKioskScale'
import { KIOSK_DESIGN_W, KIOSK_DESIGN_H } from './config'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-white">
          <p className="text-lg font-bold text-gray-900">Something went wrong.</p>
          <button
            className="rounded-full bg-gray-900 px-8 py-2 text-sm font-bold uppercase tracking-widest text-white"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const transition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 },
}

function Router() {
  const { state } = useGame()
  const step = state.steps[state.cursor]
  return (
    <AnimatePresence mode="wait">
      <motion.div key={`${step.kind}-${state.cursor}`} className="h-full w-full" {...transition}>
        {step.kind === 'intro' && <CaseIntroScreen caseIndex={step.caseIndex} />}
        {step.kind === 'question' && (
          <QuestionScreen caseIndex={step.caseIndex} questionIndex={step.questionIndex} />
        )}
        {step.kind === 'discussion' && <DiscussionScreen caseIndex={step.caseIndex} />}
        {step.kind === 'summary' && <SummaryScreen />}
      </motion.div>
    </AnimatePresence>
  )
}

function BackgroundVideo() {
  return (
    <video
      className="absolute inset-0 h-full w-full object-cover"
      src="./bg_video.mp4"
      poster="./bg_fallback.jpg"
      autoPlay
      muted
      loop
      playsInline
    />
  )
}

type Selection = { case: SummitCase; identity: Identity }

function Content() {
  const [selection, setSelection] = useState<Selection | null>(null)
  const preselectedCaseId = useMemo(() => caseIdFromParam(window.location.search), [])

  return (
    <>
      <BackgroundVideo />
      <div
        className="pointer-events-none absolute inset-0 z-3"
        style={{ background: 'var(--gradient-overlay)' }}
        aria-hidden
      />
      <div className="relative z-10 h-full w-full">
        <AnimatePresence mode="wait">
          {selection === null ? (
            <motion.div key="landing" className="h-full w-full" {...transition}>
              <LandingScreen
                cases={cases}
                preselectedCaseId={preselectedCaseId}
                onStart={(selectedCase, identity) => setSelection({ case: selectedCase, identity })}
              />
            </motion.div>
          ) : (
            <motion.div key="game" className="h-full w-full" {...transition}>
              <GameProvider
                key={selection.case.id}
                cases={[selection.case]}
                initialIdentity={selection.identity}
              >
                <RestartButton onRestart={() => setSelection(null)} />
                <Router />
              </GameProvider>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

function App() {
  const scale = useKioskScale()
  if (scale === null) {
    return (
      <ErrorBoundary>
        <div className="relative h-screen w-screen overflow-hidden">
          <Content />
        </div>
      </ErrorBoundary>
    )
  }
  return (
    <ErrorBoundary>
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-black">
        <MotionConfig transformPagePoint={(p) => ({ x: p.x / scale, y: p.y / scale })}>
          <div
            className="relative shrink-0 origin-center overflow-hidden"
            style={{ width: KIOSK_DESIGN_W, height: KIOSK_DESIGN_H, transform: `scale(${scale})` }}
          >
            <Content />
          </div>
        </MotionConfig>
      </div>
    </ErrorBoundary>
  )
}

export default App
