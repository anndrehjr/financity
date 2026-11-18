// 7º ano — Tema 3 (RASCUNHO para revisão do professor). Fonte: aulas 5 a 9 do 4º bimestre (Educação Financeira, SEDUC-SP).
//   Aula 5 · Cupom fiscal: para que serve? – Parte 1 (cupom x nota fiscal, impostos, taxa de serviço)
//   Aula 6 · Cupom fiscal: para que serve? – Parte 2 (cobranças adicionais, gorjeta, porcentagem)
//   Aula 7 · Porcentagem no dia a dia – Parte 1: na mídia (notícias e propagandas)
//   Aula 8 · Porcentagem no dia a dia – Parte 2: descontos e acréscimos
//   Aula 9 · Porcentagem no dia a dia – Parte 3: contas de consumo (bandeiras tarifárias)
// Todos os números abaixo são os dos próprios slides ou dados fictícios coerentes com eles.
import type { Bloom, Kind, OpcaoC, QuestaoC } from "./culminancia.js";
import type { TemaSerie } from "../lib/serie.js";

const TCT = "Tema transversal: Educação Financeira";
const AULA5 = "EF07CI06 (habilidade indicada na aula 5); " + TCT;
const MA02 = "EF07MA02 (habilidade indicada nas aulas 6 a 9); " + TCT;

const ch = (points: number[], texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: points[i], why: whys[i] }));
const mu = (correct: string, texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: 0, why: whys[i], correct: correct.includes("ABCD"[i]) }));
const or = (texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: 0, why: whys[i], seq: i + 1 }));
const q = (number: number, kind: Kind, bloom: Bloom, rest: Omit<QuestaoC, "code" | "number" | "kind" | "bloom" | "max">): QuestaoC =>
  ({ code: `S7-3-${number}`, number, kind, bloom, max: 30, ...rest });

export const TEMA_7_3: TemaSerie = {
  slug: "s7-tema-3", serie: 7, rascunho: true,
  title: "Compras e Porcentagem", subtitle: "Cupom, descontos, acréscimos e contas de consumo",
  topics: ["Cupom fiscal, impostos e taxas", "Descontos e acréscimos", "Contas de consumo"],
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
      source: "Aula 9", title: "Preços no supermercado", theme: "Variação percentual e variação em reais", scene: "packs",
      scenario: "No supermercado: óleo de soja subiu de R$ 9,00 para R$ 9,99 (+11%), o sabão em pó caiu de R$ 18,00 para R$ 14,40 (−20%) e o pacote de arroz subiu de R$ 25,00 para R$ 26,50 (+6%).",
      prompt: "Qual produto teve o maior aumento em reais?", hint: "Compare quanto o preço subiu em reais, e não só o percentual.",
      rubric: "Distinguir variação percentual de variação em reais", strength: "comparação entre variação percentual e variação em reais", retake: "calcular a variação em reais a partir da porcentagem", bncc: MA02,
      options: ch([10, 0, 0, 30],
        ["O óleo de soja, porque tem o maior percentual de aumento (11%).", "O sabão em pó, porque mudou 20%.", "Todos tiveram o mesmo aumento em reais.", "O pacote de arroz: subiu R$ 1,50, contra R$ 0,99 do óleo, mesmo com percentual menor."],
        ["O óleo tem a maior porcentagem, mas subiu só R$ 0,99, menos que o arroz.", "O preço do sabão caiu (desconto), não subiu.", "Os aumentos são diferentes: R$ 0,99 no óleo e R$ 1,50 no arroz.", "Compara os valores em reais: R$ 26,50 − R$ 25,00 = R$ 1,50, maior que R$ 0,99."]),
    }),
    q(5, "order", "Aplicar", {
      source: "Aula 8", title: "O novo preço da passagem", theme: "Calcular um aumento percentual", scene: "plan",
      scenario: "Uma passagem de ônibus custa R$ 50,00 e vai receber aumento de 10%.",
      prompt: "Coloque os passos do cálculo na ordem correta.", hint: "10% é a décima parte do valor.",
      rubric: "Ordem exata 100%; 2 relações corretas 65%; 1 relação 30%; nenhuma 0%", strength: "cálculo de um aumento percentual passo a passo", retake: "cálculo de acréscimos usando 10% (décima parte)", bncc: MA02,
      options: or(
        ["Identificar o preço inicial (R$ 50,00) e a porcentagem (10%).", "Calcular 10% de R$ 50,00: 50 ÷ 10 = R$ 5,00.", "Somar o aumento ao preço inicial: R$ 50,00 + R$ 5,00.", "Conferir: o novo preço (R$ 55,00) é maior que o original, como esperado em um aumento."],
        ["É preciso saber o valor e a porcentagem antes de calcular.", "10% é a décima parte: basta dividir por 10.", "Em um aumento, o valor do acréscimo é somado ao preço original.", "Conferir se o resultado faz sentido evita erros."]),
    }),
    q(6, "choice", "Analisar", {
      source: "Aulas 7–8", title: "O desconto só no Pix", theme: "Interpretar a condição de uma promoção", scene: "phone",
      scenario: "Na loja A, um smartphone custa R$ 2.000,00 e a propaganda diz: “15% de desconto, só para pagamento à vista no Pix”. Na loja B, o mesmo smartphone custa R$ 1.800,00 em qualquer forma de pagamento. Carla só pode pagar no cartão.",
      prompt: "Para Carla, qual loja sai mais barata?", hint: "Leia a condição da promoção, além da porcentagem.",
      rubric: "Interpretar porcentagem e condição de compra em propaganda e comparar o preço final", strength: "interpretação de promoções com condições de pagamento", retake: "como ler porcentagem e condições em promoções", bncc: MA02,
      options: ch([0, 0, 30, 20],
        ["Loja A, porque com 15% de desconto custaria R$ 1.700,00.", "Qualquer uma, porque o desconto de 15% compensa a diferença.", "Loja B: no cartão Carla não tem o desconto da loja A, então pagaria R$ 2.000,00 contra R$ 1.800,00.", "Loja B, porque R$ 1.800,00 equivale a 15% de desconto sobre R$ 2.000,00."],
        ["Ignora a condição: o desconto vale só no Pix, e Carla paga no cartão.", "Sem o Pix, o desconto não vale; as lojas custam R$ 2.000,00 e R$ 1.800,00.", "Interpreta a condição da promoção e compara o preço que Carla realmente pagaria.", "Acerta a loja, mas 15% de R$ 2.000 é R$ 300 (R$ 1.700), e não R$ 200."]),
    }),
    q(7, "choice", "Avaliar", {
      source: "Aula 8", title: "A televisão do Paulo", theme: "Decidir entre desconto à vista e parcelamento", scene: "install",
      scenario: "Paulo quer comprar uma televisão de R$ 2.300,00. Pagando à vista (débito ou Pix), ele ganha 10% de desconto. Parcelando em 10 vezes de R$ 230,00, ele paga o preço cheio. Paulo tem R$ 2.100,00 guardados.",
      prompt: "Qual decisão é mais vantajosa financeiramente?",
      rubric: "Escala: integral 30; adequada parcial 20; incipiente 10; inadequada 0", strength: "decisão de compra considerando desconto percentual", retake: "comparar pagamento à vista com desconto e parcelamento", bncc: MA02,
      options: ch([0, 10, 30, 0],
        ["Parcelar em 10 vezes, porque cada parcela de R$ 230,00 parece pequena.", "Parcelar, porque R$ 2.100,00 é menor que R$ 2.300,00 e ele não poderia pagar à vista.", "Pagar à vista: 10% de R$ 2.300 é R$ 230, então ele paga R$ 2.070,00, economiza R$ 230,00 e seus R$ 2.100,00 são suficientes.", "Parcelar, porque o desconto à vista seria de apenas R$ 23,00."],
        ["Ignora que o parcelamento sai pelo preço cheio, R$ 230,00 mais caro.", "Esquece que o preço à vista já tem desconto: R$ 2.070,00 cabe nos R$ 2.100,00.", "Calcula o desconto (R$ 230,00), o preço final (R$ 2.070,00) e verifica se cabe no orçamento.", "Erra o cálculo: 10% de R$ 2.300 é R$ 230,00, não R$ 23,00."]),
    }),
    q(8, "choice", "Criar", {
      source: "Aula 9", title: "Bandeira vermelha na conta de luz", theme: "Planejar o pagamento de uma conta com acréscimos", scene: "ledger",
      scenario: "A conta de luz de uma família é de R$ 200,00. Em um mês de bandeira vermelha, há acréscimo de 25%. Se a conta for paga com atraso, há multa de 5%.",
      prompt: "Escolha o plano com evidências de responsabilidade financeira.",
      rubric: "Avaliar plano por 4 critérios: cálculo do acréscimo, reserva do valor, redução do consumo e pagamento em dia", strength: "planejamento de contas de consumo com acréscimos percentuais", retake: "calcular acréscimos e planejar o pagamento de contas de consumo", bncc: MA02,
      options: ch([0, 30, 10, 20],
        ["Ignorar a bandeira e pagar a conta quando lembrar.", "Calcular a conta com a bandeira (R$ 200 + 25% = R$ 250), reservar esse valor, reduzir o consumo e pagar até o vencimento para evitar a multa.", "Reservar só R$ 200,00 e pagar com atraso se faltar dinheiro.", "Reduzir o consumo, mas sem calcular o valor da bandeira nem reservar dinheiro."],
        ["Sem acompanhar o valor e o vencimento, a família corre o risco de pagar multa.", "Combina cálculo do acréscimo (25% de 200 = 50), reserva, redução do consumo e pagamento em dia.", "Esquece o acréscimo de R$ 50,00 e ainda corre o risco de pagar multa.", "Reduzir o consumo ajuda, mas sem calcular a conta e separar o valor, o pagamento pode faltar."]),
    }),
  ],
};
