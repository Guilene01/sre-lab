# Runbook: Database Connection Exhaustion

## Symptoms

- `/readyz` starts returning 503 on some or all backend pods.
- Application logs show `pg` errors like `sorry, too many clients already`
  or connection timeouts.
- Requests that touch the database start failing or hanging, while
  `/healthz` still returns 200 (the process is alive, it just can't reach
  Postgres).

## Diagnostic commands

```bash
# Is readiness actually failing, and why?
kubectl -n <namespace> get pods
curl http://<app>.lab.local/readyz

# Pool exhaustion is usually visible as a spike in open connections.
# From inside the cluster (RDS has no public access):
kubectl run pg-check --rm -i --restart=Never -n <namespace> \
  --image=postgres:17-alpine --env="PGPASSWORD=<app-db-password>" \
  --command -- psql -h <rds-address> -U <app-db-user> -d <app-db> \
  -c "SELECT count(*) FROM pg_stat_activity;"
```

In Datadog, check the app's dashboard `p95 Latency` and `Error Rate`
widgets -- a connection pool exhaustion event usually shows latency
climbing first (requests queueing for a free connection) before errors
spike.

## Common root causes in this lab

- Each backend's `pg.Pool` is capped at `max: 10` (see
  `apps/<app>/backend/src/db.js`). With 2 replicas that's 20 possible
  connections per app against a `db.t3.micro` RDS instance, which has a
  fairly low `max_connections` by default. A traffic spike or a slow query
  holding connections open can exhaust that quickly.
- A query that never releases its client back to the pool (missing
  `client.release()` in a code path that throws) will leak connections
  until the pool is fully consumed.

## Fix

1. Confirm it's actually connection exhaustion and not a full RDS outage
   (see `rds-connection-limit.md` if the instance itself is maxed out
   across *all* apps).
2. Restart the affected deployment to release leaked connections
   immediately:
   ```bash
   kubectl -n <namespace> rollout restart deployment/<app>-backend
   ```
3. If this is a recurring pattern, look for a missing `finally { client.release() }`
   around a `pool.connect()` call in `routes.js`.

## Prevention

- Always acquire/release pool clients with `try/finally`, as done in
  `ecommerce`'s and `banking`'s transactional endpoints
  (`apps/ecommerce/backend/src/routes.js`, `checkout` and `transfer`).
- Keep per-pod pool size deliberately small and scale pods horizontally
  instead of raising `max` per pod -- it's more predictable against a
  shared, size-limited RDS instance.
- Alert on RDS-level connection count, not just app-level errors, so you
  see the resource getting tight before requests start failing.

## Reproduce this in the lab

```bash
scripts/chaos/drop-db-connection.sh <app>
# readyz starts failing immediately; reset with:
curl -X POST http://<app>.lab.local/api/chaos/reset
```
