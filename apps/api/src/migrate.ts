import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPool } from "./lib/db.js";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "migrations");

/** Aplica, em ordem e uma única vez, os arquivos migrations/NNN_*.sql. Seguro contra execuções simultâneas. */
export async function migrate(opts: { upTo?: number } = {}): Promise<string[]> {
  const c = await getPool().connect();
  const applied: string[] = [];
  try {
    await c.query("SELECT pg_advisory_lock(727272)");
    await c.query("CREATE TABLE IF NOT EXISTS schema_migrations(version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
    const done = new Set((await c.query("SELECT version FROM schema_migrations")).rows.map((r) => r.version as string));
    const files = fs.readdirSync(dir).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort();
    for (const f of files) {
      const n = Number(f.slice(0, 3));
      if (opts.upTo !== undefined && n > opts.upTo) break;
      if (done.has(f)) continue;
      try {
        await c.query("BEGIN");
        await c.query(fs.readFileSync(path.join(dir, f), "utf8"));
        await c.query("INSERT INTO schema_migrations(version) VALUES($1)", [f]);
        await c.query("COMMIT");
        applied.push(f);
      } catch (e) {
        await c.query("ROLLBACK");
        throw new Error(`Falha na migração ${f}: ${(e as Error).message}`);
      }
    }
  } finally {
    try { await c.query("SELECT pg_advisory_unlock(727272)"); } catch { /* ignore */ }
    c.release();
  }
  return applied;
}
