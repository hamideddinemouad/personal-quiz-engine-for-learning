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

function createInitialAnswersById(questions: QuizQuestion[]): AnswersById {
  return questions.reduce<AnswersById>((accumulator, question) => {
    accumulator[question.id] = createInitialAnswerState();
    return accumulator;
  }, {});
}

export function QuizProvider({ children, questions }: QuizProviderProps): JSX.Element {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answersById, setAnswersById] = useState<AnswersById>(() =>
    createInitialAnswersById(questions)
  );

  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const currentAnswer = currentQuestion ? answersById[currentQuestion.id] : null;

  useEffect(() => {
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
    const question = questions.find((entry) => entry.id === questionId);
    if (!question) {
      return { result: 'invalid' };
    }

    const current = answersById[questionId];
    if (!current || current.mainLocked) {
      return { result: 'locked' };
    }

    const selected = question.options[optionIndex];
    if (!selected) {
      return { result: 'invalid' };
    }

    if (selected.isCorrect) {
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

      return { result: 'correct' };
    }

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

    return { result: 'incorrect' };
  };

  const selectWhyOption = (
    questionId: string,
    optionIndex: number
  ): { result: QuizSelectionResult } => {
    const question = questions.find((entry) => entry.id === questionId);
    if (!question || !question.requiresWhy || !question.whyOptions) {
      return { result: 'invalid' };
    }

    const current = answersById[questionId];
    if (!current || !current.mainCorrect || current.whyLocked) {
      return { result: 'locked' };
    }

    const selected = question.whyOptions[optionIndex];
    if (!selected) {
      return { result: 'invalid' };
    }

    if (selected.isCorrect) {
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

      return { result: 'correct' };
    }

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

    return { result: 'incorrect' };
  };

  const goToQuestion = (index: number): void => {
    if (index < 0 || index >= questions.length) {
      return;
    }

    setCurrentQuestionIndex(index);
  };

  const statusesById = useMemo<Record<string, QuizStatus>>(
    () =>
      questions.reduce<Record<string, QuizStatus>>((accumulator, question) => {
        const answer = answersById[question.id] ?? createInitialAnswerState();
        accumulator[question.id] = getQuestionStatus(question, answer);
        return accumulator;
      }, {}),
    [answersById, questions]
  );

  const progress = useMemo<QuizProgress>(() => {
    const statuses = Object.values(statusesById);

    return {
      total: questions.length,
      masteredCount: statuses.filter((status) => status === QUIZ_STATUS.MASTERED).length,
      partialCount: statuses.filter((status) => status === QUIZ_STATUS.PARTIAL).length
    };
  }, [questions.length, statusesById]);

  const value: QuizContextValue = {
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
