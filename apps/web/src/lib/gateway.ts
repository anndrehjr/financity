import "server-only";
import { signRequest } from "@financity/gateway-sign";

/**
 * Configuração só do servidor da Vercel. Nunca use NEXT_PUBLIC_* aqui: estas variáveis não podem chegar ao navegador.
 *   API_URL         endereço HTTPS da API na VPS (ex.: https://api.<domínio>) — sem barra final
 *   GATEWAY_SECRET  segredo compartilhado com a API (32+ caracteres)
 */
export function gatewayConfig() {
  const apiUrl = (process.env.API_URL || "").replace(/\/+$/, "");
  const secret = process.env.GATEWAY_SECRET || "";
  if (!apiUrl || secret.length < 32) {
    console.error("Gateway mal configurado: defina API_URL e GATEWAY_SECRET (32+ caracteres) nas variáveis de ambiente do servidor.");
    return null;
  }
  return { apiUrl, secret };
}

/** Chama a API assinando a requisição. `ip` é o IP do usuário final (a API só confia nele porque vem assinado). */
export async function callApi(opts: { method: string; pathAndQuery: string; ip: string; body?: string; cookie?: string | null; contentType?: string | null }): Promise<Response> {
  const cfg = gatewayConfig();
  if (!cfg) return Response.json({ error: "Serviço indisponível." }, { status: 503 });
  const body = opts.body ?? "";
  const headers: Record<string, string> = {
    ...signRequest({ secret: cfg.secret, method: opts.method, pathAndQuery: opts.pathAndQuery, ip: opts.ip, body }),
    accept: "application/json",
  };
  if (opts.cookie) headers.cookie = opts.cookie;
  if (body) headers["content-type"] = opts.contentType || "application/json";
  try {
    return await fetch(cfg.apiUrl + opts.pathAndQuery, {
      method: opts.method, headers, body: body || undefined, redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(15_000),
    });
  } catch (e) {
    console.error("Falha ao chamar a API:", e instanceof Error ? e.name : "erro"); // sem URL, corpo nem cookies
    return Response.json({ error: "Serviço temporariamente indisponível. Tente de novo em instantes." }, { status: 502 });
  }
}
