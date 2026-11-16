import crypto from "crypto";
import { db } from "./db";
import { pinFingerprint } from "./auth";
import { classIdByName } from "./students";

/** Dados de DEMONSTRAÇÃO: marcados com is_demo=1 e ocultos por padrão em todas as telas. */
const DEMO_CLASS = "DEMO — 8º Ano (dados fictícios)";
const FIRST = ["Ana", "Bruno", "Carla", "Diego", "Eduarda", "Felipe", "Gabriela", "Hugo", "Isabela", "João", "Karen", "Lucas", "Marina", "Nicolas", "Olívia", "Pedro", "Rafaela", "Samuel", "Tainá", "Vitor", "Yasmin", "Zeca", "Bianca", "Caio"];

function rng(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }

export function seedDemo() {
  const d = db();
  if (d.prepare("SELECT 1 FROM students WHERE is_demo=1").get()) return { created: 0 };
  const classId = classIdByName(DEMO_CLASS, true);
  const map = d.prepare("SELECT id FROM maps WHERE sort=1").get() as { id: number };
  const qs = d.prepare("SELECT id FROM questions WHERE map_id=? ORDER BY number").all(map.id) as { id: number }[];
  const opts = new Map(qs.map((q) => [q.id, d.prepare("SELECT id,points FROM options WHERE question_id=? ORDER BY points").all(q.id) as { id: number; points: number }[]]));
  const rnd = rng(42);
  const placeholderHash = "$2a$10$demodemodemodemodemodeOQ8bJrV1p0nO8rO1m1m1m1m1m1m1m1m"; // não corresponde a nenhum PIN
  let n = 0;
  d.transaction(() => {
    FIRST.forEach((f, i) => {
      const info = d.prepare("INSERT INTO students(full_name,class_id,username,pin_hash,pin_fp,is_demo) VALUES(?,?,?,?,?,1)")
        .run(`${f} Demo ${String(i + 1).padStart(2, "0")}`, classId, `demo.${String(i + 1).padStart(2, "0")}`, placeholderHash, pinFingerprint("demo-" + crypto.randomBytes(8).toString("hex")));
      const sid = Number(info.lastInsertRowid);
      // 70% concluem, 15% em andamento, 15% não começam
      const r = rnd();
      if (r > 0.85) return;
      const upto = r > 0.7 ? 1 + Math.floor(rnd() * 4) : 5;
      const at = d.prepare("INSERT INTO attempts(student_id,map_id,status) VALUES(?,?,?)").run(sid, map.id, upto === 5 ? "completed" : "in_progress");
      let total = 0;
      qs.slice(0, upto).forEach((q, qi) => {
        const o = opts.get(q.id)!;
        // a questão 4 (índice 3) é mais difícil nos dados fictícios
        const skill = qi === 3 ? 0.35 : 0.6;
        let idx = Math.min(4, Math.max(0, Math.round(rnd() * 2 + skill * 2 + (rnd() - 0.5) * 2)));
        idx = Math.min(idx, 4);
        total += o[idx].points;
        d.prepare("INSERT INTO answers(attempt_id,question_id,option_id,points,display_pos) VALUES(?,?,?,?,?)").run(at.lastInsertRowid, q.id, o[idx].id, o[idx].points, 1 + Math.floor(rnd() * 5));
      });
      d.prepare("UPDATE attempts SET total_points=?, completed_at=CASE WHEN ?=5 THEN datetime('now') END WHERE id=?").run(total, upto, at.lastInsertRowid);
      n++;
    });
  })();
  return { created: FIRST.length, withAttempts: n };
}

export function removeDemo() {
  const d = db();
  d.transaction(() => {
    d.prepare("DELETE FROM answers WHERE attempt_id IN (SELECT a.id FROM attempts a JOIN students s ON s.id=a.student_id WHERE s.is_demo=1)").run();
    d.prepare("DELETE FROM attempts WHERE student_id IN (SELECT id FROM students WHERE is_demo=1)").run();
    d.prepare("DELETE FROM admin_log WHERE student_id IN (SELECT id FROM students WHERE is_demo=1)").run();
    d.prepare("DELETE FROM sessions WHERE role='student' AND user_id IN (SELECT id FROM students WHERE is_demo=1)").run();
    d.prepare("DELETE FROM students WHERE is_demo=1").run();
    d.prepare("DELETE FROM classes WHERE is_demo=1").run();
  })();
}
