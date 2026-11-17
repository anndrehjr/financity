# Corta os 3 blocos gerados (nina-bloco-N.mp3) nas pausas e produz UM MP3 por fala, com o id certo, + atualiza o manifesto.
#   tools/nina-voz/.venv/Scripts/python tools/nina-voz/cortar-blocos.py [--conferir] [--pasta CAMINHO]
# - Procura as pausas longas (≥ 1,0 s; as pausas normais entre frases são menores) e confere que o nº de trechos == nº de falas do bloco.
#   Se não bater, NÃO adivinha: mostra os trechos e para (gere o bloco de novo ou ajuste).
# - Corte com re-encode: folga de 100 ms antes e depois, fade de 10 ms, mono 24 kHz 64 kbps, volume ~ -16 LUFS (igual às gravações originais).
# - --conferir: transcreve cada fala (faster-whisper local) e compara com o texto falado; escreve trabalho/CONFERENCIA-BLOCOS.md.
import difflib, json, re, subprocess, sys, tempfile, unicodedata
from datetime import date
from pathlib import Path
import imageio_ffmpeg

raiz = Path(__file__).parent
FF = imageio_ffmpeg.get_ffmpeg_exe()
web = raiz.parent.parent / "apps" / "web"
saida = Path(sys.argv[sys.argv.index("--saida") + 1]) if "--saida" in sys.argv else web / "public" / "guia" / "nina" / "audio"
pasta = Path(sys.argv[sys.argv.index("--pasta") + 1]) if "--pasta" in sys.argv else raiz / "origem" / "geradas"
cfg = json.loads((raiz / "blocos.json").read_text(encoding="utf-8"))
catalogo = {f["id"]: f for f in json.loads((web / "src" / "data" / "nina" / "falas.json").read_text(encoding="utf-8"))["falas"]}
MIN_PAUSA, MARGEM, FADE = 1.0, 0.10, 0.010

def ff(args, check=True):
    r = subprocess.run([FF, "-hide_banner", "-y", *args], capture_output=True, text=True)
    if check and r.returncode != 0: raise SystemExit("ffmpeg falhou: " + r.stderr[-300:])
    return r.stderr

def duracao(p):
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", ff(["-i", str(p)], check=False))
    return int(m[1]) * 3600 + int(m[2]) * 60 + float(m[3])

def trechos(p):
    d = duracao(p)
    err = ff(["-i", str(p), "-af", f"silencedetect=noise=-38dB:d={MIN_PAUSA}", "-f", "null", "-"], check=False)
    ini = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", err)]
    fim = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    pausas = list(zip(ini, fim + [d] * (len(ini) - len(fim))))
    cortes, cur = [], 0.0
    for a, b in pausas:
        if a - cur > 0.25: cortes.append((cur, a))
        cur = b
    if d - cur > 0.25: cortes.append((cur, d))
    return cortes, d

def norm(t):
    t = unicodedata.normalize("NFD", t.lower()); t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9 ]", "", t).strip()

manifesto = json.loads((saida / "manifest.json").read_text(encoding="utf-8"))
conferencia, erros = [], []
modelo = None
for bloco in cfg["blocos"]:
    arq = pasta / bloco["arquivo"]
    if not arq.exists():
        print(f"[falta] {arq.name} não está em {pasta}"); erros.append(bloco["arquivo"]); continue
    cortes, d = trechos(arq)
    n = len(bloco["falas"])
    if len(cortes) != n:
        print(f"[PARA] {arq.name}: achei {len(cortes)} trechos, esperava {n}. Trechos (s):")
        for i, (a, b) in enumerate(cortes, 1): print(f"   {i:2d}: {a:6.2f} – {b:6.2f}  ({b - a:4.1f} s)")
        print("   Ouça o bloco: se faltou/sobrou pausa, gere o bloco de novo (ou me avise).")
        erros.append(bloco["arquivo"]); continue
    with tempfile.TemporaryDirectory() as tmp:
        for (a, b), f in zip(cortes, bloco["falas"]):
            ini, fim = max(0.0, a - MARGEM), min(d, b + MARGEM)
            mp3 = saida / f"{f['id']}.mp3"
            err = ff(["-ss", f"{ini}", "-to", f"{fim}", "-i", str(arq), "-ac", "1", "-ar", "24000",
                      "-af", f"afade=t=in:d={FADE},afade=t=out:st={max(0, fim - ini - FADE):.3f}:d={FADE},loudnorm=I=-16:TP=-1.5:LRA=11",
                      "-b:a", "64k", str(mp3)])
            t = re.findall(r"time=(\d+):(\d+):([\d.]+)", err)[-1]
            dur = int(t[0]) * 3600 + int(t[1]) * 60 + float(t[2])
            c = catalogo[f["id"]]
            manifesto["falas"][f["id"]] = {"audio": mp3.name, "texto": c["texto"], "duracaoMs": round(dur * 1000), "contexto": c["tela"], "animacao": c["animacao"], "falado": f["falado"], "geradoEm": date.today().isoformat()}
            linha = {"id": f["id"], "dur": dur, "falado": f["falado"], "ouvido": "", "sim": None}
            if "--conferir" in sys.argv:
                if modelo is None:
                    from faster_whisper import WhisperModel
                    import av
                    _o = av.open; av.open = lambda *a, **k: _o(*a, **{x: y for x, y in k.items() if x != "metadata_errors"})
                    modelo = WhisperModel("medium", device="cpu", compute_type="int8")
                segs, _ = modelo.transcribe(str(mp3), language="pt", beam_size=5)
                linha["ouvido"] = " ".join(s.text.strip() for s in segs)
                linha["sim"] = difflib.SequenceMatcher(None, norm(f["falado"]), norm(linha["ouvido"])).ratio()
            conferencia.append(linha)
            print(f"{f['id']:46s} {dur:5.1f} s" + (f"  semelhança {linha['sim']:.0%}" if linha["sim"] is not None else ""))

manifesto["origem"] = "ElevenLabs, voz sylphiette (gravação original de 2026-11-16 + blocos gerados em " + date.today().isoformat() + "); modelo multilingual v2, velocidade 0,96, estabilidade 57, similaridade 75, estilo 0"
(saida / "manifest.json").write_text(json.dumps(manifesto, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
if conferencia and "--conferir" in sys.argv:
    t = raiz / "trabalho"; t.mkdir(exist_ok=True)
    linhas = [f"| {c['id']} | {c['dur']:.1f} s | {c['sim']:.0%} | {c['falado']} | {c['ouvido']} |" for c in conferencia]
    (t / "CONFERENCIA-BLOCOS.md").write_text("# Conferência dos blocos (Whisper × texto falado)\n\nSemelhança baixa = a voz pode ter falado diferente: **ouça**.\n\n| id | duração | semelhança | texto falado | o que o Whisper ouviu |\n|---|---|---|---|---|\n" + "\n".join(linhas) + "\n", encoding="utf-8")
total = sum(p.stat().st_size for p in saida.iterdir())
print(f"\n{len(conferencia)} falas cortadas; {len(manifesto['falas'])} no manifesto; áudios somam {total / 1048576:.2f} MB" + ("  ⚠ acima de 8 MB" if total > 8 * 1048576 else ""))
if erros: print("Blocos com problema:", ", ".join(erros)); sys.exit(2)
