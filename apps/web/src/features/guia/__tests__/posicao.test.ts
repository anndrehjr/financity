import assert from "node:assert/strict";
import { test } from "node:test";
import { areaDeCruzamento, escolherPosicao, retanguloDaPosicao } from "../posicao";

const tela = { w: 1366, h: 800 }, caixa = { w: 533, h: 210 }, M = 16;

test("sem alvo (ou alvo vazio) a Nina fica na posição padrão", () => {
  assert.deepEqual(escolherPosicao(null, caixa, tela, M, "esquerda"), { vertical: "baixo", lado: "esquerda" });
  assert.deepEqual(escolherPosicao({ x: 0, y: 0, w: 0, h: 0 }, caixa, tela, M, "direita"), { vertical: "baixo", lado: "direita" });
});

test("alvo longe da Nina: não muda de lugar", () => {
  assert.deepEqual(escolherPosicao({ x: 600, y: 100, w: 200, h: 40 }, caixa, tela, M, "esquerda"), { vertical: "baixo", lado: "esquerda" });
});

test("alvo embaixo, à esquerda (o botão 'Começar aventura' sob o balão): vai para o outro lado", () => {
  const p = escolherPosicao({ x: 260, y: 572, w: 220, h: 44 }, caixa, tela, M, "esquerda");
  assert.deepEqual(p, { vertical: "baixo", lado: "direita" });
  assert.equal(retanguloDaPosicao(p, caixa, tela, M).x, 1366 - 533 - 16);
});

test("celular (conjunto ocupa a largura toda): sobe para o topo quando o alvo está embaixo", () => {
  const cel = { w: 390, h: 780 }, cx = { w: 358, h: 350 };
  assert.deepEqual(escolherPosicao({ x: 20, y: 600, w: 340, h: 50 }, cx, cel, M, "esquerda"), { vertical: "topo", lado: "esquerda" });
});

test("alvo cobre a tela toda: todas empatam e vale a preferência (posição padrão, nunca falha)", () => {
  assert.deepEqual(escolherPosicao({ x: 0, y: 0, w: 1366, h: 800 }, caixa, tela, M, "esquerda"), { vertical: "baixo", lado: "esquerda" });
});

test("alvo grande sem canto livre (lista de alternativas): escolhe o canto que cobre menos área", () => {
  const cel = { w: 390, h: 780 }, cx = { w: 358, h: 350 };
  const alvo = { x: 16, y: 300, w: 358, h: 400 };               // ocupa do meio até quase o fim da tela
  const p = escolherPosicao(alvo, cx, cel, M, "esquerda");
  const area = (q: typeof p) => areaDeCruzamento(retanguloDaPosicao(q, cx, cel, M), alvo);
  for (const outra of [{ vertical: "baixo", lado: "esquerda" }, { vertical: "baixo", lado: "direita" }, { vertical: "topo", lado: "esquerda" }, { vertical: "topo", lado: "direita" }] as const)
    assert.ok(area(p) <= area(outra), `${JSON.stringify(p)} deveria cobrir no máximo o mesmo que ${JSON.stringify(outra)}`);
  assert.equal(p.vertical, "topo");
});

test("o lado padrão da configuração é respeitado nas duas direções", () => {
  assert.equal(escolherPosicao(null, caixa, tela, M, "direita").lado, "direita");
  assert.deepEqual(escolherPosicao({ x: 900, y: 572, w: 220, h: 44 }, caixa, tela, M, "direita"), { vertical: "baixo", lado: "esquerda" });
});
