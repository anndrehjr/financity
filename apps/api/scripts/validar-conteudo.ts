// Validador do conteúdo dos Mapas 2–4 (rascunho). Uso: npx tsx scripts/validar-conteudo.ts
// Erros estruturais encerram com código 1. Avisos de viés (tamanho, palavras-pista) são só informativos.
import { MAPA2 } from "../src/content/mapa2.js";
import { MAPA3 } from "../src/content/mapa3.js";
import { MAPA4 } from "../src/content/mapa4.js";
import type { Bloom, MapaConteudo } from "../src/content/tipos.js";

const ORDEM: Bloom[] = ["Compreender", "Aplicar", "Analisar", "Avaliar", "Criar"];
const erros: string[] = [], avisos: string[] = [];
const palavras = (s: string) => s.trim().split(/\s+/).length;

let melhorMaisLonga = 0, total = 0, somaRazao = 0;
const semPorPontos: Record<number, number> = { 0: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
const todasOpcoes = new Set<string>();

for (const m of [MAPA2, MAPA3, MAPA4] as MapaConteudo[]) {
  if (m.questions.length !== 5) erros.push(`${m.slug}: precisa de 5 questões (tem ${m.questions.length})`);
  m.questions.forEach((q, i) => {
    const id = `${m.slug} Q${q.number}`;
    if (q.number !== i + 1) erros.push(`${id}: numeração fora de ordem`);
    if (q.bloom !== ORDEM[i]) erros.push(`${id}: esperado nível ${ORDEM[i]}, está ${q.bloom}`);
    for (const k of ["title", "theme", "scene", "scenario", "dialog", "prompt", "note", "strength", "retake", "bncc"] as const)
      if (!String(q[k] || "").trim()) erros.push(`${id}: campo "${k}" vazio`);
    if (q.options.length !== 5) { erros.push(`${id}: precisa de 5 alternativas`); return; }
    const pts = q.options.map((o) => o.points).sort().join(",");
    if (pts !== "0,2,3,4,5") erros.push(`${id}: pontuações devem ser 0,2,3,4,5 (estão ${pts})`);
    for (const o of q.options) {
      if (!o.why.trim()) erros.push(`${id}: alternativa sem justificativa`);
      if (todasOpcoes.has(o.text)) erros.push(`${id}: alternativa repetida`);
      todasOpcoes.add(o.text);
      if (/\bsem\b/i.test(o.text)) semPorPontos[o.points]++;
    }
    const len = q.options.map((o) => palavras(o.text));
    const best = q.options.find((o) => o.points === 5)!;
    const maxLen = Math.max(...len), minLen = Math.min(...len);
    const razao = maxLen / minLen; somaRazao += razao;
    const maisLonga = palavras(best.text) === maxLen;
    total++; if (maisLonga) melhorMaisLonga++;
    if (razao > 1.4) avisos.push(`${id}: alternativas muito desiguais em tamanho (${minLen}–${maxLen} palavras)`);
    if (palavras(best.text) >= maxLen && razao > 1.15) avisos.push(`${id}: a melhor alternativa é a mais longa (${maxLen} palavras; a menor tem ${minLen})`);
  });
}

console.log(`Questões: ${total}`);
console.log(`Melhor alternativa é a mais longa em ${melhorMaisLonga}/${total} questões (o ideal é perto de 1/5 ≈ ${(total / 5).toFixed(1)}).`);
console.log(`Razão média maior/menor alternativa (em palavras): ${(somaRazao / total).toFixed(2)}`);
console.log(`Alternativas com a palavra "sem", por pontuação: ${JSON.stringify(semPorPontos)}`);
console.log(`Acerto esperado por chute com a escala 0/2/3/4/5: ${((0 + 2 + 3 + 4 + 5) / 5 / 5 * 100).toFixed(0)}% da pontuação máxima`);
if (avisos.length) { console.log("\nAvisos:"); avisos.forEach((a) => console.log("  ⚠", a)); }
if (erros.length) { console.log("\nERROS:"); erros.forEach((e) => console.log("  ✘", e)); process.exit(1); }
console.log("\nEstrutura OK.");
