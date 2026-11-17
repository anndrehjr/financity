# Falas para gerar na ElevenLabs — 3 blocos (modo manual)

Gerado por `npx tsx tools/nina-voz/gerar.ts` a partir de `blocos.json`. O site **não** chama a ElevenLabs.

## Configuração
Voz sylphiette · Multilingual v2 · Velocidade 0,96 · Estabilidade 57 · Similaridade 75 · Estilo 0 · Speaker boost ligado

## Como fazer
1. Para cada bloco, copie **todo** o arquivo `blocos/nina-bloco-N.txt` e gere **um** áudio.
2. Salve em `tools/nina-voz/origem/geradas/` com o nome **`nina-bloco-N.mp3`**.
3. Ouça. Se alguma frase sair estranha, gere **só aquele bloco** de novo.
4. Rode `tools/nina-voz/.venv/Scripts/python tools/nina-voz/cortar-blocos.py --conferir` (ou me avise): corta nas pausas de 1.5s, confere o que a voz falou e gera um MP3 por fala.

Se a voz **ler em voz alta** a marca `<break ... />`, me avise.

## Bloco 1 — temas e encerramento → `nina-bloco-1.mp3` (8 falas, 490 caracteres)

| posição | id (arquivo final) | texto falado | legenda no site |
|---|---|---|---|
| 1 | mapa_1.1 | Tema um: cidadania financeira. Direitos, deveres e escolhas que afetam todos. | Tema 1: cidadania financeira. Direitos, deveres e escolhas que afetam todos. |
| 2 | mapa_2.1 | Tema dois: ética financeira. Honestidade vale mais que qualquer lucro. | Tema 2: ética financeira. Honestidade vale mais que qualquer lucro. |
| 3 | mapa_3.1 | Tema três: segurança digital. Desconfie de pressa, links e pedidos de código. | Tema 3: segurança digital. Desconfie de pressa, links e pedidos de código. |
| 4 | mapa_4.1 | Tema quatro: consumo consciente. Faça as contas antes de se empolgar com promoção. | Tema 4: consumo consciente. Faça as contas antes de se empolgar com promoção. |
| 5 | fase_concluida.1 | Tema concluído! Que jornada! | Tema concluído! Que jornada! |
| 6 | fase_concluida.2 | Missão cumprida! Bora para o próximo tema? | Missão cumprida! Bora para o próximo tema? |
| 7 | vitoria.1 | Você chegou ao fim! Todos os temas concluídos! | VOCÊ CHEGOU AO FIM! Todos os temas concluídos! |
| 8 | vitoria.2 | Na vida real é igual: pense antes de gastar e cuide do seu dinheiro. | Na vida real é igual: pense antes de gastar e cuide do seu dinheiro. |

## Bloco 2 — reações (acerto, quase, erro, ajuda) → `nina-bloco-2.mp3` (9 falas, 391 caracteres)

| posição | id (arquivo final) | texto falado | legenda no site |
|---|---|---|---|
| 1 | acerto.1 | Mandou bem! Boa escolha. | Mandou bem! Boa escolha. |
| 2 | acerto.2 | Isso aí! Pensou com cuidado. | Isso aí! Pensou com cuidado. |
| 3 | acerto.3 | Boa! Seguimos para o próximo. | Boa! Seguimos para o próximo. |
| 4 | parcial.1 | Tem coisa boa aí! Dá para pensar ainda mais. | Tem coisa boa aí! Dá para pensar ainda mais. |
| 5 | parcial.2 | Foi um bom caminho. Vamos ao próximo! | Foi um bom caminho. Vamos ao próximo! |
| 6 | erro.1 | Essa não foi a melhor. Sem problema, o próximo é uma nova chance. | Essa não foi a melhor. Sem problema, o próximo é uma nova chance. |
| 7 | erro.2 | Errar aqui é melhor que errar com dinheiro de verdade. | Errar aqui é melhor que errar com dinheiro de verdade. |
| 8 | parado.1 | Tá difícil? Respira e releia o enunciado com calma. | Tá difícil? Respira e releia o enunciado com calma. |
| 9 | parado.2 | Compare as opções uma a uma: qual cuida melhor do dinheiro? | Compare as opções uma a uma: qual cuida melhor do dinheiro? |

## Bloco 3 — tutorial de primeiros passos → `nina-bloco-3.mp3` (10 falas, 513 caracteres)

| posição | id (arquivo final) | texto falado | legenda no site |
|---|---|---|---|
| 1 | tutorial.primeiros-passos.mapas | São quatro temas, com oito desafios cada. Eles abrem um de cada vez, em ordem. | São 4 temas, com 8 desafios cada. Eles abrem um de cada vez, em ordem. |
| 2 | tutorial.primeiros-passos.entrar | Vamos começar? Clique em entrar no tema um. | Vamos começar? Clique em entrar no tema 1. |
| 3 | tutorial.primeiros-passos.entrar.ok | Boa! Agora vamos para o desafio. | Boa! Agora vamos para o desafio. |
| 4 | tutorial.primeiros-passos.comecar | Leia a introdução e clique em Começar aventura. | Leia a introdução e clique em Começar aventura. |
| 5 | tutorial.primeiros-passos.comecar.ok | Isso! Primeiro desafio na tela. | Isso! Primeiro desafio na tela. |
| 6 | tutorial.primeiros-passos.opcoes | Leia a situação e escolha a alternativa que você acha mais adequada. | Leia a situação e escolha a alternativa que você acha mais adequada. |
| 7 | tutorial.primeiros-passos.opcoes.ok | Ótimo! Você pode mudar de ideia até confirmar. | Ótimo! Você pode mudar de ideia até confirmar. |
| 8 | tutorial.primeiros-passos.confirmar | Quando tiver certeza, confirme. Depois disso a resposta não muda. | Quando tiver certeza, confirme. Depois disso a resposta não muda. |
| 9 | tutorial.primeiros-passos.confirmar.ok | Resposta registrada! Você já sabe o caminho. | Resposta registrada! Você já sabe o caminho. |
| 10 | guia.sem-pressa | Sem pressa! Se quiser, pode continuar sem fazer isso agora. | Sem pressa! Se quiser, pode continuar sem fazer isso agora. |

Total: 27 falas, 1394 caracteres (plano gratuito ≈ 10.000 créditos/mês).
