// Estrutura por série (7º e 8º) em banco isolado "fc_series". Dados 100% fictícios.
// Cenário principal: o 8º ano JÁ EM USO (criado antes da migração 004) continua idêntico depois dela.
import { before, after, describe, it } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import pg from "pg";

const ADMIN = process.env.PG_ADMIN_URL || "postgres://financity_dev:dev-local-only@127.0.0.1:54329/postgres";
process.env.DATABASE_URL = ADMIN.replace(/\/postgres$/, "/fc_series");
process.env.GATEWAY_SECRET = "segredo-de-teste-do-gateway-com-mais-de-32-caracteres";
delete process.env.REQUIRE_SIGNATURE;

const { signRequest } = await import("@financity/gateway-sign");
const { app } = await import("../src/app.js");
const { migrate } = await import("../src/migrate.js");
const { seedContent } = await import("../src/lib/seed-content.js");
const { seedCulminancia } = await import("../src/lib/seed-culminancia.js");
const { createStudents } = await import("../src/lib/students.js");
const { startAttempt, assessmentState, submitAnswer } = await import("../src/lib/game.js");
const { SERIE_7, temaVazio } = await import("../src/content/serie7.js");
const { seedSerie, validarTema } = await import("../src/lib/serie.js");
const { closePool, one, q } = await import("../src/lib/db.js");
const SECRET = process.env.GATEWAY_SECRET!;

let n = 0;
async function call(method: string, path: string, opts: { body?: unknown; cookie?: string } = {}) {
  const body = opts.body === undefined ? "" : JSON.stringify(opts.body);
  const headers: Record<string, string> = { ...signRequest({ secret: SECRET, method, pathAndQuery: path, ip: `10.30.${Math.floor(++n / 250)}.${n % 250}`, body }) };
  if (body) headers["content-type"] = "application/json";
  if (opts.cookie) headers.cookie = opts.cookie;
  const res = await app.request(path, { method, headers, body: body || undefined });
  const text = await res.text();
  let json: any = null; try { json = JSON.parse(text); } catch { /* não é JSON */ }
  return { status: res.status, json, text, headers: res.headers };
}
const cookieOf = (r: { headers: Headers }) => (r.headers.get("set-cookie") || "").split(";")[0];
const login = async (u: string, p: string) => cookieOf(await call("POST", "/api/auth/login", { body: { username: u, password: p } }));

/** Tema completo e válido, com texto fictício (só para o teste). */
function temaPronto(slug: string) {
  const t = structuredClone(temaVazio(1));
  t.slug = slug; t.title = "Tema de teste"; t.subtitle = "Teste"; t.topics = ["a"]; t.rascunho = false;
  t.questions.forEach((qq, i) => {
    Object.assign(qq, { title: `D${i + 1}`, theme: "t", scenario: "cenário", prompt: "enunciado?", rubric: "r", strength: "s", retake: "r", bncc: "EF07MA02" });
    qq.options.forEach((o, k) => { o.text = `opção ${k + 1} do desafio ${i + 1}`; o.why = "porque"; });
    if (qq.kind === "choice") qq.options.forEach((o, k) => { o.points = k === 0 ? qq.max : 0; });
    if (qq.kind === "multi") { qq.options[0].correct = true; qq.options[2].correct = true; }
  });
  return t;
}

describe("estrutura por série", () => {
  let antes: { alunoId: number; hash: string; username: string; pontos: number; respostas: number; temas: string[] };
  let prof: string, aluno8: string, aluno7: string;

  before(async () => {
    const c = new pg.Client(ADMIN); await c.connect();
    await c.query("DROP DATABASE IF EXISTS fc_series WITH (FORCE)"); await c.query("CREATE DATABASE fc_series"); await c.end();
    await migrate({ upTo: 3 });                       // o banco como está em produção hoje (sem a migração 004)
    await seedContent(); await seedCulminancia(8);
    const t = await one<{ id: number }>("INSERT INTO teachers(username,name,password_hash) VALUES($1,$2,$3) RETURNING id", ["prof.s", "Prof S", await bcrypt.hash("Senha-Forte-1!", 4)]);
    const r = await createStudents([{ name: "Aluno Oito Teste", className: "8 ano", pin: "483921" }], t!.id);
    const id = r.created[0].id, username = r.created[0].username;
    await startAttempt(id, (await q<{ id: number }>("SELECT a.id FROM assessments a WHERE a.grade=8 AND a.status='available' ORDER BY a.sort LIMIT 1"))[0].id);
    const aid = (await q<{ id: number }>("SELECT id FROM assessments WHERE grade=8 AND status='available' ORDER BY sort LIMIT 1"))[0].id;
    const st: any = await assessmentState(id, aid);
    // resposta gravada direto no banco antigo (o código atual de jogo já espera as colunas das migrações novas, que só existem depois do migrate())
    const opt = st.question.options[0].id;
    const tent = (await one<{ id: number }>("SELECT id FROM attempts WHERE student_id=$1", [id]))!.id;
    const pts = (await one<{ points: number }>("SELECT points FROM options WHERE id=$1", [opt]))!.points;
    await q("INSERT INTO answers(attempt_id,question_id,option_id,points,display_pos,response,used_hint) VALUES($1,$2,$3,$4,1,$5::jsonb,false)", [tent, st.question.id, opt, pts, JSON.stringify({ optionId: opt })]);
    await q("UPDATE attempts SET total_points = total_points + $1 WHERE id=$2", [pts, tent]);
    const ps = await one<{ pin_hash: string }>("SELECT pin_hash FROM students WHERE id=$1", [id]);
    antes = {
      alunoId: id, hash: ps!.pin_hash, username,
      pontos: (await one<{ t: number }>("SELECT total_points t FROM attempts WHERE student_id=$1", [id]))!.t,
      respostas: (await one<{ c: number }>("SELECT COUNT(*)::int c FROM answers a JOIN attempts t ON t.id=a.attempt_id WHERE t.student_id=$1", [id]))!.c,
      temas: (await q<{ title: string }>("SELECT m.title FROM assessments a JOIN maps m ON m.id=a.map_id WHERE a.grade=8 AND a.status='available' ORDER BY a.sort")).map((x) => x.title),
    };
    await migrate();                                  // APLICA a migração 004 sobre o banco com o 8º já em uso
    prof = await login("prof.s", "Senha-Forte-1!");
    aluno8 = await login(antes.username, "483921");
  });
  after(async () => { await closePool(); });

  it("migração 004: o 8º ano em uso fica idêntico (mesmo usuário, mesmo PIN, mesmo progresso e pontuação) e tudo recebe série 8", async () => {
    assert.ok(aluno8, "o aluno do 8º entra com o mesmo usuário e a mesma senha de antes");
    const ps = await one<{ pin_hash: string; username: string; serie: number }>("SELECT pin_hash,username,serie FROM students WHERE id=$1", [antes.alunoId]);
    assert.equal(ps!.pin_hash, antes.hash); assert.equal(ps!.username, antes.username); assert.equal(ps!.serie, 8);
    assert.equal((await one<{ t: number }>("SELECT total_points t FROM attempts WHERE student_id=$1", [antes.alunoId]))!.t, antes.pontos);
    assert.equal((await one<{ c: number }>("SELECT COUNT(*)::int c FROM answers a JOIN attempts t ON t.id=a.attempt_id WHERE t.student_id=$1", [antes.alunoId]))!.c, antes.respostas);
    assert.equal((await one<{ c: number }>("SELECT COUNT(*)::int c FROM maps WHERE serie<>8"))!.c, 0);
    assert.equal((await one<{ c: number }>("SELECT COUNT(*)::int c FROM students WHERE serie<>8"))!.c, 0);
  });

  it("aluno do 8º vê os mesmos 4 temas, com o mesmo progresso e pontuação", async () => {
    const me = await call("GET", "/api/me", { cookie: aluno8 });
    assert.equal(me.json.serie, 8);
    assert.deepEqual(me.json.maps.map((m: any) => m.title), antes.temas);
    assert.equal(me.json.maps.length, 4);
    assert.equal(me.json.maps[0].score, antes.pontos); assert.equal(me.json.maps[0].progress, "in_progress");
    assert.deepEqual(me.json.maps.map((m: any) => m.unlocked), [true, false, false, false]);
    assert.equal((await call("GET", "/api/session", { cookie: aluno8 })).json.session.serie, 8);
  });

  it("aluno do 7º (sem temas cadastrados) entra, vê lista vazia e não alcança nenhum tema do 8º", async () => {
    const t = (await q<{ id: number }>("SELECT id FROM teachers"))[0].id;
    const r = await createStudents([{ name: "Aluno Sete Teste", className: "7 ano", pin: "719364" }], t);
    assert.equal(r.created.length, 1);
    assert.equal((await one<{ serie: number }>("SELECT serie FROM students WHERE id=$1", [r.created[0].id]))!.serie, 7); // gatilho: série da turma
    aluno7 = await login(r.created[0].username, "719364");
    const me = await call("GET", "/api/me", { cookie: aluno7 });
    assert.equal(me.status, 200); assert.equal(me.json.serie, 7); assert.deepEqual(me.json.maps, []);
    const a8 = (await q<{ id: number }>("SELECT id FROM assessments WHERE grade=8 AND status='available' ORDER BY sort LIMIT 1"))[0].id;
    assert.equal((await call("GET", `/api/game/${a8}/state`, { cookie: aluno7 })).status, 404);
    assert.equal((await call("GET", "/api/session", { cookie: aluno7 })).json.session.serie, 7);
  });

  it("tema em rascunho, sem desafios ou arquivado NÃO aparece para o aluno", async () => {
    const subj = (await one<{ id: number }>("SELECT id FROM subjects LIMIT 1"))!.id;
    const novo = async (slug: string, status: string, comQuestao: boolean) => {
      const m = (await one<{ id: number }>("INSERT INTO maps(sort,slug,title,subtitle,topics,status,subject_id,serie) VALUES (NULL,$1,$1,'x','[]'::jsonb,'available',$2,7) RETURNING id", [slug, subj]))!.id;
      if (comQuestao) await q("INSERT INTO questions(map_id,number,title,theme,scene,scenario,dialog,prompt,note,strength,retake) VALUES ($1,1,'t','t','plan','c','','p','n','s','r')", [m]);
      await q("INSERT INTO assessments(map_id,grade,sort,status) VALUES ($1,7,(SELECT COALESCE(MAX(sort),0)+1 FROM assessments WHERE grade=7),$2)", [m, status]);
    };
    await novo("x-rascunho", "developing", true); await novo("x-sem-desafios", "available", false); await novo("x-arquivado", "archived", true);
    assert.deepEqual((await call("GET", "/api/me", { cookie: aluno7 })).json.maps, []);
    assert.equal((await call("GET", "/api/me", { cookie: aluno8 })).json.maps.length, 4); // o 8º não é afetado
  });

  it("7º ano: 4 temas aprovados e válidos (rascunho: false); a carga de rascunho não grava nada e tema incompleto é recusado", async () => {
    assert.equal(SERIE_7.length, 4);
    for (const t of SERIE_7) {
      assert.equal(t.questions.length, 8); assert.equal(t.rascunho, false); assert.equal(t.serie, 7);
      assert.deepEqual(validarTema(t), [], `${t.slug} deve estar completo e válido`);
    }
    const antesMapas = (await one<{ c: number }>("SELECT COUNT(*)::int c FROM maps"))!.c;
    // os mesmos 4 temas marcados como rascunho: nada vai ao banco (aqui NÃO se carrega o conteúdo real, para não misturar com os outros testes)
    const comoRascunho = SERIE_7.map((t) => ({ ...structuredClone(t), rascunho: true }));
    const r = await seedSerie(comoRascunho);
    assert.deepEqual(r.publicados, []); assert.equal(r.rascunhos.length, 4);
    assert.equal((await one<{ c: number }>("SELECT COUNT(*)::int c FROM maps"))!.c, antesMapas);
    const incompleto = structuredClone(temaVazio(1)); incompleto.rascunho = false;
    assert.ok(validarTema(incompleto).length > 0);
    await assert.rejects(() => seedSerie([incompleto]), /nada foi gravado/);
    assert.equal((await one<{ c: number }>("SELECT COUNT(*)::int c FROM maps"))!.c, antesMapas);
  });

  it("tema pronto e validado é publicado só para a série dele: o 7º vê 8 desafios (240 pontos); o 8º segue igual", async () => {
    assert.deepEqual(validarTema(temaPronto("s7-teste")), []);
    const r = await seedSerie([temaPronto("s7-teste")]);
    assert.deepEqual(r.publicados, ["s7-teste"]); assert.equal(r.questoes, 8);
    assert.equal((await seedSerie([temaPronto("s7-teste")])).publicados.length, 0); // idempotente
    const me = await call("GET", "/api/me", { cookie: aluno7 });
    assert.equal(me.json.maps.length, 1); assert.deepEqual(me.json.maps.map((m: any) => m.unlocked), [true]);
    const st = await call("POST", `/api/game/${me.json.maps[0].id}/start`, { cookie: aluno7 });
    assert.equal(st.json.max, 240); assert.equal(st.json.total, 8);
    assert.equal((await call("GET", "/api/me", { cookie: aluno8 })).json.maps.length, 4);
    assert.equal((await one<{ serie: number }>("SELECT serie FROM maps WHERE slug='s7-teste'"))!.serie, 7);
  });

  it("professor: filtra por série e vê tudo por padrão; a visão padrão do painel continua no 8º ano", async () => {
    const todos = await call("GET", "/api/admin/students?scope=real", { cookie: prof });
    const s7 = await call("GET", "/api/admin/students?scope=real&serie=7", { cookie: prof });
    const s8 = await call("GET", "/api/admin/students?scope=real&serie=8", { cookie: prof });
    assert.equal(todos.json.length, 2); assert.equal(s7.json.length, 1); assert.equal(s8.json.length, 1);
    assert.equal(s7.json[0].serie, 7); assert.equal(s8.json[0].serie, 8);
    const d = await call("GET", "/api/admin/dashboard?scope=real", { cookie: prof });
    assert.equal(d.status, 200); assert.equal(d.json.assessment.grade, 8);                  // padrão: não "pula" para o 7º
    const d7 = await call("GET", "/api/admin/dashboard?scope=real&serie=7", { cookie: prof });
    assert.equal(d7.json.assessment.grade, 7);
  });

  it("a série do aluno acompanha a turma ao trocar de turma", async () => {
    const id = (await one<{ id: number }>("SELECT id FROM students WHERE full_name='Aluno Sete Teste'"))!.id;
    const c8 = (await one<{ id: number }>("SELECT id FROM classes WHERE name='8 ano'"))!.id;
    await q("UPDATE students SET class_id=$1 WHERE id=$2", [c8, id]);
    assert.equal((await one<{ serie: number }>("SELECT serie FROM students WHERE id=$1", [id]))!.serie, 8);
    const c7 = (await one<{ id: number }>("SELECT id FROM classes WHERE name='7 ano'"))!.id;
    await q("UPDATE students SET class_id=$1 WHERE id=$2", [c7, id]);
    assert.equal((await one<{ serie: number }>("SELECT serie FROM students WHERE id=$1", [id]))!.serie, 7);
  });
});
