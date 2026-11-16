// Funções puras do pipeline de voz da Nina (sem rede, sem disco): coleta de falas, pronúncia, hash e forma da boca.
import crypto from "node:crypto";

export type Emocao = "alegria" | "curiosidade" | "explicacao" | "incentivo" | "comemoracao";
export type FalaVoz = { id: string; texto: string; emocao: Emocao };

type FalasJson = { momentos: Record<string, { falas: { expressao: string; texto: string }[] }> };
type TutorialLike = { id: string; etapas: { id: string; texto: string; expressao?: string; estado?: string; aoConcluir?: { texto: string; expressao?: string } }[] };

const EMOCAO_DA_EXPRESSAO: Record<string, Emocao> = { feliz: "alegria", pensando: "curiosidade", preocupada: "incentivo", comemorando: "comemoracao" };
export const emocaoDe = (expressao?: string, estado?: string): Emocao =>
  estado === "explaining" || estado === "pointing" ? "explicacao" : EMOCAO_DA_EXPRESSAO[expressao ?? "feliz"] ?? "alegria";

/** IDs estáveis: "<momento>.<n>" para as falas do JSON, "tutorial.<id>.<etapa>" e ".ok" para os tutoriais. */
export function coletarFalas(falas: FalasJson, tutoriais: Record<string, TutorialLike>): FalaVoz[] {
  const out: FalaVoz[] = [];
  for (const [momento, m] of Object.entries(falas.momentos))
    m.falas.forEach((f, i) => out.push({ id: `${momento}.${i + 1}`, texto: f.texto, emocao: emocaoDe(f.expressao) }));
  for (const t of Object.values(tutoriais))
    for (const e of t.etapas) {
      out.push({ id: `tutorial.${t.id}.${e.id}`, texto: e.texto, emocao: emocaoDe(e.expressao, e.estado) });
      if (e.aoConcluir) out.push({ id: `tutorial.${t.id}.${e.id}.ok`, texto: e.aoConcluir.texto, emocao: emocaoDe(e.aoConcluir.expressao) });
    }
  const ids = out.map((f) => f.id);
  if (new Set(ids).size !== ids.length) throw new Error("IDs de fala duplicados.");
  return out;
}

export const semNegrito = (t: string) => t.replace(/\*\*/g, "");

// ---- pronúncia (só no texto enviado ao motor; a legenda não muda) ----
const U = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const D = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const C = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
export function porExtenso(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999999) return String(n);
  if (n < 20) return U[n];
  if (n < 100) return D[Math.floor(n / 10)] + (n % 10 ? " e " + U[n % 10] : "");
  if (n === 100) return "cem";
  if (n < 1000) return C[Math.floor(n / 100)] + (n % 100 ? " e " + porExtenso(n % 100) : "");
  const m = Math.floor(n / 1000), r = n % 1000;
  const milhar = m === 1 ? "mil" : porExtenso(m) + " mil";
  return milhar + (r ? (r < 100 || r % 100 === 0 ? " e " : " ") + porExtenso(r) : "");
}
export type Pronuncia = { substituicoes: { de: string; para: string }[] };
export function aplicarPronuncia(texto: string, p: Pronuncia): string {
  let t = semNegrito(texto);
  // R$ 2.500,00 → "dois mil e quinhentos reais"
  t = t.replace(/R\$\s?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{2}))?/g, (_m, i: string, c?: string) => {
    const reais = Number(i.replace(/\./g, "")); const cent = c ? Number(c) : 0;
    return `${porExtenso(reais)} ${reais === 1 ? "real" : "reais"}` + (cent ? ` e ${porExtenso(cent)} ${cent === 1 ? "centavo" : "centavos"}` : "");
  });
  t = t.replace(/(\d+)\s?%/g, (_m, n: string) => `${porExtenso(Number(n))} por cento`).replace(/%/g, " por cento");
  for (const s of p.substituicoes) t = t.split(s.de).join(s.para);
  return t.replace(/\s+/g, " ").trim();
}

export const hashFala = (texto: string, motor: string, voz: string, emocao: string, versaoMotor: string) =>
  crypto.createHash("sha256").update([texto, motor, voz, emocao, versaoMotor].join("\u0001")).digest("hex").slice(0, 8);

/** Formas do Rhubarb (A–H, X) → camadas de boca da Nina. */
export const BOCA_DO_RHUBARB: Record<string, string> = { A: "m", B: "e", C: "e", D: "a", E: "o", F: "o", G: "e", H: "a", X: "fechada" };
export function bocasDoRhubarb(json: { mouthCues: { start: number; end: number; value: string }[] }): { t: number; forma: string }[] {
  return json.mouthCues.map((c) => ({ t: Math.round(c.start * 1000), forma: BOCA_DO_RHUBARB[c.value] ?? "fechada" }));
}
/** Duração aproximada de um MP3 de taxa constante (kbps). Sem ffprobe. */
export const duracaoMp3Ms = (bytes: number, kbps: number) => Math.round((bytes * 8) / kbps);
