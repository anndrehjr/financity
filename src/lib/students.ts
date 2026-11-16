import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { HttpError, hashPin, invalidateStudentSessions, isValidPin, pinFingerprint } from "./auth";

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);

export function makeUsername(fullName: string): string {
  const p = slug(fullName);
  const base = (p.length > 1 ? `${p[0]}.${p[p.length - 1]}` : p[0] || "aluno").slice(0, 30);
  let u = base, i = 1;
  while (db().prepare("SELECT 1 FROM students WHERE username=? UNION SELECT 1 FROM teachers WHERE username=?").get(u, u)) u = `${base}${++i}`;
  return u;
}

/** PIN de 6 dígitos aleatório, único entre todos os alunos e sem padrões óbvios. */
/** PINs previsíveis: dígito repetido, sequências, blocos repetidos (121212, 123123) e palíndromos. */
export function isWeakPin(pin: string): boolean {
  return /^(\d)\1{5}$/.test(pin) || "01234567890123456".includes(pin) || "98765432109876543".includes(pin)
    || /^(\d\d)\1\1$/.test(pin) || /^(\d\d\d)\1$/.test(pin) || pin === [...pin].reverse().join("");
}

export function generatePin(extraTaken?: Set<string>): string {
  for (let i = 0; i < 1000; i++) {
    const pin = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0"); // zeros à esquerda preservados
    if (isWeakPin(pin) || extraTaken?.has(pin)) continue;
    if (!db().prepare("SELECT 1 FROM students WHERE pin_fp=?").get(pinFingerprint(pin))) return pin;
  }
  throw new HttpError(500, "Não foi possível gerar um PIN único.");
}

/** Marcador de "sem PIN": hash inválido (nunca confere) guardado no próprio cadastro. */
export const NO_PIN_HASH = "!";

export type BatchMode = "missing" | "selected" | "class";

/**
 * Gera/redefine PINs em lote, de forma atômica (tudo ou nada). Nunca toca em professores nem em alunos de demonstração.
 * Os PINs só existem na resposta: no banco ficam apenas o hash e a impressão digital; nada é escrito em log.
 */
export async function generatePinsBatch(mode: BatchMode, opts: { ids?: unknown; classId?: unknown }, teacherId: number) {
  const base = `SELECT s.id,s.full_name name,s.username,c.name className FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE s.is_demo=0`;
  let rows: { id: number; name: string; username: string; className: string | null }[];
  const skipped: { id?: number; reason: string }[] = [];
  if (mode === "missing") {
    rows = db().prepare(`${base} AND s.pin_hash=? ORDER BY s.full_name`).all(NO_PIN_HASH) as typeof rows;
  } else if (mode === "class") {
    const classId = Number(opts.classId);
    const cl = Number.isInteger(classId) ? (db().prepare("SELECT is_demo FROM classes WHERE id=?").get(classId) as { is_demo: number } | undefined) : undefined;
    if (!cl || cl.is_demo) throw new HttpError(404, "Turma não encontrada.");
    rows = db().prepare(`${base} AND s.class_id=? ORDER BY s.full_name`).all(classId) as typeof rows;
  } else {
    const ids = Array.isArray(opts.ids) ? [...new Set((opts.ids as unknown[]).map(Number).filter((n) => Number.isInteger(n) && n > 0))] : [];
    if (!ids.length) throw new HttpError(400, "Selecione pelo menos um aluno.");
    if (ids.length > 500) throw new HttpError(400, "Selecione no máximo 500 alunos por vez.");
    rows = db().prepare(`${base} AND s.id IN (${ids.map(() => "?").join(",")}) ORDER BY s.full_name`).all(...ids) as typeof rows;
    for (const id of ids) if (!rows.some((r) => r.id === id)) skipped.push({ id, reason: "Aluno não encontrado ou é de demonstração" });
  }
  if (rows.length > 500) throw new HttpError(400, "Máximo de 500 alunos por operação.");
  if (!rows.length) return { credentials: [] as Credential[], skipped };

  const taken = new Set<string>();
  const pins = rows.map(() => { const p = generatePin(taken); taken.add(p); return p; }); // sem repetição dentro do lote
  const hashes = await Promise.all(pins.map((p) => hashPin(p)));
  const action = mode === "missing" ? "gerar_pin_lote" : "redefinir_pin_lote";
  db().transaction(() => {
    const upd = db().prepare("UPDATE students SET pin_hash=?, pin_fp=? WHERE id=?");
    rows.forEach((r, i) => {
      upd.run(hashes[i], pinFingerprint(pins[i]), r.id);
      invalidateStudentSessions(r.id);
      log(teacherId, action, r.id, `PIN ${mode === "missing" ? "gerado" : "redefinido"} em lote (modo: ${mode}); valor não registrado`);
    });
    log(teacherId, "pins_lote", null, `Modo ${mode}: ${rows.length} aluno(s)`);
  })();
  return { credentials: rows.map((r, i): Credential => ({ id: r.id, name: r.name, className: r.className ?? "Sem turma", username: r.username, pin: pins[i] })), skipped };
}

export function countPendingPins(): number {
  return (db().prepare("SELECT COUNT(*) c FROM students WHERE is_demo=0 AND pin_hash=?").get(NO_PIN_HASH) as { c: number }).c;
}

export function classIdByName(name: string, demo = false): number {
  const n = name.trim().slice(0, 60) || "Sem turma";
  const r = db().prepare("SELECT id FROM classes WHERE name=?").get(n) as { id: number } | undefined;
  if (r) return r.id;
  return Number(db().prepare("INSERT INTO classes(name,is_demo) VALUES(?,?)").run(n, demo ? 1 : 0).lastInsertRowid);
}

export type NewStudent = { name: string; className: string; pin?: string; noPin?: boolean };
export type Credential = { id: number; name: string; className: string; username: string; pin: string };

export async function createStudents(rows: NewStudent[], teacherId: number) {
  const created: Credential[] = [];
  const skipped: { name: string; className: string; reason: string }[] = [];
  const seen = new Set<string>();
  for (const r of rows.slice(0, 500)) {
    const name = String(r.name || "").trim().replace(/\s+/g, " ").slice(0, 120);
    const className = String(r.className || "").trim().slice(0, 60);
    if (name.length < 3) { skipped.push({ name, className, reason: "Nome inválido" }); continue; }
    const key = name.toLowerCase() + "|" + className.toLowerCase();
    const exists = db().prepare(`SELECT 1 FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE lower(s.full_name)=? AND lower(COALESCE(c.name,''))=?`).get(name.toLowerCase(), className.toLowerCase());
    if (seen.has(key) || exists) { skipped.push({ name, className, reason: "Aluno já cadastrado nesta turma" }); continue; }
    seen.add(key);
    const noPin = !!r.noPin; // cadastro sem credencial: o PIN é gerado depois, pelo Gerador Automático
    let pin = noPin ? "" : r.pin;
    if (noPin) { /* sem PIN agora */ }
    else if (pin !== undefined && pin !== "") {
      if (!isValidPin(pin)) { skipped.push({ name, className, reason: "PIN deve ter exatamente 6 dígitos" }); continue; }
      if (db().prepare("SELECT 1 FROM students WHERE pin_fp=?").get(pinFingerprint(pin))) { skipped.push({ name, className, reason: "PIN já usado por outro aluno" }); continue; }
    } else pin = generatePin();
    const hash = noPin ? NO_PIN_HASH : await hashPin(pin as string);
    const fp = noPin ? `pending:${crypto.randomUUID()}` : pinFingerprint(pin as string);
    const classId = classIdByName(className);
    const username = makeUsername(name);
    const info = db().prepare("INSERT INTO students(full_name,class_id,username,pin_hash,pin_fp) VALUES(?,?,?,?,?)").run(name, classId, username, hash, fp);
    created.push({ id: Number(info.lastInsertRowid), name, className: className || "Sem turma", username, pin: pin as string });
  }
  log(teacherId, "cadastro_alunos", null, `${created.length} cadastrado(s), ${skipped.length} ignorado(s)`);
  return { created, skipped };
}

export async function resetPin(studentId: number, teacherId: number, pin?: string): Promise<string> {
  const s = db().prepare("SELECT id FROM students WHERE id=?").get(studentId);
  if (!s) throw new HttpError(404, "Aluno não encontrado.");
  let p = pin;
  if (p) {
    if (!isValidPin(p)) throw new HttpError(400, "O PIN deve ter exatamente 6 dígitos.");
    const other = db().prepare("SELECT id FROM students WHERE pin_fp=? AND id!=?").get(pinFingerprint(p), studentId);
    if (other) throw new HttpError(409, "Este PIN já é usado por outro aluno. Escolha um diferente.");
  } else p = generatePin();
  db().prepare("UPDATE students SET pin_hash=?, pin_fp=? WHERE id=?").run(await hashPin(p), pinFingerprint(p), studentId);
  invalidateStudentSessions(studentId);
  log(teacherId, "redefinir_pin", studentId, "PIN redefinido (valor não registrado)");
  return p;
}

export function setActive(studentId: number, active: boolean, teacherId: number) {
  const r = db().prepare("UPDATE students SET active=? WHERE id=?").run(active ? 1 : 0, studentId);
  if (!r.changes) throw new HttpError(404, "Aluno não encontrado.");
  if (!active) invalidateStudentSessions(studentId);
  log(teacherId, active ? "reativar_aluno" : "desativar_aluno", studentId, "");
}

/** Anula a tentativa atual (preservando-a no histórico) e libera uma nova. */
export function releaseNewAttempt(studentId: number, teacherId: number, reason: string) {
  const a = db().prepare("SELECT id,status,total_points FROM attempts WHERE student_id=? AND map_id=(SELECT id FROM maps WHERE sort=1) AND status!='voided'").get(studentId) as { id: number; status: string; total_points: number } | undefined;
  if (!a) throw new HttpError(409, "Este aluno não tem tentativa ativa para reiniciar.");
  db().transaction(() => {
    db().prepare("UPDATE attempts SET status='voided', voided_at=datetime('now') WHERE id=?").run(a.id);
    log(teacherId, "nova_tentativa", studentId, `Tentativa #${a.id} (${a.status}, ${a.total_points} pts) arquivada. Motivo: ${reason.slice(0, 200) || "não informado"}`);
  })();
}

export function log(teacherId: number | null, action: string, studentId: number | null, detail: string) {
  db().prepare("INSERT INTO admin_log(teacher_id,action,student_id,detail) VALUES(?,?,?,?)").run(teacherId, action, studentId, detail);
}

export function listStudents(q: string, classId: number | null, scope: "real" | "demo" | "all") {
  const where: string[] = ["1=1"]; const args: unknown[] = [];
  if (scope === "real") where.push("s.is_demo=0"); if (scope === "demo") where.push("s.is_demo=1");
  if (classId) { where.push("s.class_id=?"); args.push(classId); }
  if (q) { where.push("(s.full_name LIKE ? OR s.username LIKE ?)"); args.push(`%${q}%`, `%${q}%`); }
  const rows = db().prepare(`SELECT s.id,s.full_name name,s.username,s.active,s.is_demo demo,c.name className,(s.pin_hash='${NO_PIN_HASH}') pending,
    (SELECT status FROM attempts a WHERE a.student_id=s.id AND a.map_id=(SELECT id FROM maps WHERE sort=1) AND a.status!='voided') status,
    (SELECT total_points FROM attempts a WHERE a.student_id=s.id AND a.map_id=(SELECT id FROM maps WHERE sort=1) AND a.status!='voided') points
    FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE ${where.join(" AND ")} ORDER BY s.full_name LIMIT 1000`).all(...args);
  return rows;
}

export const _bcrypt = bcrypt; // evita tree-shake acidental em scripts
