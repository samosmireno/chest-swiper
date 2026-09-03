import { Component, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GameProvider } from "./context/GameContext";
import { useGameScreen } from "./context/useGame";
import { profiles } from "./data/profiles";
import { AttractScreen } from "./components/AttractScreen";
import { GameScreen } from "./components/GameScreen";
import { SummaryView } from "./components/SummaryView";
import { FpsMeter } from "./components/FpsMeter";
import { perfFlags } from "./utils/perfFlags";

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
  // Screen-only subscription: play-time dispatches (swipes, timer ticks)
  // never re-render the tree from the router down.
  const screen = useGameScreen();

  return (
    <AnimatePresence mode="wait">
      {screen === "idle" && (
        <motion.div key="idle" className="h-full w-full" {...screenTransition}>
          <AttractScreen />
        </motion.div>
      )}
      {screen === "playing" && (
        <motion.div
          key="playing"
          className="h-full w-full"
          {...screenTransition}
        >
          <GameScreen />
        </motion.div>
      )}
      {screen === "summary" && (
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
  if (perfFlags.novideo) {
    return (
      <img
        className="absolute inset-0 h-full w-full object-cover"
        src="./bg_fallback.jpg"
        alt=""
      />
    );
  }
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
    {/* Flat 30% black scrim over the render so the glass panels and type
        keep contrast without tinting the teal scene. */}
    <div
      className="pointer-events-none absolute inset-0 z-3 bg-black/30"
      aria-hidden
    />
    <div className="relative z-10 h-full w-full">
      <GameProvider profiles={profiles}>
        <GameRouter />
      </GameProvider>
    </div>
    {perfFlags.fps && <FpsMeter />}
  </>
);

function App() {
  return (
    <ErrorBoundary>
      {/* dvh: tracks the visual viewport on mobile so the collapsing URL bar
          doesn't clip the layout or cause jumps */}
      <div className="relative h-dvh w-screen overflow-hidden">
        <GameContent />
      </div>
    </ErrorBoundary>
  );
}

export default App;
