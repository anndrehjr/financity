// Flags no navegador (tutorial visto, Nina escondida). Tolera armazenamento indisponível.
export type Armazem = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function ler(a: Armazem | null | undefined, chave: string): boolean {
  try { return a?.getItem(chave) === "1"; } catch { return false; }
}
export function gravar(a: Armazem | null | undefined, chave: string, valor: boolean): void {
  try { if (valor) a?.setItem(chave, "1"); else a?.removeItem(chave); } catch { /* ignora */ }
}
export function armazemDoNavegador(): Armazem | null {
  try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; }
}
