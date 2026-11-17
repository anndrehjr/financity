"use client";
import { Fragment, useEffect, useState } from "react";
import { ErrorBox, Spinner, apiFetch, fmtDate, useApi } from "@/components/ui";
import FilterBar, { Scope, qs } from "../FilterBar";

type Row = {
  id: number; name: string; className: string | null; serie: number; active: number; online: boolean;
  lastEntry: string | null; lastExit: string | null; lastSeen: string | null;
  todaySeconds: number; totalSeconds: number; sessions: number;
};
type Sess = { startedAt: string; endedAt: string | null; online: boolean; seconds: number; reason: string | null };

/** 3725 -> "1 h 02 min"; menos de 1 min -> "< 1 min"; zero -> "—". */
function dur(s: number): string {
  if (!s) return "—";
  if (s < 60) return "< 1 min";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h} h ${String(m).padStart(2, "0")} min` : `${m} min`;
}

function History({ id }: { id: number }) {
  const [rows, setRows] = useState<Sess[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { apiFetch<Sess[]>(`/api/admin/presence/${id}`).then(setRows).catch((e) => setErr((e as Error).message)); }, [id]);
  if (err) return <ErrorBox message={err} />;
  if (!rows) return <Spinner label="Carregando histórico…" />;
  if (!rows.length) return <p className="p-3 text-sm text-slate-600">Este aluno ainda não entrou na plataforma.</p>;
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">Histórico de entradas do aluno</caption>
      <thead><tr className="text-left text-slate-600"><th className="p-2">Entrada</th><th className="p-2">Saída</th><th className="p-2">Tempo</th><th className="p-2">Como saiu</th></tr></thead>
      <tbody>{rows.map((s, i) => (
        <tr key={i} className="border-t border-slate-200">
          <td className="p-2">{fmtDate(s.startedAt)}</td>
          <td className="p-2">{s.online ? <span className="font-bold text-emerald-700">on-line agora</span> : fmtDate(s.endedAt)}</td>
          <td className="p-2">{dur(s.seconds)}</td>
          <td className="p-2">{s.online ? "—" : s.reason ?? "—"}</td>
        </tr>))}
      </tbody>
    </table>
  );
}

export default function Presenca() {
  const [scope, setScope] = useState<Scope>("real");
  const [cls, setCls] = useState("");
  const [serie, setSerie] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const { data, error, loading, reload } = useApi<Row[]>(`/api/admin/presence?${qs(scope, cls)}${serie ? `&serie=${serie}` : ""}`);
  // atualiza sozinho a cada 15 s
  useEffect(() => { const t = setInterval(() => { void reload(); }, 15_000); return () => clearInterval(t); }, [reload]);

  const online = (data ?? []).filter((r) => r.online).length;
  const jaEntraram = (data ?? []).filter((r) => r.sessions > 0).length;
  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      <h1 className="font-display text-2xl font-extrabold text-indigo-950">Presença dos alunos</h1>
      <FilterBar scope={scope} setScope={setScope} cls={cls} setCls={setCls} serie={serie} setSerie={setSerie} />
      <div className="flex flex-wrap items-center gap-3 text-sm font-bold" aria-live="polite">
        <span className="rounded-xl bg-emerald-100 px-3 py-2 text-emerald-900">● {online} on-line agora</span>
        <span className="rounded-xl bg-slate-100 px-3 py-2 text-slate-800">{jaEntraram} de {data?.length ?? 0} já entraram</span>
        <button className="rounded-xl border-2 border-slate-300 bg-white px-3 py-2 hover:bg-slate-50" onClick={() => void reload()}>Atualizar agora</button>
        <span className="text-xs font-semibold text-slate-600">Atualiza sozinho a cada 15 s. “On-line” = deu sinal nos últimos 2 min. Se o aluno fecha a página sem clicar em Sair, a saída é o último sinal.</span>
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? <Spinner /> : (
        <div className="overflow-x-auto rounded-2xl border-2 border-slate-200 bg-white">
          <table className="w-full text-sm">
            <caption className="sr-only">Presença dos alunos na plataforma</caption>
            <thead className="bg-slate-100 text-left text-slate-700">
              <tr><th className="p-3">Status</th><th className="p-3">Aluno</th><th className="p-3">Turma</th><th className="p-3">Última entrada</th><th className="p-3">Última saída</th><th className="p-3">Tempo hoje</th><th className="p-3">Tempo total</th><th className="p-3">Entradas</th><th className="p-3"><span className="sr-only">Histórico</span></th></tr>
            </thead>
            <tbody>
              {(data ?? []).map((r) => (
                <Fragment key={r.id}>
                  <tr className="border-t border-slate-200">
                    <td className="p-3 font-bold">{r.online ? <span className="text-emerald-700">● On-line</span> : <span className="text-slate-600">○ Off-line</span>}</td>
                    <td className="p-3">{r.name}{!r.active && <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs font-bold">desativado</span>}</td>
                    <td className="p-3">{r.className ?? "—"}</td>
                    <td className="p-3">{r.lastEntry ? fmtDate(r.lastEntry) : <span className="text-slate-500">nunca entrou</span>}</td>
                    <td className="p-3">{r.online ? <span className="text-slate-500">em uso</span> : fmtDate(r.lastExit)}</td>
                    <td className="p-3">{dur(r.todaySeconds)}</td>
                    <td className="p-3">{dur(r.totalSeconds)}</td>
                    <td className="p-3">{r.sessions}</td>
                    <td className="p-3">{r.sessions > 0 && <button className="rounded-lg border-2 border-slate-300 px-2 py-1 text-xs font-bold hover:bg-slate-50" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)}>{open === r.id ? "Fechar" : "Histórico"}</button>}</td>
                  </tr>
                  {open === r.id && <tr className="bg-slate-50"><td colSpan={9} className="p-3"><History id={r.id} /></td></tr>}
                </Fragment>
              ))}
              {data && !data.length && <tr><td colSpan={9} className="p-6 text-center text-slate-600">Nenhum aluno neste filtro.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
