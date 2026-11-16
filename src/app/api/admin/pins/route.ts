import { api, body } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { countPendingPins, generatePinsBatch, type BatchMode } from "@/lib/students";

/** Quantos alunos reais ainda estão sem PIN (apenas professor). */
export const GET = api(async (_req: Request) => {
  await requireRole("teacher");
  return { pending: countPendingPins() };
});

/**
 * Gerador Automático de PINs. Só professor. Exige confirm:true em TODOS os modos (nada é alterado sem confirmação).
 * modos: missing (só quem está sem PIN), selected (ids), class (todos da turma).
 */
export const POST = api(async (req: Request) => {
  const t = await requireRole("teacher");
  const b = await body<{ mode: string; ids?: unknown; classId?: unknown; confirm?: boolean }>(req);
  if (!["missing", "selected", "class"].includes(b.mode)) return Response.json({ error: "Modo inválido." }, { status: 400 });
  if (b.confirm !== true) return Response.json({ error: "Confirmação necessária para gerar ou redefinir PINs." }, { status: 400 });
  return generatePinsBatch(b.mode as BatchMode, { ids: b.ids, classId: b.classId }, t.id);
});
