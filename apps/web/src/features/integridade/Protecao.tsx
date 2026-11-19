"use client";
// Proteção de integridade da partida (lado do aluno). Só observa o que os componentes do Financity conseguem ver com certeza e RELATA ao servidor,
// que decide a consequência. Não espiona outras abas, não lê histórico, não usa câmera/microfone nem extensões.
//
// Limites (documentados em docs/ANTITRAPACA.md): navegador nenhum permite impedir captura de tela/gravação nem saber o que está em outras janelas.
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/components/ui";
import { classeDeDispositivo, classificarTecla, copiaDeConteudoProtegido, marcaDaguaSvg, sobreposicao, textoMarcaDagua, type EstadoIntegridade, type Resposta, type TipoEvento } from "./deteccao";

type Cfg = { enabled: boolean; watermark: boolean; protectCopy: boolean; protectPrint: boolean; name: string; sessionRef: string | null };

/** true enquanto a página está visível. Ao minimizar/bloquear a tela vira false: pausa os relógios locais, sem qualquer penalidade. */
export function usePaginaVisivel(): boolean {
  const [v, setV] = useState(true);
  useEffect(() => {
    const f = () => setV(document.visibilityState !== "hidden");
    f();
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, []);
  return v;
}

export default function Protecao({ assessmentId, ativo, estado, onLiberada }: {
  assessmentId: number; ativo: boolean; estado?: EstadoIntegridade;
  /** chamada quando o aluno clica em "Entendi" / "Verificar novamente": a tela recarrega o estado da partida no servidor */
  onLiberada: () => void | Promise<void>;
}) {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [local, setLocal] = useState<Resposta | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [agora, setAgora] = useState(() => new Date());
  const [restante, setRestante] = useState(0);
  const botao = useRef<HTMLButtonElement>(null);
  const ultimoEnvio = useRef<Record<string, number>>({});

  useEffect(() => {
    let vivo = true;
    apiFetch<Cfg>("/api/integrity/config").then((c) => { if (vivo) setCfg(c); }).catch(() => { /* sem configuração: sem proteção extra, o jogo segue normal */ });
    return () => { vivo = false; };
  }, []);

  const ligado = ativo && !!cfg?.enabled;

  const relatar = useCallback(async (tipo: TipoEvento, detalhe?: string) => {
    const t = Date.now();
    if (t - (ultimoEnvio.current[tipo] ?? 0) < 1500) return; // evita rajada local (o servidor também deduplica)
    ultimoEnvio.current[tipo] = t;
    try {
      const r = await apiFetch<Resposta>(`/api/game/${assessmentId}/integrity/event`, {
        method: "POST", body: { type: tipo, detail: detalhe, device: classeDeDispositivo(navigator.userAgent, navigator.maxTouchPoints) },
      });
      if (r.action === "notice") { setAviso(r.message); window.setTimeout(() => setAviso(null), 9000); }
      else if (r.action !== "none") { setLocal(r); setRestante(r.secondsLeft); }
    } catch { /* sem conexão agora: o jogo continua; nada é inventado nem acumulado */ }
  }, [assessmentId]);

  // impressão bloqueada e seleção desativada (CSS em globals.css) enquanto a partida está em andamento e as regras estiverem ligadas
  useEffect(() => {
    if (!ligado) return;
    const el = document.documentElement;
    if (cfg?.protectPrint) el.dataset.fcPrint = "1";
    if (cfg?.protectCopy) el.dataset.fcCopia = "1";
    return () => { delete el.dataset.fcPrint; delete el.dataset.fcCopia; };
  }, [ligado, cfg?.protectPrint, cfg?.protectCopy]);

  useEffect(() => {
    if (!ligado || !cfg) return;
    const onKey = (e: KeyboardEvent) => {
      const d = classificarTecla({ key: e.key, ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey, altKey: e.altKey, type: e.type as "keydown" | "keyup" });
      if (!d) return;
      if (d.tipo === "atalho_impressao") { if (!cfg.protectPrint) return; if (d.bloquear) e.preventDefault(); }
      void relatar(d.tipo, d.detalhe);
    };
    const onBeforePrint = () => { if (cfg.protectPrint) void relatar("impressao_iniciada"); };
    const onCopy = (e: ClipboardEvent) => {
      if (!cfg.protectCopy) return;
      const sel = window.getSelection();
      const no = sel?.anchorNode instanceof Element ? sel.anchorNode : sel?.anchorNode?.parentElement;
      if (!copiaDeConteudoProtegido(sel?.toString() ?? "", !!no?.closest("[data-protegido]"))) return; // copiar outra coisa não é evento
      e.preventDefault();
      void relatar("copia_conteudo");
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    window.addEventListener("beforeprint", onBeforePrint);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    return () => {
      window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey);
      window.removeEventListener("beforeprint", onBeforePrint); document.removeEventListener("copy", onCopy); document.removeEventListener("cut", onCopy);
    };
  }, [ligado, cfg, relatar]);

  // relógio da marca d'água (a cada 30 s)
  useEffect(() => {
    if (!ligado || !cfg?.watermark) return;
    const t = window.setInterval(() => setAgora(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, [ligado, cfg?.watermark]);

  const sob = ligado ? sobreposicao(local, estado) : null;
  const tipoSob = sob?.tipo;
  const segIni = sob?.segundos ?? 0;
  // contagem regressiva da suspensão (a página oculta não "adianta" o relógio: o servidor é quem manda)
  useEffect(() => {
    if (tipoSob !== "suspended") return;
    setRestante(segIni);
    const t = window.setInterval(() => setRestante((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [tipoSob, segIni]);
  useEffect(() => { if (sob) botao.current?.focus(); }, [sob?.tipo]); // eslint-disable-line react-hooks/exhaustive-deps

  const entendi = async () => { setLocal(null); await onLiberada(); };

  if (!ligado) return null;
  return (
    <>
      {cfg?.watermark && (
        <div aria-hidden="true" data-testid="marca-dagua" className="no-print pointer-events-none fixed inset-0 z-30 select-none"
          style={{ backgroundImage: marcaDaguaSvg(textoMarcaDagua(cfg.name, cfg.sessionRef ?? "", agora)), backgroundRepeat: "repeat" }} />
      )}
      {aviso && (
        <div role="status" className="fixed inset-x-3 top-3 z-[10002] mx-auto max-w-xl rounded-2xl border-2 border-amber-300 bg-amber-50 p-3 text-sm font-bold text-amber-950 shadow-lg">
          {aviso}
          <button type="button" className="ml-3 underline" onClick={() => setAviso(null)}>Fechar</button>
        </div>
      )}
      {sob && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-indigo-950/90 p-4" data-testid="sobreposicao-protecao">
          <div role="alertdialog" aria-modal="true" aria-labelledby="prot-titulo" aria-describedby="prot-texto" className="w-full max-w-lg rounded-3xl bg-white p-6 text-slate-900 shadow-2xl">
            <h2 id="prot-titulo" className="font-display text-xl font-extrabold text-rose-800">ATENÇÃO — VIOLAÇÃO DAS REGRAS DO FINANCITY</h2>
            <p className="mt-2 text-sm font-semibold text-slate-700">Uma atividade não permitida foi detectada durante a sua partida.</p>
            <p id="prot-texto" className="mt-3 rounded-2xl bg-rose-50 p-3 text-base font-bold text-rose-950"><span className="block text-xs font-extrabold uppercase tracking-wide">Ocorrência</span>{sob.mensagem}</p>
            <p className="mt-3 text-sm font-semibold text-slate-700">Respeite as regras da atividade para continuar. Você não perdeu o que já respondeu.</p>
            {sob.tipo === "suspended" && <p className="mt-2 text-sm font-extrabold text-indigo-900" aria-live="polite">{restante > 0 ? `Você poderá continuar em ${restante} s.` : "Você já pode continuar."}</p>}
            {sob.tipo === "blocked" && <p className="mt-2 text-sm font-extrabold text-indigo-900">Fale com o seu professor. Quando ele liberar, toque em “Verificar novamente”.</p>}
            <button ref={botao} type="button" className="btn btn-sun mt-4 w-full text-lg" disabled={sob.tipo === "suspended" && restante > 0} onClick={entendi}>
              {sob.tipo === "blocked" ? "Verificar novamente" : "Entendi"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
