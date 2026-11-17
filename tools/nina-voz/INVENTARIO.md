# Inventário das falas da Nina

Gerado por `npx tsx tools/nina-voz/inventario.ts`. Catálogo único: `apps/web/src/data/nina/falas.json`.

## Resumo
- Falas no catálogo: **37** (ativas: 37; inativas/código morto: 0).
- Com áudio da gravação original: **10**.
- **Sem áudio (ativas): 27**, somando **1373 caracteres** a gerar (1373 se contar as inativas).
- Plano gratuito da ElevenLabs: ~10.000 créditos/mês (1 crédito ≈ 1 caractere no multilingual v2). 1373 caracteres cabem com folga; refazer falas ruins gasta créditos de novo.

## Tabela

| id | tela | texto | já tem áudio? | caracteres | observação |
|---|---|---|---|---|---|
| mapa_1.1 | Atividade — introdução do tema 1 | Tema 1: **cidadania financeira**. Direitos, deveres e escolhas que afetam todos. | não | 76 | número fixo no texto (4 temas / 8 desafios): vira falso se o nº mudar |
| mapa_2.1 | Atividade — introdução do tema 2 | Tema 2: **ética financeira**. Honestidade vale mais que qualquer lucro. | não | 67 | número fixo no texto (4 temas / 8 desafios): vira falso se o nº mudar |
| mapa_3.1 | Atividade — introdução do tema 3 | Tema 3: **segurança digital**. Desconfie de pressa, links e pedidos de código. | não | 74 | número fixo no texto (4 temas / 8 desafios): vira falso se o nº mudar |
| mapa_4.1 | Atividade — introdução do tema 4 | Tema 4: **consumo consciente**. Faça as contas antes de se empolgar com promoção. | não | 77 | número fixo no texto (4 temas / 8 desafios): vira falso se o nº mudar |
| acerto.1 | Atividade — logo após confirmar (pontuação alta) | Mandou bem! Boa escolha. | não | 24 | sorteio: 1 áudio por variação |
| acerto.2 | Atividade — logo após confirmar (pontuação alta) | Isso aí! Pensou com cuidado. | não | 28 | sorteio: 1 áudio por variação |
| acerto.3 | Atividade — logo após confirmar (pontuação alta) | Boa! Seguimos para o próximo. | não | 29 | sorteio: 1 áudio por variação |
| parcial.1 | Atividade — logo após confirmar (pontuação média) | Tem coisa boa aí! Dá para pensar ainda mais. | não | 44 | sorteio: 1 áudio por variação |
| parcial.2 | Atividade — logo após confirmar (pontuação média) | Foi um bom caminho. Vamos ao próximo! | não | 37 | sorteio: 1 áudio por variação |
| erro.1 | Atividade — logo após confirmar (pontuação baixa) | Essa não foi a melhor. Sem problema, o próximo é uma nova chance. | não | 65 | sorteio: 1 áudio por variação |
| erro.2 | Atividade — logo após confirmar (pontuação baixa) | Errar aqui é melhor que errar com **dinheiro de verdade**. | não | 54 | sorteio: 1 áudio por variação |
| parado.1 | Atividade — 30 s sem responder | Tá difícil? Respira e **releia o enunciado** com calma. | não | 51 | sorteio: 1 áudio por variação |
| parado.2 | Atividade — 30 s sem responder | Compare as opções uma a uma: qual cuida melhor do dinheiro? | não | 59 | sorteio: 1 áudio por variação |
| fase_concluida.1 | Resultado do tema | Tema concluído! Que jornada! | não | 28 | sorteio: 1 áudio por variação |
| fase_concluida.2 | Resultado do tema | Missão cumprida! Bora para o próximo tema? | não | 42 | sorteio: 1 áudio por variação |
| vitoria.1 | Resultado do último tema | VOCÊ CHEGOU AO FIM! Todos os temas concluídos! | não | 46 | — |
| vitoria.2 | Resultado do último tema | Na vida real é igual: **pense antes de gastar** e cuide do seu dinheiro. | não | 68 | — |
| tutorial.primeiros-passos.abertura-1 | Tutorial (mapas e atividade) | Oiê! Que alegria ter você aqui. | **sim (original)** | 31 | — |
| tutorial.primeiros-passos.abertura-2 | Tutorial (mapas e atividade) | Eu sou a **Nina**, sua amiga e guia nesta incrível aventura pelo mundo da educação financeira. | **sim (original)** | 90 | — |
| tutorial.primeiros-passos.abertura-3 | Tutorial (mapas e atividade) | Seja muito bem-vindo ao **Financity**. | **sim (original)** | 34 | masculino (gravação original) |
| tutorial.primeiros-passos.abertura-4 | Tutorial (mapas e atividade) | Você já parou para pensar em como pequenas decisões podem transformar o seu futuro? | **sim (original)** | 83 | — |
| tutorial.primeiros-passos.abertura-5 | Tutorial (mapas e atividade) | Pois é. Às vezes, uma escolha que parece simples pode fazer uma diferença enorme na nossa vida. E é exatamente isso que vamos descobrir juntos. | **sim (original)** | 143 | — |
| tutorial.primeiros-passos.abertura-6 | Tutorial (mapas e atividade) | Aqui no Financity, você vai aprender a cuidar do seu dinheiro, planejar seus sonhos, entender como funcionam os investimentos e descobrir os desafios de administrar uma empresa. | **sim (original)** | 177 | — |
| tutorial.primeiros-passos.abertura-7 | Tutorial (mapas e atividade) | Mas calma, não precisa saber tudo agora. Eu vou estar aqui para ajudar você em cada etapa dessa jornada. | **sim (original)** | 104 | — |
| tutorial.primeiros-passos.abertura-8 | Tutorial (mapas e atividade) | Afinal, o mais importante não é acertar tudo de primeira, mas compreender o que estamos aprendendo. Agora me conta, você está preparado para começar essa aventura? | **sim (original)** | 163 | masculino (gravação original) |
| tutorial.primeiros-passos.abertura-9 | Tutorial (mapas e atividade) | Eu estou super animada. Então vamos lá. Respire fundo, prepare suas ideias e venha comigo explorar o incrível mundo da educação financeira. | **sim (original)** | 139 | — |
| tutorial.primeiros-passos.mapas | Tutorial (mapas e atividade) | São **4 temas**, com 8 desafios cada. Eles abrem um de cada vez, em ordem. | não | 70 | número fixo no texto (4 temas / 8 desafios): vira falso se o nº mudar |
| tutorial.primeiros-passos.entrar | Tutorial (mapas e atividade) | Vamos começar? **Clique** em entrar no tema 1. | não | 42 | número fixo no texto (4 temas / 8 desafios): vira falso se o nº mudar |
| tutorial.primeiros-passos.entrar.ok | Tutorial (mapas e atividade) | Boa! Agora vamos para o desafio. | não | 32 | — |
| tutorial.primeiros-passos.comecar | Tutorial (mapas e atividade) | Leia a introdução e clique em **Começar aventura**. | não | 47 | — |
| tutorial.primeiros-passos.comecar.ok | Tutorial (mapas e atividade) | Isso! Primeiro desafio na tela. | não | 31 | — |
| tutorial.primeiros-passos.opcoes | Tutorial (mapas e atividade) | Leia a situação e **escolha** a alternativa que você acha mais adequada. | não | 68 | — |
| tutorial.primeiros-passos.opcoes.ok | Tutorial (mapas e atividade) | Ótimo! Você pode mudar de ideia até confirmar. | não | 46 | — |
| tutorial.primeiros-passos.confirmar | Tutorial (mapas e atividade) | Quando tiver certeza, **confirme**. Depois disso a resposta não muda. | não | 65 | — |
| tutorial.primeiros-passos.confirmar.ok | Tutorial (mapas e atividade) | Resposta registrada! Você já sabe o caminho. | não | 44 | — |
| tutorial.primeiros-passos.tchau | Tutorial (mapas e atividade) | Eu sou a **Nina** e estarei ao seu lado nessa jornada. Até já, futuro empreendedor. | **sim (original)** | 79 | masculino (gravação original) |
| guia.sem-pressa | Tutorial — plano B (tempo-limite) | Sem pressa! Se quiser, pode continuar sem fazer isso agora. | não | 59 | — |
