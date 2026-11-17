// Preferências da voz da Nina (ligada/desligada e velocidade). A voz em si são os MP3 gravados (ver voz-servico.ts):
// o site não usa a voz do navegador nem qualquer serviço externo. Desligada por padrão.
import { armazemDoNavegador, gravar, ler, type Armazem } from "./armazenamento";

export const CHAVE_VOZ = "financity_nina_voz";
export const CHAVE_VOZ_VELOCIDADE = "financity_nina_voz_velocidade";

export const limitarVelocidade = (v: number) => (Number.isFinite(v) ? Math.min(1.5, Math.max(0.7, v)) : 1);

export class VozNina {
  private ouvintes = new Set<() => void>();
  ativa = false;
  velocidade = 1;
  constructor(private a: Armazem | null = armazemDoNavegador()) {
    this.ativa = ler(a, CHAVE_VOZ);
    try { this.velocidade = limitarVelocidade(Number(a?.getItem(CHAVE_VOZ_VELOCIDADE) ?? 1)); } catch { /* padrão */ }
  }
  onMudar(f: () => void) { this.ouvintes.add(f); return () => { this.ouvintes.delete(f); }; }
  private mudou() { for (const f of [...this.ouvintes]) f(); }
  ligar(v: boolean) { this.ativa = v; gravar(this.a, CHAVE_VOZ, v); this.mudou(); }
  definirVelocidade(v: number) { this.velocidade = limitarVelocidade(v); try { this.a?.setItem(CHAVE_VOZ_VELOCIDADE, String(this.velocidade)); } catch { /* ignora */ } this.mudou(); }
}
