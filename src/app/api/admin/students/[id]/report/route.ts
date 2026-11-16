import { api } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { studentReport } from "@/lib/analytics";

export const GET = api(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole("teacher");
  const r = studentReport(Number((await ctx.params).id));
  return r ?? Response.json({ error: "Aluno não encontrado." }, { status: 404 });
});
