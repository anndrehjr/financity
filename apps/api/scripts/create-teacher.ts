// Cria (ou redefine) a conta do professor com senha forte aleatória.
// Uso: DATABASE_URL=... npx tsx scripts/create-teacher.ts <usuario> "<Nome>" [arquivo-de-credenciais]
// A senha só é escrita no arquivo (permissão 600); nunca é impressa no terminal.
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { closePool, one, q } from "../src/lib/db.js";

const [username = "professor", name = "Professor", out = path.join(process.cwd(), "credenciais-professor.txt")] = process.argv.slice(2);
const pick = (s: string) => s[crypto.randomInt(s.length)];
const all = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
let pw = pick("ABCDEFGHJKLMNPQRSTUVWXYZ") + pick("abcdefghijkmnpqrstuvwxyz") + pick("23456789") + pick("!@#$%&*?");
while (pw.length < 16) pw += pick(all);
pw = pw.split("").sort(() => crypto.randomInt(3) - 1).join("");
const hash = bcrypt.hashSync(pw, 12);
const uname = username.toLowerCase();

const ex = await one<{ id: number }>("SELECT id FROM teachers WHERE username=$1", [uname]);
let id: number;
if (ex) { await q("UPDATE teachers SET password_hash=$1, name=$2 WHERE id=$3", [hash, name, ex.id]); id = ex.id; }
else id = (await one<{ id: number }>("INSERT INTO teachers(username,name,password_hash) VALUES($1,$2,$3) RETURNING id", [uname, name, hash]))!.id;
// professor novo recebe as turmas existentes? Não: o vínculo é decisão explícita. Só o primeiro professor herda tudo (migração 002).
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `Usuário: ${uname}\nSenha: ${pw}\n\nTroque a senha em Configurações e apague este arquivo.\n`, { mode: 0o600 });
console.log(`Conta "${uname}" (id ${id}) ${ex ? "redefinida" : "criada"}. Credenciais salvas em: ${out}`);
await closePool();
