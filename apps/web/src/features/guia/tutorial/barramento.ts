// Barramento de eventos do jogo → tutorial. As telas emitem eventos nomeados; o motor de tutorial escuta.
// Também é a "ponte" para qualquer camada gráfica (ex.: cenas Phaser): basta emitir os mesmos eventos e registrar retângulos.
export type Ouvinte = (payload?: any) => void;

export class Barramento {
  private ouvintes = new Map<string, Set<Ouvinte>>();
  private retangulos = new Map<string, () => DOMRect | null>();

  emitir(evento: string, payload?: unknown): void {
    for (const f of [...(this.ouvintes.get(evento) ?? [])]) { try { f(payload); } catch { /* um ouvinte nunca derruba o jogo */ } }
    for (const f of [...(this.ouvintes.get("*") ?? [])]) { try { f({ evento, payload }); } catch { /* idem */ } }
  }
  ouvir(evento: string, f: Ouvinte): () => void {
    if (!this.ouvintes.has(evento)) this.ouvintes.set(evento, new Set());
    this.ouvintes.get(evento)!.add(f);
    return () => { this.ouvintes.get(evento)?.delete(f); };
  }
  /** Registra um objeto destacável que não está no DOM (coordenadas de tela). Devolve a função de remoção. */
  registrarRetangulo(id: string, obter: () => DOMRect | null): () => void {
    this.retangulos.set(id, obter);
    return () => { this.retangulos.delete(id); };
  }
  retangulo(id: string): DOMRect | null { try { return this.retangulos.get(id)?.() ?? null; } catch { return null; } }
}

export const barramento = new Barramento();
/** Atalho para as telas: não faz nada se ninguém estiver ouvindo. */
export const emitir = (evento: string, payload?: unknown) => barramento.emitir(evento, payload);
