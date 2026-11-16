# Nina Voice — pipeline de voz pré-gerada (ferramenta de desenvolvimento)

Fora do bundle do site. Em produção o site só **toca arquivos estáticos**; não há modelo de voz nem chave de API no site.

## Uso
```bash
npx tsx tools/nina-voz/gerar.ts --dry            # lista as falas e o texto que iria ao motor (nada é enviado)
cp tools/nina-voz/LICENCA-VOZ.template.md tools/nina-voz/LICENCA-VOZ.md   # preencher e marcar "[x] confirmo"
ELEVENLABS_API_KEY=... npx tsx tools/nina-voz/gerar.ts --limite 3         # teste com 3 falas
ELEVENLABS_API_KEY=... npx tsx tools/nina-voz/gerar.ts                    # todas
```
- A chave vem só da variável de ambiente local. Não é gravada nem impressa.
- Sem `LICENCA-VOZ.md` preenchido, o script se recusa a gerar.
- Saída: `apps/web/public/guia/nina/voz/` (MP3 com hash no nome + `manifest.json` com motor, voz e data).
- Cache por hash (`sha256(texto+motor+voz+emoção+modelo)`): fala que não mudou não gasta créditos.
- Voz: padrão `aiUUgjHa4mpHf6UenZuf` (variável `NINA_VOZ_ID`), modelo `eleven_multilingual_v2` (`NINA_VOZ_MODELO`). **Sem clonagem.**
- Opcionais (ignorados se não instalados): `ffmpeg` (normaliza ~-16 LUFS, corta silêncio, mono) e `rhubarb` (formas da boca, `--recognizer phonetic`; **confirme a licença do Rhubarb antes de usar**). Sem eles: duração estimada e só legenda/alternância de boca.
- Pronúncia: `pronuncia.json` (só no texto do motor; legenda não muda). `R$` e `%` são tratados no código.
- Avisa falas sem áudio (ausentes do manifesto) e áudios órfãos; avisa se o total passar de ~5 MB.

## Regras de uso de voz
Só voz com licença comercial no momento da geração, gravação própria ou autorização escrita. Nunca usar prévias/vozes de terceiros como referência de clonagem. O áudio de referência (se um dia houver clonagem) fica em `referencia/`, ignorado pelo git.
