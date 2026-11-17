"use client";
import Link from "next/link";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ErrorBox, Notice, Spinner, apiFetch, fmt, useApi } from "@/components/ui";
import FilterBar, { Scope, qs, useAsm } from "./FilterBar";

type D = {
  assessment: { id: number; grade: number; sort: number; title: string };
  max: number;
  cards: { totalStudents: number; started: number; completed: number; avgPoints: number | null; best: number | null; avgPct: number | null };
  byMap: { name: string; available: boolean; avgPct: number | null }[];
  distribution: { label: string; alunos: number }[];
  byQuestion: { name: string; theme: string; media: number | null; n: number }[];
  alternatives: { number: number; theme: string; title: string; data: { letter: string; alunos: number }[] }[];
  progress: { name: string; value: number }[];
  ranking: { rank: number; studentId: number; name: string; className: string | null; map1: number; total: number; pct: number; status: string; demo: boolean }[];
  partial: { studentId: number; name: string; className: string | null; partial: number; demo: boolean }[];
  questions: { number: number; theme: string; title: string; n: number; avg: number | null; index: number | null; excellent: number; inadequate: number }[];
  insights: string[];
};

const PIE = ["#94a3b8", "#fbbf24", "#34d399"];
const BAR = "#7c3aed";

export default function Dashboard() {
  const [scope, setScope] = useState<Scope>("real");
  const [cls, setCls] = useState("");
  const [asm, setAsm] = useAsm();
  const [demoMsg, setDemoMsg] = useState<string | null>(null);
  const { data, error, loading, reload } = useApi<D>(`/api/admin/dashboard?${qs(scope, cls, asm)}`);
  const [altQ, setAltQ] = useState(1);

  async function demo(kind: "add" | "remove") {
    if (kind === "remove" && !confirm("Remover todos os dados de demonstração? Os dados reais não são afetados.")) return;
    try {
      await apiFetch("/api/admin/demo", { method: kind === "add" ? "POST" : "DELETE" });
      setDemoMsg(kind === "add" ? "Dados de demonstração criados. Escolha “Somente demonstração” em “Dados exibidos” para vê-los." : "Dados de demonstração removidos.");
      if (kind === "remove") setScope("real");
      reload();
    } catch (e) { setDemoMsg((e as Error).message); }
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-3xl font-extrabold">Painel geral</h1><p className="text-slate-600">{data ? `Mapa ${data.assessment.sort} — ${data.assessment.title}` : ""} (pontuação máxima: {data?.max ?? 25})</p></div>
        <FilterBar scope={scope} setScope={setScope} cls={cls} setCls={setCls} asm={asm} setAsm={setAsm} />
      </div>

      {loading && !data && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {data && (<>
        <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Card label="Alunos cadastrados" value={fmt(data.cards.totalStudents)} />
          <Card label="Iniciaram o jogo" value={fmt(data.cards.started)} />
          <Card label="Concluíram o mapa" value={fmt(data.cards.completed)} />
          <Card label="Média de pontos (concluintes)" value={fmt(data.cards.avgPoints)} />
          <Card label="Melhor pontuação" value={fmt(data.cards.best)} />
          <Card label="Aproveitamento médio" value={fmt(data.cards.avgPct, "%")} />
        </section>
        {data.cards.completed === 0 && <Notice>Ainda não há alunos que concluíram o mapa neste filtro. Os indicadores aparecem como “—” até haver dados reais.</Notice>}

        <section className="card"><h2 className="font-display text-xl font-extrabold">Leitura automática dos resultados</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-800">{data.insights.map((t, i) => <li key={i}>{t}</li>)}</ul></section>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Gráfico 1 — Desempenho por mapa (% médio)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.byMap.map((m) => ({ ...m, v: m.avgPct ?? 0 }))} layout="vertical" margin={{ left: 10, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" domain={[0, 100]} unit="%" /><YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(_v, _n, p) => (p.payload.available ? (p.payload.avgPct === null ? "Sem dados" : `${p.payload.avgPct}%`) : "Ainda não disponível")} />
                <Bar dataKey="v" fill={BAR} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <ul className="mt-1 text-xs text-slate-600">{data.byMap.filter((m) => !m.available).map((m) => <li key={m.name}>{m.name}: <b>Ainda não disponível</b></li>)}</ul>
          </ChartCard>

          <ChartCard title="Gráfico 2 — Distribuição de pontuações (concluintes)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.distribution}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="alunos" name="Alunos" fill="#0ea5e9" radius={[8, 8, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Gráfico 3 — Média de pontos por questão">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.byQuestion}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, "auto"]} allowDecimals={false} /><Tooltip formatter={(v, _n, p) => [v === null ? "Sem respostas" : v, p.payload.theme]} />
                <Bar dataKey="media" name="Média" fill="#34d399" radius={[8, 8, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Gráfico 4 — Análise das alternativas">
            <label className="no-print mb-2 block text-sm font-bold">Questão
              <select className="ml-2 rounded-xl border-2 border-slate-300 px-2 py-1" value={altQ} onChange={(e) => setAltQ(Number(e.target.value))}>
                {data.alternatives.map((a) => <option key={a.number} value={a.number}>Q{a.number} — {a.title}</option>)}
              </select></label>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.alternatives.find((a) => a.number === altQ)?.data ?? []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="letter" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="alunos" name="Alunos" fill="#f59e0b" radius={[8, 8, 0, 0]} /></BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-600">As letras seguem a numeração original (A–E) do banco de perguntas, não a ordem embaralhada vista pelo aluno.</p>
          </ChartCard>

          <ChartCard title="Gráfico 5 — Progresso da turma">
            <p className="sr-only">{data.progress.map((p) => `${p.name}: ${p.value}`).join("; ")}.</p>
            <div inert>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart accessibilityLayer={false}><Pie data={data.progress} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2} label={(e) => `${e.value}`}>
                {data.progress.map((_, i) => <Cell key={i} fill={PIE[i]} />)}</Pie><Legend /><Tooltip /></PieChart>
            </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <section className="card overflow-x-auto" tabIndex={0}>
          <h2 className="font-display text-xl font-extrabold">Análise das questões</h2>
          <p className="text-sm text-slate-600">Clique na questão para ver alternativas, distribuição e alunos.</p>
          <table className="mt-2 w-full min-w-[680px]">
            <thead><tr className="border-b"><th className="th">Questão</th><th className="th">Tema</th><th className="th">Respostas</th><th className="th">Média de pontos</th><th className="th">Índice de desempenho</th><th className="th">Pontuação máxima</th><th className="th">Zero ponto</th></tr></thead>
            <tbody>{data.questions.map((q) => (
              <tr key={q.number} className="border-b last:border-0 hover:bg-indigo-50">
                <td className="td font-bold"><Link className="text-indigo-700 underline" href={`/admin/questoes/${q.number}`}>Q{q.number}</Link></td>
                <td className="td">{q.theme}</td><td className="td">{q.n}</td><td className="td">{fmt(q.avg)}</td><td className="td">{fmt(q.index, "%")}</td><td className="td">{q.excellent}</td><td className="td">{q.inadequate}</td>
              </tr>))}</tbody>
          </table>
        </section>

        <section className="card overflow-x-auto" tabIndex={0}>
          <h2 className="font-display text-xl font-extrabold">Ranking dos alunos (somente quem concluiu)</h2>
          <p className="text-sm text-slate-600">Empates compartilham a mesma colocação. O tempo de resposta não é usado como critério. Visível apenas ao professor.</p>
          {data.ranking.length === 0 ? <p className="mt-3 text-slate-600">Nenhum aluno concluiu o mapa neste filtro.</p> : (
            <table className="mt-2 w-full min-w-[640px]">
              <thead><tr className="border-b"><th className="th">#</th><th className="th">Aluno</th><th className="th">Turma</th><th className="th">Pontos</th><th className="th">Geral</th><th className="th">Aproveitamento</th><th className="th">Status</th></tr></thead>
              <tbody>{data.ranking.map((r) => (
                <tr key={r.studentId} className="border-b last:border-0">
                  <td className="td font-extrabold">{r.rank}º</td>
                  <td className="td"><Link className="text-indigo-700 underline" href={`/admin/alunos/${r.studentId}`}>{r.name}</Link>{r.demo && <Demo />}</td>
                  <td className="td">{r.className ?? "—"}</td><td className="td">{r.map1}/{data.max}</td><td className="td">{r.total}</td><td className="td">{r.pct}%</td><td className="td">{r.status}</td>
                </tr>))}</tbody>
            </table>)}
          {data.partial.length > 0 && (
            <div className="mt-4 rounded-2xl bg-slate-50 p-3"><h3 className="font-bold">Em andamento (fora do ranking)</h3>
              <ul className="mt-1 text-sm">{data.partial.map((p) => <li key={p.studentId}><Link className="text-indigo-700 underline" href={`/admin/alunos/${p.studentId}`}>{p.name}</Link> ({p.className ?? "—"}) — pontuação parcial: {p.partial}{p.demo && <Demo />}</li>)}</ul></div>)}
        </section>

        <section className="card no-print">
          <h2 className="font-display text-xl font-extrabold">Dados de demonstração</h2>
          <p className="text-sm text-slate-600">Cria uma turma fictícia para testar gráficos e relatórios. Esses dados ficam <b>separados</b> dos reais e só aparecem se você escolher exibi-los no filtro.</p>
          <div className="mt-2 flex flex-wrap gap-2"><button className="btn btn-ghost btn-sm" onClick={() => demo("add")}>Gerar dados de demonstração</button><button className="btn btn-ghost btn-sm" onClick={() => demo("remove")}>Remover dados de demonstração</button></div>
          {demoMsg && <div className="mt-2"><Notice kind="ok">{demoMsg}</Notice></div>}
        </section>
      </>)}
    </div>
  );
}

const Demo = () => <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-900">DEMO</span>;
const Card = ({ label, value }: { label: string; value: string }) => <div className="card p-4"><div className="font-display text-3xl font-extrabold text-city-grape">{value}</div><div className="text-xs font-bold text-slate-600">{label}</div></div>;
const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="card"><h2 className="mb-2 font-display text-lg font-extrabold">{title}</h2>{children}</section>;
