import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { QUIZ_STATUS } from '../constants/quizStatus';
import { createAndStoreTodayQuiz } from '../utils/dailyQuizHistoryStorage';

const QuizContext = createContext(null);

function shuffleArray(values) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function shuffleQuestionChoices(questions) {
  return questions.map((question) => ({
    ...question,
    options: Array.isArray(question.options) ? shuffleArray(question.options) : question.options,
    whyOptions: Array.isArray(question.whyOptions)
      ? shuffleArray(question.whyOptions)
      : question.whyOptions
  }));
}

// Each question gets its own state bucket keyed by question id.
// Keeping all fields explicit makes status derivation predictable.
function createInitialAnswerState() {
  return {
    mainSelection: null,
    mainCorrect: false,
    mainLocked: false,
    whySelection: null,
    whyCorrect: false,
    whyLocked: false
  };
}

// Status is derived from correctness flags, not from UI feedback text.
// This keeps progress logic independent from presentation copy.
function getQuestionStatus(question, answerState) {
  if (!answerState.mainCorrect) {
    return QUIZ_STATUS.UNATTEMPTED;
  }

  if (!question.requiresWhy) {
    return QUIZ_STATUS.MASTERED;
  }

  return answerState.whyCorrect ? QUIZ_STATUS.MASTERED : QUIZ_STATUS.PARTIAL;
}

export function QuizProvider({ children, questions }) {
  // On each page load, create today's quiz snapshot and store it in history.
  // If today's entry already exists, it is overwritten per requested behavior.
  const [shuffledQuestions] = useState(() => createAndStoreTodayQuiz(questions, shuffleQuestionChoices));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // answersById shape:
  // {
  //   q1: { mainSelection, mainCorrect, mainLocked, whySelection, whyCorrect, whyLocked },
  //   q2: ...
  // }
  const [answersById, setAnswersById] = useState(() =>
    shuffledQuestions.reduce((acc, question) => {
      acc[question.id] = createInitialAnswerState();
      return acc;
    }, {})
  );
  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const currentAnswer = answersById[currentQuestion?.id];

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

  const selectMainOption = (questionId, optionIndex) => {
    // Resolve the question once from input id.
    const question = shuffledQuestions.find((entry) => entry.id === questionId);
    if (!question) {
      return { result: 'invalid' };
    }

    // Read current snapshot to return a deterministic result immediately.
    // We intentionally do not derive this return value inside setState
    // because that can be stale/asynchronous from the caller perspective.
    const current = answersById[questionId];
    if (!current || current.mainLocked) {
      return { result: 'locked' };
    }

    const selected = question.options?.[optionIndex];
    if (!selected) {
      return { result: 'invalid' };
    }

    if (selected.isCorrect) {
      // Correct main answer locks phase 1, preventing further edits.
      setAnswersById((prev) => {
        const existing = prev[questionId];
        // Guard again in updater because state could change between
        // event dispatch and state commit.
        if (!existing || existing.mainLocked) {
          return prev;
        }

        return {
          ...prev,
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

    // Incorrect answer keeps phase 1 unlocked so user can retry.
    setAnswersById((prev) => {
      const existing = prev[questionId];
      if (!existing || existing.mainLocked) {
        return prev;
      }

      return {
        ...prev,
        [questionId]: {
          ...existing,
          mainSelection: optionIndex
        }
      };
    });

    return { result: 'incorrect' };
  };

  const selectWhyOption = (questionId, optionIndex) => {
    // Why-phase is optional and only valid for questions that require it.
    const question = shuffledQuestions.find((entry) => entry.id === questionId);
    if (!question || !question.requiresWhy) {
      return { result: 'invalid' };
    }

    // Why selection is blocked until main answer is correct.
    const current = answersById[questionId];
    if (!current || !current.mainCorrect || current.whyLocked) {
      return { result: 'locked' };
    }

    const selected = question.whyOptions?.[optionIndex];
    if (!selected) {
      return { result: 'invalid' };
    }

    if (selected.isCorrect) {
      // Correct conceptual justification locks the why-phase
      // and upgrades question state to MASTERED (derived downstream).
      setAnswersById((prev) => {
        const existing = prev[questionId];
        if (!existing || !existing.mainCorrect || existing.whyLocked) {
          return prev;
        }

        return {
          ...prev,
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

    // Incorrect conceptual explanation remains retryable.
    setAnswersById((prev) => {
      const existing = prev[questionId];
      if (!existing || !existing.mainCorrect || existing.whyLocked) {
        return prev;
      }

      return {
        ...prev,
        [questionId]: {
          ...existing,
          whySelection: optionIndex
        }
      };
    });

    return { result: 'incorrect' };
  };

  // Shared navigation helper for sidebar + previous/next controls.
  const goToQuestion = (index) => {
    if (index < 0 || index >= shuffledQuestions.length) {
      return;
    }
    setCurrentQuestionIndex(index);
  };

  // Derived map used by sidebar icon rendering and progress stats.
  const statusesById = useMemo(
    () =>
      shuffledQuestions.reduce((acc, question) => {
        acc[question.id] = getQuestionStatus(question, answersById[question.id]);
        return acc;
      }, {}),
    [answersById, shuffledQuestions]
  );

  // Summary counts for top-level progress display.
  const progress = useMemo(() => {
    const masteredCount = Object.values(statusesById).filter(
      (status) => status === QUIZ_STATUS.MASTERED
    ).length;

    const partialCount = Object.values(statusesById).filter(
      (status) => status === QUIZ_STATUS.PARTIAL
    ).length;

    return {
      total: shuffledQuestions.length,
      masteredCount,
      partialCount
    };
  }, [shuffledQuestions.length, statusesById]);

  // Exposed context contract consumed throughout the app.
  const value = {
    questions: shuffledQuestions,
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

export function useQuizContext() {
  // Defensive guard to catch accidental usage outside provider.
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuizContext must be used inside QuizProvider');
  }
  return context;
}
