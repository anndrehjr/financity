#!/usr/bin/env bash
# Recria um banco de teste ISOLADO (nome passado como 1º argumento) e prepara professor de teste. Nunca use com o banco real.
set -euo pipefail
NAME="${1:-fc_e2e}"
case "$NAME" in fc_*) ;; *) echo "Nome precisa começar com fc_ (proteção)"; exit 2;; esac
ADMIN="${PG_ADMIN_URL:-postgres://financity_dev:dev-local-only@127.0.0.1:54329/postgres}"
node -e "
const {Client}=require('pg');(async()=>{const c=new Client('$ADMIN');await c.connect();
await c.query('DROP DATABASE IF EXISTS $NAME WITH (FORCE)');await c.query('CREATE DATABASE $NAME');await c.end()})()"
export DATABASE_URL="${ADMIN%/postgres}/$NAME"
npx tsx src/migrate-cli.ts --seed
npx tsx scripts/create-teacher.ts prof.teste "Professor Teste" "$(pwd)/.e2e/credenciais-professor.txt"
