// Lista as falas do site que ainda NÃO têm áudio (para você gravar à mão no site da ElevenLabs) em tools/nina-voz/PARA-GRAVAR.md.
//   npx tsx tools/nina-voz/para-gravar.ts
// O site não chama a ElevenLabs: coloque os MP3 novos em tools/nina-voz/origem/, acrescente-os em falas-originais.json e rode cortar.py.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import falas from "../../apps/web/src/features/guia/config/falas-nina.json" with { type: "json" };
import { TUTORIAIS } from "../../apps/web/src/features/guia/tutorial/registro";

const raiz = path.dirname(fileURLToPath(import.meta.url));
const manifesto = JSON.parse(fs.readFileSync(path.join(raiz, "..", "..", "apps", "web", "public", "guia", "nina", "audio", "manifest.json"), "utf8"));
const tem = (id: string) => !!manifesto.falas[id];
const EMOCAO: Record<string, string> = { feliz: "alegria", pensando: "curiosidade", preocupada: "incentivo", comemorando: "comemoração" };
const semNegrito = (t: string) => t.replace(/\*\*/g, "");

type Linha = { id: string; texto: string; emocao: string; uso: string };
const faltam: Linha[] = [];
for (const [momento, m] of Object.entries((falas as any).momentos as Record<string, any>))
  m.falas.forEach((f: any, i: number) => { const id = `${momento}.${i + 1}`; if (!tem(id)) faltam.push({ id, texto: f.texto, emocao: EMOCAO[f.expressao] ?? "alegria", uso: m.quando ?? momento }); });
for (const t of Object.values(TUTORIAIS))
  for (const e of t.etapas) {
    const id = `tutorial.${t.id}.${e.id}`;
    if (!tem(id)) faltam.push({ id, texto: e.texto, emocao: EMOCAO[e.expressao ?? "feliz"] ?? "alegria", uso: `etapa "${e.id}" do tutorial "${t.titulo}"` });
    if (e.aoConcluir) { const ok = `${id}.ok`; if (!tem(ok)) faltam.push({ id: ok, texto: e.aoConcluir.texto, emocao: EMOCAO[e.aoConcluir.expressao ?? "feliz"] ?? "alegria", uso: `reação após a ação (etapa "${e.id}")` }); }
  }

const md = `# Falas que precisam de áudio (gravar manualmente na ElevenLabs)

O site **não** chama a ElevenLabs e **não** usa outra voz como substituta: enquanto uma fala não tiver áudio, a Nina mostra **só a legenda**.

**Parâmetros da gravação original** (pelo nome do arquivo; **confirmar**): modelo Multilingual v2, velocidade 0,96, estabilidade 57, similaridade 75, exagero de estilo 0, speaker boost ligado, voz "sylphiette".

Como encaixar: gere o áudio no site da ElevenLabs com a mesma voz e parâmetros, salve em \`tools/nina-voz/origem/\`, registre os cortes em \`cortes.json\` e a fala em \`falas-originais.json\`, e rode \`cortar.py\`.

Já têm áudio: ${Object.keys(manifesto.falas).length}. Faltam: ${faltam.length}.

| id | emoção | texto exato (sem ** de negrito) | uso |
|---|---|---|---|
${faltam.map((f) => `| ${f.id} | ${f.emocao} | ${semNegrito(f.texto)} | ${f.uso} |`).join("\n")}
`;
fs.writeFileSync(path.join(raiz, "PARA-GRAVAR.md"), md);
console.log(`${Object.keys(manifesto.falas).length} com áudio; ${faltam.length} para gravar -> tools/nina-voz/PARA-GRAVAR.md`);
