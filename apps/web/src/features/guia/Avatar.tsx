import { personagem } from "./config/personagem";
import { NinaPlaceholder } from "./avatares/placeholder";
import { NinaCharacter } from "./nina/NinaCharacter";
import type { EstadoNina } from "./tutorial/tipos";
import type { Expressao } from "./tipos";

const EXPRESSAO_DO_ESTADO: Record<EstadoNina, Expressao> = {
  idle: "feliz", talking: "feliz", happy: "feliz", celebrating: "comemorando", thinking: "pensando", explaining: "feliz",
  pointing: "feliz", encouraging: "preocupada", surprised: "pensando", goodbye: "comemorando",
};

/**
 * Escolhe o desenho conforme personagem.visual.tipo:
 *  - "nina": Nina anime (arte em camadas com Phaser quando existir; senão a imagem de referência estática);
 *  - "svg-placeholder" / "imagem": versões provisórias antigas, mantidas como reserva.
 */
export function Avatar({ estado, falando = false, boca = null, tamanho = personagem.visual.tamanhoPx, icone = false }: { estado: EstadoNina; falando?: boolean; boca?: string | null; tamanho?: number; icone?: boolean }) {
  const expressao = EXPRESSAO_DO_ESTADO[estado];
  if (personagem.visual.tipo === "imagem") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={personagem.visual.imagens[expressao]} alt={`${personagem.nome}, ${expressao}`} width={tamanho} height={tamanho} />;
  }
  if (personagem.visual.tipo === "svg-placeholder") return <NinaPlaceholder expressao={expressao} cor={personagem.visual.corDestaque} tamanho={tamanho} />;
  if (icone) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/guia/nina/referencia.webp" alt={`Chamar a ${personagem.nome}`} width={tamanho} height={tamanho} className="h-full w-full object-cover object-top" decoding="async" />;
  }
  return <NinaCharacter estado={estado} falando={falando} boca={boca} tamanho={tamanho} />;
}
