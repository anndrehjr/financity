// Migração SQLite -> PostgreSQL com verificação.
//   DATABASE_URL=<destino VAZIO> npx tsx scripts/sqlite-to-pg.ts <copia-do-sqlite.db> [--report relatorio.json]
//
// Garantias:
//  * Lê o SQLite em modo SOMENTE LEITURA (use uma cópia/backup, nunca o arquivo em uso).
//  * Recusa-se a rodar se o destino já tiver dados (nunca sobrescreve).
//  * Preserva os IDs de todas as tabelas; ajusta as sequências.
//  * Não migra `sessions` nem `login_attempts` (efêmeras: todos entram de novo; o bloqueio de login recomeça limpo).
//  * Aplica a migração 002 (séries/avaliações) depois da importação e confere o resultado.
//  * Relatório: só contagens, hashes e IDs — nunca nomes, usuários, PINs ou senhas.
import Database from "better-sqlite3";
import crypto from "crypto";
import fs from "fs";
import pg from "pg";
import { config } from "../src/config.js";
import { migrate } from "../src/migrate.js";
import { closePool, getPool } from "../src/lib/db.js";
import { dashboard } from "../src/lib/analytics.js";
import { gradeFromName } from "../src/lib/scope.js";

const [sqlitePath, ...rest] = process.argv.slice(2);
if (!sqlitePath || !fs.existsSync(sqlitePath)) { console.error("Informe o caminho da CÓPIA do SQLite."); process.exit(2); }
const reportPath = rest[rest.indexOf("--report") + 1] && rest.includes("--report") ? rest[rest.indexOf("--report") + 1] : null;

const sq = new Database(sqlitePath, { readonly: true, fileMustExist: true });
const pool = getPool();
const ts = (s: string | null) => (s ? new Date(s.replace(" ", "T") + "Z") : null); // SQLite grava UTC sem fuso

type Row = Record<string, unknown>;
const all = (t: string): Row[] => sq.prepare(`SELECT * FROM ${t} ORDER BY ${t === "settings" ? "key" : "id"}`).all() as Row[];

/** tabela -> colunas (na ordem de inserção) e quais são timestamps / json */
const TABLES: { t: string; cols: string[]; ts?: string[]; json?: string[]; identity: boolean }[] = [
  { t: "teachers", cols: ["id", "username", "name", "password_hash", "created_at"], ts: ["created_at"], identity: true },
  { t: "classes", cols: ["id", "name", "is_demo", "created_at"], ts: ["created_at"], identity: true },
  { t: "students", cols: ["id", "full_name", "class_id", "username", "pin_hash", "pin_fp", "active", "is_demo", "created_at"], ts: ["created_at"], identity: true },
  { t: "maps", cols: ["id", "sort", "slug", "title", "subtitle", "topics", "status"], json: ["topics"], identity: true },
  { t: "questions", cols: ["id", "map_id", "number", "title", "theme", "scene", "scenario", "dialog", "prompt", "note", "strength", "retake"], identity: true },
  { t: "options", cols: ["id", "question_id", "letter", "text", "points", "why"], identity: true },
  { t: "attempts", cols: ["id", "student_id", "map_id", "status", "total_points", "started_at", "completed_at", "voided_at"], ts: ["started_at", "completed_at", "voided_at"], identity: true },
  { t: "answers", cols: ["id", "attempt_id", "question_id", "option_id", "points", "display_pos", "answered_at"], ts: ["answered_at"], identity: true },
  { t: "admin_log", cols: ["id", "teacher_id", "action", "student_id", "detail", "created_at"], ts: ["created_at"], identity: true },
  { t: "settings", cols: ["key", "value"], identity: false },
];

const sha = (v: unknown) => crypto.createHash("sha256").update(JSON.stringify(v)).digest("hex");
const norm = (v: unknown): unknown => (v instanceof Date ? Math.floor(v.getTime() / 1000) : v === undefined ? null : v);

async function main() {
  const c = await pool.connect();
  const report: Record<string, unknown> = { quando: new Date().toISOString(), origem_sqlite: sqlitePath.split(/[\\/]/).pop(), destino: "PostgreSQL (DATABASE_URL)", tabelas: {} as Record<string, unknown> };
  let failures = 0;
  const fail = (msg: string) => { failures++; console.error("  ✘", msg); };
  const okLine = (msg: string) => console.log("  ✔", msg);

  try {
    // 0) integridade do SQLite de origem
    const ic = sq.pragma("integrity_check", { simple: true });
    if (ic !== "ok") throw new Error(`SQLite de origem com problema de integridade: ${ic}`);

    // 1) destino precisa ser novo: só migração 001 aplicada e tabelas vazias
    await migrate({ upTo: 1 });
    for (const { t } of TABLES) {
      const n = (await c.query(`SELECT COUNT(*)::int n FROM ${t}`)).rows[0].n as number;
      if (n > 0) throw new Error(`Destino não está vazio (${t} tem ${n} linhas). Use um banco novo.`);
    }

    // 2) importação em UMA transação (tudo ou nada)
    console.log("Importando…");
    await c.query("BEGIN");
    for (const { t, cols, ts: tsCols = [], json = [], identity } of TABLES) {
      const rows = all(t);
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(",");
      const sql = `INSERT INTO ${t}(${cols.join(",")}) ${identity ? "OVERRIDING SYSTEM VALUE" : ""} VALUES (${placeholders})`;
      for (const r of rows) {
        await c.query(sql, cols.map((k) => (tsCols.includes(k) ? ts(r[k] as string | null) : json.includes(k) ? JSON.parse(r[k] as string) : r[k] ?? null)).map((v, i) => (json.includes(cols[i]) ? JSON.stringify(v) : v)));
      }
      if (identity) await c.query(`SELECT setval(pg_get_serial_sequence('${t}','id'), GREATEST((SELECT COALESCE(MAX(id),0) FROM ${t}),1), (SELECT COUNT(*)>0 FROM ${t}))`);
      (report.tabelas as Record<string, unknown>)[t] = { linhas_sqlite: rows.length };
      console.log(`  ${t}: ${rows.length}`);
    }
    await c.query("COMMIT");
  } catch (e) {
    try { await c.query("ROLLBACK"); } catch { /* sem transação aberta */ }
    c.release();
    throw e;
  }
  c.release();

  // 3) migração 002 (séries, avaliações, vínculo professor-turma)
  const applied = await migrate();
  console.log("Migrações aplicadas após importar:", applied.join(", ") || "(nenhuma)");

  // 4) verificação tabela a tabela: contagem + hash de TODAS as colunas migradas, linha a linha
  console.log("\nVerificação");
  for (const { t, cols, ts: tsCols = [], json = [] } of TABLES) {
    const a = all(t).map((r) => cols.map((k) => (tsCols.includes(k) ? norm(ts(r[k] as string | null)) : json.includes(k) ? JSON.stringify(JSON.parse(r[k] as string)) : r[k] ?? null)));
    const orderBy = t === "settings" ? "key" : "id";
    const pr = (await pool.query(`SELECT ${cols.join(",")} FROM ${t} ORDER BY ${orderBy}`)).rows;
    const b = pr.map((r) => cols.map((k) => (tsCols.includes(k) ? norm(r[k]) : json.includes(k) ? JSON.stringify(r[k]) : norm(r[k]))));
    const info = (report.tabelas as Record<string, Record<string, unknown>>)[t];
    info.linhas_postgres = b.length; info.hash_sqlite = sha(a); info.hash_postgres = sha(b);
    if (a.length !== b.length) fail(`${t}: contagem diferente (${a.length} x ${b.length})`);
    else if (sha(a) !== sha(b)) {
      const ids = a.map((row, i) => (sha(row) !== sha(b[i]) ? row[0] : null)).filter((x) => x !== null);
      fail(`${t}: conteúdo diferente nos registros (chaves): ${ids.slice(0, 10).join(", ")}`);
    } else okLine(`${t}: ${a.length} linhas idênticas (hash ${sha(a).slice(0, 12)})`);
  }

  // 5) estrutura nova (migração 002)
  const q1 = async (s: string) => (await pool.query(s)).rows[0];
  const classes = all("classes");
  const pgClasses = (await pool.query("SELECT id,name,grade FROM classes ORDER BY id")).rows;
  const gradesOk = classes.every((cl) => (pgClasses.find((p) => p.id === cl.id)?.grade ?? null) === gradeFromName(String(cl.name)));
  gradesOk ? okLine(`série deduzida do nome em todas as turmas (${classes.length})`) : fail("série da turma não confere com o nome");
  const nulos = pgClasses.filter((p) => p.grade === null).length;
  report.turmas_sem_serie = nulos; if (nulos) console.log(`  ⚠ ${nulos} turma(s) sem série deduzível: alunos delas não verão atividades até a série ser informada.`);
  const attMismatch = (await q1("SELECT COUNT(*)::int n FROM attempts WHERE assessment_id<>map_id")).n;
  attMismatch === 0 ? okLine("toda tentativa aponta para a avaliação correspondente (avaliação N = mapa N)") : fail(`${attMismatch} tentativas com avaliação divergente`);
  const asmt = (await q1("SELECT COUNT(*)::int n, COUNT(*) FILTER (WHERE grade=8)::int g8 FROM assessments"));
  const mapCount = (all("maps")).length;
  asmt.n === mapCount && asmt.g8 === mapCount ? okLine(`${mapCount} avaliações do 8º ano criadas a partir dos ${mapCount} mapas`) : fail("avaliações criadas não conferem com os mapas");
  const tc = (await q1("SELECT COUNT(*)::int n FROM teacher_classes")).n;
  const expectTc = all("teachers").length * classes.length;
  tc === expectTc ? okLine(`vínculos professor-turma: ${tc} (comportamento anterior preservado)`) : fail(`vínculos professor-turma ${tc} x esperado ${expectTc}`);
  const seq = (await q1("SELECT (SELECT last_value FROM students_id_seq)::int s, (SELECT COALESCE(MAX(id),0) FROM students)::int m")).s;
  report.sequencias_ok = seq >= (await q1("SELECT COALESCE(MAX(id),0)::int m FROM students")).m;

  // 6) resultados de negócio: recalculados do SQLite com SQL independente e comparados ao painel do novo sistema
  const t0 = all("teachers")[0];
  if (t0) {
    const dash = await dashboard({ scope: "real", teacherId: Number(t0.id) });
    const real = sq.prepare("SELECT COUNT(*) c FROM students WHERE is_demo=0").get() as { c: number };
    const done = sq.prepare("SELECT total_points p FROM attempts a JOIN students s ON s.id=a.student_id WHERE a.map_id=1 AND a.status='completed' AND s.is_demo=0").all() as { p: number }[];
    const started = (sq.prepare("SELECT COUNT(*) c FROM attempts a JOIN students s ON s.id=a.student_id WHERE a.map_id=1 AND a.status<>'voided' AND s.is_demo=0").get() as { c: number }).c;
    const sum = done.reduce((s, x) => s + x.p, 0);
    const checks: [string, boolean][] = [
      ["alunos cadastrados (painel = SQLite)", dash.cards.totalStudents === real.c],
      ["tentativas iniciadas", dash.cards.started === started],
      ["tentativas concluídas", dash.cards.completed === done.length],
      ["média de pontos", dash.cards.avgPoints === (done.length ? Math.round((sum / done.length) * 10) / 10 : null)],
      ["maior pontuação", dash.cards.best === (done.length ? Math.max(...done.map((x) => x.p)) : null)],
      ["pontuação máxima do mapa", dash.max === (sq.prepare("SELECT SUM(m) s FROM (SELECT MAX(o.points) m FROM questions q JOIN options o ON o.question_id=q.id WHERE q.map_id=1 GROUP BY q.id)").get() as { s: number }).s],
      ["ranking: mesmas pontuações na mesma ordem", JSON.stringify(dash.ranking.map((r) => r.total)) === JSON.stringify(done.map((x) => x.p).sort((a, b) => b - a))],
    ];
    for (const [name, pass] of checks) pass ? okLine(`painel: ${name}`) : fail(`painel: ${name}`);
    for (const q of dash.byQuestion) {
      const n = Number(String(q.name).slice(1));
      const r = sq.prepare(`SELECT COUNT(*) c, COALESCE(SUM(an.points),0) s FROM answers an JOIN questions qq ON qq.id=an.question_id JOIN attempts a ON a.id=an.attempt_id JOIN students s ON s.id=a.student_id
        WHERE qq.map_id=1 AND qq.number=? AND a.status<>'voided' AND s.is_demo=0`).get(n) as { c: number; s: number };
      const expect = r.c ? Math.round((r.s / r.c) * 100) / 100 : null;
      q.n === r.c && q.media === expect ? okLine(`painel: questão ${n} (${r.c} respostas, média ${expect})`) : fail(`painel: questão ${n} diverge`);
    }
    report.painel = { alunos: dash.cards.totalStudents, concluidas: dash.cards.completed, media: dash.cards.avgPoints };
  }

  // 7) integridade referencial no destino
  const orphan = (await q1(`SELECT (SELECT COUNT(*) FROM students s WHERE s.class_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM classes c WHERE c.id=s.class_id))
      + (SELECT COUNT(*) FROM answers a WHERE NOT EXISTS (SELECT 1 FROM attempts x WHERE x.id=a.attempt_id))
      + (SELECT COUNT(*) FROM attempts a WHERE NOT EXISTS (SELECT 1 FROM students s WHERE s.id=a.student_id)) AS n`)).n;
  orphan === 0 ? okLine("nenhum registro órfão") : fail(`${orphan} registros órfãos`);

  report.falhas = failures;
  if (reportPath) fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(failures ? `\nRESULTADO: ${failures} FALHA(S). NÃO use este destino.` : "\nRESULTADO: migração conferida, sem divergências.");
  return failures;
}

let code = 1;
try { code = await main(); } catch (e) { console.error("ERRO:", (e as Error).message); }
sq.close(); await closePool(); void config; void pg;
process.exit(code ? 1 : 0);
