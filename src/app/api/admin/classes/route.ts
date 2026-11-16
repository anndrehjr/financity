import { api } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const GET = api(async (_req: Request) => {
  await requireRole("teacher");
  return db().prepare("SELECT id,name,is_demo demo FROM classes ORDER BY name").all();
});
