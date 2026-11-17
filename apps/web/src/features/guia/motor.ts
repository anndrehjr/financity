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
  if (m.somenteSeLivre && atual) return undefined;
  let falas = m.falas;
  let ids = m.falas.map((_, i) => `${nome}.${i + 1}`);
  if (m.tipo === "unica") { falas = [m.falas[0]]; ids = [ids[0]]; }
  else if (m.tipo === "sorteio") {
    const candidatos = m.falas.map((_, i) => i).filter((i) => m.falas.length < 2 || i !== ultimo[nome]);
    const i = candidatos[Math.min(candidatos.length - 1, Math.floor(rnd() * candidatos.length))];
    ultimo[nome] = i;
    falas = [m.falas[i]]; ids = [`${nome}.${i + 1}`];
  }
  return { momento: nome, falas, indice: 0, ids };
}

/**
 * Escolhe o momento certo para a série do aluno: primeiro a versão da série ("s7.nome"), depois a fala geral.
 * Fala de OUTRA série nunca é usada (um aluno do 7º não ouve o texto dos temas do 8º). Sem versão aplicável: undefined (a Nina não fala).
 */
export function resolverMomento(config: Falas, nome: string, serie: number): string | undefined {
  const especifico = `s${serie}.${nome}`;
  if (config.momentos[especifico]) return especifico;
  const m = config.momentos[nome];
  if (!m) return undefined;
  const p = m.publico ?? "geral";
  return p === "geral" || p === String(serie) ? nome : undefined;
}

/** Próxima fala da sequência; null quando acabou. */
export function avancar(a: Aberta): Aberta | null {
  return a.indice + 1 < a.falas.length ? { ...a, indice: a.indice + 1 } : null;
}

/** Classifica a pontuação de uma resposta (0 a 5) em momento de reação. */
export function reacaoPorPontos(pontos: number, minAcerto: number, minParcial: number): "acerto" | "parcial" | "erro" {
  return pontos >= minAcerto ? "acerto" : pontos >= minParcial ? "parcial" : "erro";
}
