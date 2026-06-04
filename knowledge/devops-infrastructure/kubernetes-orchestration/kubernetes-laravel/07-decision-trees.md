# Decision Trees: Kubernetes Laravel

## Deployment Strategy

**Team size and maturity:**
- Small team, basic K8s → Helm charts, manual kubectl for emergencies
- Growing team → ArgoCD GitOps with Helm
- Platform team → Crossplane + ArgoCD + custom K8s operators

## Worker Scaling Strategy

**Queue driver:**
- Redis → KEDA ScaledObject with Redis list length
- SQS → KEDA with AWS SQS queue depth
- Database queue → HPA with memory-based scaling (database queue is not recommended)

## Ingress Controller

**Requirements:**
- Simple routing → Nginx Ingress Controller
- Advanced traffic management → Istio Gateway
- Cloud-native → Cloud provider load balancer (ALB Ingress Controller)
