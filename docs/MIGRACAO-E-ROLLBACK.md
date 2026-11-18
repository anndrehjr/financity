# Migração SQLite → PostgreSQL: procedimento, validação e reversão

## 1. Estado do sistema atual (preservado)
- Pasta original: `<pasta-do-projeto-sqlite>` — **não foi alterada** (branch `main`, tag `v0-sqlite-estavel`).
- Banco original `data/financity.db` (+ `-wal`/`-shm`): **intacto**. A migração lê somente uma cópia verificada.
- Versão nova: `<pasta-do-projeto>` (git worktree da branch `feat/postgres-api`).
- Backups desta sessão (em `<pasta-de-backups>\<data-hora>\`): `financity.db` (API de backup do SQLite), `codigo-financity.tar.gz`, `data-bruto/` (cópia exata dos arquivos, incluindo WAL, `secret.key`), `SHA256SUMS.txt`, `verificacao-sqlite.json`.
  - Verificação do backup: `integrity_check = ok`, 0 violações de chave estrangeira, restauração em arquivo separado com contagens idênticas; código extraído idêntico ao original.
  - ⚠ Os backups contêm dados de alunos e o `secret.key`: mantenha-os fora de nuvem pública e de repositórios.

## 2. O que foi validado (ensaios)
| Ensaio | Resultado |
|---|---|
| Migração da cópia real → PostgreSQL 16.15 local | 10 tabelas idênticas linha a linha (hash de todas as colunas), IDs preservados, painel = SQLite, 0 órfãos |
| Migração da cópia real → PostgreSQL 16.16 na VPS (pilha isolada, depois removida) | mesmos hashes e resultado idêntico |
| API na VPS (imagem 343 MB; API ≈ 27 MiB, banco ≈ 58 MiB de RAM) | login real do professor sobre dados migrados e 14 verificações funcionais OK |
| e2e original (77) + 10 novas (séries), pela cadeia web → API assinada → PostgreSQL | **87/87** |
| Testes de segurança (assinatura, isolamento entre professores, concorrência, entrada inválida) | **29/29** |
| Backup + verificação + restauração em banco temporário (VPS) | contagens idênticas |
| Impacto nos outros 22 containers da VPS | nenhum (todos ativos antes e depois) |
Relatórios (só contagens/hashes): `docs/relatorios/`.

Diferenças de comportamento (intencionais): aluno de série sem avaliação não vê atividades; turma nova precisa indicar a série; datas voltam em ISO 8601; alunos ordenam pela collation do banco.

## 3. Troca definitiva (NÃO executada — aguarda sua aprovação)
Pré-requisitos: domínio comprado e informado; decisão sobre o diretório na VPS (`~/docker` é do root: criar `~/docker/financity` exige `sudo mkdir && chown`); conta Vercel (plano Hobby é de uso pessoal/não comercial; Pro ≈ US$ 20/mês).

1. **Congelar**: avisar a turma; parar o servidor atual (Ctrl+C) para ninguém gravar durante a cópia.
2. **Backup final** (da pasta original): `node scripts/backup-sqlite.mjs "<pasta do projeto>" "<destino>"` → confira `verificacao-sqlite.json` (`integrity_check: ok`, contagens iguais).
3. **VPS**: criar `~/docker/financity`, copiar o código (`git archive`), criar `.env.production` (600) com: `POSTGRES_PASSWORD` (gerado **na VPS**, `openssl rand`), `FINANCITY_SECRET` = conteúdo de `data/secret.key` (**mesmo valor**), `GATEWAY_SECRET` novo, `ALLOWED_ORIGINS=https://jogos.<domínio>`, `PROXY_NETWORK=docker_proxy`.
   - ⚠ Gere segredos em Linux; no Windows o `openssl` acrescenta `\r` (já tratado com `.trim()`, mas evite).
4. `docker compose up -d db` → importar com túnel SSH: `DATABASE_URL=... npx tsx apps/api/scripts/sqlite-to-pg.ts <copia.db> --report relatorio.json` (exige destino vazio; deve terminar em "migração conferida, sem divergências").
5. `docker compose up -d --build api` → `/healthz`; `apps/api/scripts/staging-check.ts` (login do professor + painel).
6. **NPM**: criar host `api.<domínio>` → `http://financity-api:8787`, Let's Encrypt. **DNS**: `api` (A → IP da VPS) e `jogos` (CNAME → Vercel). TTL baixo antes.
7. **Vercel**: projeto com *Root Directory* `apps/web`; variáveis `API_URL=https://api.<domínio>` e `GATEWAY_SECRET` (mesmo da VPS); domínio `jogos.<domínio>`.
8. **Teste real**: login de professor e de aluno de teste; painel; um jogo completo em conta de teste; `/api/*` direto na API sem assinatura → 401.
9. Cron do backup diário (`deploy/backup/backup-financity.sh`) + **teste de restauração** (`restore-financity.sh --test`) antes de liberar para os alunos.
10. Trocar a senha do professor (Configurações) e apagar `data/credenciais-professor.txt`.

## 4. Reversão (rollback)
- **Antes do passo 6/7 (nada público)**: basta não prosseguir; o sistema atual nunca foi desligado de fato. Remover a pilha: `docker compose down -v` e apagar o diretório.
- **Depois da troca**: (a) subir de novo o sistema original: na pasta `financity` rodar `npm start` (o banco `data/financity.db` está como estava no congelamento); (b) apontar os alunos para o endereço antigo/local; (c) se já houve gravações novas no PostgreSQL que precisam voltar ao SQLite, **não há migração reversa automática** — exporte com o CSV do painel e/ou `pg_dump` e trate caso a caso. Por isso: manter o SQLite original até a nova versão rodar estável por um período definido e **não apagar os backups**.
- **Restauração do PostgreSQL**: `restore-financity.sh --real <dump> --i-know-this-replaces-data` (para a API, guarda dump de segurança, restaura, reinicia).
- Código: `git checkout v0-sqlite-estavel` volta ao app único com SQLite.

## 5. Pendências que dependem de você
Domínio; plano da Vercel; decisão sobre `~/docker/financity` (sudo); senha do professor/`credenciais-professor.txt`; aprovação das 5 questões reconstruídas (trilha separada); conteúdo do 7º ano.
