import { cloneQuestions } from '@/lib/quiz-transform';
import { getDatabase } from '@/server/db/client';
import type { DailyQuizHistoryEntry, QuizQuestion } from '@/types/quiz';

const MAX_DAYS_STORED = 365;

type HistoryRow = {
  date: string;
  saved_at: string;
  questions_json: string;
};

function mapRowToEntry(row: HistoryRow): DailyQuizHistoryEntry | null {
  try {
    const parsedQuestions = JSON.parse(row.questions_json) as QuizQuestion[];
    if (!Array.isArray(parsedQuestions)) {
      return null;
    }

    return {
      date: row.date,
      savedAt: row.saved_at,
      questions: cloneQuestions(parsedQuestions)
    };
  } catch {
    return null;
  }
}

function trimHistoryToMaxDays(maxDays: number = MAX_DAYS_STORED): void {
  const database = getDatabase();
  const totalCount = database
    .prepare('SELECT COUNT(1) as count FROM daily_quiz_history')
    .get() as { count: number };

  if (totalCount.count <= maxDays) {
    return;
  }

  const rowsToDelete = totalCount.count - maxDays;

  database
    .prepare(
      `
      DELETE FROM daily_quiz_history
      WHERE date IN (
        SELECT date
        FROM daily_quiz_history
        ORDER BY date ASC
        LIMIT ?
      );
      `
    )
    .run(rowsToDelete);
}

export function upsertDailyQuizHistoryEntry(
  date: string,
  questionsSnapshot: QuizQuestion[]
): DailyQuizHistoryEntry {
  const database = getDatabase();
  const snapshot = cloneQuestions(questionsSnapshot);
  const savedAt = new Date().toISOString();

  database
    .prepare(
      `
      INSERT INTO daily_quiz_history (date, saved_at, questions_json)
      VALUES (?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        saved_at = excluded.saved_at,
        questions_json = excluded.questions_json;
      `
    )
    .run(date, savedAt, JSON.stringify(snapshot));

  trimHistoryToMaxDays();

  return {
    date,
    savedAt,
    questions: cloneQuestions(snapshot)
  };
}

export function listDailyQuizHistoryEntries(): DailyQuizHistoryEntry[] {
  const database = getDatabase();
  const rows = database
    .prepare('SELECT date, saved_at, questions_json FROM daily_quiz_history ORDER BY date ASC')
    .all() as HistoryRow[];

  return rows
    .map(mapRowToEntry)
    .filter((entry): entry is DailyQuizHistoryEntry => Boolean(entry));
}

export function findDailyQuizHistoryEntryByDate(date: string): DailyQuizHistoryEntry | null {
  const database = getDatabase();
  const row = database
    .prepare('SELECT date, saved_at, questions_json FROM daily_quiz_history WHERE date = ? LIMIT 1')
    .get(date) as HistoryRow | undefined;

  if (!row) {
    return null;
  }

  return mapRowToEntry(row);
}

export function buildMegaQuizFromDates(dates: string[]): QuizQuestion[] {
  if (!Array.isArray(dates) || dates.length === 0) {
    return [];
  }

  const uniqueDates = [...new Set(dates)];

  return uniqueDates.flatMap((date) => {
    const entry = findDailyQuizHistoryEntryByDate(date);
    if (!entry) {
      return [];
    }

    return cloneQuestions(entry.questions);
  });
}
