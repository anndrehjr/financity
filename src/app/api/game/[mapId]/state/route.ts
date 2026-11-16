import { api } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { mapState } from "@/lib/game";

export const GET = api(async (_req: Request, ctx: { params: Promise<{ mapId: string }> }) => {
  const u = await requireRole("student");
  return mapState(u.id, Number((await ctx.params).mapId));
});
