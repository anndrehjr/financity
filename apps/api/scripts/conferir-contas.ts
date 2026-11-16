// Conferência independente dos números usados nas questões dos Mapas 2–4. Uso: npx tsx scripts/conferir-contas.ts
import assert from "node:assert/strict";
const r = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const testes: [string, () => void][] = [
  ["M2Q1 casaco: 50% e depois 10% → R$ 90, desconto total 55% (não 60%)", () => { const a = 200 * 0.5, b = a * 0.9; assert.equal(b, 90); assert.equal(r((1 - b / 200) * 100), 55); assert.equal(200 * 0.4, 80); }],
  ["M2Q2 lanche: R$ 12 → R$ 15 = +25%; mesada R$ 60 compra 5 e depois 4", () => { assert.equal(r((15 - 12) / 12 * 100), 25); assert.equal(60 / 12, 5); assert.equal(60 / 15, 4); assert.notEqual(r(3 / 12 * 100), 3); }],
  ["M2Q3 cadernos: pacote R$ 54/3 = R$ 18; unidade R$ 20 com 10% = R$ 18; diferença R$ 36", () => { assert.equal(54 / 3, 18); assert.equal(20 * 0.9, 18); assert.equal(54 - 18, 36); }],
  ["M2Q4 mochila: 40% de R$ 250 → R$ 150; vs. R$ 160 = 6,25%", () => { assert.equal(250 * 0.6, 150); assert.equal((160 - 150) / 160 * 100, 6.25); }],
  ["M3Q1 caderno de contas: receitas 110, despesas 60, saldo 50; soma de tudo 170; só mesada: saldo 20", () => { assert.equal(80 + 30, 110); assert.equal(25 + 20 + 15, 60); assert.equal(110 - 60, 50); assert.equal(80 + 30 + 25 + 20 + 15, 170); assert.equal(80 - 60, 20); }],
  ["M3Q2 regra 50-30-20 sobre R$ 200 → 100/60/40", () => { assert.deepEqual([200 * 0.5, 200 * 0.3, 200 * 0.2], [100, 60, 40]); }],
  ["M3Q3 Cléo: 10% de R$ 100 por 9 meses = R$ 90", () => { assert.equal(100 * 0.1 * 9, 90); }],
  ["M3Q4 bicicleta: R$ 120 − R$ 40 = R$ 80", () => { assert.equal(120 - 40, 80); }],
  ["M3Q5 fone: R$ 240 em 4 meses = R$ 60/mês; sobra R$ 40; R$ 100/mês leva 2,4 meses", () => { assert.equal(240 / 4, 60); assert.equal(100 - 60, 40); assert.equal(240 / 100, 2.4); }],
  ["M4Q2 parcelado: 3 × R$ 110 = R$ 330; +R$ 30 = 10% sobre R$ 300", () => { assert.equal(3 * 110, 330); assert.equal(330 - 300, 30); assert.equal((30 / 300) * 100, 10); }],
  ["M4Q3 caixas: 2% de chance → 50 caixas em média → R$ 250", () => { assert.equal(1 / 0.02, 50); assert.equal(50 * 5, 250); }],
  ["M4Q4 caixa da turma: R$ 400 − R$ 360 = R$ 40 esperados; faltam R$ 20", () => { assert.equal(400 - 360, 40); }],
];
let falhas = 0;
for (const [nome, fn] of testes) { try { fn(); console.log("  ✔", nome); } catch (e) { falhas++; console.log("  ✘ FALHOU:", nome, (e as Error).message); } }
console.log(falhas ? `\n${falhas} conta(s) errada(s)` : `\n${testes.length} grupos de contas conferidos.`);
process.exit(falhas ? 1 : 0);
