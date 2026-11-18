import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import falasJson from "../config/falas-nina.json" with { type: "json" };
import catalogoJson from "../../../data/nina/falas.json" with { type: "json" };
import { abrir, resolverMomento } from "../motor";
import type { Falas } from "../tipos";

const falas = falasJson as Falas;
const catalogo = (catalogoJson as { falas: { id: string; publico: string; texto: string }[] }).falas;
const manifesto = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "guia", "nina", "audio", "manifest.json"), "utf8")) as { falas: Record<string, unknown> };

// Séries com falas de tema: o 8º (publicado) e o 7º (falas s7.mapa_1..4 já cadastradas, com áudio; os temas do 7º ainda são rascunho).
const SERIES_COM_CONTEUDO = [7, 8];
const TODAS_AS_SERIES = [7, 8];
const MOMENTOS_GERAIS = ["acerto", "parcial", "erro", "parado", "fase_concluida", "vitoria"]; // usados em qualquer série
const MOMENTOS_DE_TEMA = ["mapa_1", "mapa_2", "mapa_3", "mapa_4"];                              // dependem dos temas da série

test("cobertura por série: os momentos gerais têm texto (e áudio, quando houver) para o 7º e para o 8º ano", () => {
  for (const serie of TODAS_AS_SERIES) for (const m of [...MOMENTOS_GERAIS, "sem_temas"]) {
    const alvo = resolverMomento(falas, m, serie);
    assert.ok(alvo, `série ${serie}: momento ${m} sem fala (nem específica nem geral)`);
    const a = abrir(null, alvo!, falas, {})!;
    assert.ok(a.falas[0].texto.trim().length > 0 && a.ids?.[0], `série ${serie}: ${m} sem texto/id`);
  }
});

test("cobertura por série: as falas de tema existem para toda série que tem temas publicados", () => {
  for (const serie of SERIES_COM_CONTEUDO) for (const m of MOMENTOS_DE_TEMA)
    assert.ok(resolverMomento(falas, m, serie), `série ${serie}: falta a fala de ${m} (crie "s${serie}.${m}" ou marque publico: geral)`);
});

test("o aluno do 7º NUNCA ouve/lê as falas dos temas do 8º (e vice-versa)", () => {
  for (const m of MOMENTOS_DE_TEMA) {
    assert.equal(resolverMomento(falas, m, 7), `s7.${m}`, `${m}: o 7º deve usar a fala própria (s7.${m}), nunca a do 8º`);
    assert.equal(resolverMomento(falas, m, 8), m);
  }
});

test("versão específica da série tem prioridade sobre a geral", () => {
  const cfg: Falas = { versao: 1, momentos: {
    mapa_1: { tipo: "unica", publico: "8", falas: [{ expressao: "feliz", texto: "do 8" }] },
    "s7.mapa_1": { tipo: "unica", publico: "7", falas: [{ expressao: "feliz", texto: "do 7" }] },
    geral_x: { tipo: "unica", falas: [{ expressao: "feliz", texto: "geral" }] },
    "s7.geral_x": { tipo: "unica", publico: "7", falas: [{ expressao: "feliz", texto: "geral do 7" }] },
  } };
  assert.equal(resolverMomento(cfg, "mapa_1", 7), "s7.mapa_1"); assert.equal(resolverMomento(cfg, "mapa_1", 8), "mapa_1");
  assert.equal(resolverMomento(cfg, "geral_x", 7), "s7.geral_x"); assert.equal(resolverMomento(cfg, "geral_x", 8), "geral_x");
  assert.equal(resolverMomento(cfg, "inexistente", 7), undefined);
});

test("catálogo: toda fala tem público válido; tudo que cita os 4 temas do 8º é '8'; abertura, reações e tutorial são 'geral'", () => {
  for (const f of catalogo) assert.ok(["geral", "7", "8"].includes(f.publico), `${f.id}: público inválido`);
  const por = (id: string) => catalogo.find((f) => f.id === id)!.publico;
  for (const id of ["mapa_1.1", "mapa_2.1", "mapa_3.1", "mapa_4.1"]) assert.equal(por(id), "8");
  for (const f of catalogo.filter((x) => /^(acerto|parcial|erro|parado|fase_concluida|vitoria|sem_temas|guia|tutorial)/.test(x.id))) assert.equal(f.publico, "geral", f.id);
});

test("informativo: falas ainda sem áudio (aparecem só em legenda)", () => {
  const sem = catalogo.filter((f) => !manifesto.falas[f.id]).map((f) => f.id);
  console.log(`# falas sem áudio: ${sem.length} (${sem.join(", ") || "nenhuma"})`);
  assert.ok(sem.length >= 0);
});
