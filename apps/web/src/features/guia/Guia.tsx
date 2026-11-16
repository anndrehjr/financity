"use client";
import { memo, useEffect, useMemo, useState } from "react";
import { Avatar } from "./Avatar";
import { personagem } from "./config/personagem";
import { parseNegrito } from "./motor";
import { useTutorial } from "./tutorial/TutorialProvider";
import { TUTORIAIS } from "./tutorial/registro";
import type { EstadoNina } from "./tutorial/tipos";
import type { Expressao } from "./tipos";
import { useGuia } from "./useGuia";

const { velocidadeDigitacaoMs } = personagem.comportamento;
const reduzMovimento = () => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };
const ESTADO_DA_EXPRESSAO: Record<Expressao, EstadoNina> = { feliz: "happy", pensando: "thinking", preocupada: "encouraging", comemorando: "celebrating" };

function Texto({ texto, completo, onFim }: { texto: string; completo: boolean; onFim: (digitando: boolean) => void }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (completo || reduzMovimento()) { setN(texto.length); onFim(false); return; }
    setN(0); onFim(true);
    const t = setInterval(() => setN((x) => {
      if (x + 1 >= texto.length) { clearInterval(t); onFim(false); return texto.length; }
      return x + 1;
    }), velocidadeDigitacaoMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, completo]);
  // Digita o texto SEM os marcadores e depois aplica o negrito, para não aparecer "**" no meio da digitação.
  const visivel = texto.replace(/\*\*/g, "").slice(0, n);
  let usados = 0;
  return (
    <>
      {parseNegrito(texto).map((t, i) => {
        const parte = visivel.slice(usados, usados + t.texto.length);
        usados += t.texto.length;
        return t.negrito ? <strong key={i}>{parte}</strong> : <span key={i}>{parte}</span>;
      })}
    </>
  );
}

function GuiaBase() {
  const g = useGuia();
  const tut = useTutorial();
  const [completo, setCompleto] = useState(false);
  const [digitando, setDigitando] = useState(false);
  const [, forcar] = useState(0);
  const [bocaVoz, setBocaVoz] = useState<string | null>(null);
  useEffect(() => g.voz.onMudar(() => forcar((x) => x + 1)), [g.voz]);
  useEffect(() => g.servico.onMudar(() => forcar((x) => x + 1)), [g.servico]);
  useEffect(() => { const a = g.servico.on("boca", (f) => setBocaVoz(f)); const b = g.servico.on("fim", () => setBocaVoz(null)); return () => { a(); b(); }; }, [g.servico]);

  const s = tut.snapshot;
  const a = g.aberta;
  // Conteúdo exibido: o tutorial (se ativo) tem prioridade sobre as reações.
  const c = useMemo(() => {
    if (s) return { chave: `t:${s.tutorialId}:${s.indice}:${s.fase}`, vozId: `tutorial.${s.tutorialId}.${s.etapa?.id ?? ""}${s.fase === "confirmando" ? ".ok" : ""}`, proximoId: (() => { const n = TUTORIAIS[s.tutorialId]?.etapas[s.indice + 1]; return n ? `tutorial.${s.tutorialId}.${n.id}` : null; })(), texto: s.texto, expressao: s.expressao, estado: s.estado, tutorial: true, total: s.total, indice: s.indice };
    if (a) { const f = a.falas[a.indice]; return { chave: `r:${a.momento}:${a.indice}`, vozId: a.ids?.[a.indice] ?? `${a.momento}.${a.indice + 1}`, proximoId: a.ids?.[a.indice + 1] ?? null, texto: f.texto, expressao: f.expressao, estado: ESTADO_DA_EXPRESSAO[f.expressao], tutorial: false, total: a.falas.length, indice: a.indice }; }
    return null;
  }, [s, a]);

  useEffect(() => { setCompleto(false); }, [c?.chave]);
  // Voz: fala o texto novo e cancela ao trocar de tela/etapa, pular ou esconder a Nina.
  useEffect(() => {
    if (!c || g.silenciada) return;
    void g.servico.tocar(c.vozId, c.texto);          // áudio pré-gerado; plano B: voz do navegador; senão só legenda
    if (c.proximoId) void g.servico.preCarregar(c.proximoId);
    return () => g.servico.parar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c?.chave, g.silenciada]);
  useEffect(() => { if (g.silenciada) g.servico.parar(); }, [g.silenciada, g.servico]);

  if (!personagem.ativo) return null;
  const direita = personagem.visual.posicao === "inferior-direita";
  const lado = direita ? "right-3 sm:right-5 items-end sm:flex-row-reverse" : "left-3 sm:left-5 items-start sm:flex-row";
  const btn = "pointer-events-auto rounded-full px-4 py-2 text-base font-extrabold focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-indigo-700";
  const Z = "z-[10001]"; // acima do overlay de destaque

  if (g.silenciada) {
    return (
      <button type="button" onClick={() => g.silenciar(false)} aria-label={`Chamar a ${personagem.nome} de volta`}
        className={`${btn} fixed bottom-3 ${direita ? "right-3" : "left-3"} ${Z} bg-white shadow-lg ring-2 ring-indigo-200`}>
        💬 {personagem.nome}
      </button>
    );
  }
  if (!c) {
    return (
      <div className={`pointer-events-none fixed bottom-0 ${Z} flex ${direita ? "right-3" : "left-3"}`}>
        <button type="button" onClick={() => tut.iniciar()} aria-label={`Ver o tutorial com a ${personagem.nome}`} title={`Ver tutorial com a ${personagem.nome}`}
          className="pointer-events-auto motion-safe:animate-floaty h-16 w-16 overflow-hidden rounded-full bg-white shadow-lg ring-2 ring-indigo-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-indigo-700 sm:h-20 sm:w-20">
          <Avatar estado="idle" falando={false} tamanho={80} icone />
        </button>
      </div>
    );
  }

  const ultima = c.indice === c.total - 1;
  const falando = digitando || g.servico.falando || g.voz.falando;
  return (
    <div className={`pointer-events-none fixed bottom-0 ${Z} flex max-w-[calc(100vw-1.5rem)] flex-col gap-2 pb-2 ${lado}`}>
      <div key={c.chave} className="motion-safe:animate-pop shrink-0" style={{ width: "min(" + personagem.visual.tamanhoPx * 0.75 + "px, 28vw)" }}>
        <Avatar estado={c.estado} falando={falando} boca={bocaVoz} tamanho={personagem.visual.tamanhoPx} />
      </div>
      <div role="status" aria-live="polite" onClick={() => setCompleto(true)}
        className="pointer-events-auto mb-4 w-[min(92vw,26rem)] rounded-3xl border-4 bg-white p-4 shadow-xl" style={{ borderColor: personagem.visual.corDestaque }}>
        <p className="text-xl font-bold leading-snug text-slate-900">
          <span className="sr-only">{personagem.nome}: </span>
          <Texto texto={c.texto} completo={completo} onFim={setDigitando} />
        </p>
        {s?.tempoEsgotado && s.fase === "aguardando" && <p className="mt-1 text-sm font-semibold text-slate-600">Sem pressa! Se quiser, pode continuar sem fazer isso agora.</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!c.tutorial && c.total > 1 && (
            <span className="flex gap-1" aria-hidden="true">
              {Array.from({ length: c.total }, (_, i) => <span key={i} className={`h-2.5 w-2.5 rounded-full ${i === c.indice ? "bg-slate-800" : "bg-slate-300"}`} />)}
            </span>
          )}
          {c.tutorial && s && <span className="text-sm font-bold text-slate-600" aria-label={`Passo ${s.indice + 1} de ${s.total}`}>{s.indice + 1}/{s.total}</span>}
          <span className="flex-1" />
          {c.tutorial && s ? (
            <>
              {s.podePular && <button type="button" className={`${btn} bg-slate-100 text-slate-800`} onClick={tut.pular}>Pular tutorial</button>}
              {s.podeVoltar && <button type="button" className={`${btn} bg-slate-100 text-slate-800`} onClick={tut.voltar} aria-label="Voltar um passo">◂</button>}
              {s.podeAvancar && <button type="button" className={`${btn} text-white`} style={{ background: personagem.visual.corDestaque }} onClick={tut.avancar}>{ultima ? "Ok" : "Próximo ▸"}</button>}
            </>
          ) : (
            <button type="button" className={`${btn} text-white`} style={{ background: personagem.visual.corDestaque }} onClick={g.avancar}>{ultima ? "Ok" : "Próximo ▸"}</button>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => g.silenciar(true)} className="pointer-events-auto text-sm font-bold text-slate-600 underline focus-visible:outline focus-visible:outline-4 focus-visible:outline-indigo-700">Esconder {personagem.nome}</button>
          {(
            <button type="button" aria-pressed={g.voz.ativa} onClick={() => { const ligar = !g.voz.ativa; g.servico.setAtivo(ligar); if (ligar) void g.servico.tocar(c.vozId, c.texto); }}
              className="pointer-events-auto text-sm font-bold text-slate-600 underline focus-visible:outline focus-visible:outline-4 focus-visible:outline-indigo-700">{g.voz.ativa ? "🔊 Voz ligada" : "🔇 Ligar voz"}</button>
          )}
        </div>
        {g.voz.ativa && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
            <button type="button" className="pointer-events-auto underline" onClick={() => g.servico.repetir()}>🔁 Repetir fala</button>
            <label>Volume <input type="range" min={0} max={1} step={0.1} defaultValue={g.servico.volume} onChange={(e) => g.servico.setVolume(Number(e.target.value))} aria-label="Volume da voz" /></label>
            <label>Velocidade <input type="range" min={0.7} max={1.5} step={0.1} defaultValue={g.voz.velocidade} onChange={(e) => g.voz.definirVelocidade(Number(e.target.value))} aria-label="Velocidade da voz" /></label>
            {g.voz.vozes().length > 1 && (
              <select aria-label="Escolher voz" defaultValue={g.voz.nome ?? ""} onChange={(e) => g.voz.definirVoz(e.target.value || null)} className="rounded border px-1">
                <option value="">Voz padrão (pt-BR)</option>
                {g.voz.vozes().map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}
              </select>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export const Guia = memo(GuiaBase);
