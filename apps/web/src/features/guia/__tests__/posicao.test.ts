import assert from "node:assert/strict";
import { test } from "node:test";
import { areaDeCruzamento, escolherLado, espelhar } from "../posicao";

const L = 1366;
// desktop, lado esquerdo: avatar 109x220 em (16,564) e balão 416x220 em (133,564)
const desktopEsq = [{ x: 16, y: 564, w: 109, h: 220 }, { x: 133, y: 564, w: 416, h: 220 }];
// celular, lado esquerdo (390 de largura): balão acima, avatar embaixo
const celEsq = [{ x: 16, y: 413, w: 358, h: 204 }, { x: 16, y: 621, w: 69, h: 140 }];

test("sem alvo (ou alvo vazio) a Nina fica no lado padrão", () => {
  assert.equal(escolherLado(null, desktopEsq, L, "esquerda", "esquerda"), "esquerda");
  assert.equal(escolherLado({ x: 0, y: 0, w: 0, h: 0 }, desktopEsq, L, "direita", "direita"), "direita");
});

test("alvo longe da Nina: não troca de lado", () => {
  assert.equal(escolherLado({ x: 600, y: 100, w: 200, h: 40 }, desktopEsq, L, "esquerda", "esquerda"), "esquerda");
});

test("desktop: botão 'Começar aventura' sob o balão → vai para o outro lado", () => {
  assert.equal(escolherLado({ x: 260, y: 572, w: 220, h: 44 }, desktopEsq, L, "esquerda", "esquerda"), "direita");
});

test("sem oscilar: já no outro lado, a mesma situação mantém o lado (e volta ao padrão quando o alvo sai)", () => {
  const dirDesktop = desktopEsq.map((r) => espelhar(r, L));
  const alvo = { x: 260, y: 572, w: 220, h: 44 };
  assert.equal(escolherLado(alvo, dirDesktop, L, "direita", "esquerda"), "direita");
  assert.equal(escolherLado(null, dirDesktop, L, "direita", "esquerda"), "esquerda");
});

test("celular: só o avatar (69 px) cobre o botão de baixo → trocar de lado libera o botão", () => {
  const botao = { x: 36, y: 630, w: 224, h: 52 };            // 'Confirmar resposta', à esquerda
  assert.equal(escolherLado(botao, celEsq, 390, "esquerda", "esquerda"), "direita");
});

test("celular: alvo no meio coberto pelo balão dos dois lados → empate, fica no lado padrão", () => {
  assert.equal(escolherLado({ x: 36, y: 500, w: 318, h: 40 }, celEsq, 390, "esquerda", "esquerda"), "esquerda");
});

test("alvo cobre a tela toda: empate, vale o lado padrão (nunca falha)", () => {
  assert.equal(escolherLado({ x: 0, y: 0, w: 1366, h: 800 }, desktopEsq, L, "direita", "esquerda"), "esquerda");
});

test("espelhar é reversível e a área de cruzamento é zero quando não se tocam", () => {
  const r = { x: 16, y: 564, w: 109, h: 220 };
  assert.deepEqual(espelhar(espelhar(r, L), L), r);
  assert.equal(areaDeCruzamento({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 20, w: 5, h: 5 }), 0);
  assert.equal(areaDeCruzamento({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 }), 25);
});
