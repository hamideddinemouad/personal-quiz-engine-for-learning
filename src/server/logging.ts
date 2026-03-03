type LogLevel = 'debug' | 'info' | 'error';

interface LogPayload {
  event: string;
  level: LogLevel;
  timestamp: string;
  details?: Record<string, unknown>;
}

interface SerializedError {
  name?: string;
  message?: string;
  stack?: string;
  code?: string;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  error: 30
};

function resolveLogLevel(): LogLevel {
  const envLevel = process.env.QUIZ_LOG_LEVEL?.trim().toLowerCase();
  if (envLevel === 'debug' || envLevel === 'info' || envLevel === 'error') {
    return envLevel;
  }

  return process.env.NODE_ENV === 'development' ? 'debug' : 'info';
}

function shouldLog(level: LogLevel): boolean {
  const activeLevel = resolveLogLevel();
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[activeLevel];
}

function writeLog(level: LogLevel, payload: LogPayload): void {
  if (!shouldLog(level)) {
    return;
  }

  // Structured JSON logs are easier to filter in Vercel log search.
  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
    return;
  }

  console.log(line);
}

function toSerializedError(error: unknown): SerializedError {
  if (!(error instanceof Error)) {
    return {
      message: typeof error === 'string' ? error : 'Unknown error'
    };
  }

  const withCode = error as Error & { code?: string };
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: withCode.code
  };
}

export function logDebug(event: string, details?: Record<string, unknown>): void {
  writeLog('debug', {
    event,
    level: 'debug',
    timestamp: new Date().toISOString(),
    details
  });
}

export function logInfo(event: string, details?: Record<string, unknown>): void {
  writeLog('info', {
    event,
    level: 'info',
    timestamp: new Date().toISOString(),
    details
  });
}

export function logError(
  event: string,
  error: unknown,
  details?: Record<string, unknown>
): void {
  writeLog('error', {
    event,
    level: 'error',
    timestamp: new Date().toISOString(),
    details: {
      ...details,
      error: toSerializedError(error)
    }
  });
}
