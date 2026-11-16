// NinaVoiceService: toca os áudios pré-gerados das falas (arquivos estáticos). Independente de React e do Phaser.
// Plano B sempre ativo: sem manifesto, sem arquivo da fala ou erro ao tocar → SÓ LEGENDA (com a animação de fala pela duração estimada).
// O site nunca chama a ElevenLabs e nunca usa outra voz (nem a do navegador) como substituta.
// Só toca depois de uma interação do usuário. Voz desligada por padrão.
import { armazemDoNavegador, type Armazem } from "./armazenamento";
import { bocaDaFala } from "./nina/animacao";
import type { VozNina } from "./voz";

export type EntradaVoz = { audio: string; duracaoMs: number; emocao?: string; boca?: string };
export type ManifestoVoz = { versao: number; motor?: string; voz?: string; falas: Record<string, EntradaVoz> };
export type Cue = { t: number; forma: string };
export type EventoVoz = "inicio" | "boca" | "fim" | "erro";
export type Via = "audio" | "legenda";

export const CHAVE_VOLUME = "financity_nina_voz_volume";
const BASE = "/guia/nina/audio/";
const limitar = (v: number, a: number, b: number) => (Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : b);

type AudioLike = {
  src: string; volume: number; playbackRate: number; currentTime: number; preload: string; paused: boolean;
  play(): Promise<void>; pause(): void; load?(): void;
  addEventListener(t: string, f: () => void): void; removeEventListener(t: string, f: () => void): void;
};
export type Deps = {
  armazem?: Armazem | null;
  fetchFn?: (url: string) => Promise<{ ok: boolean; json(): Promise<any> }>;
  criarAudio?: () => AudioLike;
  agendar?: (f: () => void, ms: number) => unknown; cancelar?: (id: unknown) => void;
  interagiu?: () => boolean;
};

export class NinaVoiceService {
  private manifesto: Promise<ManifestoVoz | null> | null = null;
  private ouvintes = new Map<EventoVoz, Set<(p?: any) => void>>();
  private mudancas = new Set<() => void>();
  private audio: AudioLike | null = null;
  private timers: unknown[] = [];
  private ultimo: { id: string; texto: string } | null = null;
  private pausadoPelaAba = false;
  private pre = new Map<string, AudioLike>();
  falando = false;
  volume = 1;
  via: Via | null = null;

  constructor(private voz: VozNina, private d: Deps = {}) {
    const a = d.armazem === undefined ? armazemDoNavegador() : d.armazem;
    try { this.volume = limitar(Number(a?.getItem(CHAVE_VOLUME) ?? 1), 0, 1); } catch { /* padrão */ }
    this.a = a;
    if (typeof document !== "undefined" && !d.criarAudio) document.addEventListener("visibilitychange", this.aba);
  }
  private a: Armazem | null;

  // ---- preferências (a flag "ativo" é a mesma da voz do navegador: um único botão para o aluno) ----
  get ativo() { return this.voz.ativa; }
  setAtivo(v: boolean) { this.voz.ligar(v); if (!v) this.parar(); this.avisar(); }
  setVolume(v: number) { this.volume = limitar(v, 0, 1); try { this.a?.setItem(CHAVE_VOLUME, String(this.volume)); } catch { /* ignora */ } if (this.audio) this.audio.volume = this.volume; this.avisar(); }

  on(e: EventoVoz, f: (p?: any) => void) { if (!this.ouvintes.has(e)) this.ouvintes.set(e, new Set()); this.ouvintes.get(e)!.add(f); return () => { this.ouvintes.get(e)?.delete(f); }; }
  onMudar(f: () => void) { this.mudancas.add(f); return () => { this.mudancas.delete(f); }; }
  private emitir(e: EventoVoz, p?: unknown) { for (const f of [...(this.ouvintes.get(e) ?? [])]) { try { f(p); } catch { /* ouvinte nunca derruba a fala */ } } }
  private avisar() { for (const f of [...this.mudancas]) f(); }

  carregarManifesto(): Promise<ManifestoVoz | null> {
    this.manifesto ??= (this.d.fetchFn ?? ((u: string) => fetch(u)))(BASE + "manifest.json")
      .then((r) => (r.ok ? (r.json() as Promise<ManifestoVoz>) : null)).catch(() => null);
    return this.manifesto;
  }

  private get agendar() { return this.d.agendar ?? ((f: () => void, ms: number) => setTimeout(f, ms)); }
  private get cancelarT() { return this.d.cancelar ?? ((id: unknown) => clearTimeout(id as ReturnType<typeof setTimeout>)); }
  private novoAudio(): AudioLike | null { try { return this.d.criarAudio ? this.d.criarAudio() : typeof Audio !== "undefined" ? (new Audio() as unknown as AudioLike) : null; } catch { return null; } }
  private interagiu() { return this.d.interagiu ? this.d.interagiu() : typeof navigator === "undefined" || (navigator as any).userActivation?.hasBeenActive !== false; }

  /** Pré-carrega o áudio da próxima fala (ex.: próxima etapa do tutorial). Silencioso se não houver. */
  async preCarregar(id: string): Promise<void> {
    if (!this.ativo || this.pre.has(id)) return;
    const m = await this.carregarManifesto(); const e = m?.falas[id]; if (!e) return;
    const a = this.novoAudio(); if (!a) return;
    a.preload = "auto"; a.src = BASE + e.audio; try { a.load?.(); } catch { /* ignora */ }
    this.pre.set(id, a);
  }

  /** Toca a fala `id`. `texto` é a legenda (usada no plano B). Nunca lança erro; devolve a via usada. */
  async tocar(id: string, texto: string): Promise<Via> {
    this.parar(); this.ultimo = { id, texto };
    if (!this.ativo) return "legenda";
    if (!this.interagiu()) return "legenda"; // o navegador só deixa tocar depois de um clique/tecla
    const m = await this.carregarManifesto();
    const e = m?.falas[id];
    if (e) {
      const a = this.pre.get(id) ?? this.novoAudio(); this.pre.delete(id);
      if (a) {
        try { return await this.tocarArquivo(a, id, e, texto); } catch { this.emitir("erro", { id }); this.limpar(); }
      }
    }
    return this.planoB(texto);
  }

  private async tocarArquivo(a: AudioLike, id: string, e: EntradaVoz, texto: string): Promise<Via> {
    this.audio = a; a.src = BASE + e.audio; a.volume = this.volume; a.playbackRate = this.voz.velocidade || 1;
    const cues = e.boca ? await this.carregarBoca(e.boca) : null;
    const fim = () => { a.removeEventListener("ended", fim); this.terminou(); };
    a.addEventListener("ended", fim);
    await a.play(); // pode rejeitar (sem interação): cai no plano B pelo chamador
    this.falando = true; this.via = "audio"; this.emitir("inicio", { id, via: "audio" }); this.avisar();
    if (cues?.length) cues.forEach((c) => this.timers.push(this.agendar(() => this.emitir("boca", c.forma), c.t / (a.playbackRate || 1))));
    else this.alternarBoca(e.duracaoMs);
    return "audio";
  }
  private async carregarBoca(arq: string): Promise<Cue[] | null> {
    try { const r = await (this.d.fetchFn ?? ((u: string) => fetch(u)))(BASE + arq); return r.ok ? ((await r.json()) as Cue[]) : null; } catch { return null; }
  }
  private alternarBoca(ms: number) {
    let tick = 0;
    const passo = () => { if (!this.falando) return; this.emitir("boca", bocaDaFala(tick++)); this.timers.push(this.agendar(passo, 140)); };
    passo(); void ms;
  }

  private planoB(texto: string): Via {
    // só legenda: a "fala" dura o tempo estimado do texto
    this.falando = true; this.via = "legenda"; this.emitir("inicio", { via: "legenda" }); this.avisar();
    this.timers.push(this.agendar(() => this.terminou(), Math.max(1200, texto.length * 55)));
    return "legenda";
  }

  private terminou() { if (!this.falando) return; this.limpar(); this.emitir("fim"); this.avisar(); }
  private limpar() { for (const t of this.timers) this.cancelarT(t); this.timers = []; this.falando = false; this.via = null; }

  /** Interrompe a fala (troca de etapa/tela, pular, esconder a Nina). */
  parar(): void {
    const tinha = this.falando;
    try { this.audio?.pause(); if (this.audio) this.audio.currentTime = 0; } catch { /* ignora */ }
    this.audio = null; this.limpar();
    if (tinha) { this.emitir("fim"); this.avisar(); }
  }
  repetir(): void { if (this.ultimo) void this.tocar(this.ultimo.id, this.ultimo.texto); }

  private aba = () => {
    if (typeof document === "undefined") return;
    if (document.hidden && this.audio && !this.audio.paused) { this.audio.pause(); this.pausadoPelaAba = true; }
    else if (!document.hidden && this.pausadoPelaAba) { this.pausadoPelaAba = false; void this.audio?.play().catch(() => this.parar()); }
  };
  destruir() { this.parar(); if (typeof document !== "undefined") document.removeEventListener("visibilitychange", this.aba); }
}
