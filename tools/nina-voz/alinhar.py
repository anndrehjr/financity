# Alinha UM áudio longo (ex.: 27.mp3) às falas esperadas, SEM depender de pausas longas:
# transcreve com tempo por palavra (faster-whisper local), casa as palavras com os textos falados de blocos.json
# NA ORDEM DO CATÁLOGO (apps/web/src/data/nina/falas.json) e propõe os cortes nos vãos entre palavras.
#   tools/nina-voz/.venv/Scripts/python tools/nina-voz/alinhar.py ARQUIVO.mp3 [--ordem blocos]
# Escreve trabalho/alinhamento.json e trabalho/ALINHAMENTO.md (revisão). Depois: cortar-alinhado.py.
import difflib, json, re, sys, unicodedata
from pathlib import Path
import av
_o = av.open; av.open = lambda *a, **k: _o(*a, **{x: y for x, y in k.items() if x != "metadata_errors"})
from faster_whisper import WhisperModel

raiz = Path(__file__).parent
arq = Path(sys.argv[1])
cfg = json.loads((raiz / "blocos.json").read_text(encoding="utf-8"))
falado = {f["id"]: f["falado"] for b in cfg["blocos"] for f in b["falas"]}
if "--ordem" in sys.argv and sys.argv[sys.argv.index("--ordem") + 1] == "blocos":
    ordem = [f["id"] for b in cfg["blocos"] for f in b["falas"]]
else:
    catalogo = json.loads((raiz.parent.parent / "apps" / "web" / "src" / "data" / "nina" / "falas.json").read_text(encoding="utf-8"))["falas"]
    ordem = [f["id"] for f in catalogo if f["id"] in falado]
esperadas = [(i, falado[i]) for i in ordem]

NUM = {"1": "um", "2": "dois", "3": "tres", "4": "quatro", "5": "cinco", "6": "seis", "7": "sete", "8": "oito"}
def norm(t):
    t = unicodedata.normalize("NFD", t.lower()); t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return [NUM.get(x, x) for x in re.sub(r"[^a-z0-9 ]", " ", t).split()]

m = WhisperModel("medium", device="cpu", compute_type="int8")
segs, info = m.transcribe(str(arq), language="pt", word_timestamps=True, beam_size=5)
pal = [{"t0": w.start, "t1": w.end, "w": w.word.strip()} for s in segs for w in s.words]
(raiz / "trabalho").mkdir(exist_ok=True)
flat = [(i, x) for i, p in enumerate(pal) for x in norm(p["w"])]
toks = [x for _, x in flat]

pos, achados = 0, []
for fid, texto in esperadas:
    alvo = norm(texto); n = len(alvo); melhor = None
    for ini in range(max(0, pos - 2), min(len(toks), pos + 8)):
        for tam in range(max(1, n - 3), n + 4):
            if ini + tam > len(toks): continue
            r = difflib.SequenceMatcher(None, alvo, toks[ini:ini + tam]).ratio()
            if melhor is None or r > melhor[0] + 1e-9: melhor = (r, ini, tam)
    r, ini, tam = melhor
    achados.append({"id": fid, "falado": texto, "ouvido": " ".join(toks[ini:ini + tam]), "sim": round(r, 3), "i0": flat[ini][0], "i1": flat[ini + tam - 1][0]})
    pos = ini + tam

dur = pal[-1]["t1"] + 0.3
for a in achados: a["fala_ini"] = pal[a["i0"]]["t0"]; a["fala_fim"] = pal[a["i1"]]["t1"]
for k, a in enumerate(achados):
    ant = achados[k - 1]["fala_fim"] if k else None
    nxt = achados[k + 1]["fala_ini"] if k + 1 < len(achados) else None
    a["vao_antes"] = round(a["fala_ini"] - ant, 2) if ant is not None else None
    a["vao_depois"] = round(nxt - a["fala_fim"], 2) if nxt is not None else None
    a["corte_ini"] = round(max(0.0, a["fala_ini"] - (0.15 if ant is None else min(0.25, max(0.0, a["fala_ini"] - ant) / 2))), 3)
    a["corte_fim"] = round(min(dur, a["fala_fim"] + (0.30 if nxt is None else min(0.30, max(0.0, nxt - a["fala_fim"]) / 2))), 3)
(raiz / "trabalho" / "alinhamento.json").write_text(json.dumps({"arquivo": arq.name, "duracao": dur, "falas": achados, "palavras": pal}, ensure_ascii=False, indent=1), encoding="utf-8")
linhas = [f"| {i + 1} | {a['id']} | {a['corte_ini']:.2f}–{a['corte_fim']:.2f} | {a['vao_antes'] if a['vao_antes'] is not None else '—'} | {a['sim']:.0%} | {a['falado']} | {a['ouvido']} |" for i, a in enumerate(achados)]
(raiz / "trabalho" / "ALINHAMENTO.md").write_text("# Alinhamento do áudio longo × falas esperadas (ordem do catálogo)\n\n'vão' = silêncio antes da fala (s). Semelhança baixa = conferir de ouvido.\n\n| # | id | corte (s) | vão | semelhança | texto falado (esperado) | o que o Whisper ouviu |\n|---|---|---|---|---|---|---|\n" + "\n".join(linhas) + "\n", encoding="utf-8")
print(f"{len(pal)} palavras; semelhança mínima {min(a['sim'] for a in achados):.0%}; média {sum(a['sim'] for a in achados) / len(achados):.0%}")
