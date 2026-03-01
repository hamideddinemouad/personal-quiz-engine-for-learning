declare module 'better-sqlite3' {
  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  interface Statement {
    run(...params: unknown[]): RunResult;
    get<T = unknown>(...params: unknown[]): T;
    all<T = unknown>(...params: unknown[]): T[];
  }

  export default class Database {
    constructor(filename: string, options?: unknown);
    pragma(source: string): unknown;
    exec(source: string): this;
    prepare(source: string): Statement;
  }
}
