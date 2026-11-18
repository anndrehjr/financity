import assert from "node:assert/strict";
import { test } from "node:test";

// O CSP é montado em next.config.mjs. Em produção ele não pode conter 'unsafe-eval' nem curingas de origem.
(process.env as Record<string, string | undefined>).NODE_ENV = "production";

async function cabecalhos() {
  const cfg = (await import("../../../../next.config.mjs")).default as { headers: () => Promise<{ headers: { key: string; value: string }[] }[]> };
  const [todas] = await cfg.headers();
  return Object.fromEntries(todas.headers.map((h) => [h.key, h.value]));
}

test("o site envia Content-Security-Policy restritivo e os demais cabeçalhos de segurança", async () => {
  const h = await cabecalhos();
  const csp = h["Content-Security-Policy"];
  assert.ok(csp, "falta o Content-Security-Policy");
  for (const d of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", "upgrade-insecure-requests"])
    assert.ok(csp.includes(d), `CSP sem a diretiva: ${d}`);
  assert.ok(!csp.includes("'unsafe-eval'"), "produção não pode permitir eval");
  assert.ok(!/(^|[ ;])\*([ ;]|$)/.test(csp), "CSP não pode ter curinga de origem");
  assert.ok(!/https?:\/\//.test(csp), "nenhuma origem externa é necessária");
  assert.equal(h["X-Frame-Options"], "DENY");
  assert.equal(h["X-Content-Type-Options"], "nosniff");
  assert.match(h["Strict-Transport-Security"] ?? "", /max-age=\d{7,}/);
});
