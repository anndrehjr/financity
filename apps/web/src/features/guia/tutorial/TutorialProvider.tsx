"use client";
import "driver.js/dist/driver.css";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { personagem } from "../config/personagem";
import { useGuia } from "../useGuia";
import { barramento } from "./barramento";
import { MotorTutorial } from "./motor";
import { pontoDeRetomada, repositorioLocal, type RepositorioProgresso } from "./progresso";
import { TUTORIAIS, TUTORIAL_INICIAL } from "./registro";
import type { Snapshot } from "./tipos";

export type TutorialCtx = {
  snapshot: Snapshot | null;
  iniciar: (id?: string) => void;
  avancar: () => void; voltar: () => void; pular: () => void; repetir: () => void; pausar: () => void; retomar: () => void;
};
const vazio: TutorialCtx = { snapshot: null, iniciar() {}, avancar() {}, voltar() {}, pular() {}, repetir() {}, pausar() {}, retomar() {} };
const Ctx = createContext<TutorialCtx>(vazio);
export const useTutorial = () => useContext(Ctx);

const reduz = () => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };

export function TutorialProvider({ children, repositorio }: { children: React.ReactNode; repositorio?: RepositorioProgresso }) {
  const guia = useGuia();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const motor = useRef<MotorTutorial | null>(null);
  const repo = useRef<RepositorioProgresso>(repositorio ?? repositorioLocal());
  const bloquear = guia.bloquear;

  const iniciar = useCallback((id: string = TUTORIAL_INICIAL, desde = 0) => {
    const t = TUTORIAIS[id];
    if (!t || !personagem.ativo) return;
    motor.current?.encerrar();
    guia.silenciar(false);
    guia.fechar();
    const m = new MotorTutorial(t, barramento, {
      aoMudarEtapa: (i) => repo.current.gravar(id, { step: i, status: "in_progress" }),
      aoTerminar: (motivo) => repo.current.gravar(id, { step: t.etapas.length, status: motivo === "concluido" ? "done" : "skipped" }),
    });
    motor.current = m;
    m.onMudar((s) => { setSnap(s.fase === "fim" ? null : s); bloquear(s.fase !== "fim"); });
    m.iniciar(desde);
  }, [guia, bloquear]);

  // Primeira visita: inicia sozinho (ou retoma da etapa salva depois de recarregar a página).
  const iniciouSozinho = useRef(false);
  useEffect(() => {
    if (iniciouSozinho.current || !personagem.comportamento.tutorialGuiado || !personagem.ativo) return;
    iniciouSozinho.current = true;
    const p = pontoDeRetomada(repo.current.ler(TUTORIAL_INICIAL));
    if (p.iniciar) iniciar(TUTORIAL_INICIAL, p.desde);
  }, [iniciar]);

  // Esc pula (quando permitido). Tab/Enter seguem os botões do balão.
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === "Escape" && motor.current?.snapshot().podePular) motor.current.pular(); };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);
  useEffect(() => () => { motor.current?.encerrar(); bloquear(false); }, [bloquear]);

  const valor = useMemo<TutorialCtx>(() => ({
    snapshot: snap, iniciar: (id) => iniciar(id),
    avancar: () => motor.current?.avancar(), voltar: () => motor.current?.voltar(), pular: () => motor.current?.pular(),
    repetir: () => motor.current?.repetir(), pausar: () => motor.current?.pausar(), retomar: () => motor.current?.retomar(),
  }), [snap, iniciar]);

  return <Ctx.Provider value={valor}>{children}<Destaque snap={snap} /></Ctx.Provider>;
}

/** Destaque por cima da tela: Driver.js para elementos do DOM; retângulo registrado (ex.: objeto de cena gráfica) por div própria. */
function Destaque({ snap }: { snap: Snapshot | null }) {
  const alvo = snap && snap.fase !== "fim" ? snap.alvo : null;
  const chave = alvo?.tipo === "dom" ? `dom:${alvo.seletor}` : alvo?.tipo === "retangulo" ? `ret:${alvo.id}` : "";
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!alvo || alvo.tipo !== "dom") return;
    let d: { destroy: () => void } | null = null;
    let vivo = true;
    void import("driver.js").then(({ driver }) => {
      if (!vivo) return;
      const inst = driver({
        animate: !reduz(), smoothScroll: !reduz(), overlayOpacity: 0.45, stagePadding: 8, stageRadius: 14,
        allowClose: false, allowKeyboardControl: false, allowPageInteraction: true, overlayClickBehavior: "none", focus: "none",
        showButtons: [], waitForElement: 4000,
      });
      d = inst;
      inst.highlight({ element: alvo.seletor });
    }).catch(() => { /* sem destaque: a Nina continua explicando em texto (plano B) */ });
    return () => { vivo = false; try { d?.destroy(); } catch { /* ignora */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  useEffect(() => {
    if (!alvo || alvo.tipo !== "retangulo") { setRect(null); return; }
    const atualizar = () => setRect(barramento.retangulo(alvo.id));
    atualizar();
    window.addEventListener("resize", atualizar); window.addEventListener("scroll", atualizar, true);
    const t = setInterval(atualizar, 500); // troca de cena
    return () => { window.removeEventListener("resize", atualizar); window.removeEventListener("scroll", atualizar, true); clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  if (!rect) return null;
  return <div aria-hidden="true" className="pointer-events-none fixed z-[9999] rounded-2xl ring-4 ring-amber-400" style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12, boxShadow: "0 0 0 9999px rgba(0,0,0,.45)" }} />;
}
