import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { TUTORIAIS } from "../tutorial/registro";

const pasta = path.join(process.cwd(), "public", "guia", "nina", "audio");
const manifesto = JSON.parse(fs.readFileSync(path.join(pasta, "manifest.json"), "utf8")) as {
  origem: string; falas: Record<string, { audio: string; texto: string; duracaoMs: number; animacao: string; contexto: string }>;
};
const semNegrito = (t: string) => t.replace(/\*\*/g, "");

test("manifesto de áudio: registra a origem e cada fala aponta para um MP3 que existe e tem duração", () => {
  assert.match(manifesto.origem, /ElevenLabs/);
  for (const [id, f] of Object.entries(manifesto.falas)) {
    assert.ok(fs.existsSync(path.join(pasta, f.audio)), `${id}: arquivo ${f.audio} ausente`);
    assert.ok(f.duracaoMs > 500 && f.duracaoMs < 30000, `${id}: duração estranha`);
    assert.ok(f.texto.trim().length > 0, `${id}: sem legenda`);
  }
});

test("a legenda das etapas com áudio é exatamente o texto aprovado do manifesto (legenda bate com o áudio)", () => {
  let com = 0;
  for (const t of Object.values(TUTORIAIS))
    for (const e of t.etapas) {
      const f = manifesto.falas[`tutorial.${t.id}.${e.id}`];
      if (!f) continue;
      com++; assert.equal(e.texto, f.texto, `etapa ${e.id}: legenda diferente do manifesto`);
    }
  assert.ok(com >= 10, "as etapas de abertura e o tchau devem ter áudio");
});

test("todo áudio do manifesto é usado por alguma etapa (sem arquivo órfão) e o total fica abaixo de 5 MB", () => {
  const ids = new Set(Object.values(TUTORIAIS).flatMap((t) => t.etapas.flatMap((e) => [`tutorial.${t.id}.${e.id}`, `tutorial.${t.id}.${e.id}.ok`])));
  for (const id of Object.keys(manifesto.falas)) assert.ok(ids.has(id), `${id} não é usado por nenhuma etapa`);
  const usados = new Set(Object.values(manifesto.falas).map((f) => f.audio));
  for (const a of fs.readdirSync(pasta)) if (a !== "manifest.json") assert.ok(usados.has(a), `arquivo órfão: ${a}`);
  const total = fs.readdirSync(pasta).reduce((s, a) => s + fs.statSync(path.join(pasta, a)).size, 0);
  assert.ok(total < 5 * 1048576, `áudios somam ${(total / 1048576).toFixed(2)} MB`);
});

test("o site não depende de serviço externo de voz: nada no código do site chama a ElevenLabs", () => {
  const raiz = path.join(process.cwd(), "src");
  const achados: string[] = [];
  const varrer = (d: string) => { for (const n of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, n.name);
    if (n.isDirectory()) varrer(p);
    else if (/\.(ts|tsx)$/.test(n.name) && !p.includes("__tests__") && /api\.elevenlabs|xi-api-key|speechSynthesis|SpeechSynthesisUtterance/.test(fs.readFileSync(p, "utf8")) && !p.endsWith("voz.ts")) achados.push(p);
  } };
  varrer(raiz);
  assert.deepEqual(achados, []);
  void semNegrito;
});
