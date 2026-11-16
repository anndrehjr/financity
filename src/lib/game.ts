import { db } from "./db";
import { HttpError } from "./auth";

export const MEDALS = [
  { min: 23, key: "mestre", title: "Mestre do Consumo Consciente", msg: "Você demonstrou decisões muito conscientes. Continue assim e inspire seus colegas!" },
  { min: 19, key: "guardiao", title: "Guardião das Boas Decisões", msg: "Ótimas escolhas! Você já pensa antes de gastar. Continue treinando esse olhar crítico." },
  { min: 13, key: "aprendiz", title: "Aprendiz Financeiro", msg: "Bom caminho! Você está aprendendo a decidir com mais cuidado. Cada escolha ensina algo novo." },
  { min: 0, key: "explorador", title: "Explorador em Desenvolvimento", msg: "Toda grande jornada começa com um passo. Que tal conversar com o professor e explorar o tema de novo?" },
];
export const medalFor = (score: number) => MEDALS.find((m) => score >= m.min)!;

type MapRow = { id: number; sort: number; slug: string; title: string; subtitle: string; topics: string; status: string };

export function maxPoints(mapId: number): number {
  const r = db().prepare(`SELECT COALESCE(SUM(m),0) s FROM (SELECT MAX(o.points) m FROM questions q JOIN options o ON o.question_id=q.id WHERE q.map_id=? GROUP BY q.id)`).get(mapId) as { s: number };
  return r.s;
}

/** Mapa disponível E (se não for o primeiro) com o anterior concluído pelo aluno. */
export function mapUnlocked(studentId: number, map: MapRow): boolean {
  if (map.status !== "available") return false;
  if (map.sort === 1) return true;
  const prev = db().prepare("SELECT id FROM maps WHERE sort=?").get(map.sort - 1) as { id: number } | undefined;
  if (!prev) return false;
  return !!db().prepare("SELECT 1 FROM attempts WHERE student_id=? AND map_id=? AND status='completed'").get(studentId, prev.id);
}

export function listMaps(studentId: number) {
  const maps = db().prepare("SELECT * FROM maps ORDER BY sort").all() as MapRow[];
  let total = 0;
  const out = maps.map((m) => {
    const a = db().prepare("SELECT status,total_points FROM attempts WHERE student_id=? AND map_id=? AND status!='voided'").get(studentId, m.id) as { status: string; total_points: number } | undefined;
    if (a?.status === "completed") total += a.total_points;
    return {
      id: m.id, sort: m.sort, slug: m.slug, title: m.title, subtitle: m.subtitle, topics: JSON.parse(m.topics) as string[],
      published: m.status === "available", unlocked: mapUnlocked(studentId, m),
      progress: a ? (a.status as string) : "not_started", score: a ? a.total_points : 0,
    };
  });
  // pontuação acumulada inclui parciais da tentativa em andamento
  const acc = db().prepare("SELECT COALESCE(SUM(total_points),0) s FROM attempts WHERE student_id=? AND status!='voided'").get(studentId) as { s: number };
  return { maps: out, totalPoints: acc.s || total };
}

function mulberry32(a: number) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** Ordem embaralhada e estável por (tentativa, questão): a ordem não acompanha as pontuações. */
function shuffledOptionIds(attemptId: number, questionId: number): number[] {
  const ids = (db().prepare("SELECT id FROM options WHERE question_id=? ORDER BY letter").all(questionId) as { id: number }[]).map((r) => r.id);
  const rnd = mulberry32(attemptId * 7919 + questionId * 104729);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  return ids;
}

function getMapOr404(slugOrId: number): MapRow {
  const m = db().prepare("SELECT * FROM maps WHERE id=?").get(slugOrId) as MapRow | undefined;
  if (!m) throw new HttpError(404, "Mapa não encontrado.");
  return m;
}
function assertPlayable(studentId: number, map: MapRow) {
  if (!mapUnlocked(studentId, map)) throw new HttpError(403, "Este mapa ainda não está disponível.");
}

export function startAttempt(studentId: number, mapId: number) {
  const map = getMapOr404(mapId);
  assertPlayable(studentId, map);
  const ex = db().prepare("SELECT id FROM attempts WHERE student_id=? AND map_id=? AND status!='voided'").get(studentId, mapId);
  if (!ex) db().prepare("INSERT INTO attempts(student_id,map_id) VALUES(?,?)").run(studentId, mapId);
  return mapState(studentId, mapId);
}

export function mapState(studentId: number, mapId: number) {
  const map = getMapOr404(mapId);
  assertPlayable(studentId, map);
  const max = maxPoints(mapId);
  const attempt = db().prepare("SELECT * FROM attempts WHERE student_id=? AND map_id=? AND status!='voided'").get(studentId, mapId) as
    | { id: number; status: string; total_points: number } | undefined;
  const totalQ = (db().prepare("SELECT COUNT(*) c FROM questions WHERE map_id=?").get(mapId) as { c: number }).c;
  if (!attempt) return { map: { id: map.id, title: map.title, subtitle: map.subtitle }, status: "not_started", score: 0, max, answered: 0, total: totalQ };
  const answered = (db().prepare("SELECT COUNT(*) c FROM answers WHERE attempt_id=?").get(attempt.id) as { c: number }).c;
  const base = { map: { id: map.id, title: map.title, subtitle: map.subtitle }, status: attempt.status, score: attempt.total_points, max, answered, total: totalQ };
  if (attempt.status === "completed") return base;
  const q = db().prepare(`SELECT * FROM questions WHERE map_id=? AND id NOT IN (SELECT question_id FROM answers WHERE attempt_id=?) ORDER BY number LIMIT 1`).get(mapId, attempt.id) as
    | { id: number; number: number; title: string; scene: string; scenario: string; dialog: string; prompt: string } | undefined;
  if (!q) return base;
  const order = shuffledOptionIds(attempt.id, q.id);
  const rows = db().prepare(`SELECT id,text FROM options WHERE question_id=?`).all(q.id) as { id: number; text: string }[]; // sem pontos nem letra canônica
  const byId = new Map(rows.map((r) => [r.id, r.text]));
  return {
    ...base,
    question: {
      id: q.id, number: q.number, title: q.title, scene: q.scene, scenario: q.scenario, dialog: q.dialog, prompt: q.prompt,
      options: order.map((id, i) => ({ id, letter: "ABCDE"[i], text: byId.get(id)! })),
    },
  };
}

export function submitAnswer(studentId: number, mapId: number, questionId: number, optionId: number) {
  const map = getMapOr404(mapId);
  assertPlayable(studentId, map);
  const run = db().transaction(() => {
    const attempt = db().prepare("SELECT id,status FROM attempts WHERE student_id=? AND map_id=? AND status!='voided'").get(studentId, mapId) as { id: number; status: string } | undefined;
    if (!attempt) throw new HttpError(409, "Atividade não iniciada.");
    if (attempt.status === "completed") throw new HttpError(409, "Esta atividade já foi concluída.");
    const next = db().prepare(`SELECT id FROM questions WHERE map_id=? AND id NOT IN (SELECT question_id FROM answers WHERE attempt_id=?) ORDER BY number LIMIT 1`).get(mapId, attempt.id) as { id: number } | undefined;
    if (!next || next.id !== questionId) throw new HttpError(409, "Esta pergunta já foi respondida ou não é a atual.");
    const opt = db().prepare("SELECT id,points FROM options WHERE id=? AND question_id=?").get(optionId, questionId) as { id: number; points: number } | undefined;
    if (!opt) throw new HttpError(400, "Alternativa inválida.");
    const pos = shuffledOptionIds(attempt.id, questionId).indexOf(opt.id) + 1;
    db().prepare("INSERT INTO answers(attempt_id,question_id,option_id,points,display_pos) VALUES(?,?,?,?,?)").run(attempt.id, questionId, opt.id, opt.points, pos);
    db().prepare("UPDATE attempts SET total_points = total_points + ? WHERE id=?").run(opt.points, attempt.id);
    const left = (db().prepare(`SELECT COUNT(*) c FROM questions WHERE map_id=? AND id NOT IN (SELECT question_id FROM answers WHERE attempt_id=?)`).get(mapId, attempt.id) as { c: number }).c;
    if (left === 0) db().prepare("UPDATE attempts SET status='completed', completed_at=datetime('now') WHERE id=?").run(attempt.id);
  });
  try { run(); } catch (e) {
    if (e instanceof HttpError) throw e;
    if (String((e as Error).message).includes("UNIQUE")) throw new HttpError(409, "Esta pergunta já foi respondida.");
    throw e;
  }
  const s = mapState(studentId, mapId);
  return { score: s.score, max: s.max, answered: s.answered, total: s.total, completed: s.status === "completed" };
}

export function mapResult(studentId: number, mapId: number, studentName: string) {
  const map = getMapOr404(mapId);
  const a = db().prepare("SELECT total_points,completed_at FROM attempts WHERE student_id=? AND map_id=? AND status='completed'").get(studentId, mapId) as { total_points: number; completed_at: string } | undefined;
  if (!a) throw new HttpError(409, "A atividade ainda não foi concluída.");
  const max = maxPoints(mapId);
  const medal = medalFor(a.total_points);
  return { studentName, mapTitle: map.title, score: a.total_points, max, pct: Math.round((a.total_points / max) * 100), medal, completedAt: a.completed_at };
}
