#!/usr/bin/env node
// Verificador de segredos e dados pessoais (sem dependências). Roda no pre-commit e na CI, em complemento ao Gitleaks.
//
//   node scripts/verificar-segredos.mjs --staged     só o que está no stage (usado pelo hook de pre-commit)
//   node scripts/verificar-segredos.mjs --tudo       todos os arquivos versionados (usado na CI)
//   node scripts/verificar-segredos.mjs --historico  todo o histórico de todas as branches (auditoria)
//
// Saída SEMPRE mascarada: mostra arquivo, linha, tipo e tamanho, nunca o valor. Código de saída 1 se achar algo.
// Falso positivo isolado: acrescente na MESMA linha o comentário  verificar-segredos: ignorar (motivo)  — não há exceção global.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const modo = process.argv[2] ?? "--tudo";
const git = (...a) => execFileSync("git", a, { encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });

/** Valores de DESENVOLVIMENTO LOCAL, públicos e sem acesso a nada (banco embutido em 127.0.0.1 e segredos de teste). */
const VALORES_DE_DEV = /dev-local-only|do-not-use-in-production|segredo-de-teste|valor-ficticio|Senha-Forte-\d|senha-errada|errada-/i;
const PLACEHOLDER = /(example|exemplo|changeme|xxxx|<[^>]+>|\$\{|\$[A-Z_]+|process\.env|your[_-]|\*\*\*|placeholder|SENHA\b|senha@)/i;

const REGRAS = [
  { id: "chave-privada", gravidade: "CRITICO", rx: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { id: "token-github", gravidade: "CRITICO", rx: /\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}/ },
  { id: "chave-aws", gravidade: "CRITICO", rx: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: "token-slack", gravidade: "CRITICO", rx: /\bxox[baprs]-[A-Za-z0-9-]{10,}/ },
  { id: "chave-elevenlabs", gravidade: "CRITICO", rx: /\bsk_[a-f0-9]{30,}\b/ },
  { id: "chave-openai/anthropic", gravidade: "CRITICO", rx: /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{32,}/ },
  { id: "conexao-com-senha", gravidade: "ALTO", rx: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp):\/\/[^\s:\/@'"`]+:([^\s@'"`\/]{4,})@/, grupoSenha: 1 },
  { id: "jwt-literal", gravidade: "ALTO", rx: /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/ },
  { id: "segredo-hex-longo", gravidade: "ALTO", rx: /(?:secret|salt|signing|private)[A-Za-z_]*["']?\s*[:=]\s*["']?[0-9a-f]{40,}/i },
  { id: "segredo-literal", gravidade: "MEDIO", rx: /\b(?:secret|passw(?:or)?d|senha|api[_-]?key|token)\b["']?\s*[:=]\s*["']([A-Za-z0-9\/+_.@!#$%^&*-]{16,})["']/i, grupoSenha: 1 },
  { id: "cpf", gravidade: "ALTO", rx: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/ },
  { id: "telefone-br", gravidade: "MEDIO", rx: /\(\d{2}\)\s?9?\d{4}-\d{4}/ },
];
const EMAIL = /[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
const EMAIL_OK = /(^|\.)(example\.(com|org|net)|escola\.(test|local)|financity\.(test|local)|localhost|users\.noreply\.github\.com|github\.com)$|\.(test|local|invalid|example)$/i;
const ARQUIVO_PROIBIDO = /(^|\/)(\.env(\.(?!example$|production\.example$)[^/]*)?|[^/]*\.(pem|key|p12|pfx|dump|sqlite3?|db|bak)|[^/]*credenciais[^/]*\.(csv|html|txt|json|pdf)|id_(rsa|ed25519)[^/]*)$/i;
const BINARIO = /\.(mp3|wav|png|jpe?g|webp|gif|ico|woff2?|ttf|pdf|docx?|zip|gz)$/i;

// Achados do HISTÓRICO já avaliados e aceitos (um a um, com motivo). Linhas antigas não podem mais receber o comentário de exceção.
const BASELINE = existsSync("scripts/verificar-segredos.baseline.json") ? JSON.parse(readFileSync("scripts/verificar-segredos.baseline.json", "utf8")) : [];
const aceito = (onde, tipo) => BASELINE.some((b) => b.onde === onde && b.tipo === tipo);

const achados = [];
function examinar(texto, onde, linhaInicial = 1) {
  texto.split("\n").forEach((linha, i) => {
    if (/verificar-segredos:\s*ignorar/i.test(linha)) return;
    for (const r of REGRAS) {
      const m = r.rx.exec(linha);
      if (!m) continue;
      const valor = r.grupoSenha ? m[r.grupoSenha] : m[0];
      if (VALORES_DE_DEV.test(valor) || PLACEHOLDER.test(m[0]) || PLACEHOLDER.test(valor)) continue;
      if (!aceito(onde, r.id)) achados.push({ onde, linha: linhaInicial + i, tipo: r.id, gravidade: r.gravidade, tamanho: valor.length });
    }
    for (const m of linha.matchAll(EMAIL)) {
      if (EMAIL_OK.test(m[1])) continue;
      achados.push({ onde, linha: linhaInicial + i, tipo: `e-mail real (domínio ${m[1]})`, gravidade: "MEDIO", tamanho: m[0].length });
    }
  });
}

if (modo === "--staged" || modo === "--tudo") {
  const lista = (modo === "--staged" ? git("diff", "--cached", "--name-only", "--diff-filter=ACM") : git("ls-files")).split("\n").filter(Boolean);
  for (const f of lista) {
    if (ARQUIVO_PROIBIDO.test(f)) { achados.push({ onde: f, linha: 0, tipo: "arquivo que não deve ser versionado", gravidade: "ALTO", tamanho: 0 }); continue; }
    if (BINARIO.test(f) || f.endsWith("package-lock.json")) continue;
    let texto; try { texto = modo === "--staged" ? git("show", ":" + f) : readFileSync(f, "utf8"); } catch { continue; }
    examinar(texto, f);
  }
} else if (modo === "--historico") {
  const log = git("log", "--all", "-p", "--no-color", "--format=@@%h", "--diff-filter=AM", "-U0");
  let commit = "", arq = "", buf = [];
  const fecha = () => { if (arq && buf.length && !BINARIO.test(arq) && !arq.endsWith("package-lock.json")) examinar(buf.join("\n"), `${arq} @${commit}`); };
  for (const l of log.split("\n")) {
    if (l.startsWith("@@") && !l.startsWith("@@ ")) { fecha(); commit = l.slice(2); arq = ""; buf = []; }
    else if (l.startsWith("+++ b/")) { fecha(); arq = l.slice(6); buf = []; }
    else if (l.startsWith("+") && !l.startsWith("+++")) buf.push(l.slice(1));
  }
  fecha();
} else { console.error("Use: --staged | --tudo | --historico"); process.exit(2); }

const ordem = ["CRITICO", "ALTO", "MEDIO", "BAIXO"];
achados.sort((a, b) => ordem.indexOf(a.gravidade) - ordem.indexOf(b.gravidade));
if (achados.length === 0) { console.log(`verificar-segredos (${modo}): nada encontrado.`); process.exit(0); }
console.error(`verificar-segredos (${modo}): ${achados.length} possível(is) exposição(ões) — valores NÃO são exibidos:`);
for (const a of achados.slice(0, 50)) console.error(`  [${a.gravidade}] ${a.onde}${a.linha ? ":" + a.linha : ""} — ${a.tipo}${a.tamanho ? ` (${a.tamanho} caracteres)` : ""}`);
if (achados.length > 50) console.error(`  … e mais ${achados.length - 50}.`);
console.error("\nRemova o valor, use variável de ambiente e, se algum segredo real chegou a ser publicado, trate-o como comprometido (rotacione).");
process.exit(1);
