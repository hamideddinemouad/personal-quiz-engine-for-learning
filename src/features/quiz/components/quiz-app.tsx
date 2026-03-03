'use client';

import { useState } from 'react';
import { QuizProvider } from '@/features/quiz/context/quiz-context';
import type { ChoiceUiMode } from '@/features/quiz/types';
import type { QuizQuestion } from '@/types/quiz';
import QuizEngine from './quiz-engine';

interface QuizAppProps {
  initialQuestions: QuizQuestion[];
  initialStudyStreakDays: number;
  dailyMasteredGoal: number;
  initialDailySnapshotError?: string | null;
  choiceUi?: ChoiceUiMode;
}

interface MegaQuizApiResponse {
  questions?: QuizQuestion[];
  error?: string;
}

export default function QuizApp({
  initialQuestions,
  initialStudyStreakDays,
  dailyMasteredGoal,
  initialDailySnapshotError = null,
  choiceUi = 'standard'
}: QuizAppProps): JSX.Element {
  // Goal: Keep the active quiz session replaceable in-place (daily -> mega quiz)
  // without a full page refresh.
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(initialQuestions);
  // Goal: Force a fresh provider state when we swap to a new question set.
  // Incrementing this key remounts QuizProvider and resets answer/timer state.
  const [quizSessionVersion, setQuizSessionVersion] = useState(0);
  const [isShufflingMegaQuiz, setIsShufflingMegaQuiz] = useState(false);
  const [shuffleError, setShuffleError] = useState<string | null>(null);

  const handleShuffleMegaQuiz = async (): Promise<void> => {
    // Goal: Request a brand-new mega quiz from server history and replace current session.
    if (isShufflingMegaQuiz) {
      return;
    }

    // Step 1: Enter loading state and clear stale errors.
    setIsShufflingMegaQuiz(true);
    setShuffleError(null);

    try {
      // Step 2: Ask server to build shuffled mega quiz from past days.
      const response = await fetch('/api/quiz/mega', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ mode: 'shuffle' })
      });

      const payload = (await response.json()) as MegaQuizApiResponse;

      if (!response.ok) {
        // Step 3a: Show API-provided error (e.g. no past history yet).
        setShuffleError(payload.error || 'Unable to build mega quiz from past history.');
        return;
      }

      if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
        // Step 3b: Defensive guard for malformed/empty success responses.
        setShuffleError('No mega quiz questions were returned.');
        return;
      }

      // Step 4: Swap questions and remount provider for a clean run.
      setQuizQuestions(payload.questions);
      setQuizSessionVersion((current) => current + 1);
    } catch {
      // Step 5: Report network/runtime failures.
      setShuffleError('Network error while generating mega quiz.');
    } finally {
      setIsShufflingMegaQuiz(false);
    }
  };

  return (
    <QuizProvider key={quizSessionVersion} questions={quizQuestions}>
      <QuizEngine
        choiceUi={choiceUi}
        dailyMasteredGoal={dailyMasteredGoal}
        initialDailySnapshotError={initialDailySnapshotError}
        initialStudyStreakDays={initialStudyStreakDays}
        isShufflingMegaQuiz={isShufflingMegaQuiz}
        onShuffleMegaQuiz={handleShuffleMegaQuiz}
        shuffleError={shuffleError}
      />
    </QuizProvider>
  );
}
