import { one, q, tx } from "./db.js";
import { HttpError } from "./auth.js";

/** Medalhas por percentual da pontuação máxima (para o Mapa 1, de 25 pontos: 23, 19 e 13 — igual ao sistema anterior). */
export const MEDALS = [
  { pct: 92, key: "mestre", title: "Mestre do Consumo Consciente", msg: "Você demonstrou decisões muito conscientes. Continue assim e inspire seus colegas!" },
  { pct: 76, key: "guardiao", title: "Guardião das Boas Decisões", msg: "Ótimas escolhas! Você já pensa antes de gastar. Continue treinando esse olhar crítico." },
  { pct: 52, key: "aprendiz", title: "Aprendiz Financeiro", msg: "Bom caminho! Você está aprendendo a decidir com mais cuidado. Cada escolha ensina algo novo." },
  { pct: 0, key: "explorador", title: "Explorador em Desenvolvimento", msg: "Toda grande jornada começa com um passo. Que tal conversar com o professor e explorar o tema de novo?" },
];
export const medalMin = (pct: number, max: number) => Math.ceil((pct * max) / 100);
/** Títulos específicos por mapa (o Mapa 1 mantém os originais). A chave da medalha (e a arte) é a mesma. */
const TITULOS: Record<string, Partial<Record<string, string>>> = {
  "economia-decisoes": { mestre: "Mestre das Decisões Econômicas", guardiao: "Estrategista do Mercado", aprendiz: "Aprendiz de Economia" },
  "planejamento-financeiro": { mestre: "Mestre do Planejamento", guardiao: "Arquiteto do Futuro", aprendiz: "Aprendiz Planejador" },
  "cidadania-financeira": { mestre: "Mestre da Cidadania Financeira", guardiao: "Guardião da Cidade Digital", aprendiz: "Aprendiz Cidadão" },
};
export const medalFor = (score: number, max: number, slug?: string) => {
  const m = MEDALS.find((x) => score >= medalMin(x.pct, max))!;
  const t = slug ? TITULOS[slug]?.[m.key] : undefined;
  return t ? { ...m, title: t } : m;
};

export type AssessmentRow = {
  id: number; map_id: number; grade: number; sort: number; status: string;
  slug: string; title: string; subtitle: string; topics: string[];
};

const ASSESSMENT_SQL = `SELECT a.id,a.map_id,a.grade,a.sort,a.status,m.slug,m.title,m.subtitle,m.topics FROM assessments a JOIN maps m ON m.id=a.map_id`;

export async function maxPointsForMap(mapId: number): Promise<number> {
  const r = await one<{ s: number }>(
    `SELECT COALESCE(SUM(m),0) s FROM (SELECT MAX(o.points) m FROM questions q JOIN options o ON o.question_id=q.id WHERE q.map_id=$1 GROUP BY q.id) t`, [mapId]);
  return r!.s;
}

async function studentGrade(studentId: number): Promise<number | null> {
  const r = await one<{ grade: number | null }>("SELECT c.grade FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE s.id=$1", [studentId]);
  return r?.grade ?? null;
}

/** Avaliação da série do aluno. Outra série ou id inexistente => 404 (não revela que existe). */
async function assessmentOf(studentId: number, assessmentId: number): Promise<AssessmentRow> {
  const grade = await studentGrade(studentId);
  const a = Number.isInteger(assessmentId) && grade !== null
    ? await one<AssessmentRow>(`${ASSESSMENT_SQL} WHERE a.id=$1 AND a.grade=$2`, [assessmentId, grade]) : undefined;
  if (!a) throw new HttpError(404, "Atividade não encontrada.");
  return a;
}

/** Disponível E (se não for a primeira da série) com a anterior concluída pelo aluno. */
async function unlocked(studentId: number, a: AssessmentRow): Promise<boolean> {
  if (a.status !== "available") return false;
  const prev = await one<{ id: number }>("SELECT id FROM assessments WHERE grade=$1 AND sort<$2 ORDER BY sort DESC LIMIT 1", [a.grade, a.sort]);
  if (!prev) return true;
  return !!(await one("SELECT 1 FROM attempts WHERE student_id=$1 AND assessment_id=$2 AND status='completed'", [studentId, prev.id]));
}

export async function listAssessments(studentId: number) {
  const grade = await studentGrade(studentId);
  const rows = grade === null ? [] : await q<AssessmentRow>(`${ASSESSMENT_SQL} WHERE a.grade=$1 ORDER BY a.sort`, [grade]);
  const att = await q<{ assessment_id: number; status: string; total_points: number }>(
    "SELECT assessment_id,status,total_points FROM attempts WHERE student_id=$1 AND status<>'voided'", [studentId]);
  const byA = new Map(att.map((x) => [x.assessment_id, x]));
  const maps = [];
  let total = 0;
  for (const a of rows) {
    const at = byA.get(a.id);
    if (at?.status === "completed") total += at.total_points;
    maps.push({
      id: a.id, sort: a.sort, slug: a.slug, title: a.title, subtitle: a.subtitle, topics: a.topics,
      published: a.status === "available", unlocked: await unlocked(studentId, a),
      progress: at ? at.status : "not_started", score: at ? at.total_points : 0,
    });
  }
  // pontuação acumulada inclui parciais da tentativa em andamento
  const acc = att.reduce((s, x) => s + x.total_points, 0);
  return { maps, totalPoints: acc || total };
}

function mulberry32(a: number) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** Ordem embaralhada e estável por (tentativa, questão): a ordem não acompanha as pontuações. */
async function shuffledOptionIds(attemptId: number, questionId: number): Promise<number[]> {
  const ids = (await q<{ id: number }>("SELECT id FROM options WHERE question_id=$1 ORDER BY letter", [questionId])).map((r) => r.id);
  const rnd = mulberry32(attemptId * 7919 + questionId * 104729);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  return ids;
}

async function assertPlayable(studentId: number, a: AssessmentRow) {
  if (!(await unlocked(studentId, a))) throw new HttpError(403, "Este mapa ainda não está disponível.");
}

export async function startAttempt(studentId: number, assessmentId: number) {
  const a = await assessmentOf(studentId, assessmentId);
  await assertPlayable(studentId, a);
  await q(
    "INSERT INTO attempts(student_id,map_id,assessment_id) VALUES($1,$2,$3) ON CONFLICT (student_id,assessment_id) WHERE status<>'voided' DO NOTHING",
    [studentId, a.map_id, a.id]);
  return assessmentState(studentId, assessmentId);
}

const NEXT_Q = `SELECT * FROM questions WHERE map_id=$1 AND id NOT IN (SELECT question_id FROM answers WHERE attempt_id=$2) ORDER BY number LIMIT 1`;

export async function assessmentState(studentId: number, assessmentId: number) {
  const a = await assessmentOf(studentId, assessmentId);
  await assertPlayable(studentId, a);
  const max = await maxPointsForMap(a.map_id);
  const attempt = await one<{ id: number; status: string; total_points: number }>(
    "SELECT id,status,total_points FROM attempts WHERE student_id=$1 AND assessment_id=$2 AND status<>'voided'", [studentId, a.id]);
  const totalQ = (await one<{ c: number }>("SELECT COUNT(*) c FROM questions WHERE map_id=$1", [a.map_id]))!.c;
  const mapInfo = { id: a.id, title: a.title, subtitle: a.subtitle, sort: a.sort };
  if (!attempt) return { map: mapInfo, status: "not_started", score: 0, max, answered: 0, total: totalQ };
  const answered = (await one<{ c: number }>("SELECT COUNT(*) c FROM answers WHERE attempt_id=$1", [attempt.id]))!.c;
  const base = { map: mapInfo, status: attempt.status, score: attempt.total_points, max, answered, total: totalQ };
  if (attempt.status === "completed") return base;
  const qq = await one<{ id: number; number: number; title: string; scene: string; scenario: string; dialog: string; prompt: string }>(NEXT_Q, [a.map_id, attempt.id]);
  if (!qq) return base;
  const order = await shuffledOptionIds(attempt.id, qq.id);
  const rows = await q<{ id: number; text: string }>("SELECT id,text FROM options WHERE question_id=$1", [qq.id]); // sem pontos nem letra canônica
  const byId = new Map(rows.map((r) => [r.id, r.text]));
  return {
    ...base,
    question: {
      id: qq.id, number: qq.number, title: qq.title, scene: qq.scene, scenario: qq.scenario, dialog: qq.dialog, prompt: qq.prompt,
      options: order.map((id, i) => ({ id, letter: "ABCDE"[i], text: byId.get(id)! })),
    },
  };
}

export async function submitAnswer(studentId: number, assessmentId: number, questionId: number, optionId: number) {
  const a = await assessmentOf(studentId, assessmentId);
  await assertPlayable(studentId, a);
  try {
    await tx(async (c) => {
      // trava a tentativa: duas respostas simultâneas do mesmo aluno são processadas uma de cada vez
      const attempt = await one<{ id: number; status: string }>(
        "SELECT id,status FROM attempts WHERE student_id=$1 AND assessment_id=$2 AND status<>'voided' FOR UPDATE", [studentId, a.id], c);
      if (!attempt) throw new HttpError(409, "Atividade não iniciada.");
      if (attempt.status === "completed") throw new HttpError(409, "Esta atividade já foi concluída.");
      const next = await one<{ id: number }>(NEXT_Q.replace("SELECT *", "SELECT id"), [a.map_id, attempt.id], c);
      if (!next || next.id !== questionId) throw new HttpError(409, "Esta pergunta já foi respondida ou não é a atual.");
      const opt = await one<{ id: number; points: number }>("SELECT id,points FROM options WHERE id=$1 AND question_id=$2", [optionId, questionId], c);
      if (!opt) throw new HttpError(400, "Alternativa inválida.");
      const pos = (await shuffledOptionIds(attempt.id, questionId)).indexOf(opt.id) + 1;
      await q("INSERT INTO answers(attempt_id,question_id,option_id,points,display_pos) VALUES($1,$2,$3,$4,$5)", [attempt.id, questionId, opt.id, opt.points, pos], c);
      await q("UPDATE attempts SET total_points = total_points + $1 WHERE id=$2", [opt.points, attempt.id], c);
      const left = (await one<{ c: number }>(
        "SELECT COUNT(*) c FROM questions WHERE map_id=$1 AND id NOT IN (SELECT question_id FROM answers WHERE attempt_id=$2)", [a.map_id, attempt.id], c))!.c;
      if (left === 0) await q("UPDATE attempts SET status='completed', completed_at=now() WHERE id=$1", [attempt.id], c);
    });
  } catch (e) {
    if (e instanceof HttpError) throw e;
    if ((e as { code?: string }).code === "23505") throw new HttpError(409, "Esta pergunta já foi respondida.");
    throw e;
  }
  const s = await assessmentState(studentId, assessmentId);
  return { score: s.score, max: s.max, answered: s.answered, total: s.total, completed: s.status === "completed" };
}

export async function assessmentResult(studentId: number, assessmentId: number, studentName: string) {
  const a = await assessmentOf(studentId, assessmentId);
  const at = await one<{ total_points: number; completed_at: Date }>(
    "SELECT total_points,completed_at FROM attempts WHERE student_id=$1 AND assessment_id=$2 AND status='completed'", [studentId, a.id]);
  if (!at) throw new HttpError(409, "A atividade ainda não foi concluída.");
  const max = await maxPointsForMap(a.map_id);
  return { studentName, mapTitle: a.title, score: at.total_points, max, pct: Math.round((at.total_points / max) * 100), medal: medalFor(at.total_points, max, a.slug), completedAt: at.completed_at };
}
