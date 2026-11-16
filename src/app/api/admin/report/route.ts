import { api } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { classReport, parseScope } from "@/lib/analytics";

export const GET = api(async (req: Request) => {
  await requireRole("teacher");
  const p = new URL(req.url).searchParams;
  return classReport({ scope: parseScope(p.get("scope")), classId: Number(p.get("class")) || null });
});
