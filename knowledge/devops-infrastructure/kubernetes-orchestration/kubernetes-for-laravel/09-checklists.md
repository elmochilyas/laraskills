# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 05-kubernetes-orchestration
**Knowledge Unit:** kubernetes-for-laravel
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Laravel application containerized with production Dockerfile
- [ ] Kubernetes Deployments defined for web and queue worker pods
- [ ] Services and Ingress configured for traffic routing
- [ ] Migration Job pattern implemented (run via Job, not init container)
- [ ] HPA configured for autoscaling web pods based on CPU
- [ ] ConfigMaps and Secrets created for application configuration

---

# Architecture Checklist

- [ ] Stateless pod architecture designed (Laravel pods stateless, backed by shared services)
- [ ] Queue workers as separate Deployments (not part of web pods)
- [ ] Scheduler as CronJob with exit code handling
- [ ] Migration executed as Job (not init container) for reliability
- [ ] HPA for web vs KEDA for worker scaling designed
- [ ] Persistent storage for user uploads (S3 or EFS, not local PVC)

---

# Implementation Checklist

- [ ] `deployment.yaml` created for Laravel web app
- [ ] `service.yaml` created (ClusterIP for internal, LoadBalancer for external)
- [ ] `ingress.yaml` with TLS configuration (cert-manager)
- [ ] `migration-job.yaml` with proper backoff limit and restart policy
- [ ] `cronjob.yaml` for Laravel scheduler
- [ ] `hpa.yaml` configured for CPU-based autoscaling

---

# Performance Checklist

- [ ] PHP-FPM pm.max_children tuned per container memory limit
- [ ] OPcache configured for container environment (file_cache not writable)
- [ ] HPA min/max replicas set based on expected traffic
- [ ] Worker concurrency tuned per pod memory allocation
- [ ] Ingress controller resource limits configured

---

# Security Checklist

- [ ] Secrets created via `kubectl create secret` (not in ConfigMaps)
- [ ] ServiceAccounts scoped with RBAC for pod permissions
- [ ] NetworkPolicies defined for pod-to-pod traffic restrictions
- [ ] Pod SecurityContext set (non-root user, read-only root filesystem)
- [ ] Ingress TLS via cert-manager with Let's Encrypt

---

# Reliability Checklist

- [ ] Readiness probe configured (health check endpoint)
- [ ] Liveness probe configured (automatic pod restart on failure)
- [ ] Pod resource requests and limits set for all containers
- [ ] HPA min replicas >= 2 for production (HA)
- [ ] PodDisruptionBudget configured to prevent full outage during rolling updates
- [ ] Migration Job retry logic defined

---

# Testing Checklist

- [ ] Deployment applied to test namespace, pods start successfully
- [ ] Ingress routes traffic to Laravel service correctly
- [ ] Migration Job completes (creates tables, exits zero)
- [ ] CronJob runs scheduler command on schedule
- [ ] HPA scales up under load, scales down after

---

# Maintainability Checklist

- [ ] Kubernetes YAML manifests version-controlled
- [ ] Helm chart created (or Kustomize) for environment customization
- [ ] ConfigMap keys documented with purpose
- [ ] Deployment runbook created with common kubectl commands
- [ ] Resource requests/limits documented with rationale

---

# Anti-Pattern Prevention Checklist

- [ ] No init container for migrations (use Job to avoid pod startup failure)
- [ ] No `latest` image tag (use specific SHA or version)
- [ ] No hardcoded secrets in ConfigMaps
- [ ] No single replica production web pods
- [ ] No database connection from every pod without pooling

---

# Production Readiness Checklist

- [ ] Pod resource limits configured and tested
- [ ] Ingress TLS certificate issued and valid
- [ ] HPA min replicas >= 2, max set for budget
- [ ] PodDisruptionBudget >= 1
- [ ] Monitoring configured (kubectl top, Prometheus metrics)
- [ ] Rollback strategy via `kubectl rollout undo`

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: stateless pods, migration Job, separate workers
- [ ] Security requirements satisfied: Secrets, RBAC, NetworkPolicies, PodSecurityContext
- [ ] Performance requirements satisfied: HPA, worker tuning, OPcache configured
- [ ] Testing requirements satisfied: pods start, Job runs, Ingress routes, CronJob fires
- [ ] Anti-pattern checks passed: no init-container migrations, no latest tag, HA pods
- [ ] Production readiness verified: monitoring, PDB, rollback, resource limits set

---

# Related References

- Production Dockerfiles (KU-010) -- building K8s-compatible images
- FrankenPHP Standalone (KU-012) -- single-container K8s deployment
- Laravel Vapor (KU-015) -- serverless vs K8s deployment comparison
- Database Migration in CI (KU-019) -- migration Job pattern
- Environment & Secret Management (KU-021) -- secrets in K8s
- Laravel Cloud (KU-016) -- built on K8s, managed alternative
