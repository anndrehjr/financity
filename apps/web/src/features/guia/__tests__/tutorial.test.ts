import assert from "node:assert/strict";
import { test } from "node:test";
import manifestoJson from "../../../../public/guia/nina/nina.manifest.json" with { type: "json" };
import { Barramento } from "../tutorial/barramento";
import { MotorTutorial, type Relogio } from "../tutorial/motor";
import { pontoDeRetomada, repositorioLocal } from "../tutorial/progresso";
import { PRIMEIROS_PASSOS } from "../tutorial/registro";
import type { Tutorial } from "../tutorial/tipos";
import { bocaDaFala, intervaloPiscar, PERFIS, resolverCamada, resolverEstado, temArteEmCamadas, type Manifesto } from "../nina/animacao";
import { limitarVelocidade, VozNina } from "../voz";
import type { Armazem } from "../armazenamento";

class RelogioFalso implements Relogio {
  t = 0; fila: { id: number; em: number; f: () => void }[] = []; n = 0;
  setTimeout(f: () => void, ms: number) { const id = ++this.n; this.fila.push({ id, em: this.t + ms, f }); return id; }
  clearTimeout(id: unknown) { this.fila = this.fila.filter((x) => x.id !== id); }
  avancar(ms: number) {
    const alvo = this.t + ms;
    for (;;) {
      const prox = this.fila.filter((x) => x.em <= alvo).sort((a, b) => a.em - b.em)[0];
      if (!prox) break;
      this.t = prox.em; this.fila = this.fila.filter((x) => x !== prox); prox.f();
    }
    this.t = alvo;
  }
}
const memoria = (): Armazem => { const d = new Map<string, string>(); return { getItem: (k) => d.get(k) ?? null, setItem: (k, v) => void d.set(k, v), removeItem: (k) => void d.delete(k) }; };

const T: Tutorial = {
  id: "t", titulo: "t",
  etapas: [
    { id: "a", texto: "a", avancar: "manual" },
    { id: "b", texto: "b", esperar: { evento: "x", condicao: (p) => p?.mapa === 1, timeoutMs: 5000 }, aoConcluir: { texto: "ok b" }, avancar: "auto", autoMs: 1000 },
    { id: "c", texto: "c", avancar: "manual", pular: false },
  ],
};
const novo = (opts: ConstructorParameters<typeof MotorTutorial>[2] = {}) => {
  const bus = new Barramento(); const r = new RelogioFalso();
  return { bus, r, m: new MotorTutorial(T, bus, { relogio: r, ...opts }) };
};

test("etapa que espera ação real: não avança com 'avançar' nem com evento errado ou condição falsa", () => {
  const { bus, m } = novo(); m.iniciar(1);
  assert.equal(m.snapshot().fase, "aguardando"); assert.equal(m.snapshot().podeAvancar, false);
  m.avancar(); assert.equal(m.snapshot().indice, 1);
  bus.emitir("outro", { mapa: 1 }); assert.equal(m.snapshot().fase, "aguardando");
  bus.emitir("x", { mapa: 2 }); assert.equal(m.snapshot().fase, "aguardando");
});

test("ação certa → confirma com a reação da Nina → avança sozinha", () => {
  const { bus, r, m } = novo(); m.iniciar(1);
  bus.emitir("x", { mapa: 1 });
  assert.equal(m.snapshot().fase, "confirmando"); assert.equal(m.snapshot().texto, "ok b");
  r.avancar(1000); assert.equal(m.snapshot().indice, 2);
});

test("tempo-limite libera o plano B (continuar sem fazer a ação)", () => {
  const { r, m } = novo(); m.iniciar(1);
  r.avancar(4999); assert.equal(m.snapshot().podeAvancar, false);
  r.avancar(2); assert.equal(m.snapshot().tempoEsgotado, true); assert.equal(m.snapshot().podeAvancar, true);
  m.avancar(); assert.equal(m.snapshot().indice, 2);
});

test("voltar, repetir, pausar e pular (respeitando pular:false)", () => {
  const { bus, m } = novo(); m.iniciar(0);
  m.avancar(); assert.equal(m.snapshot().indice, 1);
  m.voltar(); assert.equal(m.snapshot().indice, 0);
  m.avancar(); m.pausar();
  bus.emitir("x", { mapa: 1 }); assert.equal(m.snapshot().fase, "aguardando"); // pausado ignora eventos
  m.retomar(); bus.emitir("x", { mapa: 1 }); assert.equal(m.snapshot().fase, "confirmando");
  m.iniciar(2); assert.equal(m.snapshot().podePular, false); m.pular(); assert.equal(m.snapshot().fase, "exibindo");
});

test("terminar chama o callback com o motivo e registra o progresso por etapa", () => {
  const fim: string[] = []; const passos: number[] = [];
  const { m } = novo({ aoTerminar: (x) => fim.push(x), aoMudarEtapa: (i) => passos.push(i) });
  m.iniciar(0); m.avancar(); m.pular(); assert.deepEqual(fim, ["pulado"]); assert.deepEqual(passos, [0, 1]);
  const b = novo({ aoTerminar: (x) => fim.push(x) }); b.m.iniciar(2); b.m.avancar(); assert.equal(fim.at(-1), "concluido");
});

test("ao encerrar, os ouvintes do barramento são removidos (sem vazamento)", () => {
  const { bus, m } = novo(); let chamadas = 0;
  m.onMudar(() => chamadas++); m.iniciar(1); m.encerrar();
  const antes = chamadas; bus.emitir("x", { mapa: 1 }); assert.equal(chamadas, antes);
});

test("o tutorial 'primeiros passos' é válido: ids únicos, alvos com data-tutorial e ação real nas etapas de clique", () => {
  const ids = PRIMEIROS_PASSOS.etapas.map((e) => e.id); assert.equal(new Set(ids).size, ids.length);
  for (const e of PRIMEIROS_PASSOS.etapas) {
    if (e.alvo?.tipo === "dom") assert.match(e.alvo.seletor, /data-tutorial=/);
    if (e.estado === "pointing") assert.ok(e.esperar, `${e.id}: apontar exige ação real`);
  }
});

test("barramento: ouvinte que falha não derruba os outros; retângulos registrados", () => {
  const b = new Barramento(); let ok = 0;
  b.ouvir("e", () => { throw new Error("x"); }); b.ouvir("e", () => ok++);
  assert.doesNotThrow(() => b.emitir("e")); assert.equal(ok, 1);
  const off = b.registrarRetangulo("r", () => ({ left: 1 } as DOMRect)); assert.equal(b.retangulo("r")?.left, 1); off(); assert.equal(b.retangulo("r"), null);
});

test("progresso: cache local, valores inválidos ignorados, retomada", () => {
  const a = memoria(); const r = repositorioLocal(a);
  assert.equal(r.ler("t"), null); assert.deepEqual(pontoDeRetomada(null), { iniciar: true, desde: 0 });
  r.gravar("t", { step: 3, status: "in_progress" }); assert.deepEqual(pontoDeRetomada(r.ler("t")), { iniciar: true, desde: 3 });
  r.gravar("t", { step: 7, status: "done" }); assert.equal(pontoDeRetomada(r.ler("t")).iniciar, false);
  a.setItem("financity_tutorial_z", "{lixo"); assert.equal(r.ler("z"), null);
});

test("animação: sem arte em camadas usa a imagem de referência (manifesto real do projeto)", () => {
  const m = manifestoJson as unknown as Manifesto;
  assert.equal(temArteEmCamadas(m), false);
  assert.ok(m.referencia.endsWith(".webp"));
});

test("animação: fallback declarado quando falta uma camada, e avisos", () => {
  const m = structuredClone(manifestoJson) as unknown as Manifesto;
  m.poses.explicando.existe = true; m.olhos.abertos.existe = true; m.bocas.fechada.existe = true;
  assert.equal(temArteEmCamadas(m), true);
  const avisos: string[] = [];
  assert.equal(resolverCamada(m, "poses", "apontando", (x) => avisos.push(x))?.nome, "explicando");
  assert.equal(resolverCamada(m, "olhos", "felizes")?.nome, "abertos");
  const c = resolverEstado(m, "pointing", { avisar: (x) => avisos.push(x) });
  assert.equal(c.pose?.nome, "explicando"); assert.equal(c.extras.length, 0); assert.ok(avisos.length > 0);
  assert.equal(resolverEstado(m, "idle", { piscando: true }).olhos?.nome, "abertos"); // sem "fechados": cai em "abertos"
  m.olhos.fechados.existe = true; assert.equal(resolverEstado(m, "idle", { piscando: true }).olhos?.nome, "fechados");
  assert.equal(resolverEstado(m, "idle", { bocaFala: "a" }).boca?.nome, "fechada"); // "a" ausente → alternativa
});

test("animação: todos os 10 estados têm perfil; piscar entre 3 e 6 s; boca alterna ao falar", () => {
  assert.equal(Object.keys(PERFIS).length, 10);
  for (let i = 0; i < 50; i++) { const v = intervaloPiscar(); assert.ok(v >= 3000 && v <= 6000); }
  assert.deepEqual([0, 1, 2, 3, 4].map(bocaDaFala), ["a", "e", "o", "m", "a"]);
});

test("voz: desligada por padrão, preferências persistem e velocidade é limitada", () => {
  const mem = memoria(); const v = new VozNina(mem);
  assert.equal(v.ativa, false);
  v.ligar(true); v.definirVelocidade(9); assert.equal(v.velocidade, 1.5);
  const outra = new VozNina(mem); assert.equal(outra.ativa, true); assert.equal(outra.velocidade, 1.5);
  assert.equal(limitarVelocidade(0.1), 0.7); assert.equal(limitarVelocidade(NaN), 1);
});
