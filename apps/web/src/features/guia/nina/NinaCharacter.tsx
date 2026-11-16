"use client";
import { memo, useEffect, useRef, useState } from "react";
import { temArteEmCamadas, type Manifesto } from "./animacao";
import type { ControleNina } from "./NinaPhaser";
import type { EstadoNina } from "../tutorial/tipos";

let manifestoEmCache: Promise<Manifesto | null> | null = null;
/** Carrega o manifesto uma vez só. Se falhar, a Nina usa a imagem de referência. */
export function carregarManifesto(): Promise<Manifesto | null> {
  manifestoEmCache ??= fetch("/guia/nina/nina.manifest.json").then((r) => (r.ok ? (r.json() as Promise<Manifesto>) : null)).catch(() => null);
  return manifestoEmCache;
}
const reduzMovimento = () => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };

type Props = { estado: EstadoNina; falando: boolean; tamanho: number };

/**
 * Nina anime. Com arte em camadas no manifesto: renderiza com Phaser (carregado sob demanda).
 * Sem arte (estado atual): mostra a imagem de referência estática — "infraestrutura pronta, arte pendente".
 */
function NinaCharacterBase({ estado, falando, tamanho }: Props) {
  const [m, setM] = useState<Manifesto | null>(null);
  const [pronto, setPronto] = useState(false);
  const alvo = useRef<HTMLDivElement>(null);
  const ctrl = useRef<ControleNina | null>(null);
  useEffect(() => { let vivo = true; void carregarManifesto().then((x) => { if (vivo) { setM(x); setPronto(true); } }); return () => { vivo = false; }; }, []);

  const camadas = !!m && temArteEmCamadas(m);
  const largura = Math.round(tamanho * 0.75), altura = tamanho;
  useEffect(() => {
    if (!camadas || !m || !alvo.current) return;
    let vivo = true;
    const dev = process.env.NODE_ENV !== "production";
    void import("./NinaPhaser").then(({ criarNinaPhaser }) => criarNinaPhaser(alvo.current!, m, { largura, altura, reduzirMovimento: reduzMovimento(), avisar: dev ? (x) => console.warn(x) : undefined }))
      .then((c) => { if (!vivo) { c.destruir(); return; } ctrl.current = c; c.definirEstado(estado); c.definirFalando(falando); })
      .catch(() => { /* sem Phaser: a imagem de referência continua visível abaixo */ });
    return () => { vivo = false; ctrl.current?.destruir(); ctrl.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camadas, m, largura, altura]);
  useEffect(() => { ctrl.current?.definirEstado(estado); }, [estado]);
  useEffect(() => { ctrl.current?.definirFalando(falando); }, [falando]);

  if (camadas) return <div ref={alvo} role="img" aria-label="Nina, Guardiã Veterana" style={{ width: largura, height: altura }} />;
  if (!pronto) return <div style={{ width: largura, height: altura }} aria-hidden="true" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={m?.referencia ?? "/guia/nina/referencia.webp"} alt="Nina, Guardiã Veterana" width={largura} height={altura} decoding="async"
      className="rounded-2xl object-cover object-top shadow-lg ring-2 ring-white" style={{ width: largura, height: altura }} />
  );
}
export const NinaCharacter = memo(NinaCharacterBase);
