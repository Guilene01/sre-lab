# Runbook: RDS Connection Limit Hit

## Symptoms

- **Multiple apps** (not just one) start failing `/readyz` or throwing `pg`
  connection errors at the same time -- the tell-tale sign this is the
  shared RDS instance itself, not one app's pool.
- New connections from any app hang or are refused.

## Diagnostic commands

```bash
# From inside the cluster, check total connections and the limit
kubectl run pg-check --rm -i --restart=Never -n ecommerce \
  --image=postgres:17-alpine --env="PGPASSWORD=<master-password>" \
  --command -- psql -h <rds-address> -U <rds-master-user> -d postgres \
  -c "SHOW max_connections;" \
  -c "SELECT count(*) FROM pg_stat_activity;" \
  -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname ORDER BY 2 DESC;"
```

That last query tells you which app's database is holding the most
connections -- your starting point for figuring out which app to restart or
throttle first.

## Common root causes in this lab

- This is the direct consequence of the architecture decision documented
  in `docs/architecture.md`: **one shared `db.t3.micro` instance backs all
  five apps.** `db.t3.micro` has a modest default `max_connections`. Five
  apps x 2 replicas x a pool of 10 each is already a meaningful fraction
  of that ceiling under normal load, before any single app misbehaves.
- One app leaking connections (see `db-connection-exhaustion.md`) can
  starve every other app of connections too, since they all share the same
  instance-level limit.

## Fix

1. Identify the worst offender with the `GROUP BY datname` query above.
2. Restart that app's backend deployment to force its connections closed:
   ```bash
   kubectl -n <offending-app> rollout restart deployment/<app>-backend
   ```
3. If no single app is dominant and the whole instance is just under
   sustained load, this is a capacity problem, not a bug -- see Prevention.

## Prevention

- In production, this is the strongest argument for per-app (or
  per-environment) RDS instances rather than one shared instance -- see
  the tradeoff table in `docs/architecture.md`.
- Keep per-pod pool sizes small and let Kubernetes scale pods
  horizontally rather than growing per-pod pool size.
- Consider a connection pooler (RDS Proxy or PgBouncer) in front of the
  instance if you must share it across many clients -- it multiplexes many
  app-level connections onto fewer real Postgres backends.
- Alert on RDS connection count as a percentage of `max_connections`, not
  just on individual app error rates.

## Reproduce this in the lab

There's no single chaos script for this one -- it's a systemic scenario
that needs real connections held open against the shared instance, not
just an app-level toggle. See the instructor setup for
`docs/incident-scenarios/06-the-noisy-neighbor.md` (in
`instructor-answer-keys.md`) for a ready-to-run version that opens 30
idle-in-transaction connections across two apps' databases.
