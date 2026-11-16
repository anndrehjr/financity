"use client";
import Link from "next/link";
import { Lock, MapArt } from "@/components/art";
import { ErrorBox, Spinner, doLogout, useApi } from "@/components/ui";

type Me = { name: string; totalPoints: number; maps: { id: number; sort: number; title: string; subtitle: string; topics: string[]; published: boolean; unlocked: boolean; progress: string; score: number }[] };

export default function MapsClient() {
  const { data, error, loading, reload } = useApi<Me>("/api/me");
  return (
    <main className="game-bg px-4 pb-10">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 py-4">
        <span className="font-display text-2xl font-extrabold text-city-grape">FINANCITY</span>
        <div className="flex items-center gap-3">
          {data && <div className="rounded-2xl bg-white px-4 py-2 shadow"><span className="text-xs font-bold text-slate-600">{data.name}</span><br /><span className="font-display text-lg font-extrabold text-amber-700" aria-live="polite">⭐ {data.totalPoints} pontos</span></div>}
          <button className="btn btn-ghost btn-sm" onClick={doLogout}>Sair</button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-4xl font-extrabold md:text-5xl">BEM-VINDO À FINANCITY!</h1>
        <p className="mt-2 max-w-3xl text-lg font-semibold text-indigo-900">Suas decisões constroem seu futuro. Explore os quatro mapas e descubra como administrar melhor seu dinheiro.</p>

        {loading && <Spinner label="Carregando os mapas…" />}
        {error && <div className="mt-6"><ErrorBox message={error} onRetry={reload} /></div>}

        {data && (
          <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {data.maps.map((m) => {
              const playable = m.published && m.unlocked;
              const label = m.progress === "completed" ? "VER RESULTADO" : m.progress === "in_progress" ? "CONTINUAR" : "ENTRAR NO MAPA";
              return (
                <li key={m.id} className={`card relative overflow-hidden p-0 ${playable ? "" : "opacity-95"}`}>
                  <div className={`relative h-44 sm:h-48 ${playable ? "" : "grayscale-[.55]"}`}>
                    <MapArt n={m.sort as 1 | 2 | 3 | 4} />
                    {!playable && (
                      <div className="absolute inset-0 flex items-center justify-center bg-indigo-950/40">
                        <span className="rounded-full bg-white p-4 text-indigo-900 shadow-lg"><Lock className="h-9 w-9" /></span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-display text-2xl font-extrabold">MAPA {m.sort} — {m.title.toUpperCase()}</h2>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{m.topics.join(" • ")}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${playable ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                        {playable ? (m.progress === "completed" ? "CONCLUÍDO" : "DESBLOQUEADO") : m.published ? "CONCLUA O MAPA ANTERIOR" : "EM DESENVOLVIMENTO"}
                      </span>
                    </div>
                    {playable ? (
                      <Link href={`/jogo/${m.id}`} className="btn btn-primary mt-4 w-full">{label}</Link>
                    ) : (
                      <button className="btn btn-ghost mt-4 w-full" disabled aria-disabled="true"><Lock className="h-5 w-5" /> {m.published ? "Complete o mapa anterior" : "Em breve"}</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
