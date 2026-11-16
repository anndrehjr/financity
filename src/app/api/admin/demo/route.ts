import { api } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { removeDemo, seedDemo } from "@/lib/demo";

export const POST = api(async (_req: Request) => {
  await requireRole("teacher");
  return seedDemo();
});
export const DELETE = api(async (_req: Request) => {
  await requireRole("teacher");
  removeDemo();
});
