// Importa alunos de um CSV (nome,serie,turma) e gera os cartões de credenciais para imprimir.
//
//   npx tsx tools/alunos/importar.ts CAMINHO.csv --local   [--gravar]   → contra o banco de DESENVOLVIMENTO (DATABASE_URL)
//   npx tsx tools/alunos/importar.ts CAMINHO.csv --vps     [--gravar]   → contra a VPS (precisa de FINANCITY_SSH; só com autorização)
//
// - Padrão = SIMULAÇÃO (não grava nada). Só grava com --gravar.
// - O CSV tem que estar FORA do repositório (a ferramenta recusa o contrário). Ele é lido aqui e passado pela entrada padrão:
//   nunca é copiado para a VPS.
// - Pula quem já existe (pode rodar de novo sem duplicar). Série vem do CSV; turma vazia vira "<série> ano".
// - Saída: credenciais-<série>ano.html na MESMA pasta do CSV (fora do repositório). No terminal só aparecem contagens.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lerCredenciais, nomeDoArquivo, renderizarCredenciais } from "./credenciais";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const csvPath = args.find((a) => !a.startsWith("--"));
const gravar = args.includes("--gravar");
const alvo = args.includes("--vps") ? "vps" : "local";
const site = args.includes("--site") ? args[args.indexOf("--site") + 1] : "https://financity-eta.vercel.app";

function sair(msg: string, code = 2): never { console.error(msg); process.exit(code); }
if (!csvPath) sair("Uso: npx tsx tools/alunos/importar.ts CAMINHO.csv [--local|--vps] [--gravar]");
const abs = path.resolve(csvPath!);
const rel = path.relative(raiz, abs);
if (!rel.startsWith("..") && !path.isAbsolute(rel)) sair("RECUSADO: o CSV está dentro do repositório. Guarde-o em outra pasta (dados de menores de idade nunca ficam no repositório).");
if (!fs.existsSync(abs)) sair("Arquivo não encontrado.");
const csv = fs.readFileSync(abs);

let r;
if (alvo === "vps") {
  const ssh = process.env.FINANCITY_SSH;
  if (!ssh) sair("Defina FINANCITY_SSH (ex.: \"-p <porta-ssh> -i C:\\\\caminho\\\\chave usuario@host\") para usar --vps.");
  r = spawnSync("ssh", [...ssh!.split(/\s+/).filter(Boolean), "docker", "exec", "-i", "financity-api-1", "node", "dist/importar-cli.js", ...(gravar ? ["--executar"] : [])], { input: csv, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
} else {
  r = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["tsx", path.join("apps", "api", "src", "importar-cli.ts"), ...(gravar ? ["--executar"] : [])],
    { cwd: raiz, input: csv, encoding: "utf8", shell: process.platform === "win32", maxBuffer: 20 * 1024 * 1024 });
}
if (r.stderr) process.stderr.write(r.stderr); // só contagens e motivos de rejeição (o importador não imprime nomes nem senhas)
if (r.status !== 0) sair(`A importação falhou (código ${r.status}). Nada foi gerado.`, 1);

if (!gravar) { console.error("Simulação concluída: nada foi gravado. Para gravar, rode de novo com --gravar."); process.exit(0); }
const creds = lerCredenciais(r.stdout);
if (!creds.length) { console.error("Nenhum aluno novo foi criado (todos já existiam?): nenhum cartão gerado."); process.exit(0); }
const arquivo = path.join(path.dirname(abs), nomeDoArquivo(creds));
fs.writeFileSync(arquivo, renderizarCredenciais(creds, site), { mode: 0o600 });
console.error(`${creds.length} aluno(s) criado(s). Cartões salvos em: ${arquivo}`);
console.error("Imprima, recorte e depois APAGUE esse arquivo e o CSV.");
