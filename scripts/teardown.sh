#!/usr/bin/env bash
# Full teardown: removes the ingress-nginx LoadBalancer (so its NLB is
# deleted cleanly by AWS before terraform destroy), uninstalls Datadog and
# ingress-nginx, then destroys every Terraform-managed resource.
#
# Run this to avoid an orphaned NLB/security-group that terraform destroy
# alone won't know about, since ingress-nginx creates the NLB via a
# Kubernetes Service, not via Terraform.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="$REPO_ROOT/terraform"

echo "==> 1/4 deleting ingress-nginx Service (releases the AWS NLB)"
kubectl delete -f "$REPO_ROOT/ingress/" --ignore-not-found 2>&1 || true
helm uninstall ingress-nginx -n ingress-nginx 2>&1 || true

echo "==> 2/4 uninstalling Datadog agent (if installed)"
helm uninstall datadog -n datadog 2>&1 || true

echo "==> waiting 30s for the NLB to finish deprovisioning..."
sleep 30

echo "==> 3/4 deleting app namespaces (frees any remaining LBs/PVCs)"
for ns in ecommerce banking food-delivery student-portal support-tickets ingress-nginx datadog; do
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
