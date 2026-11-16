# Corta a gravação original nos trechos aprovados e gera os MP3 + manifesto do site. 100% local (ffmpeg portátil).
#   tools/nina-voz/.venv/Scripts/python tools/nina-voz/cortar.py
# - corte com re-encode (exato), fade de 10 ms, mono, 24 kHz, 64 kbps, volume nivelado (~ -16 LUFS)
# - pausa de 150 ms entre trechos concatenados
# - manifesto em apps/web/public/guia/nina/audio/manifest.json (avisa se o total passar de ~5 MB)
import json, re, subprocess, tempfile
from datetime import date
from pathlib import Path
import imageio_ffmpeg

raiz = Path(__file__).parent
FF = imageio_ffmpeg.get_ffmpeg_exe()
origem = next((raiz / "origem").glob("ElevenLabs_*.mp3"))
saida = raiz.parent.parent / "apps" / "web" / "public" / "guia" / "nina" / "audio"
saida.mkdir(parents=True, exist_ok=True)
cortes = {c["trechos"][0]: c for c in json.loads((raiz / "cortes.json").read_text(encoding="utf-8"))["falas"]}
falas = json.loads((raiz / "falas-originais.json").read_text(encoding="utf-8"))
FADE = 0.010

def run(args):
    r = subprocess.run([FF, "-hide_banner", "-y", *args], capture_output=True, text=True)
    if r.returncode != 0: raise SystemExit("ffmpeg falhou: " + r.stderr[-400:])
    return r.stderr

manifesto = {"origem": falas["origem"], "geradoEm": date.today().isoformat(), "versao": 1, "falas": {}}
with tempfile.TemporaryDirectory() as tmp:
    tmp = Path(tmp)
    pausa = tmp / "pausa.wav"
    run(["-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "0.15", str(pausa)])
    for f in falas["falas"]:
        partes = []
        for n in f["trechos"]:
            c = cortes[n]; a, b = c["inicio"], c["fim"]
            p = tmp / f"{f['id']}.{n}.wav"
            run(["-ss", f"{a}", "-to", f"{b}", "-i", str(origem), "-ac", "1", "-ar", "24000",
                 "-af", f"afade=t=in:d={FADE},afade=t=out:st={max(0, b - a - FADE):.3f}:d={FADE}", str(p)])
            partes.append(p)
        lista = tmp / f"{f['id']}.txt"
        lista.write_text("".join(f"file '{p.as_posix()}'\nfile '{pausa.as_posix()}'\n" for p in partes[:-1]) + f"file '{partes[-1].as_posix()}'\n", encoding="utf-8")
        junto = tmp / f"{f['id']}.junto.wav"
        run(["-f", "concat", "-safe", "0", "-i", str(lista), "-c", "copy", str(junto)])
        mp3 = saida / f"{f['id']}.mp3"
        err = run(["-i", str(junto), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ac", "1", "-ar", "24000", "-b:a", "64k", str(mp3)])
        t = re.findall(r"time=(\d+):(\d+):([\d.]+)", err)[-1]
        dur = int(t[0]) * 3600 + int(t[1]) * 60 + float(t[2])
        manifesto["falas"][f["id"]] = {"audio": mp3.name, "texto": f["texto"], "duracaoMs": round(dur * 1000), "contexto": f["contexto"], "animacao": f["animacao"]}
        print(f"{f['id']:48s} {dur:5.1f} s")

(saida / "manifest.json").write_text(json.dumps(manifesto, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
total = sum(p.stat().st_size for p in saida.iterdir())
print(f"\n{len(manifesto['falas'])} falas, {total / 1048576:.2f} MB no total" + ("  ⚠ acima de 5 MB" if total > 5 * 1048576 else ""))
