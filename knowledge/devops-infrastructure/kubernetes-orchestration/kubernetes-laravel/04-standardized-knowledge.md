# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 05-kubernetes-orchestration
**Knowledge Unit:** kubernetes-laravel
**Difficulty:** Advanced
**Category:** Container Orchestration
**Last Updated:** 2026-06-03

# Overview

Kubernetes Laravel covers the detailed patterns for deploying and managing Laravel on Kubernetes including K8s resource definitions, migration Job pattern, autoscaling strategies (HPA, KEDA), worker scaling, CronJob scheduler, and GitOps deployments.

These patterns exist because deploying Laravel on Kubernetes requires handling PHP-specific concerns: migration ordering, OPcache across pod restarts, worker queue management, and the Laravel scheduler.

# Core Concepts

- **K8s Resource Model** — Deployments, Services, Ingress, ConfigMaps, Secrets
- **Migration Job Pattern** — Running migrations as batch Job with commit SHA tracking
- **HPA Autoscaling** — CPU/metrics-based web pod scaling
- **KEDA Worker Scaling** — Queue-depth-based worker autoscaling
- **CronJob Scheduler** — Laravel scheduler as CronJob

# Best Practices

**Use Helm for Packaging.** Helm charts parameterize K8s manifests for different environments.

**GitOps with ArgoCD.** Declarative deployment with automated sync ensures cluster state matches repository.

**Migration Tracking.** Record last successful migration commit SHA to prevent re-execution.

**Graceful Shutdown.** Configure `terminationGracePeriodSeconds` to allow in-flight requests to complete.

**Pod Disruption Budgets.** Prevent too many pods from being terminated simultaneously during updates.

# Related Topics

**Prerequisites:** Kubernetes basics
**Closely Related:** Production Dockerfiles, KEDA, Helm
**Advanced Follow-Ups:** Service Mesh, GitOps, Custom Metrics Autoscaling
