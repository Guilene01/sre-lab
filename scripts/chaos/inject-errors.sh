#!/usr/bin/env bash
# Makes an app's backend randomly return HTTP 500s, at the given rate.
#
# Usage: inject-errors.sh <app> [rate 0-1]
set -euo pipefail

APP="${1:?usage: inject-errors.sh <app> [rate 0-1]}"
RATE="${2:-0.5}"

curl -sf -X POST "http://${APP}.lab.local/api/chaos/errors" \
  -H "Content-Type: application/json" \
  -d "{\"rate\": ${RATE}}"
echo ""
echo "Injected ${RATE} error rate into ${APP}-backend. Reset with:"
echo "  curl -X POST http://${APP}.lab.local/api/chaos/reset"
