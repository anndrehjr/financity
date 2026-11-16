import { api } from "@/lib/http";
import { logout } from "@/lib/auth";

export const POST = api(async (_req: Request) => {
  await logout();
});
