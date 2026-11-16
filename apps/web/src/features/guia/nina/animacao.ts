// Controlador de animação da Nina (puro): estado → camadas, com fallback declarado quando um arquivo de arte falta.
import type { EstadoNina } from "../tutorial/tipos";

export type Entrada = { arquivo: string; existe: boolean; rosto?: { x: number; y: number; escala: number } };
export type Manifesto = {
  versao: number; base: { largura: number; altura: number }; referencia: string; pasta: string; respiracao: boolean;
  poses: Record<string, Entrada>; olhos: Record<string, Entrada>; sobrancelhas: Record<string, Entrada>; bocas: Record<string, Entrada>; extras: Record<string, Entrada>;
};
export type Grupo = "poses" | "olhos" | "sobrancelhas" | "bocas" | "extras";

type Perfil = { pose: string; olhos: string; sobr: string; boca: string; extras: string[] };
export const PERFIS: Record<EstadoNina, Perfil> = {
  idle:        { pose: "neutra",      olhos: "abertos",   sobr: "neutra",     boca: "fechada", extras: [] },
  talking:     { pose: "explicando",  olhos: "abertos",   sobr: "neutra",     boca: "a",       extras: [] },
  happy:       { pose: "neutra",      olhos: "felizes",   sobr: "alegre",     boca: "sorriso", extras: [] },
  celebrating: { pose: "comemorando", olhos: "felizes",   sobr: "alegre",     boca: "sorriso", extras: ["brilho"] },
  thinking:    { pose: "neutra",      olhos: "pensando",  sobr: "neutra",     boca: "fechada", extras: [] },
  explaining:  { pose: "explicando",  olhos: "abertos",   sobr: "alegre",     boca: "sorriso", extras: [] },
  pointing:    { pose: "apontando",   olhos: "abertos",   sobr: "alegre",     boca: "sorriso", extras: ["seta"] },
  encouraging: { pose: "explicando",  olhos: "abertos",   sobr: "alegre",     boca: "sorriso", extras: [] },
  surprised:   { pose: "neutra",      olhos: "surpresos", sobr: "surpresa",   boca: "o",       extras: [] },
  goodbye:     { pose: "tchau",       olhos: "felizes",   sobr: "alegre",     boca: "sorriso", extras: [] },
};

/** Se a camada pedida não existe, usa a mais próxima disponível (nesta ordem). */
export const FALLBACKS: Record<Grupo, Record<string, string[]>> = {
  poses: { apontando: ["explicando", "neutra"], comemorando: ["explicando", "neutra"], tchau: ["explicando", "neutra"], explicando: ["neutra"], neutra: ["explicando"] },
  olhos: { meio: ["abertos"], fechados: ["abertos"], felizes: ["abertos"], surpresos: ["abertos"], pensando: ["abertos"], abertos: [] },
  sobrancelhas: { alegre: ["neutra"], preocupada: ["neutra"], surpresa: ["neutra"], neutra: [] },
  bocas: { sorriso: ["fechada"], a: ["sorriso", "fechada"], e: ["sorriso", "fechada"], o: ["fechada"], m: ["fechada"], fechada: [] },
  extras: {},
};

export type Resolvida = { grupo: Grupo; nome: string; entrada: Entrada } | null;

export function resolverCamada(m: Manifesto, grupo: Grupo, nome: string, avisar?: (msg: string) => void): Resolvida {
  const tab = m[grupo];
  if (tab[nome]?.existe) return { grupo, nome, entrada: tab[nome] };
  for (const alt of FALLBACKS[grupo][nome] ?? []) {
    if (tab[alt]?.existe) { avisar?.(`[Nina] camada "${grupo}/${nome}" ausente; usando "${alt}".`); return { grupo, nome: alt, entrada: tab[alt] }; }
  }
  avisar?.(`[Nina] camada "${grupo}/${nome}" ausente e sem alternativa.`);
  return null;
}

export type Camadas = { pose: Resolvida; olhos: Resolvida; sobr: Resolvida; boca: Resolvida; extras: NonNullable<Resolvida>[] };
export type Opcoes = { piscando?: boolean; bocaFala?: string | null; avisar?: (m: string) => void };

export function resolverEstado(m: Manifesto, estado: EstadoNina, o: Opcoes = {}): Camadas {
  const p = PERFIS[estado];
  const olhos = o.piscando ? "fechados" : p.olhos;
  const boca = o.bocaFala ?? p.boca;
  return {
    pose: resolverCamada(m, "poses", p.pose, o.avisar),
    olhos: resolverCamada(m, "olhos", olhos, o.avisar),
    sobr: resolverCamada(m, "sobrancelhas", p.sobr, o.avisar),
    boca: resolverCamada(m, "bocas", boca, o.avisar),
    extras: p.extras.map((x) => resolverCamada(m, "extras", x, o.avisar)).filter((x): x is NonNullable<Resolvida> => x !== null),
  };
}

/** A arte em camadas só é usada quando há ao menos uma pose E uma camada de rosto; senão: imagem de referência estática. */
export function temArteEmCamadas(m: Manifesto): boolean {
  const alguma = (t: Record<string, Entrada>) => Object.values(t).some((e) => e.existe);
  return alguma(m.poses) && (alguma(m.olhos) || alguma(m.bocas));
}

export const intervaloPiscar = (rnd: () => number = Math.random) => Math.round(3000 + rnd() * 3000);
export const BOCAS_FALA = ["a", "e", "o", "m"] as const;
/** Alternância aproximada da boca enquanto fala (não é sincronia labial). */
export const bocaDaFala = (tick: number): string => BOCAS_FALA[Math.abs(tick) % BOCAS_FALA.length];
