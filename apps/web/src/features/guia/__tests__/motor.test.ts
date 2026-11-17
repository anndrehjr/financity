import assert from "node:assert/strict";
import { test } from "node:test";
import falasJson from "../config/falas-nina.json" with { type: "json" };
import { abrir, avancar, parseNegrito, reacaoPorPontos } from "../motor";
import { gravar, ler, type Armazem } from "../armazenamento";
import type { Falas } from "../tipos";

const falas = falasJson as Falas;
const memoria = (): Armazem & { d: Map<string, string> } => {
  const d = new Map<string, string>();
  return { d, getItem: (k) => d.get(k) ?? null, setItem: (k, v) => void d.set(k, v), removeItem: (k) => void d.delete(k) };
};

test("todos os momentos do JSON têm falas válidas, expressões conhecidas e texto não vazio", () => {
  const ex = ["feliz", "pensando", "preocupada", "comemorando"];
  for (const [nome, m] of Object.entries(falas.momentos)) {
    assert.ok(m.falas.length > 0, nome);
    for (const f of m.falas) { assert.ok(ex.includes(f.expressao), nome); assert.ok(f.texto.trim().length > 0, nome); }
  }
});

test("sequência: abre na 1ª fala e avança em ordem até acabar", () => {
  let a = abrir(null, "vitoria", falas, {})!;
  const total = falas.momentos.vitoria.falas.length;
  assert.equal(a.indice, 0); assert.equal(a.falas.length, total);
  for (let i = 1; i < total; i++) { a = avancar(a)!; assert.equal(a.indice, i); }
  assert.equal(avancar(a), null);
});

test("única: só uma fala", () => {
  const a = abrir(null, "mapa_2", falas, {})!;
  assert.equal(a.falas.length, 1);
});

test("sorteio: nunca repete a última fala do mesmo momento", () => {
  const ultimo: Record<string, number> = {};
  let anterior = -1;
  for (let k = 0; k < 200; k++) {
    const a = abrir(null, "acerto", falas, ultimo)!;
    const i = ultimo.acerto;
    assert.notEqual(i, anterior);
    assert.equal(a.falas[0], falas.momentos.acerto.falas[i]);
    anterior = i;
  }
});

test("reação aberta é substituída por outra reação", () => {
  const reacao = abrir(null, "acerto", falas, {})!;
  assert.equal(abrir(reacao, "erro", falas, {})!.momento, "erro");
});

test("'parado' só dispara se não houver fala aberta", () => {
  const aberta = abrir(null, "acerto", falas, {})!;
  assert.equal(abrir(aberta, "parado", falas, {}), undefined);
  assert.equal(abrir(null, "parado", falas, {})!.momento, "parado");
});

test("momento inexistente é ignorado", () => {
  assert.equal(abrir(null, "nao_existe", falas, {}), undefined);
});

test("**negrito** vira trechos e o resto continua texto puro (sem HTML)", () => {
  assert.deepEqual(parseNegrito("a **b** c"), [{ texto: "a ", negrito: false }, { texto: "b", negrito: true }, { texto: " c", negrito: false }]);
  const t = parseNegrito("<img src=x onerror=alert(1)> **<b>**");
  assert.equal(t.map((x) => x.texto).join(""), "<img src=x onerror=alert(1)> <b>");
});

test("pontos viram reação: acerto, parcial, erro", () => {
  assert.equal(reacaoPorPontos(5, 4, 2), "acerto");
  assert.equal(reacaoPorPontos(4, 4, 2), "acerto");
  assert.equal(reacaoPorPontos(3, 4, 2), "parcial");
  assert.equal(reacaoPorPontos(2, 4, 2), "parcial");
  assert.equal(reacaoPorPontos(0, 4, 2), "erro");
});

test("armazenamento: tutorial visto e Nina escondida persistem; falha do navegador não quebra", () => {
  const m = memoria();
  assert.equal(ler(m, "financity_nina_tutorial_visto"), false); // 1ª vez: abre o tutorial
  gravar(m, "financity_nina_tutorial_visto", true);
  assert.equal(ler(m, "financity_nina_tutorial_visto"), true); // 2ª vez: não abre
  gravar(m, "financity_nina_silenciada", true);
  assert.equal(ler(m, "financity_nina_silenciada"), true);
  gravar(m, "financity_nina_silenciada", false);
  assert.equal(ler(m, "financity_nina_silenciada"), false);
  const quebrado: Armazem = { getItem() { throw new Error("x"); }, setItem() { throw new Error("x"); }, removeItem() { throw new Error("x"); } };
  assert.equal(ler(quebrado, "k"), false);
  assert.doesNotThrow(() => gravar(quebrado, "k", true));
});
