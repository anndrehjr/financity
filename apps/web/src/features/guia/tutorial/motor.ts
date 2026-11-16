// Motor de tutorial: etapas declarativas, espera por ação real, condição, tempo-limite, voltar/pular/repetir/pausar.
// Funções puras + relógio injetável (testável sem navegador).
import type { Barramento } from "./barramento";
import type { Etapa, Fase, Snapshot, Tutorial } from "./tipos";

export type Relogio = { setTimeout: (f: () => void, ms: number) => unknown; clearTimeout: (id: unknown) => void };
const relogioReal: Relogio = { setTimeout: (f, ms) => setTimeout(f, ms), clearTimeout: (id) => clearTimeout(id as ReturnType<typeof setTimeout>) };

export class MotorTutorial {
  private i = 0;
  private fase: Fase = "exibindo";
  private esgotado = false;
  private pausado = false;
  private concluido = false;
  private confirmado: Etapa["aoConcluir"] | null = null;
  private timer: unknown = null;
  private desligar: (() => void) | null = null;
  private ouvintes = new Set<(s: Snapshot) => void>();

  constructor(
    readonly tutorial: Tutorial,
    private bus: Barramento,
    private opts: { relogio?: Relogio; aoTerminar?: (motivo: "concluido" | "pulado") => void; aoMudarEtapa?: (indice: number) => void } = {},
  ) {}

  private get r() { return this.opts.relogio ?? relogioReal; }
  private get etapa(): Etapa | null { return this.tutorial.etapas[this.i] ?? null; }

  onMudar(f: (s: Snapshot) => void): () => void { this.ouvintes.add(f); return () => { this.ouvintes.delete(f); }; }
  snapshot(): Snapshot {
    const e = this.etapa;
    const ativo = this.fase !== "fim" && e !== null;
    const reacao = this.fase === "confirmando" ? this.confirmado : null;
    return {
      tutorialId: this.tutorial.id, indice: this.i, total: this.tutorial.etapas.length, etapa: e, fase: this.fase,
      texto: reacao?.texto ?? e?.texto ?? "", expressao: reacao?.expressao ?? e?.expressao ?? "feliz",
      estado: reacao?.estado ?? e?.estado ?? "explaining", alvo: this.fase === "confirmando" ? { tipo: "nenhum" } : e?.alvo ?? { tipo: "nenhum" },
      // Nunca avança enquanto uma ação obrigatória não aconteceu (a menos que o tempo-limite libere o plano B).
      podeAvancar: ativo && !this.pausado && (this.fase !== "aguardando" || this.esgotado),
      podeVoltar: ativo && this.i > 0, podePular: ativo && e!.pular !== false, tempoEsgotado: this.esgotado, pausado: this.pausado, concluido: this.concluido,
    };
  }
  private notificar() { const s = this.snapshot(); for (const f of [...this.ouvintes]) f(s); }

  iniciar(desde = 0): void {
    this.limpar();
    this.concluido = false; this.pausado = false;
    this.ir(Math.max(0, Math.min(desde, this.tutorial.etapas.length - 1)));
  }

  private limpar() { this.desligar?.(); this.desligar = null; if (this.timer !== null) this.r.clearTimeout(this.timer); this.timer = null; }

  private ir(i: number): void {
    this.limpar();
    if (i >= this.tutorial.etapas.length) { this.terminar("concluido"); return; }
    this.i = i; this.esgotado = false; this.confirmado = null;
    const e = this.tutorial.etapas[i];
    this.opts.aoMudarEtapa?.(i);
    if (e.esperar) {
      this.fase = "aguardando";
      this.desligar = this.bus.ouvir(e.esperar.evento, (p) => this.aoEvento(p));
      if (e.esperar.timeoutMs) this.timer = this.r.setTimeout(() => { this.esgotado = true; this.notificar(); }, e.esperar.timeoutMs);
    } else {
      this.fase = "exibindo";
      this.agendarAuto(e);
    }
    this.notificar();
  }

  private agendarAuto(e: Etapa) {
    if (e.avancar === "auto" && !e.esperar) this.timer = this.r.setTimeout(() => this.avancar(), e.autoMs ?? 4000);
  }

  private aoEvento(payload: unknown) {
    const e = this.etapa;
    if (this.pausado || !e?.esperar || this.fase !== "aguardando") return;
    let ok = true;
    try { ok = e.esperar.condicao ? !!e.esperar.condicao(payload) : true; } catch { ok = false; }
    if (!ok) return;
    this.limpar();
    if (e.aoConcluir) {
      this.fase = "confirmando"; this.confirmado = e.aoConcluir;
      this.notificar();
      if (e.avancar !== "manual") this.timer = this.r.setTimeout(() => this.avancar(), e.autoMs ?? 2500);
    } else if (e.avancar === "manual") { this.fase = "exibindo"; this.notificar(); }
    else this.ir(this.i + 1);
  }

  avancar(): void {
    if (this.fase === "fim" || this.pausado) return;
    if (this.fase === "aguardando" && !this.esgotado) return; // ação obrigatória ainda não aconteceu
    this.ir(this.i + 1);
  }
  voltar(): void { if (this.fase !== "fim" && this.i > 0) this.ir(this.i - 1); }
  repetir(): void { if (this.fase !== "fim") this.ir(this.i); }
  pausar(): void { if (this.fase === "fim") return; this.pausado = true; this.notificar(); }
  retomar(): void { if (this.fase === "fim") return; this.pausado = false; this.notificar(); }
  pular(): void { const e = this.etapa; if (this.fase !== "fim" && e && e.pular !== false) this.terminar("pulado"); }
  encerrar(): void { this.limpar(); this.fase = "fim"; this.notificar(); }

  private terminar(motivo: "concluido" | "pulado") {
    this.limpar(); this.fase = "fim"; this.concluido = motivo === "concluido";
    this.notificar(); this.opts.aoTerminar?.(motivo);
  }
}
