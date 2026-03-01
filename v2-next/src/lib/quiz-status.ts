import { QUIZ_STATUS } from '@/constants/quiz-status';
import type { QuizAnswerState, QuizQuestion, QuizStatus } from '@/types/quiz';

export function createInitialAnswerState(): QuizAnswerState {
  return {
    mainSelection: null,
    mainCorrect: false,
    mainLocked: false,
    whySelection: null,
    whyCorrect: false,
    whyLocked: false
  };
}

export function getQuestionStatus(question: QuizQuestion, answer: QuizAnswerState): QuizStatus {
  if (!answer.mainCorrect) {
    return QUIZ_STATUS.UNATTEMPTED;
  }

  if (!question.requiresWhy) {
    return QUIZ_STATUS.MASTERED;
  }

  return answer.whyCorrect ? QUIZ_STATUS.MASTERED : QUIZ_STATUS.PARTIAL;
}
