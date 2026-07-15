#!/usr/bin/env bash
# Retains extra memory inside the backend process via its built-in chaos
# hook. Pair with the low memory limit already set on the Deployment
# (256Mi) to trigger a real OOMKilled event.
#
# Usage: memory-spike.sh <app> [mb]
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LAB_DOMAIN="${LAB_DOMAIN:-$(cat "$REPO_ROOT/.lab-domain" 2>/dev/null || true)}"
: "${LAB_DOMAIN:?run scripts/setup.sh first (or export LAB_DOMAIN=<alb-ip-with-dashes>.sslip.io)}"

APP="${1:?usage: memory-spike.sh <app> [mb]}"
MB="${2:-300}"

curl -sf -X POST "http://${APP}.${LAB_DOMAIN}/api/chaos/memory-spike" \
  -H "Content-Type: application/json" \
  -d "{\"mb\": ${MB}}"
echo ""
echo "Requested ${MB}MB of retained memory on ${APP}-backend."
echo "Watch for OOMKilled with: kubectl -n ${APP} get pods -w"
