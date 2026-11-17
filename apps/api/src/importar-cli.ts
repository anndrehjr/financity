// Importação de alunos em lote por CSV (nome,serie,turma). Roda DENTRO do container da API, lendo o CSV pela ENTRADA PADRÃO
// (o arquivo nunca é copiado para a VPS nem para a imagem) e devolvendo as credenciais pela SAÍDA PADRÃO (que você redireciona
// para um arquivo local). Dados de alunos e PINs nunca vão para log.
//
//   ver (não grava nada):  ssh ... 'docker exec -i financity-api-1 node dist/importar-cli.js'            < alunos.csv
//   gravar:                ssh ... 'docker exec -i financity-api-1 node dist/importar-cli.js --executar' < alunos.csv > credenciais.csv
//
// Colunas: nome, serie, turma (turma pode ficar vazia → "<serie> ano", como a turma existente "8 ano"). Aceita vírgula ou ponto e vírgula.
import { closePool, one, q } from "./lib/db.js";
import { gradeFromName } from "./lib/scope.js";
import { createStudents, makeUsername } from "./lib/students.js";

export type Linha = { nome: string; serie: number; turma: string };
export type Rejeitada = { linha: number; motivo: string };

const PARTICULAS = new Set(["de", "da", "do", "dos", "das", "e"]);
export function nomeBonito(n: string): string {
  return n.trim().replace(/\s+/g, " ").toLowerCase().split(" ").map((p, i) => (i > 0 && PARTICULAS.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1))).join(" ");
}

/** Divide uma linha de CSV (vírgula ou ponto e vírgula; aspas simples de campo). */
function campos(l: string, sep: string): string[] {
  const out: string[] = []; let cur = "", asp = false;
  for (let i = 0; i < l.length; i++) {
    const c = l[i];
    if (asp) { if (c === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') asp = false; else cur += c; }
    else if (c === '"') asp = true; else if (c === sep) { out.push(cur); cur = ""; } else cur += c;
  }
  out.push(cur); return out.map((x) => x.trim());
}

export function lerCsv(texto: string): { linhas: Linha[]; rejeitadas: Rejeitada[] } {
  const ls = texto.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const rejeitadas: Rejeitada[] = [], linhas: Linha[] = [];
  if (!ls.length) return { linhas, rejeitadas };
  const sep = (ls[0].match(/;/g)?.length ?? 0) > (ls[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const cab = campos(ls[0], sep).map((c) => c.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""));
  const ix = { nome: cab.indexOf("nome"), serie: cab.indexOf("serie"), turma: cab.indexOf("turma") };
  if (ix.nome < 0 || ix.serie < 0) { rejeitadas.push({ linha: 1, motivo: "cabeçalho precisa ter as colunas nome e serie (turma é opcional)" }); return { linhas, rejeitadas }; }
  ls.slice(1).forEach((l, k) => {
    const c = campos(l, sep), n = k + 2;
    const nome = nomeBonito(c[ix.nome] ?? ""), serie = Number(c[ix.serie]);
    let turma = ix.turma >= 0 ? (c[ix.turma] ?? "").trim() : "";
    if (nome.length < 3) return void rejeitadas.push({ linha: n, motivo: "nome inválido" });
    if (!Number.isInteger(serie) || serie < 1 || serie > 12) return void rejeitadas.push({ linha: n, motivo: "série inválida (use 1 a 12)" });
    if (!turma) turma = `${serie} ano`;
    if (gradeFromName(turma) !== serie) return void rejeitadas.push({ linha: n, motivo: `a turma "${turma}" não indica a série ${serie}` });
    linhas.push({ nome, serie, turma });
  });
  return { linhas, rejeitadas };
}

const esc = (v: string) => { const s = /^[=+\-@\t\r]/.test(v) ? "'" + v : v; return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

async function lerEntrada(): Promise<string> {
  const partes: Buffer[] = [];
  for await (const p of process.stdin) partes.push(p as Buffer);
  return Buffer.concat(partes).toString("utf8");
}

async function main() {
  const executar = process.argv.includes("--executar");
  const { linhas, rejeitadas } = lerCsv(await lerEntrada());
  const prof = await q<{ id: number }>("SELECT id FROM teachers ORDER BY id");
  if (prof.length !== 1) { console.error(`Esperava exatamente 1 professor; há ${prof.length}. Nada foi feito.`); process.exit(2); }
  const ja = new Set<string>(); let repetidos = 0;
  for (const l of linhas) {
    const chave = l.nome.toLowerCase() + "|" + l.turma.toLowerCase();
    const noBanco = await one("SELECT 1 FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE lower(s.full_name)=$1 AND lower(COALESCE(c.name,''))=$2", [l.nome.toLowerCase(), l.turma.toLowerCase()]);
    if (ja.has(chave) || noBanco) repetidos++;
    ja.add(chave);
  }
  const turmas = [...new Set(linhas.map((l) => l.turma))];
  const existentes = await q<{ name: string }>("SELECT name FROM classes WHERE name = ANY($1::text[])", [turmas]);
  console.error(`${executar ? "GRAVAR" : "SIMULAÇÃO (nada será gravado)"}: ${linhas.length} linha(s) válida(s), ${rejeitadas.length} rejeitada(s), ${repetidos} já cadastrada(s)/repetida(s).`);
  console.error(`Turmas: ${turmas.map((t) => `"${t}" (${existentes.some((e) => e.name === t) ? "já existe" : "será criada"})`).join(", ") || "nenhuma"}.`);
  for (const r of rejeitadas) console.error(`  linha ${r.linha}: ${r.motivo}`);
  if (!executar) {
    // pré-visualização dos usuários (sem nomes e sem PIN)
    const usados = new Set<string>(); const previa: string[] = [];
    for (const l of linhas) {
      let u = await makeUsername(l.nome); let i = 1; const base = u.replace(/\d+$/, "");
      while (usados.has(u)) u = `${base}${++i}`;
      usados.add(u); previa.push(u);
    }
    console.error(`Usuários que seriam criados: ${previa.join(", ")}`);
    console.error("Para gravar, rode de novo com --executar (as credenciais saem pela saída padrão).");
    await closePool(); return;
  }
  const r = await createStudents(linhas.map((l) => ({ name: l.nome, className: l.turma })), prof[0].id);
  console.error(`Criados: ${r.created.length}. Ignorados: ${r.skipped.length}${r.skipped.length ? " (" + r.skipped.map((s) => s.reason).join("; ") + ")" : ""}.`);
  process.stdout.write("﻿" + ["Aluno;Turma;Usuário;PIN", ...r.created.map((c) => [c.name, c.className, c.username, c.pin].map(esc).join(";"))].join("\r\n") + "\r\n");
  await closePool();
}

if (process.argv[1]?.endsWith("importar-cli.js") || process.argv[1]?.endsWith("importar-cli.ts")) main().catch((e) => { console.error("Erro:", (e as Error).message); process.exit(1); });
