#!/usr/bin/env bash
# Blocks the Node.js event loop on an app's backend for the given number of
# seconds, spiking CPU and latency for every request that pod serves. Good
# for demonstrating HPA scale-out under sustained CPU pressure.
#
# Usage: cpu-spike.sh <app> [seconds]
set -euo pipefail

APP="${1:?usage: cpu-spike.sh <app> [seconds]}"
SECONDS_ARG="${2:-10}"

curl -sf -X POST "http://${APP}.lab.local/api/chaos/cpu-spike" \
  -H "Content-Type: application/json" \
  -d "{\"seconds\": ${SECONDS_ARG}}"
echo ""
echo "Blocking the event loop on one ${APP}-backend pod for ${SECONDS_ARG}s."
echo "Watch CPU/HPA with: kubectl -n ${APP} get hpa -w"
