// Progresso do tutorial. Hoje: cache no navegador (localStorage). O repositório é uma interface para que a gravação por
// usuário no servidor (tabela tutorial_progress, ainda NÃO criada: depende de aprovação do SQL) entre sem mexer no motor.
import { armazemDoNavegador, type Armazem } from "../armazenamento";

export type StatusTutorial = "in_progress" | "done" | "skipped";
export type Progresso = { step: number; status: StatusTutorial };
export interface RepositorioProgresso {
  ler(tutorialId: string): Progresso | null;
  gravar(tutorialId: string, p: Progresso): void;
}

const chave = (id: string) => `financity_tutorial_${id}`;

export function repositorioLocal(a: Armazem | null = armazemDoNavegador()): RepositorioProgresso {
  return {
    ler(id) {
      try {
        const v = JSON.parse(a?.getItem(chave(id)) ?? "null");
        if (v && Number.isInteger(v.step) && ["in_progress", "done", "skipped"].includes(v.status)) return v as Progresso;
      } catch { /* valor inválido: ignora */ }
      return null;
    },
    gravar(id, p) { try { a?.setItem(chave(id), JSON.stringify(p)); } catch { /* armazenamento indisponível */ } },
  };
}

/** Deve iniciar sozinho? Só na primeira vez (nunca concluído nem pulado). Em andamento: retoma da etapa salva. */
export function pontoDeRetomada(p: Progresso | null): { iniciar: boolean; desde: number } {
  if (!p) return { iniciar: true, desde: 0 };
  if (p.status === "in_progress") return { iniciar: true, desde: Math.max(0, p.step) };
  return { iniciar: false, desde: 0 };
}
