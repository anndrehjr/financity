import { api, body } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { parseScope } from "@/lib/analytics";
import { createStudents, listStudents, type NewStudent } from "@/lib/students";

export const GET = api(async (req: Request) => {
  await requireRole("teacher");
  const p = new URL(req.url).searchParams;
  return listStudents((p.get("q") || "").trim().slice(0, 60), Number(p.get("class")) || null, parseScope(p.get("scope")));
});

export const POST = api(async (req: Request) => {
  const t = await requireRole("teacher");
  const { rows } = await body<{ rows: NewStudent[] }>(req);
  if (!Array.isArray(rows) || !rows.length) return Response.json({ error: "Nenhum aluno informado." }, { status: 400 });
  return createStudents(rows, t.id);
});
