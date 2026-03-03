import { toLocalDateKey } from '@/lib/date';
import { questions as sourceQuestions } from '@/lib/questions';
import { cloneQuestions, shuffleQuestionChoices } from '@/lib/quiz-transform';
import { buildShuffledMegaQuizFromHistory } from '@/server/history/mega-quiz';
import {
  createDailyQuizHistoryEntry,
  buildMegaQuizFromDates as buildMegaQuizFromHistory,
  deleteDailyQuizHistoryEntryByDate,
  findDailyQuizHistoryEntryByDate,
  findLatestDailyQuizHistoryBeforeDate,
  listDailyQuizHistoryEntries,
  renameDailyQuizHistoryEntryDate,
  upsertDailyQuizHistoryEntry
} from '@/server/history/repository';
import type { DailyQuizHistoryEntry, QuizQuestion, StudyStreakStats } from '@/types/quiz';

export interface TodayQuizSnapshotResult {
  questions: QuizQuestion[];
  saveError: string | null;
}

function areQuestionSnapshotsEquivalent(left: QuizQuestion[], right: QuizQuestion[]): boolean {
  // Goal: Treat two snapshots as "similar" only when full serialized content matches.
  // This avoids false positives because every day shares the same question set.
  return JSON.stringify(left) === JSON.stringify(right);
}

export function createAndStoreTodayQuiz(
  questions: QuizQuestion[],
  quizTransform?: (questions: QuizQuestion[]) => QuizQuestion[]
): TodayQuizSnapshotResult {
  // Goal: Create an isolated daily snapshot and persist it as today's canonical quiz.
  const todayDateKey = toLocalDateKey();
  const baseQuestions = Array.isArray(questions) ? cloneQuestions(questions) : [];
  const transformedQuestions =
    typeof quizTransform === 'function' ? quizTransform(baseQuestions) : baseQuestions;
  const questionsSnapshot = cloneQuestions(transformedQuestions);
  const previousEntry = findLatestDailyQuizHistoryBeforeDate(todayDateKey);

  if (previousEntry && areQuestionSnapshotsEquivalent(questionsSnapshot, previousEntry.questions)) {
    return {
      questions: questionsSnapshot,
      saveError: `Today's snapshot was not saved because it matches ${previousEntry.date}.`
    };
  }

  upsertDailyQuizHistoryEntry(todayDateKey, questionsSnapshot);

  return {
    questions: questionsSnapshot,
    saveError: null
  };
}

export function getOrCreateTodayQuizSnapshot(): TodayQuizSnapshotResult {
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

export function createDailyQuizByCopy(
  date: string,
  sourceDate: string
):
  | { kind: 'created'; entry: DailyQuizHistoryEntry }
  | { kind: 'source_not_found' }
  | { kind: 'date_conflict' } {
  // Goal: Support admin-style history creation from an existing source snapshot.
  const sourceEntry = findDailyQuizHistoryEntryByDate(sourceDate);
  if (!sourceEntry) {
    return { kind: 'source_not_found' };
  }

  const createdEntry = createDailyQuizHistoryEntry(date, sourceEntry.questions);
  if (!createdEntry) {
    return { kind: 'date_conflict' };
  }

  return { kind: 'created', entry: createdEntry };
}

export function renameDailyQuizDate(
  currentDate: string,
  nextDate: string
): 'updated' | 'not_found' | 'conflict' {
  return renameDailyQuizHistoryEntryDate(currentDate, nextDate);
}

export function deleteDailyQuizByDate(date: string): boolean {
  return deleteDailyQuizHistoryEntryByDate(date);
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
