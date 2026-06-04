# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 05-kubernetes-orchestration
**Knowledge Unit:** kubernetes-for-laravel
**Difficulty:** Advanced
**Category:** Container Orchestration
**Last Updated:** 2026-06-03

# Overview

Deploying Laravel on Kubernetes involves containerizing the application, defining Kubernetes resources (Deployments, Services, Ingress, ConfigMaps, Secrets), and configuring supporting workloads (queue workers as separate Deployments, scheduler as CronJob, HPA for autoscaling). The compute model is stateless application pods backed by shared Redis and database services.

Kubernetes exists for Laravel because as applications scale, managing individual servers becomes unsustainable. The engineering value is automated deployment, self-healing, horizontal scaling, and declarative infrastructure management.

# When To Use

- Applications requiring automated horizontal scaling
- Microservice architectures with multiple Laravel services
- Teams with dedicated Kubernetes operations expertise
- High-traffic applications needing zero-downtime deployments

# When NOT To Use

- Small applications with low traffic (< 10k req/day)
- Teams without Kubernetes experience
- Simple deployments better served by Forge or Vapor

# Core Concepts

- **Deployment** — Stateless Laravel application pods
- **Service** — Internal load balancing to pods
- **Ingress** — External traffic routing with TLS termination
- **ConfigMap** — Non-sensitive configuration
- **Secret** — Sensitive data (database passwords, API keys)
- **HPA** — Horizontal Pod Autoscaler for web pods
- **Job** — Database migration execution
- **CronJob** — Laravel scheduler

# Best Practices

**Migrations as Jobs.** Run migrations as Kubernetes Jobs, not init containers. Jobs handle failure retry correctly.

**HPA Based on Requests.** Use custom metrics (requests/second) for web scaling, not just CPU/memory.

**Worker Scaling with KEDA.** Use KEDA for queue-depth-based worker scaling.

**Separate Queue Worker Deployments.** Each queue connection (default, notifications) should be a separate deployment for independent scaling.

**Shared Storage for Uploads.** Use S3 or network storage, not local pod storage.

# Related Topics

**Prerequisites:** Docker, containerization basics
**Closely Related:** Production Dockerfiles, FrankenPHP, Database Migration on K8s
**Advanced Follow-Ups:** KEDA, Istio Service Mesh, GitOps (ArgoCD)
