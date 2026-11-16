#!/usr/bin/env bash
# Backup diário do PostgreSQL do Financity: dump consistente (formato custom), verificação, checksum, retenção e envio opcional.
# Uso (cron na VPS, ex.: 02:40):  /home/USUARIO/docker/financity/deploy/backup/backup-financity.sh
# Não imprime dados de alunos. Falha com código != 0 em qualquer problema (use o código para alertar).
set -euo pipefail

DEST="${BACKUP_DIR:-$HOME/backups/financity}"
KEEP_DAYS="${KEEP_DAYS:-30}"
CONTAINER="${DB_CONTAINER:-financity-db-1}"
RCLONE_REMOTE="${RCLONE_REMOTE:-}"          # ex.: gdrive:backups/financity  (vazio = não envia)
STAMP="$(date -u +%Y%m%d-%H%M%SZ)"
mkdir -p "$DEST"; chmod 700 "$DEST"
OUT="$DEST/financity-$STAMP.dump"

# 1) dump consistente (snapshot transacional; não bloqueia o jogo)
docker exec "$CONTAINER" pg_dump -U financity -d financity -Fc --no-owner > "$OUT.partial"

# 2) verificação: o arquivo precisa ser legível pelo pg_restore e conter as tabelas esperadas
docker exec -i "$CONTAINER" pg_restore --list < "$OUT.partial" > "$OUT.toc"
for t in students attempts answers questions options schema_migrations; do
  grep -q " TABLE DATA public $t " "$OUT.toc" || { echo "ERRO: tabela $t ausente no dump"; rm -f "$OUT.partial" "$OUT.toc"; exit 1; }
done
rm -f "$OUT.toc"
mv "$OUT.partial" "$OUT"
( cd "$DEST" && sha256sum "$(basename "$OUT")" > "$(basename "$OUT").sha256" )
chmod 600 "$OUT" "$OUT.sha256"

# 3) envio externo (opcional) com conferência de tamanho
if [ -n "$RCLONE_REMOTE" ]; then
  rclone copy "$OUT" "$RCLONE_REMOTE" --quiet
  rclone copy "$OUT.sha256" "$RCLONE_REMOTE" --quiet
  rclone check "$DEST" "$RCLONE_REMOTE" --one-way --include "$(basename "$OUT")" --quiet
fi

# 4) retenção local
find "$DEST" -name 'financity-*.dump*' -mtime +"$KEEP_DAYS" -delete

echo "backup ok: $(basename "$OUT") ($(du -h "$OUT" | cut -f1)) sha256=$(cut -c1-12 "$OUT.sha256")"
