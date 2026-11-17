// Cartões de credenciais para imprimir (HTML autônomo: sem internet, sem script, sem recursos externos).
export type Credencial = { nome: string; turma: string; usuario: string; pin: string };

/** Lê o CSV de credenciais devolvido pelo importador: "Aluno;Turma;Usuário;PIN" (BOM e aspas tolerados). */
export function lerCredenciais(csv: string): Credencial[] {
  const linhas = csv.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  return linhas.slice(1).map((l) => {
    const c: string[] = []; let cur = "", asp = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (asp) { if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') asp = false; else cur += ch; }
      else if (ch === '"') asp = true; else if (ch === ";") { c.push(cur); cur = ""; } else cur += ch;
    }
    c.push(cur);
    const sem = (v: string) => v.replace(/^'(?=[=+\-@])/, ""); // desfaz a proteção contra fórmula de planilha
    return { nome: sem(c[0] ?? ""), turma: sem(c[1] ?? ""), usuario: sem(c[2] ?? ""), pin: sem(c[3] ?? "") };
  }).filter((c) => c.usuario && c.pin);
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function renderizarCredenciais(rows: Credencial[], site: string, titulo = "Credenciais Financity"): string {
  const cartoes = rows.map((r) => `
  <section class="cartao">
    <h2>Financity</h2>
    <p class="nome">${esc(r.nome)}</p>
    <p class="turma">${esc(r.turma)}</p>
    <dl><dt>Endereço</dt><dd>${esc(site)}</dd><dt>Usuário</dt><dd class="mono">${esc(r.usuario)}</dd><dt>Senha</dt><dd class="mono pin">${esc(r.pin)}</dd></dl>
    <p class="aviso">Guarde esta senha. Não compartilhe com colegas.</p>
  </section>`).join("\n");
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(titulo)}</title>
<style>
  @page { size: A4; margin: 10mm; }
  body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #111; }
  .aviso-topo { background: #fff3cd; padding: 8px 12px; font-size: 13px; }
  .grade { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .cartao { box-sizing: border-box; border: 1px dashed #666; padding: 10mm 8mm; min-height: 62mm; break-inside: avoid; page-break-inside: avoid; }
  .cartao h2 { margin: 0 0 4px; font-size: 18px; color: #3b2a8c; }
  .nome { margin: 0; font-weight: 700; font-size: 15px; } .turma { margin: 0 0 6px; font-size: 12px; color: #444; }
  dl { margin: 4px 0; display: grid; grid-template-columns: 70px 1fr; row-gap: 3px; font-size: 14px; } dt { color: #444; } dd { margin: 0; }
  .mono { font-family: "Courier New", monospace; font-weight: 700; font-size: 16px; } .pin { letter-spacing: 3px; font-size: 20px; }
  .aviso { margin: 6px 0 0; font-size: 10px; color: #555; }
  @media print { .aviso-topo { display: none; } }
</style></head>
<body>
<div class="aviso-topo"><strong>Documento com senhas de alunos (menores de idade).</strong> Imprima, recorte nas linhas pontilhadas e depois <strong>apague este arquivo</strong>. Não envie por e-mail nem aplicativo de mensagens.</div>
<div class="grade">${cartoes}
</div>
</body></html>
`;
}

/** "credenciais-7ano.html" quando todos são da mesma série; senão "credenciais-turmas.html". */
export function nomeDoArquivo(rows: Credencial[]): string {
  const series = new Set(rows.map((r) => /(\d{1,2})/.exec(r.turma)?.[1]).filter(Boolean));
  return series.size === 1 ? `credenciais-${[...series][0]}ano.html` : "credenciais-turmas.html";
}
