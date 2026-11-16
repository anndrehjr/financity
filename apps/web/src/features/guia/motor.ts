// Motor de falas: funções puras (sem React), fáceis de testar.
import type { Aberta, Falas, Trecho } from "./tipos";

/** Divide "texto **negrito** texto" em trechos. Nada vira HTML: o React escapa o texto. */
export function parseNegrito(t: string): Trecho[] {
  return t.split("**").map((texto, i) => ({ texto, negrito: i % 2 === 1 })).filter((x) => x.texto !== "");
}

/**
 * Abre um momento. Devolve a nova fala aberta, ou undefined quando deve ser IGNORADO (mantém a atual).
 * `ultimo` guarda o último índice sorteado por momento (mutado) para o sorteio não repetir.
 */
export function abrir(atual: Aberta | null, nome: string, config: Falas, ultimo: Record<string, number>, rnd: () => number = Math.random): Aberta | undefined {
  const m = config.momentos[nome];
  if (!m || m.falas.length === 0) return undefined;
  const alta = m.prioridade === "alta";
  if (atual?.protegida && !alta) return undefined; // tutorial aberto: reações são descartadas
  if (m.somenteSeLivre && atual) return undefined;
  let falas = m.falas;
  if (m.tipo === "unica") falas = [m.falas[0]];
  else if (m.tipo === "sorteio") {
    const candidatos = m.falas.map((_, i) => i).filter((i) => m.falas.length < 2 || i !== ultimo[nome]);
    const i = candidatos[Math.min(candidatos.length - 1, Math.floor(rnd() * candidatos.length))];
    ultimo[nome] = i;
    falas = [m.falas[i]];
  }
  return { momento: nome, falas, indice: 0, protegida: alta };
}

/** Próxima fala da sequência; null quando acabou. */
export function avancar(a: Aberta): Aberta | null {
  return a.indice + 1 < a.falas.length ? { ...a, indice: a.indice + 1 } : null;
}

/** Classifica a pontuação de uma resposta (0 a 5) em momento de reação. */
export function reacaoPorPontos(pontos: number, minAcerto: number, minParcial: number): "acerto" | "parcial" | "erro" {
  return pontos >= minAcerto ? "acerto" : pontos >= minParcial ? "parcial" : "erro";
}
