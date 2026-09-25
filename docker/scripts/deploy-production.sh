#!/usr/bin/env bash

set -Eeuo pipefail

: "${RELEASE_SHA:?RELEASE_SHA manquant}"
RELEASE_BRANCH="${RELEASE_BRANCH:-feature-v2}"
FORCE_FULL="${FORCE_FULL:-false}"

APP_DIR="${APP_DIR:-/home/eccops/apps/cst-website}"
DOCKER_DIR="${DOCKER_DIR:-${APP_DIR}/docker}"
STATE_DIR="${STATE_DIR:-/home/eccops/deploy-state/cst}"
STATE_FILE="${STATE_FILE:-${STATE_DIR}/last-successful-sha}"
ENV_STATE_FILE="${ENV_STATE_FILE:-${STATE_DIR}/last-successful-env-sha256}"
PUBLIC_URL="${PUBLIC_URL:-https://cst.ecc.bj}"

mkdir -p "${STATE_DIR}"
chmod 700 "${STATE_DIR}"

if ! command -v flock >/dev/null 2>&1; then
  echo "❌ flock est requis sur le VPS pour sécuriser les déploiements concurrents."
  exit 1
fi

# Protection VPS en plus de concurrency côté GitHub Actions.
exec 9>"${STATE_DIR}/deploy.lock"
if ! flock -n 9; then
  echo "❌ Un autre déploiement CST est déjà en cours sur le VPS."
  exit 1
fi

section() {
  echo
  echo "============================================================"
  echo "$1"
  echo "============================================================"
}

compose() {
  docker compose \
    --env-file .env.prod \
    -f docker-compose.prod.yml \
    "$@"
}

container_image_name() {
  local container="$1"
  local fallback="$2"

  docker inspect \
    --format='{{.Config.Image}}' \
    "${container}" \
    2>/dev/null \
    || printf '%s\n' "${fallback}"
}

wait_health() {
  local container="$1"
  local timeout="$2"
  local elapsed=0
  local status=""

  while [ "${elapsed}" -lt "${timeout}" ]; do
    status="$(
      docker inspect \
        --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
        "${container}" \
        2>/dev/null || true
    )"

    if [ "${status}" = "healthy" ]; then
      echo "✅ ${container}: healthy"
      return 0
    fi

    if [ "${status}" = "exited" ] || [ "${status}" = "dead" ] || [ "${status}" = "unhealthy" ]; then
      echo "❌ ${container}: ${status}"
      docker logs --tail=150 "${container}" 2>/dev/null || true
      return 1
    fi

    sleep 3
    elapsed=$((elapsed + 3))
  done

  echo "❌ ${container}: délai dépassé (${status:-inconnu})"
  docker logs --tail=150 "${container}" 2>/dev/null || true
  return 1
}

wait_running() {
  local container="$1"
  local timeout="$2"
  local elapsed=0
  local status=""

  while [ "${elapsed}" -lt "${timeout}" ]; do
    status="$(docker inspect --format='{{.State.Status}}' "${container}" 2>/dev/null || true)"

    if [ "${status}" = "running" ]; then
      echo "✅ ${container}: running"
      return 0
    fi

    if [ "${status}" = "exited" ] || [ "${status}" = "dead" ]; then
      echo "❌ ${container}: ${status}"
      docker logs --tail=150 "${container}" 2>/dev/null || true
      return 1
    fi

    sleep 2
    elapsed=$((elapsed + 2))
  done

  echo "❌ ${container}: délai dépassé (${status:-inconnu})"
  return 1
}

assert_running() {
  local container="$1"
  local status
  local has_health

  status="$(docker inspect --format='{{.State.Status}}' "${container}" 2>/dev/null || true)"

  if [ "${status}" != "running" ]; then
    echo "❌ ${container}: ${status:-absent}"
    docker logs --tail=100 "${container}" 2>/dev/null || true
    return 1
  fi

  has_health="$(docker inspect --format='{{if .State.Health}}yes{{else}}no{{end}}' "${container}" 2>/dev/null || true)"

  if [ "${has_health}" = "yes" ]; then
    local health
    health="$(docker inspect --format='{{.State.Health.Status}}' "${container}")"
    if [ "${health}" != "healthy" ]; then
      echo "❌ ${container}: ${health}"
      return 1
    fi
    echo "✅ ${container}: healthy"
  else
    echo "✅ ${container}: running"
  fi
}

verify_container_image() {
  local container="$1"
  local expected_image="$2"
  local expected_id
  local running_id

  expected_id="$(docker image inspect "${expected_image}" --format='{{.Id}}')"
  running_id="$(docker inspect "${container}" --format='{{.Image}}')"

  if [ "${running_id}" != "${expected_id}" ]; then
    echo "❌ ${container} n'utilise pas l'image attendue"
    echo "Image attendue : ${expected_image} (${expected_id})"
    echo "Image utilisée  : ${running_id}"
    return 1
  fi

  echo "✅ ${container}: ${expected_image}"
}

public_check() {
  local name="$1"
  local url="$2"
  local attempts="${3:-6}"
  local body_file
  local header_file
  local error_file
  local status="000"
  local success=false

  body_file="$(mktemp)"
  header_file="$(mktemp)"
  error_file="$(mktemp)"

  for i in $(seq 1 "${attempts}"); do
    : > "${body_file}"
    : > "${header_file}"
    : > "${error_file}"

    status="$(
      curl \
        --silent \
        --show-error \
        --location \
        --connect-timeout 10 \
        --max-time 30 \
        --dump-header "${header_file}" \
        --output "${body_file}" \
        --write-out '%{http_code}' \
        "${url}" \
        2>"${error_file}" \
        || true
    )"

    echo "${name} (${i}/${attempts}) : HTTP ${status:-000}"

    case "${status}" in
      2??)
        success=true
        break
        ;;
    esac

    sleep 3
  done

  if [ "${success}" != "true" ]; then
    echo "❌ ${name}"
    echo "URL  : ${url}"
    echo "HTTP : ${status:-000}"
    echo
    echo "===== CURL ERROR ====="
    cat "${error_file}" || true
    echo
    echo "===== RESPONSE HEADERS ====="
    cat "${header_file}" || true
    echo
    echo "===== RESPONSE BODY ====="
    head -c 3000 "${body_file}" || true
    echo

    rm -f "${body_file}" "${header_file}" "${error_file}"
    return 1
  fi

  rm -f "${body_file}" "${header_file}" "${error_file}"
  echo "✅ ${name}"
}


gateway_route_check() {
  local name="$1"
  local path="$2"
  local attempts="${3:-12}"
  local delay="${4:-2}"

  for i in $(seq 1 "${attempts}"); do
    if docker exec cst-gateway \
      wget \
      --timeout=8 \
      --tries=1 \
      --header='Host: cst.ecc.bj' \
      -q \
      -O /dev/null \
      "http://127.0.0.1:8080${path}" \
      >/dev/null 2>&1; then

      echo "✅ ${name}"
      return 0
    fi

    echo "⏳ ${name} non prêt (${i}/${attempts})"
    sleep "${delay}"
  done

  echo "❌ ${name}"
  docker logs --tail=100 cst-gateway 2>/dev/null || true
  return 1
}

on_error() {
  local rc=$?
  local line="${BASH_LINENO[0]:-inconnue}"

  trap - ERR
  set +e

  echo
  echo "============================================================"
  echo "❌ ECHEC DU DEPLOIEMENT CST"
  echo "Code : ${rc}"
  echo "Ligne: ${line}"
  echo "SHA  : ${RELEASE_SHA}"
  echo "============================================================"

  if [ -d "${DOCKER_DIR}" ]; then
    cd "${DOCKER_DIR}" || true

    echo
    echo "===== DOCKER PS ====="
    compose ps -a || true

    echo
    echo "===== MIGRATIONS ====="
    docker exec cst-backend python manage.py showmigrations 2>&1 || true
    docker exec cst-backend python manage.py migrate --check 2>&1 || true

    echo
    echo "===== BACKEND ====="
    docker logs --tail=200 cst-backend 2>&1 || true

    echo
    echo "===== FRONTEND ====="
    docker logs --tail=150 cst-frontend 2>&1 || true

    echo
    echo "===== CELERY ====="
    docker logs --tail=120 cst-celery-worker 2>&1 || true

    echo
    echo "===== GATEWAY ====="
    docker logs --tail=150 cst-gateway 2>&1 || true
  fi

  echo
  echo "===== DERNIER SUCCES ====="
  cat "${STATE_FILE}" 2>/dev/null || echo "aucun"

  echo
  echo "===== DERNIERE EMPREINTE ENV ====="
  cat "${ENV_STATE_FILE}" 2>/dev/null || echo "aucune"

  exit "${rc}"
}

trap on_error ERR

section "SOURCE SYNCHRONIZATION"

cd "${APP_DIR}"

LAST_SUCCESS_SHA="$(cat "${STATE_FILE}" 2>/dev/null || true)"

echo "Dernier succès : ${LAST_SUCCESS_SHA:-aucun}"
echo "Release        : ${RELEASE_SHA}"
echo "Branche        : ${RELEASE_BRANCH}"
echo "Force full     : ${FORCE_FULL}"

git fetch --prune origin "${RELEASE_BRANCH}"

if ! git cat-file -e "${RELEASE_SHA}^{commit}" 2>/dev/null; then
  git fetch origin "${RELEASE_SHA}"
fi

git clean -fd -e docker/.env.prod -e docker/maintenance/enabled
git reset --hard "${RELEASE_SHA}"

CURRENT_SHA="$(git rev-parse HEAD)"
if [ "${CURRENT_SHA}" != "${RELEASE_SHA}" ]; then
  echo "❌ Le VPS n'est pas sur le commit attendu"
  echo "Attendu : ${RELEASE_SHA}"
  echo "Présent : ${CURRENT_SHA}"
  exit 1
fi

test -s "${DOCKER_DIR}/.env.prod"

CURRENT_ENV_HASH="$(sha256sum "${DOCKER_DIR}/.env.prod" | awk '{print $1}')"
LAST_SUCCESS_ENV_HASH="$(cat "${ENV_STATE_FILE}" 2>/dev/null || true)"
ENV_CHANGED=false

if [ -z "${LAST_SUCCESS_ENV_HASH}" ] || [ "${CURRENT_ENV_HASH}" != "${LAST_SUCCESS_ENV_HASH}" ]; then
  ENV_CHANGED=true
fi

RELEASE_ID="${RELEASE_SHA}-${CURRENT_ENV_HASH:0:12}"

echo "Empreinte env précédente : ${LAST_SUCCESS_ENV_HASH:-aucune}"
echo "Empreinte env actuelle   : ${CURRENT_ENV_HASH}"
echo "Environnement modifié    : ${ENV_CHANGED}"
echo "Release ID               : ${RELEASE_ID}"

BACKEND=false
FRONTEND=false
GATEWAY=false

if [ "${FORCE_FULL}" = "true" ]; then
  BACKEND=true
  FRONTEND=true
  GATEWAY=true
elif [ -z "${LAST_SUCCESS_SHA}" ]; then
  BACKEND=true
  FRONTEND=true
  GATEWAY=true
elif ! git cat-file -e "${LAST_SUCCESS_SHA}^{commit}" 2>/dev/null; then
  BACKEND=true
  FRONTEND=true
  GATEWAY=true
elif ! git merge-base --is-ancestor "${LAST_SUCCESS_SHA}" "${RELEASE_SHA}" 2>/dev/null; then
  BACKEND=true
  FRONTEND=true
  GATEWAY=true
elif [ "${ENV_CHANGED}" = "true" ]; then
  # .env.prod est hors Git. Un changement peut affecter le runtime
  # backend et les variables NEXT_PUBLIC_* intégrées au build frontend.
  # Le gateway n'utilise pas .env.prod comme environnement applicatif :
  # il conserve donc son image actuelle.
  BACKEND=true
  FRONTEND=true
elif [ "${LAST_SUCCESS_SHA}" != "${RELEASE_SHA}" ]; then
  CHANGED_FILES="$(git diff --name-only "${LAST_SUCCESS_SHA}" "${RELEASE_SHA}")"

  section "FILES CHANGED SINCE LAST SUCCESS"
  printf '%s\n' "${CHANGED_FILES}"

  while IFS= read -r file; do
    [ -z "${file}" ] && continue

    case "${file}" in
      backend/*)
        BACKEND=true
        ;;
      frontend/*)
        FRONTEND=true
        ;;
      docker/nginx/*|gateway/*|nginx/*)
        GATEWAY=true
        ;;
      docker/docker-compose.prod.yml|.dockerignore)
        # Le Compose et les règles Docker peuvent modifier plusieurs services.
        BACKEND=true
        FRONTEND=true
        GATEWAY=true
        ;;
      docker/scripts/*)
        # Les scripts sont le moteur du déploiement lui-même.
        # Ils sont déjà issus du commit RELEASE_SHA et ne nécessitent
        # pas, à eux seuls, de reconstruire une image applicative.
        ;;
      docker/*)
        # Fichier d'infrastructure Docker non classé : politique prudente.
        BACKEND=true
        FRONTEND=true
        GATEWAY=true
        ;;
    esac
  done <<< "${CHANGED_FILES}"
fi

# Si un composant critique n'existe plus, sa reconstruction devient obligatoire.
docker inspect cst-backend >/dev/null 2>&1 || BACKEND=true
docker inspect cst-frontend >/dev/null 2>&1 || FRONTEND=true
docker inspect cst-gateway >/dev/null 2>&1 || GATEWAY=true

section "DEPLOYMENT PLAN"
echo "Backend  : ${BACKEND}"
echo "Frontend : ${FRONTEND}"
echo "Gateway  : ${GATEWAY}"
echo "Env      : ${ENV_CHANGED}"
echo "Release  : ${RELEASE_ID}"

if [ "${BACKEND}" = "true" ]; then
  CST_BACKEND_IMAGE="cst-backend:${RELEASE_ID}"
else
  CST_BACKEND_IMAGE="$(container_image_name cst-backend cst-backend:latest)"
fi

if [ "${FRONTEND}" = "true" ]; then
  CST_FRONTEND_IMAGE="cst-frontend:${RELEASE_ID}"
else
  CST_FRONTEND_IMAGE="$(container_image_name cst-frontend cst-frontend:latest)"
fi

if [ "${GATEWAY}" = "true" ]; then
  CST_GATEWAY_IMAGE="cst-gateway:${RELEASE_ID}"
else
  CST_GATEWAY_IMAGE="$(container_image_name cst-gateway cst-gateway:latest)"
fi

export CST_BACKEND_IMAGE
export CST_FRONTEND_IMAGE
export CST_GATEWAY_IMAGE

cd "${DOCKER_DIR}"
compose config >/dev/null

section "DATABASE AND REDIS"
compose up -d cst_db cst_redis
wait_health cst-db 120
wait_health cst-redis 90

if [ "${BACKEND}" = "true" ]; then
  section "BUILD BACKEND CANDIDATE"
  compose build cst_backend
  docker image inspect "${CST_BACKEND_IMAGE}" --format='Backend image: {{.Id}}'
else
  section "BACKEND IMAGE RECONCILIATION"
  echo "Image existante : ${CST_BACKEND_IMAGE}"
  docker image inspect "${CST_BACKEND_IMAGE}" >/dev/null
fi

# Phase de release TOUJOURS exécutée : si le backend n'a pas changé,
# elle vérifie et réconcilie l'état des migrations avec l'image active.
section "DJANGO RELEASE PHASE"
RELEASE_SHA="${RELEASE_SHA}" \
CST_BACKEND_IMAGE="${CST_BACKEND_IMAGE}" \
APP_DIR="${APP_DIR}" \
DOCKER_DIR="${DOCKER_DIR}" \
  bash "${DOCKER_DIR}/scripts/release-backend.sh" </dev/null

if [ "${BACKEND}" = "true" ]; then
  section "ACTIVATE BACKEND"
  compose up -d --force-recreate --no-deps cst_backend
  wait_health cst-backend 180
  verify_container_image cst-backend "${CST_BACKEND_IMAGE}"

  section "ACTIVATE CELERY"
  compose up -d --force-recreate --no-deps cst_celery_worker
  wait_running cst-celery-worker 60
  verify_container_image cst-celery-worker "${CST_BACKEND_IMAGE}"
fi

if [ "${FRONTEND}" = "true" ]; then
  section "BUILD FRONTEND CANDIDATE"
  compose build cst_frontend
  docker image inspect "${CST_FRONTEND_IMAGE}" --format='Frontend image: {{.Id}}'

  section "ACTIVATE FRONTEND"
  compose up -d --force-recreate --no-deps cst_frontend
  wait_health cst-frontend 180
  verify_container_image cst-frontend "${CST_FRONTEND_IMAGE}"
fi

if [ "${GATEWAY}" = "true" ]; then
  section "BUILD GATEWAY CANDIDATE"
  compose build cst_gateway
  docker image inspect "${CST_GATEWAY_IMAGE}" --format='Gateway image: {{.Id}}'
fi

if [ "${GATEWAY}" = "true" ]; then
  section "ACTIVATE GATEWAY"
  compose up -d --force-recreate --no-deps cst_gateway
  wait_health cst-gateway 120
  verify_container_image cst-gateway "${CST_GATEWAY_IMAGE}"

  # ecc-shield ne doit être rechargé que lorsque cst-gateway lui-même
  # est recréé et peut donc changer d'adresse sur ecc_proxy_network.
  docker exec ecc-shield nginx -t
  docker exec ecc-shield nginx -s reload
  echo "✅ ecc-shield rechargé"
elif [ "${BACKEND}" = "true" ] || [ "${FRONTEND}" = "true" ]; then
  section "GATEWAY DYNAMIC DNS"
  echo "cst-gateway n'est pas recréé : Nginx résoudra dynamiquement"
  echo "les nouvelles IP Docker de cst-backend / cst-frontend."
fi

if [ "${BACKEND}" = "true" ] || [ "${FRONTEND}" = "true" ]; then
  section "WAIT FOR GATEWAY UPSTREAM RECONCILIATION"
  gateway_route_check "Gateway → Frontend" "/frontend-health" 15 2
  gateway_route_check "Gateway → API health" "/api/v1/health/" 15 2
fi

section "FINAL SERVICE STATE"
assert_running cst-db
assert_running cst-redis
assert_running cst-backend
assert_running cst-frontend
assert_running cst-celery-worker
assert_running cst-gateway

section "FINAL MIGRATION INVARIANT"
docker exec cst-backend python manage.py migrate --check
echo "✅ Aucune migration Django en attente"

section "INTERNAL ROUTING"
docker exec cst-gateway \
  wget --timeout=10 --tries=2 -q -O /dev/null \
  http://cst-backend:8000/api/v1/health/
echo "✅ Backend direct OK"

docker exec cst-gateway \
  wget --timeout=10 --tries=2 --header='Host: cst.ecc.bj' -q -O /dev/null \
  http://cst-frontend:3000/
echo "✅ Frontend direct OK"

docker exec cst-gateway \
  wget --timeout=10 --tries=2 -q -O /dev/null \
  http://127.0.0.1:8080/gateway-health
echo "✅ Gateway health OK"

gateway_route_check "Gateway → Frontend OK" "/frontend-health" 10 2
gateway_route_check "Gateway → API health OK" "/api/v1/health/" 10 2

section "INTERNAL BUSINESS API"
docker exec cst-gateway \
  wget --timeout=15 --tries=2 --header='Host: cst.ecc.bj' -q -O /dev/null \
  http://127.0.0.1:8080/api/v1/news/
echo "✅ API News interne OK"

docker exec cst-gateway \
  wget --timeout=15 --tries=2 --header='Host: cst.ecc.bj' -q -O /dev/null \
  http://127.0.0.1:8080/api/v1/news/home-special/
echo "✅ API Home Special interne OK"

section "PUBLIC HTTPS"
if [ -f "${DOCKER_DIR}/maintenance/enabled" ]; then
  MAINTENANCE_STATUS="$(
    curl \
      --silent \
      --show-error \
      --output /dev/null \
      --write-out '%{http_code}' \
      --connect-timeout 10 \
      --max-time 30 \
      "${PUBLIC_URL}/" \
      || true
  )"

  if [ "${MAINTENANCE_STATUS}" != "503" ]; then
    echo "❌ Homepage maintenance : HTTP ${MAINTENANCE_STATUS:-000}, 503 attendu"
    exit 1
  fi

  echo "✅ Homepage maintenance : HTTP 503"
else
  public_check "Homepage" "${PUBLIC_URL}/"
fi
public_check "API health" "${PUBLIC_URL}/api/v1/health/"
public_check "API News" "${PUBLIC_URL}/api/v1/news/"
public_check "API Home Special" "${PUBLIC_URL}/api/v1/news/home-special/"

section "PROMOTE IMMUTABLE IMAGES"
# latest n'est mis à jour qu'après validation complète de la release.
if [ "${BACKEND}" = "true" ]; then
  docker tag "${CST_BACKEND_IMAGE}" cst-backend:latest
  echo "✅ cst-backend:latest → ${CST_BACKEND_IMAGE}"
fi

if [ "${FRONTEND}" = "true" ]; then
  docker tag "${CST_FRONTEND_IMAGE}" cst-frontend:latest
  echo "✅ cst-frontend:latest → ${CST_FRONTEND_IMAGE}"
fi

if [ "${GATEWAY}" = "true" ]; then
  docker tag "${CST_GATEWAY_IMAGE}" cst-gateway:latest
  echo "✅ cst-gateway:latest → ${CST_GATEWAY_IMAGE}"
fi

section "MARK RELEASE SUCCESSFUL"
TMP_STATE="$(mktemp "${STATE_DIR}/last-successful-sha.XXXXXX")"
printf '%s\n' "${RELEASE_SHA}" > "${TMP_STATE}"
chmod 600 "${TMP_STATE}"
mv "${TMP_STATE}" "${STATE_FILE}"

TMP_ENV_STATE="$(mktemp "${STATE_DIR}/last-successful-env-sha256.XXXXXX")"
printf '%s\n' "${CURRENT_ENV_HASH}" > "${TMP_ENV_STATE}"
chmod 600 "${TMP_ENV_STATE}"
mv "${TMP_ENV_STATE}" "${ENV_STATE_FILE}"

echo "✅ Dernier déploiement réussi : ${RELEASE_SHA}"
echo "✅ Empreinte environnement   : ${CURRENT_ENV_HASH}"

section "FINAL COMPOSE STATE"
compose ps

echo
echo "✅ CST PRODUCTION OPÉRATIONNEL"
