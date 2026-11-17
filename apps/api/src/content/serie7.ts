// MOLDE do 7º ano: 4 temas vazios (rascunho) com 8 desafios em branco cada. Preencha, rode a validação e só então troque
// `rascunho` para false. Passo a passo em docs/CONTEUDO-7-ANO.md.
//
// Formato dos desafios = o mesmo do 8º ano (content/culminancia.ts):
//   kind "choice"  → 4 alternativas, UMA vale 30 (a correta); as outras valem 20 (quase certa), 10 (parcial) ou 0 (errada)
//   kind "multi"   → marque `correct: true` nas corretas (1 a 3); pontos 0 (a regra calcula)
//   kind "order"   → `seq` 1..4 na ordem correta; as alternativas são as etapas
// Pontos por desafio: 30 em todos (240 por tema). Sugestão: desafio 3 = multisseleção, desafio 5 = ordenação.
import type { Bloom, Kind, OpcaoC, QuestaoC } from "./culminancia.js";
import type { TemaSerie } from "../lib/serie.js";

const PONTOS = [30, 30, 30, 30, 30, 30, 30, 30];
const BLOOM: Bloom[] = ["Lembrar", "Compreender", "Aplicar", "Analisar", "Aplicar", "Analisar", "Avaliar", "Criar"];
const KIND = (n: number): Kind => (n === 3 ? "multi" : n === 5 ? "order" : "choice");

const opcaoVazia = (kind: Kind, i: number): OpcaoC => ({ text: "", points: 0, why: "", ...(kind === "order" ? { seq: i + 1 } : {}) });
const desafioVazio = (n: number): QuestaoC => {
  const kind = KIND(n);
  return {
    code: `S7-${n}`, number: n, kind, bloom: BLOOM[n - 1], max: PONTOS[n - 1], source: "", title: "", theme: "", scene: "plan",
    scenario: "", prompt: "", rubric: "", strength: "", retake: "", bncc: "",
    options: [0, 1, 2, 3].map((i) => opcaoVazia(kind, i)),
  };
};
const temaVazio = (n: number): TemaSerie => ({
  slug: `s7-tema-${n}`, title: "", subtitle: "", topics: [], serie: 7, rascunho: true,
  questions: [1, 2, 3, 4, 5, 6, 7, 8].map(desafioVazio),
});

export const SERIE_7: TemaSerie[] = [1, 2, 3, 4].map(temaVazio);
