// Presença dos alunos (entrada, on-line, saída) em banco isolado "fc_presenca". Dados 100% fictícios.
import { before, after, describe, it } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import pg from "pg";

const ADMIN = process.env.PG_ADMIN_URL || "postgres://financity_dev:dev-local-only@127.0.0.1:54329/postgres";
process.env.DATABASE_URL = ADMIN.replace(/\/postgres$/, "/fc_presenca");
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
  const headers: Record<string, string> = { ...signRequest({ secret: SECRET, method, pathAndQuery: path, ip: `10.50.${Math.floor(++n / 250)}.${n % 250}`, body }) };
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

describe("presença dos alunos", () => {
  let profA: string, profB: string;
  let a1: { id: number; username: string }, a2: { id: number; username: string }, a3: { id: number; username: string };

  before(async () => {
    const c = new pg.Client(ADMIN); await c.connect();
    await c.query("DROP DATABASE IF EXISTS fc_presenca WITH (FORCE)"); await c.query("CREATE DATABASE fc_presenca"); await c.end();
    await migrate(); await seedContent(); await seedCulminancia(8);
    const ta = await one<{ id: number }>("INSERT INTO teachers(username,name,password_hash) VALUES($1,$2,$3) RETURNING id", ["prof.a", "Prof A", await bcrypt.hash("Senha-Forte-1!", 4)]);
    const tb = await one<{ id: number }>("INSERT INTO teachers(username,name,password_hash) VALUES($1,$2,$3) RETURNING id", ["prof.b", "Prof B", await bcrypt.hash("Senha-Forte-2!", 4)]);
    const r = await createStudents([{ name: "Aluno Um Fictício", className: "8 ano", pin: "483921" }, { name: "Aluno Dois Fictício", className: "8 ano", pin: "719364" }, { name: "Aluno Tres Fictício", className: "8 ano", pin: "256013" }], ta!.id);
    [a1, a2, a3] = r.created as any;
    await createStudents([{ name: "Aluno Do Outro Professor", className: "8 B", pin: "902417" }], tb!.id);
    profA = await login("prof.a", "Senha-Forte-1!"); profB = await login("prof.b", "Senha-Forte-2!");
  });
  after(async () => { await closePool(); });

  const quadro = async (cookie = profA) => (await call("GET", "/api/admin/presence?scope=real", { cookie })).json as any[];
  const linha = async (id: number) => (await quadro()).find((r) => r.id === id);

  it("antes de qualquer entrada: ninguém on-line, sem horários, tempo zero", async () => {
    const r = await linha(a1.id);
    assert.equal(r.online, false); assert.equal(r.lastEntry, null); assert.equal(r.lastExit, null); assert.equal(r.totalSeconds, 0); assert.equal(r.sessions, 0);
  });

  it("login do aluno registra a ENTRADA e ele aparece ON-LINE (primeiro da lista)", async () => {
    const s = await login(a1.username, "483921");
    assert.ok(s);
    const r = await linha(a1.id);
    assert.equal(r.online, true); assert.ok(r.lastEntry); assert.equal(r.lastExit, null); assert.equal(r.sessions, 1);
    assert.equal((await quadro())[0].id, a1.id);
  });

  it("sinal de vida mantém on-line e soma tempo; só aluno logado pode enviar", async () => {
    const s = await login(a2.username, "719364");
    await q("UPDATE presence SET started_at=now()-interval '10 minutes', last_seen_at=now()-interval '20 seconds' WHERE student_id=$1", [a2.id]);
    assert.equal((await call("POST", "/api/presence/ping", { cookie: s })).status, 200);
    const r = await linha(a2.id);
    assert.equal(r.online, true); assert.equal(r.sessions, 1);
    assert.ok(r.totalSeconds >= 595 && r.totalSeconds <= 620, `tempo ~10 min, veio ${r.totalSeconds}`);
    assert.ok(r.todaySeconds >= 595, "tempo de hoje inclui a entrada de hoje");
    assert.equal((await call("POST", "/api/presence/ping")).status, 401);
    assert.equal((await call("POST", "/api/presence/ping", { cookie: profA })).status, 403);
  });

  it("sem sinal por mais de 2 min: fica OFF-LINE e a saída é o último sinal (fechou a página)", async () => {
    await q("UPDATE presence SET last_seen_at=now()-interval '5 minutes', started_at=now()-interval '15 minutes' WHERE student_id=$1", [a2.id]);
    const r = await linha(a2.id);
    assert.equal(r.online, false); assert.ok(r.lastExit);
    assert.ok(Math.abs(new Date(r.lastExit).getTime() - (Date.now() - 5 * 60_000)) < 15_000, "saída = último sinal");
    assert.ok(r.totalSeconds >= 595 && r.totalSeconds <= 620, "tempo = entrada até o último sinal (10 min)");
    const h = (await call("GET", `/api/admin/presence/${a2.id}`, { cookie: profA })).json;
    assert.equal(h.length, 1); assert.equal(h[0].online, false); assert.equal(h[0].reason, "fechou a página");
  });

  it("voltar após longo silêncio (mesma sessão) abre NOVA entrada, sem somar o intervalo parado", async () => {
    const s = await login(a2.username, "719364"); // nova sessão: nova entrada
    await q("UPDATE presence SET last_seen_at=now()-interval '30 minutes', started_at=now()-interval '40 minutes' WHERE student_id=$1 AND ended_at IS NULL AND last_seen_at > now()-interval '1 minute'", [a2.id]);
    await call("POST", "/api/presence/ping", { cookie: s });
    const h = (await call("GET", `/api/admin/presence/${a2.id}`, { cookie: profA })).json;
    assert.equal(h.length, 3);
    assert.equal(h[0].online, true);
    assert.ok(h.some((x: any) => x.reason === "inatividade"));
    const r = await linha(a2.id);
    assert.ok(r.totalSeconds < 25 * 60, `o intervalo parado não conta como tempo na plataforma (veio ${r.totalSeconds}s)`);
  });

  it("sessão anterior à função (sem registro) ganha entrada no primeiro sinal", async () => {
    const s = await login(a3.username, "256013");
    await q("DELETE FROM presence WHERE student_id=$1", [a3.id]);
    await call("POST", "/api/presence/ping", { cookie: s });
    assert.equal((await linha(a3.id)).online, true);
  });

  it("botão Sair registra a SAÍDA na hora e o aluno fica off-line", async () => {
    await q("UPDATE presence SET last_seen_at=now()-interval '10 minutes' WHERE student_id=$1", [a1.id]); // a entrada do 1º teste ficou parada
    const s = await login(a1.username, "483921");
    assert.equal((await linha(a1.id)).online, true);
    await call("POST", "/api/auth/logout", { cookie: s });
    const r = await linha(a1.id);
    assert.equal(r.online, false); assert.ok(r.lastExit);
    const h = (await call("GET", `/api/admin/presence/${a1.id}`, { cookie: profA })).json;
    assert.equal(h[0].reason, "saiu"); assert.equal(h[0].online, false);
  });

  it("desativar o aluno encerra a presença dele", async () => {
    assert.equal((await linha(a3.id)).online, true);
    await call("PATCH", `/api/admin/students/${a3.id}`, { cookie: profA, body: { action: "deactivate" } });
    assert.equal((await linha(a3.id)).online, false);
  });

  it("privacidade: outro professor não vê esses alunos nem o histórico; aluno e visitante não acessam o quadro", async () => {
    assert.equal((await quadro(profB)).some((r) => [a1.id, a2.id, a3.id].includes(r.id)), false);
    assert.equal((await call("GET", `/api/admin/presence/${a1.id}`, { cookie: profB })).status, 404);
    const aluno = await login(a2.username, "719364");
    assert.equal((await call("GET", "/api/admin/presence", { cookie: aluno })).status, 403);
    assert.equal((await call("GET", "/api/admin/presence")).status, 401);
    assert.equal((await call("GET", `/api/admin/presence/${a1.id}`)).status, 401);
  });

  it("excluir o aluno apaga também o histórico de presença dele", async () => {
    assert.ok(await cont("SELECT COUNT(*)::int c FROM presence WHERE student_id=$1", [a2.id]) > 0);
    const r = await call("PATCH", `/api/admin/students/${a2.id}`, { cookie: profA, body: { action: "delete", confirm: true } });
    assert.equal(r.status, 200);
    assert.equal(await cont("SELECT COUNT(*)::int c FROM presence WHERE student_id=$1", [a2.id]), 0);
  });
});
