import { api } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { mapResult } from "@/lib/game";

export const GET = api(async (_req: Request, ctx: { params: Promise<{ mapId: string }> }) => {
  const u = await requireRole("student");
  return mapResult(u.id, Number((await ctx.params).mapId), u.name);
});
