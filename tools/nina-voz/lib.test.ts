import assert from "node:assert/strict";
import { test } from "node:test";
import falas from "../../apps/web/src/features/guia/config/falas-nina.json" with { type: "json" };
import { TUTORIAIS } from "../../apps/web/src/features/guia/tutorial/registro";
import { aplicarPronuncia, bocasDoRhubarb, coletarFalas, duracaoMp3Ms, hashFala, porExtenso, semNegrito } from "./lib";

const pron = { substituicoes: [{ de: "Financity", para: "Fainânsiti" }, { de: "D5.4", para: "desafio cinco ponto quatro" }] };

test("coleta: todas as falas do JSON e dos tutoriais, com IDs estáveis e únicos", () => {
  const f = coletarFalas(falas as any, TUTORIAIS as any);
  assert.ok(f.length > 20);
  assert.equal(new Set(f.map((x) => x.id)).size, f.length);
  assert.ok(f.some((x) => x.id === "boas_vindas.1") && f.some((x) => x.id === "tutorial.primeiros-passos.entrar.ok"));
  assert.ok(f.every((x) => ["alegria", "curiosidade", "explicacao", "incentivo", "comemoracao"].includes(x.emocao)));
});

test("negrito é removido do texto do motor", () => { assert.equal(semNegrito("oi **Nina**!"), "oi Nina!"); });

test("pronúncia: reais, porcentagem, siglas e marca; legenda original não muda", () => {
  assert.equal(aplicarPronuncia("R$ 2.500,00", pron), "dois mil e quinhentos reais");
  assert.equal(aplicarPronuncia("R$ 1,50", pron), "um real e cinquenta centavos");
  assert.equal(aplicarPronuncia("desconto de 15%", pron), "desconto de quinze por cento");
  assert.equal(aplicarPronuncia("Fase D5.4 no Financity", pron), "Fase desafio cinco ponto quatro no Fainânsiti");
  const original = "R$ 10,00 no Financity"; aplicarPronuncia(original, pron); assert.equal(original, "R$ 10,00 no Financity");
});

test("números por extenso", () => {
  assert.deepEqual([0, 21, 100, 101, 215, 1000, 1001, 2500, 12345].map(porExtenso),
    ["zero", "vinte e um", "cem", "cento e um", "duzentos e quinze", "mil", "mil e um", "dois mil e quinhentos", "doze mil trezentos e quarenta e cinco"]);
});

test("hash: muda com qualquer entrada, é estável para a mesma", () => {
  const a = hashFala("t", "m", "v", "e", "1");
  assert.equal(a, hashFala("t", "m", "v", "e", "1"));
  for (const b of [hashFala("t2", "m", "v", "e", "1"), hashFala("t", "m2", "v", "e", "1"), hashFala("t", "m", "v2", "e", "1"), hashFala("t", "m", "v", "e2", "1"), hashFala("t", "m", "v", "e", "2")]) assert.notEqual(a, b);
  assert.equal(a.length, 8);
});

test("boca: formas do Rhubarb viram camadas da Nina; duração estimada do MP3", () => {
  assert.deepEqual(bocasDoRhubarb({ mouthCues: [{ start: 0, end: 0.1, value: "X" }, { start: 0.1, end: 0.3, value: "D" }, { start: 0.3, end: 0.4, value: "?" }] }),
    [{ t: 0, forma: "fechada" }, { t: 100, forma: "a" }, { t: 300, forma: "fechada" }]);
  assert.equal(duracaoMp3Ms(16000, 128), 1000); // 16 kB a 128 kbps = 1 s
});
