// Teste ponta a ponta contra um servidor já rodando (BASE) com banco de teste isolado.
// Uso: BASE=http://localhost:3100 TEACHER_FILE=data-test/credenciais-professor.txt node scripts/e2e.mjs
import fs from "fs";

const BASE = process.env.BASE || "http://localhost:3100";
const creds = Object.fromEntries(fs.readFileSync(process.env.TEACHER_FILE, "utf8").split("\n").filter((l) => l.includes(":")).map((l) => l.split(/:\s*/)));
let pass = 0, fail = 0;
const ok = (cond, name, extra = "") => { if (cond) { pass++; console.log("  ✔", name); } else { fail++; console.log("  ✘ FALHOU:", name, extra); } };

class Client {
  jar = "";
  async req(method, url, body, headers = {}) {
    const r = await fetch(BASE + url, { method, redirect: "manual", headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(this.jar ? { cookie: this.jar } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
    const sc = r.headers.getSetCookie?.() ?? [];
    for (const c of sc) { const [kv] = c.split(";"); if (/=;?$/.test(kv) || /Max-Age=0/i.test(c)) this.jar = ""; else this.jar = kv; }
    const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch {}
    return { status: r.status, json, text, headers: r.headers };
  }
}

const T = new Client(), S = new Client(), A = new Client();

console.log("\n1) Professor");
let r = await T.req("POST", "/api/auth/login", { username: creds["Usuário"], password: "senhaerrada" });
ok(r.status === 401, "login com senha errada é recusado");
r = await T.req("POST", "/api/auth/login", { username: creds["Usuário"], password: creds["Senha"] });
ok(r.status === 200 && r.json.role === "teacher", "professor entra no painel");

console.log("\n2) Limite de tentativas");
let last;
for (let i = 0; i < 7; i++) last = await A.req("POST", "/api/auth/login", { username: "inexistente.x", password: "123456" });
ok(last.status === 429, "após várias falhas o login é bloqueado (429)", String(last.status));

console.log("\n3) Cadastro de aluno e credenciais");
r = await T.req("POST", "/api/admin/students", { rows: [{ name: "Maria Souza", className: "8º A" }, { name: "João Lima", className: "8º A", pin: "123456" }, { name: "Ana Pinto", className: "8º A", pin: "123456" }, { name: "Maria Souza", className: "8º A" }] });
const maria = r.json.created.find((c) => c.name === "Maria Souza");
ok(r.json.created.length === 2 && /^\d{6}$/.test(maria.pin), "cria 2 alunos com PIN de 6 dígitos");
ok(r.json.skipped.length === 2, "PIN repetido e aluno duplicado são ignorados", JSON.stringify(r.json.skipped));
const joao = r.json.created.find((c) => c.name === "João Lima");
ok(maria.pin !== joao.pin, "PINs diferentes entre alunos");

console.log("\n4) Aluno e mapas");
r = await S.req("POST", "/api/auth/login", { username: maria.username, password: maria.pin });
ok(r.status === 200 && r.json.role === "student", "aluno entra com usuário e PIN");
r = await S.req("GET", "/api/me");
ok(r.json.maps.length === 4 && r.json.maps[0].unlocked && r.json.maps.slice(1).every((m) => !m.unlocked), "somente o Mapa 1 está liberado");
const m1 = r.json.maps[0].id, m2 = r.json.maps[1].id;
r = await S.req("POST", `/api/game/${m2}/start`);
ok(r.status === 403, "Mapa 2 não pode ser iniciado");
r = await S.req("GET", `/api/admin/dashboard`);
ok(r.status === 403, "aluno não acessa rotas administrativas");
r = await new Client().req("GET", "/api/admin/dashboard");
ok(r.status === 401, "visitante sem login não acessa o painel");

console.log("\n5) Jogo");
r = await S.req("POST", `/api/game/${m1}/start`);
ok(r.json.status === "in_progress" && r.json.question.number === 1, "tentativa iniciada na questão 1");
const leaks = (t) => /points|"why"|pontos"|gabarito/i.test(t);
ok(!leaks(r.text), "resposta ao aluno não contém pontuação nem gabarito", r.text.slice(0, 200));

const pick = { 1: "Avaliar a necessidade", 2: "Reutilizar", 3: "Jogar a calça", 4: "Aguardar", 5: "Fazer uma lista" }; // 5+5+0+4+4 = 18
let st = r.json, scores = [];
for (let n = 1; n <= 5; n++) {
  const q = st.question;
  const opt = q.options.find((o) => o.text.startsWith(pick[n]));
  if (n === 1) { const second = await S.req("GET", `/api/game/${m1}/state`); ok(second.json.question.options.map((o) => o.id).join() === q.options.map((o) => o.id).join(), "ordem das alternativas é estável ao recarregar"); }
  if (n === 3) { // fechar a página e voltar: continua de onde parou
    const again = await S.req("GET", `/api/game/${m1}/state`);
    ok(again.json.answered === 2 && again.json.question.number === 3, "progresso permanece após recarregar");
  }
  const a = await S.req("POST", `/api/game/${m1}/answer`, { questionId: q.id, optionId: opt.id });
  ok(a.status === 200 && !leaks(JSON.stringify({ ...a.json, score: undefined, max: undefined })), `resposta ${n} gravada sem revelar gabarito`);
  scores.push(a.json.score);
  if (n === 1) {
    const dup = await S.req("POST", `/api/game/${m1}/answer`, { questionId: q.id, optionId: q.options[0].id });
    ok(dup.status === 409, "resposta repetida é recusada (409)");
  }
  st = await S.req("GET", `/api/game/${m1}/state`).then((x) => x.json);
}
ok(scores.join() === "5,10,10,14,18", "pontuação acumulada calculada no servidor", scores.join());
ok(st.status === "completed" && st.score === 18, "atividade concluída com 18 pontos");
r = await S.req("GET", `/api/game/${m1}/result`);
ok(r.json.score === 18 && r.json.max === 25 && r.json.pct === 72 && r.json.medal.key === "aprendiz", "resultado: 18/25, 72%, Aprendiz Financeiro", JSON.stringify(r.json));
r = await S.req("POST", `/api/game/${m1}/answer`, { questionId: 1, optionId: 1 });
ok(r.status === 409, "não aceita respostas após concluir");
r = await S.req("GET", "/api/me");
ok(r.json.maps[1].unlocked === false, "concluir o Mapa 1 não libera o Mapa 2");

console.log("\n6) Painel do professor com dados reais");
r = await T.req("GET", "/api/admin/dashboard?scope=real");
ok(r.json.cards.totalStudents === 2 && r.json.cards.started === 1 && r.json.cards.completed === 1 && r.json.cards.avgPoints === 18 && r.json.cards.best === 18, "cards refletem os dados reais", JSON.stringify(r.json.cards));
ok(r.json.ranking.length === 1 && r.json.ranking[0].rank === 1 && r.json.ranking[0].name === "Maria Souza", "ranking reflete resultado real");
ok(r.json.byMap[1].available === false && r.json.byMap[1].avgPct === null, "mapas 2–4 aparecem como indisponíveis (não zero)");
ok(r.json.byQuestion.map((q) => q.media).join() === "5,5,0,4,4", "média por questão correta", r.json.byQuestion.map((q) => q.media).join());
ok(r.json.progress.map((p) => p.value).join() === "1,0,1", "progresso da turma: 1 não começou, 0 em andamento, 1 concluiu", r.json.progress.map((p) => p.value).join());
r = await T.req("GET", "/api/admin/questions/3?scope=real");
ok(r.json.inadequate === 1 && r.json.options.find((o) => o.letter === "A").students[0].name === "Maria Souza", "detalhe da questão mostra quem marcou cada alternativa");
r = await T.req("GET", `/api/admin/students/${maria.id}/report`);
ok(r.json.answers.length === 5 && r.json.attempt.total === 18 && /não é um diagnóstico definitivo/.test(r.json.diagnosis), "relatório individual completo e com cautela pedagógica");
r = await T.req("GET", "/api/admin/export?type=alunos&scope=real");
ok(r.status === 200 && r.text.includes("Maria Souza") && r.text.includes("18"), "exportação CSV da turma");

console.log("\n7) Dados de demonstração isolados");
await T.req("POST", "/api/admin/demo");
r = await T.req("GET", "/api/admin/dashboard?scope=real");
ok(r.json.cards.totalStudents === 2, "demonstração não aparece nos dados reais");
r = await T.req("GET", "/api/admin/dashboard?scope=demo");
ok(r.json.cards.totalStudents === 24 && r.json.cards.completed > 0, "demonstração aparece só quando solicitada");
await T.req("DELETE", "/api/admin/demo");
r = await T.req("GET", "/api/admin/dashboard?scope=all");
ok(r.json.cards.totalStudents === 2, "demonstração removida sem afetar dados reais");

console.log("\n8) Nova tentativa, PIN e segurança");
r = await T.req("PATCH", `/api/admin/students/${maria.id}`, { action: "new_attempt" });
ok(r.status === 400, "nova tentativa exige confirmação");
r = await T.req("PATCH", `/api/admin/students/${maria.id}`, { action: "new_attempt", confirm: true, reason: "teste" });
ok(r.status === 200, "nova tentativa liberada com confirmação");
r = await S.req("GET", `/api/game/${m1}/state`);
ok(r.json.status === "not_started", "aluno pode refazer após liberação");
r = await T.req("GET", `/api/admin/students/${maria.id}/report`);
ok(r.json.history.some((h) => h.action === "nova_tentativa"), "ação registrada no histórico administrativo");
r = await T.req("PATCH", `/api/admin/students/${maria.id}`, { action: "reset_pin", pin: joao.pin });
ok(r.status === 409, "PIN igual ao de outro aluno é recusado");
r = await T.req("PATCH", `/api/admin/students/${maria.id}`, { action: "reset_pin" });
const newPin = r.json.pin;
ok(/^\d{6}$/.test(newPin) && newPin !== maria.pin, "PIN redefinido");
r = await new Client().req("POST", "/api/auth/login", { username: maria.username, password: maria.pin });
ok(r.status === 401, "PIN antigo deixa de funcionar");
r = await S.req("GET", "/api/me");
ok(r.status === 401, "sessão antiga do aluno é encerrada após redefinir PIN");
r = await T.req("POST", "/api/admin/demo", undefined, { Origin: "https://evil.example" });
ok(r.status === 403, "requisição de outra origem é bloqueada");
await T.req("PATCH", `/api/admin/students/${joao.id}`, { action: "deactivate" });
r = await new Client().req("POST", "/api/auth/login", { username: joao.username, password: joao.pin });
ok(r.status === 403, "aluno desativado não entra");

console.log("\n9) Limite por usuário (não burlável trocando o IP)");
r = await T.req("POST", "/api/admin/students", { rows: [{ name: "Zeca Limite", className: "8º A" }] });
const zeca = r.json.created[0];
let st429 = 0;
for (let i = 0; i < 14; i++) {
  const x = await new Client().req("POST", "/api/auth/login", { username: zeca.username, password: String(100000 + i) }, { "X-Forwarded-For": `10.9.${i}.${i + 1}` });
  if (x.status === 429) st429++;
}
ok(st429 >= 3, "após ~10 falhas, tentativas com IPs diferentes também são bloqueadas", `429 em ${st429} de 14`);
r = await new Client().req("POST", "/api/auth/login", { username: zeca.username, password: zeca.pin }, { "X-Forwarded-For": "10.77.7.7" });
ok(r.status === 429, "mesmo o PIN correto é recusado durante o bloqueio");

console.log("\n10) Gerador Automático de PINs");
const mkRows = (n, cls, extra = {}) => Array.from({ length: n }, (_, i) => ({ name: `Gerador ${cls} ${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(97 + Math.floor(i / 26))} Silva`, className: cls, ...extra }));
r = await T.req("POST", "/api/admin/students", { rows: mkRows(40, "8 GERADOR", { noPin: true }) });
ok(r.json.created.length === 40 && r.json.created.every((c) => c.pin === ""), "40 alunos cadastrados sem PIN");
r = await T.req("GET", "/api/admin/pins");
ok(r.json.pending === 40, "contagem de alunos sem PIN", String(r.json.pending));
const someNoPin = (await T.req("GET", "/api/admin/students?scope=real&q=Gerador")).json[0];
r = await new Client().req("POST", "/api/auth/login", { username: someNoPin.username, password: "123456" });
ok(r.status === 401, "aluno sem PIN não consegue entrar");
r = await T.req("POST", "/api/admin/pins", { mode: "missing" });
ok(r.status === 400, "geração sem confirmação é recusada (nada alterado)");
r = await T.req("GET", "/api/admin/pins");
ok(r.json.pending === 40, "nada foi alterado sem confirmação");
r = await T.req("POST", "/api/admin/pins", { mode: "missing", confirm: true });
const batch = r.json.credentials;
ok(batch.length === 40 && batch.every((c) => /^\d{6}$/.test(c.pin)), "40 PINs de 6 dígitos gerados (zeros à esquerda preservados)");
ok(new Set(batch.map((c) => c.pin)).size === 40, "sem PINs repetidos no lote");
ok(batch.every((c) => !/^(\d)\1{5}$/.test(c.pin) && c.pin !== [...c.pin].reverse().join("") && !"0123456789012345".includes(c.pin)), "sem sequências/padrões óbvios");
const c0 = batch[0];
r = await new Client().req("POST", "/api/auth/login", { username: c0.username, password: c0.pin });
ok(r.status === 200 && r.json.name === c0.name, "login com o PIN gerado mostra o nome completo");
r = await T.req("GET", "/api/admin/pins");
ok(r.json.pending === 0, "não restam alunos sem PIN");
r = await T.req("POST", "/api/admin/pins", { mode: "missing", confirm: true });
ok(r.json.credentials.length === 0, "executar de novo não altera ninguém (já têm PIN)");

// preservação de dados + invalidação de sessão + PIN antigo
const P = batch[1], PC = new Client();
await PC.req("POST", "/api/auth/login", { username: P.username, password: P.pin });
const pm = (await PC.req("GET", "/api/me")).json.maps[0].id;
let ps = (await PC.req("POST", `/api/game/${pm}/start`)).json;
for (let i = 0; i < 5; i++) { await PC.req("POST", `/api/game/${pm}/answer`, { questionId: ps.question.id, optionId: ps.question.options[0].id }); ps = (await PC.req("GET", `/api/game/${pm}/state`)).json; }
const before = (await T.req("GET", `/api/admin/students/${P.id}/report`)).json;
r = await T.req("POST", "/api/admin/pins", { mode: "selected", ids: [P.id] });
ok(r.status === 400, "redefinir selecionados sem confirmação é recusado");
r = await T.req("POST", "/api/admin/pins", { mode: "selected", ids: [P.id, batch[2].id], confirm: true });
const sel = r.json.credentials;
ok(sel.length === 2 && sel.find((c) => c.id === P.id).pin !== P.pin, "redefinição de selecionados gera novos PINs");
r = await PC.req("GET", "/api/me");
ok(r.status === 401, "sessão antiga do aluno foi encerrada");
r = await new Client().req("POST", "/api/auth/login", { username: P.username, password: P.pin });
ok(r.status === 401, "PIN antigo deixa de funcionar");
r = await new Client().req("POST", "/api/auth/login", { username: P.username, password: sel.find((c) => c.id === P.id).pin });
ok(r.status === 200, "PIN novo funciona");
const after = (await T.req("GET", `/api/admin/students/${P.id}/report`)).json;
ok(after.attempt.total === before.attempt.total && JSON.stringify(after.answers) === JSON.stringify(before.answers) && after.attempt.status === "completed", "respostas, pontuação e tentativa preservadas");
const untouched = batch[3];
r = await new Client().req("POST", "/api/auth/login", { username: untouched.username, password: untouched.pin });
ok(r.status === 200, "aluno não selecionado manteve o PIN");
ok(!JSON.stringify(after.history).includes(sel.find((c) => c.id === P.id).pin) && after.history.some((h) => h.action === "redefinir_pin_lote"), "histórico administrativo registra a redefinição sem o PIN");

// turma inteira
const classes = (await T.req("GET", "/api/admin/classes")).json;
const gClass = classes.find((c) => c.name === "8 GERADOR").id;
r = await T.req("POST", "/api/admin/pins", { mode: "class", classId: gClass });
ok(r.status === 400, "redefinição da turma sem confirmação é recusada");
const preList = (await T.req("GET", "/api/admin/students?scope=real&class=" + gClass)).json.length;
r = await T.req("POST", "/api/admin/pins", { mode: "class", classId: gClass, confirm: true });
ok(r.json.credentials.length === preList && preList === 40, "redefinição em massa atinge toda a turma (40)");
r = await new Client().req("POST", "/api/auth/login", { username: untouched.username, password: untouched.pin });
ok(r.status === 401, "PIN antigo da turma deixou de funcionar");
const stillCompleted = (await T.req("GET", `/api/admin/students/${P.id}/report`)).json.attempt.status;
ok(stillCompleted === "completed", "tentativa concluída continua concluída após redefinição em massa");
const tl = await new Client().req("POST", "/api/auth/login", { username: creds["Usuário"], password: creds["Senha"] });
ok(tl.status === 200 && tl.json.role === "teacher", "conta do professor não foi afetada");
await T.req("POST", "/api/admin/demo");
const demoClass = (await T.req("GET", "/api/admin/classes")).json.find((c) => c.demo).id;
r = await T.req("POST", "/api/admin/pins", { mode: "class", classId: demoClass, confirm: true });
ok(r.status === 404, "turma de demonstração não pode ser redefinida");
await T.req("DELETE", "/api/admin/demo");

// permissões
const SP = new Client(); await SP.req("POST", "/api/auth/login", { username: untouched.username, password: batch[3].pin }); // PIN antigo: falha
const stu = (await T.req("POST", "/api/admin/pins", { mode: "selected", ids: [batch[3].id], confirm: true })).json.credentials[0];
await SP.req("POST", "/api/auth/login", { username: stu.username, password: stu.pin });
r = await SP.req("POST", "/api/admin/pins", { mode: "selected", ids: [batch[3].id], confirm: true });
ok(r.status === 403, "aluno não consegue usar o gerador (403)");
r = await SP.req("GET", "/api/admin/pins");
ok(r.status === 403, "aluno não consegue consultar o gerador (403)");
r = await new Client().req("POST", "/api/admin/pins", { mode: "missing", confirm: true });
ok(r.status === 401, "visitante não consegue usar o gerador (401)");

console.log("\n11) Séries e avaliações por série (novo)");
r = await new Client().req("GET", "/api/session");
ok(r.status === 200 && r.json.session === null, "visitante: /api/session devolve sessão vazia");
r = await T.req("POST", "/api/admin/students", { rows: [
  { name: "Sete Aluno Teste", className: "7º TESTE", pin: "482916" },
  { name: "Sem Serie Aluno", className: "Turma Livre" },
] });
ok(r.json.created.length === 1 && r.json.skipped.some((s) => /série/.test(s.reason)), "turma nova sem série no nome é recusada; com série é criada");
const sevenUser = r.json.created[0].username;
const cls = (await T.req("GET", "/api/admin/classes")).json;
ok(cls.find((c) => c.name === "7º TESTE")?.grade === 7 && cls.find((c) => c.name === "8º A")?.grade === 8, "série deduzida do nome da turma (7 e 8)");
const seven = new Client();
r = await seven.req("POST", "/api/auth/login", { username: sevenUser, password: "482916" });
ok(r.status === 200, "aluno do 7º entra");
r = await seven.req("GET", "/api/me");
ok(r.status === 200 && r.json.maps.length === 0, "aluno do 7º não vê atividades do 8º (ainda não há avaliações do 7º)");
r = await seven.req("POST", "/api/game/1/start");
ok(r.status === 404, "aluno do 7º não consegue iniciar a avaliação do 8º pelo ID (404)");
r = await seven.req("GET", "/api/game/1/state");
ok(r.status === 404, "nem ver o estado dela (404)");
r = await T.req("GET", "/api/admin/assessments");
ok(r.status === 200 && r.json.length >= 1 && r.json.every((a) => a.grade === 8 || a.grade === 7), "professor lista as avaliações das séries das suas turmas");
r = await T.req("GET", `/api/admin/dashboard?class=${cls.find((c) => c.name === "7º TESTE").id}`);
ok(r.status === 404, "painel de turma do 7º sem avaliações responde 404 claro");
r = await T.req("GET", "/api/admin/dashboard");
ok(r.status === 200 && r.json.assessment.grade === 8 && !JSON.stringify(r.json.ranking).includes("Sete Aluno"), "painel padrão é do 8º e não mistura alunos do 7º");

console.log(`\nResultado: ${pass} ok, ${fail} falhas`);
process.exit(fail ? 1 : 0);
