#!/usr/bin/env bash
# Blocks the Node.js event loop on an app's backend for the given number of
# seconds, spiking CPU and latency for every request that pod serves. Good
# for demonstrating HPA scale-out under sustained CPU pressure.
#
# Usage: cpu-spike.sh <app> [seconds]
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LAB_DOMAIN="${LAB_DOMAIN:-$(cat "$REPO_ROOT/.lab-domain" 2>/dev/null || true)}"
: "${LAB_DOMAIN:?run scripts/setup.sh first (or export LAB_DOMAIN=<alb-ip-with-dashes>.sslip.io)}"

APP="${1:?usage: cpu-spike.sh <app> [seconds]}"
SECONDS_ARG="${2:-10}"

curl -sf -X POST "http://${APP}.${LAB_DOMAIN}/api/chaos/cpu-spike" \
  -H "Content-Type: application/json" \
  -d "{\"seconds\": ${SECONDS_ARG}}"
echo ""
echo "Blocking the event loop on one ${APP}-backend pod for ${SECONDS_ARG}s."
echo "Watch CPU/HPA with: kubectl -n ${APP} get hpa -w"
