// Assinatura das chamadas Vercel (gateway) -> API. HMAC-SHA256 sobre método, caminho+query, IP do cliente, corpo e hora.
// A API só aceita requisições assinadas; sem isso, o endereço api.<domínio> é inútil para quem chamar direto.
import crypto from "node:crypto";

export const HEADERS = { ts: "x-fc-ts", ip: "x-fc-ip", sig: "x-fc-sig" };

const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const canonical = ({ ts, method, pathAndQuery, ip, body }) => `v1\n${ts}\n${String(method).toUpperCase()}\n${pathAndQuery}\n${ip}\n${sha(body || "")}`;

export function signRequest({ secret, method, pathAndQuery, ip, body = "", ts = Date.now() }) {
  const sig = crypto.createHmac("sha256", secret).update(canonical({ ts, method, pathAndQuery, ip, body })).digest("hex");
  return { [HEADERS.ts]: String(ts), [HEADERS.ip]: ip, [HEADERS.sig]: sig };
}

/** true somente se a assinatura confere e a hora está dentro da janela (padrão 60 s). */
export function verifyRequest({ secret, method, pathAndQuery, body = "", headers, now = Date.now(), maxSkewMs = 60_000 }) {
  const ts = Number(headers[HEADERS.ts]), ip = headers[HEADERS.ip], sig = headers[HEADERS.sig];
  if (!Number.isFinite(ts) || !ip || !sig || Math.abs(now - ts) > maxSkewMs) return false;
  const exp = crypto.createHmac("sha256", secret).update(canonical({ ts, method, pathAndQuery, ip, body })).digest();
  const got = Buffer.from(String(sig), "hex");
  return got.length === exp.length && crypto.timingSafeEqual(got, exp);
}
