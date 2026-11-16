"use client";
import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { personagem } from "./config/personagem";
import { parseNegrito } from "./motor";
import { useGuia } from "./useGuia";

const { velocidadeDigitacaoMs } = personagem.comportamento;

function reduzMovimento() {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
}

function Texto({ texto, completo, onFim }: { texto: string; completo: boolean; onFim: () => void }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (completo || reduzMovimento()) { setN(texto.length); onFim(); return; }
    setN(0);
    const t = setInterval(() => setN((x) => {
      if (x + 1 >= texto.length) { clearInterval(t); onFim(); return texto.length; }
      return x + 1;
    }), velocidadeDigitacaoMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, completo]);
  // Digita o texto SEM os marcadores e depois aplica o negrito, para não aparecer "**" no meio da digitação.
  const limpo = texto.replace(/\*\*/g, "");
  const visivel = limpo.slice(0, n);
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

export function Guia() {
  const g = useGuia();
  const [completo, setCompleto] = useState(false);
  const a = g.aberta;
  useEffect(() => { setCompleto(false); }, [a?.momento, a?.indice]);

  if (!personagem.ativo) return null;
  const direita = personagem.visual.posicao === "inferior-direita";
  const lado = direita ? "right-3 sm:right-5 items-end sm:flex-row-reverse" : "left-3 sm:left-5 items-start sm:flex-row";
  const btn = "pointer-events-auto rounded-full px-4 py-2 text-base font-extrabold focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-indigo-700";

  if (g.silenciada) {
    return (
      <button type="button" onClick={() => g.silenciar(false)} aria-label={`Chamar a ${personagem.nome} de volta`}
        className={`${btn} fixed bottom-3 ${direita ? "right-3" : "left-3"} z-40 bg-white shadow-lg ring-2 ring-indigo-200`}>
        💬 {personagem.nome}
      </button>
    );
  }
  if (!a) {
    return (
      <div className={`pointer-events-none fixed bottom-0 z-40 flex ${direita ? "right-3" : "left-3"}`}>
        <button type="button" onClick={() => g.reverTutorial()} aria-label={`Ver o tutorial com a ${personagem.nome}`} title={`Ver tutorial com a ${personagem.nome}`}
          className="pointer-events-auto motion-safe:animate-floaty h-16 w-16 overflow-hidden rounded-full bg-white shadow-lg ring-2 ring-indigo-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-indigo-700 sm:h-20 sm:w-20">
          <Avatar expressao="feliz" tamanho={72} />
        </button>
      </div>
    );
  }

  const fala = a.falas[a.indice];
  const ultima = a.indice === a.falas.length - 1;
  return (
    <div className={`pointer-events-none fixed bottom-0 z-40 flex max-w-[calc(100vw-1.5rem)] flex-col gap-2 pb-2 ${lado}`}>
      <div key={`${a.momento}-${a.indice}`} className="motion-safe:animate-pop shrink-0 motion-safe:animate-floaty" style={{ width: "min(" + personagem.visual.tamanhoPx + "px, 28vw)" }}>
        <Avatar expressao={fala.expressao} tamanho={personagem.visual.tamanhoPx} />
      </div>
      <div role="status" aria-live="polite" onClick={() => setCompleto(true)}
        className="pointer-events-auto mb-4 w-[min(92vw,26rem)] rounded-3xl border-4 bg-white p-4 shadow-xl" style={{ borderColor: personagem.visual.corDestaque }}>
        <p className="text-xl font-bold leading-snug text-slate-900">
          <span className="sr-only">{personagem.nome}: </span>
          <Texto texto={fala.texto} completo={completo} onFim={() => {}} />
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {a.falas.length > 1 && (
            <span className="flex gap-1" aria-hidden="true">
              {a.falas.map((_, i) => <span key={i} className={`h-2.5 w-2.5 rounded-full ${i === a.indice ? "bg-slate-800" : "bg-slate-300"}`} />)}
            </span>
          )}
          <span className="flex-1" />
          {a.protegida && !ultima && <button type="button" className={`${btn} bg-slate-100 text-slate-800`} onClick={g.pularTutorial}>Pular tutorial</button>}
          <button type="button" className={`${btn} text-white`} style={{ background: personagem.visual.corDestaque }}
            onClick={g.avancar}>{ultima ? "Ok" : "Próximo ▸"}</button>
        </div>
        <button type="button" onClick={() => g.silenciar(true)} className="pointer-events-auto mt-2 text-sm font-bold text-slate-600 underline focus-visible:outline focus-visible:outline-4 focus-visible:outline-indigo-700">Esconder {personagem.nome}</button>
      </div>
    </div>
  );
}
