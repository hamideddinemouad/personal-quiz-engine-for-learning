declare module 'pg' {
  export interface QueryResult<Row = Record<string, unknown>> {
    rows: Row[];
    rowCount: number | null;
  }

  export interface PoolConfig {
    connectionString?: string;
    ssl?: boolean | { rejectUnauthorized?: boolean };
    max?: number;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    query<Row = Record<string, unknown>>(
      text: string,
      values?: ReadonlyArray<unknown>
    ): Promise<QueryResult<Row>>;
    on(event: 'error', listener: (error: Error) => void): this;
    end(): Promise<void>;
  }
}
