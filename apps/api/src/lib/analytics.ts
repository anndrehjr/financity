import { getSetting, one, q } from "./db.js";
import { HttpError } from "./auth.js";
import { MEDALS, maxPointsForMap, medalFor } from "./game.js";
import { W, assertTeacherClass, assertTeacherStudent, ownedStudents } from "./scope.js";

export type Scope = "real" | "demo" | "all";
export const parseScope = (v: string | null | undefined): Scope => (v === "demo" || v === "all" ? v : "real");

/** teacherId: só entram turmas do professor. assessmentId: sem ele, usa a primeira avaliação da série consultada. */
export type Filter = { scope: Scope; classId?: number | null; teacherId: number; assessmentId?: number | null; serie?: number | null };

type Ctx = { assessmentId: number; mapId: number; grade: number; sort: number; max: number; title: string };

/** Define qual avaliação está sendo analisada e confere que o professor tem turmas dessa série. */
async function resolve(f: Filter): Promise<Ctx> {
  let grade: number | null = null;
  let assessmentId = f.assessmentId ?? null;
  if (f.classId) {
    await assertTeacherClass(f.teacherId, f.classId);
    grade = (await one<{ grade: number | null }>("SELECT grade FROM classes WHERE id=$1", [f.classId]))?.grade ?? null;
  }
  if (assessmentId) {
    const a = await one<{ grade: number }>("SELECT grade FROM assessments WHERE id=$1", [assessmentId]);
    const mine = a && (await one("SELECT 1 FROM teacher_classes tc JOIN classes c ON c.id=tc.class_id WHERE tc.teacher_id=$1 AND c.grade=$2", [f.teacherId, a.grade]));
    if (!a || !mine) throw new HttpError(404, "Avaliação não encontrada.");
    if (grade !== null && a.grade !== grade) throw new HttpError(400, "A avaliação não é da série desta turma.");
  } else {
    if (grade === null && f.serie) {
      grade = (await one<{ grade: number }>(
        `SELECT c.grade FROM teacher_classes tc JOIN classes c ON c.id=tc.class_id
          WHERE tc.teacher_id=$1 AND c.grade=$2 AND EXISTS (SELECT 1 FROM assessments x WHERE x.grade=c.grade) LIMIT 1`, [f.teacherId, f.serie]))?.grade ?? null;
    }
    if (grade === null) {
      // padrão: a série mais alta com avaliações (hoje o 8º ano), para a visão do professor não mudar ao cadastrar outra série
      grade = (await one<{ grade: number }>(
        `SELECT MAX(c.grade) grade FROM teacher_classes tc JOIN classes c ON c.id=tc.class_id
          WHERE tc.teacher_id=$1 AND c.grade IS NOT NULL AND EXISTS (SELECT 1 FROM assessments x WHERE x.grade=c.grade AND x.status='available')`, [f.teacherId]))?.grade ?? null;
    }
    const first = grade === null ? undefined : await one<{ id: number }>("SELECT id FROM assessments WHERE grade=$1 ORDER BY sort LIMIT 1", [grade]);
    if (!first) throw new HttpError(404, "Nenhuma avaliação cadastrada para as suas turmas.");
    assessmentId = first.id;
  }
  const a = (await one<{ id: number; map_id: number; grade: number; sort: number; title: string }>(
    "SELECT a.id,a.map_id,a.grade,a.sort,m.title FROM assessments a JOIN maps m ON m.id=a.map_id WHERE a.id=$1", [assessmentId]))!;
  return { assessmentId: a.id, mapId: a.map_id, grade: a.grade, sort: a.sort, max: await maxPointsForMap(a.map_id), title: a.title };
}

/** Alunos do escopo: do professor, da série da avaliação, e filtros de demo/turma. */
function studentWhere(f: Filter, cx: Ctx, w = new W()) {
  ownedStudents(w, f.teacherId);
  w.add("c.grade=?", cx.grade);
  if (f.scope === "real") w.add("s.is_demo=0");
  if (f.scope === "demo") w.add("s.is_demo=1");
  if (f.classId) w.add("s.class_id=?", f.classId);
  return w;
}

const resp = (n: number) => `${n} ${n === 1 ? "resposta" : "respostas"}`;
const round1 = (n: number) => Math.round(n * 10) / 10;

type AttemptRow = { id: number; student_id: number; full_name: string; class_name: string | null; status: string; total_points: number; completed_at: Date | null; started_at: Date; is_demo: number };

async function loadAttempts(f: Filter, cx: Ctx): Promise<AttemptRow[]> {
  const w = studentWhere(f, cx);
  const aid = w.param(cx.assessmentId);
  return q<AttemptRow>(
    `SELECT a.id,a.student_id,s.full_name,c.name class_name,a.status,a.total_points,a.completed_at,a.started_at,s.is_demo
       FROM attempts a JOIN students s ON s.id=a.student_id JOIN classes c ON c.id=s.class_id
      WHERE a.assessment_id=${aid} AND a.status<>'voided'${w.sql}`, w.vals);
}

type QRow = { id: number; number: number; title: string; theme: string; note: string; strength: string; retake: string; prompt: string };
const loadQuestions = (mapId: number) => q<QRow>("SELECT id,number,title,theme,note,strength,retake,prompt FROM questions WHERE map_id=$1 ORDER BY number", [mapId]);

export async function questionStats(f: Filter, cx: Ctx) {
  const qs = await loadQuestions(cx.mapId);
  const w = studentWhere(f, cx);
  const aid = w.param(cx.assessmentId);
  const rows = await q<{ question_id: number; points: number; letter: string }>(
    `SELECT an.question_id,an.points,o.letter FROM answers an JOIN attempts a ON a.id=an.attempt_id JOIN students s ON s.id=a.student_id
       JOIN classes c ON c.id=s.class_id JOIN options o ON o.id=an.option_id
      WHERE a.assessment_id=${aid} AND a.status<>'voided'${w.sql}`, w.vals);
  const maxes = await q<{ question_id: number; m: number }>("SELECT id question_id,max_points m FROM questions WHERE id = ANY($1::int[])", [qs.map((x) => x.id)]);
  const maxBy = new Map(maxes.map((m) => [m.question_id, m.m]));
  return qs.map((qq) => {
    const rs = rows.filter((r) => r.question_id === qq.id);
    const max = maxBy.get(qq.id) ?? 0;
    const n = rs.length;
    const sum = rs.reduce((a, r) => a + r.points, 0);
    const letters = Object.fromEntries("ABCDE".split("").map((l) => [l, rs.filter((r) => r.letter === l).length])) as Record<string, number>;
    return {
      id: qq.id, number: qq.number, title: qq.title, theme: qq.theme, retake: qq.retake, n, max,
      avg: n ? round1(sum / n * 100) / 100 : null as number | null,
      index: n ? round1((sum / (n * max)) * 100) : null as number | null, // índice de desempenho (%)
      excellent: rs.filter((r) => r.points === max).length,
      inadequate: rs.filter((r) => r.points === 0).length,
      intermediate: { 2: rs.filter((r) => bucket(r.points, max) === 2).length, 3: rs.filter((r) => bucket(r.points, max) === 3).length, 4: rs.filter((r) => bucket(r.points, max) === 4).length },
      letters,
    };
  });
}

/** Faixa intermediária (2, 3 ou 4) proporcional à pontuação máxima da questão; nas questões de 0 a 5 equivale aos pontos. */
function bucket(points: number, max: number): number {
  if (points <= 0 || points >= max) return 0;
  const r = points / max;
  return r < 0.5 ? 2 : r < 0.7 ? 3 : 4;
}

type Stats = Awaited<ReturnType<typeof questionStats>>;

function insightsFrom(stats: Stats, completed: number, total: number) {
  const out: string[] = [];
  const withData = stats.filter((s) => s.n > 0 && s.index !== null);
  if (!withData.length) return ["Ainda não há respostas registradas para gerar análises."];
  const low = [...withData].sort((a, b) => a.index! - b.index!)[0];
  const high = [...withData].sort((a, b) => b.index! - a.index!)[0];
  out.push(`A questão ${low.number} (${low.theme}) apresentou o menor desempenho médio (${low.index}% dos pontos possíveis, ${resp(low.n)}), indicando necessidade de retomada: ${low.retake}.`);
  if (high.id !== low.id) out.push(`A questão ${high.number} (${high.theme}) apresentou o maior desempenho médio (${high.index}%, ${resp(high.n)}).`);
  const worst0 = [...withData].sort((a, b) => b.inadequate - a.inadequate)[0];
  if (worst0.inadequate > 0) out.push(`A maior quantidade de decisões inadequadas (0 ponto) ocorreu na questão ${worst0.number} (${worst0.theme}): ${worst0.inadequate} de ${resp(worst0.n)}.`);
  const need = withData.filter((s) => s.index! < 60).map((s) => `${s.theme.toLowerCase()}`);
  if (need.length) out.push(`Temas com desempenho abaixo de 60%: ${need.join(", ")}.`);
  if (completed < total) out.push(`Atenção: ${completed === 1 ? "apenas 1 estudante concluiu" : completed === 0 ? "nenhum estudante concluiu" : `apenas ${completed} estudantes concluíram`} o mapa; interprete as conclusões com cautela.`);
  return out;
}

export async function assessmentsForTeacher(teacherId: number) {
  return q(
    `SELECT a.id,a.grade,a.sort,a.status,m.title,m.subtitle,s.name subject
       FROM assessments a JOIN maps m ON m.id=a.map_id JOIN subjects s ON s.id=m.subject_id
      WHERE a.grade IN (SELECT c.grade FROM teacher_classes tc JOIN classes c ON c.id=tc.class_id WHERE tc.teacher_id=$1 AND c.grade IS NOT NULL)
        AND a.status<>'archived'
      ORDER BY a.grade,a.sort`, [teacherId]);
}

export async function dashboard(f: Filter) {
  const cx = await resolve(f);
  const w = studentWhere(f, cx);
  const students = (await one<{ c: number }>(`SELECT COUNT(*) c FROM students s JOIN classes c ON c.id=s.class_id WHERE 1=1${w.sql}`, w.vals))!;
  const attempts = await loadAttempts(f, cx);
  const done = attempts.filter((a) => a.status === "completed");
  const inprog = attempts.filter((a) => a.status === "in_progress");
  const max = cx.max;
  const avg = done.length ? round1(done.reduce((s, a) => s + a.total_points, 0) / done.length) : null;
  const best = done.length ? Math.max(...done.map((a) => a.total_points)) : null;

  // faixas por percentual da pontuação máxima (para 25 pontos: 0–12, 13–18, 19–22, 23–25, como antes)
  const b1 = Math.round(max * 48 / 100), b2 = Math.round(max * 72 / 100), b3 = Math.round(max * 88 / 100);
  const bands = [
    { label: `0 a ${b1}`, from: 0, to: b1 }, { label: `${b1 + 1} a ${b2}`, from: b1 + 1, to: b2 },
    { label: `${b2 + 1} a ${b3}`, from: b2 + 1, to: b3 }, { label: `${b3 + 1} a ${max}`, from: b3 + 1, to: max },
  ].map((b) => ({ label: b.label, alunos: done.filter((a) => a.total_points >= b.from && a.total_points <= b.to).length }));

  const stats = await questionStats(f, cx);
  // média de cada avaliação da série (mesmo escopo de turmas/demonstração), em % da pontuação máxima do mapa
  const wm = studentWhere(f, cx);
  const gp = wm.param(cx.grade);
  const list = await q<{ sort: number; title: string; status: string; maxp: number; avgp: number | null }>(
    `SELECT a.sort,m.title,a.status,
       (SELECT COALESCE(SUM(max_points),0) FROM questions qq WHERE qq.map_id=m.id) maxp,
       (SELECT AVG(at.total_points) FROM attempts at JOIN students s ON s.id=at.student_id JOIN classes c ON c.id=s.class_id
         WHERE at.assessment_id=a.id AND at.status='completed'${wm.sql}) avgp
     FROM assessments a JOIN maps m ON m.id=a.map_id WHERE a.grade=${gp} AND a.status<>'archived' ORDER BY a.sort`, wm.vals);
  const byMap = list.map((m) => ({
    name: `Mapa ${m.sort} — ${m.title}`, available: m.status === "available",
    avgPct: m.status === "available" && m.avgp !== null && m.maxp > 0 ? round1((m.avgp / m.maxp) * 100) : null,
  }));

  // Ranking: só concluintes; empate = mesma colocação (sem usar tempo de resposta)
  const sorted = [...done].sort((a, b) => b.total_points - a.total_points || a.full_name.localeCompare(b.full_name, "pt-BR"));
  let lastScore = -1, lastRank = 0;
  const ranking = sorted.map((a, i) => {
    if (a.total_points !== lastScore) { lastRank = i + 1; lastScore = a.total_points; }
    return { rank: lastRank, studentId: a.student_id, name: a.full_name, className: a.class_name, map1: a.total_points, total: a.total_points, pct: Math.round((a.total_points / max) * 100), status: "Concluído", demo: !!a.is_demo };
  });
  const partial = inprog.map((a) => ({ studentId: a.student_id, name: a.full_name, className: a.class_name, partial: a.total_points, demo: !!a.is_demo }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return {
    scope: f.scope, max, assessment: { id: cx.assessmentId, grade: cx.grade, sort: cx.sort, title: cx.title },
    cards: { totalStudents: students.c, started: attempts.length, completed: done.length, avgPoints: avg, best, avgPct: avg !== null ? round1((avg / max) * 100) : null },
    byMap, distribution: bands,
    byQuestion: stats.map((s) => ({ name: `Q${s.number}`, theme: s.theme, media: s.avg, n: s.n })),
    alternatives: stats.map((s) => ({ number: s.number, theme: s.theme, title: s.title, data: "ABCDE".split("").map((l) => ({ letter: l, alunos: s.letters[l] })) })),
    progress: [
      { name: "Não começaram", value: Math.max(0, students.c - attempts.length) },
      { name: "Em andamento", value: inprog.length },
      { name: "Concluíram", value: done.length },
    ],
    ranking, partial,
    questions: stats.map((s) => ({ id: s.id, number: s.number, theme: s.theme, title: s.title, n: s.n, avg: s.avg, index: s.index, excellent: s.excellent, inadequate: s.inadequate })),
    insights: insightsFrom(stats, done.length, stats.length),
  };
}

export async function questionDetail(number: number, f: Filter) {
  const cx = await resolve(f);
  const qq = await one<QRow & { scenario: string }>("SELECT * FROM questions WHERE map_id=$1 AND number=$2", [cx.mapId, number]);
  if (!qq) return null;
  const stats = (await questionStats(f, cx)).find((s) => s.number === number)!;
  const opts = await q<{ id: number; letter: string; text: string; points: number; why: string }>("SELECT id,letter,text,points,why FROM options WHERE question_id=$1 ORDER BY letter", [qq.id]);
  const w = studentWhere(f, cx);
  const qid = w.param(qq.id), aid = w.param(cx.assessmentId);
  const ans = await q<{ option_id: number; sid: number; full_name: string; cname: string | null }>(
    `SELECT an.option_id,s.id sid,s.full_name,c.name cname FROM answers an JOIN attempts a ON a.id=an.attempt_id JOIN students s ON s.id=a.student_id
       JOIN classes c ON c.id=s.class_id WHERE an.question_id=${qid} AND a.assessment_id=${aid} AND a.status<>'voided'${w.sql} ORDER BY s.full_name`, w.vals);
  const diffs: string[] = [];
  if (stats.n) {
    if (stats.inadequate) diffs.push(`${resp(stats.inadequate)} com decisão inadequada (0 ponto): ${qq.retake}.`);
    const mid = stats.intermediate;
    if (mid[2]) diffs.push(`${resp(mid[2])} parcialmente adequada${mid[2] === 1 ? "" : "s"} (2 pontos), indicando decisões que evitam o pior cenário mas ainda ignoram aspectos importantes.`);
    if (!stats.inadequate && !mid[2] && stats.index !== null && stats.index >= 80) diffs.push("Não houve dificuldades relevantes nesta questão com os dados atuais.");
    if (stats.index !== null && stats.index < 60) diffs.push(`Desempenho médio abaixo de 60%: considere retomar ${qq.retake}.`);
  }
  return {
    ...stats, prompt: qq.prompt, scenario: qq.scenario, note: qq.note, difficulties: diffs, assessmentId: cx.assessmentId,
    options: opts.map((o) => ({ ...o, count: ans.filter((a) => a.option_id === o.id).length, students: ans.filter((a) => a.option_id === o.id).map((a) => ({ id: a.sid, name: a.full_name, className: a.cname })) })),
  };
}

/** Pontuações das alternativas de uma questão (para o professor editar). Só da avaliação resolvida para o professor. */
export async function questionIdFor(number: number, f: Filter): Promise<number | null> {
  const cx = await resolve(f);
  return (await one<{ id: number }>("SELECT id FROM questions WHERE map_id=$1 AND number=$2", [cx.mapId, number]))?.id ?? null;
}

export async function studentReport(teacherId: number, studentId: number, assessmentId?: number | null) {
  await assertTeacherStudent(teacherId, studentId);
  const s = (await one<{ id: number; full_name: string; username: string; active: number; is_demo: number; class_name: string | null; grade: number | null }>(
    `SELECT s.id,s.full_name,s.username,s.active,s.is_demo,c.name class_name,c.grade FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE s.id=$1`, [studentId]))!;
  type AR = { id: number; map_id: number; sort: number; title: string; slug: string };
  const A = "SELECT a.id,a.map_id,a.sort,m.title,m.slug FROM assessments a JOIN maps m ON m.id=a.map_id";
  const aRow = s.grade === null ? undefined : assessmentId
    ? await one<AR>(`${A} WHERE a.id=$1 AND a.grade=$2`, [assessmentId, s.grade])
    : await one<AR>(`${A} WHERE a.grade=$1 ORDER BY a.sort LIMIT 1`, [s.grade]);
  const a = aRow ? await one<{ id: number; status: string; total_points: number; started_at: Date; completed_at: Date | null }>(
    "SELECT id,status,total_points,started_at,completed_at FROM attempts WHERE student_id=$1 AND assessment_id=$2 AND status<>'voided'", [studentId, aRow.id]) : undefined;
  const max = aRow ? await maxPointsForMap(aRow.map_id) : 0;
  const rows = a ? await q<{ number: number; title: string; theme: string; strength: string; retake: string; letter: string; text: string; why: string; points: number; mx: number }>(
    `SELECT q.number,q.title,q.theme,q.strength,q.retake,o.letter,o.text,o.why,an.points,q.max_points mx FROM answers an JOIN questions q ON q.id=an.question_id
       JOIN options o ON o.id=an.option_id WHERE an.attempt_id=$1 ORDER BY q.number`, [a.id]) : [];
  const strong = rows.filter((r) => r.points / r.mx >= 0.8), weak = rows.filter((r) => r.points / r.mx <= 0.4);
  let diagnosis = "Ainda não há respostas registradas para este estudante.";
  if (rows.length) {
    const parts: string[] = [];
    if (strong.length) parts.push(`o estudante demonstrou boas decisões relacionadas a ${strong.map((r) => r.strength).join("; ")}`);
    if (weak.length) parts.push(`${strong.length ? "mas apresentou" : "apresentou"} respostas que indicam necessidade de retomada em ${weak.map((r) => r.retake).join("; ")}`);
    if (!parts.length) parts.push("o estudante apresentou decisões razoáveis (3 pontos) nas situações respondidas");
    diagnosis = `Nas respostas desta atividade, ${parts.join(", ")}. ` +
      `Esta leitura se baseia em ${rows.length} situação(ões) e não é um diagnóstico definitivo de aprendizagem; deve ser combinada com outras observações do professor.` +
      (a?.status !== "completed" ? " A atividade ainda não foi concluída." : "");
  }
  const history = await q("SELECT action,detail,created_at FROM admin_log WHERE student_id=$1 ORDER BY id DESC LIMIT 30", [studentId]);
  return {
    student: { id: s.id, name: s.full_name, username: s.username, className: s.class_name, active: !!s.active, demo: !!s.is_demo },
    school: await getSetting("school_name", ""), teacher: await getSetting("teacher_name", ""),
    attempt: a ? { status: a.status, total: a.total_points, max, pct: Math.round((a.total_points / max) * 100), startedAt: a.started_at, completedAt: a.completed_at, medal: a.status === "completed" ? medalFor(a.total_points, max, aRow?.slug).title : null } : null,
    assessment: aRow ? { id: aRow.id, sort: aRow.sort, title: aRow.title } : null,
    answers: rows.map((r) => ({ number: r.number, title: r.title, theme: r.theme, letter: r.letter, text: r.text, points: r.points, why: r.why })),
    strengths: strong.map((r) => r.theme), retake: weak.map((r) => r.theme), diagnosis, history,
  };
}

export async function classReport(f: Filter) {
  const d = await dashboard(f);
  const cx = await resolve(f);
  const stats = await questionStats(f, cx);
  const withData = stats.filter((s) => s.index !== null);
  const sorted = [...withData].sort((a, b) => a.index! - b.index!);
  const classRow = f.classId ? await one<{ name: string }>("SELECT name FROM classes WHERE id=$1", [f.classId]) : undefined;
  const recs = sorted.filter((s) => s.index! < 70).map((s) => `Questão ${s.number} — ${s.theme}: retomar ${s.retake} (desempenho médio ${s.index}%).`);
  return {
    title: `RELATÓRIO DE APRENDIZAGEM — EDUCAÇÃO FINANCEIRA — ${cx.grade}º ANO`, school: await getSetting("school_name", ""), teacher: await getSetting("teacher_name", ""),
    assessmentTitle: `Mapa ${cx.sort} — ${cx.title}`,
    className: classRow?.name ?? "Todas as turmas", scope: f.scope, generatedAt: new Date().toISOString(),
    participants: d.cards.started, registered: d.cards.totalStudents, completed: d.cards.completed, avgPoints: d.cards.avgPoints, avgPct: d.cards.avgPct, best: d.cards.best, max: d.max,
    distribution: d.distribution, questions: stats.map((s) => ({ number: s.number, theme: s.theme, n: s.n, avg: s.avg, index: s.index, excellent: s.excellent, inadequate: s.inadequate })),
    lowest: sorted.slice(0, 2).map((s) => ({ number: s.number, theme: s.theme, index: s.index })),
    highest: [...sorted].reverse().slice(0, 2).map((s) => ({ number: s.number, theme: s.theme, index: s.index })),
    difficulties: d.insights, recommendations: recs.length ? recs : withData.length ? ["Nenhum tema ficou abaixo de 70% de desempenho médio com os dados atuais."] : ["Sem dados suficientes para recomendar retomadas."],
    ranking: d.ranking, partial: d.partial,
  };
}

/** Linhas do CSV "alunos": um aluno por linha, com as pontuações por questão. */
export async function studentsCsvRows(f: Filter) {
  const cx = await resolve(f);
  const w = studentWhere(f, cx);
  const aid = w.param(cx.assessmentId);
  const rows = await q<{ id: number; full_name: string; cname: string | null; is_demo: number; aid: number | null; status: string | null; total_points: number | null }>(
    `SELECT s.id,s.full_name,c.name cname,s.is_demo,a.id aid,a.status,a.total_points FROM students s JOIN classes c ON c.id=s.class_id
       LEFT JOIN attempts a ON a.student_id=s.id AND a.status<>'voided' AND a.assessment_id=${aid} WHERE 1=1${w.sql} ORDER BY s.full_name`, w.vals);
  const pts = rows.some((r) => r.aid)
    ? await q<{ attempt_id: number; number: number; points: number }>(
      "SELECT an.attempt_id,q.number,an.points FROM answers an JOIN questions q ON q.id=an.question_id WHERE an.attempt_id = ANY($1::int[])", [rows.filter((r) => r.aid).map((r) => r.aid)])
    : [];
  const maxQ = Math.max(5, ...(await q<{ n: number }>("SELECT number n FROM questions WHERE map_id=$1", [cx.mapId])).map((x) => x.n));
  const head = ["Aluno", "Turma", "Situação", ...Array.from({ length: maxQ }, (_, i) => `Q${i + 1}`), "Total", "Máximo", "Aproveitamento (%)", "Dados de demonstração"];
  const out: unknown[][] = [head];
  for (const r of rows) {
    const mine = pts.filter((p) => p.attempt_id === r.aid);
    const qv = Array.from({ length: maxQ }, (_, i) => mine.find((x) => x.number === i + 1)?.points ?? "");
    out.push([r.full_name, r.cname ?? "", r.status === "completed" ? "Concluído" : r.status === "in_progress" ? "Em andamento" : "Não iniciou", ...qv,
      r.status ? r.total_points : "", cx.max, r.status === "completed" ? Math.round(((r.total_points ?? 0) / cx.max) * 100) : "", r.is_demo ? "SIM" : "não"]);
  }
  return out;
}

export { MEDALS };
