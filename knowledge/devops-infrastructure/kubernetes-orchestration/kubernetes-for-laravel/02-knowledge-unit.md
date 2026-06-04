# Kubernetes for Laravel

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Kubernetes Orchestration
- **Knowledge Unit:** Kubernetes for Laravel
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Deploying Laravel on Kubernetes involves containerizing the application and defining Kubernetes resources (Deployments, Services, Ingress, ConfigMaps, Secrets) with supporting workloads for queue workers, scheduler, and autoscaling. Kubernetes provides automated deployment, self-healing, horizontal scaling, and declarative infrastructure management for Laravel at scale.

---

## Core Concepts

- **Deployment** — Stateless Laravel application pods with rolling update strategy
- **Service** — Internal load balancing to healthy pod replicas
- **Ingress** — External traffic routing with TLS termination
- **ConfigMap** — Non-sensitive configuration values injected into pods
- **Secret** — Sensitive data (database passwords, API keys) injected as environment variables or volumes
- **HPA** — Horizontal Pod Autoscaler for web pods based on CPU, memory, or custom metrics
- **Job** — Database migration execution as a batch workload
- **CronJob** — Laravel scheduler running on a time-based schedule

---

## Mental Models

- **Pods Are Cattle** — Pods are ephemeral and can be terminated at any time. The application must handle graceful shutdown and have no local state that would be lost on pod restart.
- **Declarative Desired State** — You describe what the cluster should look like (5 replicas, 2GB memory, latest image). Kubernetes continuously reconciles the actual state toward the desired state.
- **PHPs Are Stateless Workers** — In K8s, Laravel pods are stateless compute units. All state lives in managed services (database, Redis, S3). Any pod can handle any request.

---

## Internal Mechanics

When a Deployment is created, Kubernetes creates a ReplicaSet that maintains the specified number of pod replicas. Each pod runs the Laravel container. The Service selects healthy pods via label matching and load balances traffic across them. The Ingress controller terminates TLS and routes external traffic to the Service. When a rolling update is triggered, Kubernetes gradually replaces pods with new versions, ensuring zero downtime if configured correctly. HPA monitors pod metrics and adjusts replica count. Failed pods are automatically terminated and rescheduled.

---

## Patterns

- **Migrations as Jobs** — Run migrations as Kubernetes Jobs, not init containers. Jobs handle failure retry correctly and provide better observability.
- **HPA Based on Requests** — Use custom metrics (requests/second) for web scaling, not just CPU/memory which may not reflect actual load.
- **Worker Scaling with KEDA** — Use KEDA for queue-depth-based worker autoscaling, scaling workers based on SQS, Redis, or RabbitMQ queue length.
- **Separate Queue Worker Deployments** — Each queue connection (default, notifications, etc.) as a separate Deployment for independent scaling.
- **Shared Storage for Uploads** — Use S3 or network storage (EFS, NFS) because pod storage is ephemeral and lost on restart.

---

## Architectural Decisions

- **Kubernetes vs. Managed Platforms** — Choose K8s for automated scaling, self-healing, and microservice architectures; choose Forge/Vapor for simpler deployments without K8s expertise
- **K8s vs. Docker Compose** — Choose K8s for production orchestration with self-healing and scaling; choose Docker Compose for local development and small deployments
- **Octane on K8s** — Use Octane on K8s with worker count per pod; each pod runs a fixed number of Octane workers

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Automated horizontal scaling | Significant operational complexity | Requires dedicated K8s operations expertise |
| Self-healing infrastructure | Higher infrastructure cost for control plane | Cluster nodes and management overhead add cost |
| Declarative infrastructure management | Steep learning curve | Team training time and potential misconfiguration risk |
| Zero-downtime rolling updates | Requires application to be stateless | Local filesystem storage not possible |
| Environment consistency across deployments | Migration Job coordination | Schema changes must be coordinated with code deployments |

---

## Performance Considerations

Pod resource limits and requests must be configured based on application profiling. Octane workers per pod should be calculated based on CPU cores. HPA metrics collection adds overhead. Service mesh (Istio) adds significant resource consumption. Horizontal pod autoscaling has a lag time (1-2 minutes) before new pods are ready. Use cluster autoscaling for node-level scaling.

---

## Production Considerations

Configure Pod Disruption Budgets to prevent too many pods from being terminated simultaneously during updates. Set `terminationGracePeriodSeconds` to allow in-flight requests to complete. Use RollingUpdate strategy with `maxSurge` and `maxUnavailable` configured. Store configuration in ConfigMaps and secrets in Secrets — never hardcode values. Implement liveness, readiness, and startup probes for health detection. Use namespaces for environment isolation.

---

## Common Mistakes

- **Running Migrations in Init Containers** — Init containers run on every pod start, not just on deployment. Use Jobs for one-time migration execution.
- **Local Filesystem for Storage** — Pods are ephemeral. Uploads and logs written to local storage are lost on pod restart. Use S3 or network storage.
- **No Pod Disruption Budgets** — Cluster autoscaling or node maintenance can terminate all pods simultaneously, causing downtime.
- **Incorrect Resource Requests/Limits** — Setting requests too high wastes resources; setting limits too low causes OOM kills. Profile the application first.

---

## Failure Modes

- **CrashLoopBackOff** — Pod starts but immediately crashes. Detection: pod status shows CrashLoopBackOff. Mitigation: check container logs, verify configuration.
- **ImagePullBackOff** — Container image cannot be pulled. Detection: pod status shows ImagePullBackOff. Mitigation: verify image tag exists in registry, check registry authentication.
- **OOMKilled Pod** — Container exceeds memory limit. Detection: pod status shows OOMKilled. Mitigation: increase memory limit, profile memory usage, fix memory leak.
- **HPA Scale-Up Delay** — Traffic spike before HPA responds. Detection: increased latency, 503 errors. Mitigation: configure HPA with shorter metrics window, use proactive scaling.

---

## Ecosystem Usage

Kubernetes for Laravel is used by organizations with significant infrastructure requirements. Laravel Cloud is built on EKS (Amazon Elastic Kubernetes Service). Octane is the recommended application server for K8s due to its improved resource utilization and graceful shutdown support. Helm charts and Kustomize are used to parameterize K8s manifests for different environments. GitOps tools (ArgoCD, Flux) provide declarative deployment workflows.

---

## Related Knowledge Units

### Prerequisites
- Docker, containerization basics

### Related Topics
- Production Dockerfiles
- FrankenPHP Standalone
- Database Migration on K8s

### Advanced Follow-up Topics
- KEDA
- Istio Service Mesh
- GitOps (ArgoCD)

---

## Research Notes

Kubernetes provides significant operational benefits for Laravel at scale but requires dedicated expertise. Use Jobs for migrations, not init containers. Pod Disruption Budgets are essential for maintaining availability during updates. Octane improves resource utilization on K8s. Always use external storage (S3) for uploads and logs. Helm charts are the standard for packaging Laravel K8s configurations.
