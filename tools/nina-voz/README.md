# Nina Voice — voz original (gravações da ElevenLabs feitas à mão)

A voz da Nina são **somente gravações suas**, tocadas como arquivos. O site **não** chama a ElevenLabs, não tem chave e não usa outra voz como substituta (sem áudio = só legenda).

## Fluxo
1. Grave no site da ElevenLabs e salve o MP3 em `tools/nina-voz/origem/` (pasta fora do git e fora de `public/`).
2. `cortes.json`: tempos (em segundos) de cada trecho. `falas-originais.json`: quais trechos formam cada fala, a **legenda oficial** e a animação.
3. Cortar e gerar o manifesto:
   ```
   python -m venv tools/nina-voz/.venv && tools/nina-voz/.venv/Scripts/python -m pip install imageio-ffmpeg
   tools/nina-voz/.venv/Scripts/python tools/nina-voz/cortar.py
   ```
   Saída: `apps/web/public/guia/nina/audio/*.mp3` (mono, 24 kHz, 64 kbps, fade de 10 ms, ~-16 LUFS) e `manifest.json`. Avisa se o total passar de ~5 MB.
4. `npx tsx tools/nina-voz/inventario.ts` atualiza o catálogo (`apps/web/src/data/nina/falas.json`) e o `INVENTARIO.md` (todas as falas, tela, status de áudio e caracteres a gerar).
5. Opcional, para conferir cortes novos: `transcrever.py` (faster-whisper local) gera `trabalho/CORTES-PARA-REVISAO.md`.

## No site
- IDs: `momento.N` (falas do JSON) e `tutorial.<tutorial>.<etapa>[.ok]`. Se o ID está no manifesto, toca o MP3; senão, só legenda.
- Voz desligada por padrão; só toca depois de um clique; para ao trocar de etapa/tela, pular ou esconder a Nina.
- Créditos: `config/personagem.ts → creditos.mostrarElevenLabs` (deixe `true` no plano gratuito; no pago, `false`).
- Sincronia labial (Rhubarb): ainda não gerada; a boca alterna pela duração.
