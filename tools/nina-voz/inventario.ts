// Inventário de TODAS as falas da Nina: gera o catálogo único (apps/web/src/data/nina/falas.json) e tools/nina-voz/INVENTARIO.md.
//   npx tsx tools/nina-voz/inventario.ts
// Fontes varridas: config/falas-nina.json (momentos), tutorial/registro.ts (etapas e reações) e a frase de plano B do balão (Guia.tsx).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import falas from "../../apps/web/src/features/guia/config/falas-nina.json" with { type: "json" };
import { TUTORIAIS } from "../../apps/web/src/features/guia/tutorial/registro";

const raiz = path.dirname(fileURLToPath(import.meta.url));
const web = path.join(raiz, "..", "..", "apps", "web");
const manifesto = JSON.parse(fs.readFileSync(path.join(web, "public", "guia", "nina", "audio", "manifest.json"), "utf8"));

const EMOCAO: Record<string, string> = { feliz: "alegria", pensando: "curiosidade", preocupada: "incentivo", comemorando: "comemoracao" };
const ANIM: Record<string, string> = { feliz: "happy", pensando: "thinking", preocupada: "encouraging", comemorando: "celebrating" };
const TELA: Record<string, string> = {
  sem_temas: "Mapas — série sem temas publicados (\"Seus temas chegam em breve!\")",
  boas_vindas: "Tutorial antigo (INATIVO: o tutorial guiado o substituiu)",
  mapa_1: "Atividade — introdução do tema 1", mapa_2: "Atividade — introdução do tema 2", mapa_3: "Atividade — introdução do tema 3", mapa_4: "Atividade — introdução do tema 4",
  acerto: "Atividade — logo após confirmar (pontuação alta)", parcial: "Atividade — logo após confirmar (pontuação média)", erro: "Atividade — logo após confirmar (pontuação baixa)",
  parado: "Atividade — 30 s sem responder", fase_concluida: "Resultado do tema", vitoria: "Resultado do último tema",
};

type Fala = { id: string; publico: string; tela: string; contexto: string; texto: string; emocao: string; animacao: string; grupo?: string; sorteio?: boolean; inativa?: boolean };
const catalogo: Fala[] = [];
for (const [momento, m] of Object.entries((falas as any).momentos as Record<string, any>))
  m.falas.forEach((f: any, i: number) => catalogo.push({
    id: `${momento}.${i + 1}`, publico: m.publico ?? "geral", tela: TELA[momento] ?? momento, contexto: m.quando ?? momento, texto: f.texto,
    emocao: EMOCAO[f.expressao] ?? "alegria", animacao: ANIM[f.expressao] ?? "happy", grupo: momento, sorteio: m.tipo === "sorteio", inativa: momento === "boas_vindas",
  }));
for (const t of Object.values(TUTORIAIS))
  for (const e of t.etapas) {
    const id = `tutorial.${t.id}.${e.id}`;
    const em = (x?: string) => EMOCAO[x ?? "feliz"] ?? "alegria";
    catalogo.push({ id, publico: "geral", tela: "Tutorial (mapas e atividade)", contexto: `etapa "${e.id}"`, texto: e.texto, emocao: e.estado === "explaining" || e.estado === "pointing" ? "explicacao" : em(e.expressao), animacao: e.estado ?? "explaining" });
    if (e.aoConcluir) catalogo.push({ id: `${id}.ok`, publico: "geral", tela: "Tutorial (mapas e atividade)", contexto: `reação depois da ação (etapa "${e.id}")`, texto: e.aoConcluir.texto, emocao: em(e.aoConcluir.expressao), animacao: e.aoConcluir.estado ?? "happy" });
  }
catalogo.push({ id: "guia.sem-pressa", publico: "geral", tela: "Tutorial — plano B (tempo-limite)", contexto: "aparece se o aluno demora numa etapa que espera uma ação", texto: "Sem pressa! Se quiser, pode continuar sem fazer isso agora.", emocao: "incentivo", animacao: "encouraging" });
const ids = catalogo.map((f) => f.id);
if (new Set(ids).size !== ids.length) throw new Error("IDs duplicados");

fs.mkdirSync(path.join(web, "src", "data", "nina"), { recursive: true });
fs.writeFileSync(path.join(web, "src", "data", "nina", "falas.json"), JSON.stringify({ versao: 1, comentario: "Catálogo único das falas da Nina. Pendente: componentes passarem a buscar por id (após aprovação do inventário).", falas: catalogo }, null, 2) + "\n");

const enviado = (t: string) => t.replace(/\*\*/g, "");
const tem = (id: string) => !!manifesto.falas[id];
const obs = (f: Fala): string => {
  const o: string[] = [];
  if (f.inativa) o.push("**código morto**: nunca é falada hoje; sugiro remover");
  if (f.sorteio) o.push("sorteio: 1 áudio por variação");
  if (/\b\d+\b/.test(f.texto)) o.push("número fixo no texto (4 temas / 8 desafios): vira falso se o nº mudar");
  if (/bem-vindo|preparado|empreendedor\b/.test(f.texto)) o.push("masculino (gravação original)");
  if (!tem(f.id) && f.texto.length > 160) o.push("longa: dividir em ≤2 frases");
  return o.join("; ") || "—";
};
const linhas = catalogo.map((f) => `| ${f.id} | ${f.publico} | ${f.tela} | ${f.texto.replace(/\|/g, "/")} | ${tem(f.id) ? "**sim (original)**" : f.inativa ? "não (inativa)" : "não"} | ${enviado(f.texto).length} | ${obs(f)} |`);
const ativas = catalogo.filter((f) => !f.inativa);
const faltam = ativas.filter((f) => !tem(f.id));
const chars = faltam.reduce((s, f) => s + enviado(f.texto).length, 0);
const charsComInativas = catalogo.filter((f) => !tem(f.id)).reduce((s, f) => s + enviado(f.texto).length, 0);
const md = `# Inventário das falas da Nina

Gerado por \`npx tsx tools/nina-voz/inventario.ts\`. Catálogo único: \`apps/web/src/data/nina/falas.json\`.

## Resumo
- Falas no catálogo: **${catalogo.length}** (ativas: ${ativas.length}; inativas/código morto: ${catalogo.length - ativas.length}).
- Com áudio da gravação original: **${catalogo.filter((f) => tem(f.id)).length}**.
- **Sem áudio (ativas): ${faltam.length}**, somando **${chars} caracteres** a gerar (${charsComInativas} se contar as inativas).
- Plano gratuito da ElevenLabs: ~10.000 créditos/mês (1 crédito ≈ 1 caractere no multilingual v2). ${chars} caracteres cabem com folga; refazer falas ruins gasta créditos de novo.

## Tabela

| id | público | tela | texto | já tem áudio? | caracteres | observação |
|---|---|---|---|---|---|---|
${linhas.join("\n")}
`;
fs.writeFileSync(path.join(raiz, "INVENTARIO.md"), md);
console.log(`${catalogo.length} falas; ${catalogo.filter((f) => tem(f.id)).length} com áudio; ${faltam.length} ativas sem áudio = ${chars} caracteres (${charsComInativas} com inativas)`);
