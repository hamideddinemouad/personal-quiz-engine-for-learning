import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

type SqliteDatabase = InstanceType<typeof Database>;

declare global {
  var __quizDb: SqliteDatabase | undefined;
}

const DEFAULT_DATABASE_FILE_NAME = 'quiz-history.sqlite';

function isVercelRuntime(): boolean {
  return process.env.VERCEL === '1' || process.env.VERCEL === 'true';
}

function resolveDatabasePath(): string {
  const explicitPath = process.env.QUIZ_DB_PATH?.trim();
  if (explicitPath) {
    return path.isAbsolute(explicitPath)
      ? explicitPath
      : path.resolve(process.cwd(), explicitPath);
  }

  // Vercel serverless functions can only write in /tmp.
  if (isVercelRuntime()) {
    return path.join('/tmp', DEFAULT_DATABASE_FILE_NAME);
  }

  const rootDataDirectory = path.join(process.cwd(), 'data');
  if (fs.existsSync(rootDataDirectory)) {
    return path.join(rootDataDirectory, DEFAULT_DATABASE_FILE_NAME);
  }

  // Backward compatibility for older nested layout.
  return path.join(process.cwd(), 'v2-next', 'data', DEFAULT_DATABASE_FILE_NAME);
}

const DATABASE_PATH = resolveDatabasePath();

const CREATE_DAILY_QUIZ_HISTORY_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS daily_quiz_history (
  date TEXT PRIMARY KEY,
  saved_at TEXT NOT NULL,
  subject TEXT,
  questions_json TEXT NOT NULL
);
`;

function ensureDailyQuizHistorySubjectColumn(database: SqliteDatabase): void {
  const columns = database
    .prepare('PRAGMA table_info(daily_quiz_history)')
    .all() as Array<{ name: string }>;
  const hasSubjectColumn = columns.some((column) => column.name === 'subject');

  if (!hasSubjectColumn) {
    database.exec('ALTER TABLE daily_quiz_history ADD COLUMN subject TEXT;');
  }
}

function ensureDataDirectoryExists(): void {
  // Goal: Guarantee sqlite file creation does not fail on missing parent folder.
  fs.mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });
}

function initializeDatabase(database: SqliteDatabase): void {
  // Goal: Configure sqlite once and ensure required schema exists.
  database.pragma('busy_timeout = 5000');

  // WAL is best for local long-lived process.
  // On Vercel, DELETE mode avoids extra WAL/SHM file churn in /tmp.
  database.pragma(`journal_mode = ${isVercelRuntime() ? 'DELETE' : 'WAL'}`);

  database.exec(CREATE_DAILY_QUIZ_HISTORY_TABLE_SQL);
  ensureDailyQuizHistorySubjectColumn(database);
}

export function getDatabase(): SqliteDatabase {
  // Goal: Reuse one process-wide connection to avoid duplicate handles.
  if (!global.__quizDb) {
    ensureDataDirectoryExists();
    const database = new Database(DATABASE_PATH);
    initializeDatabase(database);
    global.__quizDb = database;
  }

  return global.__quizDb;
}
