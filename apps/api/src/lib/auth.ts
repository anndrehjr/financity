import crypto from "crypto";
import bcrypt from "bcryptjs";
import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { config } from "../config.js";
import { one, q, type Q } from "./db.js";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export type Env = { Variables: { clientIp: string } };
export type C = Context<Env>;

const COOKIE = "fc_session";
const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export const pinFingerprint = (pin: string) => crypto.createHmac("sha256", config.pinSecret).update("pin:" + pin).digest("hex");
export const hashPin = (pin: string) => bcrypt.hash(pin, 10);
export const isValidPin = (pin: unknown): pin is string => typeof pin === "string" && /^\d{6}$/.test(pin);
export const isStrongPassword = (p: string) => p.length >= 12 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p);

export type SessionUser = { role: "student" | "teacher"; id: number; name: string };

/** Rate limit: 5 falhas em 15 min bloqueiam por 15 min (por IP+usuário), 40 por IP e 10 por usuário. */
const WINDOW = 15 * 60_000;
type Attempt = { fails: number; window_start: number; locked_until: number };
async function limitCheck(key: string, max: number): Promise<boolean> {
  const r = await one<Attempt>("SELECT fails,window_start,locked_until FROM login_attempts WHERE key=$1", [key]);
  return !(r && r.locked_until > Date.now() && r.fails >= max);
}
async function limitFail(key: string, max: number) {
  const now = Date.now();
  const r = await one<Attempt>("SELECT fails,window_start,locked_until FROM login_attempts WHERE key=$1", [key]);
  if (!r || now - r.window_start > WINDOW) {
    await q("INSERT INTO login_attempts(key,fails,window_start,locked_until) VALUES($1,1,$2,0) ON CONFLICT(key) DO UPDATE SET fails=1, window_start=$2, locked_until=0", [key, now]);
    return;
  }
  const fails = r.fails + 1;
  await q("UPDATE login_attempts SET fails=$1, locked_until=$2 WHERE key=$3", [fails, fails >= max ? now + WINDOW : 0, key]);
}

export const clientIp = (c: C): string => c.get("clientIp") || "local";

const INVALID_HASH = "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";

export async function login(c: C, username: string, secretValue: string): Promise<SessionUser> {
  const ip = clientIp(c);
  const uname = String(username || "").trim().toLowerCase().slice(0, 80);
  const k1 = `u:${ip}|${uname}`, k2 = `ip:${ip}`, k3 = `n:${uname}`;
  // k3: limite por usuário independente do IP; só conta usuários existentes.
  if (!(await limitCheck(k1, 5)) || !(await limitCheck(k2, 40)) || !(await limitCheck(k3, 10)))
    throw new HttpError(429, "Muitas tentativas. Aguarde alguns minutos e tente de novo.");
  let known = false;
  const fail = async () => { await limitFail(k1, 5); await limitFail(k2, 40); if (known) await limitFail(k3, 10); return new HttpError(401, "Usuário ou senha inválidos."); };
  if (!uname || typeof secretValue !== "string" || !secretValue || secretValue.length > 200) throw await fail();

  const t = await one<{ id: number; name: string; password_hash: string }>("SELECT id,name,password_hash FROM teachers WHERE username=$1", [uname]);
  let user: SessionUser | null = null;
  known = !!t || !!(await one("SELECT 1 FROM students WHERE username=$1", [uname]));
  if (t) {
    if (await bcrypt.compare(secretValue, t.password_hash)) user = { role: "teacher", id: t.id, name: t.name };
  } else {
    const s = await one<{ id: number; full_name: string; pin_hash: string; active: number }>("SELECT id,full_name,pin_hash,active FROM students WHERE username=$1", [uname]);
    // sempre compara um hash para não revelar se o usuário existe pelo tempo de resposta
    const ok = await bcrypt.compare(secretValue, s?.pin_hash && s.pin_hash.startsWith("$2") ? s.pin_hash : INVALID_HASH);
    if (s && ok && isValidPin(secretValue)) {
      if (!s.active) throw new HttpError(403, "Este usuário está desativado. Fale com o professor.");
      user = { role: "student", id: s.id, name: s.full_name };
    }
  }
  if (!user) throw await fail();
  await q("DELETE FROM login_attempts WHERE key IN ($1,$2)", [k1, k3]);

  const token = crypto.randomBytes(32).toString("base64url");
  const ttl = user.role === "teacher" ? 4 * 3600_000 : 8 * 3600_000;
  await q("DELETE FROM sessions WHERE expires_at < $1", [Date.now()]);
  await q("INSERT INTO sessions(token_hash,role,user_id,expires_at) VALUES($1,$2,$3,$4)", [sha(token), user.role, user.id, Date.now() + ttl]);
  setCookie(c, COOKIE, token, { httpOnly: true, sameSite: "Lax", secure: config.isProd, path: "/", maxAge: ttl / 1000 });
  return user;
}

export async function logout(c: C) {
  const t = getCookie(c, COOKIE);
  if (t) await q("DELETE FROM sessions WHERE token_hash=$1", [sha(t)]);
  deleteCookie(c, COOKIE, { path: "/" });
}

export async function getSession(c: C): Promise<SessionUser | null> {
  const t = getCookie(c, COOKIE);
  if (!t) return null;
  const s = await one<{ role: string; user_id: number; expires_at: number }>("SELECT role,user_id,expires_at FROM sessions WHERE token_hash=$1", [sha(t)]);
  if (!s || s.expires_at < Date.now()) return null;
  if (s.role === "teacher") {
    const r = await one<{ id: number; name: string }>("SELECT id,name FROM teachers WHERE id=$1", [s.user_id]);
    return r ? { role: "teacher", id: r.id, name: r.name } : null;
  }
  const r = await one<{ id: number; full_name: string; active: number }>("SELECT id,full_name,active FROM students WHERE id=$1", [s.user_id]);
  return r && r.active ? { role: "student", id: r.id, name: r.full_name } : null;
}

export async function requireRole(c: C, role: "student" | "teacher"): Promise<SessionUser> {
  const s = await getSession(c);
  if (!s) throw new HttpError(401, "Sessão expirada. Entre novamente.");
  if (s.role !== role) throw new HttpError(403, "Acesso não permitido.");
  return s;
}

export async function invalidateStudentSessions(studentId: number, c?: Q) {
  await q("DELETE FROM sessions WHERE role='student' AND user_id=$1", [studentId], c);
}
