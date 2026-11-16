import { api, body } from "@/lib/http";
import { login } from "@/lib/auth";

export const POST = api(async (req: Request) => {
  const { username, password } = await body<{ username: string; password: string }>(req);
  const u = await login(username, password);
  return { role: u.role, name: u.name, redirect: u.role === "teacher" ? "/admin" : "/jogo" };
});
