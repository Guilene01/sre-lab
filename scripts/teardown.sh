#!/usr/bin/env bash
# Full teardown: deletes the Ingress resources (so the AWS Load Balancer
# Controller deprovisions the shared ALB cleanly before terraform destroy),
# uninstalls Datadog and the controller, then destroys every
# Terraform-managed resource.
#
# Run this to avoid an orphaned ALB/target-groups/security-group that
# terraform destroy alone won't know about, since the controller creates
# the ALB via Ingress resources, not via Terraform.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="$REPO_ROOT/terraform"

echo "==> 1/4 deleting Ingress resources (releases the shared AWS ALB)"
kubectl delete -f "$REPO_ROOT/ingress/" --ignore-not-found 2>&1 || true
helm uninstall aws-load-balancer-controller -n kube-system 2>&1 || true

echo "==> 2/4 uninstalling Datadog agent (if installed)"
helm uninstall datadog -n datadog 2>&1 || true

echo "==> waiting 30s for the ALB to finish deprovisioning..."
sleep 30

echo "==> 3/4 deleting app namespaces (frees any remaining LBs/PVCs)"
for ns in ecommerce banking food-delivery student-portal support-tickets datadog; do
  kubectl delete namespace "$ns" --ignore-not-found --timeout=60s 2>&1 || true
done

echo "==> 4/4 terraform destroy"
cd "$TF_DIR"
terraform destroy -auto-approve

echo ""
echo "================================================================"
echo " Teardown complete."
echo "================================================================"
echo "Double-check in the AWS console that no orphaned resources remain:"
echo "  - EC2 > Load Balancers (should be empty for this lab)"
echo "  - VPC > NAT Gateways / Elastic IPs"
echo "  - ECR repositories (force_delete removes images automatically)"
echo "  - RDS > Databases"
