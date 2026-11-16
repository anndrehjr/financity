import "server-only";
import { cookies } from "next/headers";
import { callApi } from "./gateway";

export type SessionUser = { role: "student" | "teacher"; name: string };

/** Sessão do usuário, lida da API (o banco fica na VPS; aqui só chega o papel e o nome). */
export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  if (!jar.get("fc_session")) return null;
  const res = await callApi({ method: "GET", pathAndQuery: "/api/session", ip: "server", cookie: jar.toString() });
  if (!res.ok) return null;
  try { return ((await res.json()) as { session: SessionUser | null }).session; } catch { return null; }
}
