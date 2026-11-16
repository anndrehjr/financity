import crypto from "crypto";
import { one, q, tx } from "./db.js";
import { pinFingerprint } from "./auth.js";

/** Dados de DEMONSTRAÇÃO: marcados com is_demo=1 e ocultos por padrão em todas as telas. */
const DEMO_CLASS = "DEMO — 8º Ano (dados fictícios)";
const FIRST = ["Ana", "Bruno", "Carla", "Diego", "Eduarda", "Felipe", "Gabriela", "Hugo", "Isabela", "João", "Karen", "Lucas", "Marina", "Nicolas", "Olívia", "Pedro", "Rafaela", "Samuel", "Tainá", "Vitor", "Yasmin", "Zeca", "Bianca", "Caio"];

function rng(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }

export async function seedDemo(teacherId: number) {
  if (await one("SELECT 1 FROM students WHERE is_demo=1")) return { created: 0 };
  const a = await one<{ id: number; map_id: number }>("SELECT id,map_id FROM assessments WHERE grade=8 ORDER BY sort LIMIT 1");
  if (!a) return { created: 0 };
  const qs = await q<{ id: number }>("SELECT id FROM questions WHERE map_id=$1 ORDER BY number", [a.map_id]);
  const opts = new Map<number, { id: number; points: number }[]>();
  for (const x of qs) opts.set(x.id, await q("SELECT id,points FROM options WHERE question_id=$1 ORDER BY points", [x.id]));
  const rnd = rng(42);
  const placeholderHash = "$2a$10$demodemodemodemodemodeOQ8bJrV1p0nO8rO1m1m1m1m1m1m1m1m"; // não corresponde a nenhum PIN
  let n = 0;
  await tx(async (c) => {
    const cls = await one<{ id: number }>(
      "INSERT INTO classes(name,is_demo,grade) VALUES($1,1,8) ON CONFLICT(name) DO UPDATE SET name=excluded.name RETURNING id", [DEMO_CLASS], c);
    await q("INSERT INTO teacher_classes(teacher_id,class_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [teacherId, cls!.id], c);
    for (const [i, f] of FIRST.entries()) {
      const s = await one<{ id: number }>(
        "INSERT INTO students(full_name,class_id,username,pin_hash,pin_fp,is_demo) VALUES($1,$2,$3,$4,$5,1) RETURNING id",
        [`${f} Demo ${String(i + 1).padStart(2, "0")}`, cls!.id, `demo.${String(i + 1).padStart(2, "0")}`, placeholderHash, pinFingerprint("demo-" + crypto.randomBytes(8).toString("hex"))], c);
      // 70% concluem, 15% em andamento, 15% não começam
      const r = rnd();
      if (r > 0.85) continue;
      const upto = r > 0.7 ? 1 + Math.floor(rnd() * 4) : 5;
      const at = await one<{ id: number }>(
        "INSERT INTO attempts(student_id,map_id,assessment_id,status) VALUES($1,$2,$3,$4) RETURNING id", [s!.id, a.map_id, a.id, upto === 5 ? "completed" : "in_progress"], c);
      let total = 0;
      for (const [qi, qq] of qs.slice(0, upto).entries()) {
        const o = opts.get(qq.id)!;
        // a questão 4 (índice 3) é mais difícil nos dados fictícios
        const skill = qi === 3 ? 0.35 : 0.6;
        let idx = Math.min(4, Math.max(0, Math.round(rnd() * 2 + skill * 2 + (rnd() - 0.5) * 2)));
        idx = Math.min(idx, 4);
        total += o[idx].points;
        await q("INSERT INTO answers(attempt_id,question_id,option_id,points,display_pos) VALUES($1,$2,$3,$4,$5)", [at!.id, qq.id, o[idx].id, o[idx].points, 1 + Math.floor(rnd() * 5)], c);
      }
      await q("UPDATE attempts SET total_points=$1, completed_at=CASE WHEN $2::int=5 THEN now() END WHERE id=$3", [total, upto, at!.id], c);
      n++;
    }
  });
  return { created: FIRST.length, withAttempts: n };
}

export async function removeDemo() {
  await tx(async (c) => {
    await q("DELETE FROM answers WHERE attempt_id IN (SELECT a.id FROM attempts a JOIN students s ON s.id=a.student_id WHERE s.is_demo=1)", [], c);
    await q("DELETE FROM attempts WHERE student_id IN (SELECT id FROM students WHERE is_demo=1)", [], c);
    await q("DELETE FROM admin_log WHERE student_id IN (SELECT id FROM students WHERE is_demo=1)", [], c);
    await q("DELETE FROM sessions WHERE role='student' AND user_id IN (SELECT id FROM students WHERE is_demo=1)", [], c);
    await q("DELETE FROM students WHERE is_demo=1", [], c);
    await q("DELETE FROM classes WHERE is_demo=1", [], c);
  });
}
