import { q, tx } from "./db.js";
import { MAPA2 } from "../content/mapa2.js";
import { MAPA3 } from "../content/mapa3.js";
import { MAPA4 } from "../content/mapa4.js";

const MAPAS = [MAPA2, MAPA3, MAPA4];

/** Cria as questões dos Mapas 2–4 que ainda não existem. Idempotente: nunca altera texto nem pontuação já gravados. */
export async function seedMapas234(): Promise<{ criadas: number }> {
  let criadas = 0;
  await tx(async (c) => {
    for (const m of MAPAS) {
      const map = (await c.query("SELECT id FROM maps WHERE slug=$1", [m.slug])).rows[0] as { id: number } | undefined;
      if (!map) throw new Error(`Mapa "${m.slug}" não existe: aplique a migração/seed base antes.`);
      for (const qq of m.questions) {
        if ((await c.query("SELECT 1 FROM questions WHERE map_id=$1 AND number=$2", [map.id, qq.number])).rowCount) continue;
        const r = await c.query(
          `INSERT INTO questions(map_id,number,title,theme,scene,scenario,dialog,prompt,note,strength,retake)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
          [map.id, qq.number, qq.title, qq.theme, qq.scene, qq.scenario, qq.dialog, qq.prompt, qq.note, qq.strength, qq.retake]);
        for (const [i, o] of qq.options.entries())
          await c.query("INSERT INTO options(question_id,letter,text,points,why) VALUES ($1,$2,$3,$4,$5)", [r.rows[0].id, "ABCDE"[i], o.text, o.points, o.why]);
        criadas++;
      }
    }
  });
  return { criadas };
}

/** Libera os Mapas 2–4 do 8º ano (as avaliações já existem desde a migração 002). Só liga quando as 5 questões existem. */
export async function ativarMapas(grade = 8): Promise<{ ativadas: number[] }> {
  const rows = await q<{ id: number; slug: string; n: number }>(
    `SELECT a.id, m.slug, (SELECT COUNT(*) FROM questions x WHERE x.map_id=m.id)::int n
       FROM assessments a JOIN maps m ON m.id=a.map_id WHERE a.grade=$1 AND m.slug = ANY($2::text[])`, [grade, MAPAS.map((m) => m.slug)]);
  const prontas = rows.filter((r) => r.n === 5).map((r) => r.id);
  if (prontas.length) await q("UPDATE assessments SET status='available' WHERE id = ANY($1::int[])", [prontas]);
  return { ativadas: prontas };
}
