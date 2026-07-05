#!/usr/bin/env bash
# Deletes a random pod in the given namespace. Kubernetes will reschedule it
# immediately via the Deployment controller -- use this to demonstrate
# self-healing, or run it repeatedly to simulate a crash loop.
#
# Usage: kill-random-pod.sh <namespace>
set -euo pipefail

NAMESPACE="${1:?usage: kill-random-pod.sh <namespace>}"

PODS=($(kubectl -n "$NAMESPACE" get pods -o jsonpath='{.items[*].metadata.name}'))
if [ ${#PODS[@]} -eq 0 ]; then
  echo "No pods found in namespace $NAMESPACE"
  exit 1
fi

POD=${PODS[$RANDOM % ${#PODS[@]}]}
echo "Deleting pod $POD in namespace $NAMESPACE..."
kubectl -n "$NAMESPACE" delete pod "$POD"
echo "Watch it recover: kubectl -n $NAMESPACE get pods -w"
