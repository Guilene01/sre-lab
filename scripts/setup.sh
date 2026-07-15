#!/usr/bin/env bash
# End-to-end setup: terraform apply -> configure kubectl -> build/push images ->
# create per-app databases on the shared RDS instance -> create k8s secrets ->
# deploy every app -> install the AWS Load Balancer Controller and Ingresses ->
# print next steps.
#
# Requires: terraform, aws cli (configured), kubectl, docker, helm.
# RDS has no public access, so per-app databases are created via a short-lived
# pod running inside the cluster (the only thing allowed to reach RDS:5432).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="$REPO_ROOT/terraform"
APPS=(ecommerce banking food-delivery student-portal support-tickets)

echo "==> 1/8 terraform apply"
cd "$TF_DIR"
terraform init -input=false
terraform apply -auto-approve

CLUSTER_NAME=$(terraform output -raw cluster_name)
REGION=$(terraform output -raw region)
VPC_ID=$(terraform output -raw vpc_id)
RDS_ADDRESS=$(terraform output -raw rds_address)
RDS_PORT=$(terraform output -raw rds_port)
RDS_MASTER_USER=$(terraform output -raw rds_master_username)
RDS_MASTER_PASSWORD=$(terraform output -raw rds_master_password)
ALB_CONTROLLER_ROLE_ARN=$(terraform output -raw alb_controller_role_arn)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "==> 2/8 configure kubectl"
aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$REGION"

echo "==> 3/8 build and push images to ECR"
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

IMAGE_TAG="$(date +%Y%m%d%H%M%S)"
for app in "${APPS[@]}"; do
  for part in backend frontend; do
    image="sre-lab/${app}-${part}"
    echo "    building ${image}:${IMAGE_TAG}"
    docker build --platform linux/amd64 -t "${ECR_REGISTRY}/${image}:${IMAGE_TAG}" "$REPO_ROOT/apps/${app}/${part}"
    docker push "${ECR_REGISTRY}/${image}:${IMAGE_TAG}"
  done
done

echo "==> 4/8 create namespaces"
kubectl apply -f "$REPO_ROOT/namespaces/"

echo "==> 5/8 create per-app databases on shared RDS instance"
for app in "${APPS[@]}"; do
  db_name="${app//-/_}_db"
  db_user="${app//-/_}_app"
  db_password=$(openssl rand -hex 16)

  echo "    provisioning ${db_name} / ${db_user}"
  {
    echo "SELECT 'CREATE DATABASE ${db_name}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${db_name}')\\gexec"
    echo "DO \$\$ BEGIN CREATE ROLE ${db_user} WITH LOGIN PASSWORD '${db_password}'; EXCEPTION WHEN duplicate_object THEN ALTER ROLE ${db_user} WITH PASSWORD '${db_password}'; END \$\$;"
    echo "GRANT ALL PRIVILEGES ON DATABASE ${db_name} TO ${db_user};"
  } | kubectl run "pg-init-${app}" --rm -i --restart=Never -n "$app" \
      --image=postgres:17-alpine --env="PGPASSWORD=${RDS_MASTER_PASSWORD}" \
      --command -- psql -h "$RDS_ADDRESS" -U "$RDS_MASTER_USER" -d postgres -v ON_ERROR_STOP=1 -f -

  cat "$REPO_ROOT/apps/${app}/backend/sql/init.sql" | kubectl run "pg-schema-${app}" --rm -i --restart=Never -n "$app" \
      --image=postgres:17-alpine --env="PGPASSWORD=${RDS_MASTER_PASSWORD}" \
      --command -- psql -h "$RDS_ADDRESS" -U "$RDS_MASTER_USER" -d "$db_name" -v ON_ERROR_STOP=1 -f -

  echo "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${db_user}; GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${db_user};" \
    | kubectl run "pg-grant-${app}" --rm -i --restart=Never -n "$app" \
      --image=postgres:17-alpine --env="PGPASSWORD=${RDS_MASTER_PASSWORD}" \
      --command -- psql -h "$RDS_ADDRESS" -U "$RDS_MASTER_USER" -d "$db_name" -v ON_ERROR_STOP=1 -f -

  kubectl create secret generic "${app}-db-credentials" -n "$app" \
    --from-literal=PGHOST="$RDS_ADDRESS" \
    --from-literal=PGPORT="$RDS_PORT" \
    --from-literal=PGDATABASE="$db_name" \
    --from-literal=PGUSER="$db_user" \
    --from-literal=PGPASSWORD="$db_password" \
    --dry-run=client -o yaml | kubectl apply -f -
done

echo "==> 6/8 deploy food-delivery redis"
kubectl apply -f "$REPO_ROOT/apps/food-delivery/redis/deployment.yaml"

echo "==> 7/8 deploy all apps"
for app in "${APPS[@]}"; do
  k8s_dir="$REPO_ROOT/apps/${app}/k8s"
  for manifest in "$k8s_dir"/*.yaml; do
    ECR_REGISTRY="$ECR_REGISTRY" IMAGE_TAG="$IMAGE_TAG" envsubst '${ECR_REGISTRY} ${IMAGE_TAG}' < "$manifest" | kubectl apply -f -
  done
done

echo "==> 8/8 install the AWS Load Balancer Controller and apply Ingress resources"
helm repo add eks https://aws.github.io/eks-charts >/dev/null 2>&1 || true
helm repo update >/dev/null
helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
  --namespace kube-system \
  --set clusterName="$CLUSTER_NAME" \
  --set region="$REGION" \
  --set vpcId="$VPC_ID" \
  --set serviceAccount.create=true \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"="$ALB_CONTROLLER_ROLE_ARN" \
  --wait --timeout=5m

# Apps are reached at http://<app>.<alb-ip-with-dashes>.sslip.io -- sslip.io
# resolves any "*.<ip>.sslip.io" name straight to that IP, so no one needs to
# touch /etc/hosts or own a domain. The ALB doesn't exist yet on a fresh
# cluster, so the first apply uses a placeholder host and gets replaced below
# once we know the ALB's real IP.
LAB_DOMAIN="pending.invalid"
for manifest in "$REPO_ROOT"/ingress/*.yaml; do
  LAB_DOMAIN="$LAB_DOMAIN" envsubst '${LAB_DOMAIN}' < "$manifest" | kubectl apply -f -
done

echo ""
echo "==> Waiting for the ALB hostname (can take a couple of minutes on a fresh cluster)..."
for i in $(seq 1 30); do
  ALB_HOST=$(kubectl -n ecommerce get ingress ecommerce -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || true)
  [ -n "$ALB_HOST" ] && break
  sleep 10
done

if [ -z "$ALB_HOST" ]; then
  echo "ALB hostname didn't appear in time -- check 'kubectl -n ecommerce describe ingress ecommerce' and re-run this script."
  exit 1
fi

echo "==> Resolving the ALB's IP via the AWS API (works the same on every OS, no dig/nslookup needed)"
ALB_ARN=$(aws elbv2 describe-load-balancers --region "$REGION" \
  --query "LoadBalancers[?DNSName=='${ALB_HOST}'].LoadBalancerArn" --output text)
# Regular (non-static-IP) ALBs don't expose their IP via describe-load-balancers --
# LoadBalancerAddresses is only populated for static-IP/BYOIP load balancers. Their
# actual IP lives on the ENIs AWS creates for the ALB in each subnet instead.
ALB_LB_ID="${ALB_ARN#*loadbalancer/}"
ALB_IP=$(aws ec2 describe-network-interfaces --region "$REGION" \
  --filters "Name=description,Values=ELB ${ALB_LB_ID}" \
  --query "NetworkInterfaces[0].Association.PublicIp" --output text)
LAB_DOMAIN="${ALB_IP//./-}.sslip.io"

echo "==> Re-applying Ingress resources with the real hostnames (*.${LAB_DOMAIN})"
for manifest in "$REPO_ROOT"/ingress/*.yaml; do
  LAB_DOMAIN="$LAB_DOMAIN" envsubst '${LAB_DOMAIN}' < "$manifest" | kubectl apply -f -
done

echo "$LAB_DOMAIN" > "$REPO_ROOT/.lab-domain"

echo ""
echo "================================================================"
echo " Setup complete."
echo "================================================================"
echo "All 5 apps share this one ALB (routed by hostname via an IngressGroup)."
echo "No /etc/hosts edit needed -- these URLs resolve on their own via sslip.io:"
echo ""
echo "  http://ecommerce.${LAB_DOMAIN}"
echo "  http://banking.${LAB_DOMAIN}"
echo "  http://food-delivery.${LAB_DOMAIN}"
echo "  http://student-portal.${LAB_DOMAIN}"
echo "  http://support-tickets.${LAB_DOMAIN}"
echo ""
echo "(That domain is also saved to .lab-domain for the chaos scripts to use.)"
echo ""
echo "Next: install the Datadog Agent with your own API key -- see docs/student-guide.md."
