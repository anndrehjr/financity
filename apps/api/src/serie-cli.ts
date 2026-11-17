// Uso:  node dist/serie-cli.js validar   → confere o conteúdo do 7º ano (não grava nada)
//       node dist/serie-cli.js publicar  → grava no banco os temas prontos (rascunho: false). Tudo-ou-nada; não apaga nem altera nada existente.
// Rode `publicar` só depois de `validar` sem problemas e de um backup do banco.
import { migrate } from "./migrate.js";
import { SERIE_7 } from "./content/serie7.js";
import { closePool } from "./lib/db.js";
import { seedSerie, validarTema } from "./lib/serie.js";

const acao = process.argv[2];
if (acao === "validar") {
  let ruins = 0;
  for (const t of SERIE_7) {
    if (t.rascunho) { console.log(`${t.slug}: rascunho (ignorado)`); continue; }
    const p = validarTema(t);
    console.log(p.length ? `${t.slug}: ${p.length} problema(s)\n - ${p.join("\n - ")}` : `${t.slug}: OK (8 desafios completos)`);
    ruins += p.length;
  }
  process.exit(ruins ? 1 : 0);
} else if (acao === "publicar") {
  const aplicadas = await migrate();
  if (aplicadas.length) console.log("Migrações aplicadas:", aplicadas.join(", "));
  const r = await seedSerie(SERIE_7);
  console.log(`Publicados: ${r.publicados.join(", ") || "nenhum"} · ${r.questoes} questões novas · rascunhos ignorados: ${r.rascunhos.join(", ") || "nenhum"}`);
  await closePool();
} else { console.error("Use: validar | publicar"); process.exit(2); }
