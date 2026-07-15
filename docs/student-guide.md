# Student Guide

Welcome to the SRE lab. You'll deploy five real applications to a shared
Kubernetes cluster, wire up your own Datadog account to observe them, then
deliberately break things and practice diagnosing and fixing them like an
on-call engineer would.

## 1. Prerequisites

- `terraform`, `aws` CLI (configured with credentials for the lab AWS
  account), `kubectl`, `docker`, and `helm` installed locally.
- A GitHub/email account to sign up for Datadog with.

## 2. Create your own Datadog account

Each student uses their **own** free Datadog trial -- there is no shared
account, and nothing in this repo contains a real API key.

1. Go to [datadoghq.com](https://www.datadoghq.com/) and start a free
   trial.
2. Once logged in, go to **Organization Settings > API Keys** and copy
   your API key.
3. (Optional, needed only for the Datadog Terraform provider or advanced
   API calls, not required for this lab) find your **Application Key**
   under **Organization Settings > Application Keys**.

## 3. Deploy the lab

From the repo root:

```bash
# 1. Provision AWS infrastructure, build/push images, deploy all 5 apps
./scripts/setup.sh
```

This runs `terraform apply`, configures `kubectl`, builds and pushes all
10 container images to ECR, provisions a database + least-privilege user
per app on the shared RDS instance, deploys every app, and installs the
AWS Load Balancer Controller. It prints an ALB hostname at the end -- keep
that handy for the next step. Expect this to take 15-20 minutes, mostly
waiting on the EKS cluster and ALB to come up.

## 4. Point your browser at the apps

All five apps share one ALB (routed by hostname). There's no manual DNS or
hosts-file step: `setup.sh` resolves the ALB's real IP itself and builds
URLs on [sslip.io](https://sslip.io), a public wildcard DNS service where
any hostname of the form `<name>.<ip-with-dots-replaced-by-dashes>.sslip.io`
resolves straight to that IP. At the end of its run, `setup.sh` prints the
five ready-to-use URLs -- something like
`http://ecommerce.<your-lab-domain>` for each app, where `<your-lab-domain>`
is your own ALB IP written in `sslip.io` form.

That domain suffix is also written to `.lab-domain` in the repo root, which
the chaos scripts under `scripts/chaos/` read automatically. If you lose
the `setup.sh` output, reprint it any time:

```bash
cat .lab-domain
# or build a specific app's URL directly:
echo "http://ecommerce.$(cat .lab-domain)"
```

Now visit each app in your browser, substituting your own domain suffix
for `<your-lab-domain>`:

- http://ecommerce.\<your-lab-domain>
- http://banking.\<your-lab-domain>
- http://food-delivery.\<your-lab-domain>
- http://student-portal.\<your-lab-domain>
- http://support-tickets.\<your-lab-domain>

Demo login credentials (banking and student-portal) use password
`demo123` -- see each app's `sql/init.sql` for the exact usernames.

## 5. Install the Datadog Agent

```bash
kubectl create namespace datadog

kubectl create secret generic datadog-secret \
  --namespace datadog \
  --from-literal api-key=<your-datadog-api-key>

helm repo add datadog https://helm.datadoghq.com
helm repo update

helm install datadog datadog/datadog \
  --namespace datadog \
  -f datadog/helm-values.yaml
```

Give it a minute, then confirm the agent is reporting:

```bash
kubectl -n datadog get pods
```

In the Datadog UI, go to **APM > Traces** and browse one of the apps
(e.g. add a product to your ecommerce cart) -- you should see a trace
appear within a few seconds, spanning frontend -> backend -> Postgres.

## 6. Import the dashboards and monitors

Dashboards (repeat for each file in `datadog/dashboards/`):

1. In Datadog, go to **Dashboards > New Dashboard**.
2. Click the gear icon (top right) > **Import Dashboard JSON**.
3. Paste the contents of the file and save.

Monitors (repeat for each file in `datadog/monitors/`) -- there's no
JSON-import button for monitors in the UI, so create them via the API
with your API and Application key:

```bash
curl -X POST "https://api.datadoghq.com/api/v1/monitor" \
  -H "Content-Type: application/json" \
  -H "DD-API-KEY: <your-api-key>" \
  -H "DD-APPLICATION-KEY: <your-app-key>" \
  -d @datadog/monitors/high-error-rate.json
```

## 7. Task list

Work through these roughly in order. Take notes as you go -- you'll need
them for the postmortems.

1. **Deploy.** Complete steps 3-6 above. Confirm all five apps load and
   you can complete one real user action in each (add to cart and check
   out in ecommerce, log in and check a balance in banking, place an
   order in food-delivery, view grades in student-portal, file a ticket
   in support-tickets).
2. **Observe baseline.** Open each app's Datadog dashboard
   (`datadog/dashboards/<app>.json`) and the `SRE Lab Overview` dashboard
   with everything healthy. This is what "normal" looks like -- you'll
   need it for comparison later.
3. **Break something.** Pick an incident from `docs/incident-scenarios/`
   (or ask your instructor to trigger one) without reading the answer
   key.
4. **Observe in Datadog.** Find the incident in your dashboards before
   you go looking at `kubectl` -- which widget moved first, and by how
   much?
5. **Diagnose.** Use the relevant runbook in `docs/runbooks/` if you get
   stuck, but try the diagnostic commands yourself first.
6. **Fix it**, then confirm recovery in both the app itself and the
   Datadog dashboard (metrics take a minute or two to reflect the fix).
7. **Write a postmortem** for the incident: what broke, how you found it,
   how you fixed it, how much error budget it burned (see
   `docs/error-budget.md` for the calculation method), and one concrete
   prevention step.
8. **Repeat** with a different incident scenario, then try triggering one
   yourself directly with the scripts in `scripts/chaos/` and writing your
   own scenario for a classmate.

## 8. Tear down

When you're done, avoid leaving the lab running (it costs real money):

```bash
./scripts/teardown.sh
```

Then double-check the AWS console for anything orphaned (see the output
of `teardown.sh` for exactly what to check).
