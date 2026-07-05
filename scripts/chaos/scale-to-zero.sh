#!/usr/bin/env bash
# Scales a deployment to 0 replicas -- simulates a full outage of that
# component (e.g. "the backend team accidentally scaled down prod").
#
# Usage: scale-to-zero.sh <namespace> <deployment>
set -euo pipefail

NAMESPACE="${1:?usage: scale-to-zero.sh <namespace> <deployment>}"
DEPLOYMENT="${2:?usage: scale-to-zero.sh <namespace> <deployment>}"

echo "Scaling $DEPLOYMENT in $NAMESPACE to 0 replicas..."
kubectl -n "$NAMESPACE" scale deployment "$DEPLOYMENT" --replicas=0
echo "Restore with: kubectl -n $NAMESPACE scale deployment $DEPLOYMENT --replicas=2"
