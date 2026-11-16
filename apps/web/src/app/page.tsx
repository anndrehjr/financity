import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "./LoginForm";
import { LoginArt } from "@/components/art";

export const dynamic = "force-dynamic";

export default async function Home() {
  const s = await getSession();
  if (s) redirect(s.role === "teacher" ? "/admin" : "/jogo");
  return (
    <main className="game-bg flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 px-4 py-8 md:flex-row md:gap-10">
        <section className="text-center md:w-1/2 md:text-left">
          <p className="inline-block rounded-full bg-white/80 px-4 py-1 font-display text-sm font-bold text-indigo-700">Educação Financeira • 8º ano</p>
          <h1 className="mt-3 font-display text-6xl font-extrabold leading-none text-city-grape drop-shadow-sm md:text-7xl">FINANCITY</h1>
          <p className="mt-2 font-display text-xl font-semibold italic text-indigo-900">A jornada das decisões financeiras</p>
          <div className="mt-6 hidden h-48 overflow-hidden rounded-3xl shadow-lg ring-4 ring-white md:block"><LoginArt /></div>
        </section>
        <section className="w-full max-w-md md:w-1/2">
          <LoginForm />
        </section>
      </div>
      <div className="h-28 overflow-hidden md:hidden"><LoginArt /></div>
    </main>
  );
}
