# Operação — desenvolvimento, testes e produção

## Desenvolvimento local (sem Docker)
```
npm install                       # na raiz (workspaces)
npm run pg:dev                    # PostgreSQL 16 real em 127.0.0.1:54329 (dados em apps/api/.pgdev). Parar com pg_ctl stop -D apps/api/.pgdev
cd apps/api && ./scripts/reset-test-db.sh fc_e2e      # banco de teste isolado + professor de teste (nome precisa começar com fc_)
npm run dev:api                   # API (porta 8787). Em dev, REQUIRE_SIGNATURE=0 dispensa a assinatura
npm run dev:web                   # web (porta 3000); defina API_URL e GATEWAY_SECRET (ver apps/web/.env.example)
```
**Nunca** aponte testes para o banco real. Scripts de teste recusam nomes de banco fora do padrão `fc_*`.

## Testes
- `npm run test:api` — 29 testes de segurança/autorização/concorrência (PostgreSQL real; banco `fc_unit`).
- `BASE=http://127.0.0.1:3200 TEACHER_FILE=apps/api/.e2e/credenciais-professor.txt node scripts/e2e.mjs` — 87 verificações pela cadeia completa (web → API assinada → PostgreSQL).
- `apps/api/scripts/staging-check.ts` — validação funcional de uma API já no ar (somente leitura + login).

## Variáveis de ambiente
| Onde | Variável | Observação |
|---|---|---|
| VPS (API) | `DATABASE_URL`, `FINANCITY_SECRET` (32+), `GATEWAY_SECRET` (32+), `ALLOWED_ORIGINS`, `PORT` | arquivo `.env.production` com permissão 600; nunca no git |
| Vercel (web) | `API_URL`, `GATEWAY_SECRET` | só variáveis de servidor; **sem** `NEXT_PUBLIC_` |
`FINANCITY_SECRET` deve ser idêntico ao `data/secret.key` do sistema SQLite; trocá-lo depois quebra a checagem de "PIN único".

## Implantação (resumo; detalhes em MIGRACAO-E-ROLLBACK.md)
- API: `cd deploy && docker compose --env-file ../.env.production up -d --build` (aplica migrações pendentes ao iniciar, com trava).
- Ensaio descartável: adicionar `-p financity-staging -f docker-compose.yml -f docker-compose.staging.yml` (portas só em 127.0.0.1; acesso por túnel SSH) e `down -v` ao terminar.
- A rede do proxy é `docker_proxy` (a mesma do sistema da escola); a API tem alias único `financity-api` para evitar colisão de DNS.

## Backup e restauração
- Diário: `deploy/backup/backup-financity.sh` (pg_dump formato custom → verificação por `pg_restore --list` → `sha256` → retenção 30 dias → `rclone` opcional via `RCLONE_REMOTE`).
- Teste (seguro): `restore-financity.sh --test <dump>` restaura em banco temporário e compara contagens.
- Real (emergência): `restore-financity.sh --real <dump> --i-know-this-replaces-data`.
- Faça o teste de restauração periodicamente (ex.: mensal) e após cada migração de esquema.

## Logs e privacidade (LGPD)
A API registra só `método caminho status tempo`. Não coloque nomes, PINs ou IDs de alunos em URLs/query strings (logs da Vercel e do Nginx guardam URLs). Defina retenção para `admin_log` e para os dumps.

## Domínio (quando for comprado)
`jogos.<domínio>` → Vercel (CNAME); `api.<domínio>` → VPS (A) + host no NPM com Let's Encrypt. Ajustar `ALLOWED_ORIGINS` e `API_URL`.
