#!/usr/bin/env bash
# Injects artificial latency into every request an app's backend serves, via
# its built-in chaos hook. Requires /etc/hosts to resolve <app>.lab.local
# (see docs/student-guide.md).
#
# Usage: inject-latency.sh <app> [ms]
set -euo pipefail

APP="${1:?usage: inject-latency.sh <app> [ms]}"
MS="${2:-3000}"

curl -sf -X POST "http://${APP}.lab.local/api/chaos/latency" \
  -H "Content-Type: application/json" \
  -d "{\"ms\": ${MS}}"
echo ""
echo "Injected ${MS}ms of latency into ${APP}-backend. Reset with:"
echo "  curl -X POST http://${APP}.lab.local/api/chaos/reset"
