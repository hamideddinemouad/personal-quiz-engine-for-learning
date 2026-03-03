import { Pool } from 'pg';
import { logDebug, logError, logInfo } from '@/server/logging';

declare global {
  var __quizDbPool: Pool | undefined;
  var __quizSchemaReady: Promise<void> | undefined;
}

const DATABASE_URL_ENV_KEYS = ['DATABASE_URL', 'POSTGRES_URL', 'NEON_DATABASE_URL'] as const;
type DatabaseUrlEnvKey = (typeof DATABASE_URL_ENV_KEYS)[number];

function resolveDatabaseUrl(): { databaseUrl: string; sourceEnv: DatabaseUrlEnvKey } {
  for (const envKey of DATABASE_URL_ENV_KEYS) {
    const candidate = process.env[envKey]?.trim();
    if (candidate) {
      return {
        databaseUrl: candidate,
        sourceEnv: envKey
      };
    }
  }

  throw new Error(
    `Database URL is missing. Set one of: ${DATABASE_URL_ENV_KEYS.join(', ')}.`
  );
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
    const { databaseUrl, sourceEnv } = resolveDatabaseUrl();
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
      ssl: shouldUseSsl(databaseUrl),
      sourceEnv
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS data_safety_state (
        singleton_key TEXT PRIMARY KEY,
        updated_at TEXT NOT NULL,
        wish_list_json JSONB NOT NULL DEFAULT '[]'::jsonb
      );
    `);
    // Keep migration style consistent with the rest of this app:
    // CREATE + additive ALTER statements let old DBs upgrade in-place safely.

    await pool.query(`
      ALTER TABLE data_safety_state
      ADD COLUMN IF NOT EXISTS updated_at TEXT;
    `);

    await pool.query(`
      ALTER TABLE data_safety_state
      ADD COLUMN IF NOT EXISTS wish_list_json JSONB NOT NULL DEFAULT '[]'::jsonb;
    `);

    await pool.query(`
      ALTER TABLE data_safety_state
      ALTER COLUMN wish_list_json TYPE JSONB
      USING wish_list_json::jsonb;
    `);

    logDebug('db.schema.ready', {
      tables: ['daily_quiz_history', 'data_safety_state']
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
