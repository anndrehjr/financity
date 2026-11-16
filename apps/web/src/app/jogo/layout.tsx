import { Guia } from "@/features/guia/Guia";
import { GuiaProvider } from "@/features/guia/GuiaProvider";

// A Nina (guia) só existe na área do aluno. Ela apenas fala; não altera nada do jogo.
export default function JogoLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuiaProvider>
      {children}
      <Guia />
      {/* espaço extra no fim da página para o balão nunca cobrir as alternativas no celular */}
      <div aria-hidden="true" className="h-56 sm:h-24" />
    </GuiaProvider>
  );
}
