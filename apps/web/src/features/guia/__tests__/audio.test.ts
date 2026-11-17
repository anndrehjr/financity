import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import falasJson from "../config/falas-nina.json" with { type: "json" };
import catalogoJson from "../../../data/nina/falas.json" with { type: "json" };
import { TUTORIAIS } from "../tutorial/registro";

const pasta = path.join(process.cwd(), "public", "guia", "nina", "audio");
const manifesto = JSON.parse(fs.readFileSync(path.join(pasta, "manifest.json"), "utf8")) as {
  origem: string; falas: Record<string, { audio: string; texto: string; duracaoMs: number; animacao: string; contexto: string }>;
};
const catalogo = (catalogoJson as { falas: { id: string; texto: string }[] }).falas;
const porId = new Map(catalogo.map((f) => [f.id, f.texto]));

// ids que o CÓDIGO usa: momentos do JSON ("momento.N"), etapas dos tutoriais (+ ".ok") e a frase "sem pressa" do balão
const idsDoCodigo = new Map<string, string>();
for (const [m, mo] of Object.entries((falasJson as any).momentos as Record<string, { falas: { texto: string }[] }>)) mo.falas.forEach((f, i) => idsDoCodigo.set(`${m}.${i + 1}`, f.texto));
for (const t of Object.values(TUTORIAIS)) for (const e of t.etapas) {
  idsDoCodigo.set(`tutorial.${t.id}.${e.id}`, e.texto);
  if (e.aoConcluir) idsDoCodigo.set(`tutorial.${t.id}.${e.id}.ok`, e.aoConcluir.texto);
}
idsDoCodigo.set("guia.sem-pressa", "Sem pressa! Se quiser, pode continuar sem fazer isso agora.");

test("cobertura: todo id usado no código existe no catálogo, com a MESMA legenda (nenhum texto da Nina fica fora do catálogo)", () => {
  for (const [id, texto] of idsDoCodigo) {
    assert.ok(porId.has(id), `id ${id} usado no código não está no catálogo`);
    assert.equal(porId.get(id), texto, `legenda de ${id} diferente entre código e catálogo (rode: npx tsx tools/nina-voz/inventario.ts)`);
  }
});

test("manifesto de áudio: registra a origem; cada fala aponta para um MP3 que existe, tem duração e legenda", () => {
  assert.match(manifesto.origem, /ElevenLabs/);
  for (const [id, f] of Object.entries(manifesto.falas)) {
    assert.ok(fs.existsSync(path.join(pasta, f.audio)), `${id}: arquivo ${f.audio} ausente`);
    assert.ok(f.duracaoMs > 500 && f.duracaoMs < 30000, `${id}: duração estranha`);
    assert.ok(f.texto.trim().length > 0, `${id}: sem legenda`);
  }
});

test("a legenda de cada fala com áudio é exatamente a do catálogo (legenda bate com o áudio aprovado)", () => {
  for (const [id, f] of Object.entries(manifesto.falas)) assert.equal(f.texto, porId.get(id), `${id}: legenda do manifesto ≠ catálogo`);
});

test("todo áudio do manifesto é de uma fala existente (sem arquivo órfão) e o total fica abaixo de 8 MB", () => {
  for (const id of Object.keys(manifesto.falas)) assert.ok(idsDoCodigo.has(id), `${id} não é usado pelo código`);
  const usados = new Set(Object.values(manifesto.falas).map((f) => f.audio));
  for (const a of fs.readdirSync(pasta)) if (a !== "manifest.json") assert.ok(usados.has(a), `arquivo órfão: ${a}`);
  const total = fs.readdirSync(pasta).reduce((s, a) => s + fs.statSync(path.join(pasta, a)).size, 0);
  assert.ok(total < 8 * 1048576, `áudios somam ${(total / 1048576).toFixed(2)} MB`);
});

test("pendências de áudio (informativo): lista as falas ativas ainda sem áudio; o site mostra só a legenda delas", () => {
  const pendentes = [...idsDoCodigo.keys()].filter((id) => !manifesto.falas[id]);
  console.log(`# falas com áudio: ${Object.keys(manifesto.falas).length} · pendentes (só legenda): ${pendentes.length}`);
  assert.ok(Object.keys(manifesto.falas).length + pendentes.length === idsDoCodigo.size);
});

test("o site não depende de serviço externo de voz: nada no código chama a ElevenLabs nem usa a voz do navegador", () => {
  const raiz = path.join(process.cwd(), "src");
  const achados: string[] = [];
  const varrer = (d: string) => { for (const n of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, n.name);
    if (n.isDirectory()) varrer(p);
    else if (/\.(ts|tsx)$/.test(n.name) && !p.includes("__tests__") && /api\.elevenlabs|xi-api-key|speechSynthesis|SpeechSynthesisUtterance/.test(fs.readFileSync(p, "utf8"))) achados.push(p);
  } };
  varrer(raiz);
  assert.deepEqual(achados, []);
});
