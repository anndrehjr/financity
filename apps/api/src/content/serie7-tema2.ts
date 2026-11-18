// 7º ano — Tema 2 (RASCUNHO para revisão do professor). Fonte: aulas 4, 5 e 6 do 4º bimestre (Educação Financeira, SEDUC-SP).
//   Aula 4 · Chegou a fatura. E agora? (fatura do cartão de crédito, juros, "bola de neve")
//   Aula 5 · Cupom fiscal: para que serve? – Parte 1 (cupom x nota fiscal, impostos, taxa de serviço)
//   Aula 6 · Cupom fiscal: para que serve? – Parte 2 (cobranças adicionais, gorjeta, porcentagem)
// Todos os números abaixo são os dos próprios slides ou dados fictícios coerentes com eles.
import type { Bloom, Kind, OpcaoC, QuestaoC } from "./culminancia.js";
import type { TemaSerie } from "../lib/serie.js";

const TCT = "Tema transversal: Educação Financeira";
const AULA4 = "EF07MA12 (habilidade indicada na aula 4); " + TCT;
const AULA5 = "EF07CI06 (habilidade indicada na aula 5); " + TCT;
const AULA6 = "EF07MA02 (habilidade indicada na aula 6); " + TCT;

const ch = (points: number[], texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: points[i], why: whys[i] }));
const mu = (correct: string, texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: 0, why: whys[i], correct: correct.includes("ABCD"[i]) }));
const or = (texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: 0, why: whys[i], seq: i + 1 }));
const q = (number: number, kind: Kind, bloom: Bloom, rest: Omit<QuestaoC, "code" | "number" | "kind" | "bloom" | "max">): QuestaoC =>
  ({ code: `S7-2-${number}`, number, kind, bloom, max: 30, ...rest });

export const TEMA_7_2: TemaSerie = {
  slug: "s7-tema-2", serie: 7, rascunho: true,
  title: "Fatura, Cupom e Cobranças", subtitle: "Entender o que está escrito antes de pagar",
  topics: ["Fatura do cartão de crédito", "Cupom fiscal e nota fiscal", "Impostos, taxa de serviço e gorjeta"],
  questions: [
    q(1, "choice", "Lembrar", {
      source: "Aula 5", title: "O papelzinho da compra", theme: "Para que serve o cupom fiscal", scene: "bag",
      scenario: "Depois de comprar um lanche na padaria, o caixa pergunta se você quer o cupom fiscal.",
      prompt: "Qual é um bom motivo para pedir e guardar o cupom fiscal?", hint: "O cupom é uma proteção para o consumidor.",
      rubric: "Reconhecer a função do cupom fiscal (comprovar a compra, garantia, troca, controle de impostos)", strength: "reconhecimento da função do cupom fiscal", retake: "para que serve o cupom fiscal", bncc: AULA5,
      options: ch([0, 10, 30, 0],
        ["Evitar filas no caixa.", "Guardar como recordação da compra.", "Comprovar a compra e poder exigir garantia ou troca.", "Ganhar desconto automático."],
        ["O cupom não tem relação com filas.", "Guardar ajuda, mas o objetivo principal é comprovar a compra e ter direitos.", "É a função principal: comprovar a compra e proteger o consumidor.", "O cupom não dá desconto automático."]),
    }),
    q(2, "choice", "Compreender", {
      source: "Aula 5", title: "Cupom ou nota fiscal?", theme: "Diferença entre cupom fiscal e nota fiscal", scene: "packs",
      scenario: "Bruno comprou um lanche na padaria e recebeu um papel com informações simples. A mãe dele comprou um eletrodoméstico pela internet e recebeu um documento com dados do cliente, descrição dos itens, valores, impostos e forma de entrega.",
      prompt: "Qual explicação diferencia corretamente os dois documentos?",
      rubric: "Diferenciar cupom fiscal (compras do dia a dia, informações simples) de nota fiscal (informações detalhadas)", strength: "diferença entre cupom fiscal e nota fiscal", retake: "diferença entre cupom fiscal e nota fiscal", bncc: AULA5,
      options: ch([0, 10, 0, 30],
        ["O cupom é só para compras on-line, e a nota fiscal só para compras no mercado.", "Os dois são idênticos; só mudam de nome.", "A nota fiscal serve só para pagar impostos e não ajuda o consumidor.", "O cupom fiscal costuma ser entregue em compras do dia a dia, com informações mais simples; a nota fiscal registra a venda com informações mais detalhadas."],
        ["Inverte as situações: o cupom é típico do dia a dia, e a nota aparece em compras como as on-line.", "É comum confundir os dois, mas a nota traz informações mais detalhadas que o cupom.", "A nota também comprova a compra, garante trocas e direitos do consumidor.", "Descreve corretamente o tipo de compra e o nível de detalhe de cada documento."]),
    }),
    q(3, "multi", "Aplicar", {
      source: "Aulas 5–6", title: "Impostos, taxa de serviço e gorjeta", theme: "Cobranças além do produto", scene: "ad",
      scenario: "Ao analisar o cupom fiscal de um restaurante, Sofia percebe que ele traz impostos, uma taxa de serviço de 10% e a possibilidade de deixar gorjeta.",
      prompt: "Selecione TODAS as afirmações verdadeiras.",
      hint: "Pense no que é obrigatório e no que é opcional.",
      rubric: "Conjunto correto A e B; pontuação proporcional, sem crédito se marcar tudo", strength: "distinção entre impostos obrigatórios e cobranças opcionais", retake: "diferença entre impostos, taxa de serviço e gorjeta", bncc: AULA5,
      options: mu("AB",
        ["A gorjeta é voluntária: o cliente não é obrigado a pagá-la.", "Os impostos são valores cobrados pelo governo e ajudam a financiar serviços como escolas e hospitais.", "A taxa de serviço é sempre obrigatória e sempre de 10%.", "O cupom fiscal só serve para quem vai pedir troca."],
        ["Correto: a gorjeta é um valor adicional dado de forma voluntária.", "Correto: impostos financiam serviços públicos como educação, saúde e segurança.", "A cobrança de taxa de serviço não é obrigatória, e o índice pode variar (8%, 10%, 12%…).", "O cupom também ajuda no controle de impostos e comprova valores cobrados."]),
    }),
    q(4, "choice", "Analisar", {
      source: "Aula 5", title: "Os impostos da nota", theme: "Impostos dentro do preço", scene: "ledger",
      scenario: "Uma nota fiscal fictícia de um kit de higiene mostra: valor total da compra R$ 42,90; ICMS R$ 5,00; PIS/COFINS R$ 1,80.",
      prompt: "Qual afirmação sobre os impostos dessa nota está correta?", hint: "Os impostos são cobrados à parte ou já estão no preço?",
      rubric: "Interpretar impostos incluídos no preço e calcular o total", strength: "leitura de impostos em uma nota fiscal", retake: "leitura de impostos em cupom e nota fiscal", bncc: AULA5,
      options: ch([0, 10, 30, 0],
        ["Não há impostos, porque o produto é de higiene.", "Os impostos são de R$ 5,00, porque só o ICMS conta.", "Os impostos somam R$ 6,80 (R$ 5,00 + R$ 1,80) e já estão incluídos no valor de R$ 42,90.", "Os impostos são cobrados à parte, e o total a pagar é R$ 49,70."],
        ["Produtos de higiene também têm impostos; a nota mostra ICMS e PIS/COFINS.", "Soma só uma parte: o PIS/COFINS (R$ 1,80) também é imposto.", "Soma os dois impostos corretamente e entende que ficam dentro do preço.", "Os impostos já estão no valor total; somar de novo conta duas vezes."]),
    }),
    q(5, "order", "Aplicar", {
      source: "Aula 4", title: "Lendo a fatura do cartão", theme: "Como ler uma fatura", scene: "plan",
      scenario: "Chegou a fatura do cartão de crédito e você quer conferi-la com atenção antes de pagar.",
      prompt: "Coloque os passos na ordem mais adequada.", hint: "Comece pelo que aparece em destaque na fatura.",
      rubric: "Ordem exata 100%; 2 relações corretas 65%; 1 relação 30%; nenhuma 0%", strength: "método para ler e conferir a fatura do cartão", retake: "partes da fatura do cartão de crédito", bncc: AULA4,
      options: or(
        ["Ver na área de destaque o valor total, o vencimento e o limite.", "Conferir as alternativas de pagamento, com juros e encargos.", "Conferir cada compra, o local e as parcelas.", "Pagar o valor total até a data de vencimento."],
        ["A área de destaque traz as informações principais da fatura.", "Mostra o que acontece se não pagar o total: juros e encargos.", "A conferência detalhada mostra os hábitos de consumo e permite achar erros.", "Pagar o total em dia evita juros e multa."]),
    }),
    q(6, "choice", "Analisar", {
      source: "Aula 4", title: "A fatura que cresceu", theme: "Total da fatura e efeito bola de neve", scene: "install",
      scenario: "Uma fatura mostra compras de R$ 928,00, multa por atraso de R$ 55,12 e saldo anterior não pago de R$ 91,88.",
      prompt: "Qual é o valor total da fatura e o que poderia ter evitado a multa e o saldo anterior?",
      rubric: "Somar compras, multa e saldo anterior; relacionar à quitação da fatura anterior", strength: "cálculo do total da fatura e relação com atrasos", retake: "composição da fatura (compras, multa e saldo anterior)", bncc: AULA4,
      options: ch([10, 0, 20, 30],
        ["R$ 1.075,00; a multa e o saldo não poderiam ser evitados.", "R$ 928,00, porque a multa e o saldo anterior não entram na fatura.", "R$ 1.019,88 (compras mais saldo anterior); pagar a fatura anterior em dia evitaria a multa.", "R$ 1.075,00 (928 + 55,12 + 91,88); pagar a fatura anterior integralmente e no vencimento evitaria a multa e o saldo."],
        ["Soma certo, mas esses valores poderiam ser evitados com o pagamento integral em dia.", "A fatura inclui compras, multas e valores não pagos de meses anteriores.", "Esquece de somar a multa (R$ 55,12), mas percebe que o atraso é evitável.", "Soma todos os valores e liga a multa e o saldo à fatura anterior não paga."]),
    }),
    q(7, "choice", "Avaliar", {
      source: "Aula 6", title: "Qual armário compensa?", theme: "Custo total com cobranças adicionais", scene: "packs",
      scenario: "A loja A vende um armário por R$ 300,00, mas cobra entrega de R$ 45,00 e montagem de 4% do valor do móvel. A loja B vende o mesmo armário por R$ 330,00, com entrega e montagem incluídas.",
      prompt: "Qual escolha é melhor para o orçamento da família?",
      rubric: "Escala: integral 30; adequada parcial 20; incipiente 10; inadequada 0", strength: "comparação do custo total considerando entrega e montagem", retake: "cálculo do custo total com cobranças adicionais e porcentagem", bncc: AULA6,
      options: ch([0, 30, 10, 0],
        ["Loja A, porque o armário custa R$ 300,00 e isso é o que importa.", "Loja B: o custo total é R$ 330,00, contra R$ 357,00 na loja A (300 + 45 + 12).", "Loja A, porque a montagem de 4% (R$ 12,00) é um valor pequeno.", "As duas custam o mesmo, porque a diferença do preço do armário se compensa."],
        ["Olha só o preço do móvel e ignora entrega e montagem.", "Calcula a montagem (4% de 300 = 12) e compara o custo total: R$ 27,00 mais barato na loja B.", "Considera só a montagem e deixa a entrega (R$ 45,00) de fora.", "Os totais são diferentes: R$ 357,00 e R$ 330,00."]),
    }),
    q(8, "choice", "Criar", {
      source: "Aulas 4–6", title: "Fugindo da bola de neve", theme: "Plano para usar o cartão sem acumular dívida", scene: "pact",
      scenario: "Larissa vai começar a usar o cartão de crédito e quer evitar que uma dívida pequena vire uma “bola de neve”.",
      prompt: "Escolha o plano com mais evidências de responsabilidade financeira.",
      rubric: "Avaliar plano por 4 critérios: conferir a fatura, separar gastos, limitar compras ao orçamento e pagar o total em dia", strength: "planejamento do uso do cartão para evitar dívidas", retake: "como evitar juros, multa e efeito bola de neve na fatura", bncc: AULA4,
      options: ch([0, 10, 30, 20],
        ["Pagar só o mínimo todo mês e continuar usando o cartão normalmente.", "Parcelar todas as compras em muitas vezes, para as parcelas ficarem pequenas.", "Conferir a fatura, separar gastos essenciais e não essenciais, limitar as compras ao orçamento e pagar o valor total até o vencimento.", "Pagar a fatura sempre em dia, mas sem conferir os itens cobrados."],
        ["Os valores não pagos geram juros e acumulam, que é justamente o efeito bola de neve.", "Muitas parcelas em aberto podem pesar no orçamento e gerar a bola de neve.", "Combina conferência, planejamento do orçamento e pagamento integral em dia.", "Pagar em dia ajuda, mas sem conferir os itens não se percebe erros nem hábitos de consumo."]),
    }),
  ],
};
