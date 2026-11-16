"use client";
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import falasJson from "./config/falas-nina.json";
import { personagem } from "./config/personagem";
import { armazemDoNavegador, gravar, ler } from "./armazenamento";
import { abrir, avancar as proxima } from "./motor";
import { VozNina } from "./voz";
import type { Aberta, Falas } from "./tipos";

const falas = falasJson as Falas;
const { chaveTutorialVisto, chaveSilenciada } = personagem.comportamento;

export type GuiaCtx = {
  aberta: Aberta | null;
  silenciada: boolean;
  falar: (momento: string) => void;
  avancar: () => void;
  fechar: () => void;
  pularTutorial: () => void;
  reverTutorial: () => void;
  silenciar: (v: boolean) => void;
  /** Enquanto bloqueado (tutorial guiado ativo), reações como acerto/erro são descartadas. */
  bloquear: (b: boolean) => void;
  voz: VozNina;
};
export const GuiaContexto = createContext<GuiaCtx | null>(null);

export function GuiaProvider({ children }: { children: React.ReactNode }) {
  const [aberta, setAberta] = useState<Aberta | null>(null);
  const [silenciada, setSilenciada] = useState(false);
  const abertaRef = useRef<Aberta | null>(null);
  const silRef = useRef(false);
  const ultimo = useRef<Record<string, number>>({});
  const bloqueada = useRef(false);
  const voz = useMemo(() => new VozNina(), []);

  const definir = useCallback((a: Aberta | null) => { abertaRef.current = a; setAberta(a); }, []);
  const terminou = useCallback((a: Aberta | null) => { if (a?.momento === "boas_vindas") gravar(armazemDoNavegador(), chaveTutorialVisto, true); }, []);

  const falar = useCallback((momento: string) => {
    if (!personagem.ativo) return;
    if (silRef.current && momento !== "boas_vindas") return;
    if (bloqueada.current) return;
    const nova = abrir(abertaRef.current, momento, falas, ultimo.current);
    if (nova) definir(nova);
  }, [definir]);

  const fechar = useCallback(() => { terminou(abertaRef.current); definir(null); }, [definir, terminou]);
  const avancar = useCallback(() => {
    const a = abertaRef.current;
    if (!a) return;
    const n = proxima(a);
    if (!n) terminou(a);
    definir(n);
  }, [definir, terminou]);
  const silenciar = useCallback((v: boolean) => {
    silRef.current = v; setSilenciada(v);
    gravar(armazemDoNavegador(), chaveSilenciada, v);
    if (v) definir(null);
  }, [definir]);
  const bloquear = useCallback((b: boolean) => { bloqueada.current = b; if (b) definir(null); }, [definir]);
  const reverTutorial = useCallback(() => { silenciar(false); definir(null); falar("boas_vindas"); }, [silenciar, definir, falar]);

  // Primeira visita: abre o tutorial (e lembra se a Nina estava escondida).
  useEffect(() => {
    if (!personagem.ativo) return;
    const a = armazemDoNavegador();
    if (ler(a, chaveSilenciada)) { silRef.current = true; setSilenciada(true); }
    if (!personagem.comportamento.tutorialGuiado && !ler(a, chaveTutorialVisto)) falar("boas_vindas");
  }, [falar]);

  const valor = useMemo<GuiaCtx>(() => ({ aberta, silenciada, falar, avancar, fechar, pularTutorial: fechar, reverTutorial, silenciar, bloquear, voz }),
    [aberta, silenciada, falar, avancar, fechar, reverTutorial, silenciar, bloquear, voz]);
  return <GuiaContexto.Provider value={valor}>{children}</GuiaContexto.Provider>;
}
