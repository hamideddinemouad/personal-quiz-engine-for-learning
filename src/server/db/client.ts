import { Pool } from 'pg';
import { logDebug, logError, logInfo } from '@/server/logging';

declare global {
  var __quizDbPool: Pool | undefined;
  var __quizSchemaReady: Promise<void> | undefined;
}

function resolveDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to run quiz history on Postgres.');
  }

  return databaseUrl;
}

function toSafeDatabaseTarget(databaseUrl: string): string {
  try {
    const parsed = new URL(databaseUrl);
    return `${parsed.hostname}:${parsed.port || '5432'}`;
  } catch {
    return 'invalid_database_url';
  }
}

function shouldUseSsl(databaseUrl: string): boolean {
  try {
    const parsed = new URL(databaseUrl);
    const host = parsed.hostname.toLowerCase();
    const sslMode = parsed.searchParams.get('sslmode')?.toLowerCase();

    // Local Docker/Postgres usually runs without TLS, while Neon requires TLS.
    if (host === 'localhost' || host === '127.0.0.1') {
      return sslMode === 'require';
    }

    return true;
  } catch {
    return false;
  }
}

function getOrCreatePool(): Pool {
  if (!global.__quizDbPool) {
    const databaseUrl = resolveDatabaseUrl();
    global.__quizDbPool = new Pool({
      connectionString: databaseUrl,
      ssl: shouldUseSsl(databaseUrl) ? { rejectUnauthorized: false } : undefined,
      max: 5
    });

    global.__quizDbPool.on('error', (error: Error) => {
      logError('db.pool.unexpected_error', error);
    });

    logInfo('db.pool.initialized', {
      target: toSafeDatabaseTarget(databaseUrl),
      ssl: shouldUseSsl(databaseUrl)
    });
  }

  return global.__quizDbPool;
}

async function initializeSchema(pool: Pool): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_quiz_history (
        date TEXT PRIMARY KEY,
        saved_at TEXT NOT NULL,
        subject TEXT,
        questions_json JSONB NOT NULL
      );
    `);

    await pool.query(`
      ALTER TABLE daily_quiz_history
      ADD COLUMN IF NOT EXISTS subject TEXT;
    `);

    await pool.query(`
      ALTER TABLE daily_quiz_history
      ALTER COLUMN questions_json TYPE JSONB
      USING questions_json::jsonb;
    `);

    logDebug('db.schema.ready', {
      table: 'daily_quiz_history'
    });
  } catch (error) {
    logError('db.schema.failed', error);
    throw error;
  }
}

export async function getDbPool(): Promise<Pool> {
  const pool = getOrCreatePool();

  if (!global.__quizSchemaReady) {
    global.__quizSchemaReady = initializeSchema(pool).catch((error) => {
      // If schema setup fails once, retry on next request instead of freezing forever.
      global.__quizSchemaReady = undefined;
      throw error;
    });
  }

  await global.__quizSchemaReady;
  return pool;
}
