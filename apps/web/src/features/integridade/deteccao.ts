// Lógica PURA da proteção de integridade (sem DOM): fácil de testar e de auditar.
//
// Princípio: só registramos o que os componentes do Financity conseguem observar com certeza.
// - Um atalho pressionado é "atalho pressionado": NUNCA dizemos que uma captura/impressão aconteceu se o navegador não confirmou.
// - Minimizar, bloquear a tela, trocar de aba ou de app NÃO é evento: nem sequer é enviado ao servidor (ver `ehEventoPermitido`).

export type TipoEvento = "impressao_iniciada" | "copia_conteudo" | "atalho_impressao" | "tecla_captura_tela";

export type TeclaInfo = { key: string; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean; type: "keydown" | "keyup" };
export type Deteccao = { tipo: TipoEvento; detalhe: string; bloquear: boolean };

/**
 * Classifica uma tecla. Retorna null para qualquer tecla comum.
 * - Ctrl/Cmd+P: atalho de impressão (dá para interceptar: bloquear = true).
 * - PrintScreen (Windows/Linux): o navegador só enxerga o "keyup" e não consegue impedir a captura do sistema.
 * - Cmd+Shift+3/4/5 (macOS) e Win+Shift+S (Windows): quando o sistema deixa o navegador ver o atalho; também não impede nada.
 */
export function classificarTecla(e: TeclaInfo): Deteccao | null {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const mod = !!(e.ctrlKey || e.metaKey);
  if (e.type === "keydown" && mod && !e.shiftKey && !e.altKey && k === "p") return { tipo: "atalho_impressao", detalhe: e.metaKey ? "Cmd+P" : "Ctrl+P", bloquear: true };
  if (e.type === "keyup" && e.key === "PrintScreen") return { tipo: "tecla_captura_tela", detalhe: "PrintScreen", bloquear: false };
  if (e.type === "keydown" && e.metaKey && e.shiftKey && !e.ctrlKey && ["3", "4", "5", "#", "$", "%"].includes(e.key)) return { tipo: "tecla_captura_tela", detalhe: `Cmd+Shift+${e.key === "#" ? "3" : e.key === "$" ? "4" : e.key === "%" ? "5" : e.key}`, bloquear: false };
  if (e.type === "keydown" && e.metaKey && e.shiftKey && !e.ctrlKey && k === "s") return { tipo: "tecla_captura_tela", detalhe: "Win+Shift+S", bloquear: false };
  return null;
}

/** Eventos de ciclo de vida da página (minimizar, bloquear a tela, notificação, ligação, trocar de app): sempre permitidos, nunca enviados. */
export const ehEventoPermitido = (nome: string) => ["visibilitychange", "pagehide", "pageshow", "blur", "focus", "freeze", "resume", "online", "offline"].includes(nome);

/** O texto selecionado pertence ao conteúdo protegido da questão? (cópia em outras partes da página não é evento) */
export function copiaDeConteudoProtegido(selecionado: string, dentroDoProtegido: boolean): boolean {
  return selecionado.trim().length > 0 && dentroDoProtegido;
}

/** Classe grosseira do aparelho para o painel do professor. Sem identificadores únicos (nada de fingerprint). */
export function classeDeDispositivo(ua: string, maxTouchPoints = 0): string {
  const u = ua || "";
  const ios = /iPhone|iPod/.test(u) || (/Macintosh/.test(u) && maxTouchPoints > 1) || /iPad/.test(u);
  const android = /Android/.test(u);
  const tablet = /iPad/.test(u) || (/Macintosh/.test(u) && maxTouchPoints > 1) || (android && !/Mobile/.test(u));
  const tipo = tablet ? "tablet" : ios || android || /Mobile/.test(u) ? "celular" : "computador";
  const so = /Windows/.test(u) ? "Windows" : ios ? "iOS" : android ? "Android" : /Mac OS X|Macintosh/.test(u) ? "macOS" : /CrOS/.test(u) ? "ChromeOS" : /Linux/.test(u) ? "Linux" : "";
  const nav = /Edg\//.test(u) ? "Edge" : /OPR\/|Opera/.test(u) ? "Opera" : /CriOS|Chrome\//.test(u) ? "Chrome" : /FxiOS|Firefox\//.test(u) ? "Firefox" : /Safari\//.test(u) ? "Safari" : "";
  return [tipo, so, nav].filter(Boolean).join(" · ");
}

/** Texto da marca d'água: aluno, sessão e horário. */
export function textoMarcaDagua(nome: string, sessao: string, agora: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const data = `${p(agora.getDate())}/${p(agora.getMonth() + 1)}/${agora.getFullYear()} ${p(agora.getHours())}:${p(agora.getMinutes())}`;
  return `${nome} · sessão ${sessao || "—"} · ${data}`;
}

/** SVG (como data URL) com o texto repetido na diagonal, discreto e sem capturar cliques. */
export function marcaDaguaSvg(texto: string): string {
  const esc = texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="220"><text x="210" y="110" text-anchor="middle" transform="rotate(-24 210 110)" font-family="sans-serif" font-size="14" font-weight="600" fill="#1e1b4b" fill-opacity="0.10">${esc}</text></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

/** Resposta do servidor ao relato de uma ocorrência. */
export type Resposta = { action: "none" | "notice" | "warning" | "suspended" | "blocked"; message: string | null; secondsLeft: number; eventId: number | null };
export type EstadoIntegridade = { status: "ok" | "suspended" | "blocked"; secondsLeft: number; message: string | null };

/** O que mostrar na sobreposição de proteção. `null` = nada (partida livre). */
export function sobreposicao(local: Resposta | null, servidor: EstadoIntegridade | undefined): { tipo: "warning" | "suspended" | "blocked"; mensagem: string; segundos: number } | null {
  if (local && (local.action === "warning" || local.action === "suspended" || local.action === "blocked")) {
    return { tipo: local.action, mensagem: local.message ?? "Uma atividade não permitida foi detectada.", segundos: local.secondsLeft };
  }
  if (servidor && servidor.status !== "ok") return { tipo: servidor.status, mensagem: servidor.message ?? "Sua partida está pausada.", segundos: servidor.secondsLeft };
  return null;
}
