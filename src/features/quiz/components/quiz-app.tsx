'use client';

import { useState } from 'react';
import { QuizProvider } from '@/features/quiz/context/quiz-context';
import type { QuizQuestion } from '@/types/quiz';
import QuizEngine from './quiz-engine';

interface QuizAppProps {
  initialQuestions: QuizQuestion[];
  initialStudyStreakDays: number;
  dailyMasteredGoal: number;
}

interface MegaQuizApiResponse {
  questions?: QuizQuestion[];
  error?: string;
}

export default function QuizApp({
  initialQuestions,
  initialStudyStreakDays,
  dailyMasteredGoal
}: QuizAppProps): JSX.Element {
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [quizSessionVersion, setQuizSessionVersion] = useState(0);
  const [isShufflingMegaQuiz, setIsShufflingMegaQuiz] = useState(false);
  const [shuffleError, setShuffleError] = useState<string | null>(null);

  const handleShuffleMegaQuiz = async (): Promise<void> => {
    if (isShufflingMegaQuiz) {
      return;
    }

    setIsShufflingMegaQuiz(true);
    setShuffleError(null);

    try {
      const response = await fetch('/api/quiz/mega', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ mode: 'shuffle' })
      });

      const payload = (await response.json()) as MegaQuizApiResponse;

      if (!response.ok) {
        setShuffleError(payload.error || 'Unable to build mega quiz from past history.');
        return;
      }

      if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
        setShuffleError('No mega quiz questions were returned.');
        return;
      }

      setQuizQuestions(payload.questions);
      setQuizSessionVersion((current) => current + 1);
    } catch {
      setShuffleError('Network error while generating mega quiz.');
    } finally {
      setIsShufflingMegaQuiz(false);
    }
  };

  return (
    <QuizProvider key={quizSessionVersion} questions={quizQuestions}>
      <QuizEngine
        dailyMasteredGoal={dailyMasteredGoal}
        initialStudyStreakDays={initialStudyStreakDays}
        isShufflingMegaQuiz={isShufflingMegaQuiz}
        onShuffleMegaQuiz={handleShuffleMegaQuiz}
        shuffleError={shuffleError}
      />
    </QuizProvider>
  );
}
