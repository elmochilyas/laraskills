# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 05-kubernetes-orchestration
**Knowledge Unit:** kubernetes-laravel
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Kubernetes resource definitions created (Deployments, Services, Ingress, ConfigMaps, Secrets)
- [ ] Migration Job pattern implemented (tracked via commit SHA, not init container)
- [ ] HPA configured for web autoscaling (CPU-based)
- [ ] KEDA configured for queue worker autoscaling (queue-depth-based)
- [ ] CronJob defined for Laravel scheduler with exit code handling
- [ ] GitOps deployment evaluated (ArgoCD or Flux)

---

# Architecture Checklist

- [ ] K8s resource model designed for Laravel (stateless pods, shared backing services)
- [ ] Migration execution strategy determined (Job, tracked by commit SHA)
- [ ] Web autoscaling via HPA (CPU-based)
- [ ] Worker autoscaling via KEDA (queue-depth) + HPA (memory-based)
- [ ] CronJob scheduler with exit code handling (non-zero = alert)
- [ ] Ingress controller selected with cert-manager TLS
- [ ] GitOps deployment model evaluated (ArgoCD/Flux for declarative deploys)

---

# Implementation Checklist

- [ ] `laravel-deployment.yaml` with probes, resources, env
- [ ] `service.yaml` with appropriate type (ClusterIP for web)
- [ ] `ingress.yaml` with TLS configuration
- [ ] `migration-job.yaml` with backoffLimit and SHA-based tracking
- [ ] `keda-scaledobject.yaml` for queue worker autoscaling
- [ ] `cronjob-schedule.yaml` for artisan schedule:run

---

# Performance Checklist

- [ ] HPA CPU target set appropriately (60-80% target utilization)
- [ ] KEDA queue length threshold tuned (e.g., scale at 10 backlogged jobs)
- [ ] Worker memory-based HPA configured (alert at 80% memory)
- [ ] PHP-FPM workers per pod calculated based on memory limit
- [ ] Requests and limits set for all containers to avoid resource starvation

---

# Security Checklist

- [ ] Secrets in K8s Secrets (not ConfigMaps)
- [ ] ServiceAccount with minimal RBAC permissions
- [ ] NetworkPolicies restricting pod-to-pod traffic
- [ ] Pod SecurityContext (non-root, read-only filesystem)
- [ ] Ingress TLS with cert-manager auto-renewal

---

# Reliability Checklist

- [ ] Readiness and liveness probes configured for all Deployments
- [ ] PodDisruptionBudget >= 1 for web Deployment
- [ ] HPA min replicas >= 2 for production
- [ ] Migration Job retry limit configured (backoffLimit: 3)
- [ ] CronJob concurrency policy set (Forbid to prevent overlap)

---

# Testing Checklist

- [ ] All manifests applied to test namespace, pods ready
- [ ] Migration Job runs and exits 0
- [ ] KEDA ScaledObject triggers worker scale-up
- [ ] Ingress routes traffic with valid TLS
- [ ] Rollout undo tested (`kubectl rollout undo deployment`)

---

# Maintainability Checklist

- [ ] Manifests version-controlled in `k8s/` directory
- [ ] Helm chart or Kustomize overlay configured for envs
- [ ] ConfigMaps documented with key purpose
- [ ] Resource tuning documented (HPA targets, KEDA thresholds)
- [ ] GitOps config (ArgoCD Application) documented if used

---

# Anti-Pattern Prevention Checklist

- [ ] No init container for database migrations
- [ ] No `latest` image tags
- [ ] No secrets in ConfigMaps
- [ ] No single-replica production deployments
- [ ] No CronJob overlap (concurrencyPolicy)

---

# Production Readiness Checklist

- [ ] Resource limits set and verified under load
- [ ] Ingress TLS valid and auto-renewing
- [ ] PDB configured for HA
- [ ] HPA min >= 2 replicas
- [ ] Prometheus metrics exported for all pods
- [ ] Rollback tested via `kubectl rollout undo`

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: K8s resource model, Migration Job, GitOps evaluated
- [ ] Security requirements satisfied: Secrets, RBAC, NetworkPolicies, PodSecurityContext
- [ ] Performance requirements satisfied: HPA, KEDA, worker tuning configured
- [ ] Testing requirements satisfied: Job runs, HPA scales, Ingress routes, Cron fires
- [ ] Anti-pattern checks passed: no init migrations, no latest tag, HA pods
- [ ] Production readiness verified: PDB, monitoring, rollback, TLS auto-renewal

---

# Related References

- Production Dockerfiles (container images)
- FrankenPHP (single-container K8s)
- Database Migration CI (migration patterns)
- Environment Secrets (K8s Secrets management)
