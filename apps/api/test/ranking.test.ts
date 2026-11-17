// Ranking geral (soma dos temas concluídos + classificação) em banco isolado "fc_ranking". Dados 100% fictícios.
import { before, after, describe, it } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import pg from "pg";

const ADMIN = process.env.PG_ADMIN_URL || "postgres://financity_dev:dev-local-only@127.0.0.1:54329/postgres";
process.env.DATABASE_URL = ADMIN.replace(/\/postgres$/, "/fc_ranking");
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
  const headers: Record<string, string> = { ...signRequest({ secret: SECRET, method, pathAndQuery: path, ip: `10.70.${Math.floor(++n / 250)}.${n % 250}`, body }) };
  if (body) headers["content-type"] = "application/json";
  if (opts.cookie) headers.cookie = opts.cookie;
  const res = await app.request(path, { method, headers, body: body || undefined });
  const text = await res.text();
  let json: any = null; try { json = JSON.parse(text); } catch { /* não é JSON */ }
  return { status: res.status, json, text, headers: res.headers };
}
const cookieOf = (r: { headers: Headers }) => (r.headers.get("set-cookie") || "").split(";")[0];
const login = async (u: string, p: string) => cookieOf(await call("POST", "/api/auth/login", { body: { username: u, password: p } }));

describe("ranking geral", () => {
  let profA: string, profB: string;
  const ids: Record<string, number> = {};
  let asm: number[] = [];

  const tentativa = (sid: number, sort: number, status: string, pts: number) =>
    q("INSERT INTO attempts(student_id,assessment_id,map_id,status,total_points) SELECT $1,a.id,a.map_id,$3,$4 FROM assessments a WHERE a.id=$2", [sid, asm[sort - 1], status, pts]);

  before(async () => {
    const c = new pg.Client(ADMIN); await c.connect();
    await c.query("DROP DATABASE IF EXISTS fc_ranking WITH (FORCE)"); await c.query("CREATE DATABASE fc_ranking"); await c.end();
    await migrate(); await seedContent(); await seedCulminancia(8);
    asm = (await q<{ id: number }>("SELECT id FROM assessments WHERE grade=8 AND status='available' ORDER BY sort")).map((x) => x.id);
    assert.equal(asm.length, 4);
    const ta = await one<{ id: number }>("INSERT INTO teachers(username,name,password_hash) VALUES($1,$2,$3) RETURNING id", ["prof.a", "Prof A", await bcrypt.hash("Senha-Forte-1!", 4)]);
    const tb = await one<{ id: number }>("INSERT INTO teachers(username,name,password_hash) VALUES($1,$2,$3) RETURNING id", ["prof.b", "Prof B", await bcrypt.hash("Senha-Forte-2!", 4)]);
    const nomes = ["Ana Completa", "Bia Meio", "Caio Meio", "Duda Pouco", "Eli Andamento", "Fabi Nada", "Gui Anulada", "Hugo Demo"];
    const r = await createStudents(nomes.map((nm, i) => ({ name: nm, className: "8 ano", pin: String(483921 + i * 1111).slice(0, 6) })), ta!.id);
    r.created.forEach((s: any, i: number) => { ids[nomes[i]] = s.id; });
    await createStudents([{ name: "Aluno Do Outro Professor", className: "8 B", pin: "902417" }], tb!.id);
    await q("UPDATE students SET is_demo=1 WHERE id=$1", [ids["Hugo Demo"]]);
    // Ana: 4 temas concluídos = 860 de 960 (90%)
    for (const [s, p] of [[1, 230], [2, 200], [3, 220], [4, 210]]) await tentativa(ids["Ana Completa"], s, "completed", p);
    // Bia e Caio: 2 temas, 300 de 480 (63%) — empatadas
    for (const nm of ["Bia Meio", "Caio Meio"]) { await tentativa(ids[nm], 1, "completed", 150); await tentativa(ids[nm], 2, "completed", 150); }
    // Duda: 1 tema, 100 de 240 (42%)
    await tentativa(ids["Duda Pouco"], 1, "completed", 100);
    // Eli: só em andamento (não entra na soma)
    await tentativa(ids["Eli Andamento"], 1, "in_progress", 60);
    // Gui: tentativa ANULADA (200) + nova concluída (90): conta só a nova (38%)
    await tentativa(ids["Gui Anulada"], 1, "voided", 200); await tentativa(ids["Gui Anulada"], 1, "completed", 90);
    // Hugo (demonstração): 1 tema, 240
    await tentativa(ids["Hugo Demo"], 1, "completed", 240);
    profA = await login("prof.a", "Senha-Forte-1!"); profB = await login("prof.b", "Senha-Forte-2!");
  });
  after(async () => { await closePool(); });

  const get = async (qs = "scope=real", cookie = profA) => (await call("GET", `/api/admin/ranking?${qs}`, { cookie })).json as { temas: any[]; rows: any[] };
  const por = (rows: any[], nome: string) => rows.find((r) => r.name === nome);

  it("soma só os temas concluídos e classifica pelo aproveitamento", async () => {
    const { temas, rows } = await get();
    assert.equal(temas.length, 4);
    const ana = por(rows, "Ana Completa");
    assert.deepEqual([ana.position, ana.concluded, ana.points, ana.maxPoints, ana.pct, ana.classification.label], [1, 4, 860, 960, 90, "Consolidado"]);
    assert.deepEqual(ana.themes.map((t: any) => t.points), [230, 200, 220, 210]);
    const duda = por(rows, "Duda Pouco");
    assert.deepEqual([duda.points, duda.maxPoints, duda.pct, duda.classification.label], [100, 240, 42, "Em desenvolvimento"]);
    const gui = por(rows, "Gui Anulada");
    assert.deepEqual([gui.points, gui.pct, gui.classification.label], [90, 38, "Em desenvolvimento inicial"], "a tentativa anulada não conta");
  });

  it("empate = mesma colocação; a seguinte pula (1º, 2º, 2º, 4º, 5º)", async () => {
    const { rows } = await get();
    assert.deepEqual(rows.filter((r) => r.position !== null).map((r) => [r.name, r.position]), [["Ana Completa", 1], ["Bia Meio", 2], ["Caio Meio", 2], ["Duda Pouco", 4], ["Gui Anulada", 5]]);
    assert.equal(por(rows, "Bia Meio").classification.label, "Adequado");
  });

  it("quem não concluiu nenhum tema fica no fim, sem colocação nem classificação; tema em andamento não soma", async () => {
    const { rows } = await get();
    const fora = rows.filter((r) => r.position === null);
    assert.deepEqual(fora.map((r) => r.name), ["Eli Andamento", "Fabi Nada"]);
    const eli = por(rows, "Eli Andamento");
    assert.deepEqual([eli.points, eli.concluded, eli.classification, eli.themes[0].status, eli.themes[0].points], [0, 0, null, "in_progress", 60]);
    assert.equal(rows.indexOf(fora[0]) > rows.findIndex((r) => r.name === "Gui Anulada"), true);
  });

  it("dados de demonstração só aparecem se o professor escolher", async () => {
    assert.equal(por((await get("scope=real")).rows, "Hugo Demo"), undefined);
    const todos = await get("scope=all");
    assert.equal(por(todos.rows, "Hugo Demo").position, 4, "240 pontos: atrás da Ana (860) e das duas empatadas (300)");
    assert.equal(por(todos.rows, "Duda Pouco").position, 5, "com a demonstração incluída, as colocações seguintes descem");
  });

  it("privacidade: outro professor não vê estes alunos; aluno e visitante não acessam", async () => {
    const b = await get("scope=all", profB);
    assert.equal(b.rows.some((r) => Object.keys(ids).includes(r.name)), false);
    assert.deepEqual(b.rows.map((r) => r.name), ["Aluno Do Outro Professor"]);
    const aluno = await login("ana.completa", "483921");
    assert.equal((await call("GET", "/api/admin/ranking", { cookie: aluno })).status, 403);
    assert.equal((await call("GET", "/api/admin/ranking")).status, 401);
  });
});
