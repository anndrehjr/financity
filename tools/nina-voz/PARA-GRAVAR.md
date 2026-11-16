# Falas que precisam de áudio (gravar manualmente na ElevenLabs)

O site **não** chama a ElevenLabs e **não** usa outra voz como substituta: enquanto uma fala não tiver áudio, a Nina mostra **só a legenda**.

**Parâmetros da gravação original** (pelo nome do arquivo; **confirmar**): modelo Multilingual v2, velocidade 0,96, estabilidade 57, similaridade 75, exagero de estilo 0, speaker boost ligado, voz "sylphiette".

Como encaixar: gere o áudio no site da ElevenLabs com a mesma voz e parâmetros, salve em `tools/nina-voz/origem/`, registre os cortes em `cortes.json` e a fala em `falas-originais.json`, e rode `cortar.py`.

Já têm áudio: 10. Faltam: 31.

| id | emoção | texto exato (sem ** de negrito) | uso |
|---|---|---|---|
| boas_vindas.1 | alegria | E aí! Eu sou a Nina, Guardiã Veterana. Vou te acompanhar nesta aventura. | Primeira vez que o aluno entra no jogo (depois só com o botão 'Ver tutorial'). |
| boas_vindas.2 | curiosidade | São 4 temas com 8 desafios cada. Escolha a melhor atitude, marque várias ou ordene etapas. | Primeira vez que o aluno entra no jogo (depois só com o botão 'Ver tutorial'). |
| boas_vindas.3 | alegria | Depois de confirmar, a resposta não pode ser trocada. Leia tudo com calma. | Primeira vez que o aluno entra no jogo (depois só com o botão 'Ver tutorial'). |
| boas_vindas.4 | comemoração | Respostas mais bem pensadas valem mais pontos. Errar faz parte de aprender! | Primeira vez que o aluno entra no jogo (depois só com o botão 'Ver tutorial'). |
| boas_vindas.5 | comemoração | Se fechar a página, você continua de onde parou. Bora? | Primeira vez que o aluno entra no jogo (depois só com o botão 'Ver tutorial'). |
| mapa_1.1 | alegria | Tema 1: cidadania financeira. Direitos, deveres e escolhas que afetam todos. | Introdução do Tema 1 — Cidadania Financeira. |
| mapa_2.1 | curiosidade | Tema 2: ética financeira. Honestidade vale mais que qualquer lucro. | Introdução do Tema 2 — Ética Financeira. |
| mapa_3.1 | incentivo | Tema 3: segurança digital. Desconfie de pressa, links e pedidos de código. | Introdução do Tema 3 — Segurança Digital e Privacidade. |
| mapa_4.1 | curiosidade | Tema 4: consumo consciente. Faça as contas antes de se empolgar com promoção. | Introdução do Tema 4 — Consumo Consciente e Matemática. |
| acerto.1 | comemoração | Mandou bem! Boa escolha. | Resposta com pontuação alta (config minAcerto). |
| acerto.2 | comemoração | Isso aí! Pensou com cuidado. | Resposta com pontuação alta (config minAcerto). |
| acerto.3 | alegria | Boa! Seguimos para o próximo. | Resposta com pontuação alta (config minAcerto). |
| parcial.1 | curiosidade | Tem coisa boa aí! Dá para pensar ainda mais. | Resposta com pontuação intermediária. |
| parcial.2 | alegria | Foi um bom caminho. Vamos ao próximo! | Resposta com pontuação intermediária. |
| erro.1 | curiosidade | Essa não foi a melhor. Sem problema, o próximo é uma nova chance. | Resposta com pontuação baixa. |
| erro.2 | incentivo | Errar aqui é melhor que errar com dinheiro de verdade. | Resposta com pontuação baixa. |
| parado.1 | curiosidade | Tá difícil? Respira e releia o enunciado com calma. | Aluno parado na mesma pergunta por segundosParado. |
| parado.2 | curiosidade | Compare as opções uma a uma: qual cuida melhor do dinheiro? | Aluno parado na mesma pergunta por segundosParado. |
| fase_concluida.1 | comemoração | Tema concluído! Que jornada! | Mapa concluído (tela de resultado). |
| fase_concluida.2 | comemoração | Missão cumprida! Bora para o próximo tema? | Mapa concluído (tela de resultado). |
| vitoria.1 | comemoração | VOCÊ CHEGOU AO FIM! Todos os temas concluídos! | Concluiu o último mapa (Mapa 4). |
| vitoria.2 | alegria | Na vida real é igual: pense antes de gastar e cuide do seu dinheiro. | Concluiu o último mapa (Mapa 4). |
| tutorial.primeiros-passos.mapas | alegria | São 4 temas, com 8 desafios cada. Eles abrem um de cada vez, em ordem. | etapa "mapas" do tutorial "Primeiros passos" |
| tutorial.primeiros-passos.entrar | alegria | Vamos começar? Clique em entrar no tema 1. | etapa "entrar" do tutorial "Primeiros passos" |
| tutorial.primeiros-passos.entrar.ok | comemoração | Boa! Agora vamos para o desafio. | reação após a ação (etapa "entrar") |
| tutorial.primeiros-passos.comecar | alegria | Leia a introdução e clique em Começar aventura. | etapa "comecar" do tutorial "Primeiros passos" |
| tutorial.primeiros-passos.comecar.ok | comemoração | Isso! Primeiro desafio na tela. | reação após a ação (etapa "comecar") |
| tutorial.primeiros-passos.opcoes | curiosidade | Leia a situação e escolha a alternativa que você acha mais adequada. | etapa "opcoes" do tutorial "Primeiros passos" |
| tutorial.primeiros-passos.opcoes.ok | alegria | Ótimo! Você pode mudar de ideia até confirmar. | reação após a ação (etapa "opcoes") |
| tutorial.primeiros-passos.confirmar | incentivo | Quando tiver certeza, confirme. Depois disso a resposta não muda. | etapa "confirmar" do tutorial "Primeiros passos" |
| tutorial.primeiros-passos.confirmar.ok | comemoração | Resposta registrada! Você já sabe o caminho. | reação após a ação (etapa "confirmar") |
