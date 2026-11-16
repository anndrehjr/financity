// Cria (se não existir) um aluno de TESTE no banco local, com PIN conhecido. Só para o ambiente local (fc_*).
//   DATABASE_URL=...fc_local npx tsx scripts/criar-aluno-teste.ts
import { closePool, one } from "../src/lib/db.js";
import { createStudents } from "../src/lib/students.js";

const url = process.env.DATABASE_URL || "";
if (!/\/fc_[a-z0-9_]+$/i.test(url)) { console.error("Recusado: use apenas bancos de teste locais (nome começando com fc_)."); process.exit(2); }

const NOME = "Aluno Teste Local", PIN = "135790";
const ja = await one<{ username: string }>("SELECT username FROM students WHERE full_name=$1", [NOME]);
if (ja) console.log(`Aluno de teste já existe: usuário ${ja.username}, PIN ${PIN}`);
else {
  const teacher = await one<{ id: number }>("SELECT id FROM teachers ORDER BY id LIMIT 1");
  const turma = await one<{ name: string }>("SELECT c.name FROM classes c JOIN teacher_classes tc ON tc.class_id=c.id WHERE tc.teacher_id=$1 AND c.grade=8 AND c.is_demo=0 ORDER BY c.id LIMIT 1", [teacher!.id]);
  const r = await createStudents([{ name: NOME, className: turma!.name, pin: PIN }], teacher!.id);
  console.log(r.created.length ? `Aluno de teste criado: usuário ${r.created[0].username}, PIN ${PIN}` : `Não criado: ${r.skipped[0]?.reason}`);
}
await closePool();
