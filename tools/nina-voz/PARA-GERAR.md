# Falas para gerar na ElevenLabs — 3 blocos (modo manual)

Gerado por `npx tsx tools/nina-voz/gerar.ts` a partir de `blocos.json`. O site **não** chama a ElevenLabs.

## Configuração
Voz sylphiette · Multilingual v2 · Velocidade 0,96 · Estabilidade 57 · Similaridade 75 · Estilo 0 · Speaker boost ligado

## Como fazer
1. Para cada bloco, copie **todo** o arquivo `blocos/nina-bloco-N.txt` e gere **um** áudio.
2. Salve em `tools/nina-voz/origem/geradas/` com o nome **`nina-bloco-N.mp3`**.
3. Ouça. Se alguma frase sair estranha, gere **só aquele bloco** de novo.
4. Rode `tools/nina-voz/.venv/Scripts/python tools/nina-voz/cortar-blocos.py --conferir` (ou me avise): corta nas pausas de 1.5s, confere o que a voz falou e gera um MP3 por fala.

Se a voz **ler em voz alta** a marca `<break ... />`, me avise.

## Bloco 1 — avisos (séries) → `nina-bloco-4.mp3` (1 falas, 73 caracteres)

| posição | id (arquivo final) | texto falado | legenda no site |
|---|---|---|---|
| 1 | sem_temas.1 | Seus temas chegam em breve! Quando estiverem prontos, eles aparecem aqui. | Seus temas chegam em breve! Quando estiverem prontos, eles aparecem aqui. |

Total: 1 falas, 73 caracteres (plano gratuito ≈ 10.000 créditos/mês).
