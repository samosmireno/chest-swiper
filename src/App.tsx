import { Component, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GameProvider, useGame } from "./context/GameContext";
import { profiles } from "./data/profiles";
import { AttractScreen } from "./components/AttractScreen";
import { GameScreen } from "./components/GameScreen";
import { SummaryView } from "./components/SummaryView";

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
  return (
    <ErrorBoundary>
      <div className="relative h-screen w-screen overflow-hidden">
        <GameContent />
      </div>
    </ErrorBoundary>
  );
}

export default App;
