"use client";
import Link from "next/link";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ErrorBox, Spinner, fmt, useApi } from "@/components/ui";
import FilterBar, { Scope, qs, useAsm } from "../FilterBar";

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

export default function Page() {
  const [scope, setScope] = useState<Scope>("real"); const [cls, setCls] = useState(""); const [asm, setAsm] = useAsm();
  const { data, error, loading, reload } = useApi<R>(`/api/admin/report?${qs(scope, cls, asm)}`);
  const q = qs(scope, cls, asm);
  return (
    <div className="space-y-4">
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
        <article className="card space-y-5">
          <header className="border-b pb-3">
            <p className="text-sm font-bold text-slate-600">{data.school || "Escola (configure em Configurações)"} • Prof. {data.teacher || "—"} • {new Date(data.generatedAt).toLocaleDateString("pt-BR")}</p>
            <h1 className="font-display text-2xl font-extrabold">{data.title}</h1>
            <p className="text-sm">Turma: <b>{data.className}</b> • {data.assessmentTitle}</p>
            {data.scope !== "real" && <p className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-sm font-bold text-amber-900">Inclui DADOS DE DEMONSTRAÇÃO (fictícios)</p>}
          </header>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[["Cadastrados", fmt(data.registered)], ["Participantes", fmt(data.participants)], ["Concluintes", fmt(data.completed)], ["Pontuação média", `${fmt(data.avgPoints)}/${data.max}`], ["Aproveitamento médio", fmt(data.avgPct, "%")]].map(([l, v]) => (
              <div key={l} className="rounded-2xl bg-indigo-50 p-3"><div className="font-display text-2xl font-extrabold text-city-grape">{v}</div><div className="text-xs font-bold">{l}</div></div>))}
          </section>
          <section className="grid gap-4 md:grid-cols-2">
            <div><h2 className="font-display text-lg font-extrabold">Distribuição de pontuações</h2>
              <ResponsiveContainer width="100%" height={200}><BarChart data={data.distribution}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="alunos" name="Alunos" fill="#0ea5e9" isAnimationActive={false} /></BarChart></ResponsiveContainer></div>
            <div><h2 className="font-display text-lg font-extrabold">Média por questão (0 a 5)</h2>
              <ResponsiveContainer width="100%" height={200}><BarChart data={data.questions.map((x) => ({ name: `Q${x.number}`, media: x.avg ?? 0 }))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} /><Tooltip /><Bar dataKey="media" name="Média" fill="#7c3aed" isAnimationActive={false} /></BarChart></ResponsiveContainer></div>
          </section>
          <section className="overflow-x-auto" tabIndex={0}><h2 className="font-display text-lg font-extrabold">Desempenho por questão</h2>
            <table className="w-full min-w-[560px]"><thead><tr className="border-b"><th className="th">Questão</th><th className="th">Tema</th><th className="th">Respostas</th><th className="th">Média</th><th className="th">Índice</th><th className="th">5 pts</th><th className="th">0 pts</th></tr></thead>
              <tbody>{data.questions.map((x) => <tr key={x.number} className="border-b last:border-0"><td className="td font-bold">Q{x.number}</td><td className="td">{x.theme}</td><td className="td">{x.n}</td><td className="td">{fmt(x.avg)}</td><td className="td">{fmt(x.index, "%")}</td><td className="td">{x.excellent}</td><td className="td">{x.inadequate}</td></tr>)}</tbody></table></section>
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-rose-50 p-3"><h2 className="font-bold">Questões com menor média</h2><ul className="text-sm">{data.lowest.length ? data.lowest.map((x) => <li key={x.number}>Q{x.number} — {x.theme} ({fmt(x.index, "%")})</li>) : <li>Sem dados.</li>}</ul></div>
            <div className="rounded-2xl bg-emerald-50 p-3"><h2 className="font-bold">Questões com maior média</h2><ul className="text-sm">{data.highest.length ? data.highest.map((x) => <li key={x.number}>Q{x.number} — {x.theme} ({fmt(x.index, "%")})</li>) : <li>Sem dados.</li>}</ul></div>
          </section>
          <section><h2 className="font-display text-lg font-extrabold">Dificuldades mais frequentes</h2><ul className="list-disc pl-5">{data.difficulties.map((d, i) => <li key={i}>{d}</li>)}</ul></section>
          <section><h2 className="font-display text-lg font-extrabold">Recomendações de retomada pedagógica</h2><ul className="list-disc pl-5">{data.recommendations.map((d, i) => <li key={i}>{d}</li>)}</ul></section>
          <section className="overflow-x-auto" tabIndex={0}><h2 className="font-display text-lg font-extrabold">Ranking (concluintes)</h2>
            {data.ranking.length === 0 ? <p className="text-slate-600">Nenhum concluinte.</p> : <table className="w-full min-w-[420px]"><thead><tr className="border-b"><th className="th">#</th><th className="th">Aluno</th><th className="th">Turma</th><th className="th">Pontos</th><th className="th">%</th></tr></thead>
              <tbody>{data.ranking.map((r) => <tr key={r.studentId} className="border-b last:border-0"><td className="td font-bold">{r.rank}º</td><td className="td"><Link href={`/admin/alunos/${r.studentId}`} className="text-indigo-700 underline">{r.name}</Link></td><td className="td">{r.className ?? "—"}</td><td className="td">{r.total}</td><td className="td">{r.pct}%</td></tr>)}</tbody></table>}</section>
          <footer className="border-t pt-2 text-xs text-slate-600">Relatório gerado pelo sistema a partir dos dados registrados. A classificação é motivacional e não é diagnóstico definitivo de aprendizagem. Contém dados pessoais de estudantes: uso restrito ao professor.</footer>
        </article>)}
    </div>
  );
}
