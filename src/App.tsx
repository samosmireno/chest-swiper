import { Component, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { GameProvider, useGame } from "./context/GameContext";
import { profiles } from "./data/profiles";
import { AttractScreen } from "./components/AttractScreen";
import { GameScreen } from "./components/GameScreen";
import { SummaryView } from "./components/SummaryView";
import { useKioskScale } from "./hooks/useKioskScale";
import { KIOSK_DESIGN_W, KIOSK_DESIGN_H } from "./config";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-white">
          <p className="text-lg font-bold text-gray-900">
            Something went wrong.
          </p>
          <button
            className="rounded-full bg-gray-900 px-8 py-2 text-sm font-bold tracking-widest text-white uppercase hover:bg-gray-700"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const screenTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 },
};

function GameRouter() {
  const { state } = useGame();

  return (
    <AnimatePresence mode="wait">
      {state.screen === "idle" && (
        <motion.div key="idle" className="h-full w-full" {...screenTransition}>
          <AttractScreen />
        </motion.div>
      )}
      {state.screen === "playing" && (
        <motion.div
          key="playing"
          className="h-full w-full"
          {...screenTransition}
        >
          <GameScreen />
        </motion.div>
      )}
      {state.screen === "summary" && (
        <motion.div
          key="summary"
          className="h-full w-full"
          {...screenTransition}
        >
          <SummaryView />
        </motion.div>
      )}
    </AnimatePresence>
  );
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
  );
}

const GameContent = () => (
  <>
    <BackgroundVideo />
    <div
      className="pointer-events-none absolute inset-0 z-3"
      style={{ background: "var(--gradient-overlay)" }}
      aria-hidden
    />
    <div className="relative z-10 h-full w-full">
      <GameProvider profiles={profiles}>
        <GameRouter />
      </GameProvider>
    </div>
  </>
);

function App() {
  const scale = useKioskScale();

  if (scale === null) {
    // Normal responsive layout for ≤1920×1080
    return (
      <ErrorBoundary>
        <div className="relative h-screen w-screen overflow-hidden">
          <GameContent />
        </div>
      </ErrorBoundary>
    );
  }

  // Kiosk scaling for >1920×1080 — centers a fixed 1200×840 canvas
  return (
    <ErrorBoundary>
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-black">
        <MotionConfig
          transformPagePoint={(p) => ({ x: p.x / scale, y: p.y / scale })}
        >
          <div
            className="relative shrink-0 origin-center overflow-hidden"
            style={{
              width: KIOSK_DESIGN_W,
              height: KIOSK_DESIGN_H,
              transform: `scale(${scale})`,
            }}
          >
            <GameContent />
          </div>
        </MotionConfig>
      </div>
    </ErrorBoundary>
  );
}

export default App;
