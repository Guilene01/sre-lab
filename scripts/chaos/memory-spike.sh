#!/usr/bin/env bash
# Retains extra memory inside the backend process via its built-in chaos
# hook. Pair with the low memory limit already set on the Deployment
# (256Mi) to trigger a real OOMKilled event.
#
# Usage: memory-spike.sh <app> [mb]
set -euo pipefail

APP="${1:?usage: memory-spike.sh <app> [mb]}"
MB="${2:-300}"

curl -sf -X POST "http://${APP}.lab.local/api/chaos/memory-spike" \
  -H "Content-Type: application/json" \
  -d "{\"mb\": ${MB}}"
echo ""
echo "Requested ${MB}MB of retained memory on ${APP}-backend."
echo "Watch for OOMKilled with: kubectl -n ${APP} get pods -w"
