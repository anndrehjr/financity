"use client";
import { useCallback, useEffect, useState } from "react";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function apiFetch<T = unknown>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? "GET",
    headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* resposta não JSON */ }
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined" && !location.pathname.startsWith("/?")) {
      if (location.pathname !== "/") location.href = "/?expirou=1";
    }
    throw new ApiError(res.status, (data as { error?: string } | null)?.error ?? "Algo deu errado. Tente novamente.");
  }
  return data as T;
}

export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!url) return;
    setLoading(true); setError(null);
    try { setData(await apiFetch<T>(url)); } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }, [url]);
  useEffect(() => { void load(); }, [load]);
  return { data, error, loading, reload: load };
}

export function Spinner({ label = "Carregando…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 p-10 font-display text-lg font-bold text-indigo-700">
      <span className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-200 border-t-city-grape" aria-hidden />{label}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-rose-800">
      <p className="font-semibold">{message}</p>
      {onRetry && <button className="btn btn-ghost btn-sm mt-2" onClick={onRetry}>Tentar de novo</button>}
    </div>
  );
}

export function Notice({ kind = "info", children }: { kind?: "info" | "ok" | "warn"; children: React.ReactNode }) {
  const c = { info: "border-sky-300 bg-sky-50 text-sky-900", ok: "border-emerald-300 bg-emerald-50 text-emerald-900", warn: "border-amber-300 bg-amber-50 text-amber-900" }[kind];
  return <div role={kind === "ok" ? "status" : undefined} className={`rounded-2xl border-2 p-3 text-sm font-semibold ${c}`}>{children}</div>;
}

export const fmt = (v: number | null | undefined, suffix = "") => (v === null || v === undefined ? "—" : `${String(v).replace(".", ",")}${suffix}`);
// A API devolve datas ISO 8601 com fuso (ex.: 2026-11-15T22:56:00.000Z). Aceita também o formato antigo "AAAA-MM-DD HH:MM:SS" (UTC).
export const fmtDate = (s?: string | null) => {
  if (!s) return "—";
  const d = new Date(/[zZ]$|[+-]\d\d:?\d\d$/.test(s) ? s : s.replace(" ", "T") + "Z");
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

export async function doLogout() {
  try { await apiFetch("/api/auth/logout", { method: "POST" }); } finally { location.href = "/"; }
}
