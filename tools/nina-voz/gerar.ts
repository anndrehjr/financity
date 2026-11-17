// MODO MANUAL (sem chave, sem API): gera UM ÚNICO texto com todas as falas que ainda não têm áudio, para colar de uma vez
// no site da ElevenLabs (como na gravação original). Depois as falas são cortadas do áudio longo (ver cortar-geradas).
//   npx tsx tools/nina-voz/gerar.ts
// Saída: PARA-GERAR-UNICO.txt (colar), PARA-GERAR-UNICO-sem-pausas.txt (reserva), PARA-GERAR.md (instruções + ordem) e ordem-geracao.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.dirname(fileURLToPath(import.meta.url));
const web = path.join(raiz, "..", "..", "apps", "web");
const catalogo = JSON.parse(fs.readFileSync(path.join(web, "src", "data", "nina", "falas.json"), "utf8")).falas as { id: string; tela: string; texto: string; emocao: string; inativa?: boolean }[];
const manifesto = JSON.parse(fs.readFileSync(path.join(web, "public", "guia", "nina", "audio", "manifest.json"), "utf8"));
const pron = JSON.parse(fs.readFileSync(path.join(raiz, "pronuncia.json"), "utf8")) as { substituicoes: { de: string; para: string }[] };
const LIMITE = 2500; // caracteres por geração no site

/** Texto enviado à voz: sem **negrito**, sem emojis, com as correções de pronúncia. A legenda não muda. */
export function prepararTexto(t: string): string {
  let r = t.replace(/\*\*/g, "").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "");
  for (const s of pron.substituicoes) r = r.split(s.de).join(s.para);
  return r.replace(/\s+/g, " ").trim();
}

const faltam = catalogo.filter((f) => !f.inativa && !manifesto.falas[f.id]).map((f) => ({ id: f.id, tela: f.tela, emocao: f.emocao, envio: prepararTexto(f.texto) }));
const PAUSA = ' <break time="1.0s" />';
const comPausas = faltam.map((f) => f.envio + PAUSA).join("\n\n");
const semPausas = faltam.map((f) => f.envio).join("\n\n");
const total = faltam.reduce((s, f) => s + f.envio.length, 0);

// divide em blocos de no máximo LIMITE caracteres (sem partir uma fala ao meio)
const blocos: typeof faltam[] = [[]];
for (const f of faltam) {
  const atual = blocos[blocos.length - 1];
  const tam = atual.reduce((s, x) => s + x.envio.length + PAUSA.length + 2, 0) + f.envio.length + PAUSA.length;
  if (tam > LIMITE && atual.length) blocos.push([f]); else atual.push(f);
}
if (blocos.length === 1) {
  fs.writeFileSync(path.join(raiz, "PARA-GERAR-UNICO.txt"), comPausas + "\n");
  fs.writeFileSync(path.join(raiz, "PARA-GERAR-UNICO-sem-pausas.txt"), semPausas + "\n");
}
for (const f of fs.readdirSync(raiz)) if (/^PARA-GERAR-PARTE-/.test(f)) fs.rmSync(path.join(raiz, f));
if (blocos.length > 1) blocos.forEach((b, i) => fs.writeFileSync(path.join(raiz, `PARA-GERAR-PARTE-${i + 1}.txt`), b.map((f) => f.envio + PAUSA).join("\n\n") + "\n"));
fs.writeFileSync(path.join(raiz, "ordem-geracao.json"), JSON.stringify({ blocos: blocos.map((b) => b.map((f) => ({ id: f.id, texto: f.envio, emocao: f.emocao }))) }, null, 2) + "\n");
fs.mkdirSync(path.join(raiz, "origem", "geradas"), { recursive: true });

const arquivos = blocos.length === 1 ? "`PARA-GERAR-UNICO.txt`" : blocos.map((_, i) => `\`PARA-GERAR-PARTE-${i + 1}.txt\``).join(", ");
const md = `# Falas para gerar na ElevenLabs — arquivo único (modo manual)

Gerado por \`npx tsx tools/nina-voz/gerar.ts\`. O site **não** chama a ElevenLabs.

## Configuração (igual à gravação original)
Modelo **Eleven Multilingual v2** · Voz **sylphiette** · Velocidade **0,96** · Estabilidade **57** · Similaridade **75** · Exagero de estilo **0** · Speaker boost **ligado**

## Como fazer (1 geração só)
1. Abra o arquivo ${arquivos} (nesta pasta) e **copie todo o texto**.
2. No *Text to Speech* da ElevenLabs, com a configuração acima, **cole tudo** e clique em *Generate*. (${total} caracteres; o limite por geração é ${LIMITE}.)
3. Ouça. Se a voz **ler em voz alta** as marcas \`<break ... />\`, use o arquivo \`PARA-GERAR-UNICO-sem-pausas.txt\` no lugar.
4. Baixe o MP3 e salve em \`tools/nina-voz/origem/geradas/\` com o nome \`todas.mp3\`${blocos.length > 1 ? " (partes: `todas-1.mp3`, `todas-2.mp3`...)" : ""}.
5. Me avise. Eu transcrevo, corto cada fala no lugar certo, normalizo o volume e mostro uma tabela (fala × trecho) para você aprovar antes de publicar.

## Ordem das falas dentro do áudio (${faltam.length} falas, ${total} caracteres)
| # | id | tela | texto |
|---|---|---|---|
${faltam.map((f, i) => `| ${i + 1} | ${f.id} | ${f.tela} | ${f.envio} |`).join("\n")}
`;
fs.writeFileSync(path.join(raiz, "PARA-GERAR.md"), md);
for (const velho of ["PARA-GERAR.csv"]) fs.rmSync(path.join(raiz, velho), { force: true });
console.log(`${faltam.length} falas, ${total} caracteres, ${blocos.length} bloco(s) -> ${blocos.length === 1 ? "PARA-GERAR-UNICO.txt" : "PARA-GERAR-PARTE-N.txt"}`);
