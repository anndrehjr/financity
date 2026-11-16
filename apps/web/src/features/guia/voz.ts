// Voz da Nina (Web Speech API, gratuita). Desligada por padrão; a legenda é sempre visível, com ou sem voz.
import { armazemDoNavegador, gravar, ler, type Armazem } from "./armazenamento";

export const CHAVE_VOZ = "financity_nina_voz";
export const CHAVE_VOZ_NOME = "financity_nina_voz_nome";
export const CHAVE_VOZ_VELOCIDADE = "financity_nina_voz_velocidade";

export const limitarVelocidade = (v: number) => (Number.isFinite(v) ? Math.min(1.5, Math.max(0.7, v)) : 1);
/** Prefere vozes pt-BR, depois qualquer pt; devolve a escolhida pelo nome salvo, se ainda existir. */
export function escolherVoz<T extends { lang: string; name: string }>(vozes: T[], nomeSalvo?: string | null): T | null {
  return vozes.find((v) => v.name === nomeSalvo) ?? vozes.find((v) => /^pt[-_]BR/i.test(v.lang)) ?? vozes.find((v) => /^pt/i.test(v.lang)) ?? null;
}

export class VozNina {
  private ouvintes = new Set<() => void>();
  ativa = false;
  velocidade = 1;
  nome: string | null = null;
  falando = false;
  constructor(private a: Armazem | null = armazemDoNavegador(), private sintese: SpeechSynthesis | null = typeof window !== "undefined" ? window.speechSynthesis ?? null : null) {
    this.ativa = ler(a, CHAVE_VOZ);
    try { this.velocidade = limitarVelocidade(Number(a?.getItem(CHAVE_VOZ_VELOCIDADE) ?? 1)); this.nome = a?.getItem(CHAVE_VOZ_NOME) ?? null; } catch { /* padrão */ }
  }
  get suportado() { return !!this.sintese && typeof SpeechSynthesisUtterance !== "undefined"; }
  vozes(): SpeechSynthesisVoice[] { try { return this.sintese?.getVoices().filter((v) => /^pt/i.test(v.lang)) ?? []; } catch { return []; } }
  onMudar(f: () => void) { this.ouvintes.add(f); return () => { this.ouvintes.delete(f); }; }
  private mudou() { for (const f of [...this.ouvintes]) f(); }

  ligar(v: boolean) { this.ativa = v; gravar(this.a, CHAVE_VOZ, v); if (!v) this.cancelar(); this.mudou(); }
  definirVelocidade(v: number) { this.velocidade = limitarVelocidade(v); try { this.a?.setItem(CHAVE_VOZ_VELOCIDADE, String(this.velocidade)); } catch { /* ignora */ } this.mudou(); }
  definirVoz(nome: string | null) { this.nome = nome; try { if (nome) this.a?.setItem(CHAVE_VOZ_NOME, nome); else this.a?.removeItem(CHAVE_VOZ_NOME); } catch { /* ignora */ } this.mudou(); }

  /** Fala o texto (sem os ** do negrito). Sem suporte, ou desligada, não faz nada e não dá erro. */
  falar(texto: string): void {
    this.cancelar();
    if (!this.ativa || !this.suportado) return;
    try {
      const u = new SpeechSynthesisUtterance(texto.replace(/\*\*/g, ""));
      const v = escolherVoz(this.vozes(), this.nome);
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "pt-BR";
      u.rate = this.velocidade;
      u.onstart = () => { this.falando = true; this.mudou(); };
      u.onend = u.onerror = () => { this.falando = false; this.mudou(); };
      this.sintese!.speak(u);
    } catch { /* o navegador pode recusar sem interação do usuário: a legenda continua */ }
  }
  cancelar(): void {
    try { this.sintese?.cancel(); } catch { /* ignora */ }
    if (this.falando) { this.falando = false; this.mudou(); }
  }
}
