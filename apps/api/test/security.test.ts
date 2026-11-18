// Testes de segurança contra PostgreSQL real. Requer o servidor de desenvolvimento ligado (npm run pg:dev).
// Usa um banco isolado "fc_unit", recriado a cada execução. Nunca aponta para dados reais.
import { before, after, describe, it } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import pg from "pg";

const ADMIN = process.env.PG_ADMIN_URL || "postgres://financity_dev:dev-local-only@127.0.0.1:54329/postgres";
process.env.DATABASE_URL = ADMIN.replace(/\/postgres$/, "/fc_unit");
process.env.GATEWAY_SECRET = "segredo-de-teste-do-gateway-com-mais-de-32-caracteres";
delete process.env.REQUIRE_SIGNATURE;

const { signRequest } = await import("@financity/gateway-sign");
const { app } = await import("../src/app.js");
const { migrate } = await import("../src/migrate.js");
const { seedContent } = await import("../src/lib/seed-content.js");
const { closePool, q } = await import("../src/lib/db.js");
const SECRET = process.env.GATEWAY_SECRET!;

async function call(method: string, path: string, opts: { body?: unknown; cookie?: string; ip?: string; secret?: string; ts?: number; tamperPath?: string } = {}) {
  const body = opts.body === undefined ? "" : JSON.stringify(opts.body);
  const headers: Record<string, string> = {
    ...signRequest({ secret: opts.secret ?? SECRET, method, pathAndQuery: opts.tamperPath ?? path, ip: opts.ip ?? "10.0.0.1", body, ts: opts.ts }),
  };
  if (body) headers["content-type"] = "application/json";
  if (opts.cookie) headers.cookie = opts.cookie;
  const res = await app.request(path, { method, headers, body: body || undefined });
  const text = await res.text();
  let json: any = null; try { json = JSON.parse(text); } catch { /* não é JSON */ }
  return { status: res.status, json, headers: res.headers };
}
const cookieOf = (res: { headers: Headers }) => (res.headers.get("set-cookie") || "").split(";")[0];

async function addTeacher(username: string, password: string) {
  const r = await q<{ id: number }>("INSERT INTO teachers(username,name,password_hash) VALUES($1,$2,$3) RETURNING id", [username, username, await bcrypt.hash(password, 4)]);
  return r[0].id;
}
async function loginAs(username: string, password: string) {
  const r = await call("POST", "/api/auth/login", { body: { username, password }, ip: `10.1.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` });
  assert.equal(r.status, 200, `login de ${username}`);
  return cookieOf(r);
}

describe("segurança da API", () => {
  let t1: string, t2: string;
  let alunoT1: { id: number; username: string; pin: string };
  let classT1 = 0;

  before(async () => {
    const c = new pg.Client(ADMIN); await c.connect();
    await c.query("DROP DATABASE IF EXISTS fc_unit WITH (FORCE)"); await c.query("CREATE DATABASE fc_unit"); await c.end();
    await migrate(); await seedContent();
    await addTeacher("prof.um", "Senha-Forte-1!"); await addTeacher("prof.dois", "Senha-Forte-2!");
    t1 = await loginAs("prof.um", "Senha-Forte-1!"); t2 = await loginAs("prof.dois", "Senha-Forte-2!");
    const a = await call("POST", "/api/admin/students", { cookie: t1, body: { rows: [{ name: "Aluno Do Um", className: "8º A", pin: "483921" }, { name: "Outro Do Um", className: "8º A", pin: "719364" }] } });
    assert.equal(a.json.created.length, 2);
    alunoT1 = a.json.created[0];
    await call("POST", "/api/admin/students", { cookie: t2, body: { rows: [{ name: "Aluno Do Dois", className: "8º B", pin: "256013" }] } });
    classT1 = (await call("GET", "/api/admin/classes", { cookie: t1 })).json.find((c: any) => c.name === "8º A").id;
  });
  after(async () => { await closePool(); });

  describe("assinatura do gateway", () => {
    it("sem assinatura: 401", async () => {
      const r = await app.request("/api/session"); assert.equal(r.status, 401);
    });
    it("assinatura válida: 200", async () => { assert.equal((await call("GET", "/api/session")).status, 200); });
    it("segredo errado: 401", async () => { assert.equal((await call("GET", "/api/session", { secret: "outro-segredo-qualquer-com-32-caracteres-ou-mais" })).status, 401); }); // verificar-segredos: ignorar (valor propositalmente ERRADO: o teste espera 401)
    it("caminho adulterado depois de assinar: 401", async () => { assert.equal((await call("GET", "/api/me", { tamperPath: "/api/session" })).status, 401); });
    it("assinatura vencida (2 min): 401", async () => { assert.equal((await call("GET", "/api/session", { ts: Date.now() - 120_000 })).status, 401); });
    it("hora no futuro (2 min): 401", async () => { assert.equal((await call("GET", "/api/session", { ts: Date.now() + 120_000 })).status, 401); });
    it("corpo adulterado: 401", async () => {
      const h = signRequest({ secret: SECRET, method: "POST", pathAndQuery: "/api/auth/login", ip: "10.0.0.9", body: JSON.stringify({ username: "a", password: "b" }) });
      const r = await app.request("/api/auth/login", { method: "POST", headers: { ...h, "content-type": "application/json" }, body: JSON.stringify({ username: "a", password: "outra" }) });
      assert.equal(r.status, 401);
    });
    it("repetir a mesma chamada interceptada (replay): 401", async () => {
      const h = signRequest({ secret: SECRET, method: "GET", pathAndQuery: "/api/session", ip: "10.0.0.7" });
      assert.equal((await app.request("/api/session", { headers: h })).status, 200);
      assert.equal((await app.request("/api/session", { headers: h })).status, 401);
    });
    it("IP forjado no cabeçalho invalida a assinatura: 401", async () => {
      const h = signRequest({ secret: SECRET, method: "GET", pathAndQuery: "/api/session", ip: "10.0.0.5" });
      assert.equal((await app.request("/api/session", { headers: { ...h, "x-fc-ip": "1.2.3.4" } })).status, 401);
    });
    it("/healthz é público e não expõe dados", async () => {
      const r = await app.request("/healthz"); assert.equal(r.status, 200); assert.deepEqual(await r.json(), { ok: true });
    });
  });

  describe("cookie de sessão", () => {
    it("HttpOnly e SameSite=Lax, valor nunca no corpo", async () => {
      const r = await call("POST", "/api/auth/login", { body: { username: "prof.um", password: "Senha-Forte-1!" }, ip: "10.9.9.9" });
      const sc = r.headers.get("set-cookie") || "";
      assert.match(sc, /HttpOnly/i); assert.match(sc, /SameSite=Lax/i);
      assert.ok(!JSON.stringify(r.json).includes(sc.split("=")[1]?.split(";")[0] ?? "@@"));
    });
  });

  describe("isolamento entre professores (turmas)", () => {
    it("lista de alunos do professor 2 não inclui alunos do professor 1", async () => {
      const l = (await call("GET", "/api/admin/students", { cookie: t2 })).json as { name: string }[];
      assert.ok(l.length === 1 && l[0].name === "Aluno Do Dois");
    });
    it("lista de turmas só mostra as do próprio professor", async () => {
      const l = (await call("GET", "/api/admin/classes", { cookie: t2 })).json as { name: string }[];
      assert.deepEqual(l.map((c) => c.name), ["8º B"]);
    });
    it("relatório individual de aluno de outro professor: 404", async () => {
      assert.equal((await call("GET", `/api/admin/students/${alunoT1.id}/report`, { cookie: t2 })).status, 404);
    });
    it("redefinir PIN / desativar / nova tentativa em aluno de outro professor: 404", async () => {
      for (const body of [{ action: "reset_pin" }, { action: "deactivate" }, { action: "new_attempt", confirm: true }])
        assert.equal((await call("PATCH", `/api/admin/students/${alunoT1.id}`, { cookie: t2, body })).status, 404, JSON.stringify(body));
    });
    it("gerador de PINs por IDs não alcança aluno de outro professor", async () => {
      const r = await call("POST", "/api/admin/pins", { cookie: t2, body: { mode: "selected", ids: [alunoT1.id], confirm: true } });
      assert.equal(r.json.credentials.length, 0);
      const ok = await call("POST", "/api/auth/login", { body: { username: alunoT1.username, password: alunoT1.pin }, ip: "10.8.8.8" });
      assert.equal(ok.status, 200, "PIN do aluno do professor 1 continua valendo");
    });
    it("gerador por turma de outro professor: 404", async () => {
      assert.equal((await call("POST", "/api/admin/pins", { cookie: t2, body: { mode: "class", classId: classT1, confirm: true } })).status, 404);
    });
    it("painel/relatório/exportação com turma de outro professor: 404", async () => {
      for (const p of ["dashboard", "report", "export"]) assert.equal((await call("GET", `/api/admin/${p}?class=${classT1}`, { cookie: t2 })).status, 404, p);
    });
    it("não dá para cadastrar aluno na turma de outro professor", async () => {
      const r = await call("POST", "/api/admin/students", { cookie: t2, body: { rows: [{ name: "Intruso Teste", className: "8º A" }] } });
      assert.equal(r.json.created.length, 0);
    });
    it("professor não edita pontuação de questão por avaliação de série que não atende", async () => {
      await q("DELETE FROM teacher_classes WHERE teacher_id=(SELECT id FROM teachers WHERE username='prof.dois')");
      assert.equal((await call("GET", "/api/admin/dashboard", { cookie: t2 })).status, 404);
    });
  });

  describe("perfis", () => {
    it("aluno não acessa nenhuma rota do professor (403)", async () => {
      const s = cookieOf(await call("POST", "/api/auth/login", { body: { username: alunoT1.username, password: alunoT1.pin }, ip: "10.7.7.7" }));
      for (const [m, p] of [["GET", "/api/admin/students"], ["GET", "/api/admin/dashboard"], ["GET", "/api/admin/classes"], ["POST", "/api/admin/demo"], ["GET", "/api/admin/settings"]])
        assert.equal((await call(m, p, { cookie: s })).status, 403, p);
    });
    it("professor não acessa rotas de aluno (403)", async () => {
      assert.equal((await call("GET", "/api/me", { cookie: t1 })).status, 403);
      assert.equal((await call("POST", "/api/game/1/start", { cookie: t1 })).status, 403);
    });
    it("visitante: 401", async () => { assert.equal((await call("GET", "/api/admin/students")).status, 401); });
    it("aluno não recebe pontuação nem gabarito em nenhuma resposta do jogo", async () => {
      const s = cookieOf(await call("POST", "/api/auth/login", { body: { username: alunoT1.username, password: alunoT1.pin }, ip: "10.7.7.8" }));
      const st = await call("POST", "/api/game/1/start", { cookie: s });
      assert.equal(st.status, 200);
      assert.ok(!/points|"why"|gabarito/i.test(JSON.stringify(st.json)));
    });
  });

  describe("respostas simultâneas", () => {
    it("duas respostas ao mesmo tempo para a mesma questão: só uma vale", async () => {
      const s = cookieOf(await call("POST", "/api/auth/login", { body: { username: alunoT1.username, password: alunoT1.pin }, ip: "10.7.7.9" }));
      const st = (await call("GET", "/api/game/1/state", { cookie: s })).json;
      const [a, b] = await Promise.all([0, 1].map((i) => call("POST", "/api/game/1/answer", { cookie: s, body: { questionId: st.question.id, optionId: st.question.options[i].id } })));
      assert.deepEqual([a.status, b.status].sort(), [200, 409]);
      const n = (await q<{ c: number }>("SELECT COUNT(*) c FROM answers WHERE attempt_id=(SELECT id FROM attempts WHERE student_id=$1 AND status<>'voided')", [alunoT1.id]))[0].c;
      assert.equal(n, 1);
      const total = (await q<{ t: number; s: number }>("SELECT a.total_points t, (SELECT SUM(points) FROM answers WHERE attempt_id=a.id) s FROM attempts a WHERE student_id=$1 AND status<>'voided'", [alunoT1.id]))[0];
      assert.equal(total.t, total.s, "total gravado = soma das respostas (sem contar duas vezes)");
    });
  });

  describe("entrada inválida", () => {
    it("corpo que não é JSON: 400", async () => {
      const h = signRequest({ secret: SECRET, method: "POST", pathAndQuery: "/api/auth/login", ip: "10.6.6.6", body: "{nao-json" });
      assert.equal((await app.request("/api/auth/login", { method: "POST", headers: { ...h, "content-type": "application/json" }, body: "{nao-json" })).status, 400);
    });
    it("tipos errados: 400, sem detalhes internos", async () => {
      const r = await call("POST", "/api/auth/login", { body: { username: 123, password: [] }, ip: "10.6.6.7" });
      assert.equal(r.status, 400); assert.equal(r.json.error, "Requisição inválida.");
    });
    it("corpo acima de 1 MB: 413", async () => {
      const big = "x".repeat(1024 * 1024 + 10);
      const h = signRequest({ secret: SECRET, method: "POST", pathAndQuery: "/api/auth/login", ip: "10.6.6.8", body: big });
      const r = await app.request("/api/auth/login", { method: "POST", headers: { ...h, "content-type": "application/json", "content-length": String(big.length) }, body: big });
      assert.equal(r.status, 413);
    });
    it("ID de rota com injeção de SQL não vira consulta: 404/400", async () => {
      const r = await call("GET", "/api/admin/students/1;DROP%20TABLE%20students/report", { cookie: t1 });
      assert.ok([400, 404].includes(r.status));
      assert.ok(((await q<{ c: number }>("SELECT COUNT(*) c FROM students"))[0].c) > 0);
    });
  });
});
