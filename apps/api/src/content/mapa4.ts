import type { MapaConteudo } from "./tipos.js";

/**
 * RASCUNHO PARA REVISÃO DO PROFESSOR — não está ligado ao seed nem ao banco.
 * Mapa 4 — Cidadania Financeira (A Cidade Digital): ética, segurança, prioridades financeiras.
 */
export const MAPA4: MapaConteudo = {
  slug: "cidadania-financeira",
  title: "Cidadania Financeira",
  subtitle: "A Cidade Digital",
  topics: ["Ética", "Segurança", "Prioridades financeiras"],
  questions: [
    {
      number: 1, title: "A Mensagem Premiada", theme: "Golpes digitais", scene: "message",
      scenario: "Alex recebe uma mensagem: \"Parabéns! Você ganhou R$ 500! Clique agora no link e informe seus dados para receber o prêmio.\"",
      dialog: "Eu nem participei de sorteio nenhum... mas o prêmio parece tão real! O que será que isso significa?",
      prompt: "Qual interpretação da mensagem demonstra melhor compreensão dos sinais de golpe?",
      note: "Avalia a identificação de sinais de golpe digital (prêmio inesperado, pressa e pedido de dados) e a reação segura.",
      strength: "identificação de sinais de golpe digital e reação segura",
      retake: "sinais de golpes digitais (prêmio inesperado, pressa, pedido de dados) e como reagir",
      bloom: "Compreender", bncc: "Tema transversal: Educação Financeira; competências gerais 5 e 10",
      options: [
        { text: "É um prêmio verdadeiro, porque a mensagem cita o nome de Alex e usa o logotipo de uma loja bem conhecida.", points: 0, why: "Nome e logotipo são fáceis de copiar e não provam que a mensagem é real." },
        { text: "É um golpe, então basta apagar a mensagem e não contar nada a ninguém, para não preocupar a família à toa.", points: 2, why: "Reconhece o golpe, mas não alerta ninguém que possa ajudar ou ser alvo também." },
        { text: "Parece um golpe, mas vale abrir o link só para olhar a página, desde que Alex não digite nenhuma informação pessoal.", points: 3, why: "Desconfia, mas abrir o link já pode expor o aparelho a riscos." },
        { text: "É um golpe: promete um prêmio de um sorteio que Alex não disputou, cria pressa e pede dados pessoais. Por isso não deve clicar.", points: 4, why: "Identifica os sinais e evita o link, mas não aciona ajuda." },
        { text: "É um golpe pelos mesmos sinais (prêmio inesperado, pressa e pedido de dados): Alex não clica, bloqueia o número, apaga e avisa um adulto da família.", points: 5, why: "Identifica os sinais, evita o risco e compartilha o alerta." },
      ],
    },
    {
      number: 2, title: "Pagar à Vista ou Parcelar", theme: "Custo do parcelamento", scene: "install",
      scenario: "Alex quer um acessório que custa R$ 300 à vista. A loja oferece o mesmo item em 3 parcelas de R$ 110.",
      dialog: "R$ 110 por mês parece pouco... mas, somando as parcelas, será que paga mais?",
      prompt: "Qual atitude demonstra o melhor uso das porcentagens para decidir entre pagar à vista e parcelar?",
      note: "Avalia o cálculo do acréscimo percentual do parcelamento e a decisão ligada à urgência e ao orçamento.",
      strength: "cálculo do custo do parcelamento e decisão por urgência e orçamento",
      retake: "cálculo do acréscimo do parcelamento em porcentagem e decisão entre pagar à vista e parcelar",
      bloom: "Aplicar", bncc: "EF08MA04; competências gerais 6 e 10; tema transversal: Educação Financeira",
      options: [
        { text: "Parcelar, porque R$ 110 por mês parece pouco e cabe no bolso, e o dinheiro que já está guardado fica intacto.", points: 0, why: "Olha só para o valor da parcela e ignora o total pago." },
        { text: "Calcular que parcelar custa R$ 30 a mais e deixar a decisão final para outra pessoa da família, ficando de fora da conversa.", points: 2, why: "Calcula o acréscimo, mas abre mão de decidir e de entender o percentual." },
        { text: "Pagar à vista usando toda a reserva, porque qualquer acréscimo no preço é sempre ruim e deve ser evitado a qualquer custo, mesmo que isso esvazie as economias.", points: 3, why: "Evita o acréscimo, mas esvazia a reserva e não calcula o percentual." },
        { text: "Calcular que parcelar custa R$ 30 a mais (10%) e comparar esse valor com o que a espera para comprar à vista permitiria economizar.", points: 4, why: "Calcula o acréscimo e compara com alternativas, mas não avalia a urgência." },
        { text: "Calcular o acréscimo de R$ 30 (10%): se não houver urgência, juntar o valor e pagar à vista; senão, ver se a parcela cabe.", points: 5, why: "Calcula e decide conforme a urgência e o orçamento." },
      ],
    },
    {
      number: 3, title: "As Caixas Surpresa", theme: "Jogos e gastos dentro de aplicativos", scene: "lootbox",
      scenario: "Num jogo online, cada caixa surpresa custa R$ 5 e tem 2% de chance de trazer o item raro que Alex quer. Um amigo diz: \"É só tentar mais algumas vezes!\"",
      dialog: "É só R$ 5 por caixa... mas será que realmente compensa tentar até conseguir o item?",
      prompt: "Qual análise do risco e do custo é a mais completa?",
      note: "Avalia a análise de probabilidade e custo em compras dentro de jogos, e a busca de apoio para definir limites.",
      strength: "análise de risco e custo em compras dentro de jogos e definição de limites",
      retake: "probabilidade e custo em caixas surpresa e importância de combinar limites de gastos em jogos",
      bloom: "Analisar", bncc: "EF08MA04 (porcentagem); competências gerais 5, 7 e 10; tema transversal: Educação Financeira",
      options: [
        { text: "Tentar até conseguir: cada caixa custa só R$ 5, então o gasto parece pequeno e o item raro vale a pena.", points: 0, why: "Olha o preço de cada caixa e ignora o total gasto até conseguir." },
        { text: "Tentar algumas vezes com a mesada e parar quando o dinheiro acabar, aceitando o resultado do sorteio como ele vier.", points: 2, why: "Define um limite pelo fim do dinheiro, mas sem entender a chance real." },
        { text: "Notar que a chance é baixa e comprar só uma caixa, para ter certeza de que o jogo funciona mesmo desse jeito, e então decidir se continua.", points: 3, why: "Percebe que a chance é baixa, mas ainda gasta sem calcular o custo esperado." },
        { text: "Calcular que, com 2% de chance, seriam necessárias cerca de 50 caixas em média (R$ 250) e decidir não comprar.", points: 4, why: "Calcula o custo esperado e decide com base nele." },
        { text: "Calcular a média de 50 caixas (R$ 250), concluir que não compensa e combinar com um adulto um limite de gastos para jogos.", points: 5, why: "Calcula o custo, decide e define um limite com apoio de um adulto." },
      ],
    },
    {
      number: 4, title: "O Dinheiro da Turma", theme: "Ética e transparência", scene: "cash",
      scenario: "Alex é o tesoureiro da turma. Foram arrecadados R$ 400 para a festa de encerramento e as despesas anotadas somam R$ 360. Na hora de conferir o caixa, faltam R$ 20 por causa de um erro de Alex ao anotar.",
      dialog: "Eu errei na anotação e agora faltam R$ 20. Ninguém percebeu ainda... O que eu devo fazer?",
      prompt: "Qual decisão demonstra a melhor conduta ética e a melhor gestão do dinheiro coletivo?",
      note: "Avalia a conduta ética com dinheiro de terceiros: honestidade, transparência, prestação de contas e prevenção de novos erros.",
      strength: "honestidade e transparência na gestão de dinheiro coletivo",
      retake: "ética no uso de dinheiro coletivo (transparência, prestação de contas e registro compartilhado)",
      bloom: "Avaliar", bncc: "Tema transversal: Educação Financeira; competências gerais 7, 9 e 10",
      options: [
        { text: "Não falar nada, porque a quantia é pequena e ninguém vai notar a diferença quando as contas forem apresentadas à turma.", points: 0, why: "Esconde o erro; o dinheiro é coletivo e exige prestação de contas." },
        { text: "Repor os R$ 20 do próprio bolso e não comentar com ninguém, para evitar desconfiança e perguntas desnecessárias.", points: 2, why: "Corrige o valor, mas esconde o fato e deixa de prestar contas." },
        { text: "Avisar os colegas da diferença, mas ficar de fora da decisão sobre como cobrir a falta, deixando tudo para a turma resolver.", points: 3, why: "É transparente, mas foge da responsabilidade pelo próprio erro." },
        { text: "Conferir as anotações para achar o erro, apresentar à turma o valor que falta e propor repor a diferença.", points: 4, why: "Assume o erro e propõe solução, mas sem comprovantes nem prevenção." },
        { text: "Conferir as anotações, mostrar à turma o valor faltante com os comprovantes, repor a diferença e combinar um registro compartilhado.", points: 5, why: "Assume, comprova, repara e previne novos erros com um registro que todos veem." },
      ],
    },
    {
      number: 5, title: "O Pacto de Cidadania Financeira", theme: "Combinados de dinheiro e internet", scene: "pact",
      scenario: "Alex e os amigos decidem escrever três combinados sobre dinheiro e internet para o grupo, e afixá-los na sala.",
      dialog: "Quero que os combinados sirvam para o grupo todo. Qual conjunto de três regras fica mais completo?",
      prompt: "Qual conjunto de combinados é o mais completo para o grupo?",
      note: "Avalia a criação de combinados que unem planejamento, segurança digital e resistência à pressão de grupo.",
      strength: "criação de combinados que unem planejamento, segurança digital e autonomia diante do grupo",
      retake: "construção de regras pessoais e coletivas de planejamento, segurança digital e resistência à pressão do grupo",
      bloom: "Criar", bncc: "Tema transversal: Educação Financeira; competências gerais 5, 9 e 10",
      options: [
        { text: "1) Comprar o que os amigos comprarem. 2) Postar as compras nas redes. 3) Pedir emprestado a alguém quando faltar dinheiro.", points: 0, why: "Estimula o consumo por pressão do grupo, a exposição e o endividamento." },
        { text: "1) Não gastar dinheiro com nada. 2) Não usar a internet para fazer compras. 3) Guardar todo o dinheiro que entrar, para nunca faltar.", points: 2, why: "Regras extremas: protegem, mas não ensinam a decidir nem a usar o dinheiro." },
        { text: "1) Anotar os gastos de cada um. 2) Não clicar em links de origem desconhecida. 3) Comprar só o que estiver na lista de cada um.", points: 3, why: "Combina planejamento e segurança, mas não prevê a pressão do grupo nem pedir ajuda." },
        { text: "1) Anotar os gastos e guardar uma parte. 2) Desconfiar de prêmios e de pedidos de dados pessoais. 3) Combinar as prioridades do grupo antes de comprar.", points: 4, why: "Cobre planejamento, segurança e prioridades, mas não prevê o apoio de adultos." },
        { text: "1) Anotar os gastos e guardar uma parte. 2) Desconfiar de prêmios e nunca passar senhas. 3) Resistir à pressão do grupo e pedir ajuda a um adulto.", points: 5, why: "Reúne planejamento, segurança digital, autonomia diante do grupo e apoio de adultos." },
      ],
    },
  ],
};
