// Ranking geral: soma dos pontos de TODOS os temas concluídos de cada aluno, com a classificação de cada um.
// Regras (as mesmas do ranking por tema): só conta tema concluído; empate = mesma colocação; o tempo não é critério.
import { q } from "./db.js";
import { dominio } from "./grading.js";
import { W, ownedStudents } from "./scope.js";

export type ThemeCell = { sort: number; status: "completed" | "in_progress" | null; points: number | null };
export type RankRow = {
  position: number | null;               // null = ainda não concluiu nenhum tema (fora do ranking)
  id: number; name: string; className: string | null; serie: number; demo: boolean; active: boolean;
  themes: ThemeCell[];                   // alinhado com `temas`
  concluded: number;                     // temas concluídos
  points: number;                        // soma dos temas concluídos
  maxPoints: number;                     // máximo possível nos temas concluídos
  pct: number | null;                    // aproveitamento (%) sobre os temas concluídos
  classification: { key: string; label: string } | null;
};

type Raw = { sid: number; name: string; cname: string | null; serie: number; demo: number; active: number; sort: number; title: string; mx: number; status: string | null; points: number | null };

export async function generalRanking(teacherId: number, o: { classId: number | null; serie: number | null; scope: "real" | "demo" | "all" }) {
  const w = new W();
  ownedStudents(w, teacherId);
  if (o.scope === "real") w.add("s.is_demo=0");
  if (o.scope === "demo") w.add("s.is_demo=1");
  if (o.classId) w.add("s.class_id=?", o.classId);
  if (o.serie) w.add("s.serie=?", o.serie);
  // uma linha por (aluno × tema publicado da série dele); a tentativa anulada nunca conta
  const rows = await q<Raw>(
    `SELECT s.id sid, s.full_name name, c.name cname, s.serie, s.is_demo demo, s.active, asm.sort, m.title,
            (SELECT COALESCE(SUM(max_points),0)::int FROM questions WHERE map_id=asm.map_id) mx,
            att.status, att.total_points points
       FROM students s
       LEFT JOIN classes c ON c.id=s.class_id
       JOIN assessments asm ON asm.grade=s.serie AND asm.status='available'
       JOIN maps m ON m.id=asm.map_id AND EXISTS (SELECT 1 FROM questions x WHERE x.map_id=asm.map_id)
       LEFT JOIN attempts att ON att.student_id=s.id AND att.assessment_id=asm.id AND att.status<>'voided'
      WHERE 1=1${w.sql} ORDER BY s.full_name, asm.sort`, w.vals);

  // colunas (temas) da série mais presente no filtro
  const bySerie = new Map<number, Map<number, string>>();
  const alunosPorSerie = new Map<number, Set<number>>();
  for (const r of rows) {
    if (!bySerie.has(r.serie)) bySerie.set(r.serie, new Map());
    bySerie.get(r.serie)!.set(r.sort, r.title);
    if (!alunosPorSerie.has(r.serie)) alunosPorSerie.set(r.serie, new Set());
    alunosPorSerie.get(r.serie)!.add(r.sid);
  }
  const serieBase = [...alunosPorSerie.entries()].sort((a, b) => b[1].size - a[1].size || a[0] - b[0])[0]?.[0] ?? null;
  const temas = serieBase === null ? [] : [...bySerie.get(serieBase)!.entries()].sort((a, b) => a[0] - b[0]).map(([sort, title]) => ({ sort, title }));

  const alunos = new Map<number, RankRow>();
  for (const r of rows) {
    let a = alunos.get(r.sid);
    if (!a) {
      a = { position: null, id: r.sid, name: r.name, className: r.cname, serie: r.serie, demo: !!r.demo, active: !!r.active,
            themes: temas.map((t) => ({ sort: t.sort, status: null, points: null })), concluded: 0, points: 0, maxPoints: 0, pct: null, classification: null };
      alunos.set(r.sid, a);
    }
    if (!r.status) continue;
    const cell = a.themes.find((t) => t.sort === r.sort);
    if (cell) { cell.status = r.status === "completed" ? "completed" : "in_progress"; cell.points = r.points ?? 0; }
    if (r.status === "completed") { a.concluded++; a.points += r.points ?? 0; a.maxPoints += r.mx; }
  }
  const lista = [...alunos.values()];
  for (const a of lista) if (a.concluded > 0 && a.maxPoints > 0) {
    a.pct = Math.round((a.points / a.maxPoints) * 100);
    a.classification = dominio(a.pct);
  }
  const ranked = lista.filter((a) => a.concluded > 0).sort((a, b) => b.points - a.points || (b.pct ?? 0) - (a.pct ?? 0) || a.name.localeCompare(b.name, "pt-BR"));
  let lastPts = -1, lastPos = 0;
  ranked.forEach((a, i) => { if (a.points !== lastPts) { lastPos = i + 1; lastPts = a.points; } a.position = lastPos; });
  const semTema = lista.filter((a) => a.concluded === 0).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return { temas, rows: [...ranked, ...semTema] as RankRow[] };
}
