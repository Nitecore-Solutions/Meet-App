import fs from "node:fs";
import { Pool } from "pg";
import { config } from "./config";
import { logger } from "./utils/logger";
import { SCHEMA_SQL } from "./db/schema";

export type DatabaseDriver = "postgres" | "pglite";

export type QueryResult<T> = {
  rows: T[];
  rowCount: number;
};

export interface Queryable {
  query<T = Record<string, unknown>>(
    text: string,
    params?: readonly unknown[]
  ): Promise<QueryResult<T>>;
}

export interface Database extends Queryable {
  exec(sql: string): Promise<void>;
  transaction<T>(fn: (client: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
  driver(): DatabaseDriver | "uninitialized";
}

type PGliteLike = {
  readonly waitReady: Promise<void>;
  query(text: string, params?: unknown[]): Promise<{ rows: unknown[]; affectedRows?: number }>;
  exec(sql: string): Promise<unknown>;
  transaction<T>(fn: (tx: PGliteLike) => Promise<T>): Promise<T>;
  close(): Promise<void>;
};

let pool: Pool | null = null;
let pglite: PGliteLike | null = null;
let activeDriver: DatabaseDriver | null = null;

function normalizeRows<T>(rows: Record<string, unknown>[]): T[] {
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      const value = row[key];
      if (value instanceof Date) row[key] = value.toISOString();
    }
  }
  return rows as T[];
}

function assertReady(): DatabaseDriver {
  if (!activeDriver) {
    throw new Error("Database has not been initialized. Call initializeDatabase() first.");
  }
  return activeDriver;
}

async function pgQuery<T>(text: string, params: readonly unknown[] = []): Promise<QueryResult<T>> {
  if (!pool) throw new Error("PostgreSQL pool is not ready.");
  const result = await pool.query(text, params as unknown[]);
  return {
    rows: normalizeRows<T>(result.rows as Record<string, unknown>[]),
    rowCount: result.rowCount ?? 0,
  };
}

async function pgliteQuery<T>(
  instance: PGliteLike,
  text: string,
  params: readonly unknown[] = []
): Promise<QueryResult<T>> {
  const result = await instance.query(text, params as unknown[]);
  return {
    rows: normalizeRows<T>(result.rows as Record<string, unknown>[]),
    rowCount: result.affectedRows ?? result.rows.length,
  };
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params: readonly unknown[] = []
): Promise<QueryResult<T>> {
  const driver = assertReady();
  if (driver === "pglite" && pglite) return pgliteQuery<T>(pglite, text, params);
  return pgQuery<T>(text, params);
}

export const database: Database = {
  driver() {
    return activeDriver ?? "uninitialized";
  },
  query,
  async exec(sql) {
    const driver = assertReady();
    if (driver === "pglite" && pglite) {
      await pglite.exec(sql);
      return;
    }
    if (!pool) throw new Error("PostgreSQL pool is not ready.");
    await pool.query(sql);
  },
  async transaction<T>(fn: (client: Queryable) => Promise<T>) {
    const driver = assertReady();
    if (driver === "pglite" && pglite) {
      return pglite.transaction(async (tx) => {
        const client: Queryable = {
          query: async <R>(text: string, params: readonly unknown[] = []) => {
            const result = await tx.query(text, params as unknown[]);
            return {
              rows: normalizeRows<R>(result.rows as Record<string, unknown>[]),
              rowCount: result.affectedRows ?? result.rows.length,
            };
          },
        };
        return fn(client);
      });
    }
    if (!pool) throw new Error("PostgreSQL pool is not ready.");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const wrapped: Queryable = {
        query: async <R>(text: string, params: readonly unknown[] = []) => {
          const result = await client.query(text, params as unknown[]);
          return {
            rows: normalizeRows<R>(result.rows as Record<string, unknown>[]),
            rowCount: result.rowCount ?? 0,
          };
        },
      };
      const value = await fn(wrapped);
      await client.query("COMMIT");
      return value;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },
  async close() {
    if (pool) {
      await pool.end();
      pool = null;
    }
    if (pglite) {
      await pglite.close();
      pglite = null;
    }
    activeDriver = null;
  },
};

export async function initializeDatabase() {
  if (activeDriver) return;

  if (config.database.url) {
    pool = new Pool({
      connectionString: config.database.url,
      max: config.database.poolMax,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : undefined,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
    });
    pool.on("error", (error) => {
      logger.error("Unexpected PostgreSQL pool error", { message: error.message });
    });
    await pool.query("SELECT 1");
    activeDriver = "postgres";
    await database.exec(SCHEMA_SQL);
    const host = (() => {
      try {
        return new URL(config.database.url).host;
      } catch {
        return "configured-host";
      }
    })();
    logger.info("Connected to PostgreSQL", { host, ssl: config.database.ssl });
    return;
  }

  fs.mkdirSync(config.database.pgliteDir, { recursive: true });
  const { PGlite: PGliteConstructor } = await import("@electric-sql/pglite");
  const instance = new PGliteConstructor(config.database.pgliteDir) as unknown as PGliteLike;
  await instance.waitReady;
  pglite = instance;
  activeDriver = "pglite";
  await database.exec(SCHEMA_SQL);
  logger.warn("DATABASE_URL is not set - using embedded PGlite for local development only", {
    path: config.database.pgliteDir,
    note: "Set DATABASE_URL to your local PostgreSQL connection string for the real deployment.",
  });
}

export async function closeDatabase() {
  await database.close();
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: readonly unknown[] = []
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] ?? null;
}

export async function withTransaction<T>(fn: (client: Queryable) => Promise<T>) {
  return database.transaction(fn);
}
