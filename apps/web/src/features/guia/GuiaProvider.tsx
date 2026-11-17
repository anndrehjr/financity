"use client";
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import falasJson from "./config/falas-nina.json";
import { personagem } from "./config/personagem";
import { armazemDoNavegador, gravar, ler } from "./armazenamento";
import { abrir, avancar as proxima } from "./motor";
import { VozNina } from "./voz";
import { NinaVoiceService } from "./voz-servico";
import type { Aberta, Falas } from "./tipos";

const falas = falasJson as Falas;
const { chaveSilenciada } = personagem.comportamento;

export type GuiaCtx = {
  aberta: Aberta | null;
  silenciada: boolean;
  falar: (momento: string) => void;
  avancar: () => void;
  fechar: () => void;
  silenciar: (v: boolean) => void;
  /** Enquanto bloqueado (tutorial guiado ativo), reações como acerto/erro são descartadas. */
  bloquear: (b: boolean) => void;
  voz: VozNina;
  servico: NinaVoiceService;
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
  const servico = useMemo(() => new NinaVoiceService(voz), [voz]);
  useEffect(() => () => servico.destruir(), [servico]);

  const definir = useCallback((a: Aberta | null) => { abertaRef.current = a; setAberta(a); }, []);

  const falar = useCallback((momento: string) => {
    if (!personagem.ativo) return;
    if (silRef.current) return;
    if (bloqueada.current) return;
    const nova = abrir(abertaRef.current, momento, falas, ultimo.current);
    if (nova) definir(nova);
  }, [definir]);

  const fechar = useCallback(() => { definir(null); }, [definir]);
  const avancar = useCallback(() => {
    const a = abertaRef.current;
    if (!a) return;
    const n = proxima(a);
    definir(n);
  }, [definir]);
  const silenciar = useCallback((v: boolean) => {
    silRef.current = v; setSilenciada(v);
    gravar(armazemDoNavegador(), chaveSilenciada, v);
    if (v) definir(null);
  }, [definir]);
  const bloquear = useCallback((b: boolean) => { bloqueada.current = b; if (b) definir(null); }, [definir]);

  // Lembra se a Nina estava escondida.
  useEffect(() => {
    if (!personagem.ativo) return;
    const a = armazemDoNavegador();
    if (ler(a, chaveSilenciada)) { silRef.current = true; setSilenciada(true); }
  }, []);

  const valor = useMemo<GuiaCtx>(() => ({ aberta, silenciada, falar, avancar, fechar, silenciar, bloquear, voz, servico }),
    [aberta, silenciada, falar, avancar, fechar, silenciar, bloquear, voz, servico]);
  return <GuiaContexto.Provider value={valor}>{children}</GuiaContexto.Provider>;
}
