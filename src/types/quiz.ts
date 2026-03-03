import { QUIZ_STATUS } from '@/constants/quiz-status';

export interface QuizOption {
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface QuizQuestion {
  id: string;
  type: 'mcq';
  question: string;
  options: QuizOption[];
  hint?: string;
  requiresWhy: boolean;
  whyQuestion?: string;
  whyOptions?: QuizOption[];
}

export interface QuizAnswerState {
  mainSelection: number | null;
  mainCorrect: boolean;
  mainLocked: boolean;
  whySelection: number | null;
  whyCorrect: boolean;
  whyLocked: boolean;
}

export type AnswersById = Record<string, QuizAnswerState>;

export type QuizStatus = (typeof QUIZ_STATUS)[keyof typeof QUIZ_STATUS];

export type QuizSelectionResult = 'correct' | 'incorrect' | 'locked' | 'invalid';

export interface QuizProgress {
  total: number;
  masteredCount: number;
  partialCount: number;
}

export interface DailyQuizHistoryEntry {
  date: string;
  savedAt: string;
  subject: string | null;
  questions: QuizQuestion[];
}

export interface DataSafetyState {
  wishList: string[];
  updatedAt: string | null;
}

export interface StudyStreakStats {
  currentStreakDays: number;
  studiedToday: boolean;
  totalStudyDays: number;
}
