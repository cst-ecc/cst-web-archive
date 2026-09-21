#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="${APP_DIR:-/home/eccops/apps/cst-website}"
DOCKER_DIR="${DOCKER_DIR:-${APP_DIR}/docker}"
BACKUP_DIR="${BACKUP_DIR:-/home/eccops/backups/cst}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

: "${RELEASE_SHA:?RELEASE_SHA manquant}"
: "${CST_BACKEND_IMAGE:?CST_BACKEND_IMAGE manquant}"

cd "${DOCKER_DIR}"

compose() {
  docker compose \
    --env-file .env.prod \
    -f docker-compose.prod.yml \
    "$@"
}

django() {
  compose run \
    --rm \
    --no-deps \
    -T \
    cst_backend \
    python manage.py "$@"
}

section() {
  echo
  echo "============================================================"
  echo "$1"
  echo "============================================================"
}

section "DJANGO RELEASE"
echo "Release SHA : ${RELEASE_SHA}"
echo "Image       : ${CST_BACKEND_IMAGE}"

docker image inspect "${CST_BACKEND_IMAGE}" >/dev/null

section "DJANGO CHECK"
django check

section "MIGRATION FILE CHECK"
# Empêche le déploiement de modèles modifiés sans fichier de migration.
django makemigrations --check --dry-run

section "DATABASE CONNECTIVITY"
django shell -c \
  "from django.db import connection; connection.ensure_connection(); print('DATABASE OK')"

section "MIGRATION PLAN"
django migrate --plan

section "PENDING MIGRATIONS"
if django migrate --check; then
  NEEDS_MIGRATION=false
  echo "✅ Aucune migration à appliquer"
else
  NEEDS_MIGRATION=true
  echo "ℹ️ Des migrations doivent être appliquées"
fi

if [ "${NEEDS_MIGRATION}" = "true" ]; then
  section "POSTGRESQL BACKUP"

  mkdir -p "${BACKUP_DIR}"
  chmod 700 "${BACKUP_DIR}"

  BACKUP_FILE="${BACKUP_DIR}/cst_$(date '+%Y%m%d_%H%M%S')_${RELEASE_SHA:0:12}.sql.gz"

  echo "Backup : ${BACKUP_FILE}"

  docker exec cst-db sh -c \
    'pg_dump \
      --clean \
      --if-exists \
      --no-owner \
      --no-privileges \
      -U "$POSTGRES_USER" \
      "$POSTGRES_DB"' \
    | gzip -9 \
    > "${BACKUP_FILE}"

  test -s "${BACKUP_FILE}"

  find "${BACKUP_DIR}" \
    -type f \
    -name 'cst_*.sql.gz' \
    -mtime "+${BACKUP_RETENTION_DAYS}" \
    -delete \
    || true

  echo "✅ Backup PostgreSQL terminé"

  section "APPLY MIGRATIONS"
  # Générique : Django applique tout le graphe de migrations en attente,
  # quelles que soient les applications et les numéros futurs.
  django migrate --noinput --verbosity 2
fi

section "FINAL MIGRATION CHECK"
# Invariant de release : aucune migration ne peut rester en attente.
django migrate --check

echo "✅ Aucune migration Django en attente"

section "COLLECTSTATIC"
django collectstatic --noinput

section "RELEASE COMPLETE"
echo "✅ Django release terminée pour ${RELEASE_SHA}"
