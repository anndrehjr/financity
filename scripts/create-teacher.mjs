// Cria (ou redefine) a conta do professor com senha forte aleatória.
// Uso: npm run create-teacher -- usuario "Nome do Professor"
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const [username = "professor", name = "Professor"] = process.argv.slice(2);
const file = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "financity.db");
fs.mkdirSync(path.dirname(file), { recursive: true });
const d = new Database(file);
d.exec(`CREATE TABLE IF NOT EXISTS teachers(id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))`);
const pick = (s) => s[crypto.randomInt(s.length)];
const all = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
let pw = pick("ABCDEFGHJKLMNPQRSTUVWXYZ") + pick("abcdefghijkmnpqrstuvwxyz") + pick("23456789") + pick("!@#$%&*?");
while (pw.length < 16) pw += pick(all);
pw = pw.split("").sort(() => crypto.randomInt(3) - 1).join("");
const hash = bcrypt.hashSync(pw, 12);
const uname = username.toLowerCase();
const ex = d.prepare("SELECT id FROM teachers WHERE username=?").get(uname);
if (ex) d.prepare("UPDATE teachers SET password_hash=?, name=? WHERE id=?").run(hash, name, ex.id);
else d.prepare("INSERT INTO teachers(username,name,password_hash) VALUES(?,?,?)").run(uname, name, hash);
const out = path.join(path.dirname(file), "credenciais-professor.txt");
fs.writeFileSync(out, `Usuário: ${uname}\nSenha: ${pw}\n\nTroque a senha em Configurações e apague este arquivo.\n`, { mode: 0o600 });
console.log(`Conta "${uname}" ${ex ? "redefinida" : "criada"}. Credenciais salvas em: ${out}`);
