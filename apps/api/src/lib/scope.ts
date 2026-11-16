import { HttpError } from "./auth.js";
import { one, type Q } from "./db.js";

/** Série deduzida do nome da turma: "8 ano", "8º A", "7º B" -> 8, 8, 7. Sem número válido (1–12) -> null. */
export function gradeFromName(name: string): number | null {
  const m = /(\d{1,2})/.exec(name);
  const g = m ? Number(m[1]) : NaN;
  return Number.isInteger(g) && g >= 1 && g <= 12 ? g : null;
}

/** Montador de cláusulas com parâmetros ($1, $2...) — evita concatenar valores no SQL. */
export class W {
  vals: unknown[] = [];
  parts: string[] = [];
  /** Cada "?" no fragmento vira o próximo parâmetro. */
  add(sql: string, ...v: unknown[]) {
    let i = 0;
    this.parts.push(sql.replace(/\?/g, () => { this.vals.push(v[i++]); return `$${this.vals.length}`; }));
    return this;
  }
  /** Para usar um valor em outro ponto do SQL (ex.: LIMIT, subconsulta). */
  param(v: unknown) { this.vals.push(v); return `$${this.vals.length}`; }
  get sql() { return this.parts.length ? " AND " + this.parts.join(" AND ") : ""; }
}

/** Fragmento: aluno `alias` pertence a uma turma do professor. */
export const ownedStudents = (w: W, teacherId: number, alias = "s") =>
  w.add(`${alias}.class_id IN (SELECT class_id FROM teacher_classes WHERE teacher_id=?)`, teacherId);

export async function assertTeacherClass(teacherId: number, classId: number, c?: Q) {
  const r = await one("SELECT 1 FROM teacher_classes WHERE teacher_id=$1 AND class_id=$2", [teacherId, classId], c);
  if (!r) throw new HttpError(404, "Turma não encontrada.");
}
export async function assertTeacherStudent(teacherId: number, studentId: number, c?: Q) {
  const r = await one(
    "SELECT 1 FROM students s JOIN teacher_classes tc ON tc.class_id=s.class_id WHERE s.id=$1 AND tc.teacher_id=$2",
    [studentId, teacherId], c);
  if (!r) throw new HttpError(404, "Aluno não encontrado.");
}
