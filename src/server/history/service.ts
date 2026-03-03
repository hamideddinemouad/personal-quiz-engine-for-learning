import { toLocalDateKey } from '@/lib/date';
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
  subject: string | null;
  saveError: string | null;
}

export interface TodayQuizStateResult extends TodayQuizSnapshotResult {
  hasTodayQuiz: boolean;
}

export function createAndStoreTodayQuiz(
  questions: QuizQuestion[],
  quizTransform?: (questions: QuizQuestion[]) => QuizQuestion[],
  subject: string | null = null
): TodayQuizSnapshotResult {
  // Goal: Create an isolated daily snapshot and persist it as today's canonical quiz.
  const todayDateKey = toLocalDateKey();
  const baseQuestions = Array.isArray(questions) ? cloneQuestions(questions) : [];
  const transformedQuestions =
    typeof quizTransform === 'function' ? quizTransform(baseQuestions) : baseQuestions;
  const questionsSnapshot = cloneQuestions(transformedQuestions);

  const savedEntry = upsertDailyQuizHistoryEntry(todayDateKey, questionsSnapshot, subject);

  return {
    questions: questionsSnapshot,
    subject: savedEntry.subject,
    saveError: null
  };
}

export function getTodayQuizSnapshot(): TodayQuizStateResult {
  // Goal: Read today's quiz from DB only without creating fallback snapshots.
  const todayDateKey = toLocalDateKey();
  const todayEntry = findDailyQuizHistoryEntryByDate(todayDateKey);

  if (!todayEntry || todayEntry.questions.length === 0) {
    return {
      hasTodayQuiz: false,
      questions: [],
      subject: null,
      saveError: null
    };
  }

  return {
    hasTodayQuiz: true,
    questions: cloneQuestions(todayEntry.questions),
    subject: todayEntry.subject,
    saveError: null
  };
}

export function createTodayQuizFromLatestHistory(subject: string | null = null): TodayQuizSnapshotResult {
  // Goal: If today's row is missing, initialize it from the latest previous snapshot.
  const todayDateKey = toLocalDateKey();
  const todayEntry = findDailyQuizHistoryEntryByDate(todayDateKey);
  if (todayEntry && todayEntry.questions.length > 0) {
    return {
      questions: cloneQuestions(todayEntry.questions),
      subject: todayEntry.subject,
      saveError: null
    };
  }

  const sourceEntry = findLatestDailyQuizHistoryBeforeDate(todayDateKey);
  if (!sourceEntry || sourceEntry.questions.length === 0) {
    return {
      questions: [],
      subject: null,
      saveError: 'No previous quiz history found. Create at least one day in history first.'
    };
  }

  return createAndStoreTodayQuiz(
    sourceEntry.questions,
    shuffleQuestionChoices,
    subject || sourceEntry.subject
  );
}

export function createTodayQuizFromShuffledMegaQuiz(
  subject: string | null = null
): TodayQuizSnapshotResult {
  // Goal: If today's row is missing, persist a mega quiz as today's canonical snapshot.
  const todayDateKey = toLocalDateKey();
  const todayEntry = findDailyQuizHistoryEntryByDate(todayDateKey);
  if (todayEntry && todayEntry.questions.length > 0) {
    return {
      questions: cloneQuestions(todayEntry.questions),
      subject: todayEntry.subject,
      saveError: null
    };
  }

  const questions = buildShuffledMegaQuizFromPast();
  if (questions.length === 0) {
    return {
      questions: [],
      subject: null,
      saveError: 'No past quiz history found. Complete quizzes on previous days first.'
    };
  }

  return createAndStoreTodayQuiz(questions, undefined, subject || 'Shuffled Mega Quiz');
}

export function createTodayQuizFromJson(
  questions: QuizQuestion[],
  subject: string | null = null
): TodayQuizSnapshotResult {
  // Goal: Persist a user-pasted JSON quiz as today's canonical quiz.
  return createAndStoreTodayQuiz(questions, undefined, subject || 'JSON Quiz');
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

  const createdEntry = createDailyQuizHistoryEntry(date, sourceEntry.questions, sourceEntry.subject);
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
