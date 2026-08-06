import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "../context/GameContext";
import { useAnalytics } from "../hooks/useAnalytics";
import { SwipeCard, type SwipeCardHandle } from "./question/SwipeCard";
import { CrossButtons } from "./question/CrossButtons";
import { FeedbackBanner } from "./question/FeedbackBanner";
import { DashboardPanel } from "./dashboard/DashboardPanel";
import { positionsFor, type Pos } from "./question/cross";
import { caseNumber } from "../case";

export function QuestionScreen({
  caseIndex,
  questionIndex,
}: {
  caseIndex: number;
  questionIndex: number;
}) {
  const { state, dispatch, cases } = useGame();
  const { trackQuestionAnswered } = useAnalytics();
  const c = cases[caseIndex];
  const q = c.questions[questionIndex];
  const answer = state.answers[q.id] ?? null;
  const isLastInCase = questionIndex === c.questions.length - 1;

  // Card body shows this question's labs, or the patient recap when it has none.
  const labs =
    q.context && q.context.length > 0 ? q.context : c.intro.narrative;

  const cardRef = useRef<SwipeCardHandle>(null);
  const [activePos, setActivePos] = useState<Pos | null>(null);

  // Actually record the answer once the card has flown off.
  const register = (optionId: string) => {
    if (state.answers[q.id]) return;
    dispatch({ type: "ANSWER", optionId });
    const opt = q.options.find((o) => o.id === optionId);
    trackQuestionAnswered({
      question_id: q.id,
      chosen_label: opt?.label ?? "",
      correct: opt?.id === q.correctOptionId,
    });
  };

  // A button tap flies the card off in that option's direction, then registers —
  // identical to releasing a drag toward the same position.
  const handleChoose = (optionId: string) => {
    if (answer) return;
    const idx = q.options.findIndex((o) => o.id === optionId);
    const pos = positionsFor(q.options.length)[idx];
    if (cardRef.current) cardRef.current.commit(pos);
    else register(optionId);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto sm:flex-row sm:overflow-hidden">
      {/* Scroll fallback: the inner column centers when it fits, but grows past a
          too-short viewport so this wrapper scrolls from the top instead of
          clipping the buttons off the bottom. */}
      <div className="flex min-w-0 flex-1 flex-col sm:overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center gap-5 px-6 pt-20 pb-8 short:gap-3 short:pb-4 shorter:gap-2 shorter:pb-2 sm:pt-8 sm:short:pt-4 sm:shorter:pt-2">
        <p className="font-display text-gold-400 text-sm font-bold tracking-[0.2em] uppercase shorter:text-xs">
          Case {caseNumber(c.id)}: {c.patientName} · Question {questionIndex + 1}{" "}
          of {c.questions.length}
        </p>

        {/* Card slot — fixed size so the swap to the feedback banner doesn't jump.
            z-20 keeps the card above the prompt + buttons as it flies off through them. */}
        <div className="relative z-20 h-104 w-80 shrink-0 short:h-88 shorter:h-72 sm:w-96">
          {answer ? (
            <FeedbackBanner
              correct={answer.correct}
              points={answer.points}
              speedBonus={answer.speedBonus}
              isLastInCase={isLastInCase}
              onContinue={() => dispatch({ type: "NEXT" })}
            />
          ) : (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 44, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <SwipeCard
                ref={cardRef}
                patientName={c.patientName}
                ageSex={c.intro.ageSex}
                image={c.intro.image}
                labs={labs}
                options={q.options}
                onActivePosChange={setActivePos}
                onCommit={register}
              />
            </motion.div>
          )}
        </div>

        <h2 className="font-display max-w-prose text-center text-2xl font-extrabold text-white short:text-xl shorter:text-lg">
          {q.prompt}
        </h2>

        <CrossButtons
          options={q.options}
          correctOptionId={q.correctOptionId}
          chosenOptionId={answer?.chosenOptionId ?? null}
          activePos={activePos}
          onChoose={handleChoose}
        />
        </div>
      </div>

      {/* Dashboard hidden on the narrow single-column layout, shown at sm+ */}
      <div className="contents max-sm:hidden">
        <DashboardPanel />
      </div>
    </div>
  );
}
