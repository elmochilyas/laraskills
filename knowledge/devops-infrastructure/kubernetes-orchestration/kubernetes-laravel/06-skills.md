# Skills: Kubernetes Laravel

## Skill: k8s-helm-chart-create
**Purpose:** Create Helm chart for Laravel deployment
**Trigger:** When packaging Laravel for Helm-based Kubernetes deployment
**Workflow:**
1. Create chart structure (Chart.yaml, values.yaml, templates/)
2. Template Deployment with configurable replicas and resources
3. Template Service and Ingress
4. Template migration Job with hook annotations
5. Template CronJob for scheduler
6. Template HPA with configurable metrics
7. Add environment-specific values files
8. Test with `helm template` and `helm lint`
**Output:** Helm chart for Laravel deployment

## Skill: k8s-gitops-setup
**Purpose:** Set up GitOps deployment for Laravel on Kubernetes
**Trigger:** When implementing automated K8s deployment
**Workflow:**
1. Install ArgoCD or Flux on cluster
2. Configure application repository connection
3. Define K8s manifests or Helm chart in Git
4. Set up automated sync policy
5. Configure sync waves for migration ordering
6. Implement PR-based deployment review
7. Set up rollback via Git revert
**Output:** GitOps pipeline for Kubernetes Laravel deployment
