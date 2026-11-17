# Inventário das falas da Nina

Gerado por `npx tsx tools/nina-voz/inventario.ts`. Catálogo único: `apps/web/src/data/nina/falas.json`.

## Resumo
- Falas no catálogo: **38** (ativas: 38; inativas/código morto: 0).
- Com áudio da gravação original: **37**.
- **Sem áudio (ativas): 1**, somando **73 caracteres** a gerar (73 se contar as inativas).
- Plano gratuito da ElevenLabs: ~10.000 créditos/mês (1 crédito ≈ 1 caractere no multilingual v2). 73 caracteres cabem com folga; refazer falas ruins gasta créditos de novo.

## Tabela

| id | público | tela | texto | já tem áudio? | caracteres | observação |
|---|---|---|---|---|---|---|
| mapa_1.1 | 8 | Atividade — introdução do tema 1 | Tema 1: **cidadania financeira**. Direitos, deveres e escolhas que afetam todos. | **sim (original)** | 76 | número fixo no texto (4 temas / 8 desafios): vira falso se o nº mudar |
| mapa_2.1 | 8 | Atividade — introdução do tema 2 | Tema 2: **ética financeira**. Honestidade vale mais que qualquer lucro. | **sim (original)** | 67 | número fixo no texto (4 temas / 8 desafios): vira falso se o nº mudar |
| mapa_3.1 | 8 | Atividade — introdução do tema 3 | Tema 3: **segurança digital**. Desconfie de pressa, links e pedidos de código. | **sim (original)** | 74 | número fixo no texto (4 temas / 8 desafios): vira falso se o nº mudar |
| mapa_4.1 | 8 | Atividade — introdução do tema 4 | Tema 4: **consumo consciente**. Faça as contas antes de se empolgar com promoção. | **sim (original)** | 77 | número fixo no texto (4 temas / 8 desafios): vira falso se o nº mudar |
| acerto.1 | geral | Atividade — logo após confirmar (pontuação alta) | Mandou bem! Boa escolha. | **sim (original)** | 24 | sorteio: 1 áudio por variação |
| acerto.2 | geral | Atividade — logo após confirmar (pontuação alta) | Isso aí! Pensou com cuidado. | **sim (original)** | 28 | sorteio: 1 áudio por variação |
| acerto.3 | geral | Atividade — logo após confirmar (pontuação alta) | Boa! Seguimos para o próximo. | **sim (original)** | 29 | sorteio: 1 áudio por variação |
| parcial.1 | geral | Atividade — logo após confirmar (pontuação média) | Tem coisa boa aí! Dá para pensar ainda mais. | **sim (original)** | 44 | sorteio: 1 áudio por variação |
| parcial.2 | geral | Atividade — logo após confirmar (pontuação média) | Foi um bom caminho. Vamos ao próximo! | **sim (original)** | 37 | sorteio: 1 áudio por variação |
| erro.1 | geral | Atividade — logo após confirmar (pontuação baixa) | Essa não foi a melhor. Sem problema, o próximo é uma nova chance. | **sim (original)** | 65 | sorteio: 1 áudio por variação |
| erro.2 | geral | Atividade — logo após confirmar (pontuação baixa) | Errar aqui é melhor que errar com **dinheiro de verdade**. | **sim (original)** | 54 | sorteio: 1 áudio por variação |
| parado.1 | geral | Atividade — 30 s sem responder | Tá difícil? Respira e **releia o enunciado** com calma. | **sim (original)** | 51 | sorteio: 1 áudio por variação |
| parado.2 | geral | Atividade — 30 s sem responder | Compare as opções uma a uma: qual cuida melhor do dinheiro? | **sim (original)** | 59 | sorteio: 1 áudio por variação |
| fase_concluida.1 | geral | Resultado do tema | Tema concluído! Que jornada! | **sim (original)** | 28 | sorteio: 1 áudio por variação |
| fase_concluida.2 | geral | Resultado do tema | Missão cumprida! Bora para o próximo tema? | **sim (original)** | 42 | sorteio: 1 áudio por variação |
| vitoria.1 | geral | Resultado do último tema | VOCÊ CHEGOU AO FIM! Todos os temas concluídos! | **sim (original)** | 46 | — |
| vitoria.2 | geral | Resultado do último tema | Na vida real é igual: **pense antes de gastar** e cuide do seu dinheiro. | **sim (original)** | 68 | — |
| sem_temas.1 | geral | Mapas — série sem temas publicados ("Seus temas chegam em breve!") | Seus temas chegam em breve! Quando estiverem prontos, eles aparecem aqui. | não | 73 | — |
| tutorial.primeiros-passos.abertura-1 | geral | Tutorial (mapas e atividade) | Oiê! Que alegria ter você aqui. | **sim (original)** | 31 | — |
| tutorial.primeiros-passos.abertura-2 | geral | Tutorial (mapas e atividade) | Eu sou a **Nina**, sua amiga e guia nesta incrível aventura pelo mundo da educação financeira. | **sim (original)** | 90 | — |
| tutorial.primeiros-passos.abertura-3 | geral | Tutorial (mapas e atividade) | Seja muito bem-vindo ao **Financity**. | **sim (original)** | 34 | masculino (gravação original) |
| tutorial.primeiros-passos.abertura-4 | geral | Tutorial (mapas e atividade) | Você já parou para pensar em como pequenas decisões podem transformar o seu futuro? | **sim (original)** | 83 | — |
| tutorial.primeiros-passos.abertura-5 | geral | Tutorial (mapas e atividade) | Pois é. Às vezes, uma escolha que parece simples pode fazer uma diferença enorme na nossa vida. E é exatamente isso que vamos descobrir juntos. | **sim (original)** | 143 | — |
| tutorial.primeiros-passos.abertura-6 | geral | Tutorial (mapas e atividade) | Aqui no Financity, você vai aprender a cuidar do seu dinheiro, planejar seus sonhos, entender como funcionam os investimentos e descobrir os desafios de administrar uma empresa. | **sim (original)** | 177 | — |
| tutorial.primeiros-passos.abertura-7 | geral | Tutorial (mapas e atividade) | Mas calma, não precisa saber tudo agora. Eu vou estar aqui para ajudar você em cada etapa dessa jornada. | **sim (original)** | 104 | — |
| tutorial.primeiros-passos.abertura-8 | geral | Tutorial (mapas e atividade) | Afinal, o mais importante não é acertar tudo de primeira, mas compreender o que estamos aprendendo. Agora me conta, você está preparado para começar essa aventura? | **sim (original)** | 163 | masculino (gravação original) |
| tutorial.primeiros-passos.abertura-9 | geral | Tutorial (mapas e atividade) | Eu estou super animada. Então vamos lá. Respire fundo, prepare suas ideias e venha comigo explorar o incrível mundo da educação financeira. | **sim (original)** | 139 | — |
| tutorial.primeiros-passos.mapas | geral | Tutorial (mapas e atividade) | São **4 temas**, com 8 desafios cada. Eles abrem um de cada vez, em ordem. | **sim (original)** | 70 | número fixo no texto (4 temas / 8 desafios): vira falso se o nº mudar |
| tutorial.primeiros-passos.entrar | geral | Tutorial (mapas e atividade) | Vamos começar? **Clique** em entrar no tema 1. | **sim (original)** | 42 | número fixo no texto (4 temas / 8 desafios): vira falso se o nº mudar |
| tutorial.primeiros-passos.entrar.ok | geral | Tutorial (mapas e atividade) | Boa! Agora vamos para o desafio. | **sim (original)** | 32 | — |
| tutorial.primeiros-passos.comecar | geral | Tutorial (mapas e atividade) | Leia a introdução e clique em **Começar aventura**. | **sim (original)** | 47 | — |
| tutorial.primeiros-passos.comecar.ok | geral | Tutorial (mapas e atividade) | Isso! Primeiro desafio na tela. | **sim (original)** | 31 | — |
| tutorial.primeiros-passos.opcoes | geral | Tutorial (mapas e atividade) | Leia a situação e **escolha** a alternativa que você acha mais adequada. | **sim (original)** | 68 | — |
| tutorial.primeiros-passos.opcoes.ok | geral | Tutorial (mapas e atividade) | Ótimo! Você pode mudar de ideia até confirmar. | **sim (original)** | 46 | — |
| tutorial.primeiros-passos.confirmar | geral | Tutorial (mapas e atividade) | Quando tiver certeza, **confirme**. Depois disso a resposta não muda. | **sim (original)** | 65 | — |
| tutorial.primeiros-passos.confirmar.ok | geral | Tutorial (mapas e atividade) | Resposta registrada! Você já sabe o caminho. | **sim (original)** | 44 | — |
| tutorial.primeiros-passos.tchau | geral | Tutorial (mapas e atividade) | Eu sou a **Nina** e estarei ao seu lado nessa jornada. Até já, futuro empreendedor. | **sim (original)** | 79 | masculino (gravação original) |
| guia.sem-pressa | geral | Tutorial — plano B (tempo-limite) | Sem pressa! Se quiser, pode continuar sem fazer isso agora. | **sim (original)** | 59 | — |
