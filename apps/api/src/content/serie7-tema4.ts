// 7º ano — Tema 4 (APROVADO pelo professor em 2026-11-18; só vai ao banco com `serie-cli publicar`). Fonte: aulas 10, 11 e 12 do 4º bimestre (Educação Financeira, SEDUC-SP).
//   Aula 10 · Porcentagem no dia a dia – Parte 4: metas e gráficos (metas, orçamento, "Pizza financeira")
//   Aula 11 · Construindo gráficos financeiros – Parte 1 (gráfico de setores na mídia, tabela de hábitos financeiros)
//   Aula 12 · Construindo gráficos financeiros – Parte 2 (cuidados ao ler gráficos, POF/IBGE)
// Todos os números abaixo são os dos próprios slides ou dados fictícios coerentes com eles.
import type { Bloom, Kind, OpcaoC, QuestaoC } from "./culminancia.js";
import type { TemaSerie } from "../lib/serie.js";

const TCT = "Tema transversal: Educação Financeira";
const A10 = "EF07MA02 (habilidade indicada na aula 10); " + TCT;
const A1112 = "EF07MA37 (habilidade indicada nas aulas 11 e 12); " + TCT;

const ch = (points: number[], texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: points[i], why: whys[i] }));
const mu = (correct: string, texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: 0, why: whys[i], correct: correct.includes("ABCD"[i]) }));
const or = (texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: 0, why: whys[i], seq: i + 1 }));
const q = (number: number, kind: Kind, bloom: Bloom, rest: Omit<QuestaoC, "code" | "number" | "kind" | "bloom" | "max">): QuestaoC =>
  ({ code: `S7-4-${number}`, number, kind, bloom, max: 30, ...rest });

export const TEMA_7_4: TemaSerie = {
  slug: "s7-tema-4", serie: 7, rascunho: false,
  title: "Metas e Gráficos Financeiros", subtitle: "Planejar o dinheiro e entender o que os dados mostram",
  topics: ["Metas e planejamento financeiro", "Gráfico de setores e porcentagem", "Cuidados ao ler tabelas e gráficos"],
  questions: [
    q(1, "choice", "Lembrar", {
      source: "Aula 10", title: "O fone novo", theme: "Metas financeiras", scene: "goal",
      scenario: "Davi quer comprar um fone novo e precisa transformar esse desejo em uma meta financeira.",
      prompt: "Qual é uma meta bem formulada (clara, possível e com prazo definido)?", hint: "Uma boa meta tem valor, prazo e cabe na renda.",
      rubric: "Reconhecer meta clara, possível e com prazo", strength: "reconhecimento de uma meta financeira bem formulada", retake: "como formular metas (claras, possíveis e com prazo)", bncc: A10,
      options: ch([0, 0, 10, 30],
        ["Juntar muito dinheiro algum dia.", "Comprar um fone novo.", "Guardar R$ 500,00 por mês, mesmo recebendo só R$ 100,00 de mesada.", "Juntar R$ 50,00 por mês para comprar o fone em 3 meses."],
        ["Não tem valor nem prazo definido.", "Diz o objetivo, mas não diz quanto guardar nem em quanto tempo.", "Tem valor e prazo mensal, mas não é possível: passa do que ele recebe.", "É clara, possível e tem prazo: R$ 50,00 por mês durante 3 meses."]),
    }),
    q(2, "choice", "Compreender", {
      source: "Aula 12", title: "Como as famílias gastam", theme: "Ler um gráfico de setores", scene: "trend",
      scenario: "Na Pesquisa de Orçamentos Familiares (IBGE, 2024), os gastos aparecem assim: Habitação 30%, Transporte 20%, Alimentação 15%, Saúde 10%, Educação 5% e Outros gastos 20%. Em um círculo dividido em setores, cada setor corresponde a 5% do total.",
      prompt: "Quantos setores terá a categoria Habitação (30%)?",
      rubric: "Relacionar porcentagem e número de setores (30 ÷ 5)", strength: "relação entre porcentagens e setores de um gráfico", retake: "como as porcentagens são representadas em um gráfico de setores", bncc: A1112,
      options: ch([0, 30, 0, 0],
        ["3 setores.", "6 setores.", "4 setores.", "30 setores."],
        ["3 setores correspondem a 15%, a fatia da Alimentação.", "30% ÷ 5% = 6 setores.", "4 setores correspondem a 20%, a fatia do Transporte.", "Cada setor vale 5%, então não são necessários 30."]),
    }),
    q(3, "multi", "Aplicar", {
      source: "Aula 10", title: "Planejamento eficiente", theme: "Ações de planejamento financeiro", scene: "plan",
      scenario: "Uma aluna quer organizar melhor o dinheiro e lista algumas ações.",
      prompt: "Selecione TODAS as ações que fazem parte de um planejamento financeiro eficiente.", hint: "Uma das ações pode aumentar o risco de gastar mais do que se pode.",
      rubric: "Conjunto correto A, B e C; pontuação proporcional, sem crédito se marcar tudo", strength: "reconhecimento de ações de planejamento financeiro", retake: "o que é um planejamento financeiro eficiente", bncc: A10,
      options: mu("ABC",
        ["Reservar um tempo para revisar os gastos.", "Registrar e organizar as despesas.", "Definir metas de curto, médio ou longo prazo.", "Contratar cartões de crédito só para aumentar o limite."],
        ["Revisar os gastos permite ajustar o orçamento.", "Registrar as despesas mostra para onde vai o dinheiro.", "Metas dão direção ao planejamento.", "Aumentar o limite não organiza o dinheiro e pode estimular gastos além da renda."]),
    }),
    q(4, "choice", "Analisar", {
      source: "Aula 10", title: "Onde ajustar o orçamento?", theme: "Orçamento e gráfico de setores", scene: "cash",
      scenario: "Com renda de R$ 400,00, um orçamento prevê: Alimentação R$ 160 (40%), Transporte R$ 100 (25%), Lazer R$ 80 (20%) e Poupança R$ 60 (15%). A pessoa quer guardar R$ 20,00 a mais por mês, sem prejudicar o essencial.",
      prompt: "Qual ajuste é mais adequado?", hint: "Quais gastos são essenciais e quais podem ser ajustados?",
      rubric: "Analisar o orçamento e ajustar gastos variáveis preservando o essencial", strength: "análise do orçamento para ajustar gastos", retake: "diferença entre gastos essenciais e variáveis ao ajustar o orçamento", bncc: A10,
      options: ch([0, 30, 10, 0],
        ["Reduzir a Alimentação, que é a maior fatia do orçamento.", "Reduzir o Lazer de R$ 80 para R$ 60 e passar R$ 20 para a Poupança, que irá a R$ 80 (20% da renda).", "Reduzir o Transporte, por ser a segunda maior fatia.", "Não é possível guardar mais, porque a Poupança já é de 15%."],
        ["A alimentação é um gasto essencial; cortá-la prejudica o necessário.", "Ajusta um gasto variável, preserva o essencial e aumenta a poupança para 20% (80 ÷ 400).", "O transporte costuma ser essencial; cortá-lo pode comprometer o dia a dia.", "Dá para aumentar a poupança ajustando outras categorias do orçamento."]),
    }),
    q(5, "order", "Aplicar", {
      source: "Aulas 10 e 12", title: "A pizza financeira", theme: "Construir um gráfico de setores", scene: "pact",
      scenario: "Uma dupla vai construir um gráfico de setores com uma renda fictícia de R$ 500,00 dividida em Alimentação, Transporte, Lazer e Poupança.",
      prompt: "Coloque as etapas na ordem correta.", hint: "Os valores vêm antes das porcentagens, e as porcentagens antes do desenho.",
      rubric: "Ordem exata 100%; 2 relações corretas 65%; 1 relação 30%; nenhuma 0%", strength: "construção de um gráfico de setores passo a passo", retake: "etapas para construir um gráfico de setores", bncc: A10,
      options: or(
        ["Distribuir os R$ 500,00 entre as categorias e anotar numa tabela.", "Calcular quanto cada valor representa da renda total (R$ 500 = 100%).", "Desenhar o círculo e dividi-lo em setores proporcionais às porcentagens.", "Colocar título, legenda e fonte no gráfico."],
        ["Primeiro é preciso decidir os valores de cada categoria.", "As porcentagens são calculadas a partir dos valores e do total.", "Os setores são proporcionais às porcentagens calculadas.", "Título, legenda e fonte tornam o gráfico claro e confiável."]),
    }),
    q(6, "choice", "Analisar", {
      source: "Aula 11", title: "O mercado de trabalho em um gráfico", theme: "Interpretar um gráfico de setores", scene: "message",
      scenario: "Um gráfico de setores da PNAD Contínua (IBGE, 1º trimestre de 2026) mostra: Ocupados 48%, Desocupados 3%, Fora da força de trabalho 31% e Abaixo da idade de trabalhar 18%.",
      prompt: "Qual afirmação sobre o gráfico é verdadeira?",
      rubric: "Interpretar um gráfico de setores identificando o maior setor", strength: "leitura de um gráfico de setores divulgado pela mídia", retake: "leitura de gráficos de setores (maior setor, soma 100%)", bncc: A1112,
      options: ch([0, 30, 10, 0],
        ["O maior percentual está entre as pessoas fora da força de trabalho.", "O setor com maior percentual é o dos ocupados (48%).", "Os desocupados não aparecem em nenhum setor.", "Abaixo da idade de trabalhar corresponde à metade da pesquisa."],
        ["Fora da força de trabalho tem 31%, menos que os 48% dos ocupados.", "48% é o maior valor do gráfico, então o setor dos ocupados é o maior.", "Os desocupados aparecem, com 3% (o menor setor).", "Abaixo da idade de trabalhar tem 18%, bem menos que a metade."]),
    }),
    q(7, "choice", "Avaliar", {
      source: "Aula 12", title: "O gráfico sem fonte", theme: "Cuidados com tabelas e gráficos", scene: "ad",
      scenario: "Um colega compartilha um gráfico de setores sem título, sem legenda e sem fonte, afirmando: “70% dos jovens não guardam dinheiro”.",
      prompt: "Qual avaliação é mais adequada?",
      rubric: "Escala: integral 30; adequada parcial 20; incipiente 10; inadequada 0", strength: "avaliação crítica da confiabilidade de um gráfico", retake: "o que verificar em um gráfico: título, legenda, fonte e confiabilidade", bncc: A1112,
      options: ch([0, 30, 10, 20],
        ["Acreditar, porque tem porcentagem e parece científico.", "Verificar o título, a legenda e a fonte e se ela é confiável; sem isso, não dá para confiar na informação.", "Olhar só o título e aceitar, porque a fonte não importa.", "Pesquisar a fonte, mas ignorar o título e a legenda."],
        ["Uma porcentagem sozinha não prova que a informação é verdadeira.", "Combina título, legenda e fonte, os pontos indicados para analisar tabelas e gráficos.", "A fonte é essencial para saber se os dados são confiáveis.", "Conferir a fonte ajuda, mas título e legenda também são necessários para entender os dados."]),
    }),
    q(8, "choice", "Criar", {
      source: "Aulas 10–12", title: "A pizza da turma", theme: "Plano de orçamento com gráfico", scene: "party",
      scenario: "A dupla vai montar o orçamento fictício de R$ 500,00 e representá-lo em um gráfico de setores com 4 categorias.",
      prompt: "Escolha a proposta com mais evidências de planejamento financeiro.",
      rubric: "Avaliar proposta por 4 critérios: soma igual à renda, porcentagens, poupança com meta e gráfico com título, legenda e fonte", strength: "elaboração de um orçamento com gráfico de setores", retake: "montar um orçamento e representá-lo em um gráfico de setores", bncc: A10,
      options: ch([0, 30, 10, 20],
        ["Gastar R$ 300,00 com Lazer e deixar a Poupança para depois.", "Distribuir os R$ 500,00 entre as 4 categorias, calcular as porcentagens, definir uma meta de poupança e desenhar o gráfico com título, legenda e fonte.", "Dividir os valores sem calcular as porcentagens, porque o gráfico não precisa delas.", "Distribuir e calcular as porcentagens, mas sem reservar nada para a Poupança."],
        ["Concentra a renda no lazer e adia a poupança, sem planejamento.", "Combina soma correta, porcentagens, meta de poupança e um gráfico completo.", "Sem as porcentagens, não é possível dividir os setores proporcionalmente.", "Calcula as porcentagens, mas deixa de fora a poupança e a meta."]),
    }),
  ],
};
