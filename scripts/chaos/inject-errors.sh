#!/usr/bin/env bash
# Makes an app's backend randomly return HTTP 500s, at the given rate.
#
# Usage: inject-errors.sh <app> [rate 0-1]
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LAB_DOMAIN="${LAB_DOMAIN:-$(cat "$REPO_ROOT/.lab-domain" 2>/dev/null || true)}"
: "${LAB_DOMAIN:?run scripts/setup.sh first (or export LAB_DOMAIN=<alb-ip-with-dashes>.sslip.io)}"

APP="${1:?usage: inject-errors.sh <app> [rate 0-1]}"
RATE="${2:-0.5}"

curl -sf -X POST "http://${APP}.${LAB_DOMAIN}/api/chaos/errors" \
  -H "Content-Type: application/json" \
  -d "{\"rate\": ${RATE}}"
echo ""
echo "Injected ${RATE} error rate into ${APP}-backend. Reset with:"
echo "  curl -X POST http://${APP}.${LAB_DOMAIN}/api/chaos/reset"
