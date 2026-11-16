import type { MapaConteudo } from "./tipos.js";

/**
 * RASCUNHO PARA REVISÃO DO PROFESSOR — não está ligado ao seed nem ao banco.
 * Mapa 2 — Economia e Decisões (O Mercado das Escolhas): porcentagens, promoções, inflação.
 */
export const MAPA2: MapaConteudo = {
  slug: "economia-decisoes",
  title: "Economia e Decisões",
  subtitle: "O Mercado das Escolhas",
  topics: ["Porcentagens", "Promoções", "Inflação"],
  questions: [
    {
      number: 1, title: "O Desconto em Cadeia", theme: "Descontos sucessivos", scene: "ad",
      scenario: "Alex vê um casaco de R$ 200 numa vitrine com dois anúncios: \"50% de desconto\" e \"mais 10% de desconto no cupom\".",
      dialog: "São 50% mais 10%... então é 60% de desconto, né? Será que a conta é essa mesmo?",
      prompt: "Alex acredita que o desconto total é de 60%. Qual atitude demonstra melhor compreensão de como os percentuais funcionam?",
      note: "Avalia a compreensão de descontos sucessivos: o segundo percentual incide sobre o valor já reduzido.",
      strength: "interpretação correta de descontos sucessivos e conferência do preço final",
      retake: "cálculo de descontos sucessivos (os percentuais não se somam) e conferência do preço final",
      bloom: "Compreender", bncc: "EF08MA04; competência geral 2; tema transversal: Educação Financeira",
      options: [
        { text: "Aceitar os 60% e comprar, porque somar os dois descontos é a maneira mais simples de saber quanto será pago pelo casaco.", points: 0, why: "Soma os percentuais e erra o preço final (o correto é R$ 90, não R$ 80)." },
        { text: "Desconfiar do anúncio e desistir de vez, porque as lojas costumam misturar vários percentuais justamente para confundir quem compra e fazer o cliente gastar mais.", points: 2, why: "Evita o erro, mas desiste sem calcular; a oferta pode ser boa." },
        { text: "Estimar que o preço final ficará perto de R$ 90 e comprar logo, deixando para conferir o valor exato apenas quando chegar ao caixa e vir o total.", points: 3, why: "A estimativa está certa, mas falta verificar o cálculo antes de decidir." },
        { text: "Calcular o primeiro desconto (R$ 100) e aplicar os 10% sobre esse novo valor, chegando a R$ 90, ou seja, 55% de desconto total.", points: 4, why: "Calcula corretamente, mas não compara o resultado com a necessidade nem com outras ofertas." },
        { text: "Chegar ao preço de R$ 90 (55% de desconto total) e compará-lo com o orçamento e com o preço em outras lojas.", points: 5, why: "Calcula corretamente e usa o resultado para decidir com critérios." },
      ],
    },
    {
      number: 2, title: "O Lanche Mais Caro", theme: "Inflação", scene: "snack",
      scenario: "Na cantina da escola, o lanche que custava R$ 12 há um ano agora custa R$ 15. A mesada de Alex continua sendo de R$ 60 por mês.",
      dialog: "Parece pouca diferença, mas minha mesada continua a mesma... Quantos lanches eu consigo comprar agora?",
      prompt: "Qual conclusão e atitude mostram o melhor uso das porcentagens para entender o que aconteceu com o dinheiro de Alex?",
      note: "Avalia o cálculo de aumento percentual e a noção de perda de poder de compra (inflação).",
      strength: "cálculo de aumento percentual e percepção da perda de poder de compra",
      retake: "cálculo de aumento percentual e efeito da inflação sobre o poder de compra",
      bloom: "Aplicar", bncc: "EF08MA04; competência geral 2; tema transversal: Educação Financeira",
      options: [
        { text: "Concluir que o aumento foi de R$ 3, um valor pequeno, e manter os mesmos hábitos de gasto, já que a diferença quase não pesa.", points: 0, why: "Ignora o efeito acumulado: o lanche ficou 25% mais caro." },
        { text: "Concluir que o preço subiu 3% e que a mesada ainda dá para comprar os mesmos lanches durante o mês inteiro.", points: 2, why: "Confunde reais com percentual (R$ 3 não é 3%) e conclui errado." },
        { text: "Calcular que o aumento foi de 25%, mas continuar comprando como antes e esperar que a mesada aumente em algum momento, quando a família perceber.", points: 3, why: "Calcula certo, mas não ajusta o comportamento ao novo preço." },
        { text: "Calcular o aumento de 25% e perceber que a mesada passou de 5 para 4 lanches por mês, ajustando as compras da semana.", points: 4, why: "Calcula certo e reorganiza o consumo, mas não busca outras soluções." },
        { text: "Calcular o aumento de 25%, notar que a mesada compra 4 lanches e não 5, e trocar alguns lanches por opções mais baratas ou levar algo de casa.", points: 5, why: "Calcula, interpreta a perda de poder de compra e busca alternativas." },
      ],
    },
    {
      number: 3, title: "O Pacote de Cadernos", theme: "Preço por unidade", scene: "packs",
      scenario: "Alex precisa de apenas 1 caderno. A Loja A vende um pacote com 3 cadernos por R$ 54. A Loja B vende cada caderno por R$ 20, com 10% de desconto.",
      dialog: "O pacote parece vantajoso porque vêm três... mas eu só preciso de um. Qual compensa?",
      prompt: "Qual análise das duas ofertas é a mais completa?",
      note: "Avalia a comparação de ofertas pelo preço por unidade e a relação entre a promoção e a real necessidade.",
      strength: "comparação de ofertas pelo preço por unidade e pela real necessidade",
      retake: "comparação de preço por unidade e risco de comprar mais do que o necessário por causa de pacotes",
      bloom: "Analisar", bncc: "EF08MA04; competência geral 2; tema transversal: Educação Financeira",
      options: [
        { text: "Escolher o pacote, porque três cadernos por R$ 54 parecem sempre mais vantajosos do que pagar por um caderno apenas.", points: 0, why: "Acha que quantidade maior é sempre melhor e ignora a necessidade." },
        { text: "Escolher a unidade, pois R$ 18 é menor que R$ 54, deixando de lado quantos cadernos cada oferta traz, já que o total pago é o que importa.", points: 2, why: "A escolha é boa, mas a razão está errada: compara totais, não preços por unidade." },
        { text: "Calcular o preço por caderno (R$ 18 nas duas lojas) e escolher o pacote, imaginando que os outros cadernos serão usados um dia.", points: 3, why: "Calcula certo, mas gasta R$ 36 a mais com algo de que não precisa agora." },
        { text: "Calcular o preço por caderno (R$ 18 nas duas lojas) e comprar apenas a unidade, porque só um caderno é necessário agora.", points: 4, why: "Calcula certo e compra o que precisa, mas não considera guardar a diferença." },
        { text: "Descobrir que o preço por caderno é igual (R$ 18), comprar só a unidade e preservar R$ 36 para outros objetivos.", points: 5, why: "Compara por unidade, decide pela necessidade e enxerga o custo de oportunidade." },
      ],
    },
    {
      number: 4, title: "A Mochila da Black Friday", theme: "Falsa promoção", scene: "bag",
      scenario: "Na Black Friday, Alex viu uma mochila anunciada como \"de R$ 250 por R$ 150: 40% de desconto\". Ao consultar o histórico de preços, descobriu que no mês passado a mesma mochila custava R$ 160.",
      dialog: "40% de desconto parece incrível! Mas o histórico mostra outra coisa... O que eu faço?",
      prompt: "Qual decisão demonstra o raciocínio financeiro mais completo?",
      note: "Avalia o cálculo do desconto real, a pesquisa de preços e a decisão por necessidade e orçamento.",
      strength: "cálculo do desconto real e decisão baseada em necessidade e orçamento",
      retake: "identificação de falsas promoções (preço inflado) e cálculo do desconto real",
      bloom: "Avaliar", bncc: "EF08MA04; competências gerais 7 e 10; tema transversal: Educação Financeira",
      options: [
        { text: "Comprar na hora: com 40% de desconto o preço está ótimo, e esperar poderia fazer a promoção acabar antes que Alex consiga pagar.", points: 0, why: "Cai na urgência e no \"preço de\" inflado." },
        { text: "Deixar de comprar, porque promoções de fim de ano sempre escondem enganos, e guardar o dinheiro é melhor do que gastar com uma mochila.", points: 2, why: "Evita a compra impulsiva, mas generaliza e não calcula o desconto real." },
        { text: "Perceber que a economia real foi pequena, mas comprar mesmo assim, já que o dinheiro está guardado e a loja tem a mochila de que Alex gostou.", points: 3, why: "Calcula, mas decide sem avaliar a necessidade nem o orçamento." },
        { text: "Calcular o desconto real em relação ao preço do mês passado e pesquisar o valor da mesma mochila em outras lojas antes de decidir se compra.", points: 4, why: "Faz o cálculo e a pesquisa, mas não considera a necessidade nem o orçamento." },
        { text: "Calcular o desconto real (cerca de 6%), avaliar se precisa de uma mochila nova e se cabe no orçamento, e só então comparar lojas.", points: 5, why: "Integra cálculo, necessidade, orçamento e comparação." },
      ],
    },
    {
      number: 5, title: "Minha Regra para Promoções", theme: "Planejamento do consumo", scene: "plan",
      scenario: "Depois de tantas ofertas, Alex decide criar uma regra pessoal para não cair em falsas promoções e escreve uma lista de combinados consigo mesmo.",
      dialog: "Preciso de uma regra que eu consiga seguir sempre. Qual dessas deixa minha lista mais forte?",
      prompt: "Qual regra pessoal para lidar com promoções é a mais completa?",
      note: "Avalia a capacidade de criar um critério próprio e consistente para decisões de compra.",
      strength: "criação de critérios próprios para decidir compras diante de promoções",
      retake: "construção de critérios pessoais de compra (lista, histórico de preços, comparação e tempo de reflexão)",
      bloom: "Criar", bncc: "EF08MA04; competências gerais 6 e 10; tema transversal: Educação Financeira",
      options: [
        { text: "Comprar sempre que o desconto passar de 30%, porque quanto maior o percentual anunciado, melhor será o negócio para quem compra.", points: 0, why: "O percentual anunciado não garante bom negócio (o preço de referência pode ser inflado)." },
        { text: "Nunca comprar nada em promoção, porque o preço normal é sempre o mais justo e evita arrependimentos nas compras do dia a dia.", points: 2, why: "Regra rígida: evita o erro, mas perde boas oportunidades e não ensina a avaliar." },
        { text: "Comparar o preço final com o de outras lojas antes de comprar, deixando para depois a pergunta sobre a necessidade do item.", points: 3, why: "Compara preços, mas deixa a necessidade de lado." },
        { text: "Calcular o desconto real sobre os preços dos últimos meses, comparar lojas e comprar apenas o que já estava na lista de necessidades feita antes de sair de casa.", points: 4, why: "Regra sólida, mas sem um tempo de reflexão contra a compra por impulso." },
        { text: "Conferir se o item está na lista, calcular o desconto real pelo histórico de preços, comparar lojas e esperar um dia para decidir.", points: 5, why: "Combina necessidade, cálculo, comparação e tempo de reflexão." },
      ],
    },
  ],
};
