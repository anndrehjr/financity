"use client";
import { useContext } from "react";
import { GuiaContexto, type GuiaCtx } from "./GuiaProvider";
import { VozNina } from "./voz";
import { NinaVoiceService } from "./voz-servico";

const vazio: GuiaCtx = { aberta: null, silenciada: false, falar() {}, avancar() {}, fechar() {}, silenciar() {}, bloquear() {}, voz: new VozNina(null), servico: new NinaVoiceService(new VozNina(null), { armazem: null, criarAudio: () => null as never }) };

/** guia.falar("acerto"); guia.fechar(). Fora do provider vira no-op (a Nina nunca quebra o jogo). */
export function useGuia(): GuiaCtx {
  return useContext(GuiaContexto) ?? vazio;
}
