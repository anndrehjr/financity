import assert from "node:assert/strict";
import { test } from "node:test";
import type { Armazem } from "../armazenamento";
import { VozNina } from "../voz";
import { NinaVoiceService, type Deps, type ManifestoVoz } from "../voz-servico";

const memoria = (): Armazem => { const d = new Map<string, string>(); return { getItem: (k) => d.get(k) ?? null, setItem: (k, v) => void d.set(k, v), removeItem: (k) => void d.delete(k) }; };
const MANIFESTO: ManifestoVoz = { versao: 1, falas: {
  "acerto.1": { audio: "acerto.1.aaaa1111.mp3", duracaoMs: 1500, emocao: "comemoracao", boca: "acerto.1.aaaa1111.boca.json" },
  "acerto.2": { audio: "acerto.2.bbbb2222.mp3", duracaoMs: 1200 },
} };

class AudioFalso {
  src = ""; volume = 1; playbackRate = 1; currentTime = 0; preload = ""; paused = true; tocou = 0; pausou = 0;
  constructor(private rejeitar = false) {}
  private ouvintes = new Map<string, Set<() => void>>();
  play() { this.tocou++; if (this.rejeitar) return Promise.reject(new Error("NotAllowedError")); this.paused = false; return Promise.resolve(); }
  pause() { this.pausou++; this.paused = true; }
  addEventListener(t: string, f: () => void) { if (!this.ouvintes.has(t)) this.ouvintes.set(t, new Set()); this.ouvintes.get(t)!.add(f); }
  removeEventListener(t: string, f: () => void) { this.ouvintes.get(t)?.delete(f); }
  disparar(t: string) { for (const f of [...(this.ouvintes.get(t) ?? [])]) f(); }
}
function montar(over: Partial<Deps> & { ativo?: boolean; manifesto?: ManifestoVoz | null; rejeitar?: boolean; boca?: unknown } = {}) {
  const mem = memoria(); const voz = new VozNina(mem, null); if (over.ativo !== false) voz.ligar(true);
  const audios: AudioFalso[] = []; const tarefas: { f: () => void; ms: number; id: number }[] = []; let n = 0; const urls: string[] = [];
  const s = new NinaVoiceService(voz, {
    armazem: mem, interagiu: over.interagiu ?? (() => true),
    fetchFn: async (u: string) => {
      urls.push(u);
      if (u.endsWith("manifest.json")) return over.manifesto === null ? { ok: false, json: async () => null } : { ok: true, json: async () => over.manifesto ?? MANIFESTO };
      return { ok: true, json: async () => over.boca ?? [{ t: 0, forma: "a" }, { t: 100, forma: "m" }] };
    },
    criarAudio: () => { const a = new AudioFalso(over.rejeitar); audios.push(a); return a; },
    agendar: (f, ms) => { const id = ++n; tarefas.push({ f, ms, id }); return id; },
    cancelar: (id) => { const i = tarefas.findIndex((t) => t.id === id); if (i >= 0) tarefas.splice(i, 1); },
  });
  return { s, voz, audios, tarefas, urls, mem };
}

test("voz desligada por padrão: não toca nada e devolve só legenda", async () => {
  const { s, audios } = montar({ ativo: false });
  assert.equal(s.ativo, false);
  assert.equal(await s.tocar("acerto.1", "Mandou bem!"), "legenda");
  assert.equal(audios.length, 0);
});

test("com manifesto e fala: toca o MP3 pré-gerado, com volume, e emite início e formas de boca", async () => {
  const { s, audios, tarefas } = montar();
  const ev: string[] = []; s.on("inicio", () => ev.push("inicio")); s.on("boca", (f) => ev.push("boca:" + f));
  s.setVolume(0.4);
  assert.equal(await s.tocar("acerto.1", "Mandou bem!"), "audio");
  assert.equal(audios[0].src, "/guia/nina/audio/acerto.1.aaaa1111.mp3"); assert.equal(audios[0].volume, 0.4); assert.equal(audios[0].tocou, 1);
  assert.equal(s.falando, true); assert.equal(ev[0], "inicio");
  for (const t of [...tarefas]) t.f();
  assert.deepEqual(ev.filter((x) => x.startsWith("boca")), ["boca:a", "boca:m"]);
  audios[0].disparar("ended"); assert.equal(s.falando, false);
});

test("sem arquivo de boca: alterna as bocas pela fala (aproximação)", async () => {
  const { s, tarefas } = montar();
  const bocas: string[] = []; s.on("boca", (f) => bocas.push(f));
  await s.tocar("acerto.2", "Isso aí!");
  assert.ok(bocas.length >= 1); assert.ok(tarefas.some((t) => t.ms === 140));
});

test("manifesto ausente ou fala fora do manifesto: plano B, sem erro (só legenda, sem Web Speech)", async () => {
  const a = montar({ manifesto: null }); assert.equal(await a.s.tocar("acerto.1", "texto"), "legenda"); assert.equal(a.audios.length, 0);
  const b = montar(); assert.equal(await b.s.tocar("nao.existe.9", "texto"), "legenda");
  assert.equal(b.s.falando, true); b.tarefas.at(-1)!.f(); assert.equal(b.s.falando, false); // fim pela duração estimada
});

test("erro ao tocar (ex.: sem interação): emite 'erro' e cai no plano B, sem lançar", async () => {
  const { s, audios } = montar({ rejeitar: true }); let erros = 0; s.on("erro", () => erros++);
  assert.equal(await s.tocar("acerto.1", "texto"), "legenda");
  assert.equal(erros, 1); assert.equal(audios[0].tocou, 1);
});

test("não toca antes da interação do usuário (só legenda, sem tentar o áudio)", async () => {
  const { s, audios } = montar({ interagiu: () => false });
  assert.equal(await s.tocar("acerto.1", "texto"), "legenda"); assert.equal(audios.length, 0);
});

test("parar interrompe o áudio e emite 'fim'; trocar de fala interrompe a anterior", async () => {
  const { s, audios } = montar(); let fins = 0; s.on("fim", () => fins++);
  await s.tocar("acerto.1", "a"); await s.tocar("acerto.2", "b");
  assert.equal(audios[0].pausou >= 1, true); assert.equal(s.falando, true);
  s.parar(); assert.equal(s.falando, false); assert.ok(fins >= 1); assert.equal(audios[1].paused, true);
});

test("pré-carrega a próxima fala só com voz ligada; repetir toca de novo", async () => {
  const { s, audios } = montar(); await s.preCarregar("acerto.2");
  assert.equal(audios[0].preload, "auto"); assert.match(audios[0].src, /acerto\.2\.bbbb2222\.mp3$/);
  await s.tocar("acerto.2", "b"); assert.equal(audios.length, 1); // reaproveitou o pré-carregado
  s.parar(); s.repetir(); await new Promise((r) => setImmediate(r)); assert.ok(audios.length >= 2);
  const off = montar({ ativo: false }); await off.s.preCarregar("acerto.1"); assert.equal(off.audios.length, 0);
});

test("volume: limitado de 0 a 1 e salvo nas preferências; desligar a voz interrompe", async () => {
  const { s, mem } = montar();
  s.setVolume(7); assert.equal(s.volume, 1); s.setVolume(-3); assert.equal(s.volume, 0); s.setVolume(0.5);
  assert.equal(mem.getItem("financity_nina_voz_volume"), "0.5");
  await s.tocar("acerto.1", "a"); s.setAtivo(false); assert.equal(s.falando, false); assert.equal(s.ativo, false);
});
