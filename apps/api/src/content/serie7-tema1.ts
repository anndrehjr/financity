// 7º ano — Tema 1 (RASCUNHO para revisão do professor). Fonte: aulas 1, 2 e 3 do 4º bimestre (Educação Financeira, SEDUC-SP).
//   Aula 1 · Introdução à renda – Parte 1 (renda formal x informal; histograma)
//   Aula 2 · Introdução à renda – Parte 2 (leitura de gráficos de renda)
//   Aula 3 · Quanto tem na conta? (extrato bancário; gastos essenciais, não essenciais e tarifas)
// Todos os números abaixo são os dos próprios slides ou dados fictícios coerentes com eles.
import type { Bloom, Kind, OpcaoC, QuestaoC } from "./culminancia.js";
import type { TemaSerie } from "../lib/serie.js";

const TCT = "Tema transversal: Educação Financeira";
const AULA1 = "EF06MA32 (habilidade indicada na aula 1); " + TCT;
const AULA2 = "EF07GE08 (habilidade indicada na aula 2); " + TCT;
const AULA3 = "EF07MA12 (habilidade indicada na aula 3); " + TCT;

const ch = (points: number[], texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: points[i], why: whys[i] }));
const mu = (correct: string, texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: 0, why: whys[i], correct: correct.includes("ABCD"[i]) }));
const or = (texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: 0, why: whys[i], seq: i + 1 }));
const q = (number: number, kind: Kind, bloom: Bloom, rest: Omit<QuestaoC, "code" | "number" | "kind" | "bloom" | "max">): QuestaoC =>
  ({ code: `S7-1-${number}`, number, kind, bloom, max: 30, ...rest });

export const TEMA_7_1: TemaSerie = {
  slug: "s7-tema-1", serie: 7, rascunho: true,
  title: "Renda e Dinheiro na Conta", subtitle: "De onde o dinheiro vem e para onde ele vai",
  topics: ["Renda formal e informal", "Leitura de gráficos de renda", "Extrato bancário"],
  questions: [
    q(1, "choice", "Lembrar", {
      source: "Aula 1", title: "O jovem aprendiz", theme: "Renda formal", scene: "goal",
      scenario: "Lucas, de 16 anos, foi contratado como jovem aprendiz: tem carteira assinada, recebe salário, conta com direitos trabalhistas e faz cursos de capacitação.",
      prompt: "Esse trabalho é um exemplo de renda…", hint: "Observe: há registro em carteira e direitos trabalhistas?",
      rubric: "Identificar renda formal (registro, contrato e direitos)", strength: "reconhecimento da renda formal", retake: "diferença entre renda formal e informal", bncc: AULA1,
      options: ch([10, 0, 30, 0],
        ["Informal, porque ele ainda está aprendendo.", "Informal, porque ele é menor de idade.", "Formal, porque tem registro em carteira, salário e direitos trabalhistas.", "Eventual, porque não conta como renda."],
        ["Reconhece que é renda, mas classifica errado: o aprendizado não torna o trabalho informal.", "A idade não define o tipo de renda; o que define é o registro e os direitos.", "Identifica as características da renda formal: registro, contrato e direitos.", "Todo dinheiro recebido pelo trabalho é renda."]),
    }),
    q(2, "choice", "Compreender", {
      source: "Aula 1", title: "Dois jeitos de ganhar dinheiro", theme: "Comparar renda formal e informal", scene: "cash",
      scenario: "Marina vende doces por encomenda, sem registro, e o que ganha muda de mês para mês. O irmão dela tem carteira assinada em uma loja e recebe o mesmo salário todo mês.",
      prompt: "Qual explicação compara corretamente os dois tipos de renda?",
      rubric: "Comparar renda formal (registrada, previsível) e informal (variável, sem garantias)", strength: "comparação entre renda formal e informal", retake: "características da renda formal e da informal", bncc: AULA1,
      options: ch([30, 0, 20, 0],
        ["A renda do irmão é formal: previsível e com direitos. A de Marina é informal: varia e não tem garantias trabalhistas.", "As duas são formais, porque as duas pessoas recebem dinheiro.", "A de Marina é informal e sempre maior que a do irmão, porque ela não paga nada.", "A renda do irmão é informal, porque ele trabalha para outra pessoa."],
        ["Relaciona registro, previsibilidade e direitos ao tipo de renda.", "Receber dinheiro não torna a renda formal; falta registro e direitos.", "Classifica certo, mas afirma que a renda informal é sempre maior: ela é variável e sem estabilidade.", "Trabalhar para outra pessoa com registro é justamente o trabalho formal."]),
    }),
    q(3, "multi", "Aplicar", {
      source: "Aula 3", title: "O extrato da Ana Maria", theme: "Tarifas bancárias", scene: "ledger",
      scenario: "No extrato da conta-corrente de Ana Maria, na última semana de outubro, aparecem: aula de natação (R$ 158,00), manutenção da conta (R$ 28,00), supermercado (R$ 280,00) e transferência TED (R$ 12,50).",
      prompt: "Selecione TODOS os lançamentos que são tarifas (valores cobrados pelo banco por um serviço).",
      hint: "Tarifas são cobradas pelo banco: manutenção, transferências, saques, cartão…",
      rubric: "Conjunto correto B e D; pontuação proporcional, sem crédito se marcar tudo", strength: "identificação de tarifas bancárias no extrato", retake: "diferença entre gastos e tarifas bancárias", bncc: AULA3,
      options: mu("BD",
        ["Aula de natação (R$ 158,00).", "Manutenção da conta (R$ 28,00).", "Supermercado (R$ 280,00).", "Transferência TED (R$ 12,50)."],
        ["É um gasto não essencial pago a um terceiro, não uma cobrança do banco.", "É a tarifa que o banco cobra para manter a conta funcionando.", "É um gasto essencial (alimentação), não uma tarifa.", "É a tarifa cobrada pelo banco pela transferência."]),
    }),
    q(4, "choice", "Analisar", {
      source: "Aula 1", title: "Renda das famílias da comunidade", theme: "Ler um histograma", scene: "trend",
      scenario: "Em uma comunidade fictícia, 30 famílias foram agrupadas por renda mensal: até R$ 1.000 → 5 famílias; de R$ 1.000 a R$ 2.000 → 12; de R$ 2.000 a R$ 3.000 → 9; acima de R$ 3.000 → 4.",
      prompt: "Qual conclusão os dados realmente sustentam?",
      rubric: "Interpretar frequências por classe em tabela/histograma", strength: "leitura de dados agrupados por faixas", retake: "leitura de histograma e tabelas de frequência", bncc: AULA1,
      options: ch([0, 10, 30, 20],
        ["A faixa acima de R$ 3.000 tem mais famílias, porque é a de maior renda.", "Mais da metade das famílias ganha mais de R$ 2.000 por mês.", "A faixa de R$ 1.000 a R$ 2.000 reúne o maior número de famílias (12 de 30).", "A faixa de R$ 1.000 a R$ 2.000 é a mais comum e tem metade das famílias."],
        ["Confunde faixa de maior renda com faixa de maior frequência: ela tem só 4 famílias.", "Acima de R$ 2.000 há 9 + 4 = 13 famílias, menos da metade de 30.", "Lê corretamente a barra mais alta: 12 famílias, a maior frequência.", "Acerta a faixa mais comum, mas 12 de 30 são 40%, não metade."]),
    }),
    q(5, "order", "Aplicar", {
      source: "Aula 2", title: "Lendo um gráfico de renda", theme: "Como ler um gráfico estatístico", scene: "plan",
      scenario: "Você recebe um gráfico sobre o rendimento médio dos trabalhadores e precisa tirar uma conclusão sobre ele.",
      prompt: "Coloque os passos na ordem mais adequada para ler o gráfico.", hint: "Antes de comparar valores, é preciso saber do que o gráfico trata.",
      rubric: "Ordem exata 100%; 2 relações corretas 65%; 1 relação 30%; nenhuma 0%", strength: "método de leitura de gráficos estatísticos", retake: "passos para ler um gráfico (título, fonte, eixos, valores)", bncc: AULA2,
      options: or(
        ["Ler o título e a fonte do gráfico.", "Ver o que cada eixo representa.", "Localizar os valores maior e menor.", "Comparar os valores e escrever uma conclusão."],
        ["Saber o assunto e a origem dos dados vem primeiro.", "Sem entender os eixos, não dá para interpretar as barras ou linhas.", "Encontrar extremos ajuda a perceber as diferenças.", "A conclusão vem por último, apoiada nos dados."]),
    }),
    q(6, "choice", "Analisar", {
      source: "Aula 2", title: "A média subiu. E agora?", theme: "O que o rendimento médio mostra", scene: "message",
      scenario: "Um gráfico mostra que o rendimento médio real dos trabalhadores brasileiros foi de R$ 2.901 em 2022 e chegou a R$ 3.408 em 2025.",
      prompt: "Qual conclusão é mais adequada?", hint: "Uma média diz algo sobre cada pessoa individualmente?",
      rubric: "Calcular a variação e reconhecer o limite da média", strength: "análise crítica de dados de rendimento médio", retake: "o que a média mostra e o que ela esconde", bncc: AULA2,
      options: ch([0, 30, 10, 0],
        ["Cada trabalhador passou a ganhar R$ 507 a mais.", "A média cresceu R$ 507 (3.408 − 2.901), mas isso não garante que todas as pessoas passaram a ganhar melhor.", "A média cresceu R$ 507, então a desigualdade de renda diminuiu.", "O rendimento caiu R$ 507, porque 2.901 é menor que 3.408."],
        ["Trata a média como se fosse o ganho de cada pessoa.", "Calcula a diferença corretamente e percebe que a média não mostra a distribuição.", "Calcula certo, mas a média sozinha não informa se a desigualdade mudou.", "Inverte a comparação: de 2.901 para 3.408 houve aumento."]),
    }),
    q(7, "choice", "Avaliar", {
      source: "Aula 3", title: "Onde economizar?", theme: "Decidir com base no extrato", scene: "envelopes",
      scenario: "Na semana do extrato de Ana Maria, os gastos essenciais foram R$ 2.680 (supermercado R$ 280 e aluguel R$ 2.400), os não essenciais R$ 238 (natação R$ 158 e pizzaria R$ 80) e as tarifas R$ 40,50 (manutenção R$ 28 e TED R$ 12,50). Ela quer economizar R$ 100 na semana seguinte.",
      prompt: "Qual decisão é melhor fundamentada no extrato?",
      rubric: "Escala: integral 30; adequada parcial 20; incipiente 10; inadequada 0", strength: "decisão financeira fundamentada nos dados do extrato", retake: "separar gastos essenciais, não essenciais e tarifas para decidir", bncc: AULA3,
      options: ch([0, 30, 20, 10],
        ["Cortar o aluguel, por ser o maior valor do extrato.", "Reduzir gastos não essenciais (R$ 238 na semana), manter aluguel e mercado e perguntar ao banco por um pacote com tarifas menores.", "Reduzir só os gastos não essenciais e ignorar as tarifas, por serem pequenas.", "Parar de consultar o extrato para não se preocupar com os números."],
        ["O aluguel é um gasto essencial; cortá-lo não é uma opção viável.", "Protege o essencial, usa os gastos que podem ser reduzidos e ainda busca reduzir tarifas, que podem ser renegociadas.", "A decisão é válida, mas deixa de lado as tarifas, que também podem ser reduzidas.", "Sem consultar o extrato, não há como planejar nem identificar onde economizar."]),
    }),
    q(8, "choice", "Criar", {
      source: "Aula 3", title: "Acompanhar o dinheiro da conta", theme: "Rotina de controle com o extrato", scene: "plan",
      scenario: "Uma família quer acompanhar melhor o dinheiro que entra e sai da conta durante o mês e evitar surpresas.",
      prompt: "Escolha o plano que usa o extrato com mais critério.",
      rubric: "Avaliar plano por 4 critérios: periodicidade, entradas e saídas, classificação dos gastos e saldo disponível", strength: "rotina de acompanhamento financeiro com o extrato", retake: "uso do extrato para acompanhar entradas, saídas e saldo", bncc: AULA3,
      options: ch([0, 30, 10, 20],
        ["Olhar o extrato só no fim do ano.", "Consultar o extrato toda semana, conferir entradas (C) e saídas (D), separar gastos essenciais, não essenciais e tarifas e comparar com o saldo disponível antes de novas compras.", "Olhar apenas o saldo atual e gastar tudo o que aparecer, sem conferir o resto.", "Consultar o extrato e anotar só os maiores gastos, ignorando tarifas e pequenas saídas."],
        ["Um controle só no fim do ano não evita surpresas durante o mês.", "Combina periodicidade, leitura de C e D, classificação dos gastos e atenção ao saldo disponível.", "O saldo atual pode incluir valores bloqueados ou pendentes; o disponível é o que pode ser usado.", "Acompanha parte do dinheiro, mas pequenas saídas e tarifas também pesam no mês."]),
    }),
  ],
};
