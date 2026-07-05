#!/usr/bin/env bash
# Forces an app's /readyz check to fail as if the RDS connection dropped,
# without actually touching the database. Kubernetes will mark affected
# pods NotReady and pull them out of the Service after failureThreshold
# probe failures.
#
# Usage: drop-db-connection.sh <app>
set -euo pipefail

APP="${1:?usage: drop-db-connection.sh <app>}"

curl -sf -X POST "http://${APP}.lab.local/api/chaos/db-drop" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
echo ""
echo "Simulating a dropped DB connection for ${APP}-backend."
echo "Watch pods go NotReady with: kubectl -n ${APP} get pods -w"
echo "Restore with: curl -X POST http://${APP}.lab.local/api/chaos/reset"
