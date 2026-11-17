// Padronização da pontuação (migração 006) em banco isolado "fc_pontuacao". Dados 100% fictícios.
// Cenário: banco com os valores ANTIGOS (questões de 20/40 pontos, alternativas irregulares) e uma tentativa em andamento;
// aplica-se a migração 006 e confere-se que o histórico não muda, a tentativa antiga termina pela regra antiga
// e a tentativa nova usa a escala padrão (30 por questão; alternativas 30/20/10/0).
import { before, after, describe, it } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import pg from "pg";

const ADMIN = process.env.PG_ADMIN_URL || "postgres://financity_dev:dev-local-only@127.0.0.1:54329/postgres";
process.env.DATABASE_URL = ADMIN.replace(/\/postgres$/, "/fc_pontuacao");
process.env.GATEWAY_SECRET = "segredo-de-teste-do-gateway-com-mais-de-32-caracteres";
delete process.env.REQUIRE_SIGNATURE;

const { signRequest } = await import("@financity/gateway-sign");
const { app } = await import("../src/app.js");
const { migrate } = await import("../src/migrate.js");
const { seedContent } = await import("../src/lib/seed-content.js");
const { seedCulminancia } = await import("../src/lib/seed-culminancia.js");
const { createStudents } = await import("../src/lib/students.js");
const { startAttempt } = await import("../src/lib/game.js");
const { closePool, one, q } = await import("../src/lib/db.js");
const SECRET = process.env.GATEWAY_SECRET!;

let n = 0;
async function call(method: string, path: string, opts: { body?: unknown; cookie?: string } = {}) {
  const body = opts.body === undefined ? "" : JSON.stringify(opts.body);
  const headers: Record<string, string> = { ...signRequest({ secret: SECRET, method, pathAndQuery: path, ip: `10.60.${Math.floor(++n / 250)}.${n % 250}`, body }) };
  if (body) headers["content-type"] = "application/json";
  if (opts.cookie) headers.cookie = opts.cookie;
  const res = await app.request(path, { method, headers, body: body || undefined });
  const text = await res.text();
  let json: any = null; try { json = JSON.parse(text); } catch { /* não é JSON */ }
  return { status: res.status, json, text, headers: res.headers };
}
const cookieOf = (r: { headers: Headers }) => (r.headers.get("set-cookie") || "").split(";")[0];
const login = async (u: string, p: string) => cookieOf(await call("POST", "/api/auth/login", { body: { username: u, password: p } }));

describe("pontuação padronizada (migração 006)", () => {
  let prof: string, sA: string, sB: string;
  let aId: number, bId: number, aUser: string, bUser: string, asm: number, map: number;
  let q1: number, q2: number, q7: number;
  const optIds = (qid: number) => q<{ id: number }>("SELECT id FROM options WHERE question_id=$1 ORDER BY id", [qid]); // vale antes da migração 006
  const optsOf = (qid: number) => q<{ id: number; points: number; legacy_points: number | null }>("SELECT id,points,legacy_points FROM options WHERE question_id=$1 ORDER BY id", [qid]);

  before(async () => {
    const c = new pg.Client(ADMIN); await c.connect();
    await c.query("DROP DATABASE IF EXISTS fc_pontuacao WITH (FORCE)"); await c.query("CREATE DATABASE fc_pontuacao"); await c.end();
    await migrate({ upTo: 5 });                               // o banco como está em produção hoje (sem a migração 006)
    await seedContent(); await seedCulminancia(8);
    asm = (await one<{ id: number; map_id: number }>("SELECT id,map_id FROM assessments WHERE grade=8 AND status='available' ORDER BY sort LIMIT 1"))!.id;
    map = (await one<{ map_id: number }>("SELECT map_id FROM assessments WHERE id=$1", [asm]))!.map_id;
    const qid = async (num: number) => (await one<{ id: number }>("SELECT id FROM questions WHERE map_id=$1 AND number=$2", [map, num]))!.id;
    [q1, q2, q7] = [await qid(1), await qid(2), await qid(7)];
    // volta 3 questões para os valores ANTIGOS (como estão em produção): Q1 20 [0,20,10,0]; Q2 20 [0,4,20,0]; Q7 40 [0,10,40,16]
    for (const [id, max, pts] of [[q1, 20, [0, 20, 10, 0]], [q2, 20, [0, 4, 20, 0]], [q7, 40, [0, 10, 40, 16]]] as [number, number, number[]][]) {
      await q("UPDATE questions SET max_points=$1 WHERE id=$2", [max, id]);
      const os = await optIds(id);
      for (const [i, o] of os.entries()) await q("UPDATE options SET points=$1 WHERE id=$2", [pts[i], o.id]);
    }
    const t = await one<{ id: number }>("INSERT INTO teachers(username,name,password_hash) VALUES($1,$2,$3) RETURNING id", ["prof.p", "Prof P", await bcrypt.hash("Senha-Forte-1!", 4)]);
    const r = await createStudents([{ name: "Aluno A Fictício", className: "8 ano", pin: "483921" }, { name: "Aluno B Fictício", className: "8 ano", pin: "719364" }], t!.id);
    [aId, bId] = [r.created[0].id, r.created[1].id]; [aUser, bUser] = [r.created[0].username, r.created[1].username];
    // aluno A já jogou Q1 pela regra antiga (escolheu a alternativa de 10 pontos, de 20): gravado direto, como estava antes da migração
    await startAttempt(aId, asm);
    const tent = (await one<{ id: number }>("SELECT id FROM attempts WHERE student_id=$1", [aId]))!.id;
    const o10 = (await optIds(q1))[2].id;
    await q("INSERT INTO answers(attempt_id,question_id,option_id,points,display_pos,response,used_hint) VALUES($1,$2,$3,10,1,$4::jsonb,false)", [tent, q1, o10, JSON.stringify({ optionId: o10 })]);
    await q("UPDATE attempts SET total_points=10 WHERE id=$1", [tent]);
    await migrate();                                          // APLICA a migração 006 sobre o banco já em uso
    prof = await login("prof.p", "Senha-Forte-1!"); sA = await login(aUser, "483921"); sB = await login(bUser, "719364");
  });
  after(async () => { await closePool(); });

  it("guarda os valores antigos e padroniza os novos: questões de 30; alternativas só 30/20/10/0, com uma única de 30", async () => {
    const mq = (id: number) => one<{ max_points: number; legacy_max_points: number }>("SELECT max_points,legacy_max_points FROM questions WHERE id=$1", [id]);
    assert.deepEqual(await mq(q1), { max_points: 30, legacy_max_points: 20 });
    assert.deepEqual(await mq(q7), { max_points: 30, legacy_max_points: 40 });
    assert.deepEqual((await optsOf(q1)).map((o) => [o.legacy_points, o.points]), [[0, 0], [20, 30], [10, 20], [0, 0]]);
    assert.deepEqual((await optsOf(q2)).map((o) => [o.legacy_points, o.points]), [[0, 0], [4, 10], [20, 30], [0, 0]]);   // 4 de 20 = 20% -> 10
    assert.deepEqual((await optsOf(q7)).map((o) => [o.legacy_points, o.points]), [[0, 0], [10, 10], [40, 30], [16, 10]]); // 10 e 16 de 40 -> 10
    assert.equal((await one<{ c: number }>("SELECT COUNT(*)::int c FROM questions WHERE bloom IS NOT NULL AND max_points<>30"))!.c, 0, "toda questão do banco novo vale 30");
    assert.equal((await one<{ c: number }>("SELECT COUNT(*)::int c FROM options o JOIN questions q ON q.id=o.question_id WHERE q.bloom IS NOT NULL AND q.kind='choice' AND o.points NOT IN (0,10,20,30)"))!.c, 0);
    assert.equal((await one<{ c: number }>("SELECT COUNT(*)::int c FROM questions q WHERE q.bloom IS NOT NULL AND q.kind='choice' AND (SELECT COUNT(*) FROM options o WHERE o.question_id=q.id AND o.points=30)<>1"))!.c, 0);
    // os mapas antigos de 5 pontos (sem "bloom") não foram tocados
    assert.equal((await one<{ c: number }>("SELECT COUNT(*)::int c FROM questions WHERE bloom IS NULL AND max_points<>5"))!.c, 0);
  });

  it("o histórico não muda: a tentativa anterior fica com regra antiga (scoring 1), mesmos pontos e mesma resposta", async () => {
    const t = (await one<{ scoring: number; total_points: number }>("SELECT scoring,total_points FROM attempts WHERE student_id=$1", [aId]))!;
    assert.deepEqual(t, { scoring: 1, total_points: 10 });
    assert.equal((await one<{ points: number }>("SELECT an.points FROM answers an JOIN attempts a ON a.id=an.attempt_id WHERE a.student_id=$1 AND an.question_id=$2", [aId, q1]))!.points, 10);
  });

  it("a tentativa antiga termina pela regra ANTIGA (Q2: 4 de 20), e a nova pela PADRÃO (Q1: 20 de 30)", async () => {
    const st = await call("GET", `/api/game/${asm}/state`, { cookie: sA });
    assert.equal(st.json.question.id, q2, "A continua de onde parou");
    const o4 = (await optsOf(q2))[1].id;
    const ra = await call("POST", `/api/game/${asm}/answer`, { cookie: sA, body: { questionId: q2, optionId: o4 } });
    assert.equal(ra.status, 200); assert.equal(ra.json.earned, 4); assert.equal(ra.json.questionMax, 20);
    assert.equal(ra.json.score, 14, "10 + 4");

    await call("POST", `/api/game/${asm}/start`, { cookie: sB });
    const stB = await call("GET", `/api/game/${asm}/state`, { cookie: sB });
    assert.equal(stB.json.question.id, q1);
    const o20 = (await optsOf(q1))[2].id;                      // alternativa "parcial" -> 20 pela escala padrão
    const rb = await call("POST", `/api/game/${asm}/answer`, { cookie: sB, body: { questionId: q1, optionId: o20 } });
    assert.equal(rb.json.earned, 20); assert.equal(rb.json.questionMax, 30);
    assert.equal((await one<{ scoring: number }>("SELECT scoring FROM attempts WHERE student_id=$1", [bId]))!.scoring, 2);
  });

  it("relatório com dados misturados: o índice usa o máximo de CADA tentativa ((10+20)/(20+30) = 60%)", async () => {
    const r = await call("GET", "/api/admin/questions/1?scope=real", { cookie: prof });
    assert.equal(r.status, 200);
    assert.equal(r.json.n, 2); assert.equal(r.json.index, 60); assert.equal(r.json.excellent, 0); assert.equal(r.json.total, 8);
    const r2 = await call("GET", "/api/admin/questions/2?scope=real", { cookie: prof });
    assert.equal(r2.json.index, 20, "4 de 20 = 20%, não 4 de 30 = 13%");
    const rep = await call("GET", `/api/admin/students/${aId}/report`, { cookie: prof });
    assert.equal(rep.status, 200);
  });

  it("nova tentativa liberada pelo professor passa a usar a escala padrão; rodar a migração de novo não muda nada", async () => {
    const rel = await call("PATCH", `/api/admin/students/${aId}`, { cookie: prof, body: { action: "new_attempt", confirm: true, reason: "teste" } });
    assert.equal(rel.status, 200);
    await call("POST", `/api/game/${asm}/start`, { cookie: sA });
    const ativas = await q<{ scoring: number; status: string }>("SELECT scoring,status FROM attempts WHERE student_id=$1 ORDER BY id", [aId]);
    assert.deepEqual(ativas.map((x) => x.scoring), [1, 2], "a antiga (arquivada) segue 1; a nova é 2");
    assert.deepEqual(await migrate(), [], "migração já aplicada: nada a fazer");
    assert.equal((await optsOf(q1))[2].points, 20);
  });
});
