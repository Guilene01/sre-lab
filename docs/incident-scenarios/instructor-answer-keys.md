# Instructor Answer Keys

**Do not share this file with students before they've attempted the
exercises in `docs/incident-scenarios/`.** Each section below gives the
exact setup command to trigger the incident, the expected diagnosis path,
the fix, and what to listen for in the student's postmortem.

---

## 1. The Silent Checkout (ecommerce)

**Setup (run before students start):**
```bash
scripts/chaos/inject-latency.sh ecommerce 4000
scripts/chaos/inject-errors.sh ecommerce 0.2
```

**Expected diagnosis path:** Student notices p95 latency and error rate
both elevated on the ecommerce dashboard, confirms by placing an order
(slow, sometimes fails), checks `GET /api/chaos` and sees
`latencyMs: 4000, errorRate: 0.2`.

**Fix:** `curl -X POST http://ecommerce.lab.local/api/chaos/reset`

**Grading -- listen for:**
- Did they check the dashboard *before* guessing at code?
- Did they distinguish "latency" from "error rate" as two separate
  signals, not one blob of "it's broken"?
- Postmortem prevention idea should mention alerting thresholds or a
  canary/synthetic check catching this before customers report it.

---

## 2. Payday Panic (banking)

**Setup:**
```bash
scripts/chaos/drop-db-connection.sh banking
```

**Expected diagnosis path:** Login may still succeed (auth doesn't hit the
DB-dependent readiness path directly, but dashboard calls will fail once
readiness fails and the pod is pulled from the Service, or requests to
the affected pod return 503 from `/readyz`-gated logic if checked
directly). Student runs `curl http://banking.lab.local/readyz`, sees
`503` with `reason: db connection dropped (chaos)`, checks
`kubectl -n banking get pods` and sees pods go `0/1 Ready` after the
readiness probe's `failureThreshold` is exceeded (~30s).

**Fix:** `curl -X POST http://banking.lab.local/api/chaos/reset`

**Grading -- listen for:**
- Did they check `/readyz` specifically, rather than just restarting
  pods blindly?
- Postmortem should correctly explain that `/healthz` (liveness) stayed
  green throughout -- the process never crashed, only its dependency
  check failed -- and that this is *why* the app has two separate
  endpoints instead of one.

---

## 3. The Stuck Order (food-delivery)

**Setup:**
```bash
kubectl -n food-delivery scale deployment food-delivery-redis --replicas=0
```

**Expected diagnosis path:** Student notices food-delivery has a
component the other four apps don't (Redis, per `docs/architecture.md`).
`kubectl -n food-delivery get pods` shows no `food-delivery-redis` pod.
Order status calls will error (the backend's `ioredis` client will throw
or time out since `maxRetriesPerRequest: 2` in
`apps/food-delivery/backend/src/cache.js`), surfacing as 500s from
`GET /api/orders/:id/status`.

**Fix:**
```bash
kubectl -n food-delivery scale deployment food-delivery-redis --replicas=1
```

**Grading -- listen for:**
- Did they identify Redis specifically as the missing piece, not just
  "something's broken in food-delivery"?
- Discussion point worth drawing out live: `/readyz` in this app
  deliberately only checks Postgres, not Redis (see
  `apps/food-delivery/backend/src/index.js`) -- is that the right scope,
  given Redis here is just a cache and the DB is the source of truth? A
  good answer notes the tradeoff: readiness gating on Redis too would
  pull pods out of rotation for a cache outage that degrades (not breaks)
  functionality, which may be worse than serving slightly-stale/slower
  responses.

---

## 4. Grades Gone Missing (student-portal)

**Setup:**
```bash
scripts/chaos/bad-deploy.sh student-portal student-portal-backend student-portal-backend
```

**Expected diagnosis path:** `kubectl -n student-portal get pods` shows a
mix of `Running` (old ReplicaSet) and `ImagePullBackOff` (new
ReplicaSet) pods -- this is why the symptom is intermittent rather than a
total outage: the Service still has some ready (old) endpoints.
`kubectl -n student-portal rollout status deployment/student-portal-backend`
shows the rollout stuck, waiting for new pods that will never become
ready.

**Fix:** `kubectl -n student-portal rollout undo deployment/student-portal-backend`

**Grading -- listen for:**
- Did they check `describe pod` on the failing pod and see the actual
  `ImagePullBackOff` / `ErrImagePull` reason, rather than assuming a code
  bug?
- Postmortem should explain the *partial* outage is a direct consequence
  of `RollingUpdate`'s default `maxUnavailable`/`maxSurge` -- old pods
  aren't torn down until enough new ones are ready, which is a safety
  feature here, not a bug.

---

## 5. The Midnight Memory Leak (support-tickets)

**Setup:**
```bash
scripts/chaos/memory-spike.sh support-tickets 300
```

**Expected diagnosis path:** One pod OOMKills within moments of the
command (container limit is 256Mi, requested spike is 300MB). Kubernetes
immediately restarts it, which comes back healthy and *without* the
chaos state (in-memory state resets on restart) -- hence "resolves
itself." `kubectl -n support-tickets get pods` shows `RESTARTS: 1` (or
more, if run multiple times) on one pod specifically, not both replicas.
`describe pod` shows `Last State: Terminated, Reason: OOMKilled`.

**Fix:** Nothing to actively fix once it's restarted on its own -- the
point of this scenario is recognizing that a "self-healing" symptom
still needs a root-cause writeup, because next time it might not recover
cleanly (e.g. if it OOMKills mid-request repeatedly under real load
rather than a one-off spike).

**Grading -- listen for:**
- Did they check restart count and `describe pod`, or did they declare
  victory as soon as the app "looked fine again"?
- Postmortem should explicitly call out the risk of alert fatigue /
  under-investigating self-resolving incidents, and mention the
  `[SRE Lab] Memory saturation approaching container limit` monitor as
  the thing that should have paged *before* the OOMKill happened, not
  after.

---

## 6. The Noisy Neighbor (ecommerce + banking, shared RDS instance)

**Setup (run before students start):** unlike the other 5 scenarios, this
one isn't a single `scripts/chaos/*.sh` call -- it opens real Postgres
connections and holds them idle-in-transaction, to genuinely move
`pg_stat_activity` counts on the shared instance rather than just
toggling in-app state.

```bash
RDS_ADDRESS=$(cd terraform && terraform output -raw rds_address)

for app in ecommerce banking; do
  DB_USER=$(kubectl -n "$app" get secret "${app}-db-credentials" -o jsonpath='{.data.PGUSER}' | base64 -d)
  DB_NAME=$(kubectl -n "$app" get secret "${app}-db-credentials" -o jsonpath='{.data.PGDATABASE}' | base64 -d)
  DB_PASS=$(kubectl -n "$app" get secret "${app}-db-credentials" -o jsonpath='{.data.PGPASSWORD}' | base64 -d)
  for i in $(seq 1 15); do
    kubectl run "hog-${app}-${i}" --rm -i --restart=Never -n "$app" \
      --image=postgres:17-alpine --env="PGPASSWORD=${DB_PASS}" \
      --command -- psql -h "$RDS_ADDRESS" -U "$DB_USER" -d "$DB_NAME" \
      -c "BEGIN; SELECT pg_sleep(600);" &
  done
done
```

This holds 30 idle-in-transaction connections (15 per app) against a
`db.t3.micro` instance's modest `max_connections` ceiling for 10 minutes,
on top of the 5 apps' normal pool traffic -- enough that ecommerce and
banking (and potentially others) start seeing connection
timeouts/`/readyz` failures at the same time. If you need to cut it short:
```bash
for app in ecommerce banking; do
  kubectl -n "$app" get pods -o name | grep hog- | xargs -r kubectl -n "$app" delete
done
```

**Expected diagnosis path:** Student notices *both* ecommerce and banking
have trouble at once (not the single-app pattern from "Payday Panic"),
which is the tell this is instance-level, not app-level. Runs the
`rds-connection-limit.md` diagnostic query, sees `ecommerce_db` and
`banking_db` each holding ~15 more connections than normal. Digging into
`pg_stat_activity`'s `query` and `state` columns (not just the count)
shows a wall of `state = idle in transaction`, `query: SELECT pg_sleep(600)`
rows with an old `query_start` -- the signature of a hung transaction, not
legitimate app traffic (the app's own pool never runs `pg_sleep`).

**Fix:**
```bash
kubectl run pg-fix --rm -i --restart=Never -n ecommerce \
  --image=postgres:17-alpine --env="PGPASSWORD=<master-password>" \
  --command -- psql -h <rds-address> -U <rds-master-user> -d postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND query LIKE '%pg_sleep%';"
```
(Or, since this is a simulated lab, just delete the `hog-*` pods per the
"cut it short" command above -- either kills the same underlying
connections.)

**Grading -- listen for:**
- Did they check *every* app instead of only the one they were paged for,
  and recognize "more than one app, same time" as the signature of a
  shared-resource problem rather than coincidence?
- Did they look at what the connections were actually doing
  (`state`/`query`/`query_start`), not just the raw count -- the fix is
  different for "legitimate but heavy traffic" versus "one hung
  transaction," and you can't tell which without looking?
- Postmortem should explain why restarting ecommerce's or banking's own
  Deployment would do nothing here (the culprit connections don't belong
  to either app's backend pods at all), and should connect this back to
  the shared-RDS tradeoff in `docs/architecture.md` -- this is the
  concrete incident that tradeoff predicts.
