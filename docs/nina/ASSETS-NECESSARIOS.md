# Nina — arte necessária (personagem em camadas)

Status: **infraestrutura pronta, arte pendente.** Enquanto nenhuma camada existir, a Nina aparece com a imagem de referência estática
(`apps/web/public/guia/nina/referencia.webp`). Com arte em camadas, o site passa a usar o Phaser sozinho (carregado só nesse caso).

## Como entregar
1. Salve os PNGs em `apps/web/public/guia/nina/camadas/` com **exatamente** os nomes abaixo.
2. Em `apps/web/public/guia/nina/nina.manifest.json`, troque `"existe": false` por `true` nos arquivos entregues.
3. Ajuste a âncora do rosto (`rosto.x`, `rosto.y`, `rosto.escala`) de cada pose, em pixels da tela-base.
4. Se houver arte do tronco separada do resto (para a respiração), mude `"respiracao"` para `true`.

Nenhum código precisa mudar. Camada que faltar usa a mais próxima disponível (tabela `FALLBACKS` em `nina/animacao.ts`) e, em desenvolvimento, avisa no console.

## Formato
- PNG com transparência, mesma **tela-base 1024 × 1365 px** em todas as poses (versão @0.5 opcional: 512 × 683).
- Poses de corpo: imagem inteira na tela-base. Rosto (olhos, sobrancelhas, bocas) e extras: **recortes pequenos**, centralizados na âncora do rosto.
- Estilo da referência: anime suave com contorno; cabelo castanho ondulado, olhos castanho-esverdeados, blazer verde-turquesa, camiseta clara, calça verde-escura, crachá "Nina", tablet Financity, brincos de pérola.
- Orçamento: ~1,5 MB no total para o primeiro carregamento (WebP também é aceito; use a extensão no manifesto).

## Lista de arquivos
| Grupo | Arquivo | Uso |
|---|---|---|
| Poses | `pose-neutra.png` | base (idle, happy, thinking, surprised) |
| | `pose-explicando.png` | mão aberta (como na referência) |
| | `pose-apontando.png` | aponta para o elemento destacado |
| | `pose-comemorando.png` | comemoração |
| | `pose-tchau.png` | despedida |
| Olhos | `olhos-abertos.png`, `olhos-meio.png`, `olhos-fechados.png` | piscar |
| | `olhos-felizes.png` (^ ^), `olhos-surpresos.png`, `olhos-pensando.png` (olhando para cima) | expressões |
| Sobrancelhas | `sobr-neutra.png`, `sobr-alegre.png`, `sobr-preocupada.png`, `sobr-surpresa.png` | emoção |
| Bocas | `boca-fechada.png`, `boca-sorriso.png`, `boca-a.png`, `boca-e.png`, `boca-o.png`, `boca-m.png` | fala e expressões |
| Extras | `brilho-comemoracao.png`, `gota-preocupada.png`, `seta-apontar.png` | efeitos |

## Estados de animação → camadas (de `nina/animacao.ts`)
| Estado | Pose | Olhos | Sobrancelha | Boca | Extra |
|---|---|---|---|---|---|
| idle | neutra | abertos (pisca a cada 3–6 s) | neutra | fechada | — |
| talking | explicando | abertos | neutra | alterna a/e/o/m | — |
| happy | neutra | felizes | alegre | sorriso | — |
| celebrating | comemorando | felizes | alegre | sorriso | brilho |
| thinking | neutra | pensando | neutra | fechada | — |
| explaining | explicando | abertos | alegre | sorriso | — |
| pointing | apontando | abertos | alegre | sorriso | seta |
| encouraging | explicando | abertos | alegre | sorriso | — |
| surprised | neutra | surpresos | surpresa | o | — |
| goodbye | tchau | felizes | alegre | sorriso | — |

Com `prefers-reduced-motion`: sem respiração, piscar nem efeitos; só a troca de expressão.
