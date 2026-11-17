# Financity — ponto de retomada (2026-11-16, versão PostgreSQL)

Sem senhas, PINs ou chaves neste arquivo.

## Onde está cada coisa
- **Sistema atual (SQLite) — INTACTO**: `D:\Projetos Serios\Jogos Novos\financity` (branch `main`, tag `v0-sqlite-estavel`). É o caminho de retorno.
- **Versão nova (PostgreSQL + API na VPS + web na Vercel)**: `D:\Projetos Serios\Jogos Novos\financity-pg` (branch `feat/postgres-api`, commits locais; **nada enviado ao GitHub**).
- **Backups verificados**: `D:\Projetos Serios\Jogos Novos\financity-backups\<data-hora>\` (SQLite + código + cópia bruta; contém dados de alunos e `secret.key`).
- Documentos: `docs/ARQUITETURA.md`, `docs/OPERACAO.md`, `docs/MIGRACAO-E-ROLLBACK.md`, `docs/relatorios/*.json`.

## Concluído e verificado
- Backup do SQLite (integrity ok, restauração testada) e do código (extração idêntica).
- API Hono + PostgreSQL 16; migrações 001 (base) e 002 (séries, matérias, avaliações por série, vínculo professor↔turma).
- Gateway Next (Vercel) → API fechada por assinatura HMAC; autorização por professor/turma/série.
- Script de migração com verificação linha a linha: ensaio local e ensaio **na VPS** (pilha isolada, já removida) sem divergências.
- Testes: e2e 87/87 (pela cadeia completa) e 29/29 de segurança. Backup/restauração testados na VPS.
- VPS: ensaio descartável criado e **totalmente removido**; os 22 containers originais não foram afetados.

## Banco na VPS — FEITO em 2026-11-16 (autorizado pelo André)
- Pilha definitiva em `~/docker/financity` (compose: `financity-db-1` PostgreSQL 16 + `financity-api-1`), segredos em `.env.production` (600, gerados na VPS). Banco só na rede interna; API na rede `docker_proxy`; **nenhuma porta publicada**, sem host no NPM e sem DNS (domínio ainda não definido) → nada acessível pela internet.
- Dados migrados do backup final (`financity-backups\final-20261116-123518`), verificação sem divergências (`docs/relatorios/migracao-definitiva-vps-pg16.json`); login real do professor + painel validados (14/14).
- Backup diário às 02:40 (cron do usuário `sombra`, local em `~/backups/financity`, sem envio ao Drive ainda) e restauração testada.
- O sistema SQLite local continua sendo o que os alunos usam até a troca final.

## Não feito (aguarda você)
- Domínio/DNS/certificados/host no NPM, projeto na Vercel (precisa de `API_URL` e do `GATEWAY_SECRET` que está na VPS em `~/docker/financity/.env.production`), push para o GitHub (`gh` não está logado), envio dos backups ao Drive (`RCLONE_REMOTE`).

## Pendências (ação do André)
1. Informar o domínio comprado (não foi inventado nenhum).
2. Decidir plano da Vercel (Hobby = uso pessoal/não comercial; Pro ≈ US$ 20/mês) e se o código vai para o GitHub (`anndrehjr`).
3. Trocar a senha do professor e apagar `data/credenciais-professor.txt` (a senha desse arquivo ainda confere com o banco).
4. Aprovar a reconstrução das 5 questões (trilha separada; nada foi alterado).
5. Conteúdo/avaliações do 7º ano; seletor de série/avaliação na interface (a API já suporta).

## Como retomar
`cd "D:\Projetos Serios\Jogos Novos\financity-pg"` e peça: "leia CHECKPOINT.md e docs/MIGRACAO-E-ROLLBACK.md e continue". Para testar: `npm run pg:dev` (PostgreSQL local), depois ver docs/OPERACAO.md.

## Atualização 2026-11-16 (tarde): Mapas 2–4 ATIVOS
- 15 questões novas (BNCC + Bloom) em `apps/api/src/content/mapa{2,3,4}.ts`; `npm`/`node dist/ativar-cli.js` cria o que falta e libera as avaliações do 8º ano (idempotente; não sobrescreve pontuações).
- Jogo por ID (`/jogo/[id]`; `/jogo/mapa-1` redireciona), medalhas por mapa, painel com seletor de mapa e médias por mapa, cenas provisórias (ícones) até haver ilustrações próprias.
- **VPS atualizada** (backup antes/depois, restauração testada): 20 questões, 100 alternativas; alunos (19), tentativa (1) e respostas (5) inalterados. Ainda sem acesso público (sem domínio/NPM/DNS).
- Testes: e2e 106/106 e 29/29 de segurança; produção validada com login real (8/8 e 14/14).
- Word com todas as questões: `docs/conteudo/Financity-Questoes-Mapas-1-a-4.docx`.
- Pendente: GitHub (`gh auth login` necessário), domínio, Vercel, ilustrações dos 14 cenários novos, revisão pedagógica do conteúdo, decisão sobre o Mapa 1 (auditoria recomendou reconstruir).
- Commits passam a ser assinados com a conta do GitHub (e-mail noreply), exigido pela Vercel (plano gratuito) para liberar o deploy.


## Atualização 2026-11-16 (noite): produção, Culminância, Nina e voz
- **Produção:** https://financity-eta.vercel.app (Vercel, branch main). API/PostgreSQL na VPS (https://api.144-217-161-241.sslip.io). Publicação: merge na main.
- **Culminância (8º ano):** 4 temas × 8 questões (960 pts), tipos escolha/multisseleção/ordenação, dica sem penalidade. Mapas antigos arquivados (sem apagar). Conteúdo: apps/api/src/content/culminancia.ts.
- **Nina Anime 2.0:** tutorial guiado por eventos (Driver.js), personagem com imagem de referência (arte em camadas pendente; Phaser só carrega quando houver arte), catálogo de falas em apps/web/src/data/nina/falas.json (37 falas), inventário em tools/nina-voz/INVENTARIO.md.
- **Voz:** 10 falas com a gravação original (ElevenLabs "sylphiette") no ar. O site só toca MP3 estáticos; sem API, sem voz substituta (sem áudio = só legenda). Créditos ElevenLabs ligados em config/personagem.ts até confirmar plano pago.
- **PRÓXIMO PASSO (amanhã):** gerar os 3 blocos na ElevenLabs (tools/nina-voz/blocos/nina-bloco-1..3.txt, config: multilingual v2, vel. 0,96, estab. 57, simil. 75, estilo 0), salvar em tools/nina-voz/origem/geradas/ como nina-bloco-N.mp3 e rodar `tools/nina-voz/.venv/Scripts/python tools/nina-voz/cortar-blocos.py --conferir`; ouvir, aprovar e publicar. (.venv: python -m venv + pip install imageio-ffmpeg faster-whisper.)
- **Pendências do André:** trocar a senha do professor e apagar credenciais-professor.txt; informar se o plano da ElevenLabs é pago; revisar o conteúdo da Culminância e testar com aluno (PC e celular); decidir sobre o Alex (personagem antigo) e textos com número fixo ("4 temas / 8 desafios"); aprovar SQL tutorial_progress (progresso por aluno no servidor); arte da Nina em camadas (docs/nina/ASSETS-NECESSARIOS.md).


## Atualização 2026-11-17 (madrugada): ESTADO ATUAL — leia primeiro
- **No ar (financity-eta.vercel.app + VPS):** Culminância 8º ano, Nina com tutorial guiado e **37 falas com voz**, importador (somente código).
- **NÃO publicado: PR #12** (estrutura por série 7º/8º; migração 004). Banco da VPS na migração 003. **Para publicar:** o André roda o backup (`~/docker/financity/src/deploy/backup/backup-financity.sh`) e diz "pode publicar" → ver `docs/PUBLICACAO-E-REVERSAO.md`. Recomendado fazer ANTES da entrega das senhas do 8º (que ficam iguais).
- **Documentos:** `docs/HISTORICO.md` (tudo que foi feito, PRs, decisões, pendências), `docs/PUBLICACAO-E-REVERSAO.md` (como publicar e reverter), `docs/CONTEUDO-7-ANO.md` (preencher/validar/publicar o 7º), `tools/nina-voz/README.md` (voz), `docs/nina/ASSETS-NECESSARIOS.md` (arte).
- **Lista do 7º ano:** `D:\Projetos Serios\Jogos Novos\dados-alunos\7ano.csv` (fora do git; 14 alunos). Importar só com autorização, simulação primeiro.
- **Próximos passos (tarde):** preencher temas do 7º → validar → falas/áudios do 7º → backup → publicar → importar → imprimir credenciais → apagar CSV/HTML.

## Atualização 2026-11-17 (madrugada, depois): PR #12 e #15 PUBLICADOS
- Backup feito e verificado antes (`financity-20261117-024145Z.dump`). Migração 004 aplicada na VPS; dados do 8º idênticos (contagens e hash conferidos). Site e API no ar; login falso 401; `/jogo` e `/admin` sem login redirecionam; excluir sem login 401.
- Novo: série 7º/8º (aluno só vê temas da sua série; "Seus temas chegam em breve!" para série sem temas), filtro de série no painel, Nina por série, molde do 7º, importador, **botão Excluir aluno** no painel.
- Incidente: backup automático falhava (permissão de execução perdida no deploy). Corrigido; após cada deploy rodar `chmod +x deploy/backup/*.sh`.
- Próximo: conteúdo do 7º (docs/CONTEUDO-7-ANO.md), importar os 14 alunos (simulação primeiro, com autorização), testar o painel (Excluir) com aluno de teste.
