// De que lado a Nina (avatar + balão) fica. A Nina é SEMPRE ancorada no canto inferior: o tamanho da mensagem nunca a move
// para cima nem para baixo (o balão é que cresce). Função pura, sem DOM: só decide o LADO, para não cobrir o elemento que o
// tutorial está destacando. Usa os retângulos REAIS do avatar e do balão (medidos no lado atual) e os espelha para saber como
// seria no outro lado. Prefere o lado padrão; troca apenas se o outro lado cobrir MENOS área do alvo.

export type Retangulo = { x: number; y: number; w: number; h: number };
export type Lado = "esquerda" | "direita";

/** Área (px²) em que dois retângulos se sobrepõem. */
export const areaDeCruzamento = (a: Retangulo, b: Retangulo) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/** Espelha um retângulo da esquerda para a direita (e vice-versa) numa tela de largura `larguraTela`. */
export const espelhar = (r: Retangulo, larguraTela: number): Retangulo => ({ ...r, x: larguraTela - (r.x + r.w) });

export function escolherLado(alvo: Retangulo | null, retangulosAtuais: Retangulo[], larguraTela: number, ladoAtual: Lado, ladoPadrao: Lado): Lado {
  if (!alvo || alvo.w <= 0 || alvo.h <= 0 || retangulosAtuais.length === 0) return ladoPadrao;
  const cobre = (rs: Retangulo[]) => rs.reduce((soma, r) => soma + areaDeCruzamento(r, alvo), 0);
  const espelhados = retangulosAtuais.map((r) => espelhar(r, larguraTela));
  const cobreAtual = cobre(retangulosAtuais), cobreOutro = cobre(espelhados);
  const outro: Lado = ladoAtual === "esquerda" ? "direita" : "esquerda";
  if (cobreAtual === cobreOutro) return ladoPadrao;
  return cobreAtual < cobreOutro ? ladoAtual : outro;
}
