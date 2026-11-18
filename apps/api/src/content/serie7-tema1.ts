// 7º ano — Tema 1 (RASCUNHO para revisão do professor). Fonte: aulas 1 e 2 do 4º bimestre (Educação Financeira, SEDUC-SP).
//   Aula 1 · Introdução à renda – Parte 1 (renda formal x informal; histograma)
//   Aula 2 · Introdução à renda – Parte 2 (leitura de gráficos de renda)
// Todos os números abaixo são os dos próprios slides ou dados fictícios coerentes com eles.
import type { Bloom, Kind, OpcaoC, QuestaoC } from "./culminancia.js";
import type { TemaSerie } from "../lib/serie.js";

const TCT = "Tema transversal: Educação Financeira";
const AULA1 = "EF06MA32 (habilidade indicada na aula 1); " + TCT;
const AULA2 = "EF07GE08 (habilidade indicada na aula 2); " + TCT;

const ch = (points: number[], texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: points[i], why: whys[i] }));
const mu = (correct: string, texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: 0, why: whys[i], correct: correct.includes("ABCD"[i]) }));
const or = (texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: 0, why: whys[i], seq: i + 1 }));
const q = (number: number, kind: Kind, bloom: Bloom, rest: Omit<QuestaoC, "code" | "number" | "kind" | "bloom" | "max">): QuestaoC =>
  ({ code: `S7-1-${number}`, number, kind, bloom, max: 30, ...rest });

export const TEMA_7_1: TemaSerie = {
  slug: "s7-tema-1", serie: 7, rascunho: true,
  title: "Renda e Trabalho", subtitle: "Quem trabalha, quanto ganha e o que os dados mostram",
  topics: ["Renda formal e informal", "Leitura de gráficos de renda", "Planejar com renda variável"],
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
      source: "Aula 1", title: "Fontes de renda da comunidade", theme: "Reconhecer renda informal", scene: "bag",
      scenario: "Quatro pessoas da mesma comunidade contam como ganham dinheiro.",
      prompt: "Selecione TODAS as situações que são exemplos de renda informal.", hint: "Renda informal: sem registro e sem garantia de direitos trabalhistas.",
      rubric: "Conjunto correto A e C; pontuação proporcional, sem crédito se marcar tudo", strength: "reconhecimento de exemplos de renda informal", retake: "exemplos de renda formal e informal", bncc: AULA1,
      options: mu("AC",
        ["Venda autônoma de salgados na porta da escola.", "Salário com carteira assinada de vendedor contratado em uma loja.", "Trabalhos temporários, os “bicos”, sem registro.", "Jovem aprendiz com contrato e direitos trabalhistas."],
        ["É uma venda autônoma, sem registro: renda informal.", "Tem carteira assinada e direitos: renda formal.", "Trabalho temporário sem registro: renda informal.", "Tem contrato e direitos trabalhistas: renda formal."]),
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
      source: "Aula 2", title: "O rendimento do Distrito Federal", theme: "Avaliar uma afirmação sobre a média", scene: "ad",
      scenario: "Um gráfico mostra o rendimento médio: Distrito Federal R$ 5.037, Brasil R$ 3.208 e Maranhão R$ 2.051. Um colega afirma: “Todo morador do DF ganha R$ 5.037”.",
      prompt: "Qual avaliação dessa afirmação é mais adequada?", hint: "Uma média mostra como a renda está dividida entre as pessoas?",
      rubric: "Escala: integral 30; adequada parcial 20; incipiente 10; inadequada 0", strength: "avaliação crítica de afirmações sobre o rendimento médio", retake: "limites da média: ela não mostra a distribuição da renda", bncc: AULA2,
      options: ch([0, 10, 30, 0],
        ["Correta: se a média do DF é R$ 5.037, cada morador recebe esse valor.", "Incorreta, porque o maior rendimento do gráfico é o do Maranhão.", "Incorreta: é um valor médio. Há moradores que ganham menos e outros que ganham mais; a média não mostra como a renda se distribui.", "Correta, pois o DF tem a maior média e a diferença para o Maranhão é de R$ 2.986."],
        ["Trata a média como o valor que cada pessoa recebe.", "Rejeita a afirmação, mas por um motivo errado: o maior rendimento do gráfico é o do DF.", "Reconhece que a média não revela a distribuição da renda entre as pessoas.", "A diferença (R$ 5.037 − R$ 2.051 = R$ 2.986) está certa, mas isso não prova que todos ganham a mesma coisa."]),
    }),
    q(8, "choice", "Criar", {
      source: "Aulas 1–2", title: "Renda que varia", theme: "Planejar com renda variável", scene: "envelopes",
      scenario: "Marina vende doces por encomenda. Em alguns meses ganha R$ 1.200,00 e em outros, R$ 600,00. Ela quer organizar o dinheiro sem se apertar nos meses mais fracos.",
      prompt: "Escolha o plano que melhor lida com uma renda que varia.",
      rubric: "Avaliar plano por 4 critérios: registro das entradas, gastos essenciais primeiro, reserva nos meses melhores e realismo", strength: "planejamento com renda variável", retake: "como organizar o dinheiro quando a renda muda de mês para mês", bncc: AULA1,
      options: ch([0, 10, 30, 20],
        ["Gastar tudo nos meses bons, porque nos meses ruins ela dá um jeito.", "Basear os gastos sempre no mês de R$ 1.200,00, porque é o valor mais alto.", "Anotar o que entra e sai, pagar primeiro os gastos essenciais e guardar parte do dinheiro dos meses melhores para os meses mais fracos.", "Anotar o que entra, mas sem guardar nada para os meses mais fracos."],
        ["A renda informal é variável e sem estabilidade: gastar tudo deixa os meses ruins sem cobertura.", "Planejar pelo mês mais alto faltará dinheiro nos meses de R$ 600,00.", "Combina registro, prioridade ao essencial e reserva para os meses de renda menor.", "Registrar ajuda, mas sem uma reserva os meses de renda baixa continuam sem cobertura."]),
    }),
  ],
};
