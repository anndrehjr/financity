# Conteúdo do 7º ano — passo a passo

A estrutura por série já existe. O 7º ano começa **sem temas** (o aluno vê "Seus temas chegam em breve!"). Este guia mostra como preencher, validar e publicar.

## Onde preencher
`apps/api/src/content/serie7.ts` — 4 temas (`s7-tema-1` … `s7-tema-4`), cada um com 8 desafios em branco e `rascunho: true`.

Para cada tema preencha: `title`, `subtitle`, `topics` e, em cada desafio:

| campo | o que é |
|---|---|
| `title`, `theme` | nome curto do desafio e do assunto |
| `scenario` | a situação |
| `prompt` | a pergunta (enunciado) |
| `options` (4) | `text` (alternativa), `points` (pontos) e `why` (explicação) |
| `rubric`, `strength`, `retake` | critério de correção; o que a resposta mostra; o que retomar (aparecem nos relatórios) |
| `bncc` | habilidade BNCC (confira o código no site do MEC) |
| `hint` | dica (opcional; não tira pontos) |
| `scene` | ilustração (use uma chave existente; padrão `plan`) |

### Tipos e pontos (igual ao 8º ano)
Pontos por desafio: **30 em todos** (240 por tema; padrão único, igual ao 8º ano).
- `choice`: 4 alternativas; **uma** vale 30 (a correta); as outras só podem valer **20** (quase certa), **10** (parcial) ou **0** (errada). A validação recusa outros valores.
- `multi` (sugerido no desafio 3): marque `correct: true` em 1 a 3 alternativas. Os pontos ficam 0 (a regra calcula).
- `order` (sugerido no desafio 5): `seq` de 1 a 4 na ordem correta. O aluno vê as etapas embaralhadas, sem números.

## Validar (não grava nada)
```
cd apps/api && npx tsx src/serie-cli.ts validar
```
Aponta, por tema, tudo que falta: 8 desafios, enunciado, 4 alternativas, uma resposta correta, pontuação e explicação.
Os testes (`npm test` em `apps/api`) conferem o mesmo.

## Publicar (só quando o tema estiver completo)
1. Troque `rascunho: true` por `rascunho: false` **apenas nos temas prontos**. Tema em rascunho nunca vai para o banco.
2. Valide de novo.
3. **Faça o backup do banco** (comando abaixo) e espere terminar.
4. Na VPS (container da API): `docker exec financity-api-1 node dist/serie-cli.js publicar`.
   Grava só os temas prontos, tudo-ou-nada; não apaga nem altera nada existente; rodar de novo não duplica.
5. Entre como aluno do 7º e confira.

Backup (na VPS): `~/docker/financity/src/deploy/backup/backup-financity.sh`

## Nina no 7º ano
- Falas **gerais** (acerto, erro, ajuda, tutorial, fim de tema) já servem aos dois anos.
- As falas dos temas ("Tema 1: …") são por série: crie momentos `s7.mapa_1` … `s7.mapa_4` em `apps/web/src/features/guia/config/falas-nina.json` (com `"publico": "7"`).
- Depois acrescente `7` em `SERIES_COM_CONTEUDO` no teste `apps/web/src/features/guia/__tests__/series-falas.test.ts`: ele passa a exigir essas falas.
- Gere os áudios: `npx tsx tools/nina-voz/inventario.ts`, ajuste `tools/nina-voz/blocos.json`, `npx tsx tools/nina-voz/gerar.ts` (monta os blocos), gere na ElevenLabs e corte (ver `tools/nina-voz/README.md`).

## Alunos do 7º
```
npx tsx tools/alunos/importar.ts CAMINHO\alunos.csv --local            # simulação no banco de desenvolvimento
FINANCITY_SSH="-p <porta-ssh> -i CAMINHO\chave usuario@host" npx tsx tools/alunos/importar.ts CAMINHO\alunos.csv --vps            # simulação na VPS
FINANCITY_SSH=... npx tsx tools/alunos/importar.ts CAMINHO\alunos.csv --vps --gravar                                       # grava e gera os cartões
```
- CSV (`nome,serie,turma`, UTF-8) **fora do repositório**; turma vazia vira "7 ano". A ferramenta recusa CSV dentro do repositório.
- Saída: `credenciais-7ano.html` na pasta do CSV (cartões para recortar). No terminal só aparecem contagens.
- Quem já existe é pulado. Depois de imprimir, **apague o HTML e o CSV**.

## Checklist de amanhã
1. Preencher os temas do 7º (`serie7.ts`).
2. Validar.
3. Criar e gerar as falas e áudios do 7º.
4. Backup → publicar os temas → importar os alunos.
5. Imprimir as credenciais e apagar os arquivos.
