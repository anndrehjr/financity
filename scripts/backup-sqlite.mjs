// Backup consistente do SQLite (somente leitura na origem) + verificação de restauração.
// Uso: node backup-sqlite.mjs <caminho-do-projeto> <pasta-de-destino>
import { createRequire } from "module";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const [proj, dest] = process.argv.slice(2);
const require = createRequire(path.join(proj, "package.json"));
const Database = require("better-sqlite3");
fs.mkdirSync(dest, { recursive: true });

const src = path.join(proj, "data", "financity.db");
const out = path.join(dest, "financity.db");

const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const tables = (d) => d.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((r) => r.name);
const counts = (d) => Object.fromEntries(tables(d).map((t) => [t, d.prepare(`SELECT COUNT(*) c FROM "${t}"`).get().c]));

const s = new Database(src, { readonly: true });
await s.backup(out); // API de backup do SQLite: inclui o conteúdo do WAL
const srcCounts = counts(s);
s.close();

// Verificação 1: integridade e chaves estrangeiras do backup
const b = new Database(out, { readonly: true });
const integ = b.pragma("integrity_check", { simple: true });
const fk = b.pragma("foreign_key_check");
const bkCounts = counts(b);
b.close();

// Verificação 2: restauração em arquivo separado e comparação de contagens
const restored = path.join(dest, "_teste-restauracao.db");
fs.copyFileSync(out, restored);
const r = new Database(restored, { readonly: true });
const rCounts = counts(r);
r.close();
fs.rmSync(restored);

const same = JSON.stringify(srcCounts) === JSON.stringify(bkCounts) && JSON.stringify(bkCounts) === JSON.stringify(rCounts);
const report = {
  quando: new Date().toISOString(), integrity_check: integ, foreign_key_violations: fk.length,
  contagens_iguais_origem_backup_restauracao: same, contagens: srcCounts, sha256_backup: sha(out), bytes: fs.statSync(out).size,
};
fs.writeFileSync(path.join(dest, "verificacao-sqlite.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (integ !== "ok" || fk.length || !same) process.exit(1);
