// Integridade das partidas / antitrapaça, em banco isolado "fc_integridade". Dados 100% fictícios.
import { before, after, describe, it } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import pg from "pg";

const ADMIN = process.env.PG_ADMIN_URL || "postgres://financity_dev:dev-local-only@127.0.0.1:54329/postgres";
process.env.DATABASE_URL = ADMIN.replace(/\/postgres$/, "/fc_integridade");
process.env.GATEWAY_SECRET = "segredo-de-teste-do-gateway-com-mais-de-32-caracteres";
delete process.env.REQUIRE_SIGNATURE;

const { signRequest } = await import("@financity/gateway-sign");
const { app } = await import("../src/app.js");
const { migrate } = await import("../src/migrate.js");
const { seedContent } = await import("../src/lib/seed-content.js");
const { createStudents } = await import("../src/lib/students.js");
const { closePool, one, q } = await import("../src/lib/db.js");
const { purgeExpired, minPlausibleSeconds } = await import("../src/lib/integrity.js");
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
const login = async (u: string, p: string) => { const r = await call("POST", "/api/auth/login", { body: { username: u, password: p } }); assert.equal(r.status, 200); return cookieOf(r); };

type Stu = { id: number; username: string; pin: string };
let AID = 0; // avaliação (mapa 1) da série 8

/** Responde a pergunta atual com a primeira opção (escolha) ou na ordem exibida. Retorna a resposta HTTP. */
async function responder(cookie: string, extra: Record<string, unknown> = {}) {
  const st = (await call("GET", `/api/game/${AID}/state`, { cookie })).json;
  const qq = st.question;
  const body = qq.kind === "choice" ? { optionId: qq.options[0].id } : qq.kind === "multi" ? { optionIds: [qq.options[0].id] } : { order: qq.options.map((o: any) => o.id) };
  return call("POST", `/api/game/${AID}/answer`, { cookie, body: { questionId: qq.id, ...body, ...extra } });
}
/** Faz o relógio de "pergunta entregue" parecer antigo: simula um aluno que leu com calma (sem indicador de rapidez). */
const parecerLento = (attemptId: number) => q("UPDATE attempts SET served_at = now() - interval '60 seconds' WHERE id=$1", [attemptId]);
const attemptOf = async (s: Stu) => (await one<{ id: number; total_points: number; integrity_status: string }>("SELECT id,total_points,integrity_status FROM attempts WHERE student_id=$1 AND assessment_id=$2 AND status<>'voided'", [s.id, AID]))!;
const evento = (cookie: string, type: string, extra: Record<string, unknown> = {}) => call("POST", `/api/game/${AID}/integrity/event`, { cookie, body: { type, ...extra } });
const eventosDe = async (s: Stu) => q<any>("SELECT * FROM integrity_events WHERE student_id=$1 ORDER BY id", [s.id]);
const configurar = (cookie: string, patch: Record<string, unknown>) => call("PUT", "/api/admin/integrity/config", { cookie, body: patch }); // o corpo é o objeto completo

describe("integridade das partidas (antitrapaça)", () => {
  let profA: string, profB: string;
  let tA = 0;
  const alunos: Stu[] = [];
  const logins: string[] = [];
  const novoAluno = async (i: number) => {
    const s = alunos[i];
    logins[i] ??= await login(s.username, s.pin);
    await call("POST", `/api/game/${AID}/start`, { cookie: logins[i] });
    return logins[i];
  };

  before(async () => {
    const c = new pg.Client(ADMIN); await c.connect();
    await c.query("DROP DATABASE IF EXISTS fc_integridade WITH (FORCE)"); await c.query("CREATE DATABASE fc_integridade"); await c.end();
    await migrate(); await seedContent();
    const ta = await one<{ id: number }>("INSERT INTO teachers(username,name,password_hash) VALUES($1,$2,$3) RETURNING id", ["prof.a", "Prof A", await bcrypt.hash("Senha-Forte-1!", 4)]);
    tA = ta!.id;
    await one("INSERT INTO teachers(username,name,password_hash) VALUES($1,$2,$3) RETURNING id", ["prof.b", "Prof B", await bcrypt.hash("Senha-Forte-2!", 4)]);
    const pins = ["483921", "719364", "256013", "902417", "135790", "246813", "357924", "468035", "579146", "680257", "791368", "802479"];
    const r = await createStudents(pins.map((pin, i) => ({ name: `Aluno Fictício ${i + 1}`, className: "8 ano", pin })), tA);
    r.created.forEach((s: any, i: number) => alunos.push({ id: s.id, username: s.username, pin: pins[i] }));
    const tb = (await one<{ id: number }>("SELECT id FROM teachers WHERE username='prof.b'"))!.id;
    await createStudents([{ name: "Aluno Do Professor B", className: "8 B", pin: "913572" }], tb);
    profA = await login("prof.a", "Senha-Forte-1!"); profB = await login("prof.b", "Senha-Forte-2!");
    const me = (await call("GET", "/api/me", { cookie: await login(alunos[0].username, alunos[0].pin) })).json;
    AID = me.maps[0].id;
  });
  after(async () => { await closePool(); });

  describe("o que NÃO gera penalidade", () => {
    it("minimizar/voltar à página não existe como evento: o servidor não tem como receber 'aba oculta'", async () => {
      const ck = await novoAluno(0);
      const r = await evento(ck, "aba_oculta"); // tipo fora da lista fixa
      assert.equal(r.status, 400);
      assert.equal((await eventosDe(alunos[0])).length, 0);
    });
    it("atualizar a página restaura a partida no mesmo ponto, sem zerar o relógio de leitura", async () => {
      const ck = await novoAluno(0);
      const s1 = (await call("GET", `/api/game/${AID}/state`, { cookie: ck })).json;
      const t1 = (await one<{ served_at: string }>("SELECT served_at FROM attempts WHERE student_id=$1 AND assessment_id=$2", [alunos[0].id, AID]))!.served_at;
      const s2 = (await call("GET", `/api/game/${AID}/state`, { cookie: ck })).json; // "F5"
      const t2 = (await one<{ served_at: string }>("SELECT served_at FROM attempts WHERE student_id=$1 AND assessment_id=$2", [alunos[0].id, AID]))!.served_at;
      assert.equal(s2.question.id, s1.question.id); assert.equal(s2.answered, s1.answered);
      assert.equal(String(t1), String(t2)); assert.equal(s2.integrity.status, "ok");
    });
    it("perder a conexão não perde progresso: respostas já gravadas continuam no servidor", async () => {
      const ck = await novoAluno(0);
      await parecerLento((await attemptOf(alunos[0])).id);
      assert.equal((await responder(ck)).status, 200);
      const depois = (await call("GET", `/api/game/${AID}/state`, { cookie: ck })).json; // volta a conexão
      assert.equal(depois.answered, 1);
    });
  });

  describe("atividade incomum (gravidade 1): só alerta", () => {
    it("atalho de impressão: registra, avisa em termos neutros, sem pausa nem desconto", async () => {
      const ck = await novoAluno(1);
      const r = await evento(ck, "atalho_impressao", { detail: "Ctrl+P", device: "computador · Windows · Chrome" });
      assert.equal(r.status, 200); assert.equal(r.json.action, "notice");
      assert.match(r.json.message, /atividade incomum identificada/i);
      assert.doesNotMatch(r.json.message, /trapace|fraude|colou/i);
      const ev = (await eventosDe(alunos[1]))[0];
      assert.equal(ev.severity, 1); assert.equal(ev.certainty, "detected"); assert.equal(ev.penalty, "none"); assert.equal(ev.status, "pending"); assert.equal(ev.points_deducted, 0);
      assert.equal((await attemptOf(alunos[1])).integrity_status, "ok");
      await parecerLento((await attemptOf(alunos[1])).id);
      assert.equal((await responder(ck)).status, 200, "a partida continua aceitando respostas");
    });
    it("tecla de captura de tela: a mensagem não afirma que a captura ocorreu", async () => {
      const ck = await novoAluno(1);
      const r = await evento(ck, "tecla_captura_tela", { detail: "PrintScreen" });
      assert.match(r.json.message, /não confirma|atividade incomum/i);
      const ev = (await eventosDe(alunos[1])).find((e) => e.event_type === "tecla_captura_tela");
      assert.match(JSON.stringify(ev.evidence), /pressionad/);
      assert.doesNotMatch(JSON.stringify(ev.evidence), /capturou|capturada/i);
    });
    it("a mesma tecla repetida em sequência imediata é registrada uma vez", async () => {
      const ck = await novoAluno(1);
      const antes = (await eventosDe(alunos[1])).filter((e) => e.event_type === "atalho_impressao").length;
      await evento(ck, "atalho_impressao"); await evento(ck, "atalho_impressao");
      const depois = (await eventosDe(alunos[1])).filter((e) => e.event_type === "atalho_impressao").length;
      assert.ok(depois - antes <= 1);
    });
  });

  describe("violação detectada (gravidade 2): pausa, impede respostas e registra", () => {
    it("cópia do conteúdo: partida suspensa, motivo exato, 423 ao responder, volta ao fim da suspensão", async () => {
      const ck = await novoAluno(2);
      const r = await evento(ck, "copia_conteudo", { device: "celular · Android · Chrome" });
      assert.equal(r.json.action, "suspended"); assert.ok(r.json.secondsLeft > 0);
      assert.match(r.json.message, /copiar ou recortar o conteúdo/); assert.match(r.json.message, /registrada para análise do professor/);
      const bloqueada = await responder(ck); assert.equal(bloqueada.status, 423);
      const st = (await call("GET", `/api/game/${AID}/state`, { cookie: ck })).json; assert.equal(st.integrity.status, "suspended");
      assert.equal((await attemptOf(alunos[2])).total_points, 0, "nada foi gravado durante a suspensão");
      await q("UPDATE attempts SET integrity_until = now() - interval '1 second' WHERE student_id=$1", [alunos[2].id]);
      await parecerLento((await attemptOf(alunos[2])).id);
      assert.equal((await responder(ck)).status, 200, "terminada a suspensão, o aluno continua");
      const ev = (await eventosDe(alunos[2]))[0];
      assert.equal(ev.severity, 2); assert.equal(ev.penalty, "suspension"); assert.equal(ev.points_deducted, 0); assert.equal(ev.device, "celular · Android · Chrome");
    });
    it("reincidência: na 3ª violação a partida é BLOQUEADA e só o professor libera", async () => {
      const ck = await novoAluno(3);
      for (let i = 0; i < 2; i++) { await q("UPDATE integrity_events SET detected_at = detected_at - interval '10 seconds' WHERE student_id=$1", [alunos[3].id]); await evento(ck, "impressao_iniciada"); await q("UPDATE attempts SET integrity_until = now() - interval '1 second' WHERE student_id=$1", [alunos[3].id]); }
      await q("UPDATE integrity_events SET detected_at = detected_at - interval '10 seconds' WHERE student_id=$1", [alunos[3].id]);
      const r = await evento(ck, "copia_conteudo");
      assert.equal(r.json.action, "blocked"); assert.match(r.json.message, /liberação do professor/);
      const a = await attemptOf(alunos[3]); assert.equal(a.integrity_status, "blocked");
      assert.equal((await responder(ck)).status, 423);
      await q("UPDATE attempts SET integrity_until = now() - interval '1 second' WHERE student_id=$1", [alunos[3].id]);
      assert.equal((await responder(ck)).status, 423, "bloqueio não expira sozinho");
      // professor libera (com motivo, auditado)
      assert.equal((await call("POST", `/api/admin/integrity/attempts/${a.id}/release`, { cookie: profA, body: { note: "" } })).status, 400, "motivo obrigatório");
      assert.equal((await call("POST", `/api/admin/integrity/attempts/${a.id}/release`, { cookie: profA, body: { note: "Conversei com o aluno" } })).status, 200);
      await parecerLento(a.id);
      assert.equal((await responder(ck)).status, 200, "liberada: continua de onde parou");
      const aud = await q<any>("SELECT action FROM integrity_audit WHERE attempt_id=$1", [a.id]); assert.deepEqual(aud.map((x) => x.action), ["liberar_partida"]);
    });
    it("depois da liberação a contagem de reincidência recomeça (uma nova violação não bloqueia de novo)", async () => {
      const ck = logins[3];
      await q("UPDATE integrity_events SET detected_at = detected_at - interval '10 seconds' WHERE student_id=$1", [alunos[3].id]);
      const r = await evento(ck, "copia_conteudo");
      assert.equal(r.json.action, "suspended");
    });
  });

  describe("desconto de pontos: opcional, só para violações detectadas, reversível e auditado", () => {
    it("desligado por padrão; ligado, desconta no servidor e o professor devolve ao cancelar a penalidade", async () => {
      const cfg = (await call("GET", "/api/admin/integrity/config", { cookie: profA })).json;
      assert.equal(cfg.deductPoints, 0, "padrão: sem desconto automático");
      assert.equal((await configurar(profA, { ...cfg, deductPoints: 1 })).status, 200);
      const ck = await novoAluno(4);
      await parecerLento((await attemptOf(alunos[4])).id);
      assert.equal((await responder(ck)).status, 200);
      const antes = (await attemptOf(alunos[4])).total_points;
      assert.ok(antes >= 1);
      await evento(ck, "copia_conteudo");
      assert.equal((await attemptOf(alunos[4])).total_points, antes - 1);
      const ev = (await eventosDe(alunos[4]))[0]; assert.equal(ev.points_deducted, 1);
      // cancelar sem motivo: recusado; com motivo: devolve e libera
      assert.equal((await call("PATCH", `/api/admin/integrity/events/${ev.id}`, { cookie: profA, body: { action: "cancel_penalty" } })).status, 400);
      assert.equal((await call("PATCH", `/api/admin/integrity/events/${ev.id}`, { cookie: profA, body: { action: "cancel_penalty", note: "Clique acidental" } })).status, 200);
      assert.equal((await attemptOf(alunos[4])).total_points, antes, "pontos devolvidos");
      assert.equal((await attemptOf(alunos[4])).integrity_status, "ok", "a suspensão causada por esta ocorrência foi liberada");
      assert.equal((await call("PATCH", `/api/admin/integrity/events/${ev.id}`, { cookie: profA, body: { action: "cancel_penalty", note: "de novo" } })).status, 409, "não devolve duas vezes");
      assert.equal((await attemptOf(alunos[4])).total_points, antes);
      await configurar(profA, { ...cfg, deductPoints: 0 });
    });
    it("indicadores e eventos de gravidade 1 NUNCA descontam, mesmo com desconto ligado", async () => {
      const cfg = (await call("GET", "/api/admin/integrity/config", { cookie: profA })).json;
      await configurar(profA, { ...cfg, deductPoints: 5 });
      const ck = await novoAluno(5);
      assert.equal((await responder(ck)).status, 200); // resposta imediata => indicador de rapidez
      await evento(ck, "atalho_impressao");
      const a = await attemptOf(alunos[5]);
      const opt = await one<{ points: number }>("SELECT total_points points FROM attempts WHERE id=$1", [a.id]);
      const gravadas = (await one<{ s: number }>("SELECT COALESCE(SUM(points),0)::int s FROM answers WHERE attempt_id=$1", [a.id]))!.s;
      assert.equal(opt!.points, gravadas, "total = soma das respostas, sem desconto");
      const evs = await eventosDe(alunos[5]);
      assert.ok(evs.length >= 1); assert.ok(evs.every((e) => e.points_deducted === 0 && e.penalty === "none"));
      await configurar(profA, { ...cfg, deductPoints: 0 });
    });
  });

  describe("indicadores do servidor (revisão, não acusação)", () => {
    it("resposta mais rápida que o tempo mínimo plausível vira indicador (gravidade 1, sem penalidade)", async () => {
      const ck = await novoAluno(6);
      assert.equal((await responder(ck)).status, 200);
      const ev = (await eventosDe(alunos[6])).find((e) => e.event_type === "resposta_muito_rapida")!;
      assert.ok(ev); assert.equal(ev.certainty, "indicator"); assert.equal(ev.severity, 1); assert.equal(ev.penalty, "none"); assert.equal(ev.source, "server");
      assert.equal((await attemptOf(alunos[6])).integrity_status, "ok");
    });
    it("tempo mínimo plausível cresce com o enunciado, entre 2 e 8 s", () => {
      assert.equal(minPlausibleSeconds("Oi"), 2);
      assert.ok(minPlausibleSeconds("palavra ".repeat(30)) > 3);
      assert.equal(minPlausibleSeconds("palavra ".repeat(500)), 8);
    });
    it("resposta com tempo de leitura normal NÃO gera indicador", async () => {
      const ck = await novoAluno(7);
      await parecerLento((await attemptOf(alunos[7])).id);
      assert.equal((await responder(ck)).status, 200);
      assert.equal((await eventosDe(alunos[7])).length, 0);
    });
    it("3 respostas rápidas seguidas geram também o indicador de sequência", async () => {
      const ck = await novoAluno(8);
      for (let i = 0; i < 3; i++) assert.equal((await responder(ck)).status, 200);
      const tipos = (await eventosDe(alunos[8])).map((e) => e.event_type);
      assert.ok(tipos.includes("sequencia_respostas_rapidas"), tipos.join(","));
    });
    it("envio em rajada (automação) é recusado com 429 e deixa indicador", async () => {
      const ck = await novoAluno(9);
      const st = (await call("GET", `/api/game/${AID}/state`, { cookie: ck })).json;
      const codigos: number[] = [];
      for (let i = 0; i < 12; i++) codigos.push((await call("POST", `/api/game/${AID}/answer`, { cookie: ck, body: { questionId: st.question.id, optionId: st.question.options[0].id } })).status);
      assert.ok(codigos.includes(429), codigos.join(","));
      assert.equal(codigos.filter((c) => c === 200).length, 1, "só uma resposta foi aceita");
      assert.ok((await eventosDe(alunos[9])).some((e) => e.event_type === "requisicoes_anormais"));
    });
    it("duas sessões do mesmo aluno ativas ao mesmo tempo viram indicador; sessão única opcional encerra a anterior", async () => {
      const s = alunos[10];
      const a = await login(s.username, s.pin), b = await login(s.username, s.pin);
      await call("POST", `/api/game/${AID}/start`, { cookie: a });
      await call("POST", "/api/presence/ping", { cookie: a }); await call("POST", "/api/presence/ping", { cookie: b });
      assert.equal((await responder(b)).status, 200);
      assert.ok((await eventosDe(s)).some((e) => e.event_type === "sessoes_simultaneas"));
      const cfg = (await call("GET", "/api/admin/integrity/config", { cookie: profA })).json;
      await configurar(profA, { ...cfg, singleSession: true });
      const c = await login(s.username, s.pin);
      assert.equal((await call("GET", "/api/me", { cookie: a })).status, 401, "sessão anterior encerrada");
      assert.equal((await call("GET", "/api/me", { cookie: c })).status, 200);
      await configurar(profA, { ...cfg, singleSession: false });
    });
  });

  describe("integridade do servidor: pontuação, gabarito e parâmetros", () => {
    it("o aluno não consegue forçar pontos pelo corpo da requisição ou pelo console", async () => {
      const ck = await novoAluno(11);
      await parecerLento((await attemptOf(alunos[11])).id);
      const st = (await call("GET", `/api/game/${AID}/state`, { cookie: ck })).json;
      const op = st.question.options[0].id;
      const r = await call("POST", `/api/game/${AID}/answer`, { cookie: ck, body: { questionId: st.question.id, optionId: op, points: 999, score: 999, totalPoints: 999, earned: 999, max_points: 999, is_correct: true } });
      assert.equal(r.status, 200);
      const real = (await one<{ points: number; mx: number }>("SELECT o.points, q.max_points mx FROM options o JOIN questions q ON q.id=o.question_id WHERE o.id=$1", [op]))!;
      assert.equal(r.json.earned, real.points); assert.equal(r.json.score, real.points);
      assert.equal((await attemptOf(alunos[11])).total_points, real.points);
    });
    it("não é possível responder outra pergunta que não a atual nem repetir uma resposta", async () => {
      const ck = logins[11];
      const st = (await call("GET", `/api/game/${AID}/state`, { cookie: ck })).json;
      const outra = (await one<{ id: number }>("SELECT id FROM questions WHERE map_id=(SELECT map_id FROM assessments WHERE id=$1) AND id<>$2 ORDER BY number DESC LIMIT 1", [AID, st.question.id]))!.id;
      assert.equal((await call("POST", `/api/game/${AID}/answer`, { cookie: ck, body: { questionId: outra, optionId: st.question.options[0].id } })).status, 409);
    });
    it("estado, lista e resultado não carregam gabarito, pontos por alternativa nem explicações", async () => {
      const ck = logins[11];
      const textos = [(await call("GET", "/api/me", { cookie: ck })).text, (await call("GET", `/api/game/${AID}/state`, { cookie: ck })).text];
      for (const t of textos) for (const chave of ["is_correct", "isCorrect", "\"why\"", "strength", "retake", "legacy_points", "\"points\""]) assert.ok(!t.includes(chave), `vazou ${chave}`);
      assert.equal((await call("GET", `/api/game/${AID}/result`, { cookie: ck })).status, 409, "resultado só depois de concluir");
    });
    it("aluno de outra série não alcança a avaliação (404)", async () => {
      await call("POST", "/api/admin/students", { cookie: profA, body: { rows: [{ name: "Aluno Sétimo Fictício", className: "7 ano", pin: "864209" }] } });
      const ck = await login((await one<{ username: string }>("SELECT username FROM students WHERE full_name='Aluno Sétimo Fictício'"))!.username, "864209");
      assert.equal((await evento(ck, "atalho_impressao")).status, 404);
    });
    it("evento sem partida em andamento não cria registro", async () => {
      const s = alunos[11];
      const antes = (await eventosDe(s)).length;
      await q("UPDATE attempts SET status='completed' WHERE student_id=$1", [s.id]);
      const r = await evento(logins[11], "copia_conteudo");
      assert.equal(r.json.action, "none"); assert.equal((await eventosDe(s)).length, antes);
      await q("UPDATE attempts SET status='in_progress' WHERE student_id=$1", [s.id]);
    });
  });

  describe("o aluno não mexe no histórico nem no painel", () => {
    it("rotas administrativas de integridade respondem 403 para aluno, e 401 sem login", async () => {
      const ck = logins[1];
      const ev = (await eventosDe(alunos[1]))[0];
      for (const [m, p, b] of [["GET", "/api/admin/integrity/summary"], ["GET", "/api/admin/integrity/events"], ["GET", `/api/admin/integrity/events/${ev.id}`], ["PATCH", `/api/admin/integrity/events/${ev.id}`, { action: "justify", note: "eu mesmo" }],
        ["PUT", "/api/admin/integrity/config", {}], ["GET", "/api/admin/integrity/audit"], ["POST", "/api/admin/integrity/attempts/1/release", { note: "liberar eu" }]] as const) {
        assert.equal((await call(m, p, { cookie: ck, body: b })).status, 403, `${m} ${p}`);
        assert.equal((await call(m, p, { body: b })).status, 401, `${m} ${p} sem login`);
      }
    });
    it("não existe rota para o aluno apagar/alterar ocorrências (DELETE/PATCH/PUT em /api/game/.../integrity)", async () => {
      const ck = logins[1];
      for (const m of ["DELETE", "PATCH", "PUT"]) assert.equal((await call(m, `/api/game/${AID}/integrity/event`, { cookie: ck, body: {} })).status, 404);
      const ev = (await eventosDe(alunos[1]))[0];
      assert.equal((await call("DELETE", `/api/admin/integrity/events/${ev.id}`, { cookie: ck })).status, 404);
    });
    it("o aluno não escolhe gravidade nem penalidade: campos extras são ignorados", async () => {
      const ck = await novoAluno(1);
      await evento(ck, "tecla_captura_tela", { severity: 3, penalty: "block", status: "justified", points_deducted: 5 });
      const ev = (await eventosDe(alunos[1])).filter((e) => e.event_type === "tecla_captura_tela").pop();
      assert.equal(ev.severity, 1); assert.equal(ev.penalty, "none"); assert.equal(ev.status, "pending");
    });
    it("a configuração pública do aluno não revela regras de penalidade", async () => {
      const r = (await call("GET", "/api/integrity/config", { cookie: logins[1] })).json;
      assert.deepEqual(Object.keys(r).sort(), ["enabled", "name", "protectCopy", "protectPrint", "sessionRef", "watermark"]);
      assert.match(r.sessionRef, /^[0-9A-F]{8}$/);
    });
  });

  describe("painel do professor", () => {
    it("lista e resumo: vê ocorrências dos seus alunos, diferenciando detectado × indicador", async () => {
      const sum = (await call("GET", "/api/admin/integrity/summary?scope=real", { cookie: profA })).json;
      assert.ok(sum.studentsWithEvents >= 1); assert.ok(sum.pending >= 1); assert.ok(sum.pendingIndicators >= 1); assert.ok(sum.pendingDetected >= 1);
      const ev = (await call("GET", "/api/admin/integrity/events?scope=real", { cookie: profA })).json as any[];
      assert.ok(ev.some((e) => e.certainty === "detected") && ev.some((e) => e.certainty === "indicator"));
      for (const campo of ["studentName", "className", "assessmentTitle", "eventType", "severity", "penalty", "status", "detectedAt", "device", "recurrences"]) assert.ok(campo in ev[0], campo);
    });
    it("filtros: gravidade, situação, aluno e data", async () => {
      const so2 = (await call("GET", "/api/admin/integrity/events?scope=real&severity=2", { cookie: profA })).json as any[];
      assert.ok(so2.length && so2.every((e) => e.severity === 2));
      const aluno = (await call("GET", `/api/admin/integrity/events?scope=real&student=${alunos[2].id}`, { cookie: profA })).json as any[];
      assert.ok(aluno.length && aluno.every((e) => e.studentId === alunos[2].id));
      const futuro = (await call("GET", "/api/admin/integrity/events?scope=real&from=2999-01-01", { cookie: profA })).json as any[];
      assert.equal(futuro.length, 0);
      const hoje = new Date().toISOString().slice(0, 10);
      assert.ok(((await call("GET", `/api/admin/integrity/events?scope=real&from=${hoje}&to=${hoje}`, { cookie: profA })).json as any[]).length >= 1);
    });
    it("professor identifica, confirma, justifica; tudo fica na auditoria", async () => {
      const ev = (await eventosDe(alunos[2]))[0];
      const det = (await call("GET", `/api/admin/integrity/events/${ev.id}`, { cookie: profA })).json;
      assert.equal(det.studentName, "Aluno Fictício 3"); assert.ok(det.evidence.observado); assert.ok(Array.isArray(det.history));
      assert.equal((await call("PATCH", `/api/admin/integrity/events/${ev.id}`, { cookie: profA, body: { action: "confirm" } })).status, 200);
      assert.equal((await call("PATCH", `/api/admin/integrity/events/${ev.id}`, { cookie: profA, body: { action: "confirm" } })).status, 409);
      const j = await call("PATCH", `/api/admin/integrity/events/${ev.id}`, { cookie: profA, body: { action: "justify", note: "Aluno usou leitor de tela" } });
      assert.equal(j.status, 200); assert.equal(j.json.status, "justified"); assert.ok(j.json.penaltyCancelledAt);
      assert.deepEqual(j.json.trail.map((t: any) => t.action), ["confirmar", "justificar"]);
      assert.equal((await call("PATCH", `/api/admin/integrity/events/${ev.id}`, { cookie: profA, body: { action: "confirm" } })).status, 409, "justificada não volta a ser confirmada");
    });
    it("professor B não vê, não revisa e não libera nada dos alunos do professor A", async () => {
      const ev = (await eventosDe(alunos[1]))[0];
      assert.equal((await call("GET", `/api/admin/integrity/events/${ev.id}`, { cookie: profB })).status, 404);
      assert.equal((await call("PATCH", `/api/admin/integrity/events/${ev.id}`, { cookie: profB, body: { action: "justify", note: "tentando" } })).status, 404);
      assert.equal((await call("POST", `/api/admin/integrity/attempts/${(await attemptOf(alunos[1])).id}/release`, { cookie: profB, body: { note: "tentando" } })).status, 404);
      const lista = (await call("GET", "/api/admin/integrity/events?scope=real", { cookie: profB })).json as any[];
      assert.equal(lista.length, 0);
      const s = (await call("GET", "/api/admin/integrity/summary?scope=real", { cookie: profB })).json;
      assert.equal(s.pending, 0); assert.equal(s.blockedNow, 0);
    });
    it("regras: validação no servidor e alteração auditada", async () => {
      const cfg = (await call("GET", "/api/admin/integrity/config", { cookie: profA })).json;
      assert.equal((await configurar(profA, { ...cfg, suspendSeconds: 99999 })).status, 400);
      assert.equal((await configurar(profA, { ...cfg, eventSeverity: { ...cfg.eventSeverity, copia_conteudo: 3 } })).status, 400, "cliente nunca recebe gravidade 3 direta");
      const ok = await configurar(profA, { ...cfg, watermark: true });
      assert.equal(ok.status, 200); assert.equal(ok.json.watermark, true);
      assert.equal((await call("GET", "/api/integrity/config", { cookie: logins[1] })).json.watermark, true);
      const aud = (await call("GET", "/api/admin/integrity/audit", { cookie: profA })).json as any[];
      assert.ok(aud.some((a) => a.action === "config"));
      await configurar(profA, { ...cfg, watermark: false });
    });
    it("sistema desligado: nada é registrado nem bloqueado", async () => {
      const cfg = (await call("GET", "/api/admin/integrity/config", { cookie: profA })).json;
      await configurar(profA, { ...cfg, enabled: false });
      const ck = logins[1];
      const antes = (await eventosDe(alunos[1])).length;
      assert.equal((await evento(ck, "copia_conteudo")).json.action, "none");
      assert.equal((await eventosDe(alunos[1])).length, antes);
      assert.equal((await call("GET", "/api/integrity/config", { cookie: ck })).json.protectCopy, false);
      await configurar(profA, { ...cfg, enabled: true });
    });
  });

  describe("LGPD: retenção e exclusão", () => {
    it("ocorrências mais antigas que o prazo são apagadas; as recentes ficam", async () => {
      const velha = await one<{ id: number }>("INSERT INTO integrity_events(student_id,event_type,severity,certainty,source,detected_at) VALUES($1,'atalho_impressao',1,'detected','client', now() - interval '400 days') RETURNING id", [alunos[0].id]);
      const recentes = (await eventosDe(alunos[1])).length;
      const r = await purgeExpired();
      assert.ok(r.events >= 1);
      assert.equal(await one("SELECT 1 FROM integrity_events WHERE id=$1", [velha!.id]), undefined);
      assert.equal((await eventosDe(alunos[1])).length, recentes);
    });
    it("excluir o aluno apaga as ocorrências dele", async () => {
      const s = alunos[6];
      assert.ok((await eventosDe(s)).length >= 1);
      const r = await call("POST", "/api/admin/students/delete", { cookie: profA, body: { ids: [s.id], confirm: true } });
      assert.equal(r.status, 200);
      assert.equal((await eventosDe(s)).length, 0);
    });
  });
});
