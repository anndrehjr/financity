// PostgreSQL REAL e local para desenvolvimento/testes (sem Docker). Dados em apps/api/.pgdev (fora do git).
// Uso: npm run pg:dev   -> sobe em 127.0.0.1:54329 (usuário/senha só locais) e fica rodando até Ctrl+C.
import EmbeddedPostgres from "embedded-postgres";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".pgdev");
const port = Number(process.env.PG_DEV_PORT || 54329);
const pg = new EmbeddedPostgres({ databaseDir: dir, user: "financity_dev", password: "dev-local-only", port, persistent: true, initdbFlags: ["--encoding=UTF8", "--no-locale"] });
if (!fs.existsSync(path.join(dir, "PG_VERSION"))) await pg.initialise();
await pg.start();
try { await pg.createDatabase("financity"); } catch { /* já existe */ }
console.log(`PostgreSQL dev pronto: postgres://financity_dev:dev-local-only@127.0.0.1:${port}/financity`);
process.on("SIGINT", async () => { await pg.stop(); process.exit(0); });
