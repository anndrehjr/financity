# Financity — Mapas 2, 3 e 4 (rascunho para revisão do professor)

> **Status: RASCUNHO. Nada disto está no banco de dados nem visível para os alunos.** Só será ativado depois da sua aprovação.

## Como ler
- Cada mapa tem **5 questões**, com níveis crescentes da taxonomia de Bloom (revisada): 1 Compreender → 2 Aplicar → 3 Analisar → 4 Avaliar → 5 Criar.
- Cada questão tem 5 alternativas com pontuação **0, 2, 3, 4 e 5** (igual ao Mapa 1; máximo de 25 pontos por mapa). Aqui as alternativas aparecem **da maior para a menor pontuação**; **o aluno vê em ordem embaralhada e sem pontos**.
- "Por quê" é o comentário pedagógico de cada alternativa.
- Aritmética conferida automaticamente (`npx tsx scripts/conferir-contas.ts`: 12 grupos de contas).

## Observações importantes
1. **Códigos da BNCC**: só a **EF08MA04** (porcentagens, Matemática 8º ano) é citada como habilidade. Para as demais, usei o **tema transversal "Educação Financeira"** e as **competências gerais** (2, 5, 6, 7, 9, 10). Os códigos foram confirmados em reproduções da BNCC (Nova Escola, Profez), não no texto oficial: **confira no site do MEC** antes de usar em documento formal.
2. **Chute**: com a escala 0/2/3/4/5, quem marca ao acaso faz em média 2,8 de 5 (**56%**). Isso é inerente à escala do Mapa 1 e foi mantido por compatibilidade. Se quiser reduzir (ex.: 0/1/2/3/5, média 44%), é uma decisão sua; as pontuações são editáveis no painel.
3. **Tamanho das alternativas**: ajustei para que a alternativa certa **não seja a mais longa** (ela é a mais longa em 4 de 15 questões, perto do esperado ao acaso, 3) e eliminei a palavra "sem" como pista.
4. **Ilustrações**: as cenas novas ainda **não existem** (listadas no fim). Até serem criadas, a tela mostraria a ilustração padrão (a do tênis), que não combina com a questão.
5. **Protagonista**: sempre "Alex" (neutro); Bia e Cléo aparecem no Mapa 3 (questão 3).
6. A questão 4 do Mapa 2 é a **questão-modelo que você aprovou**, com Alex no lugar de "Lia".


---

## Mapa 2 — Economia e Decisões: "O Mercado das Escolhas"
**Temas:** Porcentagens, Promoções, Inflação

### Questão 1 — O Desconto em Cadeia
**Tema:** Descontos sucessivos · **Bloom:** Compreender · **BNCC/competências:** EF08MA04; competência geral 2; tema transversal: Educação Financeira

**Cenário:** Alex vê um casaco de R$ 200 numa vitrine com dois anúncios: "50% de desconto" e "mais 10% de desconto no cupom".

**Fala de Alex:** "São 50% mais 10%... então é 60% de desconto, né? Será que a conta é essa mesmo?"

**Pergunta:** Alex acredita que o desconto total é de 60%. Qual atitude demonstra melhor compreensão de como os percentuais funcionam?

| Pontos | Alternativa | Por quê |
|---|---|---|
| **5** | Chegar ao preço de R$ 90 (55% de desconto total) e compará-lo com o orçamento e com o preço em outras lojas. | Calcula corretamente e usa o resultado para decidir com critérios. |
| **4** | Calcular o primeiro desconto (R$ 100) e aplicar os 10% sobre esse novo valor, chegando a R$ 90, ou seja, 55% de desconto total. | Calcula corretamente, mas não compara o resultado com a necessidade nem com outras ofertas. |
| **3** | Estimar que o preço final ficará perto de R$ 90 e comprar logo, deixando para conferir o valor exato apenas quando chegar ao caixa e vir o total. | A estimativa está certa, mas falta verificar o cálculo antes de decidir. |
| **2** | Desconfiar do anúncio e desistir de vez, porque as lojas costumam misturar vários percentuais justamente para confundir quem compra e fazer o cliente gastar mais. | Evita o erro, mas desiste sem calcular; a oferta pode ser boa. |
| **0** | Aceitar os 60% e comprar, porque somar os dois descontos é a maneira mais simples de saber quanto será pago pelo casaco. | Soma os percentuais e erra o preço final (o correto é R$ 90, não R$ 80). |

*O que avalia:* Avalia a compreensão de descontos sucessivos: o segundo percentual incide sobre o valor já reduzido.

*Ponto forte (relatório individual):* interpretação correta de descontos sucessivos e conferência do preço final.  
*Retomar (relatório individual):* cálculo de descontos sucessivos (os percentuais não se somam) e conferência do preço final.

### Questão 2 — O Lanche Mais Caro
**Tema:** Inflação · **Bloom:** Aplicar · **BNCC/competências:** EF08MA04; competência geral 2; tema transversal: Educação Financeira

**Cenário:** Na cantina da escola, o lanche que custava R$ 12 há um ano agora custa R$ 15. A mesada de Alex continua sendo de R$ 60 por mês.

**Fala de Alex:** "Parece pouca diferença, mas minha mesada continua a mesma... Quantos lanches eu consigo comprar agora?"

**Pergunta:** Qual conclusão e atitude mostram o melhor uso das porcentagens para entender o que aconteceu com o dinheiro de Alex?

| Pontos | Alternativa | Por quê |
|---|---|---|
| **5** | Calcular o aumento de 25%, notar que a mesada compra 4 lanches e não 5, e trocar alguns lanches por opções mais baratas ou levar algo de casa. | Calcula, interpreta a perda de poder de compra e busca alternativas. |
| **4** | Calcular o aumento de 25% e perceber que a mesada passou de 5 para 4 lanches por mês, ajustando as compras da semana. | Calcula certo e reorganiza o consumo, mas não busca outras soluções. |
| **3** | Calcular que o aumento foi de 25%, mas continuar comprando como antes e esperar que a mesada aumente em algum momento, quando a família perceber. | Calcula certo, mas não ajusta o comportamento ao novo preço. |
| **2** | Concluir que o preço subiu 3% e que a mesada ainda dá para comprar os mesmos lanches durante o mês inteiro. | Confunde reais com percentual (R$ 3 não é 3%) e conclui errado. |
| **0** | Concluir que o aumento foi de R$ 3, um valor pequeno, e manter os mesmos hábitos de gasto, já que a diferença quase não pesa. | Ignora o efeito acumulado: o lanche ficou 25% mais caro. |

*O que avalia:* Avalia o cálculo de aumento percentual e a noção de perda de poder de compra (inflação).

*Ponto forte (relatório individual):* cálculo de aumento percentual e percepção da perda de poder de compra.  
*Retomar (relatório individual):* cálculo de aumento percentual e efeito da inflação sobre o poder de compra.

### Questão 3 — O Pacote de Cadernos
**Tema:** Preço por unidade · **Bloom:** Analisar · **BNCC/competências:** EF08MA04; competência geral 2; tema transversal: Educação Financeira

**Cenário:** Alex precisa de apenas 1 caderno. A Loja A vende um pacote com 3 cadernos por R$ 54. A Loja B vende cada caderno por R$ 20, com 10% de desconto.

**Fala de Alex:** "O pacote parece vantajoso porque vêm três... mas eu só preciso de um. Qual compensa?"

**Pergunta:** Qual análise das duas ofertas é a mais completa?

| Pontos | Alternativa | Por quê |
|---|---|---|
| **5** | Descobrir que o preço por caderno é igual (R$ 18), comprar só a unidade e preservar R$ 36 para outros objetivos. | Compara por unidade, decide pela necessidade e enxerga o custo de oportunidade. |
| **4** | Calcular o preço por caderno (R$ 18 nas duas lojas) e comprar apenas a unidade, porque só um caderno é necessário agora. | Calcula certo e compra o que precisa, mas não considera guardar a diferença. |
| **3** | Calcular o preço por caderno (R$ 18 nas duas lojas) e escolher o pacote, imaginando que os outros cadernos serão usados um dia. | Calcula certo, mas gasta R$ 36 a mais com algo de que não precisa agora. |
| **2** | Escolher a unidade, pois R$ 18 é menor que R$ 54, deixando de lado quantos cadernos cada oferta traz, já que o total pago é o que importa. | A escolha é boa, mas a razão está errada: compara totais, não preços por unidade. |
| **0** | Escolher o pacote, porque três cadernos por R$ 54 parecem sempre mais vantajosos do que pagar por um caderno apenas. | Acha que quantidade maior é sempre melhor e ignora a necessidade. |

*O que avalia:* Avalia a comparação de ofertas pelo preço por unidade e a relação entre a promoção e a real necessidade.

*Ponto forte (relatório individual):* comparação de ofertas pelo preço por unidade e pela real necessidade.  
*Retomar (relatório individual):* comparação de preço por unidade e risco de comprar mais do que o necessário por causa de pacotes.

### Questão 4 — A Mochila da Black Friday
**Tema:** Falsa promoção · **Bloom:** Avaliar · **BNCC/competências:** EF08MA04; competências gerais 7 e 10; tema transversal: Educação Financeira

**Cenário:** Na Black Friday, Alex viu uma mochila anunciada como "de R$ 250 por R$ 150: 40% de desconto". Ao consultar o histórico de preços, descobriu que no mês passado a mesma mochila custava R$ 160.

**Fala de Alex:** "40% de desconto parece incrível! Mas o histórico mostra outra coisa... O que eu faço?"

**Pergunta:** Qual decisão demonstra o raciocínio financeiro mais completo?

| Pontos | Alternativa | Por quê |
|---|---|---|
| **5** | Calcular o desconto real (cerca de 6%), avaliar se precisa de uma mochila nova e se cabe no orçamento, e só então comparar lojas. | Integra cálculo, necessidade, orçamento e comparação. |
| **4** | Calcular o desconto real em relação ao preço do mês passado e pesquisar o valor da mesma mochila em outras lojas antes de decidir se compra. | Faz o cálculo e a pesquisa, mas não considera a necessidade nem o orçamento. |
| **3** | Perceber que a economia real foi pequena, mas comprar mesmo assim, já que o dinheiro está guardado e a loja tem a mochila de que Alex gostou. | Calcula, mas decide sem avaliar a necessidade nem o orçamento. |
| **2** | Deixar de comprar, porque promoções de fim de ano sempre escondem enganos, e guardar o dinheiro é melhor do que gastar com uma mochila. | Evita a compra impulsiva, mas generaliza e não calcula o desconto real. |
| **0** | Comprar na hora: com 40% de desconto o preço está ótimo, e esperar poderia fazer a promoção acabar antes que Alex consiga pagar. | Cai na urgência e no "preço de" inflado. |

*O que avalia:* Avalia o cálculo do desconto real, a pesquisa de preços e a decisão por necessidade e orçamento.

*Ponto forte (relatório individual):* cálculo do desconto real e decisão baseada em necessidade e orçamento.  
*Retomar (relatório individual):* identificação de falsas promoções (preço inflado) e cálculo do desconto real.

### Questão 5 — Minha Regra para Promoções
**Tema:** Planejamento do consumo · **Bloom:** Criar · **BNCC/competências:** EF08MA04; competências gerais 6 e 10; tema transversal: Educação Financeira

**Cenário:** Depois de tantas ofertas, Alex decide criar uma regra pessoal para não cair em falsas promoções e escreve uma lista de combinados consigo mesmo.

**Fala de Alex:** "Preciso de uma regra que eu consiga seguir sempre. Qual dessas deixa minha lista mais forte?"

**Pergunta:** Qual regra pessoal para lidar com promoções é a mais completa?

| Pontos | Alternativa | Por quê |
|---|---|---|
| **5** | Conferir se o item está na lista, calcular o desconto real pelo histórico de preços, comparar lojas e esperar um dia para decidir. | Combina necessidade, cálculo, comparação e tempo de reflexão. |
| **4** | Calcular o desconto real sobre os preços dos últimos meses, comparar lojas e comprar apenas o que já estava na lista de necessidades feita antes de sair de casa. | Regra sólida, mas sem um tempo de reflexão contra a compra por impulso. |
| **3** | Comparar o preço final com o de outras lojas antes de comprar, deixando para depois a pergunta sobre a necessidade do item. | Compara preços, mas deixa a necessidade de lado. |
| **2** | Nunca comprar nada em promoção, porque o preço normal é sempre o mais justo e evita arrependimentos nas compras do dia a dia. | Regra rígida: evita o erro, mas perde boas oportunidades e não ensina a avaliar. |
| **0** | Comprar sempre que o desconto passar de 30%, porque quanto maior o percentual anunciado, melhor será o negócio para quem compra. | O percentual anunciado não garante bom negócio (o preço de referência pode ser inflado). |

*O que avalia:* Avalia a capacidade de criar um critério próprio e consistente para decisões de compra.

*Ponto forte (relatório individual):* criação de critérios próprios para decidir compras diante de promoções.  
*Retomar (relatório individual):* construção de critérios pessoais de compra (lista, histórico de preços, comparação e tempo de reflexão).

---

## Mapa 3 — Planejamento Financeiro: "O Bairro do Futuro"
**Temas:** Orçamento, Receitas e despesas, Reserva de emergência

### Questão 1 — O Caderno de Contas
**Tema:** Receitas e despesas · **Bloom:** Compreender · **BNCC/competências:** Tema transversal: Educação Financeira; competências gerais 2 e 6

**Cenário:** Alex anotou tudo o que entrou e saiu no mês: mesada de R$ 80, venda de um jogo usado por R$ 30, lanches de R$ 25, presente para um amigo de R$ 20 e recarga do celular de R$ 15.

**Fala de Alex:** "Anotei tudo, mas está uma bagunça. O que é receita, o que é despesa e quanto sobrou?"

**Pergunta:** Qual alternativa organiza melhor as anotações de Alex?

| Pontos | Alternativa | Por quê |
|---|---|---|
| **5** | Receitas de R$ 110, despesas de R$ 60, saldo de R$ 50, separando necessidades e desejos e definindo quanto do saldo será guardado. | Classifica, calcula, distingue e já direciona o saldo para um objetivo. |
| **4** | Receitas de R$ 110, despesas de R$ 60 e saldo de R$ 50, separando a recarga (necessidade) do lanche e do presente (desejos). | Classifica, calcula e distingue necessidades e desejos, mas não decide o saldo. |
| **3** | Receitas de R$ 110, despesas de R$ 60 e saldo de R$ 50, deixando para decidir mais tarde o destino desse saldo. | Classifica e calcula certo, mas não planeja o uso do saldo. |
| **2** | Receitas de R$ 80 (só a mesada) e despesas de R$ 60, com saldo de R$ 20, porque a venda do jogo foi ocasional e não conta. | Separa receitas e despesas, mas ignora uma entrada real de dinheiro. |
| **0** | Tudo o que passou pelas mãos de Alex é dinheiro disponível, então o saldo é de R$ 170, somando todos os valores anotados. | Soma receitas e despesas como se fossem a mesma coisa (170 é a soma de tudo). |

*O que avalia:* Avalia a distinção entre receitas e despesas, o cálculo do saldo e a separação entre necessidades e desejos.

*Ponto forte (relatório individual):* organização de receitas, despesas e saldo, e distinção entre necessidade e desejo.  
*Retomar (relatório individual):* distinção entre receitas e despesas, cálculo do saldo e diferença entre necessidade e desejo.

### Questão 2 — A Mesada em Três Partes
**Tema:** Divisão do orçamento · **Bloom:** Aplicar · **BNCC/competências:** EF08MA04; competências gerais 6 e 10; tema transversal: Educação Financeira

**Cenário:** Alex recebeu R$ 200 de mesada e quer usar a regra 50-30-20: 50% para necessidades, 30% para lazer e 20% para guardar.

**Fala de Alex:** "Em vez de gastar tudo sem pensar, vou dividir em partes. Quanto vai para cada uma?"

**Pergunta:** Qual aplicação da regra e qual atitude demonstram o melhor planejamento?

| Pontos | Alternativa | Por quê |
|---|---|---|
| **5** | Calcular R$ 100, R$ 60 e R$ 40, guardar primeiro os R$ 40, anotar os gastos de cada parte e rever os percentuais se algo mudar. | Calcula, prioriza a poupança e acompanha o plano, ajustando-o quando preciso. |
| **4** | Calcular R$ 100, R$ 60 e R$ 40 e guardar primeiro os R$ 40 da poupança, usando o restante conforme a divisão feita. | Calcula certo e prioriza a poupança, mas não prevê acompanhamento. |
| **3** | Calcular R$ 100, R$ 60 e R$ 40, separar em envelopes e usar a parte do lazer quando surgirem convites ao longo do mês. | Calcula e organiza, mas deixa a poupança para o que sobrar. |
| **2** | Calcular os valores certos (R$ 100, R$ 60 e R$ 40), mas gastar a parte da poupança logo no início do mês, já que o dinheiro está à mão. | O cálculo está certo, mas o comportamento desfaz o plano. |
| **0** | Separar R$ 60 para necessidades, R$ 100 para lazer e R$ 40 para guardar, porque o lazer é a parte mais importante do mês. | Aplica os percentuais na ordem errada (50% seria R$ 100 para necessidades). |

*O que avalia:* Avalia o uso de porcentagens para dividir um orçamento e a atitude de pagar a si mesmo primeiro.

*Ponto forte (relatório individual):* uso de porcentagens para dividir o orçamento e prioridade para a poupança.  
*Retomar (relatório individual):* aplicação de porcentagens ao orçamento e hábito de guardar antes de gastar.

### Questão 3 — O Celular que Quebrou
**Tema:** Reserva de emergência · **Bloom:** Analisar · **BNCC/competências:** Tema transversal: Educação Financeira; competências gerais 6 e 7

**Cenário:** Bia e Cléo recebem a mesma mesada de R$ 100. Bia gasta tudo todo mês. Cléo separa R$ 10 por mês há nove meses. Um dia, o celular das duas quebra e o conserto custa R$ 90.

**Fala de Alex:** "As duas ganham igual e o problema foi o mesmo. Por que uma se saiu melhor que a outra?"

**Pergunta:** Qual análise explica melhor a diferença entre a situação de Bia e a de Cléo?

| Pontos | Alternativa | Por quê |
|---|---|---|
| **5** | Cléo guardou 10% da mesada por nove meses e chegou aos R$ 90 do conserto; Bia poderia ter feito o mesmo. | Explica com os números (10% × 9 meses = R$ 90) e aponta a solução para o futuro. |
| **4** | A diferença está no hábito: Cléo separou parte da mesada todo mês e formou uma reserva que cobriu o imprevisto. | Identifica o hábito de guardar como causa da diferença. |
| **3** | Cléo provavelmente gastou menos com lazer do que Bia durante esses meses, e foi isso que fez a diferença na hora de pagar o conserto. | Plausível, mas não aponta o que de fato diferencia: guardar parte da renda. |
| **2** | Bia deveria pedir dinheiro emprestado para pagar o conserto, pois assim o problema do mês fica resolvido rapidamente. | Resolve o momento, mas cria dívida e não explica a diferença entre as duas. |
| **0** | Cléo teve sorte, porque imprevistos acontecem ao acaso e ninguém consegue se preparar para eles com antecedência, seja qual for o hábito. | Trata o imprevisto como pura sorte; reserva é justamente a preparação. |

*O que avalia:* Avalia a compreensão de que a reserva de emergência se constrói com hábitos regulares, e não com sorte.

*Ponto forte (relatório individual):* compreensão do papel da reserva de emergência e do hábito de guardar regularmente.  
*Retomar (relatório individual):* reserva de emergência e hábito de guardar uma parte da renda antes de o imprevisto acontecer.

### Questão 4 — O Jogo ou a Bicicleta
**Tema:** Prioridades no orçamento · **Bloom:** Avaliar · **BNCC/competências:** Tema transversal: Educação Financeira; competências gerais 6, 7 e 10

**Cenário:** Alex tem R$ 120 guardados e a próxima mesada só chega em duas semanas. Um jogo que Alex quer custa R$ 120. Mas a bicicleta, que Alex usa para ir à escola, precisa de um conserto de R$ 40 nesta semana.

**Fala de Alex:** "Eu tenho dinheiro só para o jogo... mas a bicicleta não pode ficar parada. O que vem primeiro?"

**Pergunta:** Qual decisão demonstra a melhor avaliação das prioridades e do orçamento?

| Pontos | Alternativa | Por quê |
|---|---|---|
| **5** | Pagar o conserto de R$ 40, por ser necessidade urgente, guardar os R$ 80 e marcar uma data para comprar o jogo. | Ordena por urgência e importância e cria um plano com prazo para o desejo. |
| **4** | Pagar o conserto de R$ 40 e manter os R$ 80 restantes como parte do valor do jogo, completando-o com a próxima mesada. | Resolve a necessidade primeiro e planeja o desejo, mas sem definir um prazo. |
| **3** | Comprar o jogo e pedir à família o dinheiro do conserto, já que a bicicleta também é usada por outras pessoas da casa. | A bicicleta é resolvida, mas por dinheiro de outros, e o desejo passa na frente. |
| **2** | Não gastar nada com nenhum dos dois, guardando todo o dinheiro por precaução, mesmo que a bicicleta continue quebrada durante semanas. | Evita gastar, mas deixa uma necessidade real (ir à escola) sem solução. |
| **0** | Comprar o jogo agora, porque Alex o deseja há tempos, e ver depois como resolver o conserto da bicicleta com o dinheiro que aparecer depois. | Prioriza o desejo e deixa a necessidade urgente sem solução. |

*O que avalia:* Avalia a hierarquização de necessidades e desejos diante de um imprevisto, com planejamento do que fica para depois.

*Ponto forte (relatório individual):* hierarquização de necessidades e desejos diante de imprevistos.  
*Retomar (relatório individual):* definição de prioridades entre necessidade urgente e desejo, e planejamento do que fica para depois.

### Questão 5 — O Plano do Fone Novo
**Tema:** Meta e orçamento · **Bloom:** Criar · **BNCC/competências:** Tema transversal: Educação Financeira; competências gerais 6 e 10

**Cenário:** Alex quer comprar um fone de R$ 240 em quatro meses. Todo mês, entram R$ 80 de mesada e cerca de R$ 20 de pequenos trabalhos, num total de R$ 100.

**Fala de Alex:** "Quero montar um plano de verdade para juntar esse dinheiro. Qual caminho é o mais viável?"

**Pergunta:** Qual plano tem mais chances de dar certo?

| Pontos | Alternativa | Por quê |
|---|---|---|
| **5** | Guardar R$ 60 por mês, reservar R$ 40 para gastos e prever um ajuste de prazo se a renda dos trabalhos cair em algum mês, mantendo a meta. | Plano viável, acompanhado e flexível diante de imprevistos de renda. |
| **4** | Guardar R$ 60 por mês, reservar R$ 40 para os gastos do mês e anotar o que for gasto para conferir se está dentro do plano. | Plano completo e viável, mas sem previsão para meses com renda menor. |
| **3** | Guardar R$ 60 por mês, que juntam os R$ 240 em quatro meses, e decidir os gastos do restante conforme os convites surgirem. | Valor mensal certo, mas sem reservar nem acompanhar o dinheiro dos gastos. |
| **2** | Guardar R$ 100 por mês, usando toda a renda, para ter o fone em pouco mais de dois meses. | Cálculo correto, mas inviável: não deixa nada para os gastos do mês. |
| **0** | Guardar o que sobrar no fim de cada mês e, se sobrar pouco, esperar o tempo que for preciso até juntar os R$ 240. | Não há meta mensal nem prazo; a sobra costuma ser zero. |

*O que avalia:* Avalia a elaboração de um plano financeiro com meta, prazo, valor mensal e previsão de ajustes.

*Ponto forte (relatório individual):* elaboração de um plano com meta, prazo, valor mensal e margem para imprevistos.  
*Retomar (relatório individual):* construção de um plano financeiro com meta, prazo e valor mensal viável.

---

## Mapa 4 — Cidadania Financeira: "A Cidade Digital"
**Temas:** Ética, Segurança, Prioridades financeiras

### Questão 1 — A Mensagem Premiada
**Tema:** Golpes digitais · **Bloom:** Compreender · **BNCC/competências:** Tema transversal: Educação Financeira; competências gerais 5 e 10

**Cenário:** Alex recebe uma mensagem: "Parabéns! Você ganhou R$ 500! Clique agora no link e informe seus dados para receber o prêmio."

**Fala de Alex:** "Eu nem participei de sorteio nenhum... mas o prêmio parece tão real! O que será que isso significa?"

**Pergunta:** Qual interpretação da mensagem demonstra melhor compreensão dos sinais de golpe?

| Pontos | Alternativa | Por quê |
|---|---|---|
| **5** | É um golpe pelos mesmos sinais (prêmio inesperado, pressa e pedido de dados): Alex não clica, bloqueia o número, apaga e avisa um adulto da família. | Identifica os sinais, evita o risco e compartilha o alerta. |
| **4** | É um golpe: promete um prêmio de um sorteio que Alex não disputou, cria pressa e pede dados pessoais. Por isso não deve clicar. | Identifica os sinais e evita o link, mas não aciona ajuda. |
| **3** | Parece um golpe, mas vale abrir o link só para olhar a página, desde que Alex não digite nenhuma informação pessoal. | Desconfia, mas abrir o link já pode expor o aparelho a riscos. |
| **2** | É um golpe, então basta apagar a mensagem e não contar nada a ninguém, para não preocupar a família à toa. | Reconhece o golpe, mas não alerta ninguém que possa ajudar ou ser alvo também. |
| **0** | É um prêmio verdadeiro, porque a mensagem cita o nome de Alex e usa o logotipo de uma loja bem conhecida. | Nome e logotipo são fáceis de copiar e não provam que a mensagem é real. |

*O que avalia:* Avalia a identificação de sinais de golpe digital (prêmio inesperado, pressa e pedido de dados) e a reação segura.

*Ponto forte (relatório individual):* identificação de sinais de golpe digital e reação segura.  
*Retomar (relatório individual):* sinais de golpes digitais (prêmio inesperado, pressa, pedido de dados) e como reagir.

### Questão 2 — Pagar à Vista ou Parcelar
**Tema:** Custo do parcelamento · **Bloom:** Aplicar · **BNCC/competências:** EF08MA04; competências gerais 6 e 10; tema transversal: Educação Financeira

**Cenário:** Alex quer um acessório que custa R$ 300 à vista. A loja oferece o mesmo item em 3 parcelas de R$ 110.

**Fala de Alex:** "R$ 110 por mês parece pouco... mas, somando as parcelas, será que paga mais?"

**Pergunta:** Qual atitude demonstra o melhor uso das porcentagens para decidir entre pagar à vista e parcelar?

| Pontos | Alternativa | Por quê |
|---|---|---|
| **5** | Calcular o acréscimo de R$ 30 (10%): se não houver urgência, juntar o valor e pagar à vista; senão, ver se a parcela cabe. | Calcula e decide conforme a urgência e o orçamento. |
| **4** | Calcular que parcelar custa R$ 30 a mais (10%) e comparar esse valor com o que a espera para comprar à vista permitiria economizar. | Calcula o acréscimo e compara com alternativas, mas não avalia a urgência. |
| **3** | Pagar à vista usando toda a reserva, porque qualquer acréscimo no preço é sempre ruim e deve ser evitado a qualquer custo, mesmo que isso esvazie as economias. | Evita o acréscimo, mas esvazia a reserva e não calcula o percentual. |
| **2** | Calcular que parcelar custa R$ 30 a mais e deixar a decisão final para outra pessoa da família, ficando de fora da conversa. | Calcula o acréscimo, mas abre mão de decidir e de entender o percentual. |
| **0** | Parcelar, porque R$ 110 por mês parece pouco e cabe no bolso, e o dinheiro que já está guardado fica intacto. | Olha só para o valor da parcela e ignora o total pago. |

*O que avalia:* Avalia o cálculo do acréscimo percentual do parcelamento e a decisão ligada à urgência e ao orçamento.

*Ponto forte (relatório individual):* cálculo do custo do parcelamento e decisão por urgência e orçamento.  
*Retomar (relatório individual):* cálculo do acréscimo do parcelamento em porcentagem e decisão entre pagar à vista e parcelar.

### Questão 3 — As Caixas Surpresa
**Tema:** Jogos e gastos dentro de aplicativos · **Bloom:** Analisar · **BNCC/competências:** EF08MA04 (porcentagem); competências gerais 5, 7 e 10; tema transversal: Educação Financeira

**Cenário:** Num jogo online, cada caixa surpresa custa R$ 5 e tem 2% de chance de trazer o item raro que Alex quer. Um amigo diz: "É só tentar mais algumas vezes!"

**Fala de Alex:** "É só R$ 5 por caixa... mas será que realmente compensa tentar até conseguir o item?"

**Pergunta:** Qual análise do risco e do custo é a mais completa?

| Pontos | Alternativa | Por quê |
|---|---|---|
| **5** | Calcular a média de 50 caixas (R$ 250), concluir que não compensa e combinar com um adulto um limite de gastos para jogos. | Calcula o custo, decide e define um limite com apoio de um adulto. |
| **4** | Calcular que, com 2% de chance, seriam necessárias cerca de 50 caixas em média (R$ 250) e decidir não comprar. | Calcula o custo esperado e decide com base nele. |
| **3** | Notar que a chance é baixa e comprar só uma caixa, para ter certeza de que o jogo funciona mesmo desse jeito, e então decidir se continua. | Percebe que a chance é baixa, mas ainda gasta sem calcular o custo esperado. |
| **2** | Tentar algumas vezes com a mesada e parar quando o dinheiro acabar, aceitando o resultado do sorteio como ele vier. | Define um limite pelo fim do dinheiro, mas sem entender a chance real. |
| **0** | Tentar até conseguir: cada caixa custa só R$ 5, então o gasto parece pequeno e o item raro vale a pena. | Olha o preço de cada caixa e ignora o total gasto até conseguir. |

*O que avalia:* Avalia a análise de probabilidade e custo em compras dentro de jogos, e a busca de apoio para definir limites.

*Ponto forte (relatório individual):* análise de risco e custo em compras dentro de jogos e definição de limites.  
*Retomar (relatório individual):* probabilidade e custo em caixas surpresa e importância de combinar limites de gastos em jogos.

### Questão 4 — O Dinheiro da Turma
**Tema:** Ética e transparência · **Bloom:** Avaliar · **BNCC/competências:** Tema transversal: Educação Financeira; competências gerais 7, 9 e 10

**Cenário:** Alex é o tesoureiro da turma. Foram arrecadados R$ 400 para a festa de encerramento e as despesas anotadas somam R$ 360. Na hora de conferir o caixa, faltam R$ 20 por causa de um erro de Alex ao anotar.

**Fala de Alex:** "Eu errei na anotação e agora faltam R$ 20. Ninguém percebeu ainda... O que eu devo fazer?"

**Pergunta:** Qual decisão demonstra a melhor conduta ética e a melhor gestão do dinheiro coletivo?

| Pontos | Alternativa | Por quê |
|---|---|---|
| **5** | Conferir as anotações, mostrar à turma o valor faltante com os comprovantes, repor a diferença e combinar um registro compartilhado. | Assume, comprova, repara e previne novos erros com um registro que todos veem. |
| **4** | Conferir as anotações para achar o erro, apresentar à turma o valor que falta e propor repor a diferença. | Assume o erro e propõe solução, mas sem comprovantes nem prevenção. |
| **3** | Avisar os colegas da diferença, mas ficar de fora da decisão sobre como cobrir a falta, deixando tudo para a turma resolver. | É transparente, mas foge da responsabilidade pelo próprio erro. |
| **2** | Repor os R$ 20 do próprio bolso e não comentar com ninguém, para evitar desconfiança e perguntas desnecessárias. | Corrige o valor, mas esconde o fato e deixa de prestar contas. |
| **0** | Não falar nada, porque a quantia é pequena e ninguém vai notar a diferença quando as contas forem apresentadas à turma. | Esconde o erro; o dinheiro é coletivo e exige prestação de contas. |

*O que avalia:* Avalia a conduta ética com dinheiro de terceiros: honestidade, transparência, prestação de contas e prevenção de novos erros.

*Ponto forte (relatório individual):* honestidade e transparência na gestão de dinheiro coletivo.  
*Retomar (relatório individual):* ética no uso de dinheiro coletivo (transparência, prestação de contas e registro compartilhado).

### Questão 5 — O Pacto de Cidadania Financeira
**Tema:** Combinados de dinheiro e internet · **Bloom:** Criar · **BNCC/competências:** Tema transversal: Educação Financeira; competências gerais 5, 9 e 10

**Cenário:** Alex e os amigos decidem escrever três combinados sobre dinheiro e internet para o grupo, e afixá-los na sala.

**Fala de Alex:** "Quero que os combinados sirvam para o grupo todo. Qual conjunto de três regras fica mais completo?"

**Pergunta:** Qual conjunto de combinados é o mais completo para o grupo?

| Pontos | Alternativa | Por quê |
|---|---|---|
| **5** | 1) Anotar os gastos e guardar uma parte. 2) Desconfiar de prêmios e nunca passar senhas. 3) Resistir à pressão do grupo e pedir ajuda a um adulto. | Reúne planejamento, segurança digital, autonomia diante do grupo e apoio de adultos. |
| **4** | 1) Anotar os gastos e guardar uma parte. 2) Desconfiar de prêmios e de pedidos de dados pessoais. 3) Combinar as prioridades do grupo antes de comprar. | Cobre planejamento, segurança e prioridades, mas não prevê o apoio de adultos. |
| **3** | 1) Anotar os gastos de cada um. 2) Não clicar em links de origem desconhecida. 3) Comprar só o que estiver na lista de cada um. | Combina planejamento e segurança, mas não prevê a pressão do grupo nem pedir ajuda. |
| **2** | 1) Não gastar dinheiro com nada. 2) Não usar a internet para fazer compras. 3) Guardar todo o dinheiro que entrar, para nunca faltar. | Regras extremas: protegem, mas não ensinam a decidir nem a usar o dinheiro. |
| **0** | 1) Comprar o que os amigos comprarem. 2) Postar as compras nas redes. 3) Pedir emprestado a alguém quando faltar dinheiro. | Estimula o consumo por pressão do grupo, a exposição e o endividamento. |

*O que avalia:* Avalia a criação de combinados que unem planejamento, segurança digital e resistência à pressão de grupo.

*Ponto forte (relatório individual):* criação de combinados que unem planejamento, segurança digital e autonomia diante do grupo.  
*Retomar (relatório individual):* construção de regras pessoais e coletivas de planejamento, segurança digital e resistência à pressão do grupo.

---

## Ilustrações a criar (chave da cena → questão)
- `snack` → Mapa 2, questão 2 (O Lanche Mais Caro)
- `packs` → Mapa 2, questão 3 (O Pacote de Cadernos)
- `bag` → Mapa 2, questão 4 (A Mochila da Black Friday)
- `plan` → Mapa 2, questão 5 (Minha Regra para Promoções)
- `ledger` → Mapa 3, questão 1 (O Caderno de Contas)
- `envelopes` → Mapa 3, questão 2 (A Mesada em Três Partes)
- `phone` → Mapa 3, questão 3 (O Celular que Quebrou)
- `bike` → Mapa 3, questão 4 (O Jogo ou a Bicicleta)
- `goal` → Mapa 3, questão 5 (O Plano do Fone Novo)
- `message` → Mapa 4, questão 1 (A Mensagem Premiada)
- `install` → Mapa 4, questão 2 (Pagar à Vista ou Parcelar)
- `lootbox` → Mapa 4, questão 3 (As Caixas Surpresa)
- `cash` → Mapa 4, questão 4 (O Dinheiro da Turma)
- `pact` → Mapa 4, questão 5 (O Pacto de Cidadania Financeira)

## Lista de conferência para o professor
- [ ] A linguagem está adequada à turma do 8º ano?
- [ ] Os cenários são realistas para a realidade dos alunos (valores, situações)?
- [ ] A ordem de dificuldade (Bloom) faz sentido para a sequência de aulas?
- [ ] As justificativas ("por quê") estão corretas e didáticas?
- [ ] Algum tema precisa ser trocado ou algum valor, ajustado?
- [ ] Confirmo os códigos da BNCC no site do MEC.
