// 7º ano — Tema 2 (APROVADO pelo professor em 2026-11-18; só vai ao banco com `serie-cli publicar`). Fonte: aulas 3 e 4 do 4º bimestre (Educação Financeira, SEDUC-SP).
//   Aula 3 · Quanto tem na conta? (extrato bancário; gastos essenciais, não essenciais e tarifas)
//   Aula 4 · Chegou a fatura. E agora? (fatura do cartão de crédito, juros, "bola de neve")
// Todos os números abaixo são os dos próprios slides ou dados fictícios coerentes com eles.
import type { Bloom, Kind, OpcaoC, QuestaoC } from "./culminancia.js";
import type { TemaSerie } from "../lib/serie.js";

const TCT = "Tema transversal: Educação Financeira";
const AULA3 = "EF07MA12 (habilidade indicada na aula 3); " + TCT;
const AULA4 = "EF07MA12 (habilidade indicada na aula 4); " + TCT;

const ch = (points: number[], texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: points[i], why: whys[i] }));
const mu = (correct: string, texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: 0, why: whys[i], correct: correct.includes("ABCD"[i]) }));
const or = (texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: 0, why: whys[i], seq: i + 1 }));
const q = (number: number, kind: Kind, bloom: Bloom, rest: Omit<QuestaoC, "code" | "number" | "kind" | "bloom" | "max">): QuestaoC =>
  ({ code: `S7-2-${number}`, number, kind, bloom, max: 30, ...rest });

export const TEMA_7_2: TemaSerie = {
  slug: "s7-tema-2", serie: 7, rascunho: false,
  title: "Controle do Dinheiro", subtitle: "Extrato, fatura e o saldo de cada dia",
  topics: ["Extrato bancário", "Fatura do cartão de crédito", "Juros e efeito bola de neve"],
  questions: [
    q(1, "choice", "Lembrar", {
      source: "Aula 3", title: "As letras do extrato", theme: "Siglas do extrato bancário", scene: "ledger",
      scenario: "Ao abrir o extrato da conta-corrente, Ana vê lançamentos marcados com as letras C e D.",
      prompt: "O que indicam as letras C e D no extrato?", hint: "Pense em entrada e saída de dinheiro.",
      rubric: "Reconhecer as siglas do extrato (C crédito = entrada; D débito = saída)", strength: "leitura das siglas do extrato bancário", retake: "siglas do extrato: C (crédito), D (débito), CC e CP", bncc: AULA3,
      options: ch([0, 10, 30, 0],
        ["C é compra e D é depósito.", "C é saída de dinheiro e D é entrada de dinheiro.", "C é crédito (entrada de dinheiro) e D é débito (saída de dinheiro).", "C é conta-corrente e D é conta-poupança."],
        ["As letras não indicam o tipo de operação, e sim o sentido do dinheiro.", "Percebe que as letras indicam o sentido do dinheiro, mas inverte entrada e saída.", "C é crédito (entrada, como receber um Pix) e D é débito (saída, como pagar uma conta).", "Conta-corrente e conta-poupança são indicadas por CC e CP."]),
    }),
    q(2, "choice", "Compreender", {
      source: "Aula 3", title: "Os três saldos", theme: "Saldo anterior, atual e disponível", scene: "cash",
      scenario: "No extrato aparecem o saldo anterior, o saldo atual e o saldo disponível.",
      prompt: "Qual explicação está correta?",
      rubric: "Diferenciar saldo anterior, saldo atual e saldo disponível", strength: "compreensão dos diferentes saldos do extrato", retake: "diferença entre saldo anterior, atual e disponível", bncc: AULA3,
      options: ch([10, 30, 0, 0],
        ["O saldo atual é sempre o valor que pode ser gasto agora.", "O saldo anterior é o valor de antes das movimentações do período, e o saldo disponível é o que realmente pode ser usado agora, depois de pagamentos agendados.", "Os três saldos são sempre iguais.", "O saldo anterior é o dinheiro que a pessoa tem agora."],
        ["O saldo atual pode incluir valores pendentes ou bloqueados: parte dele pode não estar disponível.", "Diferencia o valor que havia antes das movimentações do que pode ser usado no momento.", "Os saldos mudam conforme as movimentações e os pagamentos agendados.", "O saldo anterior mostra o que havia antes das movimentações, não o que há agora."]),
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
      source: "Aula 3", title: "Essenciais ou não?", theme: "Classificar os gastos do extrato", scene: "plan",
      scenario: "No extrato de Ana Maria: aula de natação R$ 158,00, manutenção da conta R$ 28,00, supermercado R$ 280,00, pizzaria R$ 80,00, aluguel R$ 2.400,00 e TED R$ 12,50.",
      prompt: "Qual afirmação sobre esses gastos está correta?", hint: "Some os essenciais (mercado e aluguel) e os não essenciais (natação e pizzaria).",
      rubric: "Classificar gastos em essenciais, não essenciais e tarifas e comparar os totais", strength: "classificação e comparação de gastos no extrato", retake: "gastos essenciais, não essenciais e tarifas", bncc: AULA3,
      options: ch([0, 10, 30, 0],
        ["Os gastos não essenciais foram maiores, porque natação e pizzaria somam mais que o supermercado.", "Os gastos essenciais foram maiores (R$ 2.680,00), e a manutenção e a TED também são gastos essenciais.", "Os gastos essenciais (supermercado e aluguel, R$ 2.680,00) foram maiores que os não essenciais (natação e pizzaria, R$ 238,00).", "Os gastos foram iguais, porque tudo saiu da mesma conta."],
        ["Natação e pizzaria somam R$ 238,00, menos que só o supermercado (R$ 280,00).", "Acerta que os essenciais foram maiores, mas manutenção e TED são tarifas, não gastos essenciais.", "Soma corretamente: R$ 280 + R$ 2.400 = R$ 2.680 contra R$ 158 + R$ 80 = R$ 238.", "Sair da mesma conta não torna os valores iguais: eles são muito diferentes."]),
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
      source: "Aula 3", title: "Onde economizar?", theme: "Decidir com base no extrato", scene: "envelopes",
      scenario: "Na semana do extrato de Ana Maria, os gastos essenciais foram R$ 2.680 (supermercado R$ 280 e aluguel R$ 2.400), os não essenciais R$ 238 (natação R$ 158 e pizzaria R$ 80) e as tarifas R$ 40,50 (manutenção R$ 28 e TED R$ 12,50). Ela quer economizar R$ 100 na semana seguinte.",
      prompt: "Qual decisão é melhor fundamentada no extrato?",
      rubric: "Escala: integral 30; adequada parcial 20; incipiente 10; inadequada 0", strength: "decisão financeira fundamentada nos dados do extrato", retake: "separar gastos essenciais, não essenciais e tarifas para decidir", bncc: AULA3,
      options: ch([0, 30, 20, 10],
        ["Cortar o aluguel, por ser o maior valor do extrato.", "Reduzir gastos não essenciais (R$ 238 na semana), manter aluguel e mercado e perguntar ao banco por um pacote com tarifas menores.", "Reduzir só os gastos não essenciais e ignorar as tarifas, por serem pequenas.", "Parar de consultar o extrato para não se preocupar com os números."],
        ["O aluguel é um gasto essencial; cortá-lo não é uma opção viável.", "Protege o essencial, usa os gastos que podem ser reduzidos e ainda busca reduzir tarifas, que podem ser renegociadas.", "A decisão é válida, mas deixa de lado as tarifas, que também podem ser reduzidas.", "Sem consultar o extrato, não há como planejar nem identificar onde economizar."]),
    }),
    q(8, "choice", "Criar", {
      source: "Aula 4", title: "Fugindo da bola de neve", theme: "Plano para usar o cartão sem acumular dívida", scene: "pact",
      scenario: "Larissa vai começar a usar o cartão de crédito e quer evitar que uma dívida pequena vire uma “bola de neve”.",
      prompt: "Escolha o plano com mais evidências de responsabilidade financeira.",
      rubric: "Avaliar plano por 4 critérios: conferir a fatura, separar gastos, limitar compras ao orçamento e pagar o total em dia", strength: "planejamento do uso do cartão para evitar dívidas", retake: "como evitar juros, multa e efeito bola de neve na fatura", bncc: AULA4,
      options: ch([0, 10, 30, 20],
        ["Pagar só o mínimo todo mês e continuar usando o cartão normalmente.", "Parcelar todas as compras em muitas vezes, para as parcelas ficarem pequenas.", "Conferir a fatura, separar gastos essenciais e não essenciais, limitar as compras ao orçamento e pagar o valor total até o vencimento.", "Pagar a fatura sempre em dia, mas sem conferir os itens cobrados."],
        ["Os valores não pagos geram juros e acumulam, que é justamente o efeito bola de neve.", "Muitas parcelas em aberto podem pesar no orçamento e gerar a bola de neve.", "Combina conferência, planejamento do orçamento e pagamento integral em dia.", "Pagar em dia ajuda, mas sem conferir os itens não se percebe erros nem hábitos de consumo."]),
    }),
  ],
};
