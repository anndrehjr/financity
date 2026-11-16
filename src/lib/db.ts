import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { seedContent } from "./seed-content";

/**
 * Camada de dados. Hoje usa SQLite (arquivo local) porque o ambiente não tem PostgreSQL.
 * Todo acesso ao banco passa por aqui, o que facilita trocar por PostgreSQL/Prisma em produção.
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS teachers(
  id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS classes(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS students(
  id INTEGER PRIMARY KEY, full_name TEXT NOT NULL, class_id INTEGER REFERENCES classes(id),
  username TEXT NOT NULL UNIQUE, pin_hash TEXT NOT NULL, pin_fp TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1, is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS maps(
  id INTEGER PRIMARY KEY, sort INTEGER NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
  subtitle TEXT NOT NULL, topics TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'developing');
CREATE TABLE IF NOT EXISTS questions(
  id INTEGER PRIMARY KEY, map_id INTEGER NOT NULL REFERENCES maps(id), number INTEGER NOT NULL,
  title TEXT NOT NULL, theme TEXT NOT NULL, scene TEXT NOT NULL, scenario TEXT NOT NULL, dialog TEXT NOT NULL,
  prompt TEXT NOT NULL, note TEXT NOT NULL, strength TEXT NOT NULL, retake TEXT NOT NULL,
  UNIQUE(map_id, number));
CREATE TABLE IF NOT EXISTS options(
  id INTEGER PRIMARY KEY, question_id INTEGER NOT NULL REFERENCES questions(id), letter TEXT NOT NULL,
  text TEXT NOT NULL, points INTEGER NOT NULL CHECK(points BETWEEN 0 AND 5), why TEXT NOT NULL,
  UNIQUE(question_id, letter));
CREATE TABLE IF NOT EXISTS attempts(
  id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES students(id), map_id INTEGER NOT NULL REFERENCES maps(id),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','completed','voided')),
  total_points INTEGER NOT NULL DEFAULT 0, started_at TEXT NOT NULL DEFAULT (datetime('now')), completed_at TEXT, voided_at TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS ux_attempt_active ON attempts(student_id, map_id) WHERE status != 'voided';
CREATE TABLE IF NOT EXISTS answers(
  id INTEGER PRIMARY KEY, attempt_id INTEGER NOT NULL REFERENCES attempts(id), question_id INTEGER NOT NULL REFERENCES questions(id),
  option_id INTEGER NOT NULL REFERENCES options(id), points INTEGER NOT NULL, display_pos INTEGER NOT NULL,
  answered_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(attempt_id, question_id));
CREATE TABLE IF NOT EXISTS admin_log(
  id INTEGER PRIMARY KEY, teacher_id INTEGER, action TEXT NOT NULL, student_id INTEGER, detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS sessions(
  token_hash TEXT PRIMARY KEY, role TEXT NOT NULL, user_id INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS login_attempts(
  key TEXT PRIMARY KEY, fails INTEGER NOT NULL DEFAULT 0, window_start INTEGER NOT NULL, locked_until INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
`;

const g = globalThis as unknown as { __fdb?: Database.Database; __fsecret?: string };

export function db(): Database.Database {
  if (!g.__fdb) {
    const file = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "financity.db");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const d = new Database(file);
    d.pragma("journal_mode = WAL");
    d.pragma("foreign_keys = ON");
    d.exec(SCHEMA);
    seedContent(d);
    g.__fdb = d;
  }
  return g.__fdb;
}

/** Segredo do servidor (HMAC do PIN para garantir PINs distintos). Vem do ambiente ou é gerado uma vez. */
export function secret(): string {
  if (process.env.FINANCITY_SECRET) return process.env.FINANCITY_SECRET;
  if (!g.__fsecret) {
    const dir = path.dirname(process.env.DATABASE_PATH || path.join(process.cwd(), "data", "financity.db"));
    const f = path.join(dir, "secret.key");
    fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(f)) fs.writeFileSync(f, crypto.randomBytes(32).toString("hex"), { mode: 0o600 });
    g.__fsecret = fs.readFileSync(f, "utf8").trim();
  }
  return g.__fsecret;
}

export function getSetting(key: string, fallback = ""): string {
  const r = db().prepare("SELECT value FROM settings WHERE key=?").get(key) as { value: string } | undefined;
  return r?.value ?? fallback;
}
export function setSetting(key: string, value: string) {
  db().prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(key, value);
}
