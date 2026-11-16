// Uso: npm run migrate [-- --seed]   (usa DATABASE_URL). Aplica as migrações pendentes; com --seed, cria o conteúdo que faltar.
import { migrate } from "./migrate.js";
import { seedContent } from "./lib/seed-content.js";
import { closePool } from "./lib/db.js";

const applied = await migrate();
console.log(applied.length ? `Migrações aplicadas: ${applied.join(", ")}` : "Banco já está atualizado.");
if (process.argv.includes("--seed")) { await seedContent(); console.log("Conteúdo-base conferido (nada foi sobrescrito)."); }
await closePool();
