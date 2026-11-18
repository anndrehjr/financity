// Onde a Nina (avatar + balão) fica na tela. Função pura, sem DOM: escolhe a primeira posição que NÃO cobre o elemento
// que o tutorial está destacando. Ordem de preferência: canto inferior do lado padrão → inferior do outro lado → superior do
// lado padrão → superior do outro lado. Se nenhuma estiver totalmente livre (alvo grande, como a lista de alternativas),
// escolhe a que cobre MENOS área do alvo; em empate, a de maior preferência.

export type Retangulo = { x: number; y: number; w: number; h: number };
export type Posicao = { vertical: "baixo" | "topo"; lado: "esquerda" | "direita" };

const cruza = (a: Retangulo, b: Retangulo, folga: number) =>
  a.x < b.x + b.w + folga && a.x + a.w + folga > b.x && a.y < b.y + b.h + folga && a.y + a.h + folga > b.y;

/** Retângulo ocupado pela Nina em uma posição (caixa = tamanho do conjunto avatar + balão; margem = distância da borda). */
export function retanguloDaPosicao(p: Posicao, caixa: { w: number; h: number }, tela: { w: number; h: number }, margem: number): Retangulo {
  return { x: p.lado === "esquerda" ? margem : tela.w - caixa.w - margem, y: p.vertical === "baixo" ? tela.h - caixa.h - margem : margem, w: caixa.w, h: caixa.h };
}

/** Área (px²) em que dois retângulos se sobrepõem. */
export const areaDeCruzamento = (a: Retangulo, b: Retangulo) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

export function escolherPosicao(alvo: Retangulo | null, caixa: { w: number; h: number }, tela: { w: number; h: number }, margem: number, ladoPadrao: Posicao["lado"], folga = 8): Posicao {
  const outro: Posicao["lado"] = ladoPadrao === "esquerda" ? "direita" : "esquerda";
  const candidatas: Posicao[] = [
    { vertical: "baixo", lado: ladoPadrao }, { vertical: "baixo", lado: outro },
    { vertical: "topo", lado: ladoPadrao }, { vertical: "topo", lado: outro },
  ];
  if (!alvo || alvo.w <= 0 || alvo.h <= 0) return candidatas[0];
  const livre = candidatas.find((p) => !cruza(retanguloDaPosicao(p, caixa, tela, margem), alvo, folga));
  if (livre) return livre;
  let melhor = candidatas[0], menor = Infinity;
  for (const p of candidatas) { const a = areaDeCruzamento(retanguloDaPosicao(p, caixa, tela, margem), alvo); if (a < menor) { menor = a; melhor = p; } }
  return melhor;
}
