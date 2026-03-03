import { cloneQuestions } from '@/lib/quiz-transform';
import { getDatabase } from '@/server/db/client';
import type { DailyQuizHistoryEntry, QuizQuestion } from '@/types/quiz';

const MAX_DAYS_STORED = 365;

type HistoryRow = {
  date: string;
  saved_at: string;
  subject: string | null;
  questions_json: string;
};

function normalizeSubject(subject: string | null | undefined): string | null {
  if (typeof subject !== 'string') {
    return null;
  }

  const normalized = subject.trim();
  return normalized.length > 0 ? normalized : null;
}

function mapRowToEntry(row: HistoryRow): DailyQuizHistoryEntry | null {
  // Goal: Convert raw SQL row into validated app shape.
  // Invalid JSON or wrong structure is treated as corrupt data and ignored.
  try {
    const parsedQuestions = JSON.parse(row.questions_json) as QuizQuestion[];
    if (!Array.isArray(parsedQuestions)) {
      return null;
    }

    return {
      date: row.date,
      savedAt: row.saved_at,
      subject: normalizeSubject(row.subject),
      questions: cloneQuestions(parsedQuestions)
    };
  } catch {
    return null;
  }
}

function trimHistoryToMaxDays(maxDays: number = MAX_DAYS_STORED): void {
  // Goal: Keep storage bounded by deleting oldest dates first.
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
  questionsSnapshot: QuizQuestion[],
  subject: string | null = null
): DailyQuizHistoryEntry {
  // Goal: Store one canonical snapshot per date (insert new / replace existing).
  const database = getDatabase();
  const snapshot = cloneQuestions(questionsSnapshot);
  const savedAt = new Date().toISOString();
  const normalizedSubject = normalizeSubject(subject);

  database
    .prepare(
      `
      INSERT INTO daily_quiz_history (date, saved_at, subject, questions_json)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        saved_at = excluded.saved_at,
        subject = excluded.subject,
        questions_json = excluded.questions_json;
      `
    )
    .run(date, savedAt, normalizedSubject, JSON.stringify(snapshot));

  trimHistoryToMaxDays();

  return {
    date,
    savedAt,
    subject: normalizedSubject,
    questions: cloneQuestions(snapshot)
  };
}

export function createDailyQuizHistoryEntry(
  date: string,
  questionsSnapshot: QuizQuestion[],
  subject: string | null = null
): DailyQuizHistoryEntry | null {
  // Goal: Create only a brand-new date row. If date already exists, return null.
  const database = getDatabase();
  const snapshot = cloneQuestions(questionsSnapshot);
  const savedAt = new Date().toISOString();
  const normalizedSubject = normalizeSubject(subject);

  const insertResult = database
    .prepare(
      `
      INSERT OR IGNORE INTO daily_quiz_history (date, saved_at, subject, questions_json)
      VALUES (?, ?, ?, ?);
      `
    )
    .run(date, savedAt, normalizedSubject, JSON.stringify(snapshot));

  if (insertResult.changes === 0) {
    return null;
  }

  trimHistoryToMaxDays();

  return {
    date,
    savedAt,
    subject: normalizedSubject,
    questions: cloneQuestions(snapshot)
  };
}

export function listDailyQuizHistoryEntries(): DailyQuizHistoryEntry[] {
  // Goal: Return ascending date history and silently skip corrupt rows.
  const database = getDatabase();
  const rows = database
    .prepare('SELECT date, saved_at, subject, questions_json FROM daily_quiz_history ORDER BY date ASC')
    .all() as HistoryRow[];

  return rows
    .map(mapRowToEntry)
    .filter((entry): entry is DailyQuizHistoryEntry => Boolean(entry));
}

export function findDailyQuizHistoryEntryByDate(date: string): DailyQuizHistoryEntry | null {
  // Goal: Fetch exactly one day snapshot when available.
  const database = getDatabase();
  const row = database
    .prepare(
      'SELECT date, saved_at, subject, questions_json FROM daily_quiz_history WHERE date = ? LIMIT 1'
    )
    .get(date) as HistoryRow | undefined;

  if (!row) {
    return null;
  }

  return mapRowToEntry(row);
}

export function findLatestDailyQuizHistoryBeforeDate(date: string): DailyQuizHistoryEntry | null {
  // Goal: Fetch the chronologically closest row before `date`.
  // Date keys use YYYY-MM-DD, so lexicographic order matches time order.
  const database = getDatabase();
  const row = database
    .prepare(
      `
      SELECT date, saved_at, subject, questions_json
      FROM daily_quiz_history
      WHERE date < ?
      ORDER BY date DESC
      LIMIT 1
      `
    )
    .get(date) as HistoryRow | undefined;

  if (!row) {
    return null;
  }

  return mapRowToEntry(row);
}

export function renameDailyQuizHistoryEntryDate(
  currentDate: string,
  nextDate: string
): 'updated' | 'not_found' | 'conflict' {
  // Goal: Move one row to a different date key without touching question payload.
  const database = getDatabase();

  const existingRow = database
    .prepare('SELECT date FROM daily_quiz_history WHERE date = ? LIMIT 1')
    .get(currentDate) as { date: string } | undefined;
  if (!existingRow) {
    return 'not_found';
  }

  if (currentDate === nextDate) {
    return 'updated';
  }

  const targetRow = database
    .prepare('SELECT date FROM daily_quiz_history WHERE date = ? LIMIT 1')
    .get(nextDate) as { date: string } | undefined;
  if (targetRow) {
    return 'conflict';
  }

  database
    .prepare(
      `
      UPDATE daily_quiz_history
      SET date = ?, saved_at = ?
      WHERE date = ?;
      `
    )
    .run(nextDate, new Date().toISOString(), currentDate);

  return 'updated';
}

export function deleteDailyQuizHistoryEntryByDate(date: string): boolean {
  const database = getDatabase();
  const result = database.prepare('DELETE FROM daily_quiz_history WHERE date = ?').run(date);
  return result.changes > 0;
}

export function buildMegaQuizFromDates(dates: string[]): QuizQuestion[] {
  // Goal: Build deterministic mega quiz input from caller-selected dates.
  // We dedupe dates and clone questions to protect DB snapshots from mutation.
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
