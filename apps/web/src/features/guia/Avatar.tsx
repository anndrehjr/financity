import { personagem } from "./config/personagem";
import { NinaCharacter } from "./nina/NinaCharacter";
import type { EstadoNina } from "./tutorial/tipos";

/**
 * Nina: arte em camadas com Phaser quando existir; senão a Nina 3D estática com animação leve em CSS (config/personagem.ts → visual.arte).
 * `escutando` = o tutorial espera uma ação do aluno. `icone` = miniatura redonda do botão "ver tutorial".
 */
export function Avatar({ estado, falando = false, escutando = false, boca = null, tamanho = personagem.visual.tamanhoPx, icone = false }: { estado: EstadoNina; falando?: boolean; escutando?: boolean; boca?: string | null; tamanho?: number; icone?: boolean }) {
  if (icone) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={personagem.visual.arte.rosto} alt={`Chamar a ${personagem.nome}`} width={tamanho} height={tamanho} className="h-full w-full object-cover object-top" decoding="async" />;
  }
  return <NinaCharacter estado={estado} falando={falando} escutando={escutando} boca={boca} tamanho={tamanho} />;
}
