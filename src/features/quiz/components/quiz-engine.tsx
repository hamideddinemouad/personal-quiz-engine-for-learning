'use client';

import { useState } from 'react';
import { useQuizContext } from '@/features/quiz/context/quiz-context';
import type { ChoiceUiMode } from '@/features/quiz/types';
import type { QuizQuestion } from '@/types/quiz';
import { AlertCircleIcon } from './icons';
import HistoryCrudModal from './history-crud-modal';
import QuestionCard from './question-card';
import SidebarNavigation from './sidebar-navigation';

interface QuizEngineProps {
  initialStudyStreakDays: number;
  dailyMasteredGoal: number;
  initialDailySnapshotError: string | null;
  quizSubject: string | null;
  isShufflingMegaQuiz: boolean;
  shuffleError: string | null;
  onShuffleMegaQuiz: () => Promise<void>;
  isCreatingGithubBackup: boolean;
  backupFeedback: { tone: 'success' | 'error' | 'neutral'; text: string } | null;
  onCreateGithubBackup: () => Promise<void>;
  onLoadQuizTemporarily: (questions: QuizQuestion[], subject: string | null) => void;
  choiceUi: ChoiceUiMode;
}

export default function QuizEngine({
  initialStudyStreakDays,
  dailyMasteredGoal,
  initialDailySnapshotError,
  quizSubject,
  isShufflingMegaQuiz,
  shuffleError,
  onShuffleMegaQuiz,
  isCreatingGithubBackup,
  backupFeedback,
  onCreateGithubBackup,
  onLoadQuizTemporarily,
  choiceUi
}: QuizEngineProps): JSX.Element {
  // Goal: Compose quiz content + sidebar controls from shared context state.
  const { currentQuestion, currentAnswer } = useQuizContext();
  const [isHistoryCrudOpen, setIsHistoryCrudOpen] = useState(false);

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
          choiceUi={choiceUi}
          dailyMasteredGoal={dailyMasteredGoal}
          dailySnapshotError={initialDailySnapshotError}
          quizSubject={quizSubject}
          studyStreakDays={initialStudyStreakDays}
          isShufflingMegaQuiz={isShufflingMegaQuiz}
          isCreatingGithubBackup={isCreatingGithubBackup}
          backupFeedback={backupFeedback}
          onOpenHistoryCrud={() => setIsHistoryCrudOpen(true)}
          onShuffleMegaQuiz={onShuffleMegaQuiz}
          onCreateGithubBackup={onCreateGithubBackup}
          shuffleError={shuffleError}
        />
      </div>
      <HistoryCrudModal
        isOpen={isHistoryCrudOpen}
        onClose={() => setIsHistoryCrudOpen(false)}
        onLoadQuizTemporarily={onLoadQuizTemporarily}
      />
    </main>
  );
}
