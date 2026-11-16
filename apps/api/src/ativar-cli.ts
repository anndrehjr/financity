// Uso: node dist/ativar-cli.js   (ou npx tsx src/ativar-cli.ts). Aplica migrações, cria as questões dos Mapas 2–4 e libera os mapas do 8º ano.
// Idempotente: pode rodar de novo sem duplicar nada nem sobrescrever pontuações editadas.
import { migrate } from "./migrate.js";
import { seedContent } from "./lib/seed-content.js";
import { ativarMapas } from "./lib/seed-mapas.js";
import { closePool, one } from "./lib/db.js";

const applied = await migrate();
if (applied.length) console.log("Migrações aplicadas:", applied.join(", "));
await seedContent();
const { ativadas } = await ativarMapas(8);
const t = await one<{ q: number; o: number }>("SELECT (SELECT COUNT(*) FROM questions)::int q, (SELECT COUNT(*) FROM options)::int o");
console.log(`Conteúdo conferido: ${t!.q} questões, ${t!.o} alternativas. Avaliações do 8º ano liberadas: ${ativadas.length ? ativadas.join(", ") : "nenhuma (faltam questões)"}.`);
await closePool();
