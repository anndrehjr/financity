import crypto from "crypto";
import { one, q, tx, type Q } from "./db.js";
import { HttpError, hashPin, invalidateStudentSessions, isValidPin, pinFingerprint } from "./auth.js";
import { W, assertTeacherClass, assertTeacherStudent, gradeFromName, ownedStudents } from "./scope.js";

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);

export async function makeUsername(fullName: string, c?: Q): Promise<string> {
  const p = slug(fullName);
  const base = (p.length > 1 ? `${p[0]}.${p[p.length - 1]}` : p[0] || "aluno").slice(0, 30);
  let u = base, i = 1;
  while (await one("SELECT 1 FROM students WHERE username=$1 UNION SELECT 1 FROM teachers WHERE username=$1", [u], c)) u = `${base}${++i}`;
  return u;
}

/** PINs previsíveis: dígito repetido, sequências, blocos repetidos (121212, 123123) e palíndromos. */
export function isWeakPin(pin: string): boolean {
  return /^(\d)\1{5}$/.test(pin) || "01234567890123456".includes(pin) || "98765432109876543".includes(pin)
    || /^(\d\d)\1\1$/.test(pin) || /^(\d\d\d)\1$/.test(pin) || pin === [...pin].reverse().join("");
}

/** PIN de 6 dígitos aleatório, único entre todos os alunos e sem padrões óbvios. */
export async function generatePin(extraTaken?: Set<string>, c?: Q): Promise<string> {
  for (let i = 0; i < 1000; i++) {
    const pin = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0"); // zeros à esquerda preservados
    if (isWeakPin(pin) || extraTaken?.has(pin)) continue;
    if (!(await one("SELECT 1 FROM students WHERE pin_fp=$1", [pinFingerprint(pin)], c))) return pin;
  }
  throw new HttpError(500, "Não foi possível gerar um PIN único.");
}

/** Marcador de "sem PIN": hash inválido (nunca confere) guardado no próprio cadastro. */
export const NO_PIN_HASH = "!";

export type BatchMode = "missing" | "selected" | "class";
export type Credential = { id: number; name: string; className: string; username: string; pin: string };

export async function log(teacherId: number | null, action: string, studentId: number | null, detail: string, c?: Q) {
  await q("INSERT INTO admin_log(teacher_id,action,student_id,detail) VALUES($1,$2,$3,$4)", [teacherId, action, studentId, detail], c);
}

/**
 * Gera/redefine PINs em lote, de forma atômica (tudo ou nada). Nunca toca em alunos de demonstração nem de outras turmas.
 * Os PINs só existem na resposta: no banco ficam apenas o hash e a impressão digital; nada é escrito em log.
 */
export async function generatePinsBatch(mode: BatchMode, opts: { ids?: unknown; classId?: unknown }, teacherId: number) {
  const w = new W().add("s.is_demo=0");
  ownedStudents(w, teacherId);
  const skipped: { id?: number; reason: string }[] = [];
  let rows: { id: number; name: string; username: string; className: string | null }[];
  const SEL = `SELECT s.id,s.full_name name,s.username,c.name "className" FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE 1=1`;
  if (mode === "missing") {
    rows = await q(`${SEL}${w.add("s.pin_hash=?", NO_PIN_HASH).sql} ORDER BY s.full_name`, w.vals);
  } else if (mode === "class") {
    const classId = Number(opts.classId);
    const cl = Number.isInteger(classId) ? await one<{ is_demo: number }>("SELECT is_demo FROM classes WHERE id=$1", [classId]) : undefined;
    if (!cl || cl.is_demo) throw new HttpError(404, "Turma não encontrada.");
    await assertTeacherClass(teacherId, classId);
    rows = await q(`${SEL}${w.add("s.class_id=?", classId).sql} ORDER BY s.full_name`, w.vals);
  } else {
    const ids = Array.isArray(opts.ids) ? [...new Set((opts.ids as unknown[]).map(Number).filter((n) => Number.isInteger(n) && n > 0))] : [];
    if (!ids.length) throw new HttpError(400, "Selecione pelo menos um aluno.");
    if (ids.length > 500) throw new HttpError(400, "Selecione no máximo 500 alunos por vez.");
    rows = await q(`${SEL}${w.add("s.id = ANY(?::int[])", ids).sql} ORDER BY s.full_name`, w.vals);
    for (const id of ids) if (!rows.some((r) => r.id === id)) skipped.push({ id, reason: "Aluno não encontrado ou é de demonstração" });
  }
  if (rows.length > 500) throw new HttpError(400, "Máximo de 500 alunos por operação.");
  if (!rows.length) return { credentials: [] as Credential[], skipped };

  const taken = new Set<string>();
  const pins: string[] = [];
  for (let i = 0; i < rows.length; i++) { const p = await generatePin(taken); taken.add(p); pins.push(p); } // sem repetição dentro do lote
  const hashes = await Promise.all(pins.map((p) => hashPin(p)));
  const action = mode === "missing" ? "gerar_pin_lote" : "redefinir_pin_lote";
  await tx(async (c) => {
    for (const [i, r] of rows.entries()) {
      await q("UPDATE students SET pin_hash=$1, pin_fp=$2 WHERE id=$3", [hashes[i], pinFingerprint(pins[i]), r.id], c);
      await invalidateStudentSessions(r.id, c);
      await log(teacherId, action, r.id, `PIN ${mode === "missing" ? "gerado" : "redefinido"} em lote (modo: ${mode}); valor não registrado`, c);
    }
    await log(teacherId, "pins_lote", null, `Modo ${mode}: ${rows.length} aluno(s)`, c);
  });
  return { credentials: rows.map((r, i): Credential => ({ id: r.id, name: r.name, className: r.className ?? "Sem turma", username: r.username, pin: pins[i] })), skipped };
}

export async function countPendingPins(teacherId: number): Promise<number> {
  const w = new W().add("s.is_demo=0").add("s.pin_hash=?", NO_PIN_HASH);
  ownedStudents(w, teacherId);
  return (await one<{ c: number }>(`SELECT COUNT(*) c FROM students s WHERE 1=1${w.sql}`, w.vals))!.c;
}

/**
 * Turma pelo nome. Se não existir, cria — a série vem do nome ("8º A"); sem série (e nome preenchido) é recusado.
 * Devolve null quando a turma existe mas não pertence ao professor (não revela que existe).
 */
export async function classForTeacher(name: string, teacherId: number, demo = false): Promise<{ id: number } | { error: string }> {
  const n = name.trim().slice(0, 60) || "Sem turma";
  const ex = await one<{ id: number }>("SELECT id FROM classes WHERE name=$1", [n]);
  if (ex) {
    const mine = await one("SELECT 1 FROM teacher_classes WHERE teacher_id=$1 AND class_id=$2", [teacherId, ex.id]);
    return mine ? { id: ex.id } : { error: "Turma não encontrada" };
  }
  const grade = gradeFromName(n);
  if (grade === null && n !== "Sem turma") return { error: "Turma nova precisa indicar a série (ex.: 8º A)" };
  return tx(async (c) => {
    const r = await one<{ id: number }>("INSERT INTO classes(name,is_demo,grade) VALUES($1,$2,$3) ON CONFLICT(name) DO UPDATE SET name=excluded.name RETURNING id", [n, demo ? 1 : 0, grade], c);
    await q("INSERT INTO teacher_classes(teacher_id,class_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [teacherId, r!.id], c);
    return { id: r!.id };
  });
}

export type NewStudent = { name: string; className: string; pin?: string; noPin?: boolean };

export async function createStudents(rows: NewStudent[], teacherId: number) {
  const created: Credential[] = [];
  const skipped: { name: string; className: string; reason: string }[] = [];
  const seen = new Set<string>();
  for (const r of rows.slice(0, 500)) {
    const name = String(r.name || "").trim().replace(/\s+/g, " ").slice(0, 120);
    const className = String(r.className || "").trim().slice(0, 60);
    if (name.length < 3) { skipped.push({ name, className, reason: "Nome inválido" }); continue; }
    const key = name.toLowerCase() + "|" + className.toLowerCase();
    const exists = await one(
      `SELECT 1 FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE lower(s.full_name)=$1 AND lower(COALESCE(c.name,''))=$2`,
      [name.toLowerCase(), className.toLowerCase()]);
    if (seen.has(key) || exists) { skipped.push({ name, className, reason: "Aluno já cadastrado nesta turma" }); continue; }
    seen.add(key);
    const noPin = !!r.noPin; // cadastro sem credencial: o PIN é gerado depois, pelo Gerador Automático
    let pin = noPin ? "" : r.pin;
    if (noPin) { /* sem PIN agora */ }
    else if (pin !== undefined && pin !== "") {
      if (!isValidPin(pin)) { skipped.push({ name, className, reason: "PIN deve ter exatamente 6 dígitos" }); continue; }
      if (await one("SELECT 1 FROM students WHERE pin_fp=$1", [pinFingerprint(pin)])) { skipped.push({ name, className, reason: "PIN já usado por outro aluno" }); continue; }
    } else pin = await generatePin();
    const cls = await classForTeacher(className, teacherId);
    if ("error" in cls) { skipped.push({ name, className, reason: cls.error }); continue; }
    const hash = noPin ? NO_PIN_HASH : await hashPin(pin as string);
    const fp = noPin ? `pending:${crypto.randomUUID()}` : pinFingerprint(pin as string);
    const username = await makeUsername(name);
    const info = await one<{ id: number }>("INSERT INTO students(full_name,class_id,username,pin_hash,pin_fp) VALUES($1,$2,$3,$4,$5) RETURNING id", [name, cls.id, username, hash, fp]);
    created.push({ id: info!.id, name, className: className || "Sem turma", username, pin: pin as string });
  }
  await log(teacherId, "cadastro_alunos", null, `${created.length} cadastrado(s), ${skipped.length} ignorado(s)`);
  return { created, skipped };
}

export async function resetPin(studentId: number, teacherId: number, pin?: string): Promise<string> {
  await assertTeacherStudent(teacherId, studentId);
  let p = pin;
  if (p) {
    if (!isValidPin(p)) throw new HttpError(400, "O PIN deve ter exatamente 6 dígitos.");
    if (await one("SELECT id FROM students WHERE pin_fp=$1 AND id<>$2", [pinFingerprint(p), studentId])) throw new HttpError(409, "Este PIN já é usado por outro aluno. Escolha um diferente.");
  } else p = await generatePin();
  await q("UPDATE students SET pin_hash=$1, pin_fp=$2 WHERE id=$3", [await hashPin(p), pinFingerprint(p), studentId]);
  await invalidateStudentSessions(studentId);
  await log(teacherId, "redefinir_pin", studentId, "PIN redefinido (valor não registrado)");
  return p;
}

export async function setActive(studentId: number, active: boolean, teacherId: number) {
  await assertTeacherStudent(teacherId, studentId);
  await q("UPDATE students SET active=$1 WHERE id=$2", [active ? 1 : 0, studentId]);
  if (!active) await invalidateStudentSessions(studentId);
  await log(teacherId, active ? "reativar_aluno" : "desativar_aluno", studentId, "");
}

/** Primeira avaliação (menor ordem) da série do aluno — a atividade "padrão" nas telas do professor. */
export async function defaultAssessmentOf(studentId: number): Promise<number | null> {
  const r = await one<{ id: number }>(
    `SELECT a.id FROM students s JOIN classes c ON c.id=s.class_id JOIN assessments a ON a.grade=c.grade WHERE s.id=$1 ORDER BY a.sort LIMIT 1`, [studentId]);
  return r?.id ?? null;
}

/** Anula a tentativa atual (preservando-a no histórico) e libera uma nova. */
export async function releaseNewAttempt(studentId: number, teacherId: number, reason: string, assessmentId?: number) {
  await assertTeacherStudent(teacherId, studentId);
  const aid = assessmentId ?? (await defaultAssessmentOf(studentId));
  const a = aid ? await one<{ id: number; status: string; total_points: number }>(
    "SELECT id,status,total_points FROM attempts WHERE student_id=$1 AND assessment_id=$2 AND status<>'voided'", [studentId, aid]) : undefined;
  if (!a) throw new HttpError(409, "Este aluno não tem tentativa ativa para reiniciar.");
  await tx(async (c) => {
    await q("UPDATE attempts SET status='voided', voided_at=now() WHERE id=$1", [a.id], c);
    await log(teacherId, "nova_tentativa", studentId, `Tentativa #${a.id} (${a.status}, ${a.total_points} pts) arquivada. Motivo: ${reason.slice(0, 200) || "não informado"}`, c);
  });
}

export async function listStudents(teacherId: number, text: string, classId: number | null, scope: "real" | "demo" | "all", serie: number | null = null) {
  const w = new W();
  ownedStudents(w, teacherId);
  if (scope === "real") w.add("s.is_demo=0");
  if (scope === "demo") w.add("s.is_demo=1");
  if (classId) w.add("s.class_id=?", classId);
  if (serie) w.add("s.serie=?", serie);
  if (text) w.add("(s.full_name ILIKE ? OR s.username ILIKE ?)", `%${text}%`, `%${text}%`);
  const pin = w.param(NO_PIN_HASH);
  return q(
    `SELECT s.id,s.full_name name,s.username,s.active,s.is_demo demo,s.serie,c.name "className",(s.pin_hash=${pin})::int pending,a.status,a.total_points points
     FROM students s LEFT JOIN classes c ON c.id=s.class_id
     LEFT JOIN assessments fa ON fa.grade=c.grade AND fa.sort=(SELECT MIN(sort) FROM assessments WHERE grade=c.grade)
     LEFT JOIN attempts a ON a.student_id=s.id AND a.assessment_id=fa.id AND a.status<>'voided'
     WHERE 1=1${w.sql} ORDER BY s.full_name LIMIT 1000`, w.vals);
}
