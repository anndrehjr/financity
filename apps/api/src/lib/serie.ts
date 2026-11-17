// Temas por série: validação do conteúdo e carga no banco. Só entra no banco tema COMPLETO e marcado como publicável (rascunho: false).
import type { QuestaoC, TemaC } from "../content/culminancia.js";
import { tx } from "./db.js";

export type TemaSerie = Omit<TemaC, "questions"> & { serie: number; rascunho: boolean; questions: QuestaoC[] };

/** Padrão único: TODO desafio vale 30 (240 por tema). Nos de escolha, as alternativas valem 30 / 20 / 10 / 0. */
export const PONTOS_POR_DESAFIO = [30, 30, 30, 30, 30, 30, 30, 30];
export const ESCALA_ESCOLHA = [0, 10, 20, 30];
const vazio = (t: string | undefined) => !t || !t.trim();

/** Confere um tema: 8 desafios completos (enunciado, alternativas, resposta correta, pontuação e explicação). Devolve a lista de problemas. */
export function validarTema(t: TemaSerie): string[] {
  const e: string[] = [];
  const rot = (n: number | string) => `${t.slug} · desafio ${n}`;
  if (vazio(t.slug) || vazio(t.title) || vazio(t.subtitle)) e.push(`${t.slug || "(sem slug)"}: título, subtítulo e slug são obrigatórios`);
  if (!t.topics?.length || t.topics.some(vazio)) e.push(`${t.slug}: informe os tópicos do tema`);
  if (t.questions.length !== 8) e.push(`${t.slug}: precisa de 8 desafios (tem ${t.questions.length})`);
  t.questions.forEach((q, i) => {
    const r = rot(i + 1);
    if (q.number !== i + 1) e.push(`${r}: número deve ser ${i + 1}`);
    for (const [campo, v] of [["título", q.title], ["situação (cenário)", q.scenario], ["enunciado", q.prompt], ["tema do desafio", q.theme], ["critério/rubrica", q.rubric],
      ["o que a resposta mostra (strength)", q.strength], ["o que retomar (retake)", q.retake], ["habilidade BNCC", q.bncc]] as const)
      if (vazio(v)) e.push(`${r}: falta ${campo}`);
    if (q.max !== PONTOS_POR_DESAFIO[i]) e.push(`${r}: pontuação máxima deve ser ${PONTOS_POR_DESAFIO[i]} (tem ${q.max})`);
    if (q.options.length !== 4) { e.push(`${r}: precisa de 4 alternativas`); return; }
    if (q.options.some((o) => vazio(o.text))) e.push(`${r}: alternativa sem texto`);
    if (q.options.some((o) => vazio(o.why))) e.push(`${r}: alternativa sem explicação`);
    if (new Set(q.options.map((o) => o.text.trim())).size !== 4) e.push(`${r}: alternativas repetidas`);
    if (q.kind === "choice") {
      if (q.options.some((o) => !ESCALA_ESCOLHA.includes(o.points))) e.push(`${r}: as alternativas só podem valer 30 (correta), 20, 10 ou 0 pontos`);
      if (q.options.filter((o) => o.points === q.max).length !== 1) e.push(`${r}: deve haver exatamente 1 resposta correta (vale ${q.max})`);
    } else if (q.kind === "multi") {
      const c = q.options.filter((o) => o.correct).length;
      if (c < 1 || c > 3) e.push(`${r}: multisseleção precisa de 1 a 3 corretas`);
    } else if (q.kind === "order") {
      if ([...q.options.map((o) => o.seq)].sort().join() !== "1,2,3,4") e.push(`${r}: ordenação precisa das posições 1, 2, 3 e 4`);
    } else e.push(`${r}: tipo inválido`);
  });
  return e;
}

export type ResultadoSerie = { publicados: string[]; rascunhos: string[]; questoes: number };

/** Carrega no banco os temas prontos (rascunho: false). Tudo-ou-nada: qualquer problema em um tema pronto cancela a carga. Não apaga nada. */
export async function seedSerie(temas: TemaSerie[]): Promise<ResultadoSerie> {
  const prontos = temas.filter((t) => !t.rascunho), rascunhos = temas.filter((t) => t.rascunho).map((t) => t.slug);
  const problemas = prontos.flatMap(validarTema);
  if (problemas.length) throw new Error("Conteúdo incompleto — nada foi gravado:\n - " + problemas.join("\n - "));
  let questoes = 0; const publicados: string[] = [];
  await tx(async (c) => {
    const subj = (await c.query("SELECT id FROM subjects WHERE slug='educacao-financeira'")).rows[0]?.id as number | undefined;
    if (!subj) throw new Error("Matéria 'educacao-financeira' não existe.");
    for (const t of prontos) {
      if ((await c.query("SELECT 1 FROM maps WHERE slug=$1", [t.slug])).rowCount) continue; // idempotente: não sobrescreve
      const m = (await c.query("INSERT INTO maps(sort,slug,title,subtitle,topics,status,subject_id,serie) VALUES (NULL,$1,$2,$3,$4::jsonb,'available',$5,$6) RETURNING id",
        [t.slug, t.title, t.subtitle, JSON.stringify(t.topics), subj, t.serie])).rows[0].id as number;
      for (const q of t.questions) {
        const r = await c.query(
          `INSERT INTO questions(map_id,number,title,theme,scene,scenario,dialog,prompt,note,strength,retake,kind,max_points,hint,bloom,bncc,source)
           VALUES ($1,$2,$3,$4,$5,$6,'',$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
          [m, q.number, q.title, q.theme, q.scene || "plan", q.scenario, q.prompt, q.rubric, q.strength, q.retake, q.kind, q.max, q.hint ?? null, q.bloom, q.bncc, q.source ?? null]);
        for (const [i, o] of q.options.entries())
          await c.query("INSERT INTO options(question_id,letter,text,points,why,is_correct,seq) VALUES ($1,$2,$3,$4,$5,$6,$7)",
            [r.rows[0].id, "ABCDE"[i], o.text, o.points, o.why, !!o.correct, o.seq ?? null]);
        questoes++;
      }
      const sort = ((await c.query("SELECT COALESCE(MAX(sort),0)+1 n FROM assessments WHERE grade=$1", [t.serie])).rows[0].n as number);
      await c.query("INSERT INTO assessments(map_id,grade,sort,status) VALUES ($1,$2,$3,'available')", [m, t.serie, sort]);
      publicados.push(t.slug);
    }
  });
  return { publicados, rascunhos, questoes };
}
