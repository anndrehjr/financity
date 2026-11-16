"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alex, MapArt, Medal, SceneByKey } from "@/components/art";
import { ErrorBox, Spinner, apiFetch } from "@/components/ui";
import { personagem } from "@/features/guia/config/personagem";
import { reacaoPorPontos } from "@/features/guia/motor";
import { useGuia } from "@/features/guia/useGuia";
import { emitir } from "@/features/guia/tutorial/barramento";
import { useTutorial } from "@/features/guia/tutorial/TutorialProvider";


type Question = { id: number; number: number; title: string; scene: string; scenario: string; dialog: string; prompt: string; kind: "choice" | "multi" | "order"; hint: string | null; options: { id: number; letter: string; text: string }[] };
type State = { map: { title: string; subtitle: string; sort?: number }; status: "not_started" | "in_progress" | "completed"; score: number; max: number; answered: number; total: number; question?: Question };
type Result = { studentName: string; score: number; max: number; pct: number; medal: { key: string; title: string; msg: string }; dominio?: { key: string; label: string } };

export default function AtividadeClient({ id }: { id: number }) {
  const [state, setState] = useState<State | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [multi, setMulti] = useState<number[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transition, setTransition] = useState(false);
  const guia = useGuia();
  const tut = useTutorial();
  const falouIntro = useRef<number | null>(null);
  const falouFim = useRef(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const s = await apiFetch<State>(`/api/game/${id}/state`);
      setState(s);
      setSelected(null); setMulti([]); setShowHint(false);
      setOrder(s.question?.options.map((o) => o.id) ?? []);
      if (s.status === "completed") setResult(await apiFetch<Result>(`/api/game/${id}/result`));
    } catch (e) { setError((e as Error).message); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  // Nina: só fala; nunca altera o estado do jogo.
  const sort = state?.map.sort ?? id;
  useEffect(() => {
    if (state?.status === "not_started" && falouIntro.current !== id) { falouIntro.current = id; guia.falar(`mapa_${sort}`); }
  }, [state?.status, id, sort, guia]);
  useEffect(() => {
    if (state?.status === "completed" && result && !falouFim.current) { falouFim.current = true; guia.falar(sort >= 4 ? "vitoria" : "fase_concluida"); emitir("atividade:concluida", { id }); }
  }, [state?.status, result, sort, guia]);
  const emAndamento = state?.status === "in_progress";
  useEffect(() => { if (emAndamento) emitir("atividade:iniciada", { id }); }, [emAndamento, id]);
  const perguntaId = state?.status === "in_progress" && !transition ? state.question?.id : undefined;
  useEffect(() => { if (perguntaId !== undefined) emitir("pergunta:exibida", { id, pergunta: perguntaId }); }, [perguntaId, id]);
  useEffect(() => {
    if (perguntaId === undefined) return;
    const t = setTimeout(() => guia.falar("parado"), personagem.comportamento.segundosParado * 1000);
    return () => clearTimeout(t);
  }, [perguntaId, guia]);

  async function start() {
    setBusy(true); setError(null);
    try { setState(await apiFetch<State>(`/api/game/${id}/start`, { method: "POST" })); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  async function confirm() {
    const qk = state?.question;
    if (!qk || busy) return;
    if (qk.kind === "choice" && selected === null) return;
    if (qk.kind === "multi" && multi.length === 0) return;
    setBusy(true); setError(null);
    try {
      const body = qk.kind === "choice" ? { optionId: selected } : qk.kind === "multi" ? { optionIds: multi } : { order };
      const r = await apiFetch<{ score: number; completed: boolean; earned: number; questionMax: number }>(`/api/game/${id}/answer`, { method: "POST", body: { questionId: qk.id, usedHint: showHint, ...body } });
      const c = personagem.comportamento;
      emitir("pergunta:respondida", { id, pergunta: qk.id, pontos: r.earned, maximo: r.questionMax });
      if (c.reagirAoResultado && !r.completed) guia.falar(reacaoPorPontos((r.earned / Math.max(1, r.questionMax)) * 5, c.minAcerto, c.minParcial));
      setTransition(true);
      await new Promise((r) => setTimeout(r, 1700));
      setTransition(false);
      await load();
    } catch (e) {
      setError((e as Error).message);
      setTransition(false);
      await load(); // ressincroniza (ex.: resposta já registrada)
    } finally { setBusy(false); }
  }

  const Top = ({ score }: { score?: number }) => (
    <header className="mx-auto flex max-w-4xl items-center justify-between gap-2 py-3">
      <Link href="/jogo" className="btn btn-ghost btn-sm whitespace-nowrap">← Mapas</Link>
      <span className="text-center font-display text-sm font-extrabold leading-tight text-city-grape sm:text-lg">A CIDADE DO CONSUMO</span>
      {score !== undefined ? <span className="whitespace-nowrap rounded-2xl bg-white px-3 py-1 font-display text-lg font-extrabold text-amber-700 shadow" aria-live="polite">⭐ {score} pts</span> : <span />}
    </header>
  );

  if (!state && !error) return <main className="game-bg"><Spinner label="Abrindo o mapa…" /></main>;
  if (!state) return <main className="game-bg p-4"><div className="mx-auto max-w-xl pt-10"><ErrorBox message={error!} onRetry={load} /><Link href="/jogo" className="btn btn-ghost mt-4">Voltar aos mapas</Link></div></main>;

  // ---------- Conclusão ----------
  if (state.status === "completed" && result) {
    return (
      <main className="game-bg px-4 pb-10">
        <Top />
        <section className="card mx-auto mt-2 max-w-2xl animate-pop text-center">
          <h1 className="font-display text-4xl font-extrabold text-city-grape md:text-5xl">MISSÃO CONCLUÍDA!</h1>
          <p className="mt-1 text-lg font-bold">{result.studentName}</p>
          <div className="mt-2 flex justify-center"><Medal k={result.medal.key} className="h-36 w-32 animate-floaty" /></div>
          <p className="font-display text-2xl font-extrabold text-indigo-900">{result.medal.title}</p>
          <div className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-3">
            <Stat label="Pontos" value={String(result.score)} />
            <Stat label="Máximo" value={String(result.max)} />
            <Stat label="Aproveitamento" value={`${result.pct}%`} />
          </div>
          {result.dominio && <p className="mx-auto mt-3 max-w-md rounded-2xl bg-indigo-50 p-2 text-base font-bold text-indigo-900">Nível de domínio neste tema: {result.dominio.label}</p>}
          <p className="mx-auto mt-4 max-w-md text-lg font-semibold">{result.medal.msg}</p>
          <p className="mx-auto mt-2 max-w-md text-xs text-slate-600">A classificação é apenas motivacional e não define o quanto você aprendeu.</p>
          <Link href="/jogo" className="btn btn-primary mt-5">Voltar aos mapas</Link>
        </section>
      </main>
    );
  }

  // ---------- Introdução ----------
  if (state.status === "not_started") {
    return (
      <main className="game-bg px-4 pb-10">
        <Top />
        <section className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl animate-pop">
          <div className="relative aspect-[16/9] md:aspect-[2/1]"><MapArt n={(state.map.sort ?? 1) as 1 | 2 | 3 | 4} />
            <div className="absolute bottom-0 left-4 h-[62%] animate-floaty"><Alex /></div></div>
          <div className="p-6 md:p-8">
            <h1 className="font-display text-3xl font-extrabold md:text-4xl">A CIDADE DO CONSUMO</h1>
            <p className="mt-3 rounded-2xl bg-sky-50 p-4 text-lg font-semibold text-sky-900"><b>Alex:</b> “Oi! Eu sou o Alex. Hoje vamos passear pelo centro comercial e enfrentar {state.total} desafios do dia a dia. Pense com calma, escolha a atitude que você considera mais adequada e confirme. Vamos nessa?”</p>
            <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700"><li>Responda uma situação de cada vez.</li><li>Depois de confirmar, a resposta não pode ser trocada.</li><li>Se fechar a página, você continua de onde parou.</li></ul>
            {error && <div className="mt-3"><ErrorBox message={error} /></div>}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button data-tutorial="comecar" className="btn btn-sun w-full text-xl md:w-auto" onClick={start} disabled={busy}>{busy ? "Preparando…" : "COMEÇAR AVENTURA"}</button>
              <button type="button" className="btn btn-ghost" onClick={() => tut.iniciar()}>Ver tutorial com a {personagem.nome}</button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // ---------- Transição ----------
  if (transition) {
    return (
      <main className="game-bg flex min-h-screen flex-col items-center justify-center px-4 text-center" aria-live="polite">
        <div className="h-56 animate-walk"><Alex pose="walk" /></div>
        <p className="mt-4 font-display text-2xl font-extrabold text-indigo-900">Resposta registrada!</p>
        <p className="font-semibold text-indigo-800">Alex segue para o próximo cenário…</p>
      </main>
    );
  }

  // ---------- Pergunta ----------
  const q = state.question;
  if (!q) return <main className="game-bg"><Spinner /></main>;
  return (
    <main className="game-bg px-4 pb-10">
      <Top score={state.score} />
      <div className="mx-auto max-w-4xl">
        <div className="mb-3" role="progressbar" aria-valuemin={1} aria-valuemax={state.total} aria-valuenow={state.answered + 1} aria-label={`Desafio ${state.answered + 1} de ${state.total}`}>
          <div className="mb-1 flex justify-between text-sm font-extrabold text-indigo-900"><span>Desafio {state.answered + 1} de {state.total}</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-white/80"><div className="h-full rounded-full bg-city-grape transition-all" style={{ width: `${(state.answered / state.total) * 100}%` }} /></div>
        </div>

        <section key={q.id} className="overflow-hidden rounded-3xl bg-white shadow-xl animate-pop">
          <div className="relative aspect-[16/9] md:aspect-[2/1]"><SceneByKey k={q.scene} />
            <div className="absolute bottom-0 left-3 h-[58%]"><Alex pose="think" /></div>
          </div>
          {q.dialog && <p className="bg-sky-50 px-5 py-3 text-base font-bold text-sky-950 md:px-7"><span className="text-city-grape">Alex:</span> “{q.dialog}”</p>}
          <div className="p-5 md:p-7">
            <p className="text-sm font-extrabold uppercase tracking-wide text-city-grape">Desafio {q.number}</p>
            <h1 className="font-display text-3xl font-extrabold">{q.title}</h1>
            <p className="mt-1 text-sm font-semibold italic text-slate-600">{q.scenario}</p>
            <p className="mt-4 text-lg font-bold leading-snug" id="enunciado">{q.prompt}</p>

            {q.kind === "multi" && <p className="mt-1 text-sm font-bold text-city-grape">Marque todas as alternativas que se aplicam.</p>}
            {q.kind === "order" && <p className="mt-1 text-sm font-bold text-city-grape">Use as setas para colocar as etapas na ordem mais adequada.</p>}

            {q.kind === "choice" && (
              <div data-tutorial="opcoes" role="radiogroup" aria-labelledby="enunciado" className="mt-4 grid gap-3">
                {q.options.map((o) => {
                  const on = selected === o.id;
                  return (
                    <button key={o.id} type="button" role="radio" aria-checked={on} disabled={busy} onClick={() => { setSelected(o.id); emitir("opcao:selecionada", { opcao: o.id }); }}
                      className={`flex items-start gap-3 rounded-2xl border-2 p-3 text-left text-base font-semibold transition md:text-lg ${on ? "border-city-grape bg-violet-50 ring-2 ring-city-grape" : "border-indigo-100 bg-white hover:border-indigo-300 hover:bg-indigo-50"}`}>
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-lg font-extrabold ${on ? "bg-city-grape text-white" : "bg-indigo-100 text-indigo-800"}`}>{o.letter}</span>
                      <span className="pt-1">{o.text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {q.kind === "multi" && (
              <div data-tutorial="opcoes" role="group" aria-labelledby="enunciado" className="mt-4 grid gap-3">
                {q.options.map((o) => {
                  const on = multi.includes(o.id);
                  return (
                    <button key={o.id} type="button" role="checkbox" aria-checked={on} disabled={busy}
                      onClick={() => { setMulti((m) => (m.includes(o.id) ? m.filter((x) => x !== o.id) : [...m, o.id])); emitir("opcao:selecionada", { opcao: o.id }); }}
                      className={`flex items-start gap-3 rounded-2xl border-2 p-3 text-left text-base font-semibold transition md:text-lg ${on ? "border-city-grape bg-violet-50 ring-2 ring-city-grape" : "border-indigo-100 bg-white hover:border-indigo-300 hover:bg-indigo-50"}`}>
                      <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-display text-lg font-extrabold ${on ? "bg-city-grape text-white" : "bg-indigo-100 text-indigo-800"}`}>{on ? "✓" : o.letter}</span>
                      <span className="pt-1">{o.text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {q.kind === "order" && (
              <ol data-tutorial="opcoes" aria-labelledby="enunciado" className="mt-4 grid gap-3">
                {order.map((oid, i) => {
                  const txt = q.options.find((o) => o.id === oid)?.text ?? "";
                  const move = (d: number) => { emitir("opcao:selecionada", { ordem: true }); setOrder((arr) => { const n = [...arr]; const j = i + d; if (j < 0 || j >= n.length) return arr; [n[i], n[j]] = [n[j], n[i]]; return n; }); };
                  return (
                    <li key={oid} className="flex items-center gap-3 rounded-2xl border-2 border-indigo-100 bg-white p-3 text-base font-semibold md:text-lg">
                      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-display text-lg font-extrabold text-indigo-800">{i + 1}</span>
                      <span className="flex-1">{txt}</span>
                      <span className="flex shrink-0 flex-col gap-1">
                        <button type="button" className="btn btn-ghost btn-sm" disabled={busy || i === 0} onClick={() => move(-1)} aria-label={`Subir: ${txt}`}>▲</button>
                        <button type="button" className="btn btn-ghost btn-sm" disabled={busy || i === order.length - 1} onClick={() => move(1)} aria-label={`Descer: ${txt}`}>▼</button>
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}

            {q.hint && (
              <div className="mt-4">
                {!showHint
                  ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowHint(true); emitir("dica:aberta", { id }); }}>💡 Preciso de uma dica</button>
                  : <p role="note" className="rounded-2xl bg-amber-50 p-3 font-semibold text-amber-900">💡 Dica: {q.hint} <span className="block text-xs font-bold text-amber-800">A dica ajuda a pensar e não tira pontos.</span></p>}
              </div>
            )}

            {error && <div className="mt-4"><ErrorBox message={error} /></div>}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button data-tutorial="confirmar" className="btn btn-sun text-xl" onClick={confirm} disabled={busy || (q.kind === "choice" && selected === null) || (q.kind === "multi" && multi.length === 0)}>{busy ? "Enviando…" : "CONFIRMAR RESPOSTA"}</button>
              <span className="text-sm font-semibold text-slate-600">Depois de confirmar, não será possível alterar.</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-indigo-50 p-3"><div className="font-display text-3xl font-extrabold text-city-grape">{value}</div><div className="text-xs font-bold text-slate-600">{label}</div></div>;
}
