// Auditoria de segurança (2026-11): controle de acesso do aluno, sessões e limites de entrada.
// Banco isolado "fc_audit_acesso" (recriado a cada execução) com contas 100% fictícias. Requer o PostgreSQL de desenvolvimento ligado.
import { before, after, describe, it } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import pg from "pg";

const ADMIN = process.env.PG_ADMIN_URL || "postgres://financity_dev:dev-local-only@127.0.0.1:54329/postgres";
process.env.DATABASE_URL = ADMIN.replace(/\/postgres$/, "/fc_audit_acesso");
process.env.GATEWAY_SECRET = "segredo-de-teste-do-gateway-com-mais-de-32-caracteres";
delete process.env.REQUIRE_SIGNATURE;

const { signRequest } = await import("@financity/gateway-sign");
const { app } = await import("../src/app.js");
const { migrate } = await import("../src/migrate.js");
const { seedContent } = await import("../src/lib/seed-content.js");
const { seedCulminancia } = await import("../src/lib/seed-culminancia.js");
const { closePool, q } = await import("../src/lib/db.js");
const SECRET = process.env.GATEWAY_SECRET!;

let ipN = 0;
async function call(method: string, path: string, opts: { body?: unknown; cookie?: string; ip?: string } = {}) {
  const body = opts.body === undefined ? "" : JSON.stringify(opts.body);
  const ip = opts.ip ?? `10.7.${Math.floor(++ipN / 250)}.${ipN % 250}`;
  const headers: Record<string, string> = { ...signRequest({ secret: SECRET, method, pathAndQuery: path, ip, body }) };
  if (body) headers["content-type"] = "application/json";
  if (opts.cookie) headers.cookie = opts.cookie;
  const res = await app.request(path, { method, headers, body: body || undefined });
  const text = await res.text();
  let json: any = null; try { json = JSON.parse(text); } catch { /* não é JSON */ }
  return { status: res.status, json, headers: res.headers };
}
const cookieOf = (r: { headers: Headers }) => (r.headers.get("set-cookie") || "").split(";")[0];
const login = async (u: string, p: string) => cookieOf(await call("POST", "/api/auth/login", { body: { username: u, password: p } }));

describe("auditoria: acesso do aluno, sessões e limites", () => {
  let prof: string, alunoA: string, alunoB: string, idA = 0;

  before(async () => {
    const c = new pg.Client(ADMIN); await c.connect();
    await c.query("DROP DATABASE IF EXISTS fc_audit_acesso WITH (FORCE)"); await c.query("CREATE DATABASE fc_audit_acesso"); await c.end();
    await migrate(); await seedContent(); await seedCulminancia(8);
    await q("INSERT INTO teachers(username,name,password_hash) VALUES($1,$2,$3)", ["prof.aud", "Prof Aud", await bcrypt.hash("Senha-Forte-1!", 4)]);
    prof = await login("prof.aud", "Senha-Forte-1!");
    const r = await call("POST", "/api/admin/students", { cookie: prof, body: { rows: [{ name: "Aluno Aud A", className: "8 ano", pin: "482917" }, { name: "Aluno Aud B", className: "8 ano", pin: "937216" }] } });
    assert.equal(r.json.created.length, 2);
    idA = r.json.created[0].id;
    alunoA = await login(r.json.created[0].username, "482917");
    alunoB = await login(r.json.created[1].username, "937216");
  });
  after(async () => { await closePool(); });

  it("cada aluno só enxerga o próprio nome e o próprio progresso", async () => {
    const a = await call("GET", "/api/me", { cookie: alunoA }), b = await call("GET", "/api/me", { cookie: alunoB });
    assert.equal(a.status, 200); assert.equal(b.status, 200);
    assert.notEqual(a.json.name, b.json.name);
    const sa = await call("GET", "/api/session", { cookie: alunoA });
    assert.equal(sa.json.session.name, a.json.name);
  });

  it("aluno não responde uma pergunta que não é a atual, nem usa opção de outra pergunta", async () => {
    const me = await call("GET", "/api/me", { cookie: alunoA });
    const mapa = me.json.maps.find((m: any) => m.unlocked);
    assert.ok(mapa, "o aluno do 8º tem um tema liberado");
    assert.equal((await call("POST", `/api/game/${mapa.id}/start`, { cookie: alunoA })).status, 200);
    const st = (await call("GET", `/api/game/${mapa.id}/state`, { cookie: alunoA })).json;
    const atual = st.question;
    // pergunta que NÃO é a atual → 409 (nada é gravado)
    const fora = await call("POST", `/api/game/${mapa.id}/answer`, { cookie: alunoA, body: { questionId: atual.id + 1, optionId: atual.options[0].id } });
    assert.equal(fora.status, 409);
    // pergunta atual com uma opção que pertence a outra pergunta → recusada
    const outraOpcao = (await q<{ id: number }>("SELECT o.id FROM options o JOIN questions x ON x.id=o.question_id WHERE x.id<>$1 ORDER BY o.id LIMIT 1", [atual.id]))[0].id;
    const cruzada = await call("POST", `/api/game/${mapa.id}/answer`, { cookie: alunoA, body: { questionId: atual.id, optionId: outraOpcao } });
    assert.ok([400, 409].includes(cruzada.status), `opção de outra pergunta deve ser recusada (veio ${cruzada.status})`);
    assert.equal((await q("SELECT 1 FROM answers WHERE question_id=$1", [atual.id])).length, 0, "nenhuma resposta indevida foi gravada");
    // o outro aluno não tem tentativa nesse tema: não vê o estado do colega
    const b = await call("GET", `/api/game/${mapa.id}/state`, { cookie: alunoB });
    assert.ok(b.json.status === "not_started" || b.json.answered === 0, "o colega não herda o progresso");
  });

  it("aluno desativado perde a sessão na hora (o cookie antigo deixa de valer)", async () => {
    assert.equal((await call("GET", "/api/me", { cookie: alunoA })).status, 200);
    assert.equal((await call("PATCH", `/api/admin/students/${idA}`, { cookie: prof, body: { action: "deactivate" } })).status, 200);
    assert.equal((await call("GET", "/api/me", { cookie: alunoA })).status, 401);
    const e = await call("POST", "/api/auth/login", { body: { username: (await q<{ username: string }>("SELECT username FROM students WHERE id=$1", [idA]))[0].username, password: "482917" } });
    assert.equal(e.status, 403);
  });

  it("usuário inexistente e senha errada recebem a MESMA resposta (sem revelar quais usuários existem)", async () => {
    const inexistente = await call("POST", "/api/auth/login", { body: { username: "nao.existe.mesmo", password: "000000" } });
    const senhaErrada = await call("POST", "/api/auth/login", { body: { username: "prof.aud", password: "Senha-Errada-9!" } });
    assert.equal(inexistente.status, 401); assert.equal(senhaErrada.status, 401);
    assert.deepEqual(inexistente.json, senhaErrada.json);
  });

  it("bloqueio por excesso de tentativas: depois de 5 falhas do mesmo IP e usuário, 429", async () => {
    const ip = "10.99.99.99"; let ultimo = 0;
    for (let i = 0; i < 7; i++) ultimo = (await call("POST", "/api/auth/login", { ip, body: { username: "prof.aud", password: "errada-" + i } })).status;
    assert.equal(ultimo, 429);
  });

  it("cadastro em lote tem limite de linhas (500) e de tamanho dos campos", async () => {
    const muitas = Array.from({ length: 501 }, (_, i) => ({ name: "Aluno " + i, className: "8 ano" }));
    assert.equal((await call("POST", "/api/admin/students", { cookie: prof, body: { rows: muitas } })).status, 400);
    assert.equal((await call("POST", "/api/admin/students", { cookie: prof, body: { rows: [{ name: "x".repeat(201), className: "8 ano" }] } })).status, 400);
  });

  it("erros internos não vazam detalhes: rota inexistente e corpo inválido têm mensagens genéricas", async () => {
    const nf = await call("GET", "/api/nao-existe", { cookie: prof });
    assert.equal(nf.status, 404); assert.ok(!/stack|at \w+|postgres|ECONN|\/home\//i.test(JSON.stringify(nf.json)));
    const ruim = await call("POST", "/api/admin/students", { cookie: prof, body: { rows: "isto não é uma lista" } });
    assert.equal(ruim.status, 400); assert.deepEqual(Object.keys(ruim.json), ["error"]);
  });

  it("privacidade: tentativas de login antigas (com IP) são apagadas no próximo login bem-sucedido", async () => {
    await q("INSERT INTO login_attempts(key,fails,window_start,locked_until) VALUES($1,2,$2,0) ON CONFLICT(key) DO NOTHING", ["ip:203.0.113.77", Date.now() - 48 * 3600_000]);
    await q("INSERT INTO login_attempts(key,fails,window_start,locked_until) VALUES($1,2,$2,0) ON CONFLICT(key) DO NOTHING", ["ip:203.0.113.78", Date.now() - 60_000]);
    assert.ok((await login("prof.aud", "Senha-Forte-1!")).startsWith("fc_session="));
    const restantes = (await q<{ key: string }>("SELECT key FROM login_attempts WHERE key LIKE 'ip:203.0.113.%'")).map((r) => r.key);
    assert.deepEqual(restantes, ["ip:203.0.113.78"], "a antiga some; a recente (ainda dentro da janela) fica");
  });
});
