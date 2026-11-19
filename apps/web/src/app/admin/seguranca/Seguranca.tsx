"use client";
import { Fragment, useEffect, useState } from "react";
import { ErrorBox, Notice, Spinner, apiFetch, fmtDate, useApi } from "@/components/ui";
import FilterBar, { Scope } from "../FilterBar";

type Summary = {
  studentsWithEvents: number; pending: number; confirmed: number; penaltiesApplied: number; pendingIndicators: number; pendingDetected: number;
  blockedNow: number; suspendedNow: number;
  recurrences: { studentId: number; name: string; className: string | null; count: number }[];
  locked: { attemptId: number; status: "blocked" | "suspended"; studentId: number; studentName: string; className: string | null; assessmentTitle: string | null }[];
};
type Ev = {
  id: number; studentId: number; studentName: string; className: string | null; serie: number; attemptId: number | null; assessmentTitle: string | null;
  eventType: string; label: string; severity: 1 | 2 | 3; certainty: "detected" | "indicator"; device: string | null; detectedAt: string;
  penalty: "none" | "warning" | "suspension" | "block"; pointsDeducted: number; penaltyCancelledAt: string | null; status: "pending" | "confirmed" | "justified";
  reviewedAt: string | null; reviewedBy: string | null; recurrences: number;
};
type Detail = Ev & {
  observed: string; evidence: Record<string, unknown>; sessionRef: string | null; attemptState: string | null; causesCurrentState: boolean | null;
  trail: { id: number; action: string; detail: string | null; createdAt: string; teacher: string | null }[];
  history: { id: number; eventType: string; severity: number; certainty: string; status: string; penalty: string; penaltyCancelledAt: string | null; detectedAt: string }[];
};
type Cfg = {
  enabled: boolean; watermark: boolean; protectCopy: boolean; protectPrint: boolean; suspendSeconds: number; blockAfter: number; deductPoints: number;
  singleSession: boolean; retentionDays: number; eventSeverity: { impressao_iniciada: 1 | 2; copia_conteudo: 1 | 2; atalho_impressao: 1 | 2; tecla_captura_tela: 1 | 2 };
};
type AuditRow = { id: number; eventId: number | null; attemptId: number | null; action: string; detail: string | null; createdAt: string; teacher: string | null; studentName: string | null };

const SEV = { 1: "Nível 1 · incomum", 2: "Nível 2 · violação", 3: "Nível 3 · reincidência" } as const;
const SEV_COR = { 1: "bg-amber-100 text-amber-900", 2: "bg-orange-100 text-orange-900", 3: "bg-rose-100 text-rose-900" } as const;
const STATUS = { pending: "Pendente de análise", confirmed: "Violação confirmada", justified: "Justificada" } as const;
const PENALTY = { none: "Sem penalidade", warning: "Advertência", suspension: "Suspensão temporária", block: "Partida bloqueada" } as const;
const ACAO: Record<string, string> = { confirmar: "Confirmou a violação", justificar: "Justificou a ocorrência", cancelar_penalidade: "Cancelou a penalidade", liberar_partida: "Liberou a partida", config: "Alterou as regras" };
const TIPOS_CLIENTE: [keyof Cfg["eventSeverity"], string][] = [
  ["impressao_iniciada", "Impressão da página iniciada"], ["copia_conteudo", "Tentativa de copiar o conteúdo da questão"],
  ["atalho_impressao", "Atalho de impressão pressionado"], ["tecla_captura_tela", "Tecla de captura de tela pressionada"],
];
const campo = "mt-1 block rounded-xl border-2 border-slate-300 bg-white px-3 py-2";

function Card({ valor, rotulo, tom = "slate" }: { valor: number; rotulo: string; tom?: "slate" | "amber" | "rose" | "emerald" | "indigo" }) {
  const c = { slate: "bg-slate-100 text-slate-900", amber: "bg-amber-100 text-amber-950", rose: "bg-rose-100 text-rose-950", emerald: "bg-emerald-100 text-emerald-950", indigo: "bg-indigo-100 text-indigo-950" }[tom];
  return <div className={`rounded-2xl p-3 ${c}`}><div className="font-display text-3xl font-extrabold">{valor}</div><div className="text-xs font-bold">{rotulo}</div></div>;
}

function Detalhe({ id, onChanged }: { id: number; onChanged: () => void }) {
  const { data, error, reload } = useApi<Detail>(`/api/admin/integrity/events/${id}`);
  const [nota, setNota] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return <Spinner label="Carregando ocorrência…" />;
  const agir = async (action: string, rotulo: string) => {
    setBusy(true); setMsg(null);
    try { await apiFetch(`/api/admin/integrity/events/${id}`, { method: "PATCH", body: { action, note: nota } }); setMsg({ ok: true, t: `${rotulo}: registrado na auditoria.` }); setNota(""); await reload(); onChanged(); }
    catch (e) { setMsg({ ok: false, t: (e as Error).message }); } finally { setBusy(false); }
  };
  const liberar = async () => {
    if (!data.attemptId) return;
    setBusy(true); setMsg(null);
    try { await apiFetch(`/api/admin/integrity/attempts/${data.attemptId}/release`, { method: "POST", body: { note: nota } }); setMsg({ ok: true, t: "Partida liberada: registrado na auditoria." }); setNota(""); await reload(); onChanged(); }
    catch (e) { setMsg({ ok: false, t: (e as Error).message }); } finally { setBusy(false); }
  };
  const ativa = data.penalty !== "none" && !data.penaltyCancelledAt;
  return (
    <div className="grid gap-4 p-4 md:grid-cols-2">
      <div className="space-y-2 text-sm">
        <h3 className="font-display text-lg font-extrabold text-indigo-950">{data.label}</h3>
        <p className="rounded-xl bg-slate-100 p-2 font-semibold">{data.certainty === "detected" ? "Observado nos componentes do Financity: " : "Indicador para revisão (não prova trapaça): "}{data.observed}.</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <dt className="font-bold">Aluno</dt><dd>{data.studentName} · {data.className ?? "—"} · {data.serie}º ano</dd>
          <dt className="font-bold">Partida</dt><dd>{data.assessmentTitle ?? "—"} (tentativa {data.attemptId ?? "—"}, sessão {data.sessionRef?.toUpperCase() ?? "—"})</dd>
          <dt className="font-bold">Quando</dt><dd>{fmtDate(data.detectedAt)}</dd>
          <dt className="font-bold">Aparelho</dt><dd>{data.device ?? "não informado"}</dd>
          <dt className="font-bold">Penalidade</dt><dd>{PENALTY[data.penalty]}{data.pointsDeducted ? ` (−${data.pointsDeducted} pt)` : ""}{data.penaltyCancelledAt ? " — cancelada" : ""}</dd>
          <dt className="font-bold">Situação</dt><dd>{STATUS[data.status]}{data.reviewedBy ? ` · ${data.reviewedBy}, ${fmtDate(data.reviewedAt)}` : ""}</dd>
          <dt className="font-bold">Partida agora</dt><dd>{data.attemptState === "blocked" ? "BLOQUEADA" : data.attemptState === "suspended" ? "Suspensa" : "Liberada"}</dd>
        </dl>
        <details><summary className="cursor-pointer font-bold">Evidências registradas</summary>
          <pre className="mt-1 overflow-x-auto rounded-xl bg-slate-100 p-2 text-xs">{JSON.stringify(data.evidence, null, 2)}</pre></details>
        <div>
          <p className="font-bold">Outras ocorrências deste aluno</p>
          <ul className="mt-1 space-y-1 text-xs">{data.history.map((h) => <li key={h.id}>{fmtDate(h.detectedAt)} · {h.eventType.replaceAll("_", " ")} · nível {h.severity} · {STATUS[h.status as keyof typeof STATUS]}{h.id === data.id ? " (esta)" : ""}</li>)}</ul>
        </div>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <label className="font-bold" htmlFor={`nota-${id}`}>Motivo / observação (obrigatório para justificar, cancelar e liberar)</label>
          <textarea id={`nota-${id}`} className="mt-1 w-full rounded-xl border-2 border-slate-300 bg-white p-2" rows={2} maxLength={300} value={nota} onChange={(e) => setNota(e.target.value)} />
          <div className="mt-2 flex flex-wrap gap-2">
            <button disabled={busy || data.status !== "pending"} className="rounded-xl bg-rose-700 px-3 py-2 font-bold text-white disabled:opacity-40" onClick={() => agir("confirm", "Violação confirmada")}>Confirmar violação</button>
            <button disabled={busy || data.status === "justified"} className="rounded-xl bg-emerald-700 px-3 py-2 font-bold text-white disabled:opacity-40" onClick={() => agir("justify", "Ocorrência justificada")}>Marcar como justificada</button>
            <button disabled={busy || !ativa} className="rounded-xl border-2 border-slate-400 bg-white px-3 py-2 font-bold disabled:opacity-40" onClick={() => agir("cancel_penalty", "Penalidade cancelada")}>Cancelar penalidade</button>
            <button disabled={busy || !data.attemptId || !["blocked", "suspended"].includes(data.attemptState ?? "")} className="rounded-xl bg-indigo-800 px-3 py-2 font-bold text-white disabled:opacity-40" onClick={liberar}>Liberar partida</button>
          </div>
          {msg && <div className="mt-2" role={msg.ok ? "status" : "alert"}><Notice kind={msg.ok ? "ok" : "warn"}>{msg.t}</Notice></div>}
        </div>
        <div>
          <p className="font-bold">Histórico de decisões (auditoria)</p>
          {data.trail.length === 0 ? <p className="text-xs text-slate-600">Nenhuma decisão registrada ainda.</p> :
            <ul className="mt-1 space-y-1 text-xs">{data.trail.map((a) => <li key={a.id}><b>{ACAO[a.action] ?? a.action}</b> · {a.teacher ?? "—"} · {fmtDate(a.createdAt)}{a.detail ? ` — “${a.detail}”` : ""}</li>)}</ul>}
        </div>
      </div>
    </div>
  );
}

function Regras({ onSaved }: { onSaved: () => void }) {
  const { data, error, reload } = useApi<Cfg>("/api/admin/integrity/config");
  const [f, setF] = useState<Cfg | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  useEffect(() => { if (data) setF(data); }, [data]);
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!f) return <Spinner />;
  const set = <K extends keyof Cfg>(k: K, v: Cfg[K]) => setF({ ...f, [k]: v });
  const salvar = async () => {
    setMsg(null);
    try { await apiFetch("/api/admin/integrity/config", { method: "PUT", body: f }); setMsg({ ok: true, t: "Regras salvas e registradas na auditoria. Valem para ocorrências futuras." }); await reload(); onSaved(); }
    catch (e) { setMsg({ ok: false, t: (e as Error).message }); }
  };
  const num = (k: "suspendSeconds" | "blockAfter" | "deductPoints" | "retentionDays", rotulo: string, min: number, max: number, dica: string) => (
    <label className="text-sm font-bold">{rotulo}
      <input type="number" min={min} max={max} className={`${campo} w-32`} value={f[k]} onChange={(e) => set(k, Math.min(max, Math.max(min, Math.round(Number(e.target.value) || 0))))} />
      <span className="block text-xs font-semibold text-slate-600">{dica}</span>
    </label>
  );
  const chk = (k: "enabled" | "watermark" | "protectCopy" | "protectPrint" | "singleSession", rotulo: string, dica: string) => (
    <label className="flex items-start gap-2 text-sm font-bold"><input type="checkbox" className="mt-1 h-4 w-4" checked={f[k]} onChange={(e) => set(k, e.target.checked)} /><span>{rotulo}<span className="block text-xs font-semibold text-slate-600">{dica}</span></span></label>
  );
  return (
    <div className="space-y-4 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        {chk("enabled", "Sistema de integridade ligado", "Desligado: nada é registrado, bloqueado ou mostrado ao aluno.")}
        {chk("watermark", "Marca d'água nas questões", "Nome do aluno, sessão e horário, em baixa opacidade, sem atrapalhar a leitura.")}
        {chk("protectCopy", "Impedir cópia do enunciado", "Bloqueia copiar/recortar e a seleção do texto (leitores de tela não são afetados).")}
        {chk("protectPrint", "Bloquear impressão", "A impressão mostra só uma tela de proteção.")}
        {chk("singleSession", "Sessão única por aluno", "Uma nova entrada encerra a sessão anterior do mesmo aluno. Padrão: desligado.")}
      </div>
      <div className="flex flex-wrap gap-4">
        {num("suspendSeconds", "Suspensão (segundos)", 0, 600, "Nível 2: pausa a partida por este tempo. 0 = só advertência.")}
        {num("blockAfter", "Bloquear na ocorrência nº", 0, 20, "Nível 3: a partir desta violação detectada (sem justificar) a partida só volta com a sua liberação. 0 = nunca bloqueia.")}
        {num("deductPoints", "Desconto por violação (pontos)", 0, 5, "0 = sem desconto (padrão). Vale só para violações detectadas, nunca para indicadores. Reversível ao cancelar.")}
        {num("retentionDays", "Guardar ocorrências por (dias)", 30, 730, "Depois disso as ocorrências e a auditoria são apagadas automaticamente (LGPD).")}
      </div>
      <fieldset>
        <legend className="text-sm font-bold">Gravidade de cada evento detectado no navegador</legend>
        <div className="mt-1 grid gap-2 md:grid-cols-2">
          {TIPOS_CLIENTE.map(([k, r]) => (
            <label key={k} className="text-sm font-semibold">{r}
              <select className={campo} value={f.eventSeverity[k]} onChange={(e) => setF({ ...f, eventSeverity: { ...f.eventSeverity, [k]: Number(e.target.value) as 1 | 2 } })}>
                <option value={1}>Nível 1 — só alerta no painel</option><option value={2}>Nível 2 — pausa, advertência e registro</option>
              </select>
            </label>))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <button className="rounded-xl bg-indigo-800 px-4 py-2 font-bold text-white" onClick={salvar}>Salvar regras</button>
        {msg && <span role={msg.ok ? "status" : "alert"} className={`text-sm font-bold ${msg.ok ? "text-emerald-800" : "text-rose-800"}`}>{msg.t}</span>}
      </div>
      <p className="text-xs font-semibold text-slate-600">Minimizar o navegador, bloquear a tela, receber notificação ou trocar de aplicativo nunca gera ocorrência. Perder o foco não prova uso de ferramentas externas; por isso esses sinais não são registrados.</p>
    </div>
  );
}

export default function Seguranca() {
  const [scope, setScope] = useState<Scope>("real");
  const [cls, setCls] = useState("");
  const [serie, setSerie] = useState("");
  const [aluno, setAluno] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [grav, setGrav] = useState("");
  const [sit, setSit] = useState("");
  const [cert, setCert] = useState("");
  const [aberto, setAberto] = useState<number | null>(null);
  const base = `scope=${scope}${cls ? `&class=${cls}` : ""}${serie ? `&serie=${serie}` : ""}`;
  const filtros = `${base}${aluno ? `&student=${aluno}` : ""}${de ? `&from=${de}` : ""}${ate ? `&to=${ate}` : ""}${grav ? `&severity=${grav}` : ""}${sit ? `&status=${sit}` : ""}${cert ? `&certainty=${cert}` : ""}`;
  const resumo = useApi<Summary>(`/api/admin/integrity/summary?${base}`);
  const lista = useApi<Ev[]>(`/api/admin/integrity/events?${filtros}`);
  const alunos = useApi<{ id: number; name: string }[]>(`/api/admin/students?${base}`);
  const auditoria = useApi<AuditRow[]>("/api/admin/integrity/audit");
  const recarregar = () => { void resumo.reload(); void lista.reload(); void auditoria.reload(); };
  useEffect(() => { const t = setInterval(() => { void resumo.reload(); void lista.reload(); }, 20_000); return () => clearInterval(t); }, [resumo.reload, lista.reload]); // eslint-disable-line react-hooks/exhaustive-deps
  const s = resumo.data;
  const liberar = async (attemptId: number) => {
    const motivo = window.prompt("Motivo da liberação (fica registrado na auditoria):");
    if (!motivo) return;
    try { await apiFetch(`/api/admin/integrity/attempts/${attemptId}/release`, { method: "POST", body: { note: motivo } }); recarregar(); } catch (e) { window.alert((e as Error).message); }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-indigo-950">Segurança e Antitrapaça</h1>
        <p className="text-sm font-semibold text-slate-700">Ocorrências de integridade das partidas. “Detectado” = observado nos componentes do Financity. “Indicador” = sinal que exige a sua análise; não é acusação.</p>
      </div>
      <FilterBar scope={scope} setScope={setScope} cls={cls} setCls={(v) => { setCls(v); setAluno(""); }} serie={serie} setSerie={setSerie} />
      {resumo.error && <ErrorBox message={resumo.error} onRetry={resumo.reload} />}
      {s && (
        <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          <Card valor={s.studentsWithEvents} rotulo="Alunos com ocorrências" tom="indigo" />
          <Card valor={s.pending} rotulo="Alertas pendentes de análise" tom="amber" />
          <Card valor={s.confirmed} rotulo="Violações confirmadas" tom="rose" />
          <Card valor={s.blockedNow} rotulo="Partidas bloqueadas agora" tom="rose" />
          <Card valor={s.suspendedNow} rotulo="Partidas suspensas agora" tom="amber" />
          <Card valor={s.penaltiesApplied} rotulo="Penalidades aplicadas" />
          <Card valor={s.recurrences.length} rotulo="Alunos reincidentes" tom="slate" />
        </section>
      )}
      {s && s.locked.length > 0 && (
        <section aria-label="Partidas travadas" className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-3">
          <h2 className="font-display text-lg font-extrabold text-rose-900">Partidas aguardando você</h2>
          <ul className="mt-1 space-y-1 text-sm">{s.locked.map((l) => (
            <li key={l.attemptId} className="flex flex-wrap items-center gap-2"><b>{l.studentName}</b> · {l.className ?? "—"} · {l.assessmentTitle ?? ""} · {l.status === "blocked" ? "BLOQUEADA" : "suspensa"}
              <button className="rounded-lg bg-indigo-800 px-2 py-1 text-xs font-bold text-white" onClick={() => liberar(l.attemptId)}>Liberar partida</button></li>))}</ul>
        </section>
      )}
      {s && s.recurrences.length > 0 && (
        <section aria-label="Reincidências" className="rounded-2xl border-2 border-slate-200 bg-white p-3 text-sm">
          <h2 className="font-display text-lg font-extrabold text-indigo-950">Reincidências por aluno</h2>
          <ul className="mt-1 flex flex-wrap gap-2">{s.recurrences.map((r) => <li key={r.studentId}><button className="rounded-xl bg-slate-100 px-2 py-1 font-bold hover:bg-slate-200" onClick={() => setAluno(String(r.studentId))}>{r.name} ({r.className ?? "—"}) · {r.count}</button></li>)}</ul>
        </section>
      )}

      <section aria-label="Filtros do histórico" className="no-print flex flex-wrap items-end gap-3">
        <label className="text-sm font-bold">Aluno
          <select className={campo} value={aluno} onChange={(e) => setAluno(e.target.value)}><option value="">Todos</option>{(alunos.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        <label className="text-sm font-bold">De<input type="date" className={campo} value={de} onChange={(e) => setDe(e.target.value)} /></label>
        <label className="text-sm font-bold">Até<input type="date" className={campo} value={ate} onChange={(e) => setAte(e.target.value)} /></label>
        <label className="text-sm font-bold">Gravidade
          <select className={campo} value={grav} onChange={(e) => setGrav(e.target.value)}><option value="">Todas</option><option value="1">Nível 1</option><option value="2">Nível 2</option><option value="3">Nível 3</option></select></label>
        <label className="text-sm font-bold">Situação
          <select className={campo} value={sit} onChange={(e) => setSit(e.target.value)}><option value="">Todas</option><option value="pending">Pendente</option><option value="confirmed">Confirmada</option><option value="justified">Justificada</option></select></label>
        <label className="text-sm font-bold">Tipo
          <select className={campo} value={cert} onChange={(e) => setCert(e.target.value)}><option value="">Todos</option><option value="detected">Detectado</option><option value="indicator">Indicador</option></select></label>
        <button className="rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50" onClick={() => { setAluno(""); setDe(""); setAte(""); setGrav(""); setSit(""); setCert(""); }}>Limpar filtros</button>
      </section>

      {lista.error && <ErrorBox message={lista.error} onRetry={lista.reload} />}
      {lista.loading && !lista.data ? <Spinner /> : (
        <div className="overflow-x-auto rounded-2xl border-2 border-slate-200 bg-white">
          <table className="w-full text-sm">
            <caption className="sr-only">Ocorrências de integridade</caption>
            <thead className="bg-slate-100 text-left text-slate-700"><tr><th className="p-3">Quando</th><th className="p-3">Aluno</th><th className="p-3">Turma</th><th className="p-3">Evento</th><th className="p-3">Gravidade</th><th className="p-3">Penalidade</th><th className="p-3">Situação</th><th className="p-3">Reinc.</th><th className="p-3"><span className="sr-only">Detalhes</span></th></tr></thead>
            <tbody>
              {(lista.data ?? []).length === 0 && <tr><td colSpan={9} className="p-6 text-center font-semibold text-slate-600">Nenhuma ocorrência com estes filtros. 🎉</td></tr>}
              {(lista.data ?? []).map((e) => (
                <Fragment key={e.id}>
                  <tr className="border-t border-slate-200 align-top">
                    <td className="p-3 whitespace-nowrap">{fmtDate(e.detectedAt)}</td>
                    <td className="p-3 font-bold">{e.studentName}</td>
                    <td className="p-3">{e.className ?? "—"}</td>
                    <td className="p-3">{e.label}<span className="block text-xs text-slate-600">{e.certainty === "detected" ? "detectado" : "indicador"} · {e.device ?? "aparelho n/d"}</span></td>
                    <td className="p-3"><span className={`rounded px-1.5 py-0.5 text-xs font-bold ${SEV_COR[e.severity]}`}>{SEV[e.severity]}</span></td>
                    <td className="p-3">{PENALTY[e.penalty]}{e.pointsDeducted ? ` (−${e.pointsDeducted})` : ""}{e.penaltyCancelledAt ? <span className="block text-xs text-slate-600">cancelada</span> : null}</td>
                    <td className="p-3">{STATUS[e.status]}</td>
                    <td className="p-3">{e.recurrences}</td>
                    <td className="p-3"><button className="rounded-lg border-2 border-slate-300 px-2 py-1 text-xs font-bold hover:bg-slate-50" aria-expanded={aberto === e.id} onClick={() => setAberto(aberto === e.id ? null : e.id)}>{aberto === e.id ? "Fechar" : "Detalhes"}</button></td>
                  </tr>
                  {aberto === e.id && <tr className="bg-slate-50"><td colSpan={9}><Detalhe id={e.id} onChanged={recarregar} /></td></tr>}
                </Fragment>))}
            </tbody>
          </table>
        </div>
      )}

      <details className="rounded-2xl border-2 border-slate-200 bg-white">
        <summary className="cursor-pointer p-3 font-display text-lg font-extrabold text-indigo-950">Regras e penalidades</summary>
        <Regras onSaved={recarregar} />
      </details>
      <details className="rounded-2xl border-2 border-slate-200 bg-white">
        <summary className="cursor-pointer p-3 font-display text-lg font-extrabold text-indigo-950">Auditoria recente (decisões e mudanças de regra)</summary>
        <div className="overflow-x-auto p-3">
          {(auditoria.data ?? []).length === 0 ? <p className="text-sm text-slate-600">Nenhuma decisão registrada ainda.</p> : (
            <table className="w-full text-sm"><caption className="sr-only">Auditoria</caption>
              <thead className="text-left text-slate-600"><tr><th className="p-2">Quando</th><th className="p-2">Quem</th><th className="p-2">Ação</th><th className="p-2">Aluno</th><th className="p-2">Detalhe</th></tr></thead>
              <tbody>{(auditoria.data ?? []).map((a) => <tr key={a.id} className="border-t border-slate-200 align-top"><td className="p-2 whitespace-nowrap">{fmtDate(a.createdAt)}</td><td className="p-2">{a.teacher ?? "—"}</td><td className="p-2 font-bold">{ACAO[a.action] ?? a.action}</td><td className="p-2">{a.studentName ?? "—"}</td><td className="p-2 text-xs">{a.action === "config" ? "regras de integridade" : a.detail ?? ""}</td></tr>)}</tbody></table>)}
        </div>
      </details>
    </div>
  );
}
