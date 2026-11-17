// MODO MANUAL (sem chave, sem API): gera os arquivos com os textos prontos para colar no site da ElevenLabs.
//   npx tsx tools/nina-voz/gerar.ts
// Saída: tools/nina-voz/PARA-GERAR.md (e PARA-GERAR.csv). Só entram as falas ativas que ainda NÃO têm áudio.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.dirname(fileURLToPath(import.meta.url));
const web = path.join(raiz, "..", "..", "apps", "web");
const catalogo = JSON.parse(fs.readFileSync(path.join(web, "src", "data", "nina", "falas.json"), "utf8")).falas as { id: string; tela: string; contexto: string; texto: string; emocao: string; inativa?: boolean }[];
const manifesto = JSON.parse(fs.readFileSync(path.join(web, "public", "guia", "nina", "audio", "manifest.json"), "utf8"));
const pron = JSON.parse(fs.readFileSync(path.join(raiz, "pronuncia.json"), "utf8")) as { substituicoes: { de: string; para: string }[] };

/** Texto enviado à voz: sem **negrito**, sem emojis, com as correções de pronúncia. A legenda não muda. */
export function prepararTexto(t: string): string {
  let r = t.replace(/\*\*/g, "").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "");
  for (const s of pron.substituicoes) r = r.split(s.de).join(s.para);
  return r.replace(/\s+/g, " ").trim();
}

const faltam = catalogo.filter((f) => !f.inativa && !manifesto.falas[f.id]).map((f) => ({ ...f, envio: prepararTexto(f.texto) }));
const total = faltam.reduce((s, f) => s + f.envio.length, 0);

const CONFIG = `Modelo: **Eleven Multilingual v2** · Voz: **sylphiette** · Velocidade **0,96** · Estabilidade **57** · Similaridade **75** · Exagero de estilo **0** · Speaker boost **ligado**`;
let md = `# Falas para gerar na ElevenLabs (modo manual)

Gerado por \`npx tsx tools/nina-voz/gerar.ts\`. O site **não** chama a ElevenLabs: você gera aqui, baixa os MP3 e salva no seu computador.

## Configuração (igual à gravação original)
${CONFIG}

## Como fazer
1. Abra o *Text to Speech* da ElevenLabs, escolha a voz **sylphiette** e ajuste a configuração acima.
2. Para **cada fala** da lista abaixo: cole o texto da caixa, clique em *Generate*, ouça e baixe o MP3.
3. Salve cada MP3 em \`tools/nina-voz/origem/geradas/\` com o **nome exato do id** (ex.: \`acerto.1.mp3\`).
4. Se não gostar de uma, gere de novo só aquela (gasta créditos de novo).
5. Quando terminar, me avise: eu normalizo o volume, corto o silêncio, gero o manifesto e publico.

## Resumo
- Falas a gerar: **${faltam.length}** · caracteres: **${total}** (plano gratuito ≈ 10.000 créditos/mês, 1 caractere ≈ 1 crédito).
- Já têm áudio (gravação original): ${Object.keys(manifesto.falas).length}.

## Lista (uma fala por bloco)
`;
let ultimo = "";
for (const f of faltam) {
  const grupo = f.tela;
  if (grupo !== ultimo) { md += `\n### ${grupo}\n`; ultimo = grupo; }
  md += `\n**${f.id}** — emoção: ${f.emocao} — ${f.envio.length} caracteres — salvar como \`${f.id}.mp3\`\n\`\`\`text\n${f.envio}\n\`\`\`\n`;
}
fs.writeFileSync(path.join(raiz, "PARA-GERAR.md"), md);
const csv = ["id;arquivo;emocao;caracteres;texto", ...faltam.map((f) => `${f.id};${f.id}.mp3;${f.emocao};${f.envio.length};"${f.envio.replace(/"/g, '""')}"`)].join("\n") + "\n";
fs.writeFileSync(path.join(raiz, "PARA-GERAR.csv"), "﻿" + csv, "utf8");
fs.mkdirSync(path.join(raiz, "origem", "geradas"), { recursive: true });
console.log(`${faltam.length} falas, ${total} caracteres -> tools/nina-voz/PARA-GERAR.md e PARA-GERAR.csv`);
