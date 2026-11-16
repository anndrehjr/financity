import { api } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { listMaps } from "@/lib/game";

export const GET = api(async (_req: Request) => {
  const u = await requireRole("student");
  return { name: u.name, ...listMaps(u.id) };
});
