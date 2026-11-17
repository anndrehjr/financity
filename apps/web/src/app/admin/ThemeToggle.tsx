"use client";
import { useEffect, useState } from "react";

const KEY = "fc_admin_theme";
type Theme = "dark" | "light";

/** Interruptor claro/escuro do painel. A escolha fica salva neste navegador; na 1ª vez segue o tema do sistema. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  // o layout já aplicou o tema antes de a página aparecer (script inline); aqui só lemos o que está valendo
  useEffect(() => {
    const t = document.getElementById("admin-root")?.getAttribute("data-theme");
    setTheme(t === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.getElementById("admin-root")?.setAttribute("data-theme", next);
    try { localStorage.setItem(KEY, next); } catch { /* armazenamento indisponível: vale só nesta página */ }
    setTheme(next);
  }

  const dark = theme === "dark";
  return (
    <button type="button" onClick={toggle} aria-pressed={dark} disabled={theme === null}
      className="rounded-xl bg-indigo-800 px-3 py-1.5 text-sm font-bold hover:bg-indigo-700">
      <span aria-hidden="true">{dark ? "☀️ " : "🌙 "}</span>Modo escuro: {theme === null ? "…" : dark ? "ligado" : "desligado"}
    </button>
  );
}
