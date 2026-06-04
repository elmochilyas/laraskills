# Kubernetes Laravel

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Kubernetes Orchestration
- **Knowledge Unit:** Kubernetes Laravel
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Kubernetes Laravel covers the detailed patterns for deploying and managing Laravel on Kubernetes including K8s resource definitions, migration Job patterns, autoscaling strategies (HPA, KEDA), worker scaling, CronJob scheduler, and GitOps deployments. These patterns handle PHP-specific concerns like migration ordering, OPcache across pod restarts, and queue worker management.

---

## Core Concepts

- **K8s Resource Model** — Deployments, Services, Ingress, ConfigMaps, Secrets, Jobs, CronJobs
- **Migration Job Pattern** — Running migrations as batch Jobs with commit SHA tracking to prevent re-execution
- **HPA Autoscaling** — CPU/metrics-based web pod scaling for stateless Laravel containers
- **KEDA Worker Scaling** — Queue-depth-based worker autoscaling using event-driven metrics
- **CronJob Scheduler** — Laravel scheduler as CronJob running `php artisan schedule:run`

---

## Mental Models

- **Migration as One-Time Job** — Database migrations are batch operations that must run exactly once between releases. Use Jobs with tracking, not init containers that run on every pod start.
- **Worker per Queue** — Each queue connection (default, notifications, emails) should be a separate Deployment with its own scaling configuration. Different queues have different throughput requirements.
- **Scheduler as CronJob** — The Laravel scheduler (`schedule:run`) runs as a CronJob in Kubernetes, not as a long-running process. It triggers queued tasks that workers execute.

---

## Internal Mechanics

The deployment flow: a new Docker image is pushed to the registry. ArgoCD detects the change and syncs the Git repository with the cluster state. The Deployment rolling update replaces pods with the new image. A migration Job is triggered (either manually or via a pipeline) that runs `php artisan migrate --force` against the shared database. HPA monitors pod CPU/memory and adjusts replica count. KEDA monitors queue depth (SQS, Redis) and scales worker Deployments accordingly. The CronJob runs `php artisan schedule:run` every minute, which dispatches scheduled tasks to the queue.

---

## Patterns

- **Helm for Packaging** — Helm charts parameterize K8s manifests for different environments (dev, staging, production) with environment-specific values
- **GitOps with ArgoCD** — Declarative deployment with automated sync ensures cluster state matches repository state; manual kubectl changes are reverted
- **Migration Tracking** — Record last successful migration commit SHA to prevent re-execution across pod restarts
- **Graceful Shutdown** — Configure `terminationGracePeriodSeconds` and handle SIGTERM to allow in-flight requests to complete
- **Pod Disruption Budgets** — Prevent too many pods from being terminated simultaneously during updates or node maintenance

---

## Architectural Decisions

- **HPA vs. KEDA** — Use HPA for web pods (request volume correlates with CPU); use KEDA for worker pods (queue depth is the primary scaling metric)
- **Helm vs. Kustomize** — Use Helm for packaged, parameterized deployments; use Kustomize for environment-specific overlays without templating
- **Ingress Controller** — Choose NGINX Ingress for standard routing; choose Traefik or Istio for advanced traffic management (canary, circuit breaking)

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Automated deployment via GitOps | ArgoCD operational overhead | Requires GitOps tool maintenance |
| Queue-depth-based worker scaling | KEDA infrastructure maintenance | Additional CRDs and operators to manage |
| Environment consistency via Helm charts | Chart template complexity | Debugging template rendering is challenging |
| Migration tracking prevents duplicate execution | Migration Job orchestration | CI/CD must trigger Job and verify completion |

---

## Performance Considerations

Helm chart complexity can increase deployment time. Migration Jobs should be tested with production-like data volume to catch performance issues before production. KEDA scaling has a lag time based on queue depth polling interval. Pod startup time for Octane workers includes application boot. Resource requests and limits must be tuned per application profile using monitoring data.

---

## Production Considerations

Use separate namespaces for environment isolation. Configure network policies to restrict pod-to-pod communication. Implement PodDisruptionBudgets for all critical workloads. Store secrets in Kubernetes Secrets or external vault (HashiCorp Vault, AWS Secrets Manager). Use HorizontalPodAutoscaler with custom metrics for web scaling. Use KEDA with `scaledObjects` for worker scaling. Implement liveness, readiness, and startup probes on all pods.

---

## Common Mistakes

- **Migrations in Init Containers** — Init containers run on every pod start, not just on deployment. Use Jobs for one-time migration execution.
- **No Migration Tracking** — Without commit SHA tracking, the migration Job runs on every deployment, attempting to re-apply already-executed migrations.
- **Worker Deployments Without HPA/KEDA** — Workers run at fixed replica count, unable to handle queue backlogs or wasting resources during idle periods.
- **Missing Graceful Shutdown** — Pods are terminated without allowing in-flight requests to complete, causing user-facing errors.

---

## Failure Modes

- **Migration Job Failure** — Database migration fails, leaving schema in inconsistent state. Detection: Job pod reports error. Mitigation: implement retry logic, verify migration compatibility in CI.
- **KEDA Scaler Not Connected** — KEDA cannot connect to queue (SQS, Redis) for depth metrics. Detection: worker pods not scaling in response to queue growth. Mitigation: verify KEDA configuration, monitor KEDA operator health.
- **CronJob Overlap** — Previous `schedule:run` iteration not finished before next one starts. Detection: overlapping CronJob executions. Mitigation: ensure CronJob concurrency policy is set to `Forbid`.
- **ArgoCD Sync Failure** - Configuration drift causes sync failure. Detection: ArgoCD reports out-of-sync. Mitigation: revert manual changes, investigate drift cause.

---

## Ecosystem Usage

Kubernetes Laravel patterns are used by organizations running Laravel at scale on K8s clusters. Laravel Cloud (EKS-based) uses these patterns internally. Helm charts for Laravel are available from the community and can be customized per project. GitOps with ArgoCD is the recommended deployment approach. KEDA is the standard for event-driven worker scaling. Octane is preferred over PHP-FPM for K8s due to better resource efficiency.

---

## Related Knowledge Units

### Prerequisites
- Kubernetes basics

### Related Topics
- Production Dockerfiles
- KEDA
- Helm

### Advanced Follow-up Topics
- Service Mesh
- GitOps
- Custom Metrics Autoscaling

---

## Research Notes

K8s Laravel deployments require specific patterns. Use Jobs for migrations, not init containers. Implement migration tracking to prevent duplicate execution. Use KEDA for queue-based worker scaling, not CPU-based HPA. Helm charts standardize environment-specific configuration. GitOps with ArgoCD provides declarative, auditable deployments. Always configure graceful shutdown and PodDisruptionBudgets.
