#!/usr/bin/env bash
# Points a deployment at a nonexistent image tag -- simulates a bad release
# (typo'd tag, image never pushed). New pods will sit in ImagePullBackOff
# while the old, working pods keep serving traffic until rollout catches up.
#
# Usage: bad-deploy.sh <namespace> <deployment> <container>
set -euo pipefail

NAMESPACE="${1:?usage: bad-deploy.sh <namespace> <deployment> <container>}"
DEPLOYMENT="${2:?usage: bad-deploy.sh <namespace> <deployment> <container>}"
CONTAINER="${3:?usage: bad-deploy.sh <namespace> <deployment> <container>}"

CURRENT_IMAGE=$(kubectl -n "$NAMESPACE" get deployment "$DEPLOYMENT" -o jsonpath="{.spec.template.spec.containers[?(@.name=='$CONTAINER')].image}")
REPO="${CURRENT_IMAGE%:*}"

echo "Setting $DEPLOYMENT/$CONTAINER to a nonexistent tag..."
kubectl -n "$NAMESPACE" set image "deployment/$DEPLOYMENT" "$CONTAINER=${REPO}:does-not-exist"
echo "Watch it fail with: kubectl -n $NAMESPACE get pods -w"
echo "Roll back with: kubectl -n $NAMESPACE rollout undo deployment/$DEPLOYMENT"
