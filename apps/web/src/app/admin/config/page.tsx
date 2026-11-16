"use client";
import { useEffect, useState } from "react";
import { ErrorBox, Notice, Spinner, apiFetch, useApi } from "@/components/ui";

export default function Page() {
  const { data, error, loading, reload } = useApi<{ schoolName: string; teacherName: string }>("/api/admin/settings");
  const [school, setSchool] = useState(""); const [teacher, setTeacher] = useState("");
  const [cur, setCur] = useState(""); const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  useEffect(() => { if (data) { setSchool(data.schoolName); setTeacher(data.teacherName); } }, [data]);

  async function save(e: React.FormEvent, withPw: boolean) {
    e.preventDefault(); setMsg(null);
    try {
      await apiFetch("/api/admin/settings", { method: "PUT", body: withPw ? { currentPassword: cur, newPassword: next } : { schoolName: school, teacherName: teacher } });
      setMsg({ ok: true, t: withPw ? "Senha alterada." : "Configurações salvas." }); if (withPw) { setCur(""); setNext(""); } reload();
    } catch (err) { setMsg({ ok: false, t: (err as Error).message }); }
  }
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="font-display text-3xl font-extrabold">Configurações</h1>
      {msg && <Notice kind={msg.ok ? "ok" : "warn"}>{msg.t}</Notice>}
      <form onSubmit={(e) => save(e, false)} className="card space-y-3"><h2 className="font-display text-xl font-extrabold">Cabeçalho dos relatórios</h2>
        <label className="block text-sm font-bold">Nome da escola<input className="input mt-1" value={school} onChange={(e) => setSchool(e.target.value)} maxLength={120} /></label>
        <label className="block text-sm font-bold">Nome do professor<input className="input mt-1" value={teacher} onChange={(e) => setTeacher(e.target.value)} maxLength={120} /></label>
        <button className="btn btn-primary btn-sm">Salvar</button></form>
      <form onSubmit={(e) => save(e, true)} className="card space-y-3"><h2 className="font-display text-xl font-extrabold">Trocar senha do professor</h2>
        <label className="block text-sm font-bold">Senha atual<input className="input mt-1" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} required /></label>
        <label className="block text-sm font-bold">Nova senha (12+ caracteres, com maiúscula, minúscula, número e símbolo)<input className="input mt-1" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={12} /></label>
        <button className="btn btn-primary btn-sm">Trocar senha</button></form>
    </div>
  );
}
