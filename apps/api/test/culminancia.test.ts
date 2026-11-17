import assert from "node:assert/strict";
import { test } from "node:test";
import { CULMINANCIA } from "../src/content/culminancia.js";
import { dominio, grade, RespostaInvalida, type OptG } from "../src/lib/grading.js";

const todas = CULMINANCIA.flatMap((t) => t.questions);
const og = (q: (typeof todas)[number]): OptG[] => q.options.map((o, i) => ({ id: i + 1, points: o.points, is_correct: !!o.correct, seq: o.seq ?? null }));

test("estrutura: 4 temas × 8 questões = 32; 240 pontos por tema; 960 no total", () => {
  assert.equal(CULMINANCIA.length, 4);
  for (const t of CULMINANCIA) {
    assert.equal(t.questions.length, 8, t.slug);
    assert.equal(t.questions.reduce((s, q) => s + q.max, 0), 240, t.slug);
    assert.deepEqual(t.questions.map((q) => q.max), [30, 30, 30, 30, 30, 30, 30, 30], t.slug); // padrão único: toda questão vale 30
    assert.deepEqual(t.questions.map((q) => q.number), [1, 2, 3, 4, 5, 6, 7, 8]);
  }
  assert.equal(todas.reduce((s, q) => s + q.max, 0), 960);
});

test("cada questão: 4 alternativas, textos únicos, pontuação coerente com o tipo", () => {
  for (const q of todas) {
    assert.equal(q.options.length, 4, q.code);
    assert.equal(new Set(q.options.map((o) => o.text)).size, 4, q.code);
    assert.ok(q.options.every((o) => o.text.trim() && o.why.trim()), q.code);
    if (q.kind === "choice") {
      assert.equal(Math.max(...q.options.map((o) => o.points)), q.max, `${q.code}: a melhor alternativa vale o máximo`);
      assert.equal(q.options.filter((o) => o.points === q.max).length, 1, `${q.code}: uma única alternativa integral`);
      assert.ok(q.options.every((o) => Number.isInteger(o.points) && o.points >= 0 && o.points <= q.max), q.code);
      assert.ok(q.options.every((o) => [0, 10, 20, 30].includes(o.points)), `${q.code}: escala padrão das alternativas = 30 / 20 / 10 / 0`);
    }
    if (q.kind === "multi") assert.ok(q.options.some((o) => o.correct) && q.options.some((o) => !o.correct), q.code);
    if (q.kind === "order") assert.deepEqual(q.options.map((o) => o.seq), [1, 2, 3, 4], q.code);
    assert.ok(!/^\d\.\s/.test(q.options[0].text), `${q.code}: prefixo numérico não pode aparecer`);
  }
  const tipos = todas.reduce<Record<string, number>>((m, q) => ((m[q.kind] = (m[q.kind] ?? 0) + 1), m), {});
  assert.deepEqual(tipos, { choice: 24, multi: 4, order: 4 });
});

test("escolha: pontos da alternativa, nunca acima do máximo", () => {
  const c04 = todas.find((q) => q.code === "C04")!;
  assert.equal(grade("choice", 30, og(c04), { optionId: 2 }).points, 30);
  assert.equal(grade("choice", 30, og(c04), { optionId: 1 }).points, 10);
  assert.throws(() => grade("choice", 30, og(c04), { optionId: 99 }), RespostaInvalida);
  assert.throws(() => grade("choice", 30, og(c04), {}), RespostaInvalida);
});

test("multisseleção A,C: exato = 100%; parcial < exato; incorreta zera; marcar tudo = 0", () => {
  const q = og(todas.find((x) => x.code === "C03")!);
  assert.equal(grade("multi", 30, q, { optionIds: [1, 3] }).points, 30);
  assert.equal(grade("multi", 30, q, { optionIds: [3, 1] }).points, 30); // a ordem não importa
  assert.equal(grade("multi", 30, q, { optionIds: [1] }).points, 15);
  assert.equal(grade("multi", 30, q, { optionIds: [1, 2] }).points, 0);   // 1/2 − 1/2
  assert.equal(grade("multi", 30, q, { optionIds: [1, 2, 3, 4] }).points, 0);
  assert.equal(grade("multi", 30, q, { optionIds: [2, 4] }).points, 0);
  assert.ok(grade("multi", 30, q, { optionIds: [1] }).points < grade("multi", 30, q, { optionIds: [1, 3] }).points);
  assert.throws(() => grade("multi", 30, q, { optionIds: [] }), RespostaInvalida);
  assert.throws(() => grade("multi", 30, q, { optionIds: [7] }), RespostaInvalida);
});

test("multisseleção A,C,D (P05): 2 corretas = 20; 3 corretas = 30; 3 corretas + 1 errada = 0 por tudo marcado", () => {
  const q = og(todas.find((x) => x.code === "P05")!);
  assert.equal(grade("multi", 30, q, { optionIds: [1, 3, 4] }).points, 30);
  assert.equal(grade("multi", 30, q, { optionIds: [1, 3] }).points, 20);
  assert.equal(grade("multi", 30, q, { optionIds: [1, 2, 3, 4] }).points, 0);
  assert.equal(grade("multi", 30, q, { optionIds: [1, 3, 2] }).points, 0);
});

test("ordenação: exata 100%; 2 relações = 65%; 1 = 30%; 0 = 0%; entrada inválida rejeitada", () => {
  const q = og(todas.find((x) => x.code === "C05")!);
  assert.equal(grade("order", 30, q, { order: [1, 2, 3, 4] }).points, 30);
  assert.equal(grade("order", 30, q, { order: [2, 1, 3, 4] }).points, 20);  // 2 de 3 relações → 65% (19,5 arredonda para 20)
  assert.equal(grade("order", 30, q, { order: [1, 2, 4, 3] }).points, 20);
  assert.equal(grade("order", 30, q, { order: [2, 1, 4, 3] }).points, 9);   // só a relação 2<3 → 30%
  assert.equal(grade("order", 30, q, { order: [4, 3, 2, 1] }).points, 0);
  assert.throws(() => grade("order", 30, q, { order: [1, 2, 3] }), RespostaInvalida);
  assert.throws(() => grade("order", 30, q, { order: [1, 1, 2, 3] }), RespostaInvalida);
});

test("classificação por domínio", () => {
  assert.equal(dominio(39).key, "inicial");
  assert.equal(dominio(40).key, "em_desenvolvimento");
  assert.equal(dominio(60).key, "adequado");
  assert.equal(dominio(79).key, "adequado");
  assert.equal(dominio(80).key, "consolidado");
});
