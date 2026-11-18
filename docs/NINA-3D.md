# Nina 3D — como funciona e como mudar

A Nina do tutorial agora usa uma arte 3D estilizada (vista frontal, fundo transparente). **Nada do tutorial, da voz ou das falas foi alterado**: só a apresentação visual da Nina e o balão.

## Onde está cada coisa

| O quê | Arquivo |
|---|---|
| Imagem usada no site (corpo inteiro, 347×700, WebP, 40 KB) | `apps/web/public/guia/nina/nina-3d.webp` |
| Miniatura redonda do botão "ver tutorial" (176×176, 10 KB) | `apps/web/public/guia/nina/nina-3d-rosto.webp` |
| **Original sem perdas** (recorte da vista frontal, PNG 386×779) | `apps/web/design/nina/nina-3d-frontal.png` (fora de `public/`, não vai para o site) |
| Ficha completa em 5 vistas (frontal, ¾, perfil, costas) | `D:\Projetos Serios\Jogos Novos\nina3d\Ficha de Personagem Financity em 360°.png` (fora do repositório) |
| Tamanho, posição e caminho da imagem | `apps/web/src/features/guia/config/personagem.ts` → `visual` |
| Animações (CSS) | `apps/web/src/app/globals.css` → bloco "Nina 3D" |
| Componentes | `Guia.tsx` (balão e controles), `Avatar.tsx`, `nina/NinaCharacter.tsx` (imagem + estados), `posicao.ts` (onde ela fica) |

A imagem antiga (`referencia.webp`) continua na pasta, mas não é mais carregada.

## Como trocar a imagem no futuro
1. Gere a nova arte com **fundo transparente**, corpo inteiro, uma pose só (sem régua nem legendas).
2. Salve o original sem perdas em `apps/web/design/nina/`.
3. Exporte para web (WebP com transparência, altura ≈ 700 px) e coloque em `public/guia/nina/` **com o mesmo nome** (`nina-3d.webp`) ou mude o caminho em `personagem.ts`.
4. Se mudar o nome ou a proporção, atualize `visual.arte.largura` e `visual.arte.altura` (a proporção é preservada com `object-fit: contain`).
5. Faça também a miniatura do rosto (`nina-3d-rosto.webp`).

## Como configurar tamanho e posição (tudo em `personagem.ts → visual`)
```ts
altura: { desktop: 220, tablet: 210, celularMin: 110, celularMax: 140 }, // px; largura proporcional
margemPx: 16,                      // distância da borda (inferior e lateral)
posicao: "inferior-esquerda",      // ou "inferior-direita"
```
Desktop e tablet usam a altura do **maior balão do tutorial** (210 px medidos com 26 rem de largura): o balão nunca é menor que a Nina (`min-height`), então ela e o balão ficam sempre do mesmo tamanho. No celular a altura varia entre `celularMin` e `celularMax` conforme a altura da tela (20% dela). Esses valores viram variáveis CSS (`--nina-h-*`), então não há número solto no código.

## Estados e animações (só `transform` e `opacity`)
| Estado | Quando | Animação |
|---|---|---|
| `idle` | parada | respiração discreta (movimento vertical de 2 px) |
| `speaking` | áudio tocando **ou** texto sendo digitado | pequenos movimentos de corpo e cabeça |
| `listening` | o tutorial espera o aluno agir (etapas "clique em…") | leve inclinação |
| entrada | ao aparecer | fade-in + subida suave |
| saída | ao clicar em "Esconder Nina" | fade-out de 0,22 s |
| balão | a cada etapa | transição suave (fade + 6 px) |
| `paused` / áudio parado | voz pausada ou terminada | volta a `idle` (a animação de fala para) |
| `hidden` | "Esconder Nina" | só o botão "Chamar a Nina de volta" |

`prefers-reduced-motion` desliga todas as animações (regra global do projeto; testado: `animation-name: none`).

## O que a imagem NÃO faz
Uma imagem não tem articulações nem rosto móvel. **Não há sincronia labial real**: a Nina só se movimenta enquanto fala. Para boca sincronizada ou braços independentes é preciso um avatar 2D em camadas (já existe suporte via `nina.manifest.json` + Phaser, carregado só quando houver camadas) ou um modelo 3D com rigging.

### Caminho para um avatar 3D real (não implementado de propósito)
`NinaCharacter.tsx` decide o que mostrar: (1) arte em camadas, se o manifesto tiver camadas; (2) senão, a imagem 3D. Para um modelo GLB/GLTF com rigging e visemas, crie um terceiro ramo nesse componente (carregado sob demanda, como o Phaser) que receba os mesmos `estado`, `falando` e `boca`. O restante do sistema não precisa mudar.

## Posição: a Nina NUNCA sobe nem desce
- A Nina é **sempre** ancorada no canto inferior. O tamanho da mensagem não a move: o balão é que cresce.
- Desktop e tablet: a Nina fica ao lado do balão, alinhada pela base. O balão tem altura mínima igual à da Nina (e o maior balão do tutorial cabe exatamente nela), então nem o balão muda de tamanho entre as etapas.
- Celular: o balão fica **acima** da Nina e cresce para cima (a Nina fica sempre no mesmo ponto).
- Só o **lado** pode mudar (`posicao.ts`, função pura com testes): quando a etapa destaca um elemento que ficaria coberto, ela passa para o lado oposto, escolhendo o lado que cobre menos área do elemento (usa os retângulos reais do avatar e do balão). Nunca muda de altura.
- Medido no navegador nas 3 larguras: a base da Nina varia **no máximo 5 px** (é a animação de respiração) durante as 15 etapas.

## Resultados dos testes (2026-11-18)
- Testes automáticos do site: 52 de 52 (8 deles da posição). Tipos (`tsc`) e build de produção: sem erro.
- No navegador (Chrome, build de produção, banco isolado com alunos fictícios), nas 3 larguras (1366, 820 e 390 px): as **15 etapas do tutorial** foram percorridas até o fim, incluindo as 4 que exigem ação (entrar no tema, começar, escolher, confirmar); tamanhos medidos 220 / 210 / 140 px de altura; balão de 220 px (desktop) e 210 px (tablet) em TODAS as etapas; sem rolagem horizontal; **0 erros no console**; 0 falhas de rede.
- Interações: ligar/desligar voz, repetir fala, volume e velocidade (controles presentes e acionáveis), esconder (fade-out), chamar de volta, pular tutorial.
- Imagem carregada uma vez por página; movimento reduzido desliga as animações.

## Limitações conhecidas
- **Celular:** o balão fica acima da Nina e pode cobrir parte da lista de alternativas (a tela de 780 px não comporta os dois); é possível rolar a página.
- Não foram testados: Safari/Firefox, celular físico, leitor de tela, e o áudio real saindo pelo alto-falante (só os controles e o estado). A voz e as falas não foram alteradas.
- A etapa final ("tchau") não tem alvo; o balão pode ficar sobre algum botão da tela até o aluno clicar em Ok.
