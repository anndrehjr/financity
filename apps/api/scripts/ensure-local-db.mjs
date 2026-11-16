// Cria o banco local "fc_local" se não existir. Imprime "created" ou "exists". Só mexe no PostgreSQL de desenvolvimento (porta 54329).
import pg from "pg";
const admin = process.env.PG_ADMIN_URL || "postgres://financity_dev:dev-local-only@127.0.0.1:54329/postgres";
const c = new pg.Client(admin);
await c.connect();
const has = (await c.query("SELECT 1 FROM pg_database WHERE datname='fc_local'")).rowCount > 0;
if (!has) await c.query("CREATE DATABASE fc_local");
await c.end();
console.log(has ? "exists" : "created");
