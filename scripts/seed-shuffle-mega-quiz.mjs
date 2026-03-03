#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const CREATE_DAILY_QUIZ_HISTORY_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS daily_quiz_history (
  date TEXT PRIMARY KEY,
  saved_at TEXT NOT NULL,
  subject TEXT,
  questions_json TEXT NOT NULL
);
`;

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsedDate = new Date(year, monthIndex, day, 12, 0, 0, 0);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== monthIndex ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

function addDays(date, amount) {
  const nextDate = new Date(date.getTime());
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

function parsePositiveInteger(value, fallback) {
  if (value == null) {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

function hashString(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRng(seed) {
  let state = seed === 0 ? 1 : seed >>> 0;

  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function shuffle(values, random) {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function cloneQuestion(question) {
  return {
    ...question,
    options: Array.isArray(question.options) ? question.options.map((option) => ({ ...option })) : [],
    whyOptions: Array.isArray(question.whyOptions)
      ? question.whyOptions.map((option) => ({ ...option }))
      : undefined
  };
}

function buildDaySnapshot(baseQuestions, dateKey) {
  const random = createRng(hashString(`quiz-${dateKey}`));
  const questions = shuffle(baseQuestions.map(cloneQuestion), random);

  return questions.map((question) => ({
    ...question,
    options: shuffle(question.options, random),
    whyOptions: Array.isArray(question.whyOptions) ? shuffle(question.whyOptions, random) : undefined
  }));
}

function buildSavedAt(dateKey) {
  const seed = hashString(`saved-at-${dateKey}`);
  const hour = 8 + (seed % 12);
  const minute = (seed >>> 8) % 60;
  const second = (seed >>> 16) % 60;

  return `${dateKey}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}.000Z`;
}

function readSourceQuestions(database, sourceDateKey) {
  const row = sourceDateKey
    ? database
        .prepare('SELECT date, questions_json FROM daily_quiz_history WHERE date = ? LIMIT 1')
        .get(sourceDateKey)
    : database
        .prepare('SELECT date, questions_json FROM daily_quiz_history ORDER BY date DESC LIMIT 1')
        .get();

  if (!row || typeof row.questions_json !== 'string') {
    return null;
  }

  try {
    const parsedQuestions = JSON.parse(row.questions_json);
    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      return null;
    }

    return {
      sourceDate: row.date,
      questions: parsedQuestions
    };
  } catch {
    return null;
  }
}

function main() {
  const projectRoot = process.cwd();
  const dataDirectory = path.join(projectRoot, 'data');
  const databasePath = path.join(dataDirectory, 'quiz-history.sqlite');

  const daysToSeed = parsePositiveInteger(readArg('--days'), 14);
  if (daysToSeed == null) {
    console.error('Invalid value for --days. Use a positive integer.');
    process.exitCode = 1;
    return;
  }

  const fromDateArg = readArg('--from');
  const fromDate = fromDateArg ? parseDateKey(fromDateArg) : new Date();
  if (!fromDate) {
    console.error('Invalid value for --from. Use YYYY-MM-DD.');
    process.exitCode = 1;
    return;
  }

  const sourceDateArg = readArg('--source-date');
  if (sourceDateArg && !parseDateKey(sourceDateArg)) {
    console.error('Invalid value for --source-date. Use YYYY-MM-DD.');
    process.exitCode = 1;
    return;
  }

  const shouldOverwrite = process.argv.includes('--overwrite');

  fs.mkdirSync(dataDirectory, { recursive: true });
  const database = new Database(databasePath);
  database.exec(CREATE_DAILY_QUIZ_HISTORY_TABLE_SQL);

  const sourceSnapshot = readSourceQuestions(database, sourceDateArg);
  if (!sourceSnapshot) {
    console.error(
      'No usable quiz snapshot found to seed from. Load the app once (or provide --source-date) before running this script.'
    );
    process.exitCode = 1;
    return;
  }

  const existingDates = new Set(
    database.prepare('SELECT date FROM daily_quiz_history').all().map((row) => row.date)
  );

  const upsertStatement = database.prepare(`
    INSERT INTO daily_quiz_history (date, saved_at, questions_json)
    VALUES (?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      saved_at = excluded.saved_at,
      questions_json = excluded.questions_json;
  `);

  const seededDates = [];
  const skippedDates = [];

  const writeTransaction = database.transaction(() => {
    for (let offset = 1; offset <= daysToSeed; offset += 1) {
      const dateKey = formatDateKey(addDays(fromDate, -offset));

      if (!shouldOverwrite && existingDates.has(dateKey)) {
        skippedDates.push(dateKey);
        continue;
      }

      const questions = buildDaySnapshot(sourceSnapshot.questions, dateKey);
      upsertStatement.run(dateKey, buildSavedAt(dateKey), JSON.stringify(questions));
      seededDates.push(dateKey);
    }
  });

  writeTransaction();
  database.close();

  console.log(`Seed source date: ${sourceSnapshot.sourceDate}`);
  console.log(`Reference day (--from): ${formatDateKey(fromDate)}`);
  console.log(`Requested days: ${daysToSeed}`);
  console.log(`Inserted/updated: ${seededDates.length}`);
  if (skippedDates.length > 0) {
    console.log(`Skipped existing: ${skippedDates.length}`);
  }

  if (seededDates.length > 0) {
    console.log(`Seeded range: ${seededDates[seededDates.length - 1]} -> ${seededDates[0]}`);
  }
}

main();
