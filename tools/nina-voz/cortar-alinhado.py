# Corta o áudio longo nas fronteiras propostas por alinhar.py (trabalho/alinhamento.json): um MP3 por fala.
#   tools/nina-voz/.venv/Scripts/python tools/nina-voz/cortar-alinhado.py [--publicar]
# Sem --publicar: escreve a PRÉVIA em trabalho/previa/ (para ouvir). Com --publicar: escreve em public/guia/nina/audio e atualiza o manifesto.
# Cada fronteira é ajustada para o ponto de MENOR ENERGIA perto da palavra (mesmo onde a voz não deixou pausa).
# Saída igual às gravações originais: mono, 24 kHz, 64 kbps, fade de 10 ms, ~ -16 LUFS.
import json, re, subprocess, sys, tempfile, wave
from datetime import date
from pathlib import Path
import numpy as np
import imageio_ffmpeg

raiz = Path(__file__).parent
FF = imageio_ffmpeg.get_ffmpeg_exe()
web = raiz.parent.parent / "apps" / "web"
publicar = "--publicar" in sys.argv
saida = web / "public" / "guia" / "nina" / "audio" if publicar else raiz / "trabalho" / "previa"
saida.mkdir(parents=True, exist_ok=True)
al = json.loads((raiz / "trabalho" / "alinhamento.json").read_text(encoding="utf-8"))
falas = al["falas"]
origem = raiz / "origem" / "geradas" / al["arquivo"]
catalogo = {f["id"]: f for f in json.loads((web / "src" / "data" / "nina" / "falas.json").read_text(encoding="utf-8"))["falas"]}
FADE, SR = 0.010, 24000

def ff(args):
    r = subprocess.run([FF, "-hide_banner", "-y", *args], capture_output=True, text=True)
    if r.returncode != 0: raise SystemExit("ffmpeg falhou: " + r.stderr[-300:])
    return r.stderr

with tempfile.TemporaryDirectory() as tmp:
    wav = Path(tmp) / "x.wav"
    ff(["-i", str(origem), "-ac", "1", "-ar", str(SR), str(wav)])
    with wave.open(str(wav)) as w: x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
hop = int(0.010 * SR)
rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2) + 1e-12) for i in range(0, len(x) - hop, hop)])
def db(t): return 20 * np.log10(rms[min(len(rms) - 1, max(0, int(t / 0.010)))] + 1e-9)

# fronteira entre a fala k e a k+1
fronteiras = []
for k in range(len(falas) - 1):
    a, b = falas[k], falas[k + 1]
    gap = b["fala_ini"] - a["fala_fim"]
    lo, hi = a["fala_fim"] - 0.06, b["fala_ini"] + 0.06
    if hi - lo < 0.08: lo, hi = (lo + hi) / 2 - 0.05, (lo + hi) / 2 + 0.05
    i0, i1 = int(lo / 0.010), max(int(lo / 0.010) + 2, int(hi / 0.010))
    janela = rms[i0:i1]
    limiar = janela.min() * 1.5 + 1e-6
    abaixo = np.where(janela <= limiar)[0]
    # meio da maior sequência de quadros "silenciosos" na janela
    runs, cur = [], [abaixo[0]] if len(abaixo) else []
    for u, v in zip(abaixo, abaixo[1:]):
        if v == u + 1: cur.append(v)
        else: runs.append(cur); cur = [v]
    if cur: runs.append(cur)
    melhor = max(runs, key=len) if runs else [int(np.argmin(janela))]
    t = (i0 + melhor[len(melhor) // 2]) * 0.010
    fronteiras.append(round(t, 3))

manifesto = json.loads((web / "public" / "guia" / "nina" / "audio" / "manifest.json").read_text(encoding="utf-8")) if publicar else None
avisos = []
LIM = -42  # dB: abaixo disso é silêncio
def aparar(ini, fim):
    """Tira o silêncio das pontas deixando ~100 ms antes e ~120 ms depois da fala (sem passar da fronteira)."""
    i0, i1 = int(ini / 0.010), int(fim / 0.010)
    som = [i for i in range(i0, min(i1, len(rms))) if 20 * np.log10(rms[i] + 1e-9) > LIM]
    if not som: return ini, fim
    return max(ini, som[0] * 0.010 - 0.10), min(fim, (som[-1] + 1) * 0.010 + 0.12)
for k, a in enumerate(falas):
    ini = a["corte_ini"] if k == 0 else fronteiras[k - 1]
    fim = a["corte_fim"] if k == len(falas) - 1 else fronteiras[k]
    ini, fim = aparar(ini, fim)
    mp3 = saida / f"{a['id']}.mp3"
    err = ff(["-ss", f"{ini}", "-to", f"{fim}", "-i", str(origem), "-ac", "1", "-ar", str(SR),
              "-af", f"afade=t=in:d={FADE},afade=t=out:st={max(0, fim - ini - FADE):.3f}:d={FADE},loudnorm=I=-16:TP=-1.5:LRA=11", "-b:a", "64k", str(mp3)])
    t = re.findall(r"time=(\d+):(\d+):([\d.]+)", err)[-1]
    dur = int(t[0]) * 3600 + int(t[1]) * 60 + float(t[2])
    ruido = max(db(ini + 0.015), db(fim - 0.015))
    if ruido > -32: avisos.append(f"{a['id']}: corte com som no limite ({ruido:.0f} dB) — ouvir o início/fim")
    if a["sim"] < 0.9: avisos.append(f"{a['id']}: semelhança {a['sim']:.0%} — conferir de ouvido ({a['ouvido']})")
    print(f"{a['id']:46s} {ini:7.2f}–{fim:7.2f}  {dur:5.1f} s")
    if manifesto is not None:
        c = catalogo[a["id"]]
        manifesto["falas"][a["id"]] = {"audio": mp3.name, "texto": c["texto"], "duracaoMs": round(dur * 1000), "contexto": c["tela"], "animacao": c["animacao"], "falado": a["falado"], "geradoEm": date.today().isoformat()}

if manifesto is not None:
    manifesto["origem"] = "ElevenLabs, voz sylphiette (gravação original de 2026-11-16 + 27.mp3 gerado em 2026-11-16, cortado por alinhamento); modelo multilingual v2, velocidade 0,96, estabilidade 57, similaridade 75, estilo 0"
    (saida / "manifest.json").write_text(json.dumps(manifesto, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
total = sum(p.stat().st_size for p in saida.glob("*.mp3"))
print(f"\n{len(falas)} falas -> {saida}; {total / 1048576:.2f} MB" + (" (PUBLICADO no manifesto)" if publicar else " (prévia: nada foi publicado)"))
for v in avisos: print("AVISO:", v)
