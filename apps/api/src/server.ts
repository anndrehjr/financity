import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { config } from "./config.js";
import { closePool } from "./lib/db.js";
import { purgeExpired } from "./lib/integrity.js";

const server = serve({ fetch: app.fetch, port: config.port, hostname: config.host }, (i) => console.log(`financity-api ouvindo em ${i.address}:${i.port}`));
// LGPD: apaga ocorrências de integridade mais antigas que o prazo de retenção configurado (ao iniciar e a cada 24 h)
const purge = () => purgeExpired().then((r) => { if (r.events || r.audit) console.log(`retenção: ${r.events} ocorrência(s) e ${r.audit} registro(s) de auditoria expirados apagados`); }).catch((e) => console.error("retenção falhou:", e instanceof Error ? e.message : "erro"));
void purge();
setInterval(purge, 24 * 3600_000).unref();
const stop = async () => { server.close(); await closePool(); process.exit(0); };
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
