# Transcrição com tempo por palavra (faster-whisper, MIT, local) + detecção de pausas (ffmpeg silencedetect)
# e conferência dos cortes aprovados. NÃO corta nem gera áudio: só produz a tabela para revisão humana.
#   tools/nina-voz/.venv/Scripts/python tools/nina-voz/transcrever.py
import json, re, subprocess, sys
from pathlib import Path
import av
import imageio_ffmpeg
# compatibilidade: PyAV 19 removeu o argumento "metadata_errors" que o faster-whisper 1.2 ainda passa (não há PyAV antigo para Python 3.13)
_av_open = av.open
av.open = lambda *a, **k: _av_open(*a, **{x: y for x, y in k.items() if x != "metadata_errors"})
from faster_whisper import WhisperModel

raiz = Path(__file__).parent
origem = next((raiz / "origem").glob("ElevenLabs_*.mp3"))
trabalho = raiz / "trabalho"; trabalho.mkdir(exist_ok=True)
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
cortes = json.loads((raiz / "cortes.json").read_text(encoding="utf-8"))["falas"]

# 1) pausas reais (silencedetect)
r = subprocess.run([FFMPEG, "-hide_banner", "-i", str(origem), "-af", "silencedetect=noise=-35dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True)
ini = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r.stderr)]
fim = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
pausas = list(zip(ini, fim))
dur = float(re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr).group(1)) * 3600 + float(re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr).group(2)) * 60 + float(re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr).group(3))

# 2) transcrição (CPU, int8; modelo medium; português)
modelo = WhisperModel(sys.argv[1] if len(sys.argv) > 1 else "medium", device="cpu", compute_type="int8")
segs, info = modelo.transcribe(str(origem), language="pt", word_timestamps=True, beam_size=5, vad_filter=False)
palavras = [{"t0": w.start, "t1": w.end, "w": w.word.strip()} for s in segs for w in s.words]
(trabalho / "palavras.json").write_text(json.dumps(palavras, ensure_ascii=False, indent=1), encoding="utf-8")

# 3) para cada corte aprovado: texto transcrito, e se algum limite cai no meio de uma palavra ou fora de uma pausa
linhas, saida = [], []
for c in cortes:
    a, b = c["inicio"], c["fim"]
    dentro = [w for w in palavras if (w["t0"] + w["t1"]) / 2 >= a and (w["t0"] + w["t1"]) / 2 <= b]
    texto = " ".join(w["w"] for w in dentro).strip()
    corta_palavra = [w["w"] for w in palavras if (w["t0"] < a < w["t1"]) or (w["t0"] < b < w["t1"])]
    em_pausa = lambda t: any(p0 - 0.05 <= t <= p1 + 0.05 for p0, p1 in pausas) or t <= 0.05 or t >= dur - 0.05
    avisos = []
    if corta_palavra: avisos.append("limite no meio de: " + ", ".join(corta_palavra))
    if not em_pausa(a): avisos.append("início fora de pausa")
    if not em_pausa(b): avisos.append("fim fora de pausa")
    saida.append({**c, "texto_transcrito": texto, "duracao": round(b - a, 2), "avisos": avisos})
    linhas.append(f"| {c['id']} | {a:.2f} | {b:.2f} | {b - a:.1f} s | {texto or '*(sem fala)*'} | {'; '.join(avisos) or 'ok'} |")
(trabalho / "transcricao.json").write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding="utf-8")
(trabalho / "CORTES-PARA-REVISAO.md").write_text(
    f"# Cortes aprovados × transcrição automática (Whisper {sys.argv[1] if len(sys.argv) > 1 else 'medium'}, pt)\n\nOrigem: `{origem.name}` ({dur:.1f} s)\n\n"
    "O Whisper erra nomes e números: **corrija o texto** (ele será a legenda oficial). 'Avisos' = conferência automática dos limites.\n\n"
    "| id | início | fim | duração | texto transcrito | avisos |\n|---|---|---|---|---|---|\n" + "\n".join(linhas) + "\n", encoding="utf-8")
print(f"{len(cortes)} cortes, {len(palavras)} palavras, {len(pausas)} pausas detectadas, origem {dur:.1f} s")
