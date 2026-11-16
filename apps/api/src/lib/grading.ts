// Correção das respostas (funções puras, sem banco). Todo arredondamento é "meio para cima" (Math.round) em números inteiros.
export type Kind = "choice" | "multi" | "order";
export type OptG = { id: number; points: number; is_correct: boolean; seq: number | null };
export type Resp = { optionId?: number; optionIds?: number[]; order?: number[] };
export class RespostaInvalida extends Error {}

/** Pontos por relações de precedência corretas entre etapas vizinhas: 3 de 3 = 100%, 2 = 65%, 1 = 30%, 0 = 0%. */
export const ORDER_PCT = [0, 30, 65, 100];

export function grade(kind: Kind, max: number, opts: OptG[], r: Resp): { points: number; rep: number; response: unknown } {
  const ids = new Set(opts.map((o) => o.id));
  if (kind === "choice") {
    const o = opts.find((x) => x.id === r.optionId);
    if (!o) throw new RespostaInvalida("Alternativa inválida.");
    return { points: Math.min(max, o.points), rep: o.id, response: { optionId: o.id } };
  }
  if (kind === "multi") {
    const sel = [...new Set(r.optionIds ?? [])];
    if (!sel.length || sel.some((i) => !ids.has(i))) throw new RespostaInvalida("Selecione ao menos uma alternativa válida.");
    const C = opts.filter((o) => o.is_correct).length, W = opts.length - C;
    const c = sel.filter((i) => opts.find((o) => o.id === i)!.is_correct).length, w = sel.length - c;
    // max(0, acertos/corretas − erros/incorretas) × pontos, em inteiros. Marcar tudo = 0; conjunto exato = 100%.
    const num = c * W - w * C;
    const points = num <= 0 || C === 0 || W === 0 ? (w === 0 && c === C ? max : 0) : Math.min(max, Math.round((max * num) / (C * W)));
    return { points, rep: Math.min(...sel), response: { optionIds: sel.sort((a, b) => a - b) } };
  }
  const ord = r.order ?? [];
  if (ord.length !== opts.length || new Set(ord).size !== ord.length || ord.some((i) => !ids.has(i))) throw new RespostaInvalida("Ordem inválida.");
  const pos = new Map(ord.map((id, i) => [id, i]));
  const bySeq = [...opts].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  let ok = 0;
  for (let i = 0; i + 1 < bySeq.length; i++) if (pos.get(bySeq[i].id)! < pos.get(bySeq[i + 1].id)!) ok++;
  return { points: Math.min(max, Math.round((max * ORDER_PCT[ok]) / 100)), rep: ord[0], response: { order: ord } };
}

/** Classificação por domínio (percentual). Não substitui o perfil por habilidades. */
export function dominio(pct: number): { key: string; label: string } {
  if (pct >= 80) return { key: "consolidado", label: "Consolidado" };
  if (pct >= 60) return { key: "adequado", label: "Adequado" };
  if (pct >= 40) return { key: "em_desenvolvimento", label: "Em desenvolvimento" };
  return { key: "inicial", label: "Em desenvolvimento inicial" };
}
