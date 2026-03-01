import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

type SqliteDatabase = InstanceType<typeof Database>;

declare global {
  var __quizDb: SqliteDatabase | undefined;
}

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
  fs.mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });
}

function initializeDatabase(database: SqliteDatabase): void {
  database.pragma('journal_mode = WAL');
  database.exec(CREATE_DAILY_QUIZ_HISTORY_TABLE_SQL);
}

export function getDatabase(): SqliteDatabase {
  if (!global.__quizDb) {
    ensureDataDirectoryExists();
    const database = new Database(DATABASE_PATH);
    initializeDatabase(database);
    global.__quizDb = database;
  }

  return global.__quizDb;
}
