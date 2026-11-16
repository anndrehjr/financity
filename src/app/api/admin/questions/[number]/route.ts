import { api, body } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseScope, questionDetail } from "@/lib/analytics";
import { log } from "@/lib/students";

export const GET = api(async (req: Request, ctx: { params: Promise<{ number: string }> }) => {
  await requireRole("teacher");
  const p = new URL(req.url).searchParams;
  const r = questionDetail(Number((await ctx.params).number), { scope: parseScope(p.get("scope")), classId: Number(p.get("class")) || null });
  return r ?? Response.json({ error: "Questão não encontrada." }, { status: 404 });
});

/** Configuração das pontuações. Vale para respostas futuras; as já gravadas mantêm a pontuação da época. */
export const PUT = api(async (req: Request, ctx: { params: Promise<{ number: string }> }) => {
  const t = await requireRole("teacher");
  const number = Number((await ctx.params).number);
  const { points } = await body<{ points: Record<string, number> }>(req);
  const q = db().prepare("SELECT id FROM questions WHERE map_id=(SELECT id FROM maps WHERE sort=1) AND number=?").get(number) as { id: number } | undefined;
  if (!q) return Response.json({ error: "Questão não encontrada." }, { status: 404 });
  const entries = Object.entries(points || {});
  if (entries.length !== 5 || entries.some(([l, v]) => !"ABCDE".includes(l) || !Number.isInteger(v) || v < 0 || v > 5))
    return Response.json({ error: "Informe 5 pontuações inteiras entre 0 e 5." }, { status: 400 });
  db().transaction(() => {
    for (const [l, v] of entries) db().prepare("UPDATE options SET points=? WHERE question_id=? AND letter=?").run(v, q.id, l);
    log(t.id, "editar_pontuacoes", null, `Questão ${number}: ${JSON.stringify(points)}`);
  })();
});
