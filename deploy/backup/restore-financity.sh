#!/usr/bin/env bash
# Restauração do Financity a partir de um dump (.dump).
#   Teste (seguro):    ./restore-financity.sh --test  /caminho/financity-AAAAMMDD.dump
#        -> restaura num banco TEMPORÁRIO, compara contagens com o banco atual e remove o temporário.
#   Restauração real:  ./restore-financity.sh --real  /caminho/financity-AAAAMMDD.dump  --i-know-this-replaces-data
#        -> PARA a API, guarda um dump de segurança do estado atual, recria o banco e restaura. Só use em emergência.
set -euo pipefail
MODE="${1:?use --test ou --real}"; FILE="${2:?informe o arquivo .dump}"; CONFIRM="${3:-}"
CONTAINER="${DB_CONTAINER:-financity-db-1}"; API="${API_CONTAINER:-financity-api}"
[ -f "$FILE" ] || { echo "arquivo não encontrado"; exit 2; }
if [ -f "$FILE.sha256" ]; then ( cd "$(dirname "$FILE")" && sha256sum -c "$(basename "$FILE").sha256" --quiet ) && echo "checksum conferido"; else echo "AVISO: sem .sha256 para conferir"; fi

counts() { docker exec "$CONTAINER" psql -U financity -d "$1" -Atc "select 'students='||(select count(*) from students)||' attempts='||(select count(*) from attempts)||' answers='||(select count(*) from answers)||' questions='||(select count(*) from questions)||' options='||(select count(*) from options)||' classes='||(select count(*) from classes)||' teachers='||(select count(*) from teachers)"; }

if [ "$MODE" = "--test" ]; then
  TMP="financity_restoretest_$$"
  docker exec "$CONTAINER" createdb -U financity "$TMP"
  trap 'docker exec "$CONTAINER" dropdb -U financity --if-exists "$TMP" >/dev/null 2>&1 || true' EXIT
  docker exec -i "$CONTAINER" pg_restore -U financity -d "$TMP" --no-owner --exit-on-error < "$FILE"
  A="$(counts financity)"; B="$(counts "$TMP")"
  echo "atual:      $A"; echo "restaurado: $B"
  if [ "$A" = "$B" ]; then echo "TESTE OK: restauração reproduz o banco atual"; else echo "ATENÇÃO: contagens diferem (esperado se houve uso depois do backup)"; fi
  exit 0
fi

[ "$MODE" = "--real" ] && [ "$CONFIRM" = "--i-know-this-replaces-data" ] || { echo "Para restaurar de verdade, passe --i-know-this-replaces-data"; exit 2; }
SAFE="$(dirname "$FILE")/antes-da-restauracao-$(date -u +%Y%m%d-%H%M%SZ).dump"
docker stop "$API" >/dev/null
docker exec "$CONTAINER" pg_dump -U financity -d financity -Fc --no-owner > "$SAFE"; chmod 600 "$SAFE"; echo "dump de segurança do estado atual: $SAFE"
docker exec "$CONTAINER" psql -U financity -d postgres -qc "DROP DATABASE financity WITH (FORCE)" -c "CREATE DATABASE financity ENCODING 'UTF8'"
docker exec -i "$CONTAINER" pg_restore -U financity -d financity --no-owner --exit-on-error < "$FILE"
echo "restaurado: $(counts financity)"
docker start "$API" >/dev/null && echo "API iniciada. Confira /healthz e faça um login de teste."
