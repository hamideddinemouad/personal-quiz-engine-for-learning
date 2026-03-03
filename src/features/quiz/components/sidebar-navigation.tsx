'use client';

import { QUIZ_STATUS } from '@/constants/quiz-status';
import { useQuizContext } from '@/features/quiz/context/quiz-context';
import { formatStopwatch } from '@/features/quiz/lib/format-stopwatch';
import type { QuizStatus } from '@/types/quiz';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CompassIcon,
  FlameIcon,
  ShuffleIcon,
  TargetIcon,
  TrophyIcon
} from './icons';

interface SidebarNavigationProps {
  dailyMasteredGoal: number;
  dailySnapshotError: string | null;
  quizSubject: string | null;
  studyStreakDays: number;
  isShufflingMegaQuiz: boolean;
  shuffleError: string | null;
  onShuffleMegaQuiz: () => Promise<void>;
  onOpenHistoryCrud: () => void;
}

function statusMarkerClass(status: QuizStatus): string {
  if (status === QUIZ_STATUS.MASTERED) {
    return 'status-marker status-marker--mastered';
  }

  if (status === QUIZ_STATUS.PARTIAL) {
    return 'status-marker status-marker--partial';
  }

  return 'status-marker status-marker--unattempted';
}

function statusLabel(status: QuizStatus): string {
  if (status === QUIZ_STATUS.MASTERED) {
    return 'Mastered';
  }

  if (status === QUIZ_STATUS.PARTIAL) {
    return 'Partial';
  }

  return 'Unattempted';
}

export default function SidebarNavigation({
  dailyMasteredGoal,
  dailySnapshotError,
  quizSubject,
  studyStreakDays,
  isShufflingMegaQuiz,
  shuffleError,
  onShuffleMegaQuiz,
  onOpenHistoryCrud
}: SidebarNavigationProps): JSX.Element {
  const { questions, currentQuestionIndex, statusesById, elapsedSeconds, progress, goToQuestion } =
    useQuizContext();
  const normalizedDailyGoal = Math.max(dailyMasteredGoal, 1);
  const masteredToGoal = Math.min(progress.masteredCount, normalizedDailyGoal);
  const goalPercent = Math.round((masteredToGoal / normalizedDailyGoal) * 100);
  const masteredRemaining = Math.max(normalizedDailyGoal - progress.masteredCount, 0);
  const hasReachedDailyGoal = masteredRemaining === 0;

  return (
    <aside className="card-surface quiz-sidebar">
      <h2 className="sidebar-title sidebar-title--with-icon">
        <CompassIcon className="inline-icon" />
        <span>Question Navigator</span>
      </h2>
      <p aria-live="polite" className="muted-text muted-text--with-icon">
        <ClockIcon className="inline-icon" />
        Stopwatch: <span className="mono-text">{formatStopwatch(elapsedSeconds)}</span>
      </p>
      <p className="muted-text quiz-subject">
        Subject: <span className="mono-text">{quizSubject || 'No subject (legacy entry)'}</span>
      </p>
      {dailySnapshotError ? <p className="feedback feedback--error">{dailySnapshotError}</p> : null}
      <div aria-live="polite" className="sidebar-progress">
        <div className="sidebar-stat-grid">
          <p className="sidebar-progress-row sidebar-progress-row--card">
            <span className="sidebar-progress-label">
              <FlameIcon className="inline-icon" />
              Streak
            </span>
            <span className="mono-text">
              {studyStreakDays} {studyStreakDays === 1 ? 'day' : 'days'}
            </span>
          </p>
          <p className="sidebar-progress-row sidebar-progress-row--card">
            <span className="sidebar-progress-label">
              <TargetIcon className="inline-icon" />
              Daily goal
            </span>
            <span className="mono-text">
              {progress.masteredCount}/{normalizedDailyGoal}
            </span>
          </p>
        </div>
        <div
          aria-label={`Daily goal progress ${goalPercent}%`}
          className="goal-progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={goalPercent}
        >
          <span
            className={`goal-progress-fill ${hasReachedDailyGoal ? 'goal-progress-fill--complete' : ''}`}
            style={{ width: `${goalPercent}%` }}
          />
        </div>
        <p className={`feedback ${hasReachedDailyGoal ? 'feedback--success' : 'feedback--neutral'}`}>
          {hasReachedDailyGoal ? 'Daily goal reached.' : `${masteredRemaining} more mastered to hit goal.`}
        </p>
        {hasReachedDailyGoal ? (
          <p className="goal-celebration">
            <TrophyIcon className="inline-icon" />
            Momentum locked in for today.
          </p>
        ) : null}
      </div>
      <div className="sidebar-mega-action">
        <button
          className="button button--primary sidebar-mega-button"
          disabled={isShufflingMegaQuiz}
          onClick={() => {
            void onShuffleMegaQuiz();
          }}
          type="button"
        >
          <span className="button-content">
            <ShuffleIcon className={`inline-icon ${isShufflingMegaQuiz ? 'spin-icon' : ''}`} />
            {isShufflingMegaQuiz ? 'Building Mega Quiz...' : 'Shuffle Mega Quiz'}
          </span>
        </button>
        <button className="button button--ghost sidebar-mega-button" onClick={onOpenHistoryCrud} type="button">
          Manage History DB
        </button>
        {shuffleError ? <p className="feedback feedback--error">{shuffleError}</p> : null}
      </div>

      <div aria-label="Question list" className="navigator-grid">
        {questions.map((question, index) => {
          const status = statusesById[question.id] || QUIZ_STATUS.UNATTEMPTED;
          const isCurrent = index === currentQuestionIndex;

          return (
            <button
              aria-current={isCurrent ? 'true' : undefined}
              aria-label={`Go to question ${index + 1}. ${statusLabel(status)}`}
              className={`navigator-item ${isCurrent ? 'navigator-item--active' : ''}`}
              key={question.id}
              onClick={() => goToQuestion(index)}
              type="button"
            >
              <span>{index + 1}</span>
              <span aria-hidden="true" className={statusMarkerClass(status)} />
            </button>
          );
        })}
      </div>

      <div className="sidebar-actions">
        <button
          className="button button--ghost"
          disabled={currentQuestionIndex === 0}
          onClick={() => goToQuestion(currentQuestionIndex - 1)}
          type="button"
        >
          <span className="button-content">
            <ChevronLeftIcon className="inline-icon" />
            Previous
          </span>
        </button>
        <button
          className="button button--primary"
          disabled={currentQuestionIndex === questions.length - 1}
          onClick={() => goToQuestion(currentQuestionIndex + 1)}
          type="button"
        >
          <span className="button-content">
            Next
            <ChevronRightIcon className="inline-icon" />
          </span>
        </button>
      </div>
    </aside>
  );
}
