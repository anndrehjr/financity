import { personagem } from "./config/personagem";
import { NinaPlaceholder } from "./avatares/placeholder";
import type { Expressao } from "./tipos";

// Escolhe o desenho conforme personagem.visual.tipo. Trocar o visual = colocar imagens em public/guia/nina/ e mudar o tipo.
export function Avatar({ expressao, tamanho = personagem.visual.tamanhoPx }: { expressao: Expressao; tamanho?: number }) {
  if (personagem.visual.tipo === "imagem") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={personagem.visual.imagens[expressao]} alt={`${personagem.nome}, ${expressao}`} width={tamanho} height={tamanho} />;
  }
  return <NinaPlaceholder expressao={expressao} cor={personagem.visual.corDestaque} tamanho={tamanho} />;
}
