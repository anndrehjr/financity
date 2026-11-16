import type { MapaConteudo } from "./tipos.js";

/**
 * RASCUNHO PARA REVISÃO DO PROFESSOR — não está ligado ao seed nem ao banco.
 * Mapa 3 — Planejamento Financeiro (O Bairro do Futuro): orçamento, receitas e despesas, reserva de emergência.
 */
export const MAPA3: MapaConteudo = {
  slug: "planejamento-financeiro",
  title: "Planejamento Financeiro",
  subtitle: "O Bairro do Futuro",
  topics: ["Orçamento", "Receitas e despesas", "Reserva de emergência"],
  questions: [
    {
      number: 1, title: "O Caderno de Contas", theme: "Receitas e despesas", scene: "ledger",
      scenario: "Alex anotou tudo o que entrou e saiu no mês: mesada de R$ 80, venda de um jogo usado por R$ 30, lanches de R$ 25, presente para um amigo de R$ 20 e recarga do celular de R$ 15.",
      dialog: "Anotei tudo, mas está uma bagunça. O que é receita, o que é despesa e quanto sobrou?",
      prompt: "Qual alternativa organiza melhor as anotações de Alex?",
      note: "Avalia a distinção entre receitas e despesas, o cálculo do saldo e a separação entre necessidades e desejos.",
      strength: "organização de receitas, despesas e saldo, e distinção entre necessidade e desejo",
      retake: "distinção entre receitas e despesas, cálculo do saldo e diferença entre necessidade e desejo",
      bloom: "Compreender", bncc: "Tema transversal: Educação Financeira; competências gerais 2 e 6",
      options: [
        { text: "Tudo o que passou pelas mãos de Alex é dinheiro disponível, então o saldo é de R$ 170, somando todos os valores anotados.", points: 0, why: "Soma receitas e despesas como se fossem a mesma coisa (170 é a soma de tudo)." },
        { text: "Receitas de R$ 80 (só a mesada) e despesas de R$ 60, com saldo de R$ 20, porque a venda do jogo foi ocasional e não conta.", points: 2, why: "Separa receitas e despesas, mas ignora uma entrada real de dinheiro." },
        { text: "Receitas de R$ 110, despesas de R$ 60 e saldo de R$ 50, deixando para decidir mais tarde o destino desse saldo.", points: 3, why: "Classifica e calcula certo, mas não planeja o uso do saldo." },
        { text: "Receitas de R$ 110, despesas de R$ 60 e saldo de R$ 50, separando a recarga (necessidade) do lanche e do presente (desejos).", points: 4, why: "Classifica, calcula e distingue necessidades e desejos, mas não decide o saldo." },
        { text: "Receitas de R$ 110, despesas de R$ 60, saldo de R$ 50, separando necessidades e desejos e definindo quanto do saldo será guardado.", points: 5, why: "Classifica, calcula, distingue e já direciona o saldo para um objetivo." },
      ],
    },
    {
      number: 2, title: "A Mesada em Três Partes", theme: "Divisão do orçamento", scene: "envelopes",
      scenario: "Alex recebeu R$ 200 de mesada e quer usar a regra 50-30-20: 50% para necessidades, 30% para lazer e 20% para guardar.",
      dialog: "Em vez de gastar tudo sem pensar, vou dividir em partes. Quanto vai para cada uma?",
      prompt: "Qual aplicação da regra e qual atitude demonstram o melhor planejamento?",
      note: "Avalia o uso de porcentagens para dividir um orçamento e a atitude de pagar a si mesmo primeiro.",
      strength: "uso de porcentagens para dividir o orçamento e prioridade para a poupança",
      retake: "aplicação de porcentagens ao orçamento e hábito de guardar antes de gastar",
      bloom: "Aplicar", bncc: "EF08MA04; competências gerais 6 e 10; tema transversal: Educação Financeira",
      options: [
        { text: "Separar R$ 60 para necessidades, R$ 100 para lazer e R$ 40 para guardar, porque o lazer é a parte mais importante do mês.", points: 0, why: "Aplica os percentuais na ordem errada (50% seria R$ 100 para necessidades)." },
        { text: "Calcular os valores certos (R$ 100, R$ 60 e R$ 40), mas gastar a parte da poupança logo no início do mês, já que o dinheiro está à mão.", points: 2, why: "O cálculo está certo, mas o comportamento desfaz o plano." },
        { text: "Calcular R$ 100, R$ 60 e R$ 40, separar em envelopes e usar a parte do lazer quando surgirem convites ao longo do mês.", points: 3, why: "Calcula e organiza, mas deixa a poupança para o que sobrar." },
        { text: "Calcular R$ 100, R$ 60 e R$ 40 e guardar primeiro os R$ 40 da poupança, usando o restante conforme a divisão feita.", points: 4, why: "Calcula certo e prioriza a poupança, mas não prevê acompanhamento." },
        { text: "Calcular R$ 100, R$ 60 e R$ 40, guardar primeiro os R$ 40, anotar os gastos de cada parte e rever os percentuais se algo mudar.", points: 5, why: "Calcula, prioriza a poupança e acompanha o plano, ajustando-o quando preciso." },
      ],
    },
    {
      number: 3, title: "O Celular que Quebrou", theme: "Reserva de emergência", scene: "phone",
      scenario: "Bia e Cléo recebem a mesma mesada de R$ 100. Bia gasta tudo todo mês. Cléo separa R$ 10 por mês há nove meses. Um dia, o celular das duas quebra e o conserto custa R$ 90.",
      dialog: "As duas ganham igual e o problema foi o mesmo. Por que uma se saiu melhor que a outra?",
      prompt: "Qual análise explica melhor a diferença entre a situação de Bia e a de Cléo?",
      note: "Avalia a compreensão de que a reserva de emergência se constrói com hábitos regulares, e não com sorte.",
      strength: "compreensão do papel da reserva de emergência e do hábito de guardar regularmente",
      retake: "reserva de emergência e hábito de guardar uma parte da renda antes de o imprevisto acontecer",
      bloom: "Analisar", bncc: "Tema transversal: Educação Financeira; competências gerais 6 e 7",
      options: [
        { text: "Cléo teve sorte, porque imprevistos acontecem ao acaso e ninguém consegue se preparar para eles com antecedência, seja qual for o hábito.", points: 0, why: "Trata o imprevisto como pura sorte; reserva é justamente a preparação." },
        { text: "Bia deveria pedir dinheiro emprestado para pagar o conserto, pois assim o problema do mês fica resolvido rapidamente.", points: 2, why: "Resolve o momento, mas cria dívida e não explica a diferença entre as duas." },
        { text: "Cléo provavelmente gastou menos com lazer do que Bia durante esses meses, e foi isso que fez a diferença na hora de pagar o conserto.", points: 3, why: "Plausível, mas não aponta o que de fato diferencia: guardar parte da renda." },
        { text: "A diferença está no hábito: Cléo separou parte da mesada todo mês e formou uma reserva que cobriu o imprevisto.", points: 4, why: "Identifica o hábito de guardar como causa da diferença." },
        { text: "Cléo guardou 10% da mesada por nove meses e chegou aos R$ 90 do conserto; Bia poderia ter feito o mesmo.", points: 5, why: "Explica com os números (10% × 9 meses = R$ 90) e aponta a solução para o futuro." },
      ],
    },
    {
      number: 4, title: "O Jogo ou a Bicicleta", theme: "Prioridades no orçamento", scene: "bike",
      scenario: "Alex tem R$ 120 guardados e a próxima mesada só chega em duas semanas. Um jogo que Alex quer custa R$ 120. Mas a bicicleta, que Alex usa para ir à escola, precisa de um conserto de R$ 40 nesta semana.",
      dialog: "Eu tenho dinheiro só para o jogo... mas a bicicleta não pode ficar parada. O que vem primeiro?",
      prompt: "Qual decisão demonstra a melhor avaliação das prioridades e do orçamento?",
      note: "Avalia a hierarquização de necessidades e desejos diante de um imprevisto, com planejamento do que fica para depois.",
      strength: "hierarquização de necessidades e desejos diante de imprevistos",
      retake: "definição de prioridades entre necessidade urgente e desejo, e planejamento do que fica para depois",
      bloom: "Avaliar", bncc: "Tema transversal: Educação Financeira; competências gerais 6, 7 e 10",
      options: [
        { text: "Comprar o jogo agora, porque Alex o deseja há tempos, e ver depois como resolver o conserto da bicicleta com o dinheiro que aparecer depois.", points: 0, why: "Prioriza o desejo e deixa a necessidade urgente sem solução." },
        { text: "Não gastar nada com nenhum dos dois, guardando todo o dinheiro por precaução, mesmo que a bicicleta continue quebrada durante semanas.", points: 2, why: "Evita gastar, mas deixa uma necessidade real (ir à escola) sem solução." },
        { text: "Comprar o jogo e pedir à família o dinheiro do conserto, já que a bicicleta também é usada por outras pessoas da casa.", points: 3, why: "A bicicleta é resolvida, mas por dinheiro de outros, e o desejo passa na frente." },
        { text: "Pagar o conserto de R$ 40 e manter os R$ 80 restantes como parte do valor do jogo, completando-o com a próxima mesada.", points: 4, why: "Resolve a necessidade primeiro e planeja o desejo, mas sem definir um prazo." },
        { text: "Pagar o conserto de R$ 40, por ser necessidade urgente, guardar os R$ 80 e marcar uma data para comprar o jogo.", points: 5, why: "Ordena por urgência e importância e cria um plano com prazo para o desejo." },
      ],
    },
    {
      number: 5, title: "O Plano do Fone Novo", theme: "Meta e orçamento", scene: "goal",
      scenario: "Alex quer comprar um fone de R$ 240 em quatro meses. Todo mês, entram R$ 80 de mesada e cerca de R$ 20 de pequenos trabalhos, num total de R$ 100.",
      dialog: "Quero montar um plano de verdade para juntar esse dinheiro. Qual caminho é o mais viável?",
      prompt: "Qual plano tem mais chances de dar certo?",
      note: "Avalia a elaboração de um plano financeiro com meta, prazo, valor mensal e previsão de ajustes.",
      strength: "elaboração de um plano com meta, prazo, valor mensal e margem para imprevistos",
      retake: "construção de um plano financeiro com meta, prazo e valor mensal viável",
      bloom: "Criar", bncc: "Tema transversal: Educação Financeira; competências gerais 6 e 10",
      options: [
        { text: "Guardar o que sobrar no fim de cada mês e, se sobrar pouco, esperar o tempo que for preciso até juntar os R$ 240.", points: 0, why: "Não há meta mensal nem prazo; a sobra costuma ser zero." },
        { text: "Guardar R$ 100 por mês, usando toda a renda, para ter o fone em pouco mais de dois meses.", points: 2, why: "Cálculo correto, mas inviável: não deixa nada para os gastos do mês." },
        { text: "Guardar R$ 60 por mês, que juntam os R$ 240 em quatro meses, e decidir os gastos do restante conforme os convites surgirem.", points: 3, why: "Valor mensal certo, mas sem reservar nem acompanhar o dinheiro dos gastos." },
        { text: "Guardar R$ 60 por mês, reservar R$ 40 para os gastos do mês e anotar o que for gasto para conferir se está dentro do plano.", points: 4, why: "Plano completo e viável, mas sem previsão para meses com renda menor." },
        { text: "Guardar R$ 60 por mês, reservar R$ 40 para gastos e prever um ajuste de prazo se a renda dos trabalhos cair em algum mês, mantendo a meta.", points: 5, why: "Plano viável, acompanhado e flexível diante de imprevistos de renda." },
      ],
    },
  ],
};
