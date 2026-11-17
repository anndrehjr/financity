"use client";
import { useEffect } from "react";

/** Avisa a API, a cada 30 s, que o aluno está com o jogo aberto. Não mostra nada e não atrapalha o jogo se falhar. */
export default function PresencePing() {
  useEffect(() => {
    let parado = false;
    const ping = () => {
      if (parado) return;
      fetch("/api/presence/ping", { method: "POST", cache: "no-store", keepalive: true })
        .then((r) => { if (r.status === 401 || r.status === 403) parado = true; }) // sessão acabou: para de avisar
        .catch(() => { /* sem internet agora: tenta de novo no próximo ciclo */ });
    };
    ping();
    const t = setInterval(ping, 30_000);
    const vis = () => { if (document.visibilityState === "visible") ping(); };
    document.addEventListener("visibilitychange", vis);
    return () => { parado = true; clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, []);
  return null;
}
