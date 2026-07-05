#!/usr/bin/env bash
# Clears all chaos state (latency, error rate, db-drop, memory) on an app's
# backend. Does not undo kill-random-pod, scale-to-zero, or bad-deploy --
# those are reverted with plain kubectl commands (printed when you run them).
#
# Usage: reset.sh <app>
set -euo pipefail

APP="${1:?usage: reset.sh <app>}"

curl -sf -X POST "http://${APP}.lab.local/api/chaos/reset"
echo ""
echo "Chaos state cleared for ${APP}-backend."
