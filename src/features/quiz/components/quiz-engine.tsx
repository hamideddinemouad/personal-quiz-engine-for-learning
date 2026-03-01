'use client';

import { useQuizContext } from '@/features/quiz/context/quiz-context';
import { AlertCircleIcon } from './icons';
import QuestionCard from './question-card';
import SidebarNavigation from './sidebar-navigation';

interface QuizEngineProps {
  initialStudyStreakDays: number;
  dailyMasteredGoal: number;
  isShufflingMegaQuiz: boolean;
  shuffleError: string | null;
  onShuffleMegaQuiz: () => Promise<void>;
}

export default function QuizEngine({
  initialStudyStreakDays,
  dailyMasteredGoal,
  isShufflingMegaQuiz,
  shuffleError,
  onShuffleMegaQuiz
}: QuizEngineProps): JSX.Element {
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
          <QuestionCard key={currentQuestion.id} question={currentQuestion} />
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
