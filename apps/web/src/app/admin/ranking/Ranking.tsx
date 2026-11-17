"use client";
import Link from "next/link";
import { useState } from "react";
import { ErrorBox, Spinner, useApi } from "@/components/ui";
import FilterBar, { Scope, qs } from "../FilterBar";

type Cell = { sort: number; status: "completed" | "in_progress" | null; points: number | null };
type Row = {
  position: number | null; id: number; name: string; className: string | null; serie: number; demo: boolean; active: boolean;
  themes: Cell[]; concluded: number; points: number; maxPoints: number; pct: number | null; classification: { key: string; label: string } | null;
};
type Data = { temas: { sort: number; title: string }[]; rows: Row[] };

const MEDAL = ["🥇", "🥈", "🥉"];
// cada classificação tem cor E texto (a cor sozinha não pode ser a única informação)
const BADGE: Record<string, { cls: string; icon: string }> = {
  consolidado: { cls: "bg-emerald-100 text-emerald-900", icon: "●" },
  adequado: { cls: "bg-sky-50 text-sky-900", icon: "◆" },
  em_desenvolvimento: { cls: "bg-amber-100 text-amber-900", icon: "▲" },
  inicial: { cls: "bg-rose-50 text-rose-800", icon: "■" },
};
const LEGENDA = [
  { key: "consolidado", label: "Consolidado", faixa: "80% ou mais" },
  { key: "adequado", label: "Adequado", faixa: "de 60% a 79%" },
  { key: "em_desenvolvimento", label: "Em desenvolvimento", faixa: "de 40% a 59%" },
  { key: "inicial", label: "Em desenvolvimento inicial", faixa: "menos de 40%" },
];

const csvEsc = (v: string | number) => { const t = String(v); const s = /^[=+\-@\t\r]/.test(t) ? "'" + t : t; return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

function baixarCsv(d: Data) {
  const cab = ["Posição", "Aluno", "Turma", ...d.temas.map((t) => `Tema ${t.sort} — ${t.title}`), "Temas concluídos", "Pontos", "Máximo possível", "Aproveitamento (%)", "Classificação"];
  const linhas = d.rows.map((r) => [
    r.position ?? "", r.name, r.className ?? "",
    ...r.themes.map((c) => (c.status === "completed" ? c.points ?? 0 : c.status === "in_progress" ? "em andamento" : "")),
    r.concluded, r.points, r.maxPoints, r.pct ?? "", r.classification?.label ?? "Sem tema concluído",
  ]);
  const texto = "﻿" + [cab, ...linhas].map((l) => l.map(csvEsc).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([texto], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = "ranking-geral.csv"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Ranking() {
  const [scope, setScope] = useState<Scope>("real");
  const [cls, setCls] = useState("");
  const [serie, setSerie] = useState("");
  const { data, error, loading, reload } = useApi<Data>(`/api/admin/ranking?${qs(scope, cls)}${serie ? `&serie=${serie}` : ""}`);

  const rows = data?.rows ?? [];
  const noRanking = rows.filter((r) => r.position !== null);
  const conta = (k: string) => rows.filter((r) => r.classification?.key === k).length;
  const semTema = rows.filter((r) => r.position === null).length;

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold">Ranking geral</h1>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => window.print()}>Exportar PDF</button>
          <button className="btn btn-ghost btn-sm" disabled={!data || !rows.length} onClick={() => data && baixarCsv(data)}>Baixar planilha (CSV)</button>
        </div>
      </div>
      <FilterBar scope={scope} setScope={setScope} cls={cls} setCls={setCls} serie={serie} setSerie={setSerie} />

      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? <Spinner /> : data && (
        <article className="card space-y-4">
          <header>
            <h2 className="font-display text-2xl font-extrabold">Ranking geral — soma de todos os temas concluídos</h2>
            <p className="text-sm text-slate-600">Conta só tema <b>concluído</b>. Empate recebe a mesma colocação. O tempo de resposta não é critério. {scope !== "real" && <b className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">Inclui DADOS DE DEMONSTRAÇÃO (fictícios)</b>}</p>
          </header>

          <section aria-label="Resumo das classificações" className="flex flex-wrap gap-2 text-sm font-bold">
            <span className="rounded-xl bg-slate-100 px-3 py-2">{noRanking.length} no ranking</span>
            {LEGENDA.map((l) => <span key={l.key} className={`rounded-xl px-3 py-2 ${BADGE[l.key].cls}`}>{BADGE[l.key].icon} {conta(l.key)} {l.label}</span>)}
            <span className="rounded-xl bg-slate-100 px-3 py-2">{semTema} sem tema concluído</span>
          </section>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <caption className="sr-only">Ranking geral dos alunos, com pontos por tema, total e classificação</caption>
              <thead>
                <tr className="border-b">
                  <th className="th">Pos.</th><th className="th">Aluno</th><th className="th">Turma</th>
                  {data.temas.map((t) => <th key={t.sort} className="th" title={t.title}>Tema {t.sort}</th>)}
                  <th className="th">Concluídos</th><th className="th">Pontos</th><th className="th">Aproveit.</th><th className="th">Classificação</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const b = r.classification ? BADGE[r.classification.key] : null;
                  return (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="td font-extrabold">{r.position === null ? <span className="text-slate-500">—</span> : <>{r.position <= 3 && <span aria-hidden="true">{MEDAL[r.position - 1]} </span>}{r.position}º</>}</td>
                      <td className="td"><Link href={`/admin/alunos/${r.id}`} className="font-bold text-indigo-700 underline">{r.name}</Link>{r.demo && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-900">DEMO</span>}{!r.active && <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs font-bold">desativado</span>}</td>
                      <td className="td">{r.className ?? "—"}</td>
                      {r.themes.map((c) => (
                        <td key={c.sort} className="td">
                          {c.status === "completed" ? <b>{c.points}</b> : c.status === "in_progress" ? <span className="text-xs font-semibold text-slate-600">em andamento ({c.points})</span> : <span className="text-slate-500">—</span>}
                        </td>
                      ))}
                      <td className="td">{r.concluded}/{data.temas.length}</td>
                      <td className="td font-bold">{r.concluded ? <>{r.points}<span className="font-normal text-slate-600"> / {r.maxPoints}</span></> : "—"}</td>
                      <td className="td">{r.pct === null ? "—" : `${r.pct}%`}</td>
                      <td className="td">{b && r.classification ? <span className={`rounded-xl px-2 py-1 text-xs font-extrabold ${b.cls}`}>{b.icon} {r.classification.label}</span> : <span className="text-xs text-slate-600">Sem tema concluído</span>}</td>
                    </tr>
                  );
                })}
                {!rows.length && <tr><td colSpan={9} className="td py-6 text-center text-slate-600">Nenhum aluno neste filtro.</td></tr>}
              </tbody>
            </table>
          </div>

          <footer className="grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-3">
              <h3 className="font-bold">Como ler a classificação</h3>
              <p className="text-slate-600">Calculada sobre os temas que o aluno concluiu (pontos ÷ máximo possível desses temas).</p>
              <ul className="mt-1 space-y-0.5">{LEGENDA.map((l) => <li key={l.key}><span className={`rounded px-1.5 py-0.5 text-xs font-extrabold ${BADGE[l.key].cls}`}>{BADGE[l.key].icon} {l.label}</span> <span className="text-slate-600">{l.faixa}</span></li>)}</ul>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <h3 className="font-bold">Temas</h3>
              <ul className="mt-1 space-y-0.5 text-slate-700">{data.temas.map((t) => <li key={t.sort}><b>Tema {t.sort}:</b> {t.title}</li>)}</ul>
            </div>
          </footer>
        </article>
      )}
    </div>
  );
}
