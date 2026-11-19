// Prepara o banco de TESTE "fc_e2e" (dados 100% fictícios) para o E2E do antitrapaça (tools/antitrapaca-e2e). Recria o banco do zero.
// Contas criadas: professor "prof.e2e" e alunos "aluna.um" (PIN 483921) e "aluno.dois" (PIN 719364), todos só deste banco local.
//   npm run pg:dev   (em outro terminal)   e depois:   cd apps/api && npx tsx scripts/preparar-e2e-integridade.ts
import bcrypt from "bcryptjs";
import pg from "pg";
const ADMIN = "postgres://financity_dev:dev-local-only@127.0.0.1:54329/postgres";
process.env.DATABASE_URL = ADMIN.replace(/\/postgres$/, "/fc_e2e");
const R = "../src";
const { migrate } = await import(R + "/migrate.js");
const { seedContent } = await import(R + "/lib/seed-content.js");
const { seedCulminancia } = await import(R + "/lib/seed-culminancia.js");
const { createStudents } = await import(R + "/lib/students.js");
const { closePool, one, setSetting } = await import(R + "/lib/db.js") as any;
const c = new pg.Client(ADMIN); await c.connect();
await c.query("DROP DATABASE IF EXISTS fc_e2e WITH (FORCE)"); await c.query("CREATE DATABASE fc_e2e"); await c.end();
await migrate(); await seedContent(); await seedCulminancia(8);
const t = await one("INSERT INTO teachers(username,name,password_hash) VALUES($1,$2,$3) RETURNING id", ["prof.e2e", "Professor Fictício", await bcrypt.hash("Senha-Forte-E2E1!", 4)]);
const r = await createStudents([{ name: "Aluna Fictícia Um", className: "8 ano", pin: "483921" }, { name: "Aluno Fictício Dois", className: "8 ano", pin: "719364" }], t.id);
console.log(JSON.stringify(r.created.map((s: any) => s.username)));
await setSetting("integrity_config", JSON.stringify({ suspendSeconds: 12, watermark: true }));
await closePool();
