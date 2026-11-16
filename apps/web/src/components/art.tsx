import type { ReactNode } from "react";

/** Ilustrações vetoriais próprias do Financity (sem marcas comerciais). */

const C = { sky1: "#bae6fd", sky2: "#e0f2fe", ground: "#94a3b8", road: "#475569", sun: "#fbbf24", coral: "#fb7185", mint: "#34d399", grape: "#8b5cf6", navy: "#1e3a8a", white: "#ffffff", ink: "#1e1b4b", skin: "#f2b98d" };

function Frame({ children, id, from = C.sky1, to = C.sky2, ...rest }: { children: ReactNode; id: string; from?: string; to?: string; viewBox?: string; className?: string; label: string }) {
  return (
    <svg viewBox={rest.viewBox ?? "0 0 800 450"} role="img" aria-label={rest.label} className={rest.className ?? "h-full w-full"} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={from} /><stop offset="1" stopColor={to} /></linearGradient>
      </defs>
      <rect width="800" height="450" fill={`url(#sky-${id})`} />
      {children}
    </svg>
  );
}
const Cloud = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity=".9"><ellipse cx="0" cy="0" rx="40" ry="16" /><ellipse cx="-22" cy="-8" rx="22" ry="14" /><ellipse cx="14" cy="-12" rx="26" ry="16" /></g>
);
const Sun = ({ x = 700, y = 70 }) => (<g><circle cx={x} cy={y} r="48" fill="#fde68a" opacity=".6" /><circle cx={x} cy={y} r="30" fill={C.sun} /></g>);
const Ground = ({ y = 370 }) => (<g><rect y={y} width="800" height={450 - y} fill={C.ground} /><rect y={y + 36} width="800" height={450 - y - 36} fill={C.road} /><g fill="#fde68a">{[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={30 + i * 140} y={y + 52} width="70" height="6" rx="3" />)}</g></g>);
const Tree = ({ x, y }: { x: number; y: number }) => (<g><rect x={x - 5} y={y} width="10" height="40" fill="#92400e" /><circle cx={x} cy={y - 8} r="28" fill="#22c55e" /><circle cx={x - 16} cy={y + 6} r="18" fill="#16a34a" /></g>);
const Window = ({ x, y, w = 40, h = 40, f = "#bfdbfe" }: { x: number; y: number; w?: number; h?: number; f?: string }) => (<g><rect x={x} y={y} width={w} height={h} rx="6" fill={f} stroke="#fff" strokeWidth="3" /><path d={`M${x + 6} ${y + h - 8} L${x + w - 6} ${y + 8}`} stroke="#fff" strokeWidth="3" opacity=".6" /></g>);
const Awning = ({ x, y, w, c1, c2 }: { x: number; y: number; w: number; c1: string; c2: string }) => {
  const n = Math.floor(w / 20);
  return (<g>{Array.from({ length: n }).map((_, i) => <path key={i} d={`M${x + i * 20} ${y} h20 l-4 22 q-6 6 -12 0z`} fill={i % 2 ? c1 : c2} />)}</g>);
};

export function Alex({ className = "h-full", pose = "idle" }: { className?: string; pose?: "idle" | "walk" | "think" }) {
  return (
    <svg viewBox="0 0 120 210" className={className} role="img" aria-label="Alex, o personagem-guia">
      <ellipse cx="60" cy="204" rx="34" ry="6" fill="#0f172a" opacity=".18" />
      {/* pernas */}
      <g>
        <rect x="42" y="132" width="16" height="56" rx="7" fill={C.navy} transform={pose === "walk" ? "rotate(8 50 132)" : ""} />
        <rect x="62" y="132" width="16" height="56" rx="7" fill="#1d4ed8" transform={pose === "walk" ? "rotate(-8 70 132)" : ""} />
        <ellipse cx="46" cy="193" rx="14" ry="8" fill="#fff" stroke="#cbd5e1" strokeWidth="2" /><ellipse cx="76" cy="193" rx="14" ry="8" fill="#fff" stroke="#cbd5e1" strokeWidth="2" />
        <rect x="34" y="190" width="24" height="3" fill={C.coral} /><rect x="64" y="190" width="24" height="3" fill={C.coral} />
      </g>
      {/* braços */}
      <rect x="22" y="84" width="16" height="54" rx="8" fill="#0ea5e9" transform="rotate(8 30 84)" />
      <rect x="82" y="84" width="16" height="54" rx="8" fill="#0ea5e9" transform={pose === "think" ? "rotate(-150 90 84)" : "rotate(-8 90 84)"} />
      <circle cx="26" cy="140" r="8" fill={C.skin} /><circle cx={pose === "think" ? 80 : 94} cy={pose === "think" ? 66 : 138} r="8" fill={C.skin} />
      {/* moletom */}
      <rect x="32" y="78" width="56" height="64" rx="18" fill="#38bdf8" />
      <path d="M52 78 q8 14 16 0" fill="none" stroke="#0369a1" strokeWidth="3" />
      <rect x="46" y="116" width="28" height="16" rx="6" fill="#0ea5e9" />
      <circle cx="60" cy="96" r="4" fill={C.sun} />
      {/* cabeça */}
      <rect x="52" y="68" width="16" height="14" rx="5" fill={C.skin} />
      <circle cx="60" cy="48" r="28" fill={C.skin} />
      <ellipse cx="33" cy="52" rx="5" ry="7" fill="#e8a678" /><ellipse cx="87" cy="52" rx="5" ry="7" fill="#e8a678" />
      {/* boné */}
      <path d="M31 44 q2 -30 29 -30 q27 0 29 30 q-29 -8 -58 0z" fill={C.coral} />
      <path d="M62 40 q30 -4 40 4 q-4 6 -40 2z" fill="#e11d48" />
      <circle cx="60" cy="22" r="3" fill="#fff" />
      <path d="M36 44 q-4 14 0 22" stroke="#3b2a20" strokeWidth="6" strokeLinecap="round" fill="none" />
      {/* rosto */}
      <circle cx="48" cy="54" r="3.6" fill={C.ink} /><circle cx="72" cy="54" r="3.6" fill={C.ink} />
      <circle cx="49.2" cy="52.8" r="1.1" fill="#fff" /><circle cx="73.2" cy="52.8" r="1.1" fill="#fff" />
      <path d="M44 46 q4 -3 8 -1 M68 45 q4 -2 8 1" stroke="#3b2a20" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M50 64 q10 9 20 0" stroke={C.ink} strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="42" cy="62" r="4" fill={C.coral} opacity=".35" /><circle cx="78" cy="62" r="4" fill={C.coral} opacity=".35" />
    </svg>
  );
}

/** Cenário geral do Mapa 1: centro comercial. */
export function SceneMall({ className }: { className?: string }) {
  return (
    <Frame id="mall" label="Centro comercial da Cidade do Consumo" className={className}>
      <Sun /><Cloud x={120} y={70} /><Cloud x={420} y={50} s={0.8} />
      <rect x="40" y="130" width="230" height="240" rx="10" fill="#f9a8d4" /><Awning x={40} y={170} w={230} c1="#fff" c2={C.coral} />
      <Window x={60} y={205} w={90} h={90} f="#fef9c3" /><Window x={165} y={205} w={90} h={90} f="#e0e7ff" />
      <rect x="110" y="300" width="50" height="70" rx="6" fill="#7c3aed" />
      <rect x="290" y="80" width="250" height="290" rx="10" fill="#a5b4fc" /><rect x="320" y="100" width="190" height="40" rx="10" fill="#fff" />
      <text x="415" y="128" textAnchor="middle" fontFamily="sans-serif" fontWeight="800" fontSize="24" fill={C.navy}>SHOPPING</text>
      <Awning x={290} y={170} w={250} c1="#fff" c2={C.sun} />
      <Window x={310} y={205} w={100} h={100} f="#dbeafe" /><Window x={425} y={205} w={100} h={100} f="#dcfce7" />
      <g><rect x="352" y="250" width="14" height="55" fill="#fff" opacity=".7" /><circle cx="359" cy="244" r="10" fill="#fff" opacity=".7" /><rect x="470" y="262" width="30" height="42" rx="4" fill={C.coral} /></g>
      <rect x="320" y="310" width="190" height="60" rx="6" fill="#4f46e5" /><rect x="395" y="312" width="40" height="58" fill="#c7d2fe" />
      <rect x="560" y="150" width="200" height="220" rx="10" fill="#86efac" /><Awning x={560} y={190} w={200} c1="#fff" c2="#22c55e" />
      <Window x={580} y={225} w={70} h={80} f="#fef9c3" /><Window x={665} y={225} w={70} h={80} f="#fce7f3" />
      <rect x="630" y="315" width="40" height="55" rx="6" fill="#166534" />
      <Tree x={30} y={330} /><Tree x={775} y={330} /><Ground />
      <g><circle cx="150" cy="268" r="16" fill="#fb7185" /><rect x="136" y="280" width="28" height="22" rx="6" fill="#f43f5e" /></g>
    </Frame>
  );
}

export function SceneShoe() {
  return (
    <Frame id="shoe" label="Vitrine de uma loja de calçados com promoção">
      <Cloud x={620} y={60} /><rect x="60" y="60" width="680" height="320" rx="16" fill="#fecdd3" />
      <rect x="90" y="90" width="620" height="70" rx="14" fill="#fff" />
      <text x="400" y="138" textAnchor="middle" fontFamily="sans-serif" fontWeight="900" fontSize="40" fill={C.coral}>LOJA DE CALÇADOS</text>
      <Awning x={60} y={165} w={680} c1="#fff" c2={C.coral} />
      <rect x="90" y="205" width="440" height="165" rx="12" fill="#e0f2fe" stroke="#fff" strokeWidth="6" />
      {[0, 1, 2].map((i) => (<g key={i} transform={`translate(${130 + i * 140} 290)`}><rect x="-10" y="64" width="110" height="12" rx="6" fill="#94a3b8" />
        <path d="M0 60 q0 -50 30 -50 l20 8 q20 24 50 26 q8 16 0 16 z" fill={["#34d399", "#fbbf24", "#a78bfa"][i]} /><rect x="0" y="56" width="104" height="10" rx="5" fill="#fff" /></g>))}
      <g transform="translate(570 230)"><circle cx="80" cy="60" r="70" fill={C.sun} /><circle cx="80" cy="60" r="58" fill="none" stroke="#fff" strokeWidth="4" strokeDasharray="8 6" />
        <text x="80" y="62" textAnchor="middle" fontFamily="sans-serif" fontWeight="900" fontSize="44" fill={C.ink}>-40%</text><text x="80" y="88" textAnchor="middle" fontFamily="sans-serif" fontWeight="800" fontSize="16" fill={C.ink}>PROMOÇÃO</text></g>
      <Ground />
    </Frame>
  );
}

export function SceneTrend() {
  return (
    <Frame id="trend" label="Celular mostrando uma tendência de roupas nas redes sociais" from="#ddd6fe" to="#fce7f3">
      <Cloud x={90} y={60} /><Cloud x={680} y={90} s={0.8} />
      <rect x="260" y="30" width="280" height="390" rx="36" fill={C.ink} /><rect x="274" y="48" width="252" height="354" rx="24" fill="#fff" />
      <rect x="290" y="62" width="220" height="34" rx="17" fill="#ede9fe" /><circle cx="310" cy="79" r="11" fill={C.grape} /><rect x="330" y="73" width="100" height="12" rx="6" fill="#c4b5fd" />
      <rect x="290" y="108" width="220" height="190" rx="14" fill="#fbcfe8" />
      <g transform="translate(360 120)"><path d="M10 0 h60 l14 40 -20 6 v90 h-48 v-90 l-20 -6z" fill={C.coral} /><path d="M25 0 q15 22 30 0" fill="#fff" opacity=".6" /><circle cx="40" cy="60" r="6" fill="#fff" opacity=".6" /></g>
      <g fill={C.coral}><path d="M300 330 c-14 -10 -24 -22 -12 -32 c8 -6 12 4 12 4 c0 0 4 -10 12 -4 c12 10 2 22 -12 32z" transform="translate(0 0)" /></g>
      <text x="345" y="326" fontFamily="sans-serif" fontWeight="800" fontSize="18" fill={C.ink}>12,4 mil curtidas</text>
      <rect x="290" y="344" width="220" height="12" rx="6" fill="#e5e7eb" /><rect x="290" y="364" width="150" height="12" rx="6" fill="#e5e7eb" />
      <g transform="translate(90 150)"><circle cx="0" cy="0" r="46" fill="#fff" /><text x="0" y="12" textAnchor="middle" fontSize="40">🔥</text></g>
      <g transform="translate(680 230)"><circle cx="0" cy="0" r="46" fill="#fff" /><text x="0" y="12" textAnchor="middle" fontSize="40">👗</text></g>
      <g transform="translate(120 330)"><circle cx="0" cy="0" r="38" fill="#fff" /><text x="0" y="12" textAnchor="middle" fontSize="34">🎉</text></g>
    </Frame>
  );
}

export function SceneJeans() {
  return (
    <Frame id="jeans" label="Calça jeans com um pequeno rasgo e material de costura" from="#fde68a" to="#fef3c7">
      <Cloud x={120} y={70} />
      <rect x="0" y="330" width="800" height="120" fill="#d6a56b" /><rect x="0" y="330" width="800" height="12" fill="#b4803f" />
      <g transform="translate(250 40)"><path d="M0 0 h200 l22 290 h-78 l-44 -170 -44 170 h-78z" fill="#3b82f6" /><rect x="0" y="0" width="200" height="30" fill="#2563eb" /><path d="M40 0 v30 M100 0 v30 M160 0 v30" stroke="#1e3a8a" strokeWidth="3" />
        <path d="M60 130 l30 6 -8 14 26 4 -4 14" stroke="#1e3a8a" strokeWidth="5" fill="none" strokeLinecap="round" /><rect x="70" y="120" width="60" height="50" rx="8" fill="#93c5fd" opacity=".55" /><g stroke="#fff" strokeWidth="3"><path d="M72 128 l16 0 M96 138 l22 0 M80 150 l30 0" /></g></g>
      <g transform="translate(560 230)"><circle cx="40" cy="40" r="40" fill={C.coral} /><circle cx="40" cy="40" r="14" fill="#fff" /><rect x="10" y="78" width="60" height="22" rx="8" fill="#e11d48" />
        <path d="M-60 -70 q60 -80 130 40" stroke="#94a3b8" strokeWidth="4" fill="none" /></g>
      <g transform="translate(90 260)"><rect width="120" height="26" rx="13" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="3" /><path d="M120 13 h60" stroke="#94a3b8" strokeWidth="8" /><circle cx="22" cy="13" r="6" fill="#94a3b8" /></g>
      <g transform="translate(110 350)"><path d="M0 0 l40 -20 l40 20 z" fill={C.sun} /><circle cx="40" cy="-2" r="5" fill={C.ink} /></g>
    </Frame>
  );
}

export function SceneAd() {
  return (
    <Frame id="ad" label="Anúncio online com oferta por tempo limitado" from="#fecaca" to="#fff1f2">
      <Cloud x={680} y={60} s={0.8} />
      <rect x="110" y="40" width="580" height="360" rx="22" fill={C.ink} /><rect x="130" y="60" width="540" height="320" rx="14" fill="#fff" />
      <rect x="130" y="60" width="540" height="40" rx="14" fill="#e0e7ff" /><circle cx="156" cy="80" r="7" fill={C.coral} /><circle cx="178" cy="80" r="7" fill={C.sun} /><circle cx="200" cy="80" r="7" fill={C.mint} />
      <rect x="150" y="120" width="250" height="230" rx="16" fill="#fecdd3" /><g transform="translate(205 160)"><rect width="140" height="150" rx="14" fill="#fff" /><rect x="20" y="24" width="100" height="70" rx="10" fill="#a5b4fc" /><rect x="20" y="108" width="70" height="12" rx="6" fill="#cbd5e1" /><rect x="20" y="128" width="40" height="12" rx="6" fill="#cbd5e1" /></g>
      <g transform="translate(430 126)"><rect width="220" height="96" rx="16" fill={C.coral} /><text x="110" y="52" textAnchor="middle" fontFamily="sans-serif" fontWeight="900" fontSize="54" fill="#fff">50%</text><text x="110" y="80" textAnchor="middle" fontFamily="sans-serif" fontWeight="800" fontSize="20" fill="#fff">DE DESCONTO</text></g>
      <g transform="translate(430 240)"><rect width="220" height="54" rx="27" fill={C.sun} /><text x="110" y="36" textAnchor="middle" fontFamily="sans-serif" fontWeight="900" fontSize="22" fill={C.ink}>SOMENTE HOJE!</text></g>
      <g transform="translate(430 306)"><circle cx="26" cy="26" r="24" fill="#fff" stroke={C.ink} strokeWidth="5" /><path d="M26 10 v18 l12 8" stroke={C.ink} strokeWidth="5" fill="none" strokeLinecap="round" /><text x="64" y="34" fontFamily="sans-serif" fontWeight="800" fontSize="22" fill={C.ink}>00:09:59</text></g>
      <text x="290" y="338" textAnchor="middle" fontSize="1"> </text>
    </Frame>
  );
}

export function SceneParty() {
  return (
    <Frame id="party" label="Confraternização escolar com lanche coletivo e recipientes reutilizáveis" from="#bbf7d0" to="#ecfccb">
      <Sun x={90} y={70} /><Cloud x={420} y={60} />
      <g>{[0, 1, 2, 3, 4, 5, 6].map((i) => <g key={i}><path d={`M${60 + i * 110} 30 l30 40 l-60 0z`} fill={["#fb7185", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa"][i % 5]} /></g>)}<path d="M40 30 Q400 90 770 30" stroke="#64748b" strokeWidth="3" fill="none" /></g>
      <rect x="0" y="340" width="800" height="110" fill="#86efac" />
      <rect x="110" y="250" width="580" height="22" rx="8" fill="#b45309" /><rect x="140" y="272" width="16" height="100" fill="#92400e" /><rect x="644" y="272" width="16" height="100" fill="#92400e" />
      <g transform="translate(150 190)"><rect width="110" height="60" rx="12" fill="#fff" stroke="#38bdf8" strokeWidth="5" /><rect x="-4" y="-6" width="118" height="16" rx="8" fill="#38bdf8" /><circle cx="30" cy="34" r="12" fill={C.coral} /><circle cx="58" cy="34" r="12" fill={C.sun} /><circle cx="84" cy="34" r="12" fill={C.mint} /></g>
      <g transform="translate(300 170)"><path d="M0 20 h110 l-14 70 h-82z" fill="#fff" stroke="#34d399" strokeWidth="5" /><ellipse cx="55" cy="20" rx="55" ry="14" fill="#fde68a" /><path d="M20 4 q10 -22 20 0 q10 -22 20 0 q10 -22 20 0" fill="#fb923c" /></g>
      <g transform="translate(460 205)"><rect width="90" height="45" rx="10" fill="#bbf7d0" stroke="#16a34a" strokeWidth="4" /><path d="M20 22 l12 10 22 -20" stroke="#16a34a" strokeWidth="6" fill="none" strokeLinecap="round" /></g>
      <g transform="translate(580 150)"><rect width="70" height="100" rx="12" fill="#bae6fd" stroke="#0284c7" strokeWidth="4" /><rect x="-4" y="-10" width="78" height="18" rx="6" fill="#0284c7" /><path d="M20 50 a15 15 0 1 1 30 0 M44 40 l8 12 -12 2" stroke="#0369a1" strokeWidth="4" fill="none" strokeLinecap="round" /></g>
      <g transform="translate(60 330)"><rect width="50" height="14" rx="4" fill="#fff" /><path d="M10 0 v-14 M30 0 v-18" stroke="#16a34a" strokeWidth="4" /></g>
      <Tree x={750} y={300} />
    </Frame>
  );
}

const SCENES: Record<string, () => ReactNode> = { shoe: SceneShoe, trend: SceneTrend, jeans: SceneJeans, ad: SceneAd, party: SceneParty };

/** Cenas provisórias dos Mapas 2–4: ícone grande + legenda, no mesmo estilo visual. Substituíveis por ilustrações próprias (mesma chave). */
const GENERIC: Record<string, { icon: string; label: string; from: string; to: string }> = {
  snack: { icon: "🥪", label: "Cantina da escola", from: "#fde68a", to: "#fff7ed" },
  packs: { icon: "📚", label: "Pacote de cadernos", from: "#bfdbfe", to: "#eff6ff" },
  bag: { icon: "🎒", label: "Mochila em promoção", from: "#fecaca", to: "#fff1f2" },
  plan: { icon: "📝", label: "Minha regra para promoções", from: "#ddd6fe", to: "#f5f3ff" },
  ledger: { icon: "📒", label: "Caderno de contas", from: "#bbf7d0", to: "#f0fdf4" },
  envelopes: { icon: "💵", label: "A mesada em três partes", from: "#bbf7d0", to: "#ecfccb" },
  phone: { icon: "📱", label: "Celular quebrado", from: "#bae6fd", to: "#f0f9ff" },
  bike: { icon: "🚲", label: "Bicicleta para o conserto", from: "#bbf7d0", to: "#f0fdf4" },
  goal: { icon: "🎧", label: "Meta: fone novo", from: "#ddd6fe", to: "#f5f3ff" },
  message: { icon: "💬", label: "Mensagem suspeita", from: "#fecaca", to: "#fff1f2" },
  install: { icon: "💳", label: "À vista ou parcelado?", from: "#fde68a", to: "#fffbeb" },
  lootbox: { icon: "🎁", label: "Caixas surpresa", from: "#fbcfe8", to: "#fdf2f8" },
  cash: { icon: "💰", label: "Caixa da turma", from: "#fde68a", to: "#fffbeb" },
  pact: { icon: "🤝", label: "Nosso pacto", from: "#bae6fd", to: "#f0f9ff" },
};
function SceneGeneric({ k }: { k: string }) {
  const g = GENERIC[k]!;
  return (
    <Frame id={`g-${k}`} label={g.label} from={g.from} to={g.to}>
      <Cloud x={120} y={70} /><Cloud x={690} y={90} s={0.8} />
      <circle cx="400" cy="215" r="135" fill="#fff" opacity=".85" />
      <text x="400" y="262" textAnchor="middle" fontSize="150">{g.icon}</text>
      <rect x="190" y="365" width="420" height="52" rx="26" fill={C.ink} opacity=".9" />
      <text x="400" y="400" textAnchor="middle" fontFamily="sans-serif" fontWeight="800" fontSize="26" fill="#fff">{g.label}</text>
    </Frame>
  );
}
export function SceneByKey({ k }: { k: string }) {
  if (SCENES[k]) { const S = SCENES[k]; return <S />; }
  if (GENERIC[k]) return <SceneGeneric k={k} />;
  return <SceneShoe />;
}

/** Ilustrações dos quatro mapas (cartões da tela principal). */
export function MapArt({ n }: { n: 1 | 2 | 3 | 4 }) {
  if (n === 1) return <SceneMall />;
  if (n === 2) return (
    <Frame id="m2" label="Supermercado com etiquetas de preço e calculadora" from="#bbf7d0" to="#ecfdf5">
      <Cloud x={680} y={60} s={.8} />
      <rect x="60" y="80" width="680" height="290" rx="16" fill="#fff" stroke="#16a34a" strokeWidth="6" /><rect x="60" y="80" width="680" height="60" rx="16" fill="#22c55e" />
      <text x="400" y="122" textAnchor="middle" fontFamily="sans-serif" fontWeight="900" fontSize="34" fill="#fff">SUPERMERCADO</text>
      {[0, 1, 2].map((r) => <rect key={r} x="90" y={165 + r * 62} width="400" height="12" rx="6" fill="#cbd5e1" />)}
      {[0, 1, 2].map((r) => [0, 1, 2, 3, 4].map((c) => <rect key={`${r}-${c}`} x={100 + c * 76} y={134 + r * 62} width="52" height="30" rx="8" fill={["#fb7185", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa"][(r + c) % 5]} />))}
      {[0, 1, 2].map((r) => <g key={r} transform={`translate(${110 + r * 150} 330)`}><rect width="110" height="34" rx="6" fill="#fde047" /><text x="55" y="24" textAnchor="middle" fontFamily="sans-serif" fontWeight="900" fontSize="20" fill={C.ink}>R$ {[4, 7, 12][r]},90</text></g>)}
      <g transform="translate(540 170)"><rect width="170" height="190" rx="18" fill={C.ink} /><rect x="14" y="14" width="142" height="44" rx="8" fill="#a7f3d0" /><text x="148" y="46" textAnchor="end" fontFamily="monospace" fontWeight="900" fontSize="26" fill={C.ink}>-15%</text>
        {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={36 + c * 49} cy={84 + r * 26} r="10" fill={c === 2 ? C.sun : "#e2e8f0"} />))}</g>
      <Ground y={380} />
    </Frame>);
  if (n === 3) return (
    <Frame id="m3" label="Bairro residencial com casas, banco e cofres" from="#fde68a" to="#fffbeb">
      <Sun x={90} y={70} /><Cloud x={420} y={60} />
      {[0, 1, 2].map((i) => <g key={i} transform={`translate(${50 + i * 140} 220)`}><rect y="40" width="110" height="110" fill={["#fda4af", "#a5b4fc", "#fcd34d"][i]} /><path d="M-10 44 l65 -50 l65 50z" fill={["#be123c", "#4338ca", "#b45309"][i]} /><rect x="38" y="90" width="34" height="60" rx="4" fill="#fff" /><rect x="10" y="62" width="24" height="24" rx="4" fill="#e0f2fe" /><rect x="76" y="62" width="24" height="24" rx="4" fill="#e0f2fe" /></g>)}
      <g transform="translate(470 120)"><path d="M0 60 l100 -50 l100 50z" fill="#1e3a8a" /><rect x="10" y="60" width="180" height="170" fill="#dbeafe" />{[0, 1, 2, 3].map((i) => <rect key={i} x={26 + i * 42} y="76" width="22" height="130" rx="4" fill="#fff" stroke="#93c5fd" strokeWidth="3" />)}<rect x="0" y="206" width="200" height="24" fill="#1e3a8a" /><text x="100" y="50" textAnchor="middle" fontFamily="sans-serif" fontWeight="900" fontSize="20" fill="#fff">BANCO</text></g>
      <g transform="translate(700 290)"><rect width="80" height="80" rx="12" fill="#64748b" /><rect x="8" y="8" width="64" height="64" rx="8" fill="#94a3b8" /><circle cx="40" cy="40" r="16" fill="#fbbf24" stroke="#fff" strokeWidth="4" /><path d="M40 28 v24 M28 40 h24" stroke="#fff" strokeWidth="3" /></g>
      <Ground y={370} />
    </Frame>);
  return (
    <Frame id="m4" label="Cidade moderna com transações digitais e segurança" from="#c7d2fe" to="#e0e7ff">
      <Cloud x={120} y={60} /><Cloud x={640} y={80} s={.8} />
      {[0, 1, 2, 3, 4].map((i) => { const h = [200, 260, 170, 300, 220][i]; return <g key={i}><rect x={30 + i * 150} y={380 - h} width="110" height={h} rx="8" fill={["#6366f1", "#8b5cf6", "#0ea5e9", "#4f46e5", "#06b6d4"][i]} />
        {Array.from({ length: Math.floor(h / 50) }).map((_, r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={46 + i * 150 + c * 30} y={400 - h + r * 44} width="18" height="26" rx="3" fill="#fef9c3" opacity=".85" />))}</g>; })}
      <g transform="translate(300 120)"><path d="M100 0 l90 30 v70 q0 70 -90 110 q-90 -40 -90 -110 v-70z" fill="#fff" stroke={C.navy} strokeWidth="8" /><path d="M100 22 l66 22 v56 q0 52 -66 84 q-66 -32 -66 -84 v-56z" fill="#34d399" /><path d="M68 100 l24 24 l42 -48" stroke="#fff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" /></g>
      <g transform="translate(60 100)"><rect width="150" height="64" rx="14" fill="#fff" /><circle cx="32" cy="32" r="18" fill={C.sun} /><text x="32" y="40" textAnchor="middle" fontWeight="900" fontSize="22" fill={C.ink} fontFamily="sans-serif">R$</text><rect x="62" y="20" width="70" height="10" rx="5" fill="#c7d2fe" /><rect x="62" y="38" width="46" height="10" rx="5" fill="#c7d2fe" /></g>
      <g transform="translate(600 150)"><rect width="150" height="64" rx="14" fill="#fff" /><rect x="14" y="16" width="34" height="32" rx="8" fill="#a7f3d0" /><path d="M23 33 l7 7 l11 -14" stroke="#047857" strokeWidth="4" fill="none" strokeLinecap="round" /><rect x="62" y="20" width="70" height="10" rx="5" fill="#c7d2fe" /><rect x="62" y="38" width="46" height="10" rx="5" fill="#c7d2fe" /></g>
      <Ground y={380} />
    </Frame>);
}

export function LoginArt() {
  return (
    <svg viewBox="0 0 800 300" className="h-full w-full" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#38bdf8" /><stop offset="1" stopColor="#e0f2fe" /></linearGradient></defs>
      <rect width="800" height="300" fill="url(#lg)" />
      <circle cx="650" cy="70" r="40" fill={C.sun} />
      <Cloud x={120} y={60} /><Cloud x={400} y={40} s={.8} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => { const h = [120, 170, 100, 200, 140, 110, 160][i]; return <g key={i}><rect x={10 + i * 115} y={290 - h} width="90" height={h} rx="6" fill={["#6366f1", "#f472b6", "#fbbf24", "#34d399", "#8b5cf6", "#fb7185", "#22d3ee"][i]} />
        {Array.from({ length: Math.floor(h / 40) }).map((_, r) => <rect key={r} x={24 + i * 115} y={305 - h + r * 38} width="62" height="18" rx="3" fill="#fff" opacity=".35" />)}</g>; })}
      <rect y="286" width="800" height="14" fill="#475569" />
    </svg>
  );
}

export function Medal({ k, className = "h-32 w-32" }: { k: string; className?: string }) {
  const col = ({ mestre: ["#fbbf24", "#f59e0b"], guardiao: ["#cbd5e1", "#94a3b8"], aprendiz: ["#fdba74", "#ea580c"], explorador: ["#86efac", "#16a34a"] } as Record<string, string[]>)[k] ?? ["#fbbf24", "#f59e0b"];
  return (
    <svg viewBox="0 0 120 140" className={className} role="img" aria-label="Medalha de desempenho">
      <path d="M30 0 h22 l10 46 h-24z" fill="#6366f1" /><path d="M90 0 h-22 l-10 46 h24z" fill={C.coral} />
      <circle cx="60" cy="84" r="46" fill={col[1]} /><circle cx="60" cy="84" r="38" fill={col[0]} stroke="#fff" strokeWidth="4" />
      <path d="M60 58 l8 18 20 2 -15 13 5 19 -18 -10 -18 10 5 -19 -15 -13 20 -2z" fill="#fff" opacity=".95" />
    </svg>
  );
}

export const Lock = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><rect x="4" y="11" width="16" height="10" rx="3" fill="currentColor" opacity=".2" /><rect x="4" y="11" width="16" height="10" rx="3" /><path d="M8 11 V8 a4 4 0 0 1 8 0 v3" /></svg>
);
