'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from 'react';
import { QUIZ_STATUS } from '@/constants/quiz-status';
import { createInitialAnswerState, getQuestionStatus } from '@/lib/quiz-status';
import type {
  AnswersById,
  QuizAnswerState,
  QuizProgress,
  QuizQuestion,
  QuizSelectionResult,
  QuizStatus
} from '@/types/quiz';

interface QuizContextValue {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  currentQuestion: QuizQuestion | null;
  currentAnswer: QuizAnswerState | null;
  elapsedSeconds: number;
  answersById: AnswersById;
  statusesById: Record<string, QuizStatus>;
  progress: QuizProgress;
  selectMainOption: (questionId: string, optionIndex: number) => { result: QuizSelectionResult };
  selectWhyOption: (questionId: string, optionIndex: number) => { result: QuizSelectionResult };
  goToQuestion: (index: number) => void;
}

interface QuizProviderProps extends PropsWithChildren {
  questions: QuizQuestion[];
}

const QuizContext = createContext<QuizContextValue | null>(null);

function logQuizContextDebug(
  phase: 'main' | 'why',
  event: string,
  details?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (details) {
    console.log(`[quiz-debug][quiz-context:${phase}] ${event}`, details);
    return;
  }

  console.log(`[quiz-debug][quiz-context:${phase}] ${event}`);
}

function createInitialAnswersById(questions: QuizQuestion[]): AnswersById {
  // Goal: Create a predictable answer bucket for every question id.
  // This avoids null checks spread across the UI and status logic.
  return questions.reduce<AnswersById>((accumulator, question) => {
    accumulator[question.id] = createInitialAnswerState();
    return accumulator;
  }, {});
}

export function QuizProvider({ children, questions }: QuizProviderProps): JSX.Element {
  // Goal: Keep all interactive quiz behavior in one state container:
  // timer, navigation, answer updates, and derived progress/status.
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answersById, setAnswersById] = useState<AnswersById>(() =>
    createInitialAnswersById(questions)
  );

  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const currentAnswer = currentQuestion ? answersById[currentQuestion.id] : null;

  useEffect(() => {
    // Goal: Start a simple stopwatch for user pacing feedback.
    // We derive elapsed time from wall-clock start to avoid drift.
    const startTime = Date.now();
    const intervalId = setInterval(() => {
      const totalElapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(totalElapsedSeconds);
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const selectMainOption = (
    questionId: string,
    optionIndex: number
  ): { result: QuizSelectionResult } => {
    // Goal: Enforce phase-1 rules:
    // - incorrect answers stay retryable
    // - correct answer locks the main phase

    // Step 1: Validate question and current answer bucket.
    const question = questions.find((entry) => entry.id === questionId);
    if (!question) {
      logQuizContextDebug('main', 'invalid-question-id', {
        questionId,
        optionIndex
      });
      return { result: 'invalid' };
    }

    const current = answersById[questionId];
    if (!current || current.mainLocked) {
      logQuizContextDebug('main', 'selection-blocked-locked', {
        questionId,
        optionIndex,
        hasCurrent: Boolean(current),
        mainLocked: current?.mainLocked ?? null
      });
      return { result: 'locked' };
    }

    const selected = question.options[optionIndex];
    if (!selected) {
      logQuizContextDebug('main', 'invalid-option-index', {
        questionId,
        optionIndex,
        optionsCount: question.options.length
      });
      return { result: 'invalid' };
    }

    logQuizContextDebug('main', 'selection-attempt', {
      questionId,
      optionIndex,
      optionIsCorrect: selected.isCorrect,
      mainSelectionBefore: current.mainSelection,
      mainLockedBefore: current.mainLocked
    });

    if (selected.isCorrect) {
      // Step 2a: Correct answer -> lock phase 1.
      // We guard twice (before + inside setter) for consistency under rapid clicks.
      setAnswersById((previous) => {
        const existing = previous[questionId];
        if (!existing || existing.mainLocked) {
          return previous;
        }

        return {
          ...previous,
          [questionId]: {
            ...existing,
            mainSelection: optionIndex,
            mainCorrect: true,
            mainLocked: true
          }
        };
      });

      logQuizContextDebug('main', 'selection-result-correct', {
        questionId,
        optionIndex
      });
      return { result: 'correct' };
    }

    // Step 2b: Incorrect answer -> record selection but keep phase open.
    setAnswersById((previous) => {
      const existing = previous[questionId];
      if (!existing || existing.mainLocked) {
        return previous;
      }

      return {
        ...previous,
        [questionId]: {
          ...existing,
          mainSelection: optionIndex
        }
      };
    });

    logQuizContextDebug('main', 'selection-result-incorrect', {
      questionId,
      optionIndex
    });
    return { result: 'incorrect' };
  };

  const selectWhyOption = (
    questionId: string,
    optionIndex: number
  ): { result: QuizSelectionResult } => {
    // Goal: Enforce phase-2 rules:
    // - only available when main answer is correct
    // - correct answer locks why phase
    // - incorrect answer remains retryable

    // Step 1: Validate that this question supports a why phase.
    const question = questions.find((entry) => entry.id === questionId);
    if (!question || !question.requiresWhy || !question.whyOptions) {
      logQuizContextDebug('why', 'invalid-why-question', {
        questionId,
        optionIndex
      });
      return { result: 'invalid' };
    }

    const current = answersById[questionId];
    if (!current || !current.mainCorrect || current.whyLocked) {
      logQuizContextDebug('why', 'selection-blocked-locked', {
        questionId,
        optionIndex,
        hasCurrent: Boolean(current),
        mainCorrect: current?.mainCorrect ?? null,
        whyLocked: current?.whyLocked ?? null
      });
      return { result: 'locked' };
    }

    const selected = question.whyOptions[optionIndex];
    if (!selected) {
      logQuizContextDebug('why', 'invalid-option-index', {
        questionId,
        optionIndex,
        optionsCount: question.whyOptions.length
      });
      return { result: 'invalid' };
    }

    logQuizContextDebug('why', 'selection-attempt', {
      questionId,
      optionIndex,
      optionIsCorrect: selected.isCorrect,
      whySelectionBefore: current.whySelection,
      whyLockedBefore: current.whyLocked
    });

    if (selected.isCorrect) {
      // Step 2a: Correct why answer -> finalize conceptual mastery.
      setAnswersById((previous) => {
        const existing = previous[questionId];
        if (!existing || !existing.mainCorrect || existing.whyLocked) {
          return previous;
        }

        return {
          ...previous,
          [questionId]: {
            ...existing,
            whySelection: optionIndex,
            whyCorrect: true,
            whyLocked: true
          }
        };
      });

      logQuizContextDebug('why', 'selection-result-correct', {
        questionId,
        optionIndex
      });
      return { result: 'correct' };
    }

    // Step 2b: Incorrect why answer -> keep retry path active.
    setAnswersById((previous) => {
      const existing = previous[questionId];
      if (!existing || !existing.mainCorrect || existing.whyLocked) {
        return previous;
      }

      return {
        ...previous,
        [questionId]: {
          ...existing,
          whySelection: optionIndex
        }
      };
    });

    logQuizContextDebug('why', 'selection-result-incorrect', {
      questionId,
      optionIndex
    });
    return { result: 'incorrect' };
  };

  const goToQuestion = (index: number): void => {
    // Goal: Keep navigation safe by clamping to valid indexes.
    if (index < 0 || index >= questions.length) {
      return;
    }

    setCurrentQuestionIndex(index);
  };

  const statusesById = useMemo<Record<string, QuizStatus>>(
    // Goal: Derive status from state, not from UI feedback strings.
    () =>
      questions.reduce<Record<string, QuizStatus>>((accumulator, question) => {
        const answer = answersById[question.id] ?? createInitialAnswerState();
        accumulator[question.id] = getQuestionStatus(question, answer);
        return accumulator;
      }, {}),
    [answersById, questions]
  );

  const progress = useMemo<QuizProgress>(() => {
    // Goal: Build compact progress metrics for the header/sidebar.
    const statuses = Object.values(statusesById);

    return {
      total: questions.length,
      masteredCount: statuses.filter((status) => status === QUIZ_STATUS.MASTERED).length,
      partialCount: statuses.filter((status) => status === QUIZ_STATUS.PARTIAL).length
    };
  }, [questions.length, statusesById]);

  const value: QuizContextValue = {
    // Goal: Expose a stable contract to all quiz components.
    questions,
    currentQuestionIndex,
    currentQuestion,
    currentAnswer,
    elapsedSeconds,
    answersById,
    statusesById,
    progress,
    selectMainOption,
    selectWhyOption,
    goToQuestion
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuizContext(): QuizContextValue {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuizContext must be used inside QuizProvider');
  }

  return context;
}
