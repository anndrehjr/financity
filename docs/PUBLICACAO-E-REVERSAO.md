# Publicação e reversão (passo a passo)

Sem senhas ou chaves. Acesso à VPS: `ssh -p 2222 -i <chave> sombra@144.217.161.241` (não mexer nos outros containers da VPS: só `financity-*`).

## 1. Só o site (Vercel)
Merge na `main` → a Vercel publica sozinha (~2–3 min). Conferir de fora: home 200, `POST /api/auth/login` com usuário falso → 401, `/jogo` sem login → 307, e os arquivos novos (ex.: `/guia/nina/audio/manifest.json`).
Reverter: `git revert <commit do merge>` e push (ou "Promote" de um deploy anterior no painel da Vercel).

## 2. API / banco (VPS) — com migração
1. **Backup** (na VPS): `~/docker/financity/src/deploy/backup/backup-financity.sh` — conferir o arquivo novo em `~/backups/financity` (e o `.sha256`).
2. Enviar o código (da pasta do repositório, na branch `main` atualizada):
   `git archive HEAD | ssh -p 2222 -i <chave> sombra@144.217.161.241 'tar -x -C ~/docker/financity/src'` (avisos de "time stamp in the future" são só relógio).
   **Depois do envio, rode sempre** `chmod +x ~/docker/financity/src/deploy/backup/*.sh`: o `git archive` pode perder a permissão de execução e o **backup automático das 02:40 falha** ("Permission denied"). Isso aconteceu em 2026-11-17 e foi corrigido; confira `tail ~/backups/financity/backup.log` depois de cada deploy.
3. Reconstruir **só** a API: `cd ~/docker/financity/src && docker compose -p financity --env-file ../.env.production -f deploy/docker-compose.yml up -d --build api`. As migrações pendentes rodam sozinhas ao iniciar (`migrate-cli`, com trava, uma única vez). A API reinicia por alguns segundos.
4. Conferir: `docker ps` (healthy), `curl https://api.144-217-161-241.sslip.io/healthz` → `{"ok":true}`, `select version from schema_migrations` (última migração), e **contagens** (alunos, tentativas, respostas) iguais às de antes. Não imprimir dados de alunos.
5. Conteúdo novo (quando houver): `docker exec financity-api-1 node dist/culminancia-cli.js` (8º) ou `node dist/serie-cli.js validar|publicar` (7º). **Não** use `ativar-cli.js` (é do conteúdo antigo).

### Reverter a API/banco
- Código: voltar ao commit anterior e repetir os passos 2–3.
- Banco (se necessário): `~/docker/financity/src/deploy/backup/restore-financity.sh --test <dump>` testa a restauração em banco descartável; `--real` restaura de verdade (para a API antes). As migrações são aditivas: colunas novas não atrapalham o código antigo.

## 3. Importar alunos
Ver `docs/CONTEUDO-7-ANO.md` (seção "Alunos do 7º"). CSV fora do repositório; simulação primeiro; só com autorização; depois apagar o HTML de credenciais e o CSV.

## 4. Verificação mínima depois de publicar
- Um aluno do 8º entra com o usuário/senha atuais e vê os mesmos 4 temas, com o mesmo progresso.
- Professor entra e vê as turmas; filtro de série funciona.
- Nina: ligar a voz e passar o tutorial.
