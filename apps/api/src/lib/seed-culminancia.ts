import { tx } from "./db.js";
import { CULMINANCIA } from "../content/culminancia.js";

/**
 * Cria a trilha da Culminância (4 temas × 8 questões) e a coloca no lugar dos mapas antigos do 8º ano.
 * Nada é apagado: as avaliações antigas viram "archived" (sort + 100), com todas as tentativas e respostas preservadas.
 * Voltar atrás = trocar o status das antigas de volta e arquivar as novas. Idempotente.
 */
export async function seedCulminancia(grade = 8): Promise<{ questoes: number; avaliacoes: number[] }> {
  let questoes = 0;
  const avaliacoes: number[] = [];
  await tx(async (c) => {
    const subj = (await c.query("SELECT id FROM subjects WHERE slug='educacao-financeira'")).rows[0]?.id as number | undefined;
    if (!subj) throw new Error("Matéria 'educacao-financeira' não existe: aplique o seed base antes.");
    const novos: number[] = [];
    for (const t of CULMINANCIA) {
      let map = (await c.query("SELECT id FROM maps WHERE slug=$1", [t.slug])).rows[0] as { id: number } | undefined;
      if (!map) {
        map = (await c.query(
          "INSERT INTO maps(sort,slug,title,subtitle,topics,status,subject_id) VALUES (NULL,$1,$2,$3,$4::jsonb,'available',$5) RETURNING id",
          [t.slug, t.title, t.subtitle, JSON.stringify(t.topics), subj])).rows[0];
      }
      novos.push(map!.id);
      for (const qq of t.questions) {
        if ((await c.query("SELECT 1 FROM questions WHERE map_id=$1 AND number=$2", [map!.id, qq.number])).rowCount) continue;
        const r = await c.query(
          `INSERT INTO questions(map_id,number,title,theme,scene,scenario,dialog,prompt,note,strength,retake,kind,max_points,hint,bloom,bncc,source)
           VALUES ($1,$2,$3,$4,$5,$6,'',$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
          [map!.id, qq.number, qq.title, qq.theme, qq.scene, qq.scenario, qq.prompt, qq.rubric, qq.strength, qq.retake, qq.kind, qq.max, qq.hint ?? null, qq.bloom, qq.bncc, qq.source]);
        for (const [i, o] of qq.options.entries())
          await c.query("INSERT INTO options(question_id,letter,text,points,why,is_correct,seq) VALUES ($1,$2,$3,$4,$5,$6,$7)",
            [r.rows[0].id, "ABCDE"[i], o.text, o.points, o.why, !!o.correct, o.seq ?? null]);
        questoes++;
      }
    }
    // só troca de trilha quando as 32 questões existem
    const n = (await c.query("SELECT COUNT(*)::int n FROM questions WHERE map_id = ANY($1::int[])", [novos])).rows[0].n as number;
    if (n !== CULMINANCIA.reduce((s, t) => s + t.questions.length, 0)) throw new Error(`Conteúdo incompleto (${n} questões); nada foi ativado.`);
    await c.query("UPDATE assessments SET sort = sort + 100, status = 'archived' WHERE grade=$1 AND sort <= 100 AND map_id <> ALL($2::int[])", [grade, novos]);
    for (const [i, mapId] of novos.entries()) {
      const r = await c.query(
        "INSERT INTO assessments(map_id,grade,sort,status) VALUES ($1,$2,$3,'available') ON CONFLICT(grade,map_id) DO UPDATE SET status='available' RETURNING id", [mapId, grade, i + 1]);
      avaliacoes.push(r.rows[0].id as number);
    }
  });
  return { questoes, avaliacoes };
}
