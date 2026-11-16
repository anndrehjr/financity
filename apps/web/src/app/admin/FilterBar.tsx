"use client";
import { useApi } from "@/components/ui";

export type Scope = "real" | "demo" | "all";
export const qs = (scope: Scope, cls: string) => `scope=${scope}${cls ? `&class=${cls}` : ""}`;

export default function FilterBar({ scope, setScope, cls, setCls }: { scope: Scope; setScope: (s: Scope) => void; cls: string; setCls: (c: string) => void }) {
  const { data: classes } = useApi<{ id: number; name: string; demo: number }[]>("/api/admin/classes");
  return (
    <div className="no-print flex flex-wrap items-end gap-3">
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
