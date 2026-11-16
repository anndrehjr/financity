// Uso: node dist/culminancia-cli.js   (ou npx tsx src/culminancia-cli.ts)
// Aplica migrações, cria as 32 questões da Culminância e arquiva (sem apagar) os mapas antigos do 8º ano. Idempotente.
import { migrate } from "./migrate.js";
import { seedCulminancia } from "./lib/seed-culminancia.js";
import { closePool, one } from "./lib/db.js";

const applied = await migrate();
if (applied.length) console.log("Migrações aplicadas:", applied.join(", "));
const r = await seedCulminancia(8);
const t = await one<{ q: number; o: number; a: number; ar: number }>(
  "SELECT (SELECT COUNT(*) FROM questions)::int q, (SELECT COUNT(*) FROM options)::int o, (SELECT COUNT(*) FROM assessments WHERE status='available')::int a, (SELECT COUNT(*) FROM assessments WHERE status='archived')::int ar");
console.log(`Culminância: ${r.questoes} questões criadas agora. Total no banco: ${t!.q} questões, ${t!.o} alternativas; avaliações ativas: ${t!.a}; arquivadas: ${t!.ar}.`);
await closePool();
