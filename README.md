# SRE Lab

A hands-on SRE/DevOps training lab: five polished, full-stack applications
(ecommerce, banking, food-delivery, student-portal, support-tickets) running
on a shared Amazon EKS cluster, backed by a shared Amazon RDS for PostgreSQL
instance, observed with each student's own Datadog account. The point isn't
the apps themselves -- it's practicing the on-call loop: deploy it, break it
on purpose with the built-in chaos hooks, find the break in Datadog before
you go looking with `kubectl`, diagnose it, fix it, then write a postmortem
against a real error budget.

For the full system diagram and the reasoning behind every infrastructure
choice (including the tradeoffs made to keep this cheap and easy for a
classroom of students to stand up independently), see
[docs/architecture.md](docs/architecture.md). For a guided, step-by-step
walkthrough of the whole lab, see [docs/student-guide.md](docs/student-guide.md).
This README is the condensed reference: what's in the repo, how to bring it
up, what each app does, and how to break it.

## Repo layout

```
terraform/         VPC, EKS, node group, RDS, ECR -- flat, no modules (see terraform/*.tf)
namespaces/         Namespace + ResourceQuota + LimitRange per app (namespaces/<app>.yaml)
apps/<app>/         frontend/ (React+Vite+Tailwind), backend/ (Node+Express), k8s/ (Deployments/Services/HPA)
ingress/           One Ingress resource per app, routed by hostname via a shared ALB
datadog/           helm-values.yaml, dashboards/ (importable JSON), monitors/ (importable JSON)
scripts/           setup.sh, teardown.sh, chaos/ (per-failure-mode scripts)
docs/              architecture.md, slo-sla-sli.md, error-budget.md, runbooks/, incident-scenarios/, student-guide.md
```

Each of the 5 apps under `apps/` is structured identically:

```
apps/<app>/
  backend/
    src/index.js      Express app entrypoint, mounts routes + chaos middleware
    src/routes.js      The app's real business-logic endpoints
    src/db.js          pg Pool, reads PGHOST/PGUSER/etc. from the Secret setup.sh creates
    src/chaos.js        Chaos endpoints (see "Breaking things on purpose" below)
    src/tracer.js       dd-trace init -- loaded first via `node -r ./src/tracer.js`
    sql/init.sql        Schema + seed data, run once by setup.sh against the shared RDS instance
    Dockerfile
  frontend/            React + Vite + Tailwind SPA, built and served by nginx (see Dockerfile, nginx.conf)
  k8s/                 configmap.yaml, deployment-{backend,frontend}.yaml, service-{backend,frontend}.yaml, hpa-backend.yaml
```

## Prerequisites

- `terraform`, `aws` CLI (configured with credentials for the target AWS
  account), `kubectl`, `docker`, and `helm` installed locally.
- An AWS account you're comfortable spending ~$150-250/month on if left
  running (see [Cost](#cost) below) -- there is no free tier here, this
  provisions real EKS/RDS/NAT infrastructure.
- Your own free [Datadog](https://www.datadoghq.com/) trial account. Nothing
  in this repo contains a real API key; each student/user brings their own.

## Quick start

```bash
# 1. Provision AWS infra, build/push all 10 images to ECR, create per-app
#    databases on the shared RDS instance, deploy all 5 apps, install the
#    AWS Load Balancer Controller. Takes 15-20 minutes, mostly waiting on
#    EKS/ALB.
./scripts/setup.sh

# 2. Resolve the printed ALB hostname to an IP (all 5 apps share one ALB)
dig +short <alb-hostname> | head -1

# 3. Add to /etc/hosts (or C:\Windows\System32\drivers\etc\hosts on Windows,
#    as Administrator)
<alb-ip>  ecommerce.lab.local banking.lab.local food-delivery.lab.local student-portal.lab.local support-tickets.lab.local

# 4. Visit the apps
open http://ecommerce.lab.local

# 5. Install the Datadog Agent with your own API key
kubectl create namespace datadog
kubectl create secret generic datadog-secret --namespace datadog \
  --from-literal api-key=<your-datadog-api-key>
helm repo add datadog https://helm.datadoghq.com && helm repo update
helm install datadog datadog/datadog --namespace datadog -f datadog/helm-values.yaml

# 6. Break things
./scripts/chaos/inject-latency.sh ecommerce 3000
./scripts/chaos/memory-spike.sh support-tickets 300
./scripts/chaos/kill-random-pod.sh banking

# 7. Tear down when done -- this costs real AWS money while running
./scripts/teardown.sh
```

See [docs/student-guide.md](docs/student-guide.md) for the full walkthrough
with exact commands for every step below.

### What `setup.sh` actually does

`scripts/setup.sh` is a single idempotent-ish script that runs, in order:

1. `terraform init` / `terraform apply` in `terraform/` -- creates the VPC,
   EKS cluster + managed node group, the shared RDS instance, and 10 ECR
   repositories (one per app per frontend/backend).
2. `aws eks update-kubeconfig` to point `kubectl` at the new cluster.
3. Builds and pushes all 10 container images to ECR, tagged with a
   timestamp (so every run produces a fresh, traceable image tag).
4. `kubectl apply -f namespaces/` -- creates the 5 app namespaces, each
   with its own `ResourceQuota` and `LimitRange` (see
   [Resource limits](#resource-limits-and-why) below).
5. For each app: creates its database and a least-privilege role on the
   shared RDS instance, applies `sql/init.sql`, and writes a
   `<app>-db-credentials` Secret. This step runs `psql` from a short-lived
   pod inside the cluster (`kubectl run ... postgres:17-alpine`) rather
   than from your machine, because RDS's security group only allows
   inbound 5432 from the EKS node security group -- see
   [docs/architecture.md](docs/architecture.md#database-amazon-rds-for-postgresql).
6. Deploys food-delivery's in-cluster Redis.
7. Applies every app's `k8s/*.yaml` manifests (via `envsubst`, to inject
   the ECR registry URL and image tag).
8. Installs the AWS Load Balancer Controller via Helm (authenticated via
   an IRSA role Terraform already created) and applies `ingress/*.yaml`,
   then polls for the shared ALB's hostname and prints it.

### Connecting `kubectl` manually

`setup.sh` does this for you, but if you need to reconnect in a new shell:

```bash
aws eks update-kubeconfig --name sre-lab --region us-east-1
kubectl get pods -A
```

## How to use this lab

The infrastructure is just the stage -- the actual exercise is the loop
below. Work through it once end-to-end, then repeat with a different app
and a different failure mode.

1. **Deploy and poke at the apps.** After `setup.sh` and the `/etc/hosts`
   step, confirm all five load and complete one real user action in each:
   add to cart and check out in ecommerce, log in and check a balance in
   banking, place an order in food-delivery, view grades in
   student-portal, file a ticket in support-tickets.
2. **Install Datadog and import the dashboards/monitors** (step 5 in
   [Quick start](#quick-start) above, or in full in
   [docs/student-guide.md](docs/student-guide.md) sections 5-6): each
   app's dashboard from `datadog/dashboards/<app>.json`, plus
   `sre-lab-overview.json`, and the four monitors in `datadog/monitors/`.
3. **Observe the baseline.** With everything healthy, open each dashboard
   and note what "normal" looks like -- throughput, p95 latency, error
   rate. You'll need this for comparison once something breaks.
4. **Pick an incident.** Either work through
   [docs/incident-scenarios/](docs/incident-scenarios/) in order (each one
   names the app, difficulty, and which runbook it ties to -- e.g.
   `01-the-silent-checkout.md` is an ecommerce latency problem tied to
   `docs/runbooks/high-latency.md`), or trigger a failure yourself with
   `scripts/chaos/*.sh` (see the table in
   [Breaking things on purpose](#breaking-things-on-purpose)) without
   reading the answer key first.
5. **Find it in Datadog before you touch `kubectl`.** Which widget moved
   first, and by how much? This is the habit the lab is built to train --
   diagnosing from telemetry, not from `kubectl get pods -w` first.
6. **Diagnose**, using the matching runbook in
   [docs/runbooks/](docs/runbooks/) if you get stuck, but try the
   diagnostic commands yourself first.
7. **Fix it**, then confirm recovery both in the app itself and in the
   Datadog dashboard (metrics lag the real state by a minute or two).
8. **Write a postmortem**: what broke, how you found it, how you fixed it,
   how much error budget it burned (see
   [docs/error-budget.md](docs/error-budget.md) for the calculation
   method), and one concrete prevention step.
9. **Repeat** with another incident scenario, then try writing and
   triggering your own with the `scripts/chaos/*.sh` building blocks for a
   classmate to diagnose.

When you're done for the day, tear down (see [Cost](#cost)) -- nothing in
this lab needs to stay running between sessions.

## The five apps

All five backends are Node.js + Express (instrumented with `dd-trace`, see
`src/tracer.js`) and all five frontends are React + Vite + Tailwind, so the
stack is consistent and the interesting differences are in each app's
domain logic and failure modes.

| App | What it does | Key endpoints (`/api/...`) | Notable |
|---|---|---|---|
| **ecommerce** | Browse products, manage a cart, check out, view past orders | `GET /products`, `GET/POST/DELETE /cart(/items)`, `POST /checkout`, `GET /orders` | Checkout latency/success is the primary SLI -- see [docs/slo-sla-sli.md](docs/slo-sla-sli.md) |
| **banking** | Demo login, view balance/transaction history, transfer funds | `POST /auth/login`, `GET /accounts/me(/transactions)`, `POST /transfer` | Plaintext password comparison for the demo login -- deliberately simplified, see [What's simplified](#whats-deliberately-simplified) |
| **food-delivery** | Browse restaurants/menus, place an order, poll live order status | `GET /restaurants(/:id/menu)`, `POST/GET /orders`, `GET /orders/:id/status` | Order status is cached in an in-cluster Redis with a 5s TTL, the only app with a non-Postgres datastore |
| **student-portal** | Demo login, view courses/grades/assignments, enroll, submit assignments | `POST /auth/login`, `GET /courses`, `POST /enrollments`, `GET /grades`, `GET /assignments`, `POST /assignments/:id/submit` | Same plaintext demo-login pattern as banking |
| **support-tickets** | File and comment on support tickets | `GET/POST /tickets`, `GET /tickets/:id`, `POST /tickets/:id/comments` | Simplest app -- good first target for chaos experiments |

Demo login credentials (banking, student-portal) all use password `demo123`;
see each app's `apps/<app>/backend/sql/init.sql` for the exact seeded
usernames.

Every backend also exposes, regardless of its business logic:

- `GET /healthz` -- liveness only, always 200 if the process is up.
- `GET /readyz` -- readiness, runs a real `SELECT 1` against Postgres, so a
  reachable-app-but-unreachable-database failure actually shows up as
  `NotReady` instead of being masked.
- `POST /api/chaos/*` -- see below.

## Breaking things on purpose

Every backend has chaos hooks built in (`src/chaos.js`), toggled over HTTP
so you can trigger a failure mode against a live pod with a single `curl`
call -- no redeploy needed. `scripts/chaos/*.sh` wrap these (and a few
Kubernetes-level failures) in copy-paste commands:

| Script | Failure mode | What it does |
|---|---|---|
| `inject-latency.sh <app> [ms]` | Slow backend | Adds `ms` (default 3000) of delay before every response |
| `inject-errors.sh <app> [rate]` | Elevated error rate | Randomly returns HTTP 500 at `rate` (0-1, default 0.5) |
| `memory-spike.sh <app> [mb]` | Memory leak / OOMKill | Retains `mb` (default 300) of heap until reset; pairs with the 256Mi container limit to trigger a real `OOMKilled` |
| `cpu-spike.sh <app> [seconds]` | CPU saturation | Blocks the Node.js event loop for `seconds` (default 10), spiking latency for every request that pod serves -- good for demonstrating HPA scale-out |
| `drop-db-connection.sh <app>` | DB connectivity loss | Forces `/readyz` to fail as if RDS were unreachable, without touching the database -- pods go `NotReady` and drop out of the Service |
| `kill-random-pod.sh <namespace>` | Pod crash | Deletes a random pod; the Deployment controller reschedules it immediately (self-healing demo, or run repeatedly to simulate a crash loop) |
| `scale-to-zero.sh <namespace> <deployment>` | Full outage | Scales a Deployment to 0 replicas |
| `bad-deploy.sh <namespace> <deployment> <container>` | Bad release | Points a container at a nonexistent image tag -- new pods sit in `ImagePullBackOff` while old pods keep serving until you roll back |
| `reset.sh <app>` | -- | Clears latency/error-rate/db-drop/memory chaos state on an app. Does **not** undo `kill-random-pod`, `scale-to-zero`, or `bad-deploy` -- those revert with plain `kubectl` (each script prints the exact command) |

The recommended workflow (see [docs/student-guide.md](docs/student-guide.md)
for the full version): pick or get assigned an incident from
[docs/incident-scenarios/](docs/incident-scenarios/), find it in your
Datadog dashboard *before* reaching for `kubectl`, use the matching runbook
in [docs/runbooks/](docs/runbooks/) if you get stuck, fix it, then write a
postmortem including how much error budget it burned
([docs/error-budget.md](docs/error-budget.md)).

## Observability: Datadog

Each student/user installs the Datadog Agent + Cluster Agent once via Helm
(`datadog/helm-values.yaml`) into their own free-trial account, with APM
and log collection enabled. Because every backend loads `dd-trace` as the
very first line executed, a single HTTP request is traceable
frontend -> backend -> Postgres in APM, and unified service tagging
(`env`/`service`/`version` as both pod labels and `DD_*` env vars) means a
trace, a log line, and a container metric for the same pod all correlate
automatically. Importable dashboards live in `datadog/dashboards/` (one per
app, plus `sre-lab-overview.json`), and importable monitors live in
`datadog/monitors/` (`high-error-rate`, `high-latency-p95`, `pod-restarts`,
`memory-saturation`). See [docs/student-guide.md](docs/student-guide.md)
sections 5-6 for the exact import steps, and
[docs/slo-sla-sli.md](docs/slo-sla-sli.md) for what SLI each dashboard is
actually measuring.

## Resource limits and why

Each namespace (`namespaces/<app>.yaml`) has its own `ResourceQuota` (e.g.
ecommerce: 1 CPU / 1Gi requested, 2 CPU / 2Gi limit, max 20 pods) and
`LimitRange` (per-container default 250m/256Mi, max 1 CPU/1Gi). This is
deliberate: real headroom would hide failure modes like pods stuck
`Pending` on quota or `OOMKilled` at a container limit, which are exactly
the failure modes this lab exists to practice diagnosing.

## Cost

This provisions a real EKS cluster, 2-5 `t3.medium` nodes, a NAT gateway,
and an RDS instance -- roughly **$150-250/month** if left running
continuously. Always run `./scripts/teardown.sh` when you're done for the
day; it deletes the Ingress resources first (so the shared ALB is released
cleanly by the AWS Load Balancer Controller), uninstalls Datadog, deletes
the app namespaces, and then runs
`terraform destroy`. Double-check the AWS console afterward for anything
orphaned (EC2 Load Balancers, NAT Gateways/EIPs, ECR repos, RDS) -- exact
checklist is printed at the end of the teardown script.

## What's deliberately simplified

This is a training lab, not a production reference architecture -- several
things are simplified on purpose to keep it cheap and easy for anyone to
stand up independently. Full rationale for each is in
[docs/architecture.md](docs/architecture.md#whats-deliberately-simplified-for-a-training-lab);
summary:

| Simplification | What production would do instead |
|---|---|
| One shared RDS instance for all 5 apps | One instance per app/environment |
| Plaintext password comparison for banking/student-portal demo login | bcrypt/argon2 hashing, real session management |
| One shared ALB (`IngressGroup`) across all 5 apps | One ALB per app/environment, plus AWS WAF attached |
| Chaos endpoints reachable over the public Ingress | Chaos hooks gated behind a separate internal-only port/network policy |
| Terraform state stored locally | Remote state (S3 + DynamoDB lock table) |
| No TLS on the Ingress | ACM certificate + HTTPS redirect |

## Further reading

- [docs/architecture.md](docs/architecture.md) -- full system diagram and design rationale
- [docs/student-guide.md](docs/student-guide.md) -- complete step-by-step walkthrough
- [docs/slo-sla-sli.md](docs/slo-sla-sli.md) -- SLI/SLO/SLA definitions with real per-app examples
- [docs/error-budget.md](docs/error-budget.md) -- how to calculate error budget burn from an incident
- [docs/runbooks/](docs/runbooks/) -- diagnostic playbooks (pod crash loops, OOMKill, high latency, DB connection exhaustion, ingress 502s, RDS connection limits)
- [docs/incident-scenarios/](docs/incident-scenarios/) -- six scripted incidents to practice on, plus an instructor answer key
