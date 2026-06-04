# Decomposition: Kubernetes for Laravel

## Topic Overview
Deploying Laravel on Kubernetes involves containerizing the application, defining Kubernetes resources (Deployments, Services, Ingress, ConfigMaps, Secrets), and configuring supporting workloads (queue workers as separate Deployments, scheduler as CronJob, HPA for autoscaling). The compute model is stateless application pods backed by shared Redis and database services. Key challenges include migration execution (via Job, not init container), worker memory-based autoscaling, and persistent storage for user uploads.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
kubernetes-for-laravel/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Kubernetes for Laravel
- **Purpose:** Deploying Laravel on Kubernetes involves containerizing the application, defining Kubernetes resources (Deployments, Services, Ingress, ConfigMaps, Secrets), and configuring supporting workloads (queue workers as separate Deployments, scheduler as CronJob, HPA for autoscaling).
- **Difficulty:** Intermediate
- **Dependencies:** Production Dockerfiles (KU-010) — building K8s-compatible images, FrankenPHP Standalone (KU-012) — single-container K8s deployment, Laravel Vapor (KU-015) — serverless vs K8s deployment comparison, Database Migration in CI (KU-019) — migration Job pattern, Environment & Secret Management (KU-021) — secrets in K8s, Laravel Cloud (KU-016) — built on K8s, managed alternative

## Dependency Graph
**Depends on:**
- Production Dockerfiles (KU-010) — building K8s-compatible images
- FrankenPHP Standalone (KU-012) — single-container K8s deployment
- Laravel Vapor (KU-015) — serverless vs K8s deployment comparison
- Database Migration in CI (KU-019) — migration Job pattern
- Environment & Secret Management (KU-021) — secrets in K8s
- Laravel Cloud (KU-016) — built on K8s, managed alternative

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Stateless pods, stateful backing services:** Laravel pods are stateless — they
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- Production Dockerfiles (KU-010) — building K8s-compatible images, FrankenPHP Standalone (KU-012) — single-container K8s deployment, Laravel Vapor (KU-015) — serverless vs K8s deployment comparison, Database Migration in CI (KU-019) — migration Job pattern, Environment & Secret Management (KU-021) — secrets in K8s, Laravel Cloud (KU-016) — built on K8s, managed alternative

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization