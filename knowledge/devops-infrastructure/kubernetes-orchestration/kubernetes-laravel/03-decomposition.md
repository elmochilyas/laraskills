# Decomposition: Kubernetes Laravel

## Topic Overview
Deploying and managing Laravel applications on Kubernetes. Covers K8s resource definitions (Deployments, Services, Ingress, ConfigMaps, Secrets), migration Job pattern, autoscaling (HPA, KEDA), worker scaling, CronJob scheduler, and managed K8s platform considerations.

## Decomposition Strategy
1. **K8s resource model for Laravel** — Deployments, Services, Ingress, ConfigMaps, Secrets
2. **Migration Job pattern** — running migrations as batch Job; tracking via commit SHA
3. **Autoscaling web** — HPA based on CPU for web Deployments
4. **Autoscaling workers** — KEDA for queue-depth-based scaling; HPA for memory-based
5. **CronJob scheduler** — Laravel scheduler as K8s CronJob; exit code handling
6. **Networking** — Ingress controller, Service types, cert-manager TLS
7. **GitOps deployments** — ArgoCD/Flux for declarative, automated deployments

## Proposed Folder Structure
```
kubernetes-orchestration/
├── kubernetes-laravel/
│   ├── 01-knowledge-unit.md  (KU definition)
│   ├── 02-knowledge-unit.md  (detailed knowledge)
│   ├── 03-decomposition.md   (this file)
│   ├── 04-standardized-knowledge.md
│   └── templates/
│       ├── laravel-deployment.yaml
│       ├── migration-job.yaml
│       ├── keda-scaledobject.yaml
│       ├── cronjob-schedule.yaml
│       └── helm-values.example.yaml
├── kubernetes-for-laravel/
│   ├── 02-knowledge-unit.md
│   ├── 03-decomposition.md
│   └── 04-standardized-knowledge.md
```

## Knowledge Unit Inventory
- KU-012: Kubernetes for Laravel (introductory) — basic K8s concepts for Laravel
- KU-013: Kubernetes Laravel (detailed) — advanced patterns, migration Job, KEDA, GitOps

## Dependency Graph
- **Prerequisites:** Docker fundamentals, containerization basics, K8s concepts (pods, deployments, services)
- **Related:** Production Dockerfiles (container images), FrankenPHP (single-container K8s), Database Migration CI (migration patterns), Environment Secrets (K8s Secrets management)
- **Extends:** Single-container → multi-pod K8s → GitOps-managed clusters

## Boundary Analysis
- **In scope:** Laravel-specific K8s patterns, autoscaling strategies, migration handling, worker management, Ingress configuration
- **Out of scope:** General K8s administration (cluster setup, node management), service mesh deep dive, K8s security policies, multi-cluster management

## Future Expansion Opportunities
- K8s cost optimization for Laravel workloads (spot instances, right-sizing)
- Service mesh integration for distributed Laravel applications
- K8s event-driven autoscaling with custom metrics
- Multi-cluster Laravel deployment strategies
- K8s-native Laravel development with Tilt or DevSpace
