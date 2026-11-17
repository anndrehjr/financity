import assert from "node:assert/strict";
import { test } from "node:test";
import { lerCredenciais, nomeDoArquivo, renderizarCredenciais } from "./credenciais";

const csv = "﻿Aluno;Turma;Usuário;PIN\r\nAna Teste;7 ano;a.teste;482913\r\n\"Zé <b>X</b>\";7 ano;z.x;719364\r\n";

test("lê o CSV de credenciais do importador (BOM, aspas, CRLF)", () => {
  const r = lerCredenciais(csv);
  assert.equal(r.length, 2); assert.deepEqual(r[0], { nome: "Ana Teste", turma: "7 ano", usuario: "a.teste", pin: "482913" });
});

test("o HTML sai autônomo e seguro: escapa tags, sem script, sem recursos externos, com endereço e cartão recortável", () => {
  const h = renderizarCredenciais(lerCredenciais(csv), "https://exemplo.test");
  assert.ok(!h.includes("<b>X</b>") && h.includes("&lt;b&gt;X&lt;/b&gt;"));
  assert.ok(!/<script|src=|href=|@import|url\(/i.test(h));
  assert.equal((h.match(/class="cartao"/g) ?? []).length, 2);
  assert.ok(h.includes("https://exemplo.test") && h.includes("482913") && h.includes("a.teste"));
  assert.ok(h.includes("dashed") && h.includes("@media print"));
});

test("nome do arquivo: por série quando todos são da mesma série", () => {
  assert.equal(nomeDoArquivo(lerCredenciais(csv)), "credenciais-7ano.html");
  assert.equal(nomeDoArquivo([{ nome: "a", turma: "7 ano", usuario: "u", pin: "1" }, { nome: "b", turma: "8 ano", usuario: "v", pin: "2" }]), "credenciais-turmas.html");
});
