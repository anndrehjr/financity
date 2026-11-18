# Financity — histórico do que foi feito (2026-11-16)

Sem senhas, PINs, chaves nem dados de alunos neste arquivo.

## Arquitetura em produção
- **Site:** Vercel, https://financity-eta.vercel.app (Root Directory `apps/web`, Node 22.x, branch `main`). Variáveis `API_URL` e `GATEWAY_SECRET` **só em Production** → os deploys de *Preview* não conseguem logar (503).
- **API + PostgreSQL 16:** VPS, containers `financity-api-1` e `financity-db-1` (compose em `~/docker/financity`, segredos em `.env.production`, banco só na rede interna). API em https://<HOST-DA-API> (Nginx Proxy Manager + Let's Encrypt).
- O navegador só fala com o site; o site assina cada chamada (HMAC) para a API; a API recusa chamadas sem assinatura. Detalhes: `docs/ARQUITETURA.md`.
- **Backup:** cron diário 02:40 (`~/backups/financity`), script `deploy/backup/backup-financity.sh`, restauração `restore-financity.sh`. Ainda sem envio ao Google Drive.
- **Sistema antigo (SQLite):** `<pasta-do-projeto-sqlite>`, intacto (caminho de retorno). Backups em `financity-backups`.

## O que foi entregue (PRs no GitHub `anndrehjr/financity`)
| PR | Entrega |
|---|---|
| — | Migração SQLite → PostgreSQL, API Hono, gateway Next, Mapas 2–4, testes (106 e2e, 29 segurança) |
| #2 | **Nina Anime 2.0** (infraestrutura): tutorial guiado por eventos (Driver.js), personagem com imagem de referência (Phaser só carrega se houver arte em camadas), voz opcional |
| #3, #4 | **Voz**: serviço que toca MP3 estáticos; voz original (gravação ElevenLabs "sylphiette") cortada e ligada ao tutorial |
| #5 | Limpeza do código morto + catálogo único de falas (`apps/web/src/data/nina/falas.json`) |
| #6–#8 | Ferramentas de geração/corte de áudio (`tools/nina-voz`) e teste de cobertura |
| #9 | Checkpoint |
| #10 | As 27 falas restantes (`27.mp3` alinhado por Whisper) → **37 falas com voz** |
| #11 | Importador de alunos por CSV (somente código) |
| #12, #15 | **Estrutura por série (7º e 8º)** + **excluir alunos** — **PUBLICADOS em 2026-11-17** (backup `financity-20261117-024145Z.dump`; migração 004 aplicada; dados do 8º idênticos: 19 alunos, 4 tentativas, 19 respostas, 113 pontos, mesmo hash) |

### Culminância (8º ano) — no ar
4 temas × 8 desafios (960 pontos): Cidadania, Ética, Segurança Digital e Consumo/Matemática. Tipos escolha única, multisseleção e ordenação; dica sem penalidade; pontuação calculada no servidor (`apps/api/src/lib/grading.ts`). Conteúdo em `apps/api/src/content/culminancia.ts`. Os 4 mapas antigos foram **arquivados** (avaliações com `sort` 101–104, `status='archived'`), sem apagar tentativas ou respostas. Migração 003.

### Nina e voz — no ar
- Código: `apps/web/src/features/guia/` (motor de falas, tutorial, personagem, voz). Falas em `config/falas-nina.json`; catálogo em `src/data/nina/falas.json`; áudios em `public/guia/nina/audio/` (37 MP3, 1,6 MB, `manifest.json`).
- O site **nunca** chama a ElevenLabs nem usa voz do navegador; fala sem áudio = só legenda. Voz desligada por padrão; só toca após clique.
- Créditos "Voz gerada com ElevenLabs" ligados em `config/personagem.ts` (`creditos.mostrarElevenLabs`) até confirmar plano pago.
- Ferramentas (`tools/nina-voz`, ver README): `inventario.ts`, `gerar.ts` (blocos para colar na ElevenLabs), `alinhar.py` + `cortar-alinhado.py` (cortam um áudio longo por transcrição), `cortar-blocos.py`. Ambiente Python local `tools/nina-voz/.venv` (imageio-ffmpeg, faster-whisper; PyAV 19 exige o ajuste já aplicado nos scripts). Gravação original e intermediários ficam em `origem/` e `trabalho/` (fora do git).

### Importação de alunos
`apps/api/src/importar-cli.ts` (roda dentro do container, CSV pela entrada padrão, credenciais pela saída padrão) e `tools/alunos/importar.ts` (recusa CSV dentro do repositório; simulação por padrão; gera `credenciais-<série>ano.html` na pasta do CSV; só contagens no terminal). A lista do 7º ano está em `<pasta-fora-do-repositório>\7ano.csv` (**fora do git**).

## PR #12 — estrutura por série (PUBLICADO)
- Migração aditiva `004_series.sql`: `students.serie` e `maps.serie` (padrão 8) + gatilho que acompanha a série da turma. Nada apagado/alterado; login, senhas e progresso do 8º não são tocados.
- O aluno só vê tema **publicado e com desafios** (rascunho/arquivado/vazio não aparece e não trava o desbloqueio). Tela "Seus temas chegam em breve!".
- Professor: filtro por série; visão padrão continua no 8º ano.
- Nina por série: campo `publico` (geral/7/8); `s7.<momento>` tem prioridade; falas de tema do 8º nunca vão para o 7º.
- Molde do 7º (`apps/api/src/content/serie7.ts`, 4 temas em rascunho), validação e carga tudo-ou-nada (`serie-cli.ts`); guia `docs/CONTEUDO-7-ANO.md`.
- Testes: API 52, web 44, importador 7. Cenário "8º ano em uso antes da migração" testado com dados fictícios.
- **Publicado:** banco da VPS na migração 004. Excluir aluno: botão "Excluir" no painel (confirmação digitando EXCLUIR; apaga cadastro, tentativas, respostas, sessões e histórico; só alunos do professor).
- **Incidente corrigido:** o backup automático (cron 02:40) falhava por falta de permissão de execução após o `git archive`; corrigido com `chmod +x` e documentado em `PUBLICACAO-E-REVERSAO.md`.

## 2026-11-18 — 7º ano e Nina 3D publicados
- **7º ano:** 12 aulas do 4º bimestre (PPTX SEDUC-SP) viraram 4 temas por assunto (Renda e Trabalho; Controle do Dinheiro; Compras e Porcentagem; Metas e Gráficos Financeiros), 32 desafios no mesmo modelo do 8º (30 pts cada). Aprovados pelo professor. Publicados com `serie-cli publicar` após backup; 14 alunos importados.
- **Nina:** arte 3D (recorte da vista frontal da ficha 360°), animações só em CSS, tamanhos/posição/imagem em `config/personagem.ts`; a Nina não sobe nem desce com o tamanho da mensagem (balão cresce para cima no celular); só troca de lado quando cobriria o elemento destacado. 5 falas do 7º (aberturas de tema + "temas chegam em breve") cortadas pelo texto falado (`alinhar.py`/`cortar-alinhado.py`), porque o áudio saiu sem pausas.
- **Aprendizados:** o gerador separa falas com ` <break time="1.5s" />` (linha em branco não vira pausa); `git archive` perde o `+x` dos scripts de backup (rodar `chmod +x` depois); PIN repetido é recusado na criação de alunos (proteção); ao editar arquivos CRLF com Python usar `newline=''`.

## Decisões e regras combinadas
- Publicar **direto em produção** (merge na `main`) é permitido, porque o site ainda não está aberto ao público. **Exceção:** a estrutura por série só publica com o "pode publicar" e **depois do backup** (entrega de senhas do 8º ano na manhã seguinte).
- Dados de menores: nunca no repositório, em log, commit ou terminal; senhas só no arquivo local de credenciais.
- Migrações só aditivas; backup antes de qualquer migração.
- Voz: só gravações próprias/licenciadas; nenhuma chamada externa de voz em produção.

## Pendências
**Do André:** (1) autorizar e fazer o backup para publicar o PR #12; (2) **trocar a senha do professor** e apagar `credenciais-professor.txt` (apareceu no chat); (3) informar se o plano da ElevenLabs é pago; (4) revisar o conteúdo da Culminância e testar com aluno (PC e celular); (5) conteúdo dos 4 temas do 7º; (6) conferir de ouvido a fala `mapa_3.1` ("de pressa"); (7) decidir sobre o personagem Alex (textos fixos na atividade) e textos com número fixo ("4 temas / 8 desafios"); (8) aprovar o SQL `tutorial_progress` (progresso do tutorial por aluno no servidor; hoje é cache local do navegador); (9) arte da Nina em camadas (`docs/nina/ASSETS-NECESSARIOS.md`).
**Técnicas:** envio dos backups ao Google Drive; e-mail de contato na conta Let's Encrypt; ilustrações próprias dos cenários; relatório por Bloom, segunda tentativa e rubrica de explicação (itens do banco da Culminância não implementados); lint não configurado no `apps/web`; falas do 7º (`s7.mapa_N`) e áudio de `sem_temas.1`.
