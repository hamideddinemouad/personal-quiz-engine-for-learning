import { cloneQuestions } from '@/lib/quiz-transform';
import { getDbPool } from '@/server/db/client';
import { logDebug, logError } from '@/server/logging';
import type { DailyQuizHistoryEntry, QuizQuestion } from '@/types/quiz';

const MAX_DAYS_STORED = 365;

type HistoryRow = {
  date: string;
  saved_at: string;
  subject: string | null;
  questions_json: unknown;
};

function normalizeSubject(subject: string | null | undefined): string | null {
  if (typeof subject !== 'string') {
    return null;
  }

  const normalized = subject.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseQuestionsSnapshot(rawValue: unknown): QuizQuestion[] | null {
  // `pg` can return JSONB as object/array, but some proxy layers may return text.
  if (Array.isArray(rawValue)) {
    return cloneQuestions(rawValue as QuizQuestion[]);
  }

  if (typeof rawValue === 'string') {
    try {
      const parsed = JSON.parse(rawValue) as QuizQuestion[];
      return Array.isArray(parsed) ? cloneQuestions(parsed) : null;
    } catch {
      return null;
    }
  }

  return null;
}

function mapRowToEntry(row: HistoryRow): DailyQuizHistoryEntry | null {
  const parsedQuestions = parseQuestionsSnapshot(row.questions_json);
  if (!parsedQuestions) {
    return null;
  }

  return {
    date: row.date,
    savedAt: row.saved_at,
    subject: normalizeSubject(row.subject),
    questions: parsedQuestions
  };
}

async function trimHistoryToMaxDays(maxDays: number = MAX_DAYS_STORED): Promise<void> {
  const pool = await getDbPool();
  const countResult = await pool.query<{ count: string }>(
    `
      SELECT COUNT(1)::int::text AS count
      FROM daily_quiz_history;
    `
  );
  const totalCount = Number(countResult.rows[0]?.count ?? 0);

  if (totalCount <= maxDays) {
    return;
  }

  const rowsToDelete = totalCount - maxDays;

  await pool.query(
    `
      WITH oldest AS (
        SELECT date
        FROM daily_quiz_history
        ORDER BY date ASC
        LIMIT $1
      )
      DELETE FROM daily_quiz_history
      WHERE date IN (SELECT date FROM oldest);
    `,
    [rowsToDelete]
  );

  logDebug('history.trim.success', {
    rowsToDelete,
    maxDays
  });
}

export async function upsertDailyQuizHistoryEntry(
  date: string,
  questionsSnapshot: QuizQuestion[],
  subject: string | null = null
): Promise<DailyQuizHistoryEntry> {
  const pool = await getDbPool();
  const snapshot = cloneQuestions(questionsSnapshot);
  const savedAt = new Date().toISOString();
  const normalizedSubject = normalizeSubject(subject);

  try {
    const result = await pool.query<HistoryRow>(
      `
        INSERT INTO daily_quiz_history (date, saved_at, subject, questions_json)
        VALUES ($1, $2, $3, $4::jsonb)
        ON CONFLICT(date) DO UPDATE SET
          saved_at = excluded.saved_at,
          subject = excluded.subject,
          questions_json = excluded.questions_json
        RETURNING date, saved_at, subject, questions_json;
      `,
      [date, savedAt, normalizedSubject, JSON.stringify(snapshot)]
    );

    await trimHistoryToMaxDays();

    const mappedEntry = result.rows
      .map(mapRowToEntry)
      .find((entry: DailyQuizHistoryEntry | null): entry is DailyQuizHistoryEntry => Boolean(entry));

    if (!mappedEntry) {
      throw new Error('Saved history row is invalid or missing.');
    }

    logDebug('history.upsert.success', {
      date,
      questionCount: snapshot.length
    });

    return mappedEntry;
  } catch (error) {
    logError('history.upsert.failed', error, {
      date,
      questionCount: snapshot.length
    });
    throw error;
  }
}

export async function createDailyQuizHistoryEntry(
  date: string,
  questionsSnapshot: QuizQuestion[],
  subject: string | null = null
): Promise<DailyQuizHistoryEntry | null> {
  const pool = await getDbPool();
  const snapshot = cloneQuestions(questionsSnapshot);
  const savedAt = new Date().toISOString();
  const normalizedSubject = normalizeSubject(subject);

  try {
    const result = await pool.query<HistoryRow>(
      `
        INSERT INTO daily_quiz_history (date, saved_at, subject, questions_json)
        VALUES ($1, $2, $3, $4::jsonb)
        ON CONFLICT(date) DO NOTHING
        RETURNING date, saved_at, subject, questions_json;
      `,
      [date, savedAt, normalizedSubject, JSON.stringify(snapshot)]
    );

    if (result.rows.length === 0) {
      logDebug('history.create.skipped_conflict', { date });
      return null;
    }

    await trimHistoryToMaxDays();

    const mappedEntry = result.rows
      .map(mapRowToEntry)
      .find((entry: DailyQuizHistoryEntry | null): entry is DailyQuizHistoryEntry => Boolean(entry));

    if (!mappedEntry) {
      throw new Error('Created history row is invalid.');
    }

    logDebug('history.create.success', {
      date,
      questionCount: snapshot.length
    });

    return mappedEntry;
  } catch (error) {
    logError('history.create.failed', error, {
      date,
      questionCount: snapshot.length
    });
    throw error;
  }
}

export async function updateDailyQuizHistoryEntryByDate(
  date: string,
  questionsSnapshot: QuizQuestion[],
  subject: string | null = null
): Promise<DailyQuizHistoryEntry | null> {
  const pool = await getDbPool();
  const snapshot = cloneQuestions(questionsSnapshot);
  const savedAt = new Date().toISOString();
  const normalizedSubject = normalizeSubject(subject);

  try {
    const result = await pool.query<HistoryRow>(
      `
        UPDATE daily_quiz_history
        SET saved_at = $2,
            subject = $3,
            questions_json = $4::jsonb
        WHERE date = $1
        RETURNING date, saved_at, subject, questions_json;
      `,
      [date, savedAt, normalizedSubject, JSON.stringify(snapshot)]
    );

    if (result.rows.length === 0) {
      logDebug('history.update_by_date.not_found', { date });
      return null;
    }

    const mappedEntry = result.rows
      .map(mapRowToEntry)
      .find((entry: DailyQuizHistoryEntry | null): entry is DailyQuizHistoryEntry => Boolean(entry));

    if (!mappedEntry) {
      throw new Error('Updated history row is invalid.');
    }

    logDebug('history.update_by_date.success', {
      date,
      questionCount: snapshot.length
    });

    return mappedEntry;
  } catch (error) {
    logError('history.update_by_date.failed', error, {
      date,
      questionCount: snapshot.length
    });
    throw error;
  }
}

export async function listDailyQuizHistoryEntries(): Promise<DailyQuizHistoryEntry[]> {
  const pool = await getDbPool();

  try {
    const result = await pool.query<HistoryRow>(
      `
        SELECT date, saved_at, subject, questions_json
        FROM daily_quiz_history
        ORDER BY date ASC;
      `
    );

    const entries = result.rows
      .map(mapRowToEntry)
      .filter((entry: DailyQuizHistoryEntry | null): entry is DailyQuizHistoryEntry => Boolean(entry));

    logDebug('history.list.success', {
      returnedCount: entries.length,
      skippedCorruptRows: result.rows.length - entries.length
    });

    return entries;
  } catch (error) {
    logError('history.list.failed', error);
    throw error;
  }
}

export async function findDailyQuizHistoryEntryByDate(
  date: string
): Promise<DailyQuizHistoryEntry | null> {
  const pool = await getDbPool();

  try {
    const result = await pool.query<HistoryRow>(
      `
        SELECT date, saved_at, subject, questions_json
        FROM daily_quiz_history
        WHERE date = $1
        LIMIT 1;
      `,
      [date]
    );
    const entry = result.rows
      .map(mapRowToEntry)
      .find((mapped: DailyQuizHistoryEntry | null): mapped is DailyQuizHistoryEntry => Boolean(mapped));

    logDebug('history.find_by_date.success', {
      date,
      found: Boolean(entry)
    });

    return entry || null;
  } catch (error) {
    logError('history.find_by_date.failed', error, { date });
    throw error;
  }
}

export async function findLatestDailyQuizHistoryBeforeDate(
  date: string
): Promise<DailyQuizHistoryEntry | null> {
  const pool = await getDbPool();

  try {
    const result = await pool.query<HistoryRow>(
      `
        SELECT date, saved_at, subject, questions_json
        FROM daily_quiz_history
        WHERE date < $1
        ORDER BY date DESC
        LIMIT 1;
      `,
      [date]
    );
    const entry = result.rows
      .map(mapRowToEntry)
      .find((mapped: DailyQuizHistoryEntry | null): mapped is DailyQuizHistoryEntry => Boolean(mapped));

    logDebug('history.find_latest_before.success', {
      beforeDate: date,
      found: Boolean(entry)
    });

    return entry || null;
  } catch (error) {
    logError('history.find_latest_before.failed', error, { beforeDate: date });
    throw error;
  }
}

export async function renameDailyQuizHistoryEntryDate(
  currentDate: string,
  nextDate: string
): Promise<'updated' | 'not_found' | 'conflict'> {
  const pool = await getDbPool();

  try {
    const existingResult = await pool.query<{ date: string }>(
      `
        SELECT date
        FROM daily_quiz_history
        WHERE date = $1
        LIMIT 1;
      `,
      [currentDate]
    );

    if (existingResult.rows.length === 0) {
      return 'not_found';
    }

    if (currentDate === nextDate) {
      return 'updated';
    }

    const targetResult = await pool.query<{ date: string }>(
      `
        SELECT date
        FROM daily_quiz_history
        WHERE date = $1
        LIMIT 1;
      `,
      [nextDate]
    );
    if (targetResult.rows.length > 0) {
      return 'conflict';
    }

    await pool.query(
      `
        UPDATE daily_quiz_history
        SET date = $1, saved_at = $2
        WHERE date = $3;
      `,
      [nextDate, new Date().toISOString(), currentDate]
    );

    logDebug('history.rename.success', {
      fromDate: currentDate,
      toDate: nextDate
    });

    return 'updated';
  } catch (error) {
    logError('history.rename.failed', error, {
      fromDate: currentDate,
      toDate: nextDate
    });
    throw error;
  }
}

export async function deleteDailyQuizHistoryEntryByDate(date: string): Promise<boolean> {
  const pool = await getDbPool();

  try {
    const result = await pool.query<{ date: string }>(
      `
        DELETE FROM daily_quiz_history
        WHERE date = $1
        RETURNING date;
      `,
      [date]
    );
    const deleted = result.rows.length > 0;

    logDebug('history.delete.success', {
      date,
      deleted
    });

    return deleted;
  } catch (error) {
    logError('history.delete.failed', error, { date });
    throw error;
  }
}

export async function buildMegaQuizFromDates(dates: string[]): Promise<QuizQuestion[]> {
  if (!Array.isArray(dates) || dates.length === 0) {
    return [];
  }

  const uniqueDates = [...new Set(dates)];
  const questions: QuizQuestion[] = [];

  for (const date of uniqueDates) {
    const entry = await findDailyQuizHistoryEntryByDate(date);
    if (!entry) {
      continue;
    }

    questions.push(...cloneQuestions(entry.questions));
  }

  return questions;
}
