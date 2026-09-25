#!/usr/bin/env bash

set -Eeuo pipefail

DOCKER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLAG_DIR="${DOCKER_DIR}/maintenance"
FLAG_FILE="${FLAG_DIR}/enabled"

usage() {
  cat <<'USAGE'
Usage:
  bash docker/scripts/maintenance-mode.sh on
  bash docker/scripts/maintenance-mode.sh off
  bash docker/scripts/maintenance-mode.sh status

Le mode maintenance agit uniquement sur le site public servi par le gateway.
L'API, les médias et le back-office restent accessibles.
USAGE
}

case "${1:-status}" in
  on|enable|enabled)
    mkdir -p "${FLAG_DIR}"
    touch "${FLAG_FILE}"
    chmod 640 "${FLAG_FILE}" 2>/dev/null || true
    echo "✅ Mode maintenance ACTIVÉ"
    echo "Le site public renvoie désormais la page de maintenance (HTTP 503)."
    ;;

  off|disable|disabled)
    rm -f "${FLAG_FILE}"
    echo "✅ Mode maintenance DÉSACTIVÉ"
    echo "Le site public est de nouveau servi normalement."
    ;;

  status)
    if [ -f "${FLAG_FILE}" ]; then
      echo "MAINTENANCE=ON"
      exit 0
    fi
    echo "MAINTENANCE=OFF"
    ;;

  -h|--help|help)
    usage
    ;;

  *)
    echo "❌ Action inconnue : ${1}" >&2
    usage >&2
    exit 2
    ;;
esac
