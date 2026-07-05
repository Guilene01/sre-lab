# Runbook: Pod Crash Loop

## Symptoms

- `kubectl get pods` shows a pod cycling through `CrashLoopBackOff`.
- Datadog: the `[SRE Lab] Pod restarts detected` monitor fires for a
  `kube_deployment`.
- Requests to the affected app may 502 intermittently as the Service
  briefly loses endpoints each time the pod dies and gets recreated.

## Diagnostic commands

```bash
# Which pod, how many restarts, current status
kubectl -n <namespace> get pods

# Why did it die -- check both the current and previous container logs
kubectl -n <namespace> logs <pod> --previous
kubectl -n <namespace> logs <pod>

# Full event history for the pod: OOMKilled? failed liveness probe? image pull error?
kubectl -n <namespace> describe pod <pod>

# In Datadog: filter logs by service and look for the last line before the crash
# service:<app>-backend
```

## Common root causes in this lab

- **Unhandled exception on startup** -- e.g. a bad `DATABASE_URL`/PG* env
  var causes the `pg` pool to throw before the server binds a port.
- **Liveness probe misconfigured** -- if `/healthz` depended on the
  database (it deliberately doesn't in this lab -- see
  `docs/architecture.md`), a slow DB would kill otherwise-healthy pods.
- **OOMKilled** -- check `describe pod` for `Reason: OOMKilled`; if so,
  this is really the OOMKill runbook (`oomkill.md`), not a code bug.

## Fix

1. Read the crash reason from `describe pod` and `logs --previous` first --
   don't guess.
2. If it's a bad config/secret, fix the Secret/ConfigMap and roll the
   deployment:
   ```bash
   kubectl -n <namespace> rollout restart deployment/<deployment>
   ```
3. If it's a bad image/code change, roll back:
   ```bash
   kubectl -n <namespace> rollout undo deployment/<deployment>
   ```

## Prevention

- Keep `/healthz` liveness-only (process up) and `/readyz` for dependency
  checks, so a flaky dependency pulls the pod out of the Service instead of
  killing it repeatedly.
- Set `readinessProbe.failureThreshold` high enough to tolerate a brief
  blip but low enough to catch a real outage (this lab uses 3 x 10s = 30s).
- Alert on restart *count* over a window (see
  `datadog/monitors/pod-restarts.json`), not on a single restart, to avoid
  paging on a one-off scheduler eviction.

## Reproduce this in the lab

```bash
scripts/chaos/bad-deploy.sh <namespace> <deployment> <container>
# watch it fail, then:
kubectl -n <namespace> rollout undo deployment/<deployment>
```
