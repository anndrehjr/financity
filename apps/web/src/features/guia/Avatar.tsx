import { personagem } from "./config/personagem";
import { NinaCharacter } from "./nina/NinaCharacter";
import type { EstadoNina } from "./tutorial/tipos";

/**
 * Nina anime: arte em camadas com Phaser quando existir; senão a imagem de referência estática.
 * `icone` = miniatura redonda do botão "ver tutorial".
 */
export function Avatar({ estado, falando = false, boca = null, tamanho = personagem.visual.tamanhoPx, icone = false }: { estado: EstadoNina; falando?: boolean; boca?: string | null; tamanho?: number; icone?: boolean }) {
  if (icone) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/guia/nina/referencia.webp" alt={`Chamar a ${personagem.nome}`} width={tamanho} height={tamanho} className="h-full w-full object-cover object-top" decoding="async" />;
  }
  return <NinaCharacter estado={estado} falando={falando} boca={boca} tamanho={tamanho} />;
}
