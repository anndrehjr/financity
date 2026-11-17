"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ErrorBox, Notice, Spinner, apiFetch, fmt, useApi } from "@/components/ui";
import FilterBar, { Scope, qs, useAsm } from "../../FilterBar";

type Detail = {
  number: number; total: number; max: number; title: string; theme: string; prompt: string; scenario: string; note: string; n: number; avg: number | null; index: number | null; excellent: number; inadequate: number;
  intermediate: Record<string, number>; difficulties: string[];
  options: { id: number; letter: string; text: string; points: number; why: string; count: number; students: { id: number; name: string; className: string | null }[] }[];
};

export default function Page({ params }: { params: Promise<{ number: string }> }) {
  const { number } = use(params);
  const [scope, setScope] = useState<Scope>("real"); const [cls, setCls] = useState(""); const [asm, setAsm] = useAsm();
  const { data, error, loading, reload } = useApi<Detail>(`/api/admin/questions/${number}?${qs(scope, cls, asm)}`);
  const [pts, setPts] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  useEffect(() => { if (data) setPts(Object.fromEntries(data.options.map((o) => [o.letter, o.points]))); }, [data]);

  async function save() {
    setMsg(null);
    try { await apiFetch(`/api/admin/questions/${number}`, { method: "PUT", body: { points: pts } }); setMsg({ ok: true, t: "Pontuações salvas. Valem para respostas futuras; as já registradas mantêm a pontuação da época." }); reload(); }
    catch (e) { setMsg({ ok: false, t: (e as Error).message }); }
  }

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <nav aria-label="Questões" className="flex flex-wrap gap-1">{Array.from({ length: data?.total ?? 8 }, (_, i) => i + 1).map((n) => <Link key={n} href={`/admin/questoes/${n}`} aria-current={String(n) === number ? "page" : undefined} className={`btn btn-sm ${String(n) === number ? "btn-primary" : "btn-ghost"}`}>Q{n}</Link>)}</nav>
        <FilterBar scope={scope} setScope={setScope} cls={cls} setCls={setCls} asm={asm} setAsm={setAsm} />
      </div>
      {loading && !data && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && (<>
        <section className="card">
          <p className="text-sm font-extrabold uppercase text-city-grape">Questão {data.number} • {data.theme}</p>
          <h1 className="font-display text-2xl font-extrabold">{data.title}</h1>
          <p className="mt-1 text-sm italic text-slate-600">{data.scenario}</p>
          <p className="mt-3 font-semibold">{data.prompt}</p>
          <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm"><b>Justificativa pedagógica:</b> {data.note}</p>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[["Respostas", fmt(data.n)], ["Média de pontos", fmt(data.avg)], ["Índice de desempenho", fmt(data.index, "%")], ["Decisões excelentes (pontuação máxima)", fmt(data.n ? Math.round((data.excellent / data.n) * 100) : null, "%")], ["Decisões inadequadas (0)", fmt(data.n ? Math.round((data.inadequate / data.n) * 100) : null, "%")]].map(([l, v]) => (
            <div key={l} className="card p-4"><div className="font-display text-2xl font-extrabold text-city-grape">{v}</div><div className="text-xs font-bold text-slate-600">{l}</div></div>))}
        </section>
        <p className="text-sm text-slate-600">Níveis intermediários: 2 pts = {data.intermediate["2"]}, 3 pts = {data.intermediate["3"]}, 4 pts = {data.intermediate["4"]}.</p>

        <section className="card"><h2 className="font-display text-lg font-extrabold">Principais dificuldades demonstradas</h2>
          {data.difficulties.length ? <ul className="mt-1 list-disc pl-5">{data.difficulties.map((d, i) => <li key={i}>{d}</li>)}</ul> : <p className="text-slate-600">Sem respostas para analisar neste filtro.</p>}</section>

        <section className="card overflow-x-auto" tabIndex={0}><h2 className="font-display text-lg font-extrabold">Alternativas, valores e distribuição</h2>
          <table className="mt-2 w-full min-w-[720px]"><thead><tr className="border-b"><th className="th">Alt.</th><th className="th">Texto</th><th className="th">Pontos</th><th className="th">Justificativa</th><th className="th">Marcaram</th><th className="th">Alunos</th></tr></thead>
            <tbody>{data.options.map((o) => (
              <tr key={o.id} className="border-b align-top last:border-0"><td className="td font-extrabold">{o.letter}</td><td className="td">{o.text}</td>
                <td className="td"><label className="sr-only" htmlFor={`p${o.letter}`}>Pontos da alternativa {o.letter}</label><input id={`p${o.letter}`} type="number" min={0} max={5} step={1} className="w-16 rounded-lg border-2 border-slate-300 px-2 py-1 font-bold" value={pts[o.letter] ?? o.points} onChange={(e) => setPts({ ...pts, [o.letter]: Number(e.target.value) })} /></td>
                <td className="td">{o.why}</td><td className="td font-bold">{o.count}{data.n ? ` (${Math.round((o.count / data.n) * 100)}%)` : ""}</td>
                <td className="td">{o.students.length ? o.students.map((s) => <Link key={s.id} href={`/admin/alunos/${s.id}`} className="mr-2 inline-block text-indigo-700 underline">{s.name}</Link>) : "—"}</td></tr>))}</tbody></table>
          <div className="no-print mt-3 space-y-2"><button className="btn btn-primary btn-sm" onClick={save}>Salvar pontuações</button>
            <p className="text-xs text-slate-600">Esta pergunta vale no máximo {data.max} pontos (valores inteiros de 0 a {data.max}). Alterações valem para respostas futuras.</p>
            {msg && <Notice kind={msg.ok ? "ok" : "warn"}>{msg.t}</Notice>}</div>
        </section>
      </>)}
    </div>
  );
}
