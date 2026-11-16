// Validação funcional de uma API já no ar (ex.: ensaio na VPS via túnel), SOMENTE LEITURA + login.
//   API_BASE=http://127.0.0.1:58787 GATEWAY_SECRET=... CREDS_FILE=<credenciais-professor.txt> npx tsx scripts/staging-check.ts
// Imprime apenas totais e resultados de verificação (nunca nomes, usuários ou senhas).
import fs from "fs";
import { signRequest } from "@financity/gateway-sign";

const BASE = process.env.API_BASE!, SECRET = process.env.GATEWAY_SECRET!;
const creds = Object.fromEntries(fs.readFileSync(process.env.CREDS_FILE!, "utf8").split("\n").filter((l) => l.includes(":")).map((l) => l.split(/:\s*/)));
let pass = 0, fail = 0;
const ok = (c: boolean, n: string, extra = "") => { c ? pass++ : fail++; console.log(c ? "  ✔" : "  ✘ FALHOU:", n, c ? "" : extra); };

async function call(method: string, path: string, body?: unknown, cookie?: string, signed = true) {
  const raw = body === undefined ? "" : JSON.stringify(body);
  const headers: Record<string, string> = signed ? signRequest({ secret: SECRET, method, pathAndQuery: path, ip: "198.51.100.7", body: raw }) : {};
  if (raw) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = cookie;
  const r = await fetch(BASE + path, { method, headers, body: raw || undefined });
  const t = await r.text(); let j: any = null; try { j = JSON.parse(t); } catch { /* texto */ }
  return { status: r.status, json: j, text: t, setCookie: (r.headers.getSetCookie?.() ?? [])[0]?.split(";")[0] ?? "" };
}

console.log("API em", BASE.replace(/\/\/.*@/, "//"));
let r = await fetch(BASE + "/healthz"); ok(r.status === 200, "healthz público responde 200");
r = await fetch(BASE + "/api/session"); ok(r.status === 401, "chamada direta SEM assinatura é recusada (401)");
let x = await call("GET", "/api/session", undefined, undefined, false); ok(x.status === 401, "sem cabeçalhos de assinatura: 401");

x = await call("POST", "/api/auth/login", { username: creds["Usuário"], password: creds["Senha"] });
if (x.status !== 200) { console.log("  ⚠ login do professor recusado (HTTP", x.status + "): a senha do arquivo pode ter sido trocada. Validações com login foram puladas."); process.exit(fail ? 1 : 3); }
ok(x.json.role === "teacher", "login do professor com a credencial atual funciona sobre os dados migrados");
const T = x.setCookie;
x = await call("GET", "/api/session", undefined, T); ok(x.json.session?.role === "teacher", "sessão reconhecida");
x = await call("GET", "/api/admin/classes", undefined, T); ok(Array.isArray(x.json) && x.json.length >= 1 && x.json.every((c: any) => c.grade !== null), `turmas do professor com série definida (${x.json?.length})`);
x = await call("GET", "/api/admin/students", undefined, T); const nStud = x.json?.length;
ok(nStud === 19 || nStud === 18, `lista de alunos reais: ${nStud} (esperado 18 + o aluno de teste, conforme escopo)`);
x = await call("GET", "/api/admin/dashboard", undefined, T);
ok(x.status === 200 && x.json.cards.completed === 1 && x.json.max === 25 && x.json.assessment.grade === 8, `painel: ${x.json?.cards?.totalStudents} alunos, ${x.json?.cards?.completed} concluída(s), máximo ${x.json?.max}, avaliação do ${x.json?.assessment?.grade}º ano`);
x = await call("GET", "/api/admin/assessments", undefined, T); ok(x.status === 200 && x.json.length === 4, "4 avaliações do 8º ano listadas");
x = await call("GET", "/api/admin/pins", undefined, T); ok(x.status === 200, `contador de alunos sem PIN: ${x.json?.pending}`);
x = await call("GET", "/api/admin/report", undefined, T); ok(x.status === 200 && /8º ANO/.test(x.json.title), "relatório da turma gerado (título com a série)");
x = await call("GET", "/api/admin/export?type=alunos", undefined, T); ok(x.status === 200 && x.text.split("\n").length > 5, "exportação CSV gerada");
x = await call("POST", "/api/auth/logout", {}, T); ok(x.status === 200, "logout");
x = await call("GET", "/api/admin/students", undefined, T); ok(x.status === 401, "sessão encerrada não acessa mais o painel");

console.log(`\nResultado: ${pass} ok, ${fail} falhas`);
process.exit(fail ? 1 : 0);
