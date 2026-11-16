// Gera docs/conteudo/mapas-2-4-para-revisao.md a partir dos dados (mesma fonte do sistema). Uso: npx tsx scripts/gerar-revisao.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MAPA2 } from "../src/content/mapa2.js";
import { MAPA3 } from "../src/content/mapa3.js";
import { MAPA4 } from "../src/content/mapa4.js";

const ENCONTRADAS = new Set(["shoe", "trend", "jeans", "ad", "party"]); // ilustrações que já existem em art.tsx
const mapas = [MAPA2, MAPA3, MAPA4];
const novas = new Set<string>();
let md = `# Financity — Mapas 2, 3 e 4 (rascunho para revisão do professor)

> **Status: RASCUNHO. Nada disto está no banco de dados nem visível para os alunos.** Só será ativado depois da sua aprovação.

## Como ler
- Cada mapa tem **5 questões**, com níveis crescentes da taxonomia de Bloom (revisada): 1 Compreender → 2 Aplicar → 3 Analisar → 4 Avaliar → 5 Criar.
- Cada questão tem 5 alternativas com pontuação **0, 2, 3, 4 e 5** (igual ao Mapa 1; máximo de 25 pontos por mapa). Aqui as alternativas aparecem **da maior para a menor pontuação**; **o aluno vê em ordem embaralhada e sem pontos**.
- "Por quê" é o comentário pedagógico de cada alternativa.
- Aritmética conferida automaticamente (\`npx tsx scripts/conferir-contas.ts\`: 12 grupos de contas).

## Observações importantes
1. **Códigos da BNCC**: só a **EF08MA04** (porcentagens, Matemática 8º ano) é citada como habilidade. Para as demais, usei o **tema transversal "Educação Financeira"** e as **competências gerais** (2, 5, 6, 7, 9, 10). Os códigos foram confirmados em reproduções da BNCC (Nova Escola, Profez), não no texto oficial: **confira no site do MEC** antes de usar em documento formal.
2. **Chute**: com a escala 0/2/3/4/5, quem marca ao acaso faz em média 2,8 de 5 (**56%**). Isso é inerente à escala do Mapa 1 e foi mantido por compatibilidade. Se quiser reduzir (ex.: 0/1/2/3/5, média 44%), é uma decisão sua; as pontuações são editáveis no painel.
3. **Tamanho das alternativas**: ajustei para que a alternativa certa **não seja a mais longa** (ela é a mais longa em 4 de 15 questões, perto do esperado ao acaso, 3) e eliminei a palavra "sem" como pista.
4. **Ilustrações**: as cenas novas ainda **não existem** (listadas no fim). Até serem criadas, a tela mostraria a ilustração padrão (a do tênis), que não combina com a questão.
5. **Protagonista**: sempre "Alex" (neutro); Bia e Cléo aparecem no Mapa 3 (questão 3).
6. A questão 4 do Mapa 2 é a **questão-modelo que você aprovou**, com Alex no lugar de "Lia".

`;

for (const [i, m] of mapas.entries()) {
  md += `\n---\n\n## Mapa ${i + 2} — ${m.title}: "${m.subtitle}"\n**Temas:** ${m.topics.join(", ")}\n`;
  for (const q of m.questions) {
    if (!ENCONTRADAS.has(q.scene)) novas.add(q.scene);
    md += `\n### Questão ${q.number} — ${q.title}\n`;
    md += `**Tema:** ${q.theme} · **Bloom:** ${q.bloom} · **BNCC/competências:** ${q.bncc}\n\n`;
    md += `**Cenário:** ${q.scenario}\n\n**Fala de Alex:** "${q.dialog}"\n\n**Pergunta:** ${q.prompt}\n\n`;
    md += `| Pontos | Alternativa | Por quê |\n|---|---|---|\n`;
    for (const o of [...q.options].sort((a, b) => b.points - a.points)) md += `| **${o.points}** | ${o.text.replace(/\|/g, "\\|")} | ${o.why.replace(/\|/g, "\\|")} |\n`;
    md += `\n*O que avalia:* ${q.note}\n\n*Ponto forte (relatório individual):* ${q.strength}.  \n*Retomar (relatório individual):* ${q.retake}.\n`;
  }
}

md += `\n---\n\n## Ilustrações a criar (chave da cena → questão)\n`;
for (const m of mapas) for (const q of m.questions) if (novas.has(q.scene)) md += `- \`${q.scene}\` → Mapa ${mapas.indexOf(m) + 2}, questão ${q.number} (${q.title})\n`;

md += `\n## Lista de conferência para o professor
- [ ] A linguagem está adequada à turma do 8º ano?
- [ ] Os cenários são realistas para a realidade dos alunos (valores, situações)?
- [ ] A ordem de dificuldade (Bloom) faz sentido para a sequência de aulas?
- [ ] As justificativas ("por quê") estão corretas e didáticas?
- [ ] Algum tema precisa ser trocado ou algum valor, ajustado?
- [ ] Confirmo os códigos da BNCC no site do MEC.
`;

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "docs", "conteudo");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "mapas-2-4-para-revisao.md"), md);
console.log("gerado:", path.join(out, "mapas-2-4-para-revisao.md"), `(${md.length} caracteres)`);
