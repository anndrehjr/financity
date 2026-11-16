import { api } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { startAttempt } from "@/lib/game";

export const POST = api(async (_req: Request, ctx: { params: Promise<{ mapId: string }> }) => {
  const u = await requireRole("student");
  return startAttempt(u.id, Number((await ctx.params).mapId));
});
