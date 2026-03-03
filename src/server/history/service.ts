import { toLocalDateKey } from '@/lib/date';
import { cloneQuestions, shuffleQuestionChoices } from '@/lib/quiz-transform';
import { buildShuffledMegaQuizFromHistory } from '@/server/history/mega-quiz';
import {
  buildMegaQuizFromDates as buildMegaQuizFromHistory,
  createDailyQuizHistoryEntry,
  deleteDailyQuizHistoryEntryByDate,
  findDailyQuizHistoryEntryByDate,
  findLatestDailyQuizHistoryBeforeDate,
  listDailyQuizHistoryEntries,
  renameDailyQuizHistoryEntryDate,
  updateDailyQuizHistoryEntryByDate,
  upsertDailyQuizHistoryEntry
} from '@/server/history/repository';
import { logDebug, logError } from '@/server/logging';
import type { DailyQuizHistoryEntry, QuizQuestion, StudyStreakStats } from '@/types/quiz';

export interface TodayQuizSnapshotResult {
  questions: QuizQuestion[];
  subject: string | null;
  saveError: string | null;
}

export interface TodayQuizStateResult extends TodayQuizSnapshotResult {
  hasTodayQuiz: boolean;
}

export async function createAndStoreTodayQuiz(
  questions: QuizQuestion[],
  quizTransform?: (questions: QuizQuestion[]) => QuizQuestion[],
  subject: string | null = null
): Promise<TodayQuizSnapshotResult> {
  const todayDateKey = toLocalDateKey();
  const baseQuestions = Array.isArray(questions) ? cloneQuestions(questions) : [];
  const transformedQuestions =
    typeof quizTransform === 'function' ? quizTransform(baseQuestions) : baseQuestions;
  const questionsSnapshot = cloneQuestions(transformedQuestions);

  try {
    const savedEntry = await upsertDailyQuizHistoryEntry(todayDateKey, questionsSnapshot, subject);

    logDebug('today_quiz.store.success', {
      date: todayDateKey,
      questionCount: questionsSnapshot.length
    });

    return {
      questions: questionsSnapshot,
      subject: savedEntry.subject,
      saveError: null
    };
  } catch (error) {
    logError('today_quiz.store.failed', error, {
      date: todayDateKey,
      questionCount: questionsSnapshot.length
    });

    return {
      questions: [],
      subject: null,
      saveError: 'Unable to save today quiz to database.'
    };
  }
}

export async function getTodayQuizSnapshot(): Promise<TodayQuizStateResult> {
  const todayDateKey = toLocalDateKey();

  try {
    const todayEntry = await findDailyQuizHistoryEntryByDate(todayDateKey);

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
  } catch (error) {
    logError('today_quiz.snapshot.failed', error, { date: todayDateKey });
    return {
      hasTodayQuiz: false,
      questions: [],
      subject: null,
      saveError: 'Unable to read today quiz from database.'
    };
  }
}

export async function createTodayQuizFromLatestHistory(
  subject: string | null = null
): Promise<TodayQuizSnapshotResult> {
  const todayDateKey = toLocalDateKey();

  try {
    const todayEntry = await findDailyQuizHistoryEntryByDate(todayDateKey);
    if (todayEntry && todayEntry.questions.length > 0) {
      return {
        questions: cloneQuestions(todayEntry.questions),
        subject: todayEntry.subject,
        saveError: null
      };
    }

    const sourceEntry = await findLatestDailyQuizHistoryBeforeDate(todayDateKey);
    if (!sourceEntry || sourceEntry.questions.length === 0) {
      return {
        questions: [],
        subject: null,
        saveError: 'No previous quiz history found. Create at least one day in history first.'
      };
    }

    return await createAndStoreTodayQuiz(
      sourceEntry.questions,
      shuffleQuestionChoices,
      subject || sourceEntry.subject
    );
  } catch (error) {
    logError('today_quiz.create_from_latest.failed', error, {
      date: todayDateKey
    });
    return {
      questions: [],
      subject: null,
      saveError: 'Unable to create today quiz from latest history.'
    };
  }
}

export async function createTodayQuizFromShuffledMegaQuiz(
  subject: string | null = null
): Promise<TodayQuizSnapshotResult> {
  const todayDateKey = toLocalDateKey();

  try {
    const todayEntry = await findDailyQuizHistoryEntryByDate(todayDateKey);
    if (todayEntry && todayEntry.questions.length > 0) {
      return {
        questions: cloneQuestions(todayEntry.questions),
        subject: todayEntry.subject,
        saveError: null
      };
    }

    const questions = await buildShuffledMegaQuizFromPast();
    if (questions.length === 0) {
      return {
        questions: [],
        subject: null,
        saveError: 'No past quiz history found. Complete quizzes on previous days first.'
      };
    }

    return await createAndStoreTodayQuiz(questions, undefined, subject || 'Shuffled Mega Quiz');
  } catch (error) {
    logError('today_quiz.create_from_shuffle.failed', error, {
      date: todayDateKey
    });
    return {
      questions: [],
      subject: null,
      saveError: 'Unable to create today quiz from shuffled history.'
    };
  }
}

export async function createTodayQuizFromJson(
  questions: QuizQuestion[],
  subject: string | null = null
): Promise<TodayQuizSnapshotResult> {
  return createAndStoreTodayQuiz(questions, undefined, subject || 'JSON Quiz');
}

export async function getDailyQuizHistory(): Promise<DailyQuizHistoryEntry[]> {
  return listDailyQuizHistoryEntries();
}

export async function getDailyQuizByDate(date: string): Promise<DailyQuizHistoryEntry | null> {
  if (!date) {
    return null;
  }

  return findDailyQuizHistoryEntryByDate(date);
}

export async function createDailyQuizByCopy(
  date: string,
  sourceDate: string
):
  Promise<
    { kind: 'created'; entry: DailyQuizHistoryEntry } | { kind: 'source_not_found' } | { kind: 'date_conflict' }
  > {
  const sourceEntry = await findDailyQuizHistoryEntryByDate(sourceDate);
  if (!sourceEntry) {
    return { kind: 'source_not_found' };
  }

  const createdEntry = await createDailyQuizHistoryEntry(date, sourceEntry.questions, sourceEntry.subject);
  if (!createdEntry) {
    return { kind: 'date_conflict' };
  }

  return { kind: 'created', entry: createdEntry };
}

export async function createDailyQuizByJson(
  date: string,
  questions: QuizQuestion[],
  subject: string | null = null
):
  Promise<
    { kind: 'created'; entry: DailyQuizHistoryEntry } | { kind: 'date_conflict' }
  > {
  const createdEntry = await createDailyQuizHistoryEntry(date, questions, subject);
  if (!createdEntry) {
    return { kind: 'date_conflict' };
  }

  return { kind: 'created', entry: createdEntry };
}

export async function renameDailyQuizDate(
  currentDate: string,
  nextDate: string
): Promise<'updated' | 'not_found' | 'conflict'> {
  return renameDailyQuizHistoryEntryDate(currentDate, nextDate);
}

export async function updateDailyQuizByDate(
  date: string,
  questions: QuizQuestion[],
  subject: string | null = null
): Promise<DailyQuizHistoryEntry | null> {
  return updateDailyQuizHistoryEntryByDate(date, questions, subject);
}

export async function deleteDailyQuizByDate(date: string): Promise<boolean> {
  return deleteDailyQuizHistoryEntryByDate(date);
}

export async function buildMegaQuizFromDates(dates: string[]): Promise<QuizQuestion[]> {
  return buildMegaQuizFromHistory(dates);
}

export async function buildShuffledMegaQuizFromPast(): Promise<QuizQuestion[]> {
  const historyEntries = await listDailyQuizHistoryEntries();

  return buildShuffledMegaQuizFromHistory(historyEntries, {
    excludeDate: toLocalDateKey(),
    questionsPerQuiz: 5,
    totalQuestions: 35
  });
}

export async function getStudyStreakStats(today: Date = new Date()): Promise<StudyStreakStats> {
  try {
    const historyEntries = await listDailyQuizHistoryEntries();
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
  } catch (error) {
    logError('study_streak.compute.failed', error);
    return {
      currentStreakDays: 0,
      studiedToday: false,
      totalStudyDays: 0
    };
  }
}
