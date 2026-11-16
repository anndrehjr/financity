import { api, csvResponse } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { classReport, parseScope } from "@/lib/analytics";
import { maxPoints } from "@/lib/game";

/** CSV da turma: ?type=alunos (um aluno por linha) ou ?type=resumo (questões). */
export const GET = api(async (req: Request) => {
  await requireRole("teacher");
  const p = new URL(req.url).searchParams;
  const scope = parseScope(p.get("scope")), classId = Number(p.get("class")) || null;
  if (p.get("type") === "resumo") {
    const r = classReport({ scope, classId });
    return csvResponse("financity-resumo-questoes.csv", [
      ["Questão", "Tema", "Respostas", "Média de pontos", "Índice de desempenho (%)", "Decisões de 5 pontos", "Decisões de 0 ponto"],
      ...r.questions.map((q) => [`Q${q.number}`, q.theme, q.n, q.avg ?? "", q.index ?? "", q.excellent, q.inadequate]),
    ]);
  }
  const where = (scope === "real" ? " AND s.is_demo=0" : scope === "demo" ? " AND s.is_demo=1" : "") + (classId ? ` AND s.class_id=${classId}` : "");
  const rows = db().prepare(`SELECT s.id,s.full_name,c.name cname,s.is_demo,a.id aid,a.status,a.total_points FROM students s LEFT JOIN classes c ON c.id=s.class_id
    LEFT JOIN attempts a ON a.student_id=s.id AND a.status!='voided' AND a.map_id=(SELECT id FROM maps WHERE sort=1) WHERE 1=1${where} ORDER BY s.full_name`).all() as
    { id: number; full_name: string; cname: string | null; is_demo: number; aid: number | null; status: string | null; total_points: number | null }[];
  const max = maxPoints((db().prepare("SELECT id FROM maps WHERE sort=1").get() as { id: number }).id);
  const out: unknown[][] = [["Aluno", "Turma", "Situação", "Q1", "Q2", "Q3", "Q4", "Q5", "Total", "Máximo", "Aproveitamento (%)", "Dados de demonstração"]];
  for (const r of rows) {
    const pts = r.aid ? (db().prepare("SELECT q.number,an.points FROM answers an JOIN questions q ON q.id=an.question_id WHERE an.attempt_id=?").all(r.aid) as { number: number; points: number }[]) : [];
    const q = (n: number) => pts.find((x) => x.number === n)?.points ?? "";
    out.push([r.full_name, r.cname ?? "", r.status === "completed" ? "Concluído" : r.status === "in_progress" ? "Em andamento" : "Não iniciou", q(1), q(2), q(3), q(4), q(5),
      r.status ? r.total_points : "", max, r.status === "completed" ? Math.round(((r.total_points ?? 0) / max) * 100) : "", r.is_demo ? "SIM" : "não"]);
  }
  return csvResponse("financity-turma.csv", out);
});
