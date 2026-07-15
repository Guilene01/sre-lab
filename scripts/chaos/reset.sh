#!/usr/bin/env bash
# Clears all chaos state (latency, error rate, db-drop, memory) on an app's
# backend. Does not undo kill-random-pod, scale-to-zero, or bad-deploy --
# those are reverted with plain kubectl commands (printed when you run them).
#
# Usage: reset.sh <app>
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LAB_DOMAIN="${LAB_DOMAIN:-$(cat "$REPO_ROOT/.lab-domain" 2>/dev/null || true)}"
: "${LAB_DOMAIN:?run scripts/setup.sh first (or export LAB_DOMAIN=<alb-ip-with-dashes>.sslip.io)}"

APP="${1:?usage: reset.sh <app>}"

curl -sf -X POST "http://${APP}.${LAB_DOMAIN}/api/chaos/reset"
echo ""
echo "Chaos state cleared for ${APP}-backend."
