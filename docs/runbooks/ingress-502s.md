# Runbook: Ingress 502s / 503s

## Symptoms

- Browsing to `http://<app>.lab.local` returns a gateway error from nginx
  instead of the app itself. In this lab, a Service with **zero ready
  endpoints** (confirmed by testing) returns `503 Service Temporarily
  Unavailable`; a `502 Bad Gateway` specifically means nginx found an
  endpoint but the connection to it was refused or reset mid-request
  (e.g. the pod crashed between being marked ready and the request
  arriving). Both point to the same place to look.
- This is an `ingress-nginx` -> Service -> pod problem, not an
  application-code problem -- the app never got the request.

## Diagnostic commands

```bash
# Does the Service have any healthy endpoints at all?
kubectl -n <namespace> get endpoints <app>-frontend

# If empty, the Service has no ready pods to send traffic to -- check why
kubectl -n <namespace> get pods
kubectl -n <namespace> describe pod <pod>

# Check the ingress-nginx controller's own logs for the specific error
kubectl -n ingress-nginx logs deployment/ingress-nginx-controller --tail=100 | grep <app>

# Confirm the Ingress resource itself is pointing at the right Service/port
kubectl -n <namespace> get ingress <app> -o yaml
```

## Common root causes in this lab

- **Zero ready replicas** -- the most common cause. If every pod behind
  `<app>-frontend` is failing its readiness probe (or was just scaled to
  0), the Service has no endpoints and nginx returns 503 immediately.
- **Wrong port** in the Ingress or Service (`targetPort` not matching the
  container's actual listening port -- frontends in this lab listen on
  `8080`, backends on `4000`).
- **`ingress-nginx` controller itself down or mid-restart** -- rare, but
  check `kubectl -n ingress-nginx get pods` if *every* app 502s
  simultaneously.

## Fix

1. If the Service has zero endpoints because pods aren't ready, that's
   really a different runbook depending on *why* they're not ready --
   check `pod-crash-loop.md` or `db-connection-exhaustion.md` for the
   pod-level root cause.
2. If replicas were scaled to 0 (deliberately or by accident):
   ```bash
   kubectl -n <namespace> scale deployment/<app>-frontend --replicas=2
   ```
3. If the Ingress/Service port mapping is wrong, fix
   `apps/<app>/k8s/service-frontend.yaml` or
   `ingress/<app>-ingress.yaml` and reapply.

## Prevention

- Keep `minReplicas` on the HPA at 2 (already the default in this lab's
  `hpa-backend.yaml` pattern) so a single pod failure never drops a
  Service to zero endpoints.
- Alert on Service endpoint count, not just pod status, since "pods exist"
  and "pods are routable" are different facts.

## Reproduce this in the lab

```bash
scripts/chaos/scale-to-zero.sh <namespace> <app>-frontend
curl -o /dev/null -w "%{http_code}\n" http://<app>.lab.local/    # 503
kubectl -n <namespace> scale deployment/<app>-frontend --replicas=2
```
