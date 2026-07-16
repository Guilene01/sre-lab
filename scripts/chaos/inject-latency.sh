#!/usr/bin/env bash
# Injects artificial latency into every request an app's backend serves, via
# its built-in chaos hook. Reads the lab's ALB hostname from .lab-domain
# (written by scripts/setup.sh).
#
# Usage: inject-latency.sh <app> [ms]
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LAB_DOMAIN="${LAB_DOMAIN:-$(cat "$REPO_ROOT/.lab-domain" 2>/dev/null || true)}"
: "${LAB_DOMAIN:?run scripts/setup.sh first (or export LAB_DOMAIN=<your-domain>)}"

APP="${1:?usage: inject-latency.sh <app> [ms]}"
MS="${2:-3000}"

curl -sf -X POST "http://${APP}.${LAB_DOMAIN}/api/chaos/latency" \
  -H "Content-Type: application/json" \
  -d "{\"ms\": ${MS}}"
echo ""
echo "Injected ${MS}ms of latency into ${APP}-backend. Reset with:"
echo "  curl -X POST http://${APP}.${LAB_DOMAIN}/api/chaos/reset"
