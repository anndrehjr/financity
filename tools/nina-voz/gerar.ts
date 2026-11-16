// Gera os áudios pré-gravados da Nina (FERRAMENTA DE DESENVOLVIMENTO — fora do bundle do site).
//   ELEVENLABS_API_KEY=... npx tsx tools/nina-voz/gerar.ts [--dry] [--limite N]
// - Lê as falas (falas-nina.json + tutoriais), gera um MP3 por fala e escreve public/guia/nina/voz/manifest.json.
// - Cache por hash: fala que não mudou não é gerada de novo (não gasta créditos).
// - A chave só vem de variável de ambiente local; nunca é gravada nem impressa.
// - Se recusa a rodar sem tools/nina-voz/LICENCA-VOZ.md preenchido (regra de uso de voz).
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import falas from "../../apps/web/src/features/guia/config/falas-nina.json" with { type: "json" };
import { TUTORIAIS } from "../../apps/web/src/features/guia/tutorial/registro";
import { aplicarPronuncia, bocasDoRhubarb, coletarFalas, duracaoMp3Ms, hashFala, type Emocao } from "./lib";

const raiz = path.dirname(fileURLToPath(import.meta.url));
const saida = path.join(raiz, "..", "..", "apps", "web", "public", "guia", "nina", "voz");
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const limite = args.includes("--limite") ? Number(args[args.indexOf("--limite") + 1]) : Infinity;

// ---- configuração do motor (ElevenLabs, voz da biblioteca usada DIRETO pela API, sem clonagem) ----
const MOTOR = "elevenlabs", MODELO = process.env.NINA_VOZ_MODELO || "eleven_multilingual_v2";
const VOZ_ID = process.env.NINA_VOZ_ID || "aiUUgjHa4mpHf6UenZuf";
const FORMATO = "mp3_44100_128", KBPS = 128;
// Ajustes aprovados na amostra "sylphiette_gen_sp96_s57_sb75_se0_b_m2": velocidade 0,96, estabilidade 57%, similaridade 75%,
// exagero de estilo 0, speaker boost ligado, modelo Multilingual v2. Valem para todas as emoções (a emoção fica registrada no
// manifesto); para variar por emoção depois, edite só esta tabela e rode de novo (o hash muda e só as falas afetadas são regeneradas).
const BASE = { stability: 0.57, similarity_boost: 0.75, style: 0, speed: 0.96 };
const AJUSTES: Record<Emocao, typeof BASE> = { alegria: BASE, curiosidade: BASE, explicacao: BASE, incentivo: BASE, comemoracao: BASE };

function exigirLicenca() {
  const f = path.join(raiz, "LICENCA-VOZ.md");
  const ok = fs.existsSync(f) && /\[x\]\s*confirmo/i.test(fs.readFileSync(f, "utf8"));
  if (!ok) {
    console.error("RECUSADO: crie tools/nina-voz/LICENCA-VOZ.md a partir do LICENCA-VOZ.template.md, preencha e marque '[x] confirmo'.\n" +
      "Sem o registro da licença/autorização da voz o script não gera nada.");
    process.exit(2);
  }
}
const tem = (cmd: string) => spawnSync(cmd, ["-version"], { stdio: "ignore" }).status === 0 || spawnSync(cmd, ["--version"], { stdio: "ignore" }).status === 0;

async function sintetizar(texto: string, emocao: Emocao, chave: string): Promise<Buffer> {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOZ_ID}?output_format=${FORMATO}`, {
    method: "POST", headers: { "xi-api-key": chave, "content-type": "application/json" },
    body: JSON.stringify({ text: texto, model_id: MODELO, language_code: "pt", voice_settings: { ...AJUSTES[emocao], use_speaker_boost: true } }),
  });
  if (!r.ok) throw new Error(`ElevenLabs respondeu ${r.status} (${(await r.text()).slice(0, 120).replace(/\s+/g, " ")})`);
  return Buffer.from(await r.arrayBuffer());
}

function normalizar(arquivo: string): boolean {
  if (!tem("ffmpeg")) return false;
  const tmp = arquivo + ".tmp.mp3";
  const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", arquivo, "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-16:TP=-1.5:LRA=11",
    "-ac", "1", "-ar", "44100", "-b:a", `${KBPS}k`, tmp]);
  if (r.status !== 0) return false;
  fs.renameSync(tmp, arquivo); return true;
}
function boca(arquivo: string, destino: string): boolean {
  if (!tem("rhubarb") || !tem("ffmpeg")) return false;
  const wav = arquivo + ".wav";
  if (spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", arquivo, "-ar", "16000", "-ac", "1", wav]).status !== 0) return false;
  const r = spawnSync("rhubarb", ["-f", "json", "--recognizer", "phonetic", wav], { encoding: "utf8" });
  fs.rmSync(wav, { force: true });
  if (r.status !== 0) return false;
  fs.writeFileSync(destino, JSON.stringify(bocasDoRhubarb(JSON.parse(r.stdout)))); return true;
}

async function main() {
  const todas = coletarFalas(falas as any, TUTORIAIS as any).slice(0, limite);
  const pron = JSON.parse(fs.readFileSync(path.join(raiz, "pronuncia.json"), "utf8"));
  if (dry) {
    for (const f of todas) console.log(`${f.id.padEnd(40)} [${f.emocao}] ${aplicarPronuncia(f.texto, pron)}`);
    console.log(`\n${todas.length} falas (simulação: nada gerado, nada enviado).`); return;
  }
  exigirLicenca();
  const chave = process.env.ELEVENLABS_API_KEY;
  if (!chave) { console.error("Defina ELEVENLABS_API_KEY no seu terminal (não é gravada em arquivo)."); process.exit(2); }
  fs.mkdirSync(saida, { recursive: true });
  const antigo = fs.existsSync(path.join(saida, "manifest.json")) ? JSON.parse(fs.readFileSync(path.join(saida, "manifest.json"), "utf8")) : { falas: {} };
  const manifesto: any = { versao: (antigo.versao ?? 0) + 1, motor: `${MOTOR}-${MODELO}`, voz: VOZ_ID, geradoEm: new Date().toISOString().slice(0, 10), normalizado: tem("ffmpeg"), falas: {} };
  let geradas = 0;
  for (const f of todas) {
    const texto = aplicarPronuncia(f.texto, pron);
    const h = hashFala(texto, MOTOR, VOZ_ID, f.emocao, `${MODELO}:${JSON.stringify(AJUSTES[f.emocao])}`); // ajustes entram no hash
    const nome = `${f.id}.${h}.mp3`, arq = path.join(saida, nome), bocaNome = `${f.id}.${h}.boca.json`;
    if (!fs.existsSync(arq)) {
      const mp3 = await sintetizar(texto, f.emocao, chave);
      fs.writeFileSync(arq, mp3); normalizar(arq); geradas++;
      console.log(`gerada: ${f.id}`);
    }
    const comBoca = fs.existsSync(path.join(saida, bocaNome)) || boca(arq, path.join(saida, bocaNome));
    manifesto.falas[f.id] = { audio: nome, duracaoMs: duracaoMp3Ms(fs.statSync(arq).size, KBPS), emocao: f.emocao, ...(comBoca ? { boca: bocaNome } : {}) };
  }
  // avisos: áudios órfãos
  const usados = new Set(Object.values<any>(manifesto.falas).flatMap((x) => [x.audio, x.boca].filter(Boolean)));
  for (const a of fs.readdirSync(saida)) if (a !== "manifest.json" && !usados.has(a)) console.warn(`órfão (pode apagar): ${a}`);
  fs.writeFileSync(path.join(saida, "manifest.json"), JSON.stringify(manifesto, null, 2) + "\n");
  const bytes = fs.readdirSync(saida).reduce((s, a) => s + fs.statSync(path.join(saida, a)).size, 0);
  console.log(`\n${geradas} geradas, ${todas.length - geradas} em cache. Total em disco: ${(bytes / 1048576).toFixed(2)} MB${bytes > 5 * 1048576 ? "  ⚠ acima de 5 MB" : ""}.`);
  if (!manifesto.normalizado) console.warn("ffmpeg não encontrado: sem normalização de volume nem corte de silêncio; duração é estimada.");
}
main().catch((e) => { console.error("Erro:", e.message); process.exit(1); });
