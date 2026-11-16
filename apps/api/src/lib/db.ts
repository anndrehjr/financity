import pg from "pg";
import { config } from "../config.js";

// bigint (COUNT, ids grandes) e numeric (SUM) voltam como número, não texto.
pg.types.setTypeParser(20, (v) => Number(v));
pg.types.setTypeParser(1700, (v) => Number(v));

let pool: pg.Pool | null = null;
export function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10, idleTimeoutMillis: 30_000, statement_timeout: 15_000 });
    pool.on("error", (e) => console.error("pg pool:", e.message));
  }
  return pool;
}
export async function closePool() { if (pool) { await pool.end(); pool = null; } }

export type Q = Pick<pg.Pool, "query">; // pool ou client de transação
export async function q<T = Record<string, unknown>>(sql: string, params: unknown[] = [], c: Q = getPool()): Promise<T[]> {
  return (await c.query(sql, params as unknown[])).rows as T[];
}
export async function one<T = Record<string, unknown>>(sql: string, params: unknown[] = [], c: Q = getPool()): Promise<T | undefined> {
  return (await q<T>(sql, params, c))[0];
}
/** Executa em transação; reverte tudo se lançar erro. */
export async function tx<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await getPool().connect();
  try {
    await c.query("BEGIN");
    const r = await fn(c);
    await c.query("COMMIT");
    return r;
  } catch (e) {
    try { await c.query("ROLLBACK"); } catch { /* conexão já perdida */ }
    throw e;
  } finally { c.release(); }
}

export async function getSetting(key: string, fallback = ""): Promise<string> {
  return (await one<{ value: string }>("SELECT value FROM settings WHERE key=$1", [key]))?.value ?? fallback;
}
export async function setSetting(key: string, value: string) {
  await q("INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [key, value]);
}
