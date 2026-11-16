import { api, body } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { releaseNewAttempt, resetPin, setActive } from "@/lib/students";

export const PATCH = api(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const t = await requireRole("teacher");
  const id = Number((await ctx.params).id);
  const b = await body<{ action: string; pin?: string; reason?: string; confirm?: boolean }>(req);
  if (b.action === "reset_pin") return { pin: await resetPin(id, t.id, b.pin) };
  if (b.action === "deactivate") { setActive(id, false, t.id); return; }
  if (b.action === "activate") { setActive(id, true, t.id); return; }
  if (b.action === "new_attempt") {
    if (!b.confirm) return Response.json({ error: "Confirmação necessária." }, { status: 400 });
    releaseNewAttempt(id, t.id, String(b.reason || ""));
    return;
  }
  return Response.json({ error: "Ação desconhecida." }, { status: 400 });
});
