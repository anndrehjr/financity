import assert from "node:assert/strict";
import { test } from "node:test";
import { classeDeDispositivo, classificarTecla, copiaDeConteudoProtegido, ehEventoPermitido, marcaDaguaSvg, sobreposicao, textoMarcaDagua } from "../deteccao";

const down = (key: string, o: Partial<Parameters<typeof classificarTecla>[0]> = {}) => classificarTecla({ key, type: "keydown", ...o });

test("minimizar, bloquear a tela, trocar de aba/app, voltar e perder conexão são eventos PERMITIDOS (nunca enviados)", () => {
  for (const n of ["visibilitychange", "pagehide", "pageshow", "blur", "focus", "freeze", "resume", "online", "offline"]) assert.equal(ehEventoPermitido(n), true, n);
  for (const n of ["beforeprint", "copy", "keydown"]) assert.equal(ehEventoPermitido(n), false, n);
});

test("Ctrl+P e Cmd+P: atalho de impressão, que pode ser bloqueado; sem afirmar que imprimiu", () => {
  assert.deepEqual(down("p", { ctrlKey: true }), { tipo: "atalho_impressao", detalhe: "Ctrl+P", bloquear: true });
  assert.deepEqual(down("P", { metaKey: true }), { tipo: "atalho_impressao", detalhe: "Cmd+P", bloquear: true });
  assert.equal(down("p"), null, "letra p sozinha não é nada");
  assert.equal(down("p", { ctrlKey: true, shiftKey: true }), null, "Ctrl+Shift+P não é impressão");
});

test("PrintScreen só é visto no keyup e NÃO é bloqueável (o sistema operacional captura antes)", () => {
  assert.deepEqual(classificarTecla({ key: "PrintScreen", type: "keyup" }), { tipo: "tecla_captura_tela", detalhe: "PrintScreen", bloquear: false });
  assert.equal(classificarTecla({ key: "PrintScreen", type: "keydown" }), null, "evita contar duas vezes");
});

test("atalhos de captura do macOS e do Windows viram 'tecla de captura pressionada' (não confirmam captura)", () => {
  for (const k of ["3", "4", "5"]) assert.equal(down(k, { metaKey: true, shiftKey: true })?.tipo, "tecla_captura_tela");
  assert.equal(down("#", { metaKey: true, shiftKey: true })?.detalhe, "Cmd+Shift+3");
  assert.equal(down("S", { metaKey: true, shiftKey: true })?.detalhe, "Win+Shift+S");
  for (const r of [down("3", { metaKey: true, shiftKey: true }), down("S", { metaKey: true, shiftKey: true })]) assert.equal(r?.bloquear, false);
});

test("teclas comuns, setas, Tab, Enter e atalhos de acessibilidade não geram nada", () => {
  for (const k of ["a", "Enter", "Tab", "ArrowDown", " ", "Escape", "F5"]) assert.equal(down(k), null, k);
  assert.equal(down("c", { ctrlKey: true }), null, "Ctrl+C é tratado pelo evento 'copy', não pela tecla");
  assert.equal(down("+", { ctrlKey: true }), null, "zoom (acessibilidade) livre");
});

test("copiar só conta quando há texto selecionado DENTRO do conteúdo protegido", () => {
  assert.equal(copiaDeConteudoProtegido("Enunciado da questão", true), true);
  assert.equal(copiaDeConteudoProtegido("   ", true), false);
  assert.equal(copiaDeConteudoProtegido("", true), false);
  assert.equal(copiaDeConteudoProtegido("texto de fora", false), false);
});

test("dispositivo: classe grosseira, sem identificadores únicos", () => {
  assert.equal(classeDeDispositivo("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36"), "celular · Android · Chrome");
  assert.equal(classeDeDispositivo("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1"), "celular · iOS · Safari");
  assert.equal(classeDeDispositivo("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36 Edg/120"), "computador · Windows · Edge");
  assert.equal(classeDeDispositivo("", 0), "computador");
  assert.ok(classeDeDispositivo("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17 Safari/605.1.15", 5).startsWith("tablet"), "iPad se passando por Mac");
});

test("marca d'água: aluno, sessão e horário; o texto é escapado (sem injeção no SVG)", () => {
  const txt = textoMarcaDagua("Ana <b>", "A1B2C3D4", new Date(2026, 10, 19, 9, 5));
  assert.equal(txt, "Ana <b> · sessão A1B2C3D4 · 19/11/2026 09:05");
  const svg = decodeURIComponent(marcaDaguaSvg(txt));
  assert.ok(svg.includes("Ana &lt;b&gt;") && !svg.includes("<b>"));
});

test("sobreposição: eventos locais e estado do servidor; partida livre não mostra nada", () => {
  assert.equal(sobreposicao(null, { status: "ok", secondsLeft: 0, message: null }), null);
  assert.equal(sobreposicao(null, undefined), null);
  assert.equal(sobreposicao({ action: "notice", message: "x", secondsLeft: 0, eventId: 1 }, undefined), null, "aviso de gravidade 1 não bloqueia a tela");
  assert.deepEqual(sobreposicao({ action: "suspended", message: "m", secondsLeft: 20, eventId: 1 }, undefined), { tipo: "suspended", mensagem: "m", segundos: 20 });
  assert.deepEqual(sobreposicao(null, { status: "blocked", secondsLeft: 0, message: "bloqueada" }), { tipo: "blocked", mensagem: "bloqueada", segundos: 0 }, "depois de F5 o bloqueio continua (vem do servidor)");
});
