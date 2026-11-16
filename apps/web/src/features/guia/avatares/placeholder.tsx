import type { Expressao } from "../tipos";

// Nina provisória em SVG simples: rosto, cabelo e escudo nas costas. As 4 expressões trocam só olhos, sobrancelhas e boca.
export function NinaPlaceholder({ expressao, cor, tamanho }: { expressao: Expressao; cor: string; tamanho: number }) {
  const sobrancelhas = {
    feliz: "M62 74 Q72 68 82 74 M118 74 Q128 68 138 74",
    pensando: "M62 70 Q72 72 82 66 M118 74 Q128 70 138 74",
    preocupada: "M62 68 L82 76 M138 68 L118 76",
    comemorando: "M62 70 Q72 62 82 70 M118 70 Q128 62 138 70",
  }[expressao];
  const boca = {
    feliz: "M82 120 Q100 136 118 120",
    pensando: "M88 124 L112 124",
    preocupada: "M84 128 Q100 116 116 128",
    comemorando: "M80 116 Q100 144 120 116 Z",
  }[expressao];
  const olhos = expressao === "comemorando"
    ? <><path d="M66 90 Q74 82 82 90" stroke="#243" strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M118 90 Q126 82 134 90" stroke="#243" strokeWidth="4" fill="none" strokeLinecap="round" /></>
    : <><circle cx="74" cy="90" r="6" fill="#243" /><circle cx="126" cy="90" r="6" fill="#243" /></>;
  return (
    <svg viewBox="0 0 200 220" width={tamanho} height={tamanho * 1.1} role="img" aria-label={`Nina, ${expressao}`}>
      <path d="M30 150 Q100 120 170 150 L160 200 Q100 220 40 200 Z" fill={cor} opacity=".9" />
      <path d="M100 150 L128 165 L120 195 L100 205 L80 195 L72 165 Z" fill="#fff" opacity=".85" />
      <ellipse cx="100" cy="95" rx="62" ry="64" fill="#5a3a2a" />
      <ellipse cx="100" cy="100" rx="50" ry="54" fill="#f3c9a5" />
      <path d="M50 92 Q60 44 100 44 Q140 44 150 92 Q124 70 100 70 Q76 70 50 92 Z" fill="#5a3a2a" />
      {olhos}
      <path d={sobrancelhas} stroke="#3b2418" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d={boca} stroke="#8a3b3b" strokeWidth="4" fill={expressao === "comemorando" ? "#fff" : "none"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
