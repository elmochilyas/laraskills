# Decision Trees: Kubernetes for Laravel

## K8s Adoption Decision

**Scale requirements:**
- < 10k req/day → Forge/Vapor is simpler and cheaper
- 10k-100k req/day → Evaluate K8s vs managed platform
- > 100k req/day → K8s provides better scaling and cost management

**Team expertise:**
- No K8s experience → Use managed platform (Laravel Cloud, Vapor)
- Some K8s experience → Use managed K8s (EKS, GKE, AKS)
- Expert K8s team → Self-managed or managed K8s

## Migration Strategy

**Existing Laravel app:**
- Dockerized → Can adopt K8s
- Not Dockerized → Must Dockerize first before K8s
- Forge-managed → Migration complexity may not be justified
