"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/components/ui";

export type Scope = "real" | "demo" | "all";
export const qs = (scope: Scope, cls: string, asm = "") => `scope=${scope}${cls ? `&class=${cls}` : ""}${asm ? `&assessment=${asm}` : ""}`;

/** Avaliação (mapa) escolhida pelo professor; lembrada neste navegador entre as telas do painel. */
export function useAsm(): [string, (v: string) => void] {
  const [asm, setState] = useState("");
  useEffect(() => { try { setState(localStorage.getItem("fc_asm") || ""); } catch { /* armazenamento indisponível */ } }, []);
  const setAsm = (v: string) => { setState(v); try { localStorage.setItem("fc_asm", v); } catch { /* ignora */ } };
  return [asm, setAsm];
}

type Asm = { id: number; grade: number; sort: number; status: string; title: string };

export default function FilterBar({ scope, setScope, cls, setCls, asm, setAsm }: {
  scope: Scope; setScope: (s: Scope) => void; cls: string; setCls: (c: string) => void; asm?: string; setAsm?: (a: string) => void;
}) {
  const { data: classes } = useApi<{ id: number; name: string; demo: number; grade: number | null }[]>("/api/admin/classes");
  const { data: asms } = useApi<Asm[]>("/api/admin/assessments");
  // se o mapa lembrado não existir mais (ou não for das séries do professor), volta ao padrão
  useEffect(() => { if (asms && asm && setAsm && !asms.some((a) => String(a.id) === asm)) setAsm(""); }, [asms, asm, setAsm]);
  return (
    <div className="no-print flex flex-wrap items-end gap-3">
      {setAsm && asms && asms.length > 0 && (
        <label className="text-sm font-bold">Mapa
          <select className="mt-1 block rounded-xl border-2 border-slate-300 bg-white px-3 py-2" value={asm ?? ""} onChange={(e) => setAsm(e.target.value)}>
            <option value="">Padrão (Mapa 1)</option>
            {asms.map((a) => <option key={a.id} value={a.id}>{a.grade}º ano — Mapa {a.sort}: {a.title}{a.status !== "available" ? " (em desenvolvimento)" : ""}</option>)}
          </select>
        </label>
      )}
      <label className="text-sm font-bold">Turma
        <select className="mt-1 block rounded-xl border-2 border-slate-300 bg-white px-3 py-2" value={cls} onChange={(e) => setCls(e.target.value)}>
          <option value="">Todas</option>
          {classes?.filter((c) => scope === "all" || (scope === "demo" ? c.demo : !c.demo)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className="text-sm font-bold">Dados exibidos
        <select className="mt-1 block rounded-xl border-2 border-slate-300 bg-white px-3 py-2" value={scope} onChange={(e) => { setScope(e.target.value as Scope); setCls(""); }}>
          <option value="real">Reais (turma)</option>
          <option value="demo">Somente demonstração</option>
          <option value="all">Reais + demonstração</option>
        </select>
      </label>
      {scope !== "real" && <span className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-900">⚠ Inclui DADOS DE DEMONSTRAÇÃO (fictícios)</span>}
    </div>
  );
}
