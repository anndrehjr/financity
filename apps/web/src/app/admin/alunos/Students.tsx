"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorBox, Notice, Spinner, apiFetch, useApi } from "@/components/ui";
import FilterBar, { Scope, qs } from "../FilterBar";

type Row = { id: number; name: string; username: string; active: number; demo: number; className: string | null; status: string | null; points: number | null; pending: number };
type Cred = { id: number; name: string; className: string; username: string; pin: string };
type CreateResult = { created: Cred[]; skipped: { name: string; className: string; reason: string }[] };

/** Lê CSV/linhas "nome;turma" (aceita ; , ou tab, aspas e cabeçalho). */
function parseRows(text: string): { name: string; className: string; pin?: string }[] {
  const out: { name: string; className: string; pin?: string }[] = [];
  for (const raw of text.replace(/^﻿/, "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const sep = line.includes(";") ? ";" : line.includes("\t") ? "\t" : ",";
    const cells = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    if (/^(nome|aluno)/i.test(cells[0]) && out.length === 0) continue;
    out.push({ name: cells[0], className: cells[1] ?? "", pin: cells[2] || undefined });
  }
  return out;
}

const csvEsc = (v: string) => { const s = /^[=+\-@\t\r]/.test(v) ? "'" + v : v; return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export default function Students() {
  const [scope, setScope] = useState<Scope>("real");
  const [cls, setCls] = useState("");
  const [serie, setSerie] = useState("");
  const [q, setQ] = useState("");
  const { data, error, loading, reload } = useApi<Row[]>(`/api/admin/students?${qs(scope, cls)}${serie ? `&serie=${serie}` : ""}&q=${encodeURIComponent(q)}`);
  const { data: classes, reload: reloadClasses } = useApi<{ id: number; name: string; demo?: number }[]>("/api/admin/classes");
  const { data: pend, reload: reloadPend } = useApi<{ pending: number }>("/api/admin/pins");

  // ---- Gerador Automático de PINs ----
  const [genOpen, setGenOpen] = useState(false);
  const [genMode, setGenMode] = useState<"missing" | "selected" | "class">("missing");
  const [genClass, setGenClass] = useState("");
  const [genSel, setGenSel] = useState<Set<number>>(new Set());
  const [genOk, setGenOk] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [genErr, setGenErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [noPinNew, setNoPinNew] = useState(false);
  const [noPinBatch, setNoPinBatch] = useState(false);
  const [classCount, setClassCount] = useState<number | null>(null);
  const realClasses = classes?.filter((c) => !c.demo) ?? [];
  const selectable = (data ?? []).filter((r) => !r.demo);
  useEffect(() => {
    setClassCount(null);
    if (genOpen && genMode === "class" && genClass) apiFetch<Row[]>(`/api/admin/students?scope=real&class=${genClass}`).then((r) => setClassCount(r.length)).catch(() => setClassCount(null));
  }, [genOpen, genMode, genClass]);

  function openGen() { setGenOpen(true); setGenMode("missing"); setGenSel(new Set()); setGenOk(false); setGenErr(null); setGenClass(""); reloadPend(); }
  async function runGen() {
    setGenBusy(true); setGenErr(null);
    try {
      const body = { mode: genMode, ids: [...genSel], classId: Number(genClass) || undefined, confirm: true };
      const r = await apiFetch<{ credentials: Cred[]; skipped: { reason: string }[] }>("/api/admin/pins", { method: "POST", body });
      setCreds(r.credentials.length ? r.credentials : null); setSkipped([]);
      setMsg({ kind: r.credentials.length ? "ok" : "warn", text: r.credentials.length ? `${r.credentials.length} PIN(s) gerado(s). Anote agora: eles não poderão ser consultados depois.` : "Nenhum aluno atendia ao critério escolhido. Nada foi alterado." });
      setGenOpen(false); reload(); reloadPend();
    } catch (e) { setGenErr((e as Error).message); } finally { setGenBusy(false); }
  }
  async function copyCred(c: Cred) {
    try { await navigator.clipboard.writeText(`Usuário: ${c.username}\nPIN: ${c.pin}`); setCopied(c.id); setTimeout(() => setCopied(null), 2000); }
    catch { setMsg({ kind: "warn", text: "Não foi possível copiar automaticamente neste navegador/endereço. Selecione e copie manualmente." }); }
  }

  const [name, setName] = useState(""); const [className, setClassName] = useState(""); const [pin, setPin] = useState("");
  const [batch, setBatch] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "warn"; text: string } | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [creds, setCreds] = useState<Cred[] | null>(null);
  const [skipped, setSkipped] = useState<CreateResult["skipped"]>([]);
  const [dlg, setDlg] = useState<{ kind: "pin" | "attempt" | "delete"; row: Row } | null>(null);
  const [dlgVal, setDlgVal] = useState(""); const [dlgOk, setDlgOk] = useState(false); const [dlgErr, setDlgErr] = useState<string | null>(null);

  async function create(rows: { name: string; className: string; pin?: string; noPin?: boolean }[]) {
    setBusy(true); setFormErr(null); setMsg(null);
    try {
      const r = await apiFetch<CreateResult>("/api/admin/students", { method: "POST", body: { rows } });
      const withPin = r.created.filter((c) => c.pin);
      setCreds(withPin.length ? withPin : null); setSkipped(r.skipped);
      setMsg({ kind: r.created.length ? "ok" : "warn", text: `${r.created.length} aluno(s) cadastrado(s)${r.created.length > withPin.length ? " sem PIN (use “Gerar senhas automaticamente”)" : ""}${r.skipped.length ? `, ${r.skipped.length} ignorado(s)` : ""}.` });
      reload(); reloadClasses(); reloadPend();
      return r.created.length > 0;
    } catch (e) { setFormErr((e as Error).message); return false; } finally { setBusy(false); }
  }

  async function submitOne(e: React.FormEvent) {
    e.preventDefault();
    if (await create([{ name, className, pin: noPinNew ? undefined : pin || undefined, noPin: noPinNew }])) { setName(""); setPin(""); }
  }
  async function submitBatch() { if (await create(parseRows(batch).map((r) => ({ ...r, noPin: noPinBatch })))) setBatch(""); }
  async function onFile(f: File | undefined) { if (f) setBatch(await f.text()); }

  function downloadCreds() {
    if (!creds) return;
    const lines = ["Aluno;Turma;Usuário;PIN", ...creds.map((c) => [c.name, c.className, c.username, c.pin].map(csvEsc).join(";"))];
    const url = URL.createObjectURL(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "financity-credenciais.csv"; a.click(); URL.revokeObjectURL(url);
  }

  async function act(r: Row, action: "deactivate" | "activate") {
    try { await apiFetch(`/api/admin/students/${r.id}`, { method: "PATCH", body: { action } }); reload(); } catch (e) { setMsg({ kind: "warn", text: (e as Error).message }); }
  }
  function openDlg(kind: "pin" | "attempt" | "delete", row: Row) { setDlg({ kind, row }); setDlgVal(""); setDlgOk(false); setDlgErr(null); }
  async function runDlg() {
    if (!dlg) return;
    setDlgErr(null);
    try {
      if (dlg.kind === "pin") {
        const r = await apiFetch<{ pin: string }>(`/api/admin/students/${dlg.row.id}`, { method: "PATCH", body: { action: "reset_pin", pin: dlgVal || undefined } });
        setCreds([{ id: dlg.row.id, name: dlg.row.name, className: dlg.row.className ?? "Sem turma", username: dlg.row.username, pin: r.pin }]); setSkipped([]);
        setMsg({ kind: "ok", text: `PIN de ${dlg.row.name} redefinido. Anote-o agora: ele não poderá ser consultado depois.` });
      } else if (dlg.kind === "delete") {
        await apiFetch(`/api/admin/students/${dlg.row.id}`, { method: "PATCH", body: { action: "delete", confirm: true } });
        setMsg({ kind: "ok", text: `${dlg.row.name} foi excluído definitivamente (cadastro, tentativas e respostas).` });
      } else {
        await apiFetch(`/api/admin/students/${dlg.row.id}`, { method: "PATCH", body: { action: "new_attempt", confirm: true, reason: dlgVal } });
        setMsg({ kind: "ok", text: `Nova tentativa liberada para ${dlg.row.name}. A tentativa anterior foi preservada no histórico.` });
      }
      setDlg(null); reload();
    } catch (e) { setDlgErr((e as Error).message); }
  }

  const statusLabel = (s: string | null) => (s === "completed" ? "Concluído" : s === "in_progress" ? "Em andamento" : "Não iniciou");

  return (
    <>
    <div className="space-y-6 print:hidden">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-3xl font-extrabold">Gerenciamento de alunos</h1><p className="text-slate-600">Os alunos não se cadastram sozinhos: você cria o usuário e o PIN de seis dígitos.</p></div>
        <button className="btn btn-sun" onClick={openGen}>GERAR SENHAS AUTOMATICAMENTE{pend && pend.pending > 0 ? ` (${pend.pending} sem PIN)` : ""}</button>
      </div>

      {msg && <Notice kind={msg.kind === "ok" ? "ok" : "warn"}>{msg.text}</Notice>}

      {creds && (
        <section className="card border-2 border-amber-300" aria-label="Credenciais geradas">
          <h2 className="font-display text-xl font-extrabold">Credenciais geradas — anote agora</h2>
          <p className="text-sm font-semibold text-amber-900">Os PINs aparecem somente nesta tela. Depois de sair daqui só será possível redefini-los. Entregue a cada aluno apenas a credencial dele.</p>
          <div className="mt-2 overflow-x-auto" tabIndex={0}><table className="w-full min-w-[480px]"><thead><tr className="border-b"><th className="th">Nome completo</th><th className="th">Turma</th><th className="th">Usuário</th><th className="th">Novo PIN</th><th className="th"><span className="sr-only">Copiar</span></th></tr></thead>
            <tbody>{creds.map((c) => <tr key={c.id} className="border-b last:border-0"><td className="td">{c.name}</td><td className="td">{c.className}</td><td className="td font-mono">{c.username}</td><td className="td font-mono font-extrabold tracking-widest">{c.pin}</td><td className="td"><button className="btn btn-ghost btn-sm" onClick={() => copyCred(c)} aria-label={`Copiar usuário e PIN de ${c.name}`}>{copied === c.id ? "Copiado ✓" : "Copiar"}</button></td></tr>)}</tbody></table></div>
          <div className="no-print mt-3 flex flex-wrap gap-2"><button className="btn btn-primary btn-sm" onClick={downloadCreds}>Exportar CSV</button><button className="btn btn-ghost btn-sm" onClick={() => window.print()}>Imprimir credenciais (uma ficha por aluno)</button><button className="btn btn-ghost btn-sm" onClick={() => setCreds(null)}>Já anotei, ocultar</button></div>
        </section>
      )}
      {skipped.length > 0 && <section className="card"><h3 className="font-bold">Ignorados</h3><ul className="text-sm">{skipped.map((s, i) => <li key={i}>{s.name || "(sem nome)"} {s.className && `— ${s.className}`}: {s.reason}</li>)}</ul></section>}

      <div className="no-print grid gap-4 lg:grid-cols-2">
        <form onSubmit={submitOne} className="card space-y-3">
          <h2 className="font-display text-xl font-extrabold">Cadastrar um aluno</h2>
          <label className="block text-sm font-bold">Nome completo<input className="input mt-1" required minLength={3} value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="block text-sm font-bold">Turma<input className="input mt-1" list="turmas" placeholder="Ex.: 8º A" value={className} onChange={(e) => setClassName(e.target.value)} /></label>
          <datalist id="turmas">{classes?.map((c) => <option key={c.id} value={c.name} />)}</datalist>
          <label className="block text-sm font-bold">PIN (opcional — deixe vazio para gerar)<input className="input mt-1 font-mono" inputMode="numeric" pattern="\d{6}" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} /></label>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="h-5 w-5" checked={noPinNew} onChange={(e) => setNoPinNew(e.target.checked)} /> Cadastrar sem PIN (gerar depois no gerador automático)</label>
          {formErr && <ErrorBox message={formErr} />}
          <button className="btn btn-primary" disabled={busy}>{busy ? "Salvando…" : "Cadastrar e gerar credencial"}</button>
        </form>

        <div className="card space-y-3">
          <h2 className="font-display text-xl font-extrabold">Cadastrar vários (lista ou CSV)</h2>
          <p className="text-sm text-slate-600">Uma linha por aluno: <code>Nome completo;Turma</code>. Pode importar um arquivo CSV.</p>
          <textarea className="input min-h-32 font-mono text-sm" value={batch} onChange={(e) => setBatch(e.target.value)} placeholder={"Maria Souza;8º A\nJoão Lima;8º A"} aria-label="Lista de alunos" />
          <div className="flex flex-wrap items-center gap-2">
            <label className="btn btn-ghost btn-sm cursor-pointer">Escolher arquivo CSV<input type="file" accept=".csv,text/csv,text/plain" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} /></label>
            <button className="btn btn-primary btn-sm" disabled={busy || !batch.trim()} onClick={submitBatch}>Cadastrar lista ({parseRows(batch).length})</button>
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="h-5 w-5" checked={noPinBatch} onChange={(e) => setNoPinBatch(e.target.checked)} /> Sem PIN (gerar depois)</label>
          </div>
        </div>
      </div>

      <section className="card">
        <div className="no-print flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-xl font-extrabold">Alunos cadastrados</h2>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-bold">Buscar<input className="mt-1 block rounded-xl border-2 border-slate-300 px-3 py-2" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome ou usuário" /></label>
            <FilterBar scope={scope} setScope={setScope} cls={cls} setCls={setCls} serie={serie} setSerie={setSerie} />
          </div>
        </div>
        {loading && !data && <Spinner />}
        {error && <ErrorBox message={error} onRetry={reload} />}
        {data && (data.length === 0 ? <p className="mt-3 text-slate-600">Nenhum aluno encontrado.</p> : (
          <div className="mt-3 overflow-x-auto" tabIndex={0}><table className="w-full min-w-[760px]">
            <thead><tr className="border-b"><th className="th">Aluno</th><th className="th">Turma</th><th className="th">Usuário</th><th className="th">Participação</th><th className="th">Pontos</th><th className="th">Conta</th><th className="th">Ações</th></tr></thead>
            <tbody>{data.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="td font-semibold"><Link className="text-indigo-700 underline" href={`/admin/alunos/${r.id}`}>{r.name}</Link>{r.demo ? <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-900">DEMO</span> : null}</td>
                <td className="td">{r.className ?? "—"}</td><td className="td font-mono">{r.username}</td><td className="td">{statusLabel(r.status)}</td><td className="td">{r.points ?? "—"}</td>
                <td className="td">{r.pending ? <b className="text-amber-800">Sem PIN</b> : r.active ? "Ativa" : <b className="text-rose-700">Desativada</b>}</td>
                <td className="td"><div className="flex flex-wrap gap-1">
                  {!r.demo && <button className="btn btn-ghost btn-sm" onClick={() => openDlg("pin", r)}>Redefinir PIN</button>}
                  {r.status && <button className="btn btn-ghost btn-sm" onClick={() => openDlg("attempt", r)}>Nova tentativa</button>}
                  <button className="btn btn-ghost btn-sm text-red-700" onClick={() => openDlg("delete", r)}>Excluir</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => act(r, r.active ? "deactivate" : "activate")}>{r.active ? "Desativar" : "Reativar"}</button>
                </div></td>
              </tr>))}</tbody></table></div>))}
      </section>

      {dlg && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="dlg-t">
          <div className="card w-full max-w-md space-y-3">
            <h2 id="dlg-t" className="font-display text-xl font-extrabold">{dlg.kind === "pin" ? "Redefinir PIN" : dlg.kind === "delete" ? "Excluir aluno" : "Liberar nova tentativa"} — {dlg.row.name}</h2>
            {dlg.kind === "pin" ? (
              <label className="block text-sm font-bold">Novo PIN (opcional — vazio gera automaticamente)<input autoFocus className="input mt-1 font-mono" inputMode="numeric" maxLength={6} value={dlgVal} onChange={(e) => setDlgVal(e.target.value.replace(/\D/g, ""))} /></label>
            ) : dlg.kind === "delete" ? (<>
              <Notice kind="warn">Isto apaga <b>para sempre</b> o aluno, as tentativas e as respostas dele. <b>Não dá para desfazer.</b> Se você só quer impedir o acesso por um tempo, use &quot;Desativar&quot;.</Notice>
              <label className="block text-sm font-bold">Para confirmar, digite EXCLUIR<input autoFocus className="input mt-1 font-mono" value={dlgVal} onChange={(e) => setDlgVal(e.target.value)} autoComplete="off" /></label>
            </>) : (<>
              <Notice kind="warn">A tentativa atual ({statusLabel(dlg.row.status)}, {dlg.row.points ?? 0} pts) será arquivada no histórico e o aluno poderá refazer o mapa. Esta ação é registrada.</Notice>
              <label className="block text-sm font-bold">Motivo (opcional)<input className="input mt-1" value={dlgVal} onChange={(e) => setDlgVal(e.target.value)} maxLength={200} /></label>
              <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={dlgOk} onChange={(e) => setDlgOk(e.target.checked)} className="h-5 w-5" /> Confirmo que quero liberar uma nova tentativa.</label>
            </>)}
            {dlgErr && <ErrorBox message={dlgErr} />}
            <div className="flex justify-end gap-2"><button className="btn btn-ghost btn-sm" onClick={() => setDlg(null)}>Cancelar</button><button className="btn btn-primary btn-sm" disabled={(dlg.kind === "attempt" && !dlgOk) || (dlg.kind === "delete" && dlgVal.trim().toUpperCase() !== "EXCLUIR")} onClick={runDlg}>{dlg.kind === "delete" ? "Excluir definitivamente" : "Confirmar"}</button></div>
          </div>
        </div>
      )}

      {genOpen && (
        <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="gen-t">
          <div className="card my-4 w-full max-w-xl space-y-3">
            <h2 id="gen-t" className="font-display text-xl font-extrabold">Gerar senhas automaticamente</h2>
            <p className="text-sm text-slate-600">Nada é alterado antes de você confirmar. Os PINs aparecem uma única vez, depois da geração.</p>
            <fieldset className="space-y-2">
              <legend className="sr-only">Quem receberá novos PINs</legend>
              <label className={`flex cursor-pointer items-start gap-2 rounded-xl border-2 p-3 ${genMode === "missing" ? "border-city-grape bg-violet-50" : "border-slate-200"}`}>
                <input type="radio" name="gm" className="mt-1 h-5 w-5" checked={genMode === "missing"} onChange={() => { setGenMode("missing"); setGenOk(false); }} />
                <span><b>Alunos sem PIN</b><br /><span className="text-sm text-slate-600">Gera senha só para quem ainda não tem credencial válida. Agora: <b>{pend?.pending ?? 0}</b> aluno(s).</span></span>
              </label>
              <label className={`flex cursor-pointer items-start gap-2 rounded-xl border-2 p-3 ${genMode === "selected" ? "border-city-grape bg-violet-50" : "border-slate-200"}`}>
                <input type="radio" name="gm" className="mt-1 h-5 w-5" checked={genMode === "selected"} onChange={() => { setGenMode("selected"); setGenOk(false); }} />
                <span><b>Alunos selecionados</b><br /><span className="text-sm text-slate-600">Marque os alunos (a lista segue os filtros da tela) e redefina o PIN deles.</span></span>
              </label>
              {genMode === "selected" && (
                <div className="rounded-xl bg-slate-50 p-2">
                  <label className="flex items-center gap-2 px-1 py-1 text-sm font-bold"><input type="checkbox" className="h-5 w-5" checked={selectable.length > 0 && genSel.size === selectable.length} onChange={(e) => setGenSel(e.target.checked ? new Set(selectable.map((r) => r.id)) : new Set())} /> Selecionar todos os listados ({selectable.length})</label>
                  <ul className="max-h-52 overflow-y-auto" tabIndex={0} aria-label="Lista de alunos">
                    {selectable.map((r) => (
                      <li key={r.id}><label className="flex items-center gap-2 px-1 py-1 text-sm"><input type="checkbox" className="h-5 w-5" checked={genSel.has(r.id)} onChange={(e) => { const n = new Set(genSel); if (e.target.checked) n.add(r.id); else n.delete(r.id); setGenSel(n); }} /> {r.name} <span className="text-slate-500">({r.username}{r.pending ? ", sem PIN" : ""})</span></label></li>
                    ))}
                  </ul>
                  <p className="px-1 text-xs text-slate-600">{genSel.size} selecionado(s).</p>
                </div>
              )}
              <label className={`flex cursor-pointer items-start gap-2 rounded-xl border-2 p-3 ${genMode === "class" ? "border-city-grape bg-violet-50" : "border-slate-200"}`}>
                <input type="radio" name="gm" className="mt-1 h-5 w-5" checked={genMode === "class"} onChange={() => { setGenMode("class"); setGenOk(false); }} />
                <span><b>Todos os alunos da turma</b><br /><span className="text-sm text-slate-600">Redefine o PIN de todos os estudantes da turma escolhida.</span></span>
              </label>
              {genMode === "class" && (
                <div className="rounded-xl bg-slate-50 p-2">
                  <label className="text-sm font-bold">Turma
                    <select className="ml-2 rounded-xl border-2 border-slate-300 bg-white px-2 py-1" value={genClass} onChange={(e) => { setGenClass(e.target.value); setGenOk(false); }}>
                      <option value="">Escolha…</option>
                      {realClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select></label>
                  {genClass && <p className="mt-1 text-sm">{classCount === null ? "Contando…" : `${classCount} aluno(s) serão afetados.`}</p>}
                </div>
              )}
            </fieldset>

            {genMode !== "missing" && (
              <>
                <Notice kind="warn">⚠ Atenção: os PINs antigos desses alunos <b>deixarão de funcionar imediatamente</b> e as sessões abertas deles serão encerradas. Respostas, pontuações, tentativas e relatórios <b>não</b> são alterados. Contas de professores não são afetadas.</Notice>
                <label className="flex items-start gap-2 text-sm font-bold"><input type="checkbox" className="mt-0.5 h-5 w-5" checked={genOk} onChange={(e) => setGenOk(e.target.checked)} /> Entendo e confirmo a redefinição.</label>
              </>
            )}
            {genErr && <ErrorBox message={genErr} />}
            <div className="flex justify-end gap-2">
              <button className="btn btn-ghost btn-sm" onClick={() => setGenOpen(false)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={runGen}
                disabled={genBusy || (genMode === "missing" ? !(pend && pend.pending > 0) : genMode === "selected" ? genSel.size === 0 || !genOk : !genClass || !classCount || !genOk)}>
                {genBusy ? "Gerando…" : genMode === "missing" ? "Gerar PINs" : "Confirmar e redefinir PINs"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Fichas individuais: só aparecem na impressão, em preto e branco */}
    {creds && (
      <div className="hidden print:block">
        <div className="grid grid-cols-2 gap-4">
          {creds.map((c) => (
            <div key={c.id} className="border-2 border-black p-4 text-black" style={{ breakInside: "avoid" }}>
              <p className="text-xs font-bold uppercase tracking-wide">Financity — credencial de acesso</p>
              <p className="mt-2 text-lg font-bold">{c.name}</p>
              <p className="text-sm">Turma: {c.className}</p>
              <p className="mt-2 text-sm">Usuário: <span className="font-mono text-lg font-bold">{c.username}</span></p>
              <p className="text-sm">PIN: <span className="font-mono text-2xl font-bold tracking-widest">{c.pin}</span></p>
              <p className="mt-2 text-xs">Endereço: {typeof window !== "undefined" ? location.origin : ""}</p>
              <p className="text-xs">Guarde em segredo. Não compartilhe com colegas.</p>
            </div>
          ))}
        </div>
      </div>
    )}
    </>
  );
}
