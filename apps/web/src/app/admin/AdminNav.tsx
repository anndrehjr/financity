"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { doLogout } from "@/components/ui";

const ITEMS = [
  { href: "/admin", label: "Painel" },
  { href: "/admin/alunos", label: "Alunos" },
  { href: "/admin/questoes/1", label: "Questões" },
  { href: "/admin/relatorios", label: "Relatórios" },
  { href: "/admin/config", label: "Configurações" },
];

export default function AdminNav({ name }: { name: string }) {
  const path = usePathname();
  return (
    <header className="no-print sticky top-0 z-20 bg-indigo-950 text-white shadow">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <span className="font-display text-xl font-extrabold tracking-wide">FINANCITY <span className="text-sm font-semibold text-indigo-300">Painel do professor</span></span>
        <nav aria-label="Seções" className="flex flex-1 flex-wrap gap-1">
          {ITEMS.map((i) => {
            const on = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href.replace(/\/1$/, ""));
            return <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined} className={`rounded-xl px-3 py-1.5 text-sm font-bold ${on ? "bg-white text-indigo-950" : "text-indigo-100 hover:bg-indigo-800"}`}>{i.label}</Link>;
          })}
        </nav>
        <span className="text-sm text-indigo-200">{name}</span>
        <button className="rounded-xl bg-indigo-800 px-3 py-1.5 text-sm font-bold hover:bg-indigo-700" onClick={doLogout}>Sair</button>
      </div>
    </header>
  );
}
