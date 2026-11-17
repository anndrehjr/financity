# Falas para gerar na ElevenLabs — arquivo único (modo manual)

Gerado por `npx tsx tools/nina-voz/gerar.ts`. O site **não** chama a ElevenLabs.

## Configuração (igual à gravação original)
Modelo **Eleven Multilingual v2** · Voz **sylphiette** · Velocidade **0,96** · Estabilidade **57** · Similaridade **75** · Exagero de estilo **0** · Speaker boost **ligado**

## Como fazer (1 geração só)
1. Abra o arquivo `PARA-GERAR-UNICO.txt` (nesta pasta) e **copie todo o texto**.
2. No *Text to Speech* da ElevenLabs, com a configuração acima, **cole tudo** e clique em *Generate*. (1373 caracteres; o limite por geração é 2500.)
3. Ouça. Se a voz **ler em voz alta** as marcas `<break ... />`, use o arquivo `PARA-GERAR-UNICO-sem-pausas.txt` no lugar.
4. Baixe o MP3 e salve em `tools/nina-voz/origem/geradas/` com o nome `todas.mp3`.
5. Me avise. Eu transcrevo, corto cada fala no lugar certo, normalizo o volume e mostro uma tabela (fala × trecho) para você aprovar antes de publicar.

## Ordem das falas dentro do áudio (27 falas, 1373 caracteres)
| # | id | tela | texto |
|---|---|---|---|
| 1 | mapa_1.1 | Atividade — introdução do tema 1 | Tema 1: cidadania financeira. Direitos, deveres e escolhas que afetam todos. |
| 2 | mapa_2.1 | Atividade — introdução do tema 2 | Tema 2: ética financeira. Honestidade vale mais que qualquer lucro. |
| 3 | mapa_3.1 | Atividade — introdução do tema 3 | Tema 3: segurança digital. Desconfie de pressa, links e pedidos de código. |
| 4 | mapa_4.1 | Atividade — introdução do tema 4 | Tema 4: consumo consciente. Faça as contas antes de se empolgar com promoção. |
| 5 | acerto.1 | Atividade — logo após confirmar (pontuação alta) | Mandou bem! Boa escolha. |
| 6 | acerto.2 | Atividade — logo após confirmar (pontuação alta) | Isso aí! Pensou com cuidado. |
| 7 | acerto.3 | Atividade — logo após confirmar (pontuação alta) | Boa! Seguimos para o próximo. |
| 8 | parcial.1 | Atividade — logo após confirmar (pontuação média) | Tem coisa boa aí! Dá para pensar ainda mais. |
| 9 | parcial.2 | Atividade — logo após confirmar (pontuação média) | Foi um bom caminho. Vamos ao próximo! |
| 10 | erro.1 | Atividade — logo após confirmar (pontuação baixa) | Essa não foi a melhor. Sem problema, o próximo é uma nova chance. |
| 11 | erro.2 | Atividade — logo após confirmar (pontuação baixa) | Errar aqui é melhor que errar com dinheiro de verdade. |
| 12 | parado.1 | Atividade — 30 s sem responder | Tá difícil? Respira e releia o enunciado com calma. |
| 13 | parado.2 | Atividade — 30 s sem responder | Compare as opções uma a uma: qual cuida melhor do dinheiro? |
| 14 | fase_concluida.1 | Resultado do tema | Tema concluído! Que jornada! |
| 15 | fase_concluida.2 | Resultado do tema | Missão cumprida! Bora para o próximo tema? |
| 16 | vitoria.1 | Resultado do último tema | VOCÊ CHEGOU AO FIM! Todos os temas concluídos! |
| 17 | vitoria.2 | Resultado do último tema | Na vida real é igual: pense antes de gastar e cuide do seu dinheiro. |
| 18 | tutorial.primeiros-passos.mapas | Tutorial (mapas e atividade) | São 4 temas, com 8 desafios cada. Eles abrem um de cada vez, em ordem. |
| 19 | tutorial.primeiros-passos.entrar | Tutorial (mapas e atividade) | Vamos começar? Clique em entrar no tema 1. |
| 20 | tutorial.primeiros-passos.entrar.ok | Tutorial (mapas e atividade) | Boa! Agora vamos para o desafio. |
| 21 | tutorial.primeiros-passos.comecar | Tutorial (mapas e atividade) | Leia a introdução e clique em Começar aventura. |
| 22 | tutorial.primeiros-passos.comecar.ok | Tutorial (mapas e atividade) | Isso! Primeiro desafio na tela. |
| 23 | tutorial.primeiros-passos.opcoes | Tutorial (mapas e atividade) | Leia a situação e escolha a alternativa que você acha mais adequada. |
| 24 | tutorial.primeiros-passos.opcoes.ok | Tutorial (mapas e atividade) | Ótimo! Você pode mudar de ideia até confirmar. |
| 25 | tutorial.primeiros-passos.confirmar | Tutorial (mapas e atividade) | Quando tiver certeza, confirme. Depois disso a resposta não muda. |
| 26 | tutorial.primeiros-passos.confirmar.ok | Tutorial (mapas e atividade) | Resposta registrada! Você já sabe o caminho. |
| 27 | guia.sem-pressa | Tutorial — plano B (tempo-limite) | Sem pressa! Se quiser, pode continuar sem fazer isso agora. |
