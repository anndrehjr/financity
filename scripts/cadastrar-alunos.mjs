// Cadastra alunos em lote SEM apagar nada. Usuário = primeiro nome (minúsculo, sem acentos).
// Uso: node scripts/cadastrar-alunos.mjs <arquivo.json> "<nome da turma existente>"
// O JSON é uma lista [["NOME COMPLETO","PIN6"], ...]. Os PINs nunca são impressos.
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const [listFile, className = "8 ano"] = process.argv.slice(2);
if (!listFile) { console.error("Informe o arquivo JSON."); process.exit(2); }
const dbFile = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "financity.db");
const secret = process.env.FINANCITY_SECRET || fs.readFileSync(path.join(path.dirname(dbFile), "secret.key"), "utf8").trim();
const fp = (pin) => crypto.createHmac("sha256", secret).update("pin:" + pin).digest("hex"); // mesmo cálculo de src/lib/auth.ts
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

const d = new Database(dbFile);
d.pragma("busy_timeout = 5000"); d.pragma("foreign_keys = ON");
const cls = d.prepare("SELECT id FROM classes WHERE name=?").get(className);
if (!cls) { console.error(`Turma "${className}" não existe. Nada foi feito.`); process.exit(3); }

const rows = JSON.parse(fs.readFileSync(listFile, "utf8"));
const created = [], existed = [], conflicts = [];
const plan = [];
const seenUser = new Set(), seenPin = new Set();
for (const [rawName, pin] of rows) {
  const name = rawName.trim().replace(/\s+/g, " ");
  const username = slug(name.split(" ")[0]);
  if (!/^\d{6}$/.test(pin)) { conflicts.push({ name, motivo: "PIN inválido (não tem 6 dígitos)" }); continue; }
  const byName = d.prepare("SELECT id,username FROM students WHERE lower(full_name)=lower(?)").get(name);
  if (byName) { existed.push({ name, username: byName.username }); continue; }
  const userTaken = d.prepare("SELECT 1 FROM students WHERE username=? UNION SELECT 1 FROM teachers WHERE username=?").get(username, username);
  if (userTaken || seenUser.has(username)) { conflicts.push({ name, motivo: `usuário "${username}" já em uso por outra conta` }); continue; }
  if (d.prepare("SELECT 1 FROM students WHERE pin_fp=?").get(fp(pin)) || seenPin.has(pin)) { conflicts.push({ name, motivo: "PIN igual ao de outro aluno" }); continue; }
  seenUser.add(username); seenPin.add(pin);
  plan.push({ name, username, pin });
}
const hashes = await Promise.all(plan.map((p) => bcrypt.hash(p.pin, 10)));
const ins = d.prepare("INSERT INTO students(full_name,class_id,username,pin_hash,pin_fp,is_demo) VALUES(?,?,?,?,?,0)");
d.transaction(() => {
  plan.forEach((p, i) => { ins.run(p.name, cls.id, p.username, hashes[i], fp(p.pin)); created.push({ name: p.name, username: p.username }); });
  d.prepare("INSERT INTO admin_log(teacher_id,action,student_id,detail) VALUES(NULL,'cadastro_alunos',NULL,?)").run(`Cadastro em lote por script: ${created.length} criado(s), ${existed.length} já existia(m), ${conflicts.length} conflito(s)`);
})();
console.log(JSON.stringify({ criados: created.length, jaExistiam: existed.length, conflitos: conflicts, usuarios: created.map((c) => c.username) }, null, 1));
