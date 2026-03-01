'use client';

import { useQuizContext } from '@/features/quiz/context/quiz-context';
import type { ChoiceUiMode } from '@/features/quiz/types';
import { AlertCircleIcon } from './icons';
import QuestionCard from './question-card';
import SidebarNavigation from './sidebar-navigation';

interface QuizEngineProps {
  initialStudyStreakDays: number;
  dailyMasteredGoal: number;
  isShufflingMegaQuiz: boolean;
  shuffleError: string | null;
  onShuffleMegaQuiz: () => Promise<void>;
  choiceUi: ChoiceUiMode;
}

export default function QuizEngine({
  initialStudyStreakDays,
  dailyMasteredGoal,
  isShufflingMegaQuiz,
  shuffleError,
  onShuffleMegaQuiz,
  choiceUi
}: QuizEngineProps): JSX.Element {
  // Goal: Compose quiz content + sidebar controls from shared context state.
  const { currentQuestion, currentAnswer } = useQuizContext();

  if (!currentQuestion || !currentAnswer) {
    return (
      <main className="quiz-page">
        <p className="muted-text muted-text--with-icon">
          <AlertCircleIcon className="inline-icon" />
          No questions available.
        </p>
      </main>
    );
  }

  return (
    <main className="quiz-page">
      <div className="quiz-grid">
        <section aria-label="Quiz content" className="quiz-content">
          <QuestionCard choiceUi={choiceUi} key={currentQuestion.id} question={currentQuestion} />
        </section>
        <SidebarNavigation
          dailyMasteredGoal={dailyMasteredGoal}
          studyStreakDays={initialStudyStreakDays}
          isShufflingMegaQuiz={isShufflingMegaQuiz}
          onShuffleMegaQuiz={onShuffleMegaQuiz}
          shuffleError={shuffleError}
        />
      </div>
    </main>
  );
}
