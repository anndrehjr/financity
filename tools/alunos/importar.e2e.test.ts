// Importação de ponta a ponta contra um banco de DESENVOLVIMENTO isolado (fc_imp), com alunos 100% fictícios.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import pg from "pg";

const ADMIN = process.env.PG_ADMIN_URL || "postgres://financity_dev:dev-local-only@127.0.0.1:54329/postgres";
const URL_DB = ADMIN.replace(/\/postgres$/, "/fc_imp");
const raiz = path.resolve(__dirname, "..", "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fc-import-"));
const csv = path.join(tmp, "alunos.csv");
const env = { ...process.env, DATABASE_URL: URL_DB, GATEWAY_SECRET: "segredo-de-teste-do-gateway-com-mais-de-32-caracteres" };
const NOMES = ["ZEFIRO TESTEIRO", "ORQUIDEA FICTICIA SOUZA", "QUIRINO DE FANTASIA"];

function rodar(arq: string, ...flags: string[]) {
  return spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["tsx", "tools/alunos/importar.ts", process.platform === "win32" ? `"${arq}"` : arq, "--local", ...flags], { cwd: raiz, env, encoding: "utf8", shell: process.platform === "win32" });
}
const db = async <T,>(sql: string) => { const c = new pg.Client(URL_DB); await c.connect(); try { return (await c.query(sql)).rows as T[]; } finally { await c.end(); } };

describe("importar.ts (local)", () => {
  before(async () => {
    const a = new pg.Client(ADMIN); await a.connect();
    await a.query("DROP DATABASE IF EXISTS fc_imp WITH (FORCE)"); await a.query("CREATE DATABASE fc_imp"); await a.end();
    process.env.DATABASE_URL = URL_DB;
    const { migrate } = await import("../../apps/api/src/migrate.js"); await migrate();
    const { closePool } = await import("../../apps/api/src/lib/db.js");
    await db("INSERT INTO teachers(username,name,password_hash) VALUES ('prof.i','Prof I','x')");
    await closePool();
    fs.writeFileSync(csv, "nome,serie,turma\n" + NOMES.map((n) => `${n},7,`).join("\n") + "\n");
  });
  after(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it("simulação (padrão): não grava nada, não cria arquivo e não imprime nomes", async () => {
    const r = rodar(csv);
    assert.equal(r.status, 0, r.stderr);
    assert.equal((await db<{ c: number }>("SELECT COUNT(*)::int c FROM students"))[0].c, 0);
    assert.ok(!fs.readdirSync(tmp).some((f) => f.endsWith(".html")));
    assert.ok(/3 linha\(s\) válida\(s\)/.test(r.stderr));
    for (const n of NOMES) assert.ok(!(r.stdout + r.stderr).toUpperCase().includes(n));
  });

  it("recusa CSV dentro do repositório", () => {
    const dentro = path.join(raiz, "dados-alunos", "teste-ficticio.csv");
    fs.mkdirSync(path.dirname(dentro), { recursive: true }); fs.writeFileSync(dentro, "nome,serie,turma\nFULANO TESTE,7,\n");
    try { const r = rodar(dentro, "--gravar"); assert.equal(r.status, 2); assert.match(r.stderr, /dentro do reposit/); } finally { fs.rmSync(dentro, { force: true }); }
  });

  it("--gravar: cria os alunos com série 7, gera cartões na pasta do CSV e não imprime nomes nem senhas", async () => {
    const r = rodar(csv, "--gravar");
    assert.equal(r.status, 0, r.stderr);
    const html = path.join(tmp, "credenciais-7ano.html");
    assert.ok(fs.existsSync(html));
    const alunos = await db<{ serie: number; grade: number; username: string; turma: string }>("SELECT s.serie, c.grade, s.username, c.name turma FROM students s JOIN classes c ON c.id=s.class_id");
    assert.equal(alunos.length, 3); assert.ok(alunos.every((a) => a.serie === 7 && a.grade === 7 && a.turma === "7 ano"));
    const conteudo = fs.readFileSync(html, "utf8");
    for (const a of alunos) assert.ok(conteudo.includes(a.username));
    const pins = [...conteudo.matchAll(/class="mono pin">(\d{6})</g)].map((m) => m[1]);
    assert.equal(pins.length, 3); assert.equal(new Set(pins).size, 3);
    const saida = r.stdout + r.stderr;
    for (const n of NOMES) assert.ok(!saida.toUpperCase().includes(n), "nome apareceu no terminal");
    for (const p of pins) assert.ok(!saida.includes(p), "senha apareceu no terminal");
    for (const a of alunos) assert.ok(!saida.includes(a.username), "usuário apareceu no terminal");
    const log = await db<{ detail: string }>("SELECT detail FROM admin_log");
    for (const l of log) { for (const p of pins) assert.ok(!(l.detail ?? "").includes(p)); for (const n of NOMES) assert.ok(!(l.detail ?? "").toUpperCase().includes(n)); }
  });

  it("rodar de novo pula quem já existe (sem duplicar e sem gerar novos cartões)", async () => {
    const antes = fs.readFileSync(path.join(tmp, "credenciais-7ano.html"), "utf8");
    const r = rodar(csv, "--gravar");
    assert.equal(r.status, 0, r.stderr);
    assert.equal((await db<{ c: number }>("SELECT COUNT(*)::int c FROM students"))[0].c, 3);
    assert.equal(fs.readFileSync(path.join(tmp, "credenciais-7ano.html"), "utf8"), antes);
  });
});
