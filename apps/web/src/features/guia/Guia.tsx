"use client";
import { memo, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Avatar } from "./Avatar";
import { personagem } from "./config/personagem";
import { parseNegrito } from "./motor";
import { escolherPosicao, type Posicao } from "./posicao";
import { useTutorial } from "./tutorial/TutorialProvider";
import { TUTORIAIS } from "./tutorial/registro";
import type { EstadoNina } from "./tutorial/tipos";
import type { Expressao } from "./tipos";
import { useGuia } from "./useGuia";

const { velocidadeDigitacaoMs } = personagem.comportamento;
const SEM_PRESSA = "Sem pressa! Se quiser, pode continuar sem fazer isso agora."; // id de áudio: guia.sem-pressa
const reduzMovimento = () => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };
const { altura: ALTURA_NINA, margemPx } = personagem.visual;
const LADO_PADRAO: Posicao["lado"] = personagem.visual.posicao === "inferior-direita" ? "direita" : "esquerda";
// Medidas da Nina (config/personagem.ts) viram variáveis CSS lidas por .nina-guia / .nina-3d (globals.css).
const VARS_NINA = { "--nina-h-desktop": `${ALTURA_NINA.desktop}px`, "--nina-h-tablet": `${ALTURA_NINA.tablet}px`, "--nina-h-cel-min": `${ALTURA_NINA.celularMin}px`, "--nina-h-cel-max": `${ALTURA_NINA.celularMax}px`, "--nina-ratio": `${personagem.visual.arte.largura} / ${personagem.visual.arte.altura}` } as CSSProperties;
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
  const [saindo, setSaindo] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Posicao>({ vertical: "baixo", lado: LADO_PADRAO });
  const timerSaida = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timerSaida.current) clearTimeout(timerSaida.current); }, []);
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
  // Posição: durante o tutorial, a Nina sai da frente do elemento que a etapa destaca (4 cantos, ver posicao.ts).
  const seletorAlvo = s && s.alvo.tipo === "dom" ? s.alvo.seletor : null;
  useEffect(() => {
    if (!c) return;
    let quadro = 0;
    const medir = () => {
      const el = raiz.current; if (!el) return;
      const r = seletorAlvo ? document.querySelector(seletorAlvo)?.getBoundingClientRect() : undefined;
      const alvo = r && r.width > 0 && r.height > 0 ? { x: r.x, y: r.y, w: r.width, h: r.height } : null;
      const p = escolherPosicao(alvo, { w: el.offsetWidth, h: el.offsetHeight }, { w: window.innerWidth, h: window.innerHeight }, margemPx, LADO_PADRAO);
      setPos((a) => (a.vertical === p.vertical && a.lado === p.lado ? a : p));
    };
    const agendar = () => { cancelAnimationFrame(quadro); quadro = requestAnimationFrame(medir); };
    medir();
    const ciclo = setInterval(medir, 400); // o alvo pode demorar a aparecer (ex.: pergunta carregando); a conta é barata (1 retângulo)
    window.addEventListener("resize", agendar); window.addEventListener("scroll", agendar, { passive: true });
    return () => { clearInterval(ciclo); cancelAnimationFrame(quadro); window.removeEventListener("resize", agendar); window.removeEventListener("scroll", agendar); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c?.chave, seletorAlvo]);
  // Voz: fala o texto novo e cancela ao trocar de tela/etapa, pular ou esconder a Nina.
  useEffect(() => {
    if (!c || g.silenciada) return;
    void g.servico.tocar(c.vozId, c.texto);          // áudio pré-gerado; plano B: voz do navegador; senão só legenda
    if (c.proximoId) void g.servico.preCarregar(c.proximoId);
    return () => g.servico.parar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c?.chave, g.silenciada]);
  useEffect(() => { if (g.silenciada) g.servico.parar(); }, [g.silenciada, g.servico]);
  // Plano B do tutorial: aviso "sem pressa" quando o tempo-limite de uma ação libera o aluno (tem áudio próprio: guia.sem-pressa).
  const semPressa = !!s && s.tempoEsgotado && s.fase === "aguardando";
  useEffect(() => {
    if (!semPressa || g.silenciada) return;
    void g.servico.tocar("guia.sem-pressa", SEM_PRESSA);
    return () => g.servico.parar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semPressa, g.silenciada]);

  if (!personagem.ativo) return null;
  const direita = personagem.visual.posicao === "inferior-direita";
  const aDireita = pos.lado === "direita", noTopo = pos.vertical === "topo";
  const lado = aDireita ? "items-end sm:flex-row-reverse sm:items-end" : "items-start sm:flex-row sm:items-end";
  // Esconder: a Nina some com um fade-out curto (sem animação se o aluno pediu menos movimento).
  const esconder = () => {
    if (reduzMovimento()) { g.silenciar(true); return; }
    setSaindo(true);
    timerSaida.current = setTimeout(() => { setSaindo(false); g.silenciar(true); }, 220);
  };
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
  const falando = digitando || g.servico.falando;
  const escutando = !falando && !!s && s.fase === "aguardando"; // o tutorial espera o aluno agir
  return (
    <div ref={raiz} className={`nina-guia pointer-events-none fixed ${Z} flex max-w-[calc(100vw-2rem)] flex-col gap-2 ${lado} ${saindo ? "nina-sai" : "nina-entra"}`}
      style={{ ...VARS_NINA, [noTopo ? "top" : "bottom"]: margemPx, [aDireita ? "right" : "left"]: margemPx }}>
      <div className="shrink-0">
        <Avatar estado={c.estado} falando={falando} escutando={escutando} boca={bocaVoz} tamanho={personagem.visual.tamanhoPx} />
      </div>
      <div key={c.chave} role="status" aria-live="polite" onClick={() => setCompleto(true)}
        className="nina-balao pointer-events-auto w-[min(92vw,26rem)] rounded-3xl border-2 bg-white p-4 shadow-lg" style={{ borderColor: personagem.visual.corDestaque }}>
        {c.tutorial && s && (
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Progresso do tutorial" aria-valuemin={1} aria-valuemax={s.total} aria-valuenow={s.indice + 1}>
            <div className="h-full w-full rounded-full transition-transform duration-300" style={{ background: personagem.visual.corDestaque, transform: `scaleX(${(s.indice + 1) / s.total})`, transformOrigin: "left" }} />
          </div>
        )}
        <p className="text-lg font-bold leading-snug text-slate-900 sm:text-xl">
          <span className="sr-only">{personagem.nome}: </span>
          <Texto texto={c.texto} completo={completo} onFim={setDigitando} />
        </p>
        {s?.tempoEsgotado && s.fase === "aguardando" && <p className="mt-1 text-sm font-semibold text-slate-600">{SEM_PRESSA}</p>}
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
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-slate-50 px-3 py-2">
          <button type="button" onClick={esconder} className="pointer-events-auto text-sm font-bold text-slate-600 underline focus-visible:outline focus-visible:outline-4 focus-visible:outline-indigo-700">Esconder {personagem.nome}</button>
          {(
            <button type="button" aria-pressed={g.voz.ativa} onClick={() => { const ligar = !g.voz.ativa; g.servico.setAtivo(ligar); if (ligar) void g.servico.tocar(c.vozId, c.texto); }}
              className="pointer-events-auto text-sm font-bold text-slate-600 underline focus-visible:outline focus-visible:outline-4 focus-visible:outline-indigo-700">{g.voz.ativa ? "🔊 Voz ligada" : "🔇 Ligar voz"}</button>
          )}
        </div>
        {g.voz.ativa && personagem.creditos.mostrarElevenLabs && <p className="mt-2 text-xs font-semibold text-slate-500">{personagem.creditos.texto}</p>}
        {g.voz.ativa && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            <button type="button" className="pointer-events-auto underline" onClick={() => g.servico.repetir()}>🔁 Repetir fala</button>
            <label>Volume <input type="range" min={0} max={1} step={0.1} defaultValue={g.servico.volume} onChange={(e) => g.servico.setVolume(Number(e.target.value))} aria-label="Volume da voz" /></label>
            <label>Velocidade <input type="range" min={0.7} max={1.5} step={0.1} defaultValue={g.voz.velocidade} onChange={(e) => g.voz.definirVelocidade(Number(e.target.value))} aria-label="Velocidade da voz" /></label>
          </div>
        )}
      </div>
    </div>
  );
}
export const Guia = memo(GuiaBase);
