// MODO MANUAL (sem chave, sem API): monta os 3 blocos de texto para colar no site da ElevenLabs, a partir de blocos.json.
//   npx tsx tools/nina-voz/gerar.ts
// Saída: blocos/nina-bloco-N.txt (colar), PARA-GERAR.md (instruções + mapa bloco/posição → id → legenda).
// Confere que os blocos cobrem EXATAMENTE as falas ativas sem áudio do catálogo (nenhuma sobra, nenhuma faltando).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.dirname(fileURLToPath(import.meta.url));
const web = path.join(raiz, "..", "..", "apps", "web");
const catalogo = JSON.parse(fs.readFileSync(path.join(web, "src", "data", "nina", "falas.json"), "utf8")).falas as { id: string; tela: string; texto: string; inativa?: boolean }[];
const manifesto = JSON.parse(fs.readFileSync(path.join(web, "public", "guia", "nina", "audio", "manifest.json"), "utf8"));
const cfg = JSON.parse(fs.readFileSync(path.join(raiz, "blocos.json"), "utf8")) as { pausa: string; config: string; blocos: { arquivo: string; titulo: string; falas: { id: string; falado: string }[] }[] };

const pendentes = catalogo.filter((f) => !f.inativa && !manifesto.falas[f.id]).map((f) => f.id).sort();
// só entram nos arquivos as falas que AINDA não têm áudio
cfg.blocos = cfg.blocos.map((b) => ({ ...b, falas: b.falas.filter((f) => !manifesto.falas[f.id]) })).filter((b) => b.falas.length > 0);
const nosBlocos = cfg.blocos.flatMap((b) => b.falas.map((f) => f.id));
const sobram = nosBlocos.filter((i) => !catalogo.some((c) => c.id === i));
const faltam = pendentes.filter((i) => !nosBlocos.includes(i));
const repetidas = nosBlocos.filter((i, k) => nosBlocos.indexOf(i) !== k);
if (sobram.length || faltam.length || repetidas.length) { console.error("blocos.json inconsistente:", { idsInexistentes: sobram, faltamNosBlocos: faltam, repetidas }); process.exit(1); }
for (const b of cfg.blocos) if (b.falas.length > 10) { console.error(`${b.arquivo}: mais de 10 falas`); process.exit(1); }

const PAUSA = ` <break time="${cfg.pausa}" />`;
fs.mkdirSync(path.join(raiz, "blocos"), { recursive: true });
for (const velho of fs.readdirSync(path.join(raiz, "blocos"))) fs.rmSync(path.join(raiz, "blocos", velho)); // só ficam os blocos pendentes
fs.mkdirSync(path.join(raiz, "origem", "geradas"), { recursive: true });
for (const f of fs.readdirSync(raiz)) if (/^PARA-GERAR-(UNICO|PARTE)/.test(f)) fs.rmSync(path.join(raiz, f));
fs.rmSync(path.join(raiz, "ordem-geracao.json"), { force: true });

let md = `# Falas para gerar na ElevenLabs — 3 blocos (modo manual)\n\nGerado por \`npx tsx tools/nina-voz/gerar.ts\` a partir de \`blocos.json\`. O site **não** chama a ElevenLabs.\n\n## Configuração\n${cfg.config}\n\n## Como fazer\n1. Para cada bloco, copie **todo** o arquivo \`blocos/nina-bloco-N.txt\` e gere **um** áudio.\n2. Salve em \`tools/nina-voz/origem/geradas/\` com o nome **\`nina-bloco-N.mp3\`**.\n3. Ouça. Se alguma frase sair estranha, gere **só aquele bloco** de novo.\n4. Rode \`tools/nina-voz/.venv/Scripts/python tools/nina-voz/cortar-blocos.py --conferir\` (ou me avise): corta nas pausas de ${cfg.pausa}, confere o que a voz falou e gera um MP3 por fala.\n\nSe a voz **ler em voz alta** a marca \`<break ... />\`, me avise.\n`;
let total = 0;
for (const [i, b] of cfg.blocos.entries()) {
  const texto = b.falas.map((f, k) => f.falado + (k < b.falas.length - 1 ? PAUSA : "")).join("\n");
  fs.writeFileSync(path.join(raiz, "blocos", b.arquivo.replace(/.mp3$/, ".txt")), texto + "\n");
  total += b.falas.reduce((s, f) => s + f.falado.length, 0);
  md += `\n## Bloco ${i + 1} — ${b.titulo} → \`${b.arquivo}\` (${b.falas.length} falas, ${b.falas.reduce((s, f) => s + f.falado.length, 0)} caracteres)\n\n| posição | id (arquivo final) | texto falado | legenda no site |\n|---|---|---|---|\n`;
  b.falas.forEach((f, k) => { md += `| ${k + 1} | ${f.id} | ${f.falado} | ${catalogo.find((c) => c.id === f.id)!.texto.replace(/\*\*/g, "")} |\n`; });
}
md += `\nTotal: ${nosBlocos.length} falas, ${total} caracteres (plano gratuito ≈ 10.000 créditos/mês).\n`;
fs.writeFileSync(path.join(raiz, "PARA-GERAR.md"), md);
console.log(`${nosBlocos.length} falas em ${cfg.blocos.length} blocos, ${total} caracteres -> tools/nina-voz/blocos/ e PARA-GERAR.md`);
