'use client';

import { useState } from 'react';
import { QuizProvider } from '@/features/quiz/context/quiz-context';
import type { ChoiceUiMode } from '@/features/quiz/types';
import type { QuizQuestion } from '@/types/quiz';
import QuizEngine from './quiz-engine';

interface QuizAppProps {
  initialQuestions: QuizQuestion[];
  initialNeedsDailySetup?: boolean;
  initialQuizSubject?: string | null;
  initialStudyStreakDays: number;
  dailyMasteredGoal: number;
  initialDailySnapshotError?: string | null;
  choiceUi?: ChoiceUiMode;
}

interface MegaQuizApiResponse {
  questions?: QuizQuestion[];
  error?: string;
}

interface TodayQuizApiResponse {
  subject?: string | null;
  questions?: QuizQuestion[];
  error?: string;
}

type DailySetupMode = 'load' | 'shuffle' | 'json';

export default function QuizApp({
  initialQuestions,
  initialNeedsDailySetup = false,
  initialQuizSubject = null,
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
  const [needsDailySetup, setNeedsDailySetup] = useState(
    initialNeedsDailySetup || initialQuestions.length === 0
  );
  const [quizSubject, setQuizSubject] = useState<string | null>(initialQuizSubject);
  const [dailySubjectInput, setDailySubjectInput] = useState(initialQuizSubject || '');
  const [jsonQuizInput, setJsonQuizInput] = useState('');
  const [activeDailySetupMode, setActiveDailySetupMode] = useState<DailySetupMode | null>(null);
  const [isPreparingDailyQuiz, setIsPreparingDailyQuiz] = useState(false);
  const [dailySnapshotError, setDailySnapshotError] = useState<string | null>(
    initialDailySnapshotError
  );
  const [isShufflingMegaQuiz, setIsShufflingMegaQuiz] = useState(false);
  const [shuffleError, setShuffleError] = useState<string | null>(null);

  const handleCreateTodayQuiz = async (mode: DailySetupMode, questions?: unknown): Promise<void> => {
    if (isPreparingDailyQuiz) {
      return;
    }

    const normalizedSubject = dailySubjectInput.trim() || null;
    setIsPreparingDailyQuiz(true);
    setActiveDailySetupMode(mode);
    setDailySnapshotError(null);

    try {
      const response = await fetch('/api/quiz/today', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          mode,
          subject: normalizedSubject,
          questions
        })
      });

      const payload = (await response.json()) as TodayQuizApiResponse;

      if (!response.ok) {
        setDailySnapshotError(payload.error || 'Unable to create today quiz.');
        return;
      }

      if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
        setDailySnapshotError('No questions were returned for today quiz.');
        return;
      }

      setQuizQuestions(payload.questions);
      setQuizSubject(payload.subject ?? normalizedSubject);
      setQuizSessionVersion((current) => current + 1);
      setNeedsDailySetup(false);
    } catch {
      setDailySnapshotError('Network error while creating today quiz.');
    } finally {
      setIsPreparingDailyQuiz(false);
      setActiveDailySetupMode(null);
    }
  };

  const handleCreateTodayQuizFromJson = async (): Promise<void> => {
    if (!jsonQuizInput.trim()) {
      setDailySnapshotError('Paste a quiz JSON array first.');
      return;
    }

    let parsedQuestions: unknown;
    try {
      parsedQuestions = JSON.parse(jsonQuizInput);
    } catch {
      setDailySnapshotError('JSON is invalid. Fix formatting and try again.');
      return;
    }

    await handleCreateTodayQuiz('json', parsedQuestions);
  };

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
      setQuizSubject('Shuffled Mega Quiz (session)');
      setQuizSessionVersion((current) => current + 1);
    } catch {
      // Step 5: Report network/runtime failures.
      setShuffleError('Network error while generating mega quiz.');
    } finally {
      setIsShufflingMegaQuiz(false);
    }
  };

  if (needsDailySetup) {
    return (
      <main className="quiz-page">
        <section className="card-surface daily-setup">
          <p className="section-label">Quiz Of The Day</p>
          <h1 className="quiz-title">No quiz is saved for today yet.</h1>
          <p className="muted-text">
            Choose one option to create today&apos;s quiz from the database.
          </p>
          <label className="history-field daily-setup__field">
            <span className="history-field__label">Quiz Subject</span>
            <input
              className="history-input"
              onChange={(event) => setDailySubjectInput(event.target.value)}
              placeholder="e.g. TypeScript Generics"
              type="text"
              value={dailySubjectInput}
            />
          </label>
          <div className="daily-setup__actions">
            <button
              className="button button--primary"
              disabled={isPreparingDailyQuiz}
              onClick={() => {
                void handleCreateTodayQuiz('load');
              }}
              type="button"
            >
              {activeDailySetupMode === 'load' ? 'Loading Quiz...' : 'Load Latest Quiz'}
            </button>
            <button
              className="button button--ghost"
              disabled={isPreparingDailyQuiz}
              onClick={() => {
                void handleCreateTodayQuiz('shuffle');
              }}
              type="button"
            >
              {activeDailySetupMode === 'shuffle'
                ? 'Shuffling Mega Quiz...'
                : 'Shuffle Mega Quiz'}
            </button>
          </div>
          <label className="history-field daily-setup__field">
            <span className="history-field__label">Quiz JSON</span>
            <textarea
              className="history-input daily-setup__json"
              onChange={(event) => setJsonQuizInput(event.target.value)}
              placeholder='[{ "id": "q1", "question": "...", "options": [...] }]'
              value={jsonQuizInput}
            />
          </label>
          <button
            className="button button--ghost"
            disabled={isPreparingDailyQuiz}
            onClick={() => {
              void handleCreateTodayQuizFromJson();
            }}
            type="button"
          >
            {activeDailySetupMode === 'json' ? 'Saving JSON Quiz...' : 'Use JSON Quiz As Today'}
          </button>
          {dailySnapshotError ? <p className="feedback feedback--error">{dailySnapshotError}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <QuizProvider key={quizSessionVersion} questions={quizQuestions}>
      <QuizEngine
        choiceUi={choiceUi}
        dailyMasteredGoal={dailyMasteredGoal}
        initialDailySnapshotError={dailySnapshotError}
        quizSubject={quizSubject}
        initialStudyStreakDays={initialStudyStreakDays}
        isShufflingMegaQuiz={isShufflingMegaQuiz}
        onShuffleMegaQuiz={handleShuffleMegaQuiz}
        shuffleError={shuffleError}
      />
    </QuizProvider>
  );
}
