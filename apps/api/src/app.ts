import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { HEADERS, verifyRequest } from "@financity/gateway-sign";
import bcrypt from "bcryptjs";
import { z, ZodError } from "zod";
import { config } from "./config.js";
import { HttpError, getSession, isStrongPassword, login, logout, requireRole, type Env } from "./lib/auth.js";
import { getPool, getSetting, one, q, setSetting, tx } from "./lib/db.js";
import { assessmentResult, assessmentState, listAssessments, startAttempt, submitAnswer } from "./lib/game.js";
import { assessmentsForTeacher, classReport, dashboard, parseScope, questionDetail, questionIdFor, studentReport, studentsCsvRows, type Filter } from "./lib/analytics.js";
import { countPendingPins, createStudents, generatePinsBatch, listStudents, log, releaseNewAttempt, resetPin, setActive, type BatchMode, type NewStudent } from "./lib/students.js";
import { removeDemo, seedDemo } from "./lib/demo.js";
import { csvResponse, toId } from "./lib/http.js";

export const app = new Hono<Env>();

/** Assinaturas já vistas na janela de validade: impede repetir (replay) uma chamada interceptada. */
const seen = new Map<string, number>();
function replayed(sig: string, now: number): boolean {
  for (const [k, exp] of seen) if (exp < now) seen.delete(k);
  if (seen.has(sig)) return true;
  seen.set(sig, now + 120_000);
  return false;
}

// Saúde: sem dados, sem assinatura (usada pelo Docker/monitoramento). Só confirma que o banco responde.
app.get("/healthz", async (c) => {
  try { await getPool().query("SELECT 1"); return c.json({ ok: true }); } catch { return c.json({ ok: false }, 503); }
});

app.use("*", async (c, next) => {
  const t0 = Date.now();
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Cache-Control", "no-store");
  c.header("Referrer-Policy", "no-referrer");
  // log sem corpo, sem query string, sem cookies e sem nomes: só método, caminho, status e duração
  if (config.isProd || process.env.API_LOG === "1") console.log(`${c.req.method} ${new URL(c.req.url).pathname} ${c.res.status} ${Date.now() - t0}ms`);
});

app.use("/api/*", bodyLimit({ maxSize: 1024 * 1024, onError: (c) => c.json({ error: "Requisição muito grande." }, 413) }));

// Só o gateway (Vercel) conhece o segredo: sem assinatura válida a API não responde a ninguém.
app.use("/api/*", async (c, next) => {
  const u = new URL(c.req.url);
  if (config.requireSignature) {
    const raw = c.req.method === "GET" || c.req.method === "HEAD" ? "" : await c.req.text();
    const headers = { [HEADERS.ts]: c.req.header(HEADERS.ts), [HEADERS.ip]: c.req.header(HEADERS.ip), [HEADERS.sig]: c.req.header(HEADERS.sig) };
    const ok = verifyRequest({ secret: config.gatewaySecret, method: c.req.method, pathAndQuery: u.pathname + u.search, body: raw, headers });
    if (!ok || replayed(headers[HEADERS.sig]!, Date.now())) return c.json({ error: "Não autorizado." }, 401);
    c.set("clientIp", headers[HEADERS.ip]!.slice(0, 64));
  } else {
    c.set("clientIp", (c.req.header("x-forwarded-for") || "").split(",")[0].trim() || "local"); // só desenvolvimento/testes
  }
  // CSRF extra: em requisições que alteram dados, a origem (se informada) precisa ser a do site.
  if (!["GET", "HEAD"].includes(c.req.method)) {
    const origin = c.req.header("origin");
    if (origin && !config.allowedOrigins.includes(origin)) return c.json({ error: "Origem não permitida." }, 403);
  }
  await next();
});

app.onError((e, c) => {
  if (e instanceof HttpError) return c.json({ error: e.message }, e.status as 400);
  if (e instanceof ZodError) return c.json({ error: "Requisição inválida." }, 400);
  console.error("erro:", e instanceof Error ? e.message : "desconhecido"); // sem corpo/stack com dados
  return c.json({ error: "Erro interno. Tente novamente." }, 500);
});

const json = async <T extends z.ZodTypeAny>(c: { req: { json(): Promise<unknown> } }, schema: T): Promise<z.infer<T>> => {
  let raw: unknown;
  try { raw = await c.req.json(); } catch { throw new HttpError(400, "Requisição inválida."); }
  return schema.parse(raw);
};

const filterOf = (c: { req: { query(k: string): string | undefined } }, teacherId: number): Filter => ({
  scope: parseScope(c.req.query("scope")), classId: toId(c.req.query("class")) || null, teacherId, assessmentId: toId(c.req.query("assessment")) || null,
});

// ───────── sessão ─────────
app.get("/api/session", async (c) => {
  const s = await getSession(c);
  return c.json({ session: s ? { role: s.role, name: s.name } : null });
});
app.post("/api/auth/login", async (c) => {
  const { username, password } = await json(c, z.object({ username: z.string().max(200), password: z.string().max(200) }));
  const u = await login(c, username, password);
  return c.json({ role: u.role, name: u.name, redirect: u.role === "teacher" ? "/admin" : "/jogo" });
});
app.post("/api/auth/logout", async (c) => { await logout(c); return c.json({ ok: true }); });

// ───────── aluno ─────────
app.get("/api/me", async (c) => {
  const u = await requireRole(c, "student");
  return c.json({ name: u.name, ...(await listAssessments(u.id)) });
});
app.post("/api/game/:id/start", async (c) => { const u = await requireRole(c, "student"); return c.json(await startAttempt(u.id, toId(c.req.param("id")))); });
app.get("/api/game/:id/state", async (c) => { const u = await requireRole(c, "student"); return c.json(await assessmentState(u.id, toId(c.req.param("id")))); });
app.get("/api/game/:id/result", async (c) => { const u = await requireRole(c, "student"); return c.json(await assessmentResult(u.id, toId(c.req.param("id")), u.name)); });
app.post("/api/game/:id/answer", async (c) => {
  const u = await requireRole(c, "student");
  const b = await json(c, z.object({ questionId: z.coerce.number().int(), optionId: z.coerce.number().int() }));
  return c.json(await submitAnswer(u.id, toId(c.req.param("id")), b.questionId, b.optionId));
});

// ───────── professor ─────────
app.get("/api/admin/classes", async (c) => {
  const t = await requireRole(c, "teacher");
  return c.json(await q("SELECT c.id,c.name,c.is_demo demo,c.grade FROM classes c JOIN teacher_classes tc ON tc.class_id=c.id WHERE tc.teacher_id=$1 ORDER BY c.name", [t.id]));
});
app.get("/api/admin/assessments", async (c) => { const t = await requireRole(c, "teacher"); return c.json(await assessmentsForTeacher(t.id)); });
app.get("/api/admin/dashboard", async (c) => { const t = await requireRole(c, "teacher"); return c.json(await dashboard(filterOf(c, t.id))); });
app.get("/api/admin/report", async (c) => { const t = await requireRole(c, "teacher"); return c.json(await classReport(filterOf(c, t.id))); });
app.post("/api/admin/demo", async (c) => { const t = await requireRole(c, "teacher"); return c.json(await seedDemo(t.id)); });
app.delete("/api/admin/demo", async (c) => { await requireRole(c, "teacher"); await removeDemo(); return c.json({ ok: true }); });

app.get("/api/admin/export", async (c) => {
  const t = await requireRole(c, "teacher");
  const f = filterOf(c, t.id);
  if (c.req.query("type") === "resumo") {
    const r = await classReport(f);
    return csvResponse("financity-resumo-questoes.csv", [
      ["Questão", "Tema", "Respostas", "Média de pontos", "Índice de desempenho (%)", "Decisões de 5 pontos", "Decisões de 0 ponto"],
      ...r.questions.map((x) => [`Q${x.number}`, x.theme, x.n, x.avg ?? "", x.index ?? "", x.excellent, x.inadequate]),
    ]);
  }
  return csvResponse("financity-turma.csv", await studentsCsvRows(f));
});

app.get("/api/admin/pins", async (c) => { const t = await requireRole(c, "teacher"); return c.json({ pending: await countPendingPins(t.id) }); });
app.post("/api/admin/pins", async (c) => {
  const t = await requireRole(c, "teacher");
  const b = await json(c, z.object({ mode: z.string(), ids: z.unknown().optional(), classId: z.unknown().optional(), confirm: z.boolean().optional() }));
  if (!["missing", "selected", "class"].includes(b.mode)) throw new HttpError(400, "Modo inválido.");
  if (b.confirm !== true) throw new HttpError(400, "Confirmação necessária para gerar ou redefinir PINs.");
  return c.json(await generatePinsBatch(b.mode as BatchMode, { ids: b.ids, classId: b.classId }, t.id));
});

app.get("/api/admin/questions/:number", async (c) => {
  const t = await requireRole(c, "teacher");
  const r = await questionDetail(toId(c.req.param("number")), filterOf(c, t.id));
  if (!r) throw new HttpError(404, "Questão não encontrada.");
  return c.json(r);
});
/** Configuração das pontuações. Vale para respostas futuras; as já gravadas mantêm a pontuação da época. */
app.put("/api/admin/questions/:number", async (c) => {
  const t = await requireRole(c, "teacher");
  const number = toId(c.req.param("number"));
  const { points } = await json(c, z.object({ points: z.record(z.string(), z.number()) }));
  const qid = await questionIdFor(number, filterOf(c, t.id));
  if (!qid) throw new HttpError(404, "Questão não encontrada.");
  const entries = Object.entries(points || {});
  if (entries.length !== 5 || entries.some(([l, v]) => !"ABCDE".includes(l) || !Number.isInteger(v) || v < 0 || v > 5))
    throw new HttpError(400, "Informe 5 pontuações inteiras entre 0 e 5.");
  await tx(async (cl) => {
    for (const [l, v] of entries) await q("UPDATE options SET points=$1 WHERE question_id=$2 AND letter=$3", [v, qid, l], cl);
    await log(t.id, "editar_pontuacoes", null, `Questão ${number}: ${JSON.stringify(points)}`, cl);
  });
  return c.json({ ok: true });
});

app.get("/api/admin/settings", async (c) => {
  await requireRole(c, "teacher");
  return c.json({ schoolName: await getSetting("school_name", ""), teacherName: await getSetting("teacher_name", "") });
});
app.put("/api/admin/settings", async (c) => {
  const t = await requireRole(c, "teacher");
  const b = await json(c, z.object({ schoolName: z.string().optional(), teacherName: z.string().optional(), currentPassword: z.string().max(200).optional(), newPassword: z.string().max(200).optional() }));
  if (b.newPassword) {
    const row = (await one<{ password_hash: string }>("SELECT password_hash FROM teachers WHERE id=$1", [t.id]))!;
    if (!b.currentPassword || !(await bcrypt.compare(b.currentPassword, row.password_hash))) throw new HttpError(400, "Senha atual incorreta.");
    if (!isStrongPassword(b.newPassword)) throw new HttpError(400, "A nova senha precisa ter 12+ caracteres, com maiúscula, minúscula, número e símbolo.");
    await q("UPDATE teachers SET password_hash=$1 WHERE id=$2", [await bcrypt.hash(b.newPassword, 12), t.id]);
  }
  if (typeof b.schoolName === "string") await setSetting("school_name", b.schoolName.slice(0, 120));
  if (typeof b.teacherName === "string") await setSetting("teacher_name", b.teacherName.slice(0, 120));
  return c.json({ ok: true });
});

app.get("/api/admin/students", async (c) => {
  const t = await requireRole(c, "teacher");
  return c.json(await listStudents(t.id, (c.req.query("q") || "").trim().slice(0, 60), toId(c.req.query("class")) || null, parseScope(c.req.query("scope"))));
});
app.post("/api/admin/students", async (c) => {
  const t = await requireRole(c, "teacher");
  const { rows } = await json(c, z.object({ rows: z.array(z.object({ name: z.string(), className: z.string(), pin: z.string().optional(), noPin: z.boolean().optional() })) }));
  if (!rows.length) throw new HttpError(400, "Nenhum aluno informado.");
  return c.json(await createStudents(rows as NewStudent[], t.id));
});
app.patch("/api/admin/students/:id", async (c) => {
  const t = await requireRole(c, "teacher");
  const id = toId(c.req.param("id"));
  const b = await json(c, z.object({ action: z.string(), pin: z.string().optional(), reason: z.string().optional(), confirm: z.boolean().optional(), assessment: z.number().int().optional() }));
  if (b.action === "reset_pin") return c.json({ pin: await resetPin(id, t.id, b.pin) });
  if (b.action === "deactivate") { await setActive(id, false, t.id); return c.json({ ok: true }); }
  if (b.action === "activate") { await setActive(id, true, t.id); return c.json({ ok: true }); }
  if (b.action === "new_attempt") {
    if (!b.confirm) throw new HttpError(400, "Confirmação necessária.");
    await releaseNewAttempt(id, t.id, String(b.reason || ""), b.assessment);
    return c.json({ ok: true });
  }
  throw new HttpError(400, "Ação desconhecida.");
});
app.get("/api/admin/students/:id/report", async (c) => {
  const t = await requireRole(c, "teacher");
  return c.json(await studentReport(t.id, toId(c.req.param("id")), toId(c.req.query("assessment")) || null));
});

app.notFound((c) => c.json({ error: "Não encontrado." }, 404));
