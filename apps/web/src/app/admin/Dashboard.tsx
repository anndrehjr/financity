"use client";
import Link from "next/link";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ErrorBox, Notice, Spinner, apiFetch, fmt, useApi } from "@/components/ui";
import FilterBar, { Scope, qs, useAsm } from "./FilterBar";
import { AXIS, BAR_RADIUS_H, BAR_RADIUS_V, SERIES, TOOLTIP } from "./chartTheme";
import "./reports-theme.css";

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

const PIE = ["#71717a", SERIES[2], SERIES[0]]; // não iniciaram · em andamento · concluíram

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
    <div className="rt space-y-5">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-3xl font-extrabold">Painel geral</h1><p className="text-slate-600">{data ? `Mapa ${data.assessment.sort} — ${data.assessment.title}` : ""} (pontuação máxima: {data?.max ?? 25})</p></div>
        <FilterBar scope={scope} setScope={setScope} cls={cls} setCls={setCls} asm={asm} setAsm={setAsm} />
      </div>

      {loading && !data && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {data && (<>
        <section aria-label="Indicadores" className="kpi-grid grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Card icon="users" label="Alunos cadastrados" value={fmt(data.cards.totalStudents)} />
          <Card icon="play" label="Iniciaram o jogo" value={fmt(data.cards.started)} />
          <Card icon="check" label="Concluíram o mapa" value={fmt(data.cards.completed)} />
          <Card icon="chart" label="Média de pontos (concluintes)" value={fmt(data.cards.avgPoints)} />
          <Card icon="star" label="Melhor pontuação" value={fmt(data.cards.best)} />
          <Card icon="percent" label="Aproveitamento médio" value={fmt(data.cards.avgPct, "%")} />
        </section>
        {data.cards.completed === 0 && <Notice>Ainda não há alunos que concluíram o mapa neste filtro. Os indicadores aparecem como “—” até haver dados reais.</Notice>}

        <section className="card"><div className="card-header !mb-2"><div><h2 className="card-title font-display text-xl font-extrabold">Leitura automática dos resultados</h2><p className="card-subtitle sr-only">Resumo em texto dos números abaixo</p></div></div>
          <ul className="list-disc space-y-1 pl-5 text-slate-800">{data.insights.map((t, i) => <li key={i}>{t}</li>)}</ul></section>

        <div className="rt-grid grid gap-4 lg:grid-cols-2">
          <ChartCard cols={4} title="Gráfico 1 — Desempenho por mapa (% médio)" subtitle="Aproveitamento médio em cada mapa">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.byMap.map((m) => ({ ...m, v: m.avgPct ?? 0 }))} layout="vertical" margin={{ left: 10, right: 40 }}>
                <CartesianGrid horizontal={false} /><XAxis type="number" domain={[0, 100]} unit="%" {...AXIS} /><YAxis type="category" dataKey="name" width={170} {...AXIS} />
                <Tooltip {...TOOLTIP} formatter={(_v, _n, p) => (p.payload.available ? (p.payload.avgPct === null ? "Sem dados" : `${p.payload.avgPct}%`) : "Ainda não disponível")} />
                <Bar dataKey="v" fill={SERIES[0]} radius={BAR_RADIUS_H} />
              </BarChart>
            </ResponsiveContainer>
            <ul className="mt-1 text-xs text-slate-600">{data.byMap.filter((m) => !m.available).map((m) => <li key={m.name}>{m.name}: <b>Ainda não disponível</b></li>)}</ul>
          </ChartCard>

          <ChartCard cols={2} title="Gráfico 2 — Distribuição de pontuações (concluintes)" subtitle="Quantos alunos em cada faixa">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.distribution}><CartesianGrid vertical={false} /><XAxis dataKey="label" {...AXIS} /><YAxis allowDecimals={false} {...AXIS} /><Tooltip {...TOOLTIP} /><Bar dataKey="alunos" name="Alunos" fill={SERIES[1]} radius={BAR_RADIUS_V} /></BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard cols={3} title="Gráfico 3 — Média de pontos por questão" subtitle="Pontos médios em cada pergunta">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.byQuestion}><CartesianGrid vertical={false} /><XAxis dataKey="name" {...AXIS} /><YAxis domain={[0, "auto"]} allowDecimals={false} {...AXIS} /><Tooltip {...TOOLTIP} formatter={(v, _n, p) => [v === null ? "Sem respostas" : v, p.payload.theme]} />
                <Bar dataKey="media" name="Média" fill={SERIES[0]} radius={BAR_RADIUS_V} /></BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard cols={3} title="Gráfico 4 — Análise das alternativas" subtitle="Quantos alunos escolheram cada letra">
            <label className="no-print mb-2 block text-sm font-bold">Questão
              <select className="ml-2 rounded-xl border-2 border-slate-300 px-2 py-1 max-w-full" value={altQ} onChange={(e) => setAltQ(Number(e.target.value))}>
                {data.alternatives.map((a) => <option key={a.number} value={a.number}>Q{a.number} — {a.title}</option>)}
              </select></label>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.alternatives.find((a) => a.number === altQ)?.data ?? []}><CartesianGrid vertical={false} /><XAxis dataKey="letter" {...AXIS} /><YAxis allowDecimals={false} {...AXIS} /><Tooltip {...TOOLTIP} /><Bar dataKey="alunos" name="Alunos" fill={SERIES[2]} radius={BAR_RADIUS_V} /></BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-600">As letras seguem a numeração original (A–E) do banco de perguntas, não a ordem embaralhada vista pelo aluno.</p>
          </ChartCard>

          <ChartCard cols={2} title="Gráfico 5 — Progresso da turma" subtitle="Quem não iniciou, está em andamento ou concluiu">
            <p className="sr-only">{data.progress.map((p) => `${p.name}: ${p.value}`).join("; ")}.</p>
            <div inert>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart accessibilityLayer={false}><Pie data={data.progress} cy="58%" dataKey="value" nameKey="name" innerRadius={63} outerRadius={90} paddingAngle={2} stroke="var(--panel, #fff)" strokeWidth={3} label={(e) => `${e.value}`}>
                {data.progress.map((_, i) => <Cell key={i} fill={PIE[i]} />)}</Pie><Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} /><Tooltip {...TOOLTIP} /></PieChart>
            </ResponsiveContainer>
            </div>
          </ChartCard>
          <section className="card rt-c4 overflow-x-auto" tabIndex={0}>
            <div className="card-header !mb-2"><div><h2 className="card-title font-display text-xl font-extrabold">Análise das questões</h2>
            <p className="card-subtitle text-sm text-slate-600">Clique na questão para ver alternativas, distribuição e alunos.</p></div></div>
            <table className="w-full min-w-[680px]">
              <thead><tr className="border-b"><th className="th">Questão</th><th className="th">Tema</th><th className="th">Respostas</th><th className="th">Média de pontos</th><th className="th">Índice de desempenho</th><th className="th">Pontuação máxima</th><th className="th">Zero ponto</th></tr></thead>
              <tbody>{data.questions.map((q) => (
                <tr key={q.number} className="border-b last:border-0 hover:bg-indigo-50">
                  <td className="td font-bold"><Link className="rt-link text-indigo-700 underline" href={`/admin/questoes/${q.number}`}>Q{q.number}</Link></td>
                  <td className="td">{q.theme}</td><td className="td">{q.n}</td><td className="td">{fmt(q.avg)}</td><td className="td">{fmt(q.index, "%")}</td><td className="td">{q.excellent}</td><td className="td">{q.inadequate}</td>
                </tr>))}</tbody>
            </table>
          </section>

        </div>

        <section className="card overflow-x-auto" tabIndex={0}>
          <div className="card-header !mb-2"><div><h2 className="card-title font-display text-xl font-extrabold">Ranking dos alunos (somente quem concluiu)</h2>
          <p className="card-subtitle text-sm text-slate-600">Empates compartilham a mesma colocação. O tempo de resposta não é usado como critério. Visível apenas ao professor.</p></div></div>
          {data.ranking.length === 0 ? <p className="mt-3 text-slate-600">Nenhum aluno concluiu o mapa neste filtro.</p> : (
            <table className="w-full min-w-[640px]">
              <thead><tr className="border-b"><th className="th">#</th><th className="th">Aluno</th><th className="th">Turma</th><th className="th">Pontos</th><th className="th">Geral</th><th className="th">Aproveitamento</th><th className="th">Status</th></tr></thead>
              <tbody>{data.ranking.map((r) => (
                <tr key={r.studentId} className="border-b last:border-0">
                  <td className="td font-extrabold">{r.rank}º</td>
                  <td className="td"><Link className="rt-link text-indigo-700 underline" href={`/admin/alunos/${r.studentId}`}>{r.name}</Link>{r.demo && <Demo />}</td>
                  <td className="td">{r.className ?? "—"}</td><td className="td">{r.map1}/{data.max}</td><td className="td">{r.total}</td><td className="td">{r.pct}%</td><td className="td">{r.status}</td>
                </tr>))}</tbody>
            </table>)}
          {data.partial.length > 0 && (
            <div className="rt-box mt-4 rounded-2xl bg-slate-50 p-3"><h3 className="font-bold">Em andamento (fora do ranking)</h3>
              <ul className="mt-1 text-sm">{data.partial.map((p) => <li key={p.studentId}><Link className="rt-link text-indigo-700 underline" href={`/admin/alunos/${p.studentId}`}>{p.name}</Link> ({p.className ?? "—"}) — pontuação parcial: {p.partial}{p.demo && <Demo />}</li>)}</ul></div>)}
        </section>

        <section className="card no-print">
          <div className="card-header !mb-2"><div><h2 className="card-title font-display text-xl font-extrabold">Dados de demonstração</h2>
          <p className="card-subtitle text-sm text-slate-600">Cria uma turma fictícia para testar gráficos e relatórios. Esses dados ficam <b>separados</b> dos reais e só aparecem se você escolher exibi-los no filtro.</p></div></div>
          <div className="mt-2 flex flex-wrap gap-2"><button className="btn btn-ghost btn-sm" onClick={() => demo("add")}>Gerar dados de demonstração</button><button className="btn btn-ghost btn-sm" onClick={() => demo("remove")}>Remover dados de demonstração</button></div>
          {demoMsg && <div className="mt-2"><Notice kind="ok">{demoMsg}</Notice></div>}
        </section>
      </>)}
    </div>
  );
}

const Demo = () => <span className="badge warning ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-900">DEMO</span>;
const ICONS: Record<string, string> = {
  users: "M16 11a3 3 0 1 0-2.8-4M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-3 0-5 1.5-5 3.5V18h10v-1.5C13 14.5 11 13 8 13zm8 0c-.6 0-1.2.1-1.7.2 1 .8 1.7 1.9 1.7 3.3V18h5v-1.5c0-2-2-3.5-5-3.5z",
  play: "M8 5v14l11-7z",
  check: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z",
  chart: "M5 9h3v10H5zm5-5h3v15h-3zm5 8h3v7h-3z",
  star: "m12 17.3-5.2 3.1 1.4-5.9L3.6 10.6l6-.5L12 4.5l2.4 5.6 6 .5-4.6 3.9 1.4 5.9z",
  percent: "M7.5 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm9 9a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM18.7 4.3 4.3 18.7l1.4 1.4L20.1 5.7z",
};
const Card = ({ label, value, icon }: { label: string; value: string; icon: keyof typeof ICONS }) => (
  <div className="kpi card p-4">
    <div className="kpi-top"><div className="kpi-label text-xs font-bold text-slate-600">{label}</div>
      <span className="kpi-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d={ICONS[icon]} /></svg></span></div>
    <div className="kpi-value font-display text-3xl font-extrabold text-city-grape">{value}</div>
  </div>
);
const ChartCard = ({ title, subtitle, cols = 3, children }: { title: string; subtitle?: string; cols?: 2 | 3 | 4; children: React.ReactNode }) => (
  <section className={`card rt-c${cols}`}><div className="card-header !mb-2"><div><h2 className="card-title font-display text-lg font-extrabold">{title}</h2>{subtitle && <p className="card-subtitle text-sm text-slate-600">{subtitle}</p>}</div></div>{children}</section>
);
