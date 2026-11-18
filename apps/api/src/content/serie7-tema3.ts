// 7º ano — Tema 3 (RASCUNHO para revisão do professor). Fonte: aulas 7, 8 e 9 do 4º bimestre (Educação Financeira, SEDUC-SP).
//   Aula 7 · Porcentagem no dia a dia – Parte 1: na mídia (notícias, propagandas, promoções)
//   Aula 8 · Porcentagem no dia a dia – Parte 2: descontos e acréscimos
//   Aula 9 · Porcentagem no dia a dia – Parte 3: contas de consumo (bandeiras tarifárias, ICMS, multa)
// Todos os números abaixo são os dos próprios slides ou dados fictícios coerentes com eles.
import type { Bloom, Kind, OpcaoC, QuestaoC } from "./culminancia.js";
import type { TemaSerie } from "../lib/serie.js";

const TCT = "Tema transversal: Educação Financeira";
const MA02 = "EF07MA02 (habilidade indicada nas aulas 7 a 9); " + TCT;

const ch = (points: number[], texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: points[i], why: whys[i] }));
const mu = (correct: string, texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: 0, why: whys[i], correct: correct.includes("ABCD"[i]) }));
const or = (texts: string[], whys: string[]): OpcaoC[] => texts.map((text, i) => ({ text, points: 0, why: whys[i], seq: i + 1 }));
const q = (number: number, kind: Kind, bloom: Bloom, rest: Omit<QuestaoC, "code" | "number" | "kind" | "bloom" | "max">): QuestaoC =>
  ({ code: `S7-3-${number}`, number, kind, bloom, max: 30, ...rest });

export const TEMA_7_3: TemaSerie = {
  slug: "s7-tema-3", serie: 7, rascunho: true,
  title: "Porcentagem no Dia a Dia", subtitle: "Descontos, aumentos e contas de consumo",
  topics: ["Porcentagem na mídia e nas promoções", "Descontos e acréscimos", "Contas de consumo, impostos e multas"],
  questions: [
    q(1, "choice", "Lembrar", {
      source: "Aula 7", title: "A notícia dos 9%", theme: "O que é porcentagem", scene: "message",
      scenario: "Uma notícia afirma: “Apenas 9% do plástico global é reciclado”.",
      prompt: "O que significa a porcentagem 9% nessa notícia?", hint: "Nas porcentagens, o todo é sempre 100%: “100 partes em cada 100”.",
      rubric: "Interpretar porcentagem como parte de 100", strength: "interpretação do significado de uma porcentagem", retake: "o que significa o símbolo % (partes em cada 100)", bncc: MA02,
      options: ch([10, 30, 0, 0],
        ["Que apenas 9 produtos de plástico foram reciclados no mundo.", "Que 9 em cada 100 produtos de plástico foram reciclados.", "Que 9 em cada 10 produtos de plástico foram reciclados.", "Que o plástico reciclado custa 9% menos."],
        ["Percebe o número 9, mas esquece que o todo é 100: não é a quantidade total.", "A porcentagem indica 9 partes em cada 100 do todo.", "Confunde 100 com 10: 9 em cada 10 seria 90%.", "A notícia fala da quantidade reciclada, não do preço."]),
    }),
    q(2, "choice", "Compreender", {
      source: "Aula 7", title: "A promoção do smartphone", theme: "Interpretar a porcentagem de uma promoção", scene: "phone",
      scenario: "Um anúncio diz: “15% de desconto na compra de smartphones. Válido só para pagamento à vista no Pix”.",
      prompt: "O que a porcentagem indica nessa oferta?", hint: "Além da porcentagem, leia a condição da compra.",
      rubric: "Interpretar porcentagem e condição de compra em propaganda", strength: "interpretação de porcentagens em propagandas", retake: "como ler porcentagem e condições em promoções", bncc: MA02,
      options: ch([0, 10, 0, 30],
        ["Um desconto de R$ 15,00 em qualquer smartphone.", "Um desconto de 15% sobre o preço, válido para qualquer forma de pagamento.", "Um aumento de 15% no preço de quem paga no Pix.", "Um desconto de 15% sobre o preço do produto, válido só para pagamento à vista no Pix."],
        ["15% é uma parte de cada 100 do preço, não um valor fixo em reais.", "Entende o desconto, mas ignora a condição: só vale para pagamento à vista no Pix.", "Troca desconto por aumento.", "Interpreta a porcentagem e a condição de compra."]),
    }),
    q(3, "multi", "Aplicar", {
      source: "Aula 9", title: "A conta de luz", theme: "Bandeiras tarifárias e consumo", scene: "bag",
      scenario: "A família de Caio quer entender por que a conta de luz muda de um mês para outro.",
      prompt: "Selecione TODAS as afirmações corretas sobre contas de consumo.", hint: "Pense em consumo, bandeiras e em quem define o ICMS.",
      rubric: "Conjunto correto A e B; pontuação proporcional, sem crédito se marcar tudo", strength: "compreensão de porcentagens em contas de consumo", retake: "bandeiras tarifárias, faixas de consumo e ICMS", bncc: MA02,
      options: mu("AB",
        ["Em contas de água e luz, quanto mais se consome, maior é a tarifa proporcional em cada faixa de consumo.", "As bandeiras tarifárias acrescentam (ou não) uma porcentagem extra na conta de luz, conforme o custo de geração de energia.", "A bandeira verde sempre acrescenta 25% à conta.", "O ICMS é igual em todos os estados, porque é um imposto federal."],
        ["Correto: as faixas de consumo têm tarifas proporcionais maiores para quem consome mais.", "Correto: as bandeiras podem acrescentar uma porcentagem extra à conta.", "Na bandeira verde não há acréscimo; o acréscimo de 25% do exemplo é o da bandeira vermelha.", "O ICMS é um imposto estadual: cada estado define o percentual."]),
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
      source: "Aula 8", title: "O querosene ficou mais barato", theme: "Calcular uma redução percentual", scene: "trend",
      scenario: "Uma empresa aérea gasta R$ 1.000,00 com querosene de aviação, e o preço sofreu uma redução de 7%. Ana calculou: 1% de R$ 1.000 é R$ 10; 7% é R$ 70; então R$ 1.000 − R$ 70 = R$ 930. Bia calculou: 7% de R$ 1.000 é R$ 7; então R$ 1.000 − R$ 7 = R$ 993.",
      prompt: "Qual raciocínio está correto?",
      rubric: "Calcular redução percentual a partir de 1%", strength: "cálculo de redução percentual", retake: "cálculo de porcentagem a partir de 1%", bncc: MA02,
      options: ch([30, 0, 10, 0],
        ["O de Ana: 1% de R$ 1.000 é R$ 10, então 7% é R$ 70 e a empresa passa a gastar R$ 930,00.", "O de Bia: 7% de R$ 1.000 é R$ 7, e a empresa passa a gastar R$ 993,00.", "Os dois, porque os resultados ficam parecidos.", "Nenhum, porque uma redução deve ser somada ao valor."],
        ["Calcula 1% (R$ 10), depois 7% (R$ 70) e subtrai: R$ 930,00.", "Confunde 7% com 7 reais: 7% de R$ 1.000 é R$ 70.", "Os resultados são diferentes (R$ 930 e R$ 993), e só um está certo.", "Em uma redução, o valor é subtraído, não somado."]),
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
