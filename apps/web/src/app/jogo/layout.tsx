import { Guia } from "@/features/guia/Guia";
import { GuiaProvider } from "@/features/guia/GuiaProvider";
import { TutorialProvider } from "@/features/guia/tutorial/TutorialProvider";
import { getSession } from "@/lib/session";

// A Nina (guia) só existe na área do aluno. Ela apenas fala; não altera nada do jogo. As falas dependem da série do aluno.
export default async function JogoLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  return (
    <GuiaProvider serie={s?.role === "student" ? s.serie : undefined}>
      <TutorialProvider>
      {children}
      <Guia />
      {/* espaço extra no fim da página para o balão nunca cobrir as alternativas no celular */}
      <div aria-hidden="true" className="h-56 sm:h-24" />
      </TutorialProvider>
    </GuiaProvider>
  );
}
