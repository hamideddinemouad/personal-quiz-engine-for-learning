import { toLocalDateKey } from '@/lib/date';
import { questions as sourceQuestions } from '@/lib/questions';
import { cloneQuestions, shuffleQuestionChoices } from '@/lib/quiz-transform';
import { buildShuffledMegaQuizFromHistory } from '@/server/history/mega-quiz';
import {
  buildMegaQuizFromDates as buildMegaQuizFromHistory,
  findDailyQuizHistoryEntryByDate,
  listDailyQuizHistoryEntries,
  upsertDailyQuizHistoryEntry
} from '@/server/history/repository';
import type { DailyQuizHistoryEntry, QuizQuestion, StudyStreakStats } from '@/types/quiz';

export function createAndStoreTodayQuiz(
  questions: QuizQuestion[],
  quizTransform?: (questions: QuizQuestion[]) => QuizQuestion[]
): QuizQuestion[] {
  // Goal: Create an isolated daily snapshot and persist it as today's canonical quiz.
  const baseQuestions = Array.isArray(questions) ? cloneQuestions(questions) : [];
  const transformedQuestions =
    typeof quizTransform === 'function' ? quizTransform(baseQuestions) : baseQuestions;
  const questionsSnapshot = cloneQuestions(transformedQuestions);

  upsertDailyQuizHistoryEntry(toLocalDateKey(), questionsSnapshot);

  return questionsSnapshot;
}

export function getOrCreateTodayQuizSnapshot(): QuizQuestion[] {
  // Goal: Match v1 behavior: every page load gets a freshly shuffled daily snapshot.
  return createAndStoreTodayQuiz(sourceQuestions, shuffleQuestionChoices);
}

export function getDailyQuizHistory(): DailyQuizHistoryEntry[] {
  return listDailyQuizHistoryEntries();
}

export function getDailyQuizByDate(date: string): DailyQuizHistoryEntry | null {
  if (!date) {
    return null;
  }

  return findDailyQuizHistoryEntryByDate(date);
}

export function buildMegaQuizFromDates(dates: string[]): QuizQuestion[] {
  return buildMegaQuizFromHistory(dates);
}

export function buildShuffledMegaQuizFromPast(): QuizQuestion[] {
  // Goal: Build a 35-question mega quiz from past days only (exclude today).
  const historyEntries = listDailyQuizHistoryEntries();

  return buildShuffledMegaQuizFromHistory(historyEntries, {
    excludeDate: toLocalDateKey(),
    questionsPerQuiz: 5,
    totalQuestions: 35
  });
}

export function getStudyStreakStats(today: Date = new Date()): StudyStreakStats {
  // Goal: Compute current consecutive-day streak ending today.
  // We walk backward day-by-day until the first missing date.
  const historyEntries = listDailyQuizHistoryEntries();
  const uniqueDates = [...new Set(historyEntries.map((entry) => entry.date).filter(Boolean))];
  const dateSet = new Set(uniqueDates);

  let currentStreakDays = 0;
  const cursor = new Date(today);

  while (dateSet.has(toLocalDateKey(cursor))) {
    currentStreakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    currentStreakDays,
    studiedToday: dateSet.has(toLocalDateKey(today)),
    totalStudyDays: uniqueDates.length
  };
}
