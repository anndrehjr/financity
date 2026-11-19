// Jogo completo da Culminância pela API real (assinatura, sessão, correção no servidor) em banco isolado "fc_culm".
// Requer o PostgreSQL de desenvolvimento ligado (npm run pg:dev). Nunca aponta para dados reais.
import { before, after, describe, it } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import pg from "pg";

const ADMIN = process.env.PG_ADMIN_URL || "postgres://financity_dev:dev-local-only@127.0.0.1:54329/postgres";
process.env.DATABASE_URL = ADMIN.replace(/\/postgres$/, "/fc_culm");
process.env.GATEWAY_SECRET = "segredo-de-teste-do-gateway-com-mais-de-32-caracteres";
delete process.env.REQUIRE_SIGNATURE;
process.env.ANSWER_FLOOD_MAX = "1000"; // este teste joga 32 questões seguidas em milissegundos; o limite anti-automação é testado em integridade.test.ts

const { signRequest } = await import("@financity/gateway-sign");
const { app } = await import("../src/app.js");
const { migrate } = await import("../src/migrate.js");
const { seedContent } = await import("../src/lib/seed-content.js");
const { seedCulminancia } = await import("../src/lib/seed-culminancia.js");
const { CULMINANCIA } = await import("../src/content/culminancia.js");
const { closePool, q } = await import("../src/lib/db.js");
const SECRET = process.env.GATEWAY_SECRET!;

let n = 0;
async function call(method: string, path: string, opts: { body?: unknown; cookie?: string } = {}) {
  const body = opts.body === undefined ? "" : JSON.stringify(opts.body);
  const headers: Record<string, string> = { ...signRequest({ secret: SECRET, method, pathAndQuery: path, ip: `10.20.${Math.floor(++n / 250)}.${n % 250}`, body }) };
  if (body) headers["content-type"] = "application/json";
  if (opts.cookie) headers.cookie = opts.cookie;
  const res = await app.request(path, { method, headers, body: body || undefined });
  const text = await res.text();
  let json: any = null; try { json = JSON.parse(text); } catch { /* não é JSON */ }
  return { status: res.status, json, text, headers: res.headers };
}
const cookieOf = (r: { headers: Headers }) => (r.headers.get("set-cookie") || "").split(";")[0];

describe("Culminância — jogo completo", () => {
  let aluno: string;
  const ip = { username: "", pin: "483921" };

  before(async () => {
    const c = new pg.Client(ADMIN); await c.connect();
    await c.query("DROP DATABASE IF EXISTS fc_culm WITH (FORCE)"); await c.query("CREATE DATABASE fc_culm"); await c.end();
    await migrate(); await seedContent();
    const r1 = await seedCulminancia(8), r2 = await seedCulminancia(8); // idempotente
    assert.equal(r1.questoes, 32); assert.equal(r2.questoes, 0);
    await q("INSERT INTO teachers(username,name,password_hash) VALUES($1,$2,$3)", ["prof.c", "Prof C", await bcrypt.hash("Senha-Forte-1!", 4)]);
    const t = cookieOf(await call("POST", "/api/auth/login", { body: { username: "prof.c", password: "Senha-Forte-1!" } }));
    const a = await call("POST", "/api/admin/students", { cookie: t, body: { rows: [{ name: "Aluno Culm", className: "8º A", pin: ip.pin }] } });
    ip.username = a.json.created[0].username;
    aluno = cookieOf(await call("POST", "/api/auth/login", { body: { username: ip.username, password: ip.pin } }));
  });
  after(async () => { await closePool(); });

  it("o aluno vê só os 4 temas novos (os antigos ficam arquivados, sem apagar nada)", async () => {
    const me = await call("GET", "/api/me", { cookie: aluno });
    assert.deepEqual(me.json.maps.map((m: any) => m.title), CULMINANCIA.map((t) => t.title));
    assert.deepEqual(me.json.maps.map((m: any) => m.sort), [1, 2, 3, 4]);
    assert.deepEqual(me.json.maps.map((m: any) => m.unlocked), [true, false, false, false]);
    const arq = await q<{ c: number }>("SELECT COUNT(*)::int c FROM assessments WHERE status='archived'");
    assert.equal(arq[0].c, 4);
    assert.equal((await q<{ c: number }>("SELECT COUNT(*)::int c FROM questions"))[0].c, 20 + 32); // nada apagado
  });

  it("a resposta e a pontuação nunca vão para o navegador (gabarito, pontos, seq, is_correct)", async () => {
    const id = (await call("GET", "/api/me", { cookie: aluno })).json.maps[0].id;
    await call("POST", `/api/game/${id}/start`, { cookie: aluno });
    const st = await call("GET", `/api/game/${id}/state`, { cookie: aluno });
    assert.ok(!/"points"|"why"|is_correct|"seq"|gabarito/i.test(st.text));
    assert.equal(st.json.max, 240); assert.equal(st.json.total, 8);
  });

  it("joga os 4 temas inteiros (32 questões): pontuação máxima = 960 e todos os tipos corrigidos no servidor", async () => {
    let total = 0;
    for (const [ti, tema] of CULMINANCIA.entries()) {
      const me = await call("GET", "/api/me", { cookie: aluno });
      const id = me.json.maps[ti].id;
      assert.equal(me.json.maps[ti].unlocked, true, `tema ${ti + 1} deve estar liberado`);
      await call("POST", `/api/game/${id}/start`, { cookie: aluno });
      for (const qq of tema.questions) {
        const st = await call("GET", `/api/game/${id}/state`, { cookie: aluno });
        const shown = st.json.question;
        assert.equal(shown.number, qq.number); assert.equal(shown.kind, qq.kind);
        // converte o que o aluno vê (ids embaralhados) no que o gabarito pede
        const idByText = new Map<string, number>(shown.options.map((o: any) => [o.text, o.id]));
        let body: any;
        if (qq.kind === "choice") body = { optionId: idByText.get(qq.options.find((o) => o.points === qq.max)!.text) };
        else if (qq.kind === "multi") body = { optionIds: qq.options.filter((o) => o.correct).map((o) => idByText.get(o.text)) };
        else {
          body = { order: [...qq.options].sort((a, b) => a.seq! - b.seq!).map((o) => idByText.get(o.text)) };
          const inicial = shown.options.map((o: any) => o.id);
          assert.notDeepEqual(inicial, body.order, "a ordem inicial mostrada não pode ser a correta");
          assert.ok(shown.options.every((o: any) => o.letter === ""), "ordenação não mostra letras");
        }
        const r = await call("POST", `/api/game/${id}/answer`, { cookie: aluno, body: { questionId: shown.id, usedHint: !!shown.hint, ...body } });
        assert.equal(r.status, 200, `${qq.code}: ${r.text}`);
        assert.equal(r.json.earned, qq.max, `${qq.code} deve render o máximo`);
        total += r.json.earned;
      }
      const res = await call("GET", `/api/game/${id}/result`, { cookie: aluno });
      assert.equal(res.json.max, 240); assert.equal(res.json.score, 240); assert.equal(res.json.pct, 100);
      assert.equal(res.json.dominio.key, "consolidado");
    }
    assert.equal(total, 960);
  });

  it("respostas inválidas são recusadas e resposta repetida não soma de novo", async () => {
    // cria outro aluno para testar entradas inválidas na 1ª questão (multi na C03 não; usa C01 choice e depois C02)
    const t = cookieOf(await call("POST", "/api/auth/login", { body: { username: "prof.c", password: "Senha-Forte-1!" } }));
    const a = await call("POST", "/api/admin/students", { cookie: t, body: { rows: [{ name: "Aluno Dois", className: "8º A", pin: "719364" }] } });
    const s2 = cookieOf(await call("POST", "/api/auth/login", { body: { username: a.json.created[0].username, password: "719364" } }));
    const id = (await call("GET", "/api/me", { cookie: s2 })).json.maps[0].id;
    await call("POST", `/api/game/${id}/start`, { cookie: s2 });
    const q1 = (await call("GET", `/api/game/${id}/state`, { cookie: s2 })).json.question;
    assert.equal((await call("POST", `/api/game/${id}/answer`, { cookie: s2, body: { questionId: q1.id } })).status, 400);
    assert.equal((await call("POST", `/api/game/${id}/answer`, { cookie: s2, body: { questionId: q1.id, optionId: 999999 } })).status, 400);
    const ok = await call("POST", `/api/game/${id}/answer`, { cookie: s2, body: { questionId: q1.id, optionId: q1.options[0].id } });
    assert.equal(ok.status, 200);
    assert.equal((await call("POST", `/api/game/${id}/answer`, { cookie: s2, body: { questionId: q1.id, optionId: q1.options[0].id } })).status, 409);
    // multisseleção: lista vazia recusada; ordenação com itens repetidos recusada
    const q2 = (await call("GET", `/api/game/${id}/state`, { cookie: s2 })).json.question; // C02 (choice)
    await call("POST", `/api/game/${id}/answer`, { cookie: s2, body: { questionId: q2.id, optionId: q2.options[0].id } });
    const q3 = (await call("GET", `/api/game/${id}/state`, { cookie: s2 })).json.question; // C03 (multi)
    assert.equal(q3.kind, "multi");
    assert.equal((await call("POST", `/api/game/${id}/answer`, { cookie: s2, body: { questionId: q3.id, optionIds: [] } })).status, 400);
    const todas = await call("POST", `/api/game/${id}/answer`, { cookie: s2, body: { questionId: q3.id, optionIds: q3.options.map((o: any) => o.id) } });
    assert.equal(todas.json.earned, 0, "marcar todas = 0");
  });

  it("painel do professor: o detalhe por questão cobre as 8 questões do tema (total = 8) e a 9ª não existe", async () => {
    const t = cookieOf(await call("POST", "/api/auth/login", { body: { username: "prof.c", password: "Senha-Forte-1!" } }));
    for (const n of [1, 5, 8]) {
      const r = await call("GET", `/api/admin/questions/${n}?scope=real`, { cookie: t });
      assert.equal(r.status, 200, `questão ${n}`);
      assert.equal(r.json.number, n); assert.equal(r.json.total, 8); assert.ok(r.json.max >= 20, "a questão vale mais de 5 pontos");
    }
    assert.equal((await call("GET", "/api/admin/questions/9?scope=real", { cookie: t })).status, 404);
  });
});
