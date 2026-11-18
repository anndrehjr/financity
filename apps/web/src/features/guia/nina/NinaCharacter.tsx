"use client";
import { memo, useEffect, useRef, useState } from "react";
import { personagem } from "../config/personagem";
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

/** Estado visual da Nina 3D: parada (respira), falando (áudio ou texto em digitação) ou escutando (esperando o aluno agir). "Pausada" = voltou ao repouso. */
export type EstadoVisual = "idle" | "speaking" | "listening";
type Props = { estado: EstadoNina; falando: boolean; escutando?: boolean; boca?: string | null; tamanho: number };

/**
 * Com arte em camadas no manifesto: renderiza com Phaser (carregado sob demanda), pronto para uma Nina com rosto/boca animados.
 * Sem arte em camadas (estado atual): mostra a Nina 3D estática (config/personagem.ts → visual.arte) com animação leve só em CSS
 * (transform/opacity). Uma imagem não tem articulações: NÃO há sincronia labial real; ela só se movimenta enquanto fala.
 */
function NinaCharacterBase({ estado, falando, escutando = false, boca = null, tamanho }: Props) {
  const [m, setM] = useState<Manifesto | null>(null);
  const alvo = useRef<HTMLDivElement>(null);
  const ctrl = useRef<ControleNina | null>(null);
  useEffect(() => { let vivo = true; void carregarManifesto().then((x) => { if (vivo) setM(x); }); return () => { vivo = false; }; }, []);

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
  useEffect(() => { ctrl.current?.definirBoca(boca); }, [boca]);

  if (camadas) return <div ref={alvo} role="img" aria-label="Nina, Guardiã Veterana" style={{ width: largura, height: altura }} />;
  const arte = personagem.visual.arte;
  const visual: EstadoVisual = falando ? "speaking" : escutando ? "listening" : "idle";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={arte.corpo} alt={arte.alt} width={arte.largura} height={arte.altura} decoding="async" draggable={false}
      className="nina-3d" data-estado={visual} />
  );
}
export const NinaCharacter = memo(NinaCharacterBase);
