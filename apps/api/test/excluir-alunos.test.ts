// Exclusão definitiva de alunos (LGPD) em banco isolado "fc_del". Dados 100% fictícios.
import { before, after, describe, it } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import pg from "pg";

const ADMIN = process.env.PG_ADMIN_URL || "postgres://financity_dev:dev-local-only@127.0.0.1:54329/postgres";
process.env.DATABASE_URL = ADMIN.replace(/\/postgres$/, "/fc_del");
process.env.GATEWAY_SECRET = "segredo-de-teste-do-gateway-com-mais-de-32-caracteres";
delete process.env.REQUIRE_SIGNATURE;

const { signRequest } = await import("@financity/gateway-sign");
const { app } = await import("../src/app.js");
const { migrate } = await import("../src/migrate.js");
const { seedContent } = await import("../src/lib/seed-content.js");
const { seedCulminancia } = await import("../src/lib/seed-culminancia.js");
const { createStudents } = await import("../src/lib/students.js");
const { closePool, one, q } = await import("../src/lib/db.js");
const SECRET = process.env.GATEWAY_SECRET!;

let n = 0;
async function call(method: string, path: string, opts: { body?: unknown; cookie?: string } = {}) {
  const body = opts.body === undefined ? "" : JSON.stringify(opts.body);
  const headers: Record<string, string> = { ...signRequest({ secret: SECRET, method, pathAndQuery: path, ip: `10.40.${Math.floor(++n / 250)}.${n % 250}`, body }) };
  if (body) headers["content-type"] = "application/json";
  if (opts.cookie) headers.cookie = opts.cookie;
  const res = await app.request(path, { method, headers, body: body || undefined });
  const text = await res.text();
  let json: any = null; try { json = JSON.parse(text); } catch { /* não é JSON */ }
  return { status: res.status, json, text, headers: res.headers };
}
const cookieOf = (r: { headers: Headers }) => (r.headers.get("set-cookie") || "").split(";")[0];
const login = async (u: string, p: string) => cookieOf(await call("POST", "/api/auth/login", { body: { username: u, password: p } }));
const cont = async (sql: string, v: unknown[] = []) => (await one<{ c: number }>(sql, v))!.c;

describe("excluir alunos", () => {
  let profA: string, profB: string;
  let a1: { id: number; username: string }, a2: { id: number; username: string }, a3: { id: number; username: string };

  before(async () => {
    const c = new pg.Client(ADMIN); await c.connect();
    await c.query("DROP DATABASE IF EXISTS fc_del WITH (FORCE)"); await c.query("CREATE DATABASE fc_del"); await c.end();
    await migrate(); await seedContent(); await seedCulminancia(8);
    const ta = await one<{ id: number }>("INSERT INTO teachers(username,name,password_hash) VALUES($1,$2,$3) RETURNING id", ["prof.a", "Prof A", await bcrypt.hash("Senha-Forte-1!", 4)]);
    await one("INSERT INTO teachers(username,name,password_hash) VALUES($1,$2,$3) RETURNING id", ["prof.b", "Prof B", await bcrypt.hash("Senha-Forte-2!", 4)]);
    const tb = await one<{ id: number }>("SELECT id FROM teachers WHERE username='prof.b'");
    const r = await createStudents([{ name: "Aluno Um Fictício", className: "8 ano", pin: "483921" }, { name: "Aluno Dois Fictício", className: "8 ano", pin: "719364" }, { name: "Aluno Tres Fictício", className: "8 ano", pin: "256013" }], ta!.id);
    [a1, a2, a3] = r.created as any;
    await createStudents([{ name: "Aluno Do Outro Professor", className: "8 B", pin: "902417" }], tb!.id);
    profA = await login("prof.a", "Senha-Forte-1!"); profB = await login("prof.b", "Senha-Forte-2!");
    // o aluno 1 joga: tentativa + respostas + sessão + histórico
    const s1 = await login(a1.username, "483921");
    const me = await call("GET", "/api/me", { cookie: s1 }); const id = me.json.maps[0].id;
    await call("POST", `/api/game/${id}/start`, { cookie: s1 });
    const st = await call("GET", `/api/game/${id}/state`, { cookie: s1 });
    await call("POST", `/api/game/${id}/answer`, { cookie: s1, body: { questionId: st.json.question.id, optionId: st.json.question.options[0].id } });
    await call("PATCH", `/api/admin/students/${a1.id}`, { cookie: profA, body: { action: "reset_pin", pin: "483921" } }); // gera linha no histórico do aluno 1
  });
  after(async () => { await closePool(); });

  it("exige confirmação: sem confirm nada é apagado", async () => {
    const r = await call("PATCH", `/api/admin/students/${a1.id}`, { cookie: profA, body: { action: "delete" } });
    assert.equal(r.status, 400);
    assert.equal(await cont("SELECT COUNT(*)::int c FROM students WHERE id=$1", [a1.id]), 1);
  });

  it("outro professor NÃO consegue excluir (404) e nada é apagado", async () => {
    const r = await call("PATCH", `/api/admin/students/${a1.id}`, { cookie: profB, body: { action: "delete", confirm: true } });
    assert.equal(r.status, 404);
    assert.equal(await cont("SELECT COUNT(*)::int c FROM students WHERE id=$1", [a1.id]), 1);
    const lote = await call("POST", "/api/admin/students/delete", { cookie: profB, body: { ids: [a1.id], confirm: true } });
    assert.equal(lote.status, 404);
  });

  it("aluno e visitante não excluem ninguém", async () => {
    const aluno = await login(a2.username, "719364");
    assert.equal((await call("PATCH", `/api/admin/students/${a1.id}`, { cookie: aluno, body: { action: "delete", confirm: true } })).status, 403);
    assert.equal((await call("PATCH", `/api/admin/students/${a1.id}`, { body: { action: "delete", confirm: true } })).status, 401);
  });

  it("exclui o aluno 1: some cadastro, tentativas, respostas, sessões e histórico; os outros ficam intactos; ele não entra mais", async () => {
    assert.ok(await cont("SELECT COUNT(*)::int c FROM answers a JOIN attempts t ON t.id=a.attempt_id WHERE t.student_id=$1", [a1.id]) > 0);
    const r = await call("PATCH", `/api/admin/students/${a1.id}`, { cookie: profA, body: { action: "delete", confirm: true } });
    assert.equal(r.status, 200); assert.equal(r.json.deleted, 1);
    assert.equal(await cont("SELECT COUNT(*)::int c FROM students WHERE id=$1", [a1.id]), 0);
    assert.equal(await cont("SELECT COUNT(*)::int c FROM attempts WHERE student_id=$1", [a1.id]), 0);
    assert.equal(await cont("SELECT COUNT(*)::int c FROM sessions WHERE role='student' AND user_id=$1", [a1.id]), 0);
    assert.equal(await cont("SELECT COUNT(*)::int c FROM admin_log WHERE student_id=$1", [a1.id]), 0);
    assert.equal(await cont("SELECT COUNT(*)::int c FROM students WHERE id IN ($1,$2)", [a2.id, a3.id]), 2);
    const tenta = await call("POST", "/api/auth/login", { body: { username: a1.username, password: "483921" } });
    assert.equal(tenta.status, 401);
    // a ação fica registrada, sem nome, usuário nem PIN
    const log = await q<{ detail: string }>("SELECT detail FROM admin_log WHERE action='excluir_aluno'");
    assert.equal(log.length, 1); assert.ok(!/Aluno Um|483921/.test(log[0].detail + a1.username) || !log[0].detail.includes(a1.username));
    assert.ok(!log[0].detail.includes("483921") && !log[0].detail.includes("Fictício"));
    assert.equal((await call("PATCH", `/api/admin/students/${a1.id}`, { cookie: profA, body: { action: "delete", confirm: true } })).status, 404); // já não existe
  });

  it("exclusão em lote: tudo-ou-nada (um id alheio cancela tudo) e, com ids válidos, exclui todos", async () => {
    const alheio = (await one<{ id: number }>("SELECT id FROM students WHERE full_name='Aluno Do Outro Professor'"))!.id;
    const ruim = await call("POST", "/api/admin/students/delete", { cookie: profA, body: { ids: [a2.id, alheio], confirm: true } });
    assert.equal(ruim.status, 404);
    assert.equal(await cont("SELECT COUNT(*)::int c FROM students WHERE id=$1", [a2.id]), 1);
    assert.equal((await call("POST", "/api/admin/students/delete", { cookie: profA, body: { ids: [a2.id, a3.id] } })).status, 400);
    const ok = await call("POST", "/api/admin/students/delete", { cookie: profA, body: { ids: [a2.id, a3.id], confirm: true } });
    assert.equal(ok.status, 200); assert.equal(ok.json.deleted, 2);
    assert.equal(await cont("SELECT COUNT(*)::int c FROM students WHERE id=ANY($1::int[])", [[a2.id, a3.id]]), 0);
    assert.equal(await cont("SELECT COUNT(*)::int c FROM students WHERE id=$1", [alheio]), 1); // o aluno do outro professor continua
  });

  it("depois de excluir, dá para cadastrar de novo o mesmo nome (sem conflito)", async () => {
    const ta = (await one<{ id: number }>("SELECT id FROM teachers WHERE username='prof.a'"))!.id;
    const r = await createStudents([{ name: "Aluno Um Fictício", className: "8 ano" }], ta);
    assert.equal(r.created.length, 1);
  });
});
