# Skills: Kubernetes for Laravel

## Skill: k8s-laravel-deployment
**Purpose:** Create Kubernetes deployment manifests for Laravel
**Trigger:** When deploying Laravel to Kubernetes cluster
**Workflow:**
1. Create Deployment manifest with resource requests/limits
2. Create Service manifest for internal routing
3. Configure Ingress with TLS certificate
4. Create ConfigMap for application configuration
5. Create Secrets for sensitive values
6. Set up migration Job with Helm hook or ArgoCD post-sync
7. Configure HPA for web pods
8. Set up worker Deployment with separate HPA
9. Create CronJob for Laravel scheduler
**Output:** Kubernetes manifests for Laravel application stack

## Skill: k8s-worker-scaling
**Purpose:** Configure queue worker autoscaling on Kubernetes
**Trigger:** When setting up Laravel queue workers on K8s
**Workflow:**
1. Deploy worker pods as separate Deployment
2. Install KEDA operator on cluster
3. Create ScaledObject for queue depth-based scaling
4. Set min/mual replicas based on workload
5. Configure cooldown period to avoid thrashing
6. Test with queue load simulation
**Output:** KEDA-based worker autoscaling configuration
