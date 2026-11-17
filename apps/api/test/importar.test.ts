import assert from "node:assert/strict";
import { test } from "node:test";
import { lerCsv, nomeBonito } from "../src/importar-cli.js";

test("nomes em maiúsculas viram nomes normais, com partículas em minúscula", () => {
  assert.equal(nomeBonito("  JOÃO GABRIEL   DE LIMA E SILVA "), "João Gabriel de Lima e Silva");
  assert.equal(nomeBonito("PEDRO AUGUSTO DOS SANTOS PAULO"), "Pedro Augusto dos Santos Paulo");
});

test("CSV nome,serie,turma: turma vazia vira '<série> ano'; aceita vírgula, ponto e vírgula, BOM e aspas", () => {
  const a = lerCsv("﻿nome,serie,turma\nANA TESTE UM,7,\nBRUNO TESTE DOIS,7,7º B\n");
  assert.deepEqual(a.linhas, [{ nome: "Ana Teste Um", serie: 7, turma: "7 ano" }, { nome: "Bruno Teste Dois", serie: 7, turma: "7º B" }]);
  assert.equal(a.rejeitadas.length, 0);
  const b = lerCsv('nome;serie;turma\n"TESTE, DA SILVA";8;8 ano\n');
  assert.equal(b.linhas[0].nome, "Teste, da Silva");
});

test("linhas inválidas são rejeitadas com o motivo (sem eco do nome): série errada, turma de outra série, nome curto", () => {
  const r = lerCsv("nome,serie,turma\nAB,7,\nCARLA TESTE,20,\nDANI TESTE,7,8º A\nELI TESTE,x,\n");
  assert.equal(r.linhas.length, 0);
  assert.deepEqual(r.rejeitadas.map((x) => x.linha), [2, 3, 4, 5]);
  assert.ok(r.rejeitadas.every((x) => !/TESTE|Teste/.test(x.motivo)));
});

test("cabeçalho sem nome ou série é recusado", () => {
  assert.equal(lerCsv("aluno,ano\nX,7\n").rejeitadas[0].linha, 1);
});
