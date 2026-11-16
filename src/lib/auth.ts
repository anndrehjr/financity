import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { db, secret } from "./db";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const COOKIE = "fc_session";
const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export const pinFingerprint = (pin: string) => crypto.createHmac("sha256", secret()).update("pin:" + pin).digest("hex");
export const hashPin = (pin: string) => bcrypt.hash(pin, 10);
export const isValidPin = (pin: unknown): pin is string => typeof pin === "string" && /^\d{6}$/.test(pin);
export const isStrongPassword = (p: string) => p.length >= 12 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p);

export type SessionUser = { role: "student" | "teacher"; id: number; name: string };

/** Rate limit: 5 falhas em 15 min bloqueiam por 15 min (por IP+usuário) e 40 falhas por IP. */
const WINDOW = 15 * 60_000;
function limitCheck(key: string, max: number): boolean {
  const now = Date.now();
  const r = db().prepare("SELECT * FROM login_attempts WHERE key=?").get(key) as { fails: number; window_start: number; locked_until: number } | undefined;
  return !(r && r.locked_until > now && r.fails >= max);
}
function limitFail(key: string, max: number) {
  const now = Date.now();
  const r = db().prepare("SELECT * FROM login_attempts WHERE key=?").get(key) as { fails: number; window_start: number } | undefined;
  if (!r || now - r.window_start > WINDOW) {
    db().prepare("INSERT OR REPLACE INTO login_attempts(key,fails,window_start,locked_until) VALUES(?,?,?,0)").run(key, 1, now);
    return;
  }
  const fails = r.fails + 1;
  db().prepare("UPDATE login_attempts SET fails=?, locked_until=? WHERE key=?").run(fails, fails >= max ? now + WINDOW : 0, key);
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
}

export async function login(username: string, secretValue: string): Promise<SessionUser> {
  const ip = await clientIp();
  const uname = String(username || "").trim().toLowerCase().slice(0, 80);
  const k1 = `u:${ip}|${uname}`, k2 = `ip:${ip}`, k3 = `n:${uname}`;
  // k3: limite por usuário independente do IP (X-Forwarded-For pode ser forjado); só conta usuários existentes.
  if (!limitCheck(k1, 5) || !limitCheck(k2, 40) || !limitCheck(k3, 10)) throw new HttpError(429, "Muitas tentativas. Aguarde alguns minutos e tente de novo.");
  let known = false;
  const fail = () => { limitFail(k1, 5); limitFail(k2, 40); if (known) limitFail(k3, 10); return new HttpError(401, "Usuário ou senha inválidos."); };
  if (!uname || typeof secretValue !== "string" || !secretValue || secretValue.length > 200) throw fail();

  const t = db().prepare("SELECT id,name,password_hash FROM teachers WHERE username=?").get(uname) as { id: number; name: string; password_hash: string } | undefined;
  let user: SessionUser | null = null;
  known = !!t || !!db().prepare("SELECT 1 FROM students WHERE username=?").get(uname);
  if (t) {
    if (await bcrypt.compare(secretValue, t.password_hash)) user = { role: "teacher", id: t.id, name: t.name };
  } else {
    const s = db().prepare("SELECT id,full_name,pin_hash,active FROM students WHERE username=?").get(uname) as { id: number; full_name: string; pin_hash: string; active: number } | undefined;
    // sempre compara um hash para não revelar se o usuário existe pelo tempo de resposta
    const ok = await bcrypt.compare(secretValue, s?.pin_hash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
    if (s && ok && isValidPin(secretValue)) {
      if (!s.active) throw new HttpError(403, "Este usuário está desativado. Fale com o professor.");
      user = { role: "student", id: s.id, name: s.full_name };
    }
  }
  if (!user) throw fail();
  db().prepare("DELETE FROM login_attempts WHERE key IN (?,?)").run(k1, k3);

  const token = crypto.randomBytes(32).toString("base64url");
  const ttl = user.role === "teacher" ? 4 * 3600_000 : 8 * 3600_000;
  db().prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
  db().prepare("INSERT INTO sessions(token_hash,role,user_id,expires_at) VALUES(?,?,?,?)").run(sha(token), user.role, user.id, Date.now() + ttl);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: ttl / 1000,
  });
  return user;
}

export async function logout() {
  const c = await cookies();
  const t = c.get(COOKIE)?.value;
  if (t) db().prepare("DELETE FROM sessions WHERE token_hash=?").run(sha(t));
  c.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  const s = db().prepare("SELECT role,user_id,expires_at FROM sessions WHERE token_hash=?").get(sha(t)) as { role: string; user_id: number; expires_at: number } | undefined;
  if (!s || s.expires_at < Date.now()) return null;
  if (s.role === "teacher") {
    const r = db().prepare("SELECT id,name FROM teachers WHERE id=?").get(s.user_id) as { id: number; name: string } | undefined;
    return r ? { role: "teacher", id: r.id, name: r.name } : null;
  }
  const r = db().prepare("SELECT id,full_name,active FROM students WHERE id=?").get(s.user_id) as { id: number; full_name: string; active: number } | undefined;
  return r && r.active ? { role: "student", id: r.id, name: r.full_name } : null;
}

export async function requireRole(role: "student" | "teacher"): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new HttpError(401, "Sessão expirada. Entre novamente.");
  if (s.role !== role) throw new HttpError(403, "Acesso não permitido.");
  return s;
}

/** Proteção CSRF extra: em requisições que alteram dados, a origem precisa ser o próprio site. */
export async function checkOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) return;
  const host = h.get("x-forwarded-host") || h.get("host");
  if (new URL(origin).host !== host) throw new HttpError(403, "Origem não permitida.");
}

export function invalidateStudentSessions(studentId: number) {
  db().prepare("DELETE FROM sessions WHERE role='student' AND user_id=?").run(studentId);
}
