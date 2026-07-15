#!/usr/bin/env bash
# Forces an app's /readyz check to fail as if the RDS connection dropped,
# without actually touching the database. Kubernetes will mark affected
# pods NotReady and pull them out of the Service after failureThreshold
# probe failures.
#
# Usage: drop-db-connection.sh <app>
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LAB_DOMAIN="${LAB_DOMAIN:-$(cat "$REPO_ROOT/.lab-domain" 2>/dev/null || true)}"
: "${LAB_DOMAIN:?run scripts/setup.sh first (or export LAB_DOMAIN=<alb-ip-with-dashes>.sslip.io)}"

APP="${1:?usage: drop-db-connection.sh <app>}"

curl -sf -X POST "http://${APP}.${LAB_DOMAIN}/api/chaos/db-drop" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
echo ""
echo "Simulating a dropped DB connection for ${APP}-backend."
echo "Watch pods go NotReady with: kubectl -n ${APP} get pods -w"
echo "Restore with: curl -X POST http://${APP}.${LAB_DOMAIN}/api/chaos/reset"
