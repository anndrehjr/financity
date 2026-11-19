// E2E do antitrapaça no Chrome real (desktop e celular) contra uma pilha LOCAL de teste. Nunca aponta para dados reais.
// Pré-requisitos (não são dependências do projeto): Chrome instalado e `npm i puppeteer-core` numa pasta temporária (use NODE_PATH ou rode de lá).
//   1) npm run pg:dev
//   2) cd apps/api && npx tsx scripts/preparar-e2e-integridade.ts          (recria o banco fc_e2e com dados fictícios)
//   3) API:  DATABASE_URL=postgres://financity_dev:dev-local-only@127.0.0.1:54329/fc_e2e PORT=8791 HOST=127.0.0.1 GATEWAY_SECRET=<32+ caracteres> ALLOWED_ORIGINS=http://localhost:3391 npx tsx src/server.ts
//   4) Site: cd apps/web && API_URL=http://127.0.0.1:8791 GATEWAY_SECRET=<o mesmo> npx next build && ... npx next start -p 3391
//   5) node antitrapaca.mjs     (variáveis: BASE, CHROME, OUT). Refaça o passo 2 e reinicie a API a cada rodada (o roteiro deixa estado no banco).
// Observação: o roteiro simula "minimizar" com visibilitychange e a impressão com beforeprint/emulação de mídia; o Ctrl+C usa o comando de edição do Chrome.
// E2E do antitrapaça no Chrome real contra a pilha local de teste (banco fc_e2e, dados fictícios).
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const BASE = process.env.BASE || "http://localhost:3391";
const OUT = process.env.OUT || (process.env.TEMP || "/tmp") + "/anti-e2e";
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = 0, bad = 0;
const check = (cond, nome, extra = "") => { (cond ? ok++ : bad++); console.log(`${cond ? "PASS" : "FAIL"}  ${nome}${extra ? "  → " + extra : ""}`); };

const browser = await puppeteer.launch({ executablePath: process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
const ctxA = await browser.createBrowserContext();
const page = await ctxA.newPage();
await page.setViewport({ width: 1280, height: 900 });
page.on("dialog", (d) => d.accept("Conversei com o aluno"));
let eventReqs = [];
page.on("request", (r) => { if (r.method() === "POST" && r.url().includes("/integrity/event")) eventReqs.push(r.postData()); });

const textoDe = (sel) => page.$eval(sel, (e) => e.innerText).catch(() => null);
const clicaTexto = async (txt) => page.evaluate((t) => { const b = [...document.querySelectorAll("button,a")].find((x) => x.textContent.trim().toUpperCase().includes(t.toUpperCase()) && !x.disabled); if (b) { b.click(); return true; } return false; }, txt);
const esperaTexto = async (txt, ms = 8000) => { try { await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout: ms }, txt); return true; } catch { return false; } };
const sobre = () => page.$("[data-testid=sobreposicao-protecao]");

async function loginAluno(u, p) {
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" }); await sleep(2000);
  await page.type("#u", u); await page.type("#p", p);
  await page.click("button.btn-sun"); await page.waitForFunction(() => location.pathname.startsWith("/jogo"), { timeout: 20000 }); await sleep(1000);
}
const api = (path, init) => page.evaluate(async (p, i) => { const r = await fetch(p, i); let j = null; try { j = await r.json(); } catch {} return { status: r.status, json: j }; }, path, init);

// ───────── aluno entra e começa a partida ─────────
await loginAluno("aluna.um", "483921");
const me = await api("/api/me");
const AID = me.json.maps[0].id;
await page.goto(`${BASE}/jogo/${AID}`, { waitUntil: "domcontentloaded" }); await sleep(2000);
await clicaTexto("COMEÇAR AVENTURA");
check(await esperaTexto("Desafio 1"), "partida começou (Desafio 1)");
// fecha tutorial/Nina se algo estiver cobrindo
await page.evaluate(() => { document.querySelectorAll(".driver-popover-close-btn").forEach((b) => b.click()); });
await sleep(800);
await page.screenshot({ path: OUT + "/01-pergunta-marca-dagua.png" });

const wm = await page.$eval("[data-testid=marca-dagua]", (e) => ({ aria: e.getAttribute("aria-hidden"), pe: getComputedStyle(e).pointerEvents, bg: getComputedStyle(e).backgroundImage.length > 20 })).catch(() => null);
check(wm && wm.aria === "true" && wm.pe === "none" && wm.bg, "marca d'água presente, aria-hidden e sem capturar cliques", JSON.stringify(wm));
// o texto da marca tem nome, sessão e horário
const wmTxt = await page.$eval("[data-testid=marca-dagua]", (e) => decodeURIComponent(getComputedStyle(e).backgroundImage));
check(/Aluna Fictícia Um/.test(wmTxt) && /sessão [0-9A-F]{8}/.test(wmTxt) && /\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/.test(wmTxt), "marca d'água contém aluno, sessão e data/hora");

// ───────── 1) minimizar / bloquear tela / trocar de aba: NADA acontece ─────────
eventReqs = [];
await page.evaluate(async () => {
  const set = (v) => Object.defineProperty(document, "visibilityState", { configurable: true, get: () => v });
  set("hidden"); document.dispatchEvent(new Event("visibilitychange")); window.dispatchEvent(new Event("pagehide")); window.dispatchEvent(new Event("blur"));
  await new Promise((r) => setTimeout(r, 1200));
  set("visible"); document.dispatchEvent(new Event("visibilitychange")); window.dispatchEvent(new Event("pageshow")); window.dispatchEvent(new Event("focus"));
});
await sleep(600);
check(eventReqs.length === 0 && !(await sobre()), "minimizar/bloquear tela/trocar de aba e voltar: nenhum relato ao servidor, sem tela de bloqueio");
check((await textoDe("body")).includes("Desafio 1"), "ao voltar, a partida está no mesmo ponto (Desafio 1)");

// ───────── 2) Ctrl+P: atalho de impressão (nível 1) ─────────
await page.evaluate(() => { window.__prev = []; window.addEventListener("keydown", (e) => window.__prev.push([e.key, e.defaultPrevented])); });
await page.keyboard.down("Control"); await page.keyboard.press("p"); await page.keyboard.up("Control");
check(await esperaTexto("Atividade incomum identificada"), "Ctrl+P: aviso neutro 'atividade incomum identificada'");
const prev = await page.evaluate(() => window.__prev.find((x) => x[0] === "p"));
check(prev && prev[1] === true, "Ctrl+P foi interceptado (preventDefault)");
check(!(await sobre()), "Ctrl+P (nível 1) NÃO pausa a partida");
const avisoTxt = await textoDe("[role=status]");
check(avisoTxt && !/trapace|fraude/i.test(avisoTxt) && /Nenhuma penalidade/.test(avisoTxt), "aviso não acusa e informa que não há penalidade", (avisoTxt || "").slice(0, 120));
await page.screenshot({ path: OUT + "/02-aviso-nivel1.png" });

// ───────── 3) PrintScreen ─────────
eventReqs = [];
await page.keyboard.press("PrintScreen");
await sleep(900);
const t3 = eventReqs.map((x) => JSON.parse(x));
check(t3.length === 1 && t3[0].type === "tecla_captura_tela" && t3[0].detail === "PrintScreen", "PrintScreen: relata 'tecla pressionada' (não 'captura realizada')", JSON.stringify(t3));
check(/não confirma que a captura ocorreu/.test((await textoDe("[role=status]")) || ""), "mensagem diz que não confirma captura");

// responde normalmente (a partida continua livre)
async function responde() {
  await page.evaluate(() => { const o = document.querySelector("[role=radio],[role=checkbox]"); if (o) o.click(); });
  await sleep(300);
  const antes = await textoDe("body");
  await clicaTexto("CONFIRMAR RESPOSTA");
  return antes;
}
await responde();
check(await esperaTexto("Desafio 2", 9000), "depois de alertas nível 1, o aluno responde e avança (Desafio 2)");
await sleep(500);
await page.evaluate(() => document.querySelectorAll(".driver-popover-close-btn").forEach((b) => b.click()));

// ───────── 4) cópia do conteúdo (nível 2): pausa + sobreposição ─────────
const contornaCssESeleciona = async () => { await page.waitForSelector("#enunciado", { timeout: 20000 }); return page.evaluate(() => { const st = document.createElement("style"); st.textContent = ".fc-protegido,.fc-protegido *{user-select:text !important;-webkit-user-select:text !important}"; document.head.appendChild(st); const el = document.getElementById("enunciado"); const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return s.toString().length; }); };
// 4a) sem contornar o CSS o texto nem é selecionável: Ctrl+A + Ctrl+C não leva o enunciado
const selNormal = await page.evaluate(() => { const el = document.getElementById("enunciado"); const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return s.toString().length; });
check(selNormal === 0, "pelo CSS o enunciado não é selecionável (nada vai para a área de transferência)", String(selNormal));
await page.evaluate(() => { window.__copy = []; document.addEventListener("copy", (e) => window.__copy.push(e.defaultPrevented)); });
// 4b) alguém contorna o CSS (extensão/leitor/DevTools): o navegador consegue selecionar e o evento 'copy' é bloqueado e relatado
check((await contornaCssESeleciona()) > 10, "simulação: CSS contornado, texto selecionável");
await page.keyboard.press("KeyC", { commands: ["Copy"] }); // Ctrl+C real com o comando de edição nativo do navegador
check(await esperaTexto("ATENÇÃO — VIOLAÇÃO DAS REGRAS DO FINANCITY"), "cópia do enunciado: sobreposição de proteção aparece");
const cp = await page.evaluate(() => window.__copy);
check(cp.length >= 1 && cp[0] === true, "a cópia foi bloqueada (preventDefault)");
const ov = await textoDe("[data-testid=sobreposicao-protecao]");
check(/copiar ou recortar o conteúdo da questão/.test(ov) && /registrada para análise do professor/.test(ov) && /Respeite as regras da atividade para continuar/.test(ov), "texto dinâmico com o motivo exato e sem inventar atividade", ov.replace(/\n+/g, " | ").slice(0, 260));
await page.screenshot({ path: OUT + "/03-sobreposicao-suspensao-desktop.png" });
const btnDesab = await page.$eval("[data-testid=sobreposicao-protecao] button", (b) => b.disabled);
check(btnDesab === true, "durante a suspensão o botão 'Entendi' está desabilitado (contagem regressiva)");
const cobre = await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("CONFIRMAR")); if (!b) return "sem-botao"; b.scrollIntoView({ block: "center" }); const r = b.getBoundingClientRect(); const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return el?.closest("[data-testid=sobreposicao-protecao]") ? true : (el ? el.tagName + "." + String(el.className).slice(0, 60) + " @" + Math.round(r.y) + "/" + innerHeight : "nulo @" + Math.round(r.y) + "/" + innerHeight); });
check(cobre === true, "a sobreposição cobre o botão de confirmar (não dá para clicar por baixo)", String(cobre));
const cur = await api(`/api/game/${AID}/state`);
const q = cur.json.question;
const tent = await api(`/api/game/${AID}/answer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId: q.id, optionId: q.options[0].id }) });
check(tent.status === 423, "servidor impede respostas durante a suspensão (HTTP 423)", String(tent.status));
// F5 durante a suspensão: a sobreposição continua (estado vem do servidor)
await page.reload({ waitUntil: "domcontentloaded" }); await sleep(2000);
check(await esperaTexto("ATENÇÃO — VIOLAÇÃO DAS REGRAS DO FINANCITY"), "F5 durante a suspensão: a proteção continua ativa (estado no servidor)");
check((await textoDe("body")).includes("Desafio 2"), "F5: partida restaurada no mesmo desafio, sem perda de progresso");
// espera acabar a suspensão
await page.waitForFunction(() => { const b = document.querySelector("[data-testid=sobreposicao-protecao] button"); return b && !b.disabled; }, { timeout: 15000 });
await clicaTexto("Entendi");
await sleep(800);
check(!(await sobre()), "terminada a suspensão e clicando 'Entendi', a partida volta");
await page.evaluate(() => document.querySelectorAll(".driver-popover-close-btn").forEach((b) => b.click()));

// ───────── 5) impressão: tela de proteção e relato do beforeprint ─────────
await page.emulateMediaType("print");
const imp = await page.evaluate(() => ({ body: getComputedStyle(document.body).display, before: getComputedStyle(document.documentElement, "::before").content }));
check(imp.body === "none" && /impress/i.test(imp.before), "ao imprimir, a página some e aparece só a mensagem de proteção", JSON.stringify(imp));
await page.emulateMediaType("screen");
await sleep(3500); // passa a janela de dedupe (a 2ª violação precisa do aluno fora da suspensão anterior)
await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
check(await esperaTexto("a impressão da página foi iniciada"), "evento beforeprint: violação registrada com o motivo exato");
await page.screenshot({ path: OUT + "/04-impressao-violacao.png" });
await page.waitForFunction(() => { const b = document.querySelector("[data-testid=sobreposicao-protecao] button"); return b && !b.disabled; }, { timeout: 15000 });
await clicaTexto("Entendi");
await sleep(500);

// ───────── 6) 3ª violação => bloqueio exige o professor (também no iPhone: rótulo do aparelho) ─────────
await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1");
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await page.reload({ waitUntil: "domcontentloaded" }); await sleep(2000);
await page.evaluate(() => document.querySelectorAll(".driver-popover-close-btn").forEach((b) => b.click()));
await contornaCssESeleciona();
await page.keyboard.press("KeyC", { commands: ["Copy"] }); // Ctrl+C real com o comando de edição nativo do navegador
check(await esperaTexto("sua partida foi bloqueada"), "3ª violação: partida BLOQUEADA aguardando o professor");
await sleep(500);
await page.screenshot({ path: OUT + "/05-bloqueada-celular.png" });
const larg = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
check(larg.sw <= larg.iw + 1, "celular (390 px): sem rolagem horizontal na tela de bloqueio", JSON.stringify(larg));
const btnVis = await page.$eval("[data-testid=sobreposicao-protecao] button", (b) => { const r = b.getBoundingClientRect(); return r.bottom <= innerHeight && r.height >= 40; });
check(btnVis, "celular: botão da sobreposição visível e com área de toque adequada");
await page.reload({ waitUntil: "domcontentloaded" }); await sleep(2000);
check(await esperaTexto("sua partida foi bloqueada") || await esperaTexto("bloqueada"), "F5 com partida bloqueada: continua bloqueada");
const cur2 = (await api(`/api/game/${AID}/state`)).json;
const tent2 = await api(`/api/game/${AID}/answer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId: cur2.question.id, optionId: cur2.question.options[0].id }) });
check(tent2.status === 423, "bloqueada: servidor recusa respostas (423) e o bloqueio não expira sozinho");

// ───────── 7) professor: painel, justificar, liberar ─────────
const ctxT = await browser.createBrowserContext();
const prof = await ctxT.newPage();
await prof.setViewport({ width: 1366, height: 900 });
prof.on("dialog", (d) => d.accept("Conversei com o aluno e ele voltou a jogar"));
await prof.goto(BASE + "/", { waitUntil: "domcontentloaded" }); await sleep(2000);
await prof.type("#u", "prof.e2e"); await prof.type("#p", "Senha-Forte-E2E1!");
await prof.click("button.btn-sun"); await prof.waitForFunction(() => location.pathname.startsWith("/admin"), { timeout: 20000 }); await sleep(1000);
await prof.goto(BASE + "/admin/seguranca", { waitUntil: "domcontentloaded" }); await sleep(2000);
await sleep(1200);
const corpo = await prof.evaluate(() => document.body.innerText);
check(/Segurança e Antitrapaça/.test(corpo) && /Partidas bloqueadas agora/.test(corpo) && /Alertas pendentes de análise/.test(corpo), "painel 'Segurança e Antitrapaça' com os indicadores");
check(/Partidas aguardando você/.test(corpo) && /BLOQUEADA/.test(corpo), "partida bloqueada aparece para o professor");
check(/Tecla de captura de tela/.test(corpo) && /Atalho de impressão/.test(corpo) && /Tentativa de copiar conteúdo/.test(corpo) && /Impressão iniciada/.test(corpo), "histórico lista os eventos detectados (impressão, atalho, captura, cópia)");
check(!/Resposta muito rápida/.test(corpo), "resposta com tempo normal de leitura NÃO gera indicador de rapidez (sem falso positivo)");
check(/celular · iOS · Safari/.test(corpo), "aparelho do iPhone aparece como 'celular · iOS · Safari'");
await prof.screenshot({ path: OUT + "/06-painel-professor.png", fullPage: true });
await prof.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /Modo (escuro|claro)/.test(x.textContent)); b?.click(); });
await sleep(600);
await prof.screenshot({ path: OUT + "/06b-painel-professor-tema-alternado.png", fullPage: true });
await prof.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /Modo (escuro|claro)/.test(x.textContent)); b?.click(); });
await sleep(400);
// abre o detalhe do último evento (copia)
await prof.evaluate(() => { const linhas = [...document.querySelectorAll("tbody tr")]; const l = linhas.find((r) => r.innerText.includes("Tentativa de copiar")); l.querySelector("button").click(); });
await sleep(1200);
await prof.screenshot({ path: OUT + "/07-detalhe-ocorrencia.png", fullPage: true });
const det = await prof.evaluate(() => document.body.innerText);
check(/Evidências registradas/.test(det) && /Histórico de decisões/.test(det) && /Aluna Fictícia Um/.test(det), "detalhe: aluno, evidências e histórico de decisões");
// libera a partida (prompt aceito automaticamente)
await prof.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Liberar partida" && b.closest("li"))?.click());
await sleep(1500);
const apos = await prof.evaluate(() => document.body.innerText);
check(!/Partidas aguardando você/.test(apos) || !/BLOQUEADA/.test(apos), "professor libera a partida bloqueada pelo painel");
// aluna toca em "Verificar novamente"
await page.bringToFront();
await clicaTexto("Verificar novamente");
await sleep(1200);
check(!(await sobre()), "aluna toca em 'Verificar novamente' e a partida é liberada");
// o desconto de pontos não foi aplicado (padrão desligado)
const pts = (await api(`/api/game/${AID}/state`)).json;
check(pts.integrity.status === "ok", "estado da partida no servidor: liberada");
await page.setViewport({ width: 1280, height: 900 });
await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36");
await page.reload({ waitUntil: "domcontentloaded" }); await sleep(2000);
await page.evaluate(() => document.querySelectorAll(".driver-popover-close-btn").forEach((b) => b.click()));

// ───────── 8) professor justifica uma ocorrência com motivo (auditoria) ─────────
await prof.reload({ waitUntil: "domcontentloaded" }); await sleep(2000); await sleep(800);
await prof.evaluate(() => { const l = [...document.querySelectorAll("tbody tr")].find((r) => r.innerText.includes("Tentativa de copiar")); l.querySelector("button").click(); });
await sleep(1000);
await prof.evaluate(() => { const ta = document.querySelector("textarea"); const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set; setter.call(ta, "Aluna usa leitor de tela"); ta.dispatchEvent(new Event("input", { bubbles: true })); });
await prof.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Marcar como justificada")).click());
await sleep(1500);
const j = await prof.evaluate(() => document.body.innerText);
check(/registrado na auditoria/.test(j) && /Justificou a ocorrência/.test(j) && /Aluna usa leitor de tela/.test(j), "professor justifica com motivo e a decisão aparece na auditoria");
await prof.screenshot({ path: OUT + "/08-justificada-auditoria.png", fullPage: true });

// ───────── 9) conexão: perder e voltar não perde o progresso ─────────
await page.evaluate(() => { const o = document.querySelector("[role=radio],[role=checkbox]"); if (o) o.click(); });
const antes = (await api(`/api/game/${AID}/state`)).json.answered;
await page.setOfflineMode(true);
await clicaTexto("CONFIRMAR RESPOSTA");
await sleep(1500);
const erroVisivel = await page.evaluate(() => document.body.innerText);
await page.setOfflineMode(false);
const depois = (await api(`/api/game/${AID}/state`)).json.answered;
check(depois === antes, "sem conexão: nada se perde nem é gravado pela metade", `respondidas antes=${antes} depois=${depois}`);
await page.reload({ waitUntil: "domcontentloaded" }); await sleep(2000);
check((await api(`/api/game/${AID}/state`)).json.answered === antes && (await textoDe("body")).includes(`Desafio ${antes + 1}`), "conexão volta + F5: partida restaurada no mesmo desafio");

// ───────── 10) o aluno não alcança o painel nem o histórico ─────────
const adm = await api("/api/admin/integrity/events");
const adm2 = await api("/api/admin/integrity/events/1", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "justify", note: "eu mesmo" }) });
check(adm.status === 403 && adm2.status === 403, "aluno: 403 ao tentar ler ou alterar ocorrências pelo console", `${adm.status}/${adm2.status}`);
const forj = await api(`/api/game/${AID}/answer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId: 1, optionId: 1, points: 999, score: 999 }) });
check([400, 404, 409].includes(forj.status), "pontuação forjada pelo console é recusada/ignorada pelo servidor", String(forj.status));

console.log(`\nRESULTADO: ${ok} aprovados, ${bad} reprovados`);
await browser.close();
process.exit(bad ? 1 : 0);
