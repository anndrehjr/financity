"use client";
import { useContext } from "react";
import { GuiaContexto, type GuiaCtx } from "./GuiaProvider";

const vazio: GuiaCtx = { aberta: null, silenciada: false, falar() {}, avancar() {}, fechar() {}, pularTutorial() {}, reverTutorial() {}, silenciar() {} };

/** guia.falar("acerto"); guia.fechar(); guia.reverTutorial(). Fora do provider vira no-op (a Nina nunca quebra o jogo). */
export function useGuia(): GuiaCtx {
  return useContext(GuiaContexto) ?? vazio;
}
