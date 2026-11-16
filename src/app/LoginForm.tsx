"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/components/ui";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  useEffect(() => { setExpired(new URLSearchParams(location.search).has("expirou")); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const r = await apiFetch<{ redirect: string }>("/api/auth/login", { method: "POST", body: { username, password } });
      location.href = r.redirect;
    } catch (err) { setError((err as Error).message); setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 animate-pop" aria-label="Entrar no jogo">
      <h2 className="font-display text-2xl font-extrabold">Entrar</h2>
      {expired && !error && <p role="status" className="rounded-xl bg-amber-50 p-2 text-sm font-semibold text-amber-900">Sua sessão terminou. Entre novamente.</p>}
      <div>
        <label htmlFor="u" className="mb-1 block font-bold">Usuário</label>
        <input id="u" className="input" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div>
        <label htmlFor="p" className="mb-1 block font-bold">Senha de seis dígitos</label>
        <input id="p" className="input tracking-widest" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="hint" />
        <p id="hint" className="mt-1 text-xs text-slate-600">Professores usam a senha administrativa.</p>
      </div>
      {error && <p role="alert" className="rounded-xl border-2 border-rose-300 bg-rose-50 p-3 font-semibold text-rose-800">{error}</p>}
      <button className="btn btn-sun w-full text-xl" disabled={busy || !username || !password}>{busy ? "Entrando…" : "ENTRAR NO JOGO"}</button>
    </form>
  );
}
