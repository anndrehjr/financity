import { api, body } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { submitAnswer } from "@/lib/game";

export const POST = api(async (req: Request, ctx: { params: Promise<{ mapId: string }> }) => {
  const u = await requireRole("student");
  const { questionId, optionId } = await body<{ questionId: number; optionId: number }>(req);
  return submitAnswer(u.id, Number((await ctx.params).mapId), Number(questionId), Number(optionId));
});
