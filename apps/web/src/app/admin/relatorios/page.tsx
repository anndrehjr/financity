"use client";
import Link from "next/link";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ErrorBox, Spinner, fmt, useApi } from "@/components/ui";
import FilterBar, { Scope, qs, useAsm } from "../FilterBar";
import { AXIS, BAR_RADIUS_V, SERIES, TOOLTIP } from "../chartTheme";
import "../reports-theme.css";

type R = {
  assessmentTitle: string;
  title: string; school: string; teacher: string; className: string; scope: string; generatedAt: string; participants: number; registered: number; completed: number;
  avgPoints: number | null; avgPct: number | null; best: number | null; max: number;
  distribution: { label: string; alunos: number }[];
  questions: { number: number; theme: string; n: number; avg: number | null; index: number | null; excellent: number; inadequate: number }[];
  lowest: { number: number; theme: string; index: number | null }[]; highest: { number: number; theme: string; index: number | null }[];
  difficulties: string[]; recommendations: string[];
  ranking: { rank: number; studentId: number; name: string; className: string | null; total: number; pct: number }[];
};

// ícones dos indicadores (só visual)
const ICONS: Record<string, string> = {
  users: "M16 11a3 3 0 1 0-2.8-4M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-3 0-5 1.5-5 3.5V18h10v-1.5C13 14.5 11 13 8 13zm8 0c-.6 0-1.2.1-1.7.2 1 .8 1.7 1.9 1.7 3.3V18h5v-1.5c0-2-2-3.5-5-3.5z",
  play: "M8 5v14l11-7z",
  check: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z",
  chart: "M5 9h3v10H5zm5-5h3v15h-3zm5 8h3v7h-3z",
  percent: "M7.5 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm9 9a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM18.7 4.3 4.3 18.7l1.4 1.4L20.1 5.7z",
};

export default function Page() {
  const [scope, setScope] = useState<Scope>("real"); const [cls, setCls] = useState(""); const [asm, setAsm] = useAsm();
  const { data, error, loading, reload } = useApi<R>(`/api/admin/report?${qs(scope, cls, asm)}`);
  const q = qs(scope, cls, asm);
  return (
    <div className="rt space-y-5">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-3xl font-extrabold">Relatórios</h1><p className="text-slate-600">Relatório geral da turma, com dados reais registrados.</p></div>
        <FilterBar scope={scope} setScope={setScope} cls={cls} setCls={setCls} asm={asm} setAsm={setAsm} />
      </div>
      <div className="no-print flex flex-wrap gap-2">
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>Exportar PDF</button>
        <a className="btn btn-ghost btn-sm" href={`/api/admin/export?type=alunos&${q}`}>CSV por aluno</a>
        <a className="btn btn-ghost btn-sm" href={`/api/admin/export?type=resumo&${q}`}>CSV por questão</a>
        <span className="self-center text-xs text-slate-600">PDF: na janela de impressão, escolha “Salvar como PDF”.</span>
      </div>
      {loading && !data && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && (
        <article className="space-y-5 print:space-y-4">
          <header className="card border-b pb-3">
            <p className="text-sm font-bold text-slate-600">{data.school || "Escola (configure em Configurações)"} • Prof. {data.teacher || "—"} • {new Date(data.generatedAt).toLocaleDateString("pt-BR")}</p>
            <h1 className="font-display text-2xl font-extrabold">{data.title}</h1>
            <p className="text-sm">Turma: <b>{data.className}</b> • {data.assessmentTitle}</p>
            {data.scope !== "real" && <p className="rt-warn mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-sm font-bold text-amber-900">Inclui DADOS DE DEMONSTRAÇÃO (fictícios)</p>}
          </header>
          <section className="kpi-grid grid grid-cols-2 gap-3 md:grid-cols-5" style={{ "--kpi-cols": 5 } as React.CSSProperties}>
            {[["Cadastrados", fmt(data.registered), "users"], ["Participantes", fmt(data.participants), "play"], ["Concluintes", fmt(data.completed), "check"], ["Pontuação média", `${fmt(data.avgPoints)}/${data.max}`, "chart"], ["Aproveitamento médio", fmt(data.avgPct, "%"), "percent"]].map(([l, v, ic]) => (
              <div key={l} className="kpi rounded-2xl bg-indigo-50 p-3">
                <div className="kpi-top"><div className="kpi-label text-xs font-bold">{l}</div><span className="kpi-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d={ICONS[ic]} /></svg></span></div>
                <div className="kpi-value font-display text-2xl font-extrabold text-city-grape">{v}</div>
              </div>))}
          </section>
          <section className="rt-grid grid gap-4 md:grid-cols-2">
            <div className="card rt-c3"><div className="card-header !mb-2"><div><h2 className="card-title font-display text-lg font-extrabold">Distribuição de pontuações</h2><p className="card-subtitle text-sm text-slate-600">Quantos alunos em cada faixa</p></div></div>
              <ResponsiveContainer width="100%" height={280}><BarChart data={data.distribution}><CartesianGrid vertical={false} /><XAxis dataKey="label" {...AXIS} /><YAxis allowDecimals={false} {...AXIS} /><Tooltip {...TOOLTIP} /><Bar dataKey="alunos" name="Alunos" fill={SERIES[1]} radius={BAR_RADIUS_V} isAnimationActive={false} /></BarChart></ResponsiveContainer></div>
            <div className="card rt-c3"><div className="card-header !mb-2"><div><h2 className="card-title font-display text-lg font-extrabold">Média de pontos por questão</h2><p className="card-subtitle text-sm text-slate-600">Pontos médios em cada pergunta</p></div></div>
              <ResponsiveContainer width="100%" height={280}><BarChart data={data.questions.map((x) => ({ name: `Q${x.number}`, media: x.avg ?? 0 }))}><CartesianGrid vertical={false} /><XAxis dataKey="name" {...AXIS} /><YAxis domain={[0, "auto"]} allowDecimals={false} {...AXIS} /><Tooltip {...TOOLTIP} /><Bar dataKey="media" name="Média" fill={SERIES[0]} radius={BAR_RADIUS_V} isAnimationActive={false} /></BarChart></ResponsiveContainer></div>
          </section>
          <section className="card overflow-x-auto" tabIndex={0}><div className="card-header !mb-2"><div><h2 className="card-title font-display text-lg font-extrabold">Desempenho por questão</h2><p className="card-subtitle text-sm text-slate-600">Respostas, média e índice de cada pergunta</p></div></div>
            <table className="w-full min-w-[560px]"><thead><tr className="border-b"><th className="th">Questão</th><th className="th">Tema</th><th className="th">Respostas</th><th className="th">Média</th><th className="th">Índice</th><th className="th">Pont. máxima</th><th className="th">Zero</th></tr></thead>
              <tbody>{data.questions.map((x) => <tr key={x.number} className="border-b last:border-0"><td className="td font-bold">Q{x.number}</td><td className="td">{x.theme}</td><td className="td">{x.n}</td><td className="td">{fmt(x.avg)}</td><td className="td">{fmt(x.index, "%")}</td><td className="td">{x.excellent}</td><td className="td">{x.inadequate}</td></tr>)}</tbody></table></section>
          <section className="rt-grid grid gap-3 sm:grid-cols-2">
            <div className="card rt-c3 rt-box-bad rounded-2xl bg-rose-50 p-3"><h2 className="card-title font-bold">Questões com menor média</h2><ul className="mt-2 text-sm">{data.lowest.length ? data.lowest.map((x) => <li key={x.number}>Q{x.number} — {x.theme} ({fmt(x.index, "%")})</li>) : <li>Sem dados.</li>}</ul></div>
            <div className="card rt-c3 rt-box-ok rounded-2xl bg-emerald-50 p-3"><h2 className="card-title font-bold">Questões com maior média</h2><ul className="mt-2 text-sm">{data.highest.length ? data.highest.map((x) => <li key={x.number}>Q{x.number} — {x.theme} ({fmt(x.index, "%")})</li>) : <li>Sem dados.</li>}</ul></div>
          </section>
          <section className="card"><div className="card-header !mb-2"><h2 className="card-title font-display text-lg font-extrabold">Dificuldades mais frequentes</h2></div><ul className="list-disc space-y-1 pl-5">{data.difficulties.map((d, i) => <li key={i}>{d}</li>)}</ul></section>
          <section className="card"><div className="card-header !mb-2"><h2 className="card-title font-display text-lg font-extrabold">Recomendações de retomada pedagógica</h2></div><ul className="list-disc space-y-1 pl-5">{data.recommendations.map((d, i) => <li key={i}>{d}</li>)}</ul></section>
          <section className="card overflow-x-auto" tabIndex={0}><div className="card-header !mb-2"><div><h2 className="card-title font-display text-lg font-extrabold">Ranking (concluintes)</h2><p className="card-subtitle text-sm text-slate-600">Somente quem concluiu o mapa</p></div></div>
            {data.ranking.length === 0 ? <p className="text-slate-600">Nenhum concluinte.</p> : <table className="w-full min-w-[420px]"><thead><tr className="border-b"><th className="th">#</th><th className="th">Aluno</th><th className="th">Turma</th><th className="th">Pontos</th><th className="th">%</th></tr></thead>
              <tbody>{data.ranking.map((r) => <tr key={r.studentId} className="border-b last:border-0"><td className="td font-bold">{r.rank}º</td><td className="td"><Link href={`/admin/alunos/${r.studentId}`} className="rt-link text-indigo-700 underline">{r.name}</Link></td><td className="td">{r.className ?? "—"}</td><td className="td">{r.total}</td><td className="td">{r.pct}%</td></tr>)}</tbody></table>}</section>
          <footer className="border-t pt-2 text-xs text-slate-600">Relatório gerado pelo sistema a partir dos dados registrados. A classificação é motivacional e não é diagnóstico definitivo de aprendizagem. Contém dados pessoais de estudantes: uso restrito ao professor.</footer>
        </article>)}
    </div>
  );
}
