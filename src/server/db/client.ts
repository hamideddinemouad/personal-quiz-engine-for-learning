import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

type SqliteDatabase = InstanceType<typeof Database>;

declare global {
  var __quizDb: SqliteDatabase | undefined;
}

// Goal: Resolve a stable data path whether the app runs from repo root
// or from an older nested `v2-next` directory layout.
const PROJECT_ROOT = path.basename(process.cwd()) === 'v2-next'
  ? process.cwd()
  : path.join(process.cwd(), 'v2-next');
const DATABASE_PATH = path.join(PROJECT_ROOT, 'data', 'quiz-history.sqlite');

const CREATE_DAILY_QUIZ_HISTORY_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS daily_quiz_history (
  date TEXT PRIMARY KEY,
  saved_at TEXT NOT NULL,
  questions_json TEXT NOT NULL
);
`;

function ensureDataDirectoryExists(): void {
  // Goal: Guarantee sqlite file creation does not fail on missing parent folder.
  fs.mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });
}

function initializeDatabase(database: SqliteDatabase): void {
  // Goal: Configure sqlite once and ensure required schema exists.
  database.pragma('journal_mode = WAL');
  database.exec(CREATE_DAILY_QUIZ_HISTORY_TABLE_SQL);
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
