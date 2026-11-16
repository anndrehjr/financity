import { db, getSetting } from "./db";
import { MEDALS, maxPoints, medalFor } from "./game";

export type Scope = "real" | "demo" | "all";
export const parseScope = (v: string | null): Scope => (v === "demo" || v === "all" ? v : "real");

type Filter = { scope: Scope; classId?: number | null };
const scopeSql = (f: Filter, alias = "s") => {
  const parts: string[] = [];
  if (f.scope === "real") parts.push(`${alias}.is_demo=0`);
  if (f.scope === "demo") parts.push(`${alias}.is_demo=1`);
  if (f.classId) parts.push(`${alias}.class_id=${Number(f.classId)}`);
  return parts.length ? " AND " + parts.join(" AND ") : "";
};

const resp = (n: number) => `${n} ${n === 1 ? "resposta" : "respostas"}`;
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : null);
const round1 = (n: number) => Math.round(n * 10) / 10;

type AttemptRow = { id: number; student_id: number; full_name: string; class_name: string | null; status: string; total_points: number; completed_at: string | null; started_at: string; is_demo: number };

function map1Id(): number {
  return (db().prepare("SELECT id FROM maps WHERE sort=1").get() as { id: number }).id;
}

function loadAttempts(f: Filter): AttemptRow[] {
  return db().prepare(`SELECT a.id,a.student_id,s.full_name,c.name class_name,a.status,a.total_points,a.completed_at,a.started_at,s.is_demo
    FROM attempts a JOIN students s ON s.id=a.student_id LEFT JOIN classes c ON c.id=s.class_id
    WHERE a.map_id=? AND a.status!='voided'${scopeSql(f)}`).all(map1Id()) as AttemptRow[];
}

type QRow = { id: number; number: number; title: string; theme: string; note: string; strength: string; retake: string; prompt: string };
const loadQuestions = () => db().prepare("SELECT id,number,title,theme,note,strength,retake,prompt FROM questions WHERE map_id=? ORDER BY number").all(map1Id()) as QRow[];

export function questionStats(f: Filter) {
  const qs = loadQuestions();
  return qs.map((q) => {
    const rows = db().prepare(`SELECT an.points,o.letter FROM answers an JOIN attempts a ON a.id=an.attempt_id JOIN students s ON s.id=a.student_id
      JOIN options o ON o.id=an.option_id WHERE an.question_id=? AND a.status!='voided'${scopeSql(f)}`).all(q.id) as { points: number; letter: string }[];
    const max = (db().prepare("SELECT MAX(points) m FROM options WHERE question_id=?").get(q.id) as { m: number }).m;
    const n = rows.length;
    const sum = rows.reduce((a, r) => a + r.points, 0);
    const letters = Object.fromEntries("ABCDE".split("").map((l) => [l, rows.filter((r) => r.letter === l).length]));
    return {
      id: q.id, number: q.number, title: q.title, theme: q.theme, retake: q.retake, n, max,
      avg: n ? round1(sum / n * 100) / 100 : null as number | null,
      index: n ? round1((sum / (n * max)) * 100) : null as number | null, // índice de desempenho (%)
      excellent: rows.filter((r) => r.points === max).length,
      inadequate: rows.filter((r) => r.points === 0).length,
      intermediate: { 2: rows.filter((r) => r.points === 2).length, 3: rows.filter((r) => r.points === 3).length, 4: rows.filter((r) => r.points === 4).length },
      letters,
    };
  });
}

function insightsFrom(stats: ReturnType<typeof questionStats>, completed: number) {
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
  if (completed < 5) out.push(`Atenção: ${completed === 1 ? "apenas 1 estudante concluiu" : completed === 0 ? "nenhum estudante concluiu" : `apenas ${completed} estudantes concluíram`} o mapa; interprete as conclusões com cautela.`);
  return out;
}

export function dashboard(f: Filter) {
  const students = db().prepare(`SELECT COUNT(*) c FROM students s WHERE 1=1${scopeSql(f)}`).get() as { c: number };
  const attempts = loadAttempts(f);
  const done = attempts.filter((a) => a.status === "completed");
  const inprog = attempts.filter((a) => a.status === "in_progress");
  const max = maxPoints(map1Id());
  const avg = done.length ? round1(done.reduce((s, a) => s + a.total_points, 0) / done.length) : null;
  const best = done.length ? Math.max(...done.map((a) => a.total_points)) : null;

  const bands = [
    { label: "0 a 12", from: 0, to: 12 }, { label: "13 a 18", from: 13, to: 18 }, { label: "19 a 22", from: 19, to: 22 }, { label: "23 a 25", from: 23, to: 25 },
  ].map((b) => ({ label: b.label, alunos: done.filter((a) => a.total_points >= b.from && a.total_points <= b.to).length }));

  const stats = questionStats(f);
  const maps = db().prepare("SELECT sort,title,status FROM maps ORDER BY sort").all() as { sort: number; title: string; status: string }[];
  const byMap = maps.map((m) => m.sort === 1
    ? { name: `Mapa 1 — ${m.title}`, available: true, avgPct: avg !== null ? round1((avg / max) * 100) : null }
    : { name: `Mapa ${m.sort} — ${m.title}`, available: false, avgPct: null });

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
    scope: f.scope, max,
    cards: {
      totalStudents: students.c, started: attempts.length, completed: done.length, avgPoints: avg, best,
      avgPct: avg !== null ? round1((avg / max) * 100) : null,
    },
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
    insights: insightsFrom(stats, done.length),
  };
}

export function questionDetail(number: number, f: Filter) {
  const q = db().prepare("SELECT * FROM questions WHERE map_id=? AND number=?").get(map1Id(), number) as (QRow & { scenario: string }) | undefined;
  if (!q) return null;
  const stats = questionStats(f).find((s) => s.number === number)!;
  const opts = db().prepare("SELECT id,letter,text,points,why FROM options WHERE question_id=? ORDER BY letter").all(q.id) as { id: number; letter: string; text: string; points: number; why: string }[];
  const ans = db().prepare(`SELECT an.option_id,s.id sid,s.full_name,c.name cname FROM answers an JOIN attempts a ON a.id=an.attempt_id JOIN students s ON s.id=a.student_id
    LEFT JOIN classes c ON c.id=s.class_id WHERE an.question_id=? AND a.status!='voided'${scopeSql(f)} ORDER BY s.full_name`).all(q.id) as { option_id: number; sid: number; full_name: string; cname: string | null }[];
  const diffs: string[] = [];
  if (stats.n) {
    if (stats.inadequate) diffs.push(`${resp(stats.inadequate)} com decisão inadequada (0 ponto): ${q.retake}.`);
    const mid = stats.intermediate;
    if (mid[2]) diffs.push(`${resp(mid[2])} parcialmente adequada${mid[2] === 1 ? "" : "s"} (2 pontos), indicando decisões que evitam o pior cenário mas ainda ignoram aspectos importantes.`);
    if (!stats.inadequate && !mid[2] && stats.index !== null && stats.index >= 80) diffs.push("Não houve dificuldades relevantes nesta questão com os dados atuais.");
    if (stats.index !== null && stats.index < 60) diffs.push(`Desempenho médio abaixo de 60%: considere retomar ${q.retake}.`);
  }
  return {
    ...stats, prompt: q.prompt, scenario: q.scenario, note: q.note, difficulties: diffs,
    options: opts.map((o) => ({ ...o, count: ans.filter((a) => a.option_id === o.id).length, students: ans.filter((a) => a.option_id === o.id).map((a) => ({ id: a.sid, name: a.full_name, className: a.cname })) })),
  };
}

export function studentReport(studentId: number) {
  const s = db().prepare(`SELECT s.id,s.full_name,s.username,s.active,s.is_demo,c.name class_name FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE s.id=?`).get(studentId) as
    | { id: number; full_name: string; username: string; active: number; is_demo: number; class_name: string | null } | undefined;
  if (!s) return null;
  const a = db().prepare("SELECT id,status,total_points,started_at,completed_at FROM attempts WHERE student_id=? AND map_id=? AND status!='voided'").get(studentId, map1Id()) as
    | { id: number; status: string; total_points: number; started_at: string; completed_at: string | null } | undefined;
  const max = maxPoints(map1Id());
  const rows = a ? db().prepare(`SELECT q.number,q.title,q.theme,q.strength,q.retake,o.letter,o.text,o.why,an.points FROM answers an JOIN questions q ON q.id=an.question_id
    JOIN options o ON o.id=an.option_id WHERE an.attempt_id=? ORDER BY q.number`).all(a.id) as { number: number; title: string; theme: string; strength: string; retake: string; letter: string; text: string; why: string; points: number }[] : [];
  const strong = rows.filter((r) => r.points >= 4), weak = rows.filter((r) => r.points <= 2);
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
  const history = db().prepare("SELECT action,detail,created_at FROM admin_log WHERE student_id=? ORDER BY id DESC LIMIT 30").all(studentId);
  return {
    student: { id: s.id, name: s.full_name, username: s.username, className: s.class_name, active: !!s.active, demo: !!s.is_demo },
    school: getSetting("school_name", ""), teacher: getSetting("teacher_name", ""),
    attempt: a ? { status: a.status, total: a.total_points, max, pct: Math.round((a.total_points / max) * 100), startedAt: a.started_at, completedAt: a.completed_at, medal: a.status === "completed" ? medalFor(a.total_points).title : null } : null,
    answers: rows.map((r) => ({ number: r.number, title: r.title, theme: r.theme, letter: r.letter, text: r.text, points: r.points, why: r.why })),
    strengths: strong.map((r) => r.theme), retake: weak.map((r) => r.theme), diagnosis, history,
  };
}

export function classReport(f: Filter) {
  const d = dashboard(f);
  const stats = questionStats(f);
  const withData = stats.filter((s) => s.index !== null);
  const sorted = [...withData].sort((a, b) => a.index! - b.index!);
  const classRow = f.classId ? (db().prepare("SELECT name FROM classes WHERE id=?").get(f.classId) as { name: string } | undefined) : undefined;
  const recs = sorted.filter((s) => s.index! < 70).map((s) => `Questão ${s.number} — ${s.theme}: retomar ${s.retake} (desempenho médio ${s.index}%).`);
  return {
    title: "RELATÓRIO DE APRENDIZAGEM — EDUCAÇÃO FINANCEIRA — 8º ANO", school: getSetting("school_name", ""), teacher: getSetting("teacher_name", ""),
    className: classRow?.name ?? "Todas as turmas", scope: f.scope, generatedAt: new Date().toISOString(),
    participants: d.cards.started, registered: d.cards.totalStudents, completed: d.cards.completed, avgPoints: d.cards.avgPoints, avgPct: d.cards.avgPct, best: d.cards.best, max: d.max,
    distribution: d.distribution, questions: stats.map((s) => ({ number: s.number, theme: s.theme, n: s.n, avg: s.avg, index: s.index, excellent: s.excellent, inadequate: s.inadequate })),
    lowest: sorted.slice(0, 2).map((s) => ({ number: s.number, theme: s.theme, index: s.index })),
    highest: [...sorted].reverse().slice(0, 2).map((s) => ({ number: s.number, theme: s.theme, index: s.index })),
    difficulties: d.insights, recommendations: recs.length ? recs : withData.length ? ["Nenhum tema ficou abaixo de 70% de desempenho médio com os dados atuais."] : ["Sem dados suficientes para recomendar retomadas."],
    ranking: d.ranking, partial: d.partial,
  };
}

export { MEDALS };
