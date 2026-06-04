# Decomposition: Laravel Cloud (Next-Gen Vapor)

## Topic Overview
Laravel Cloud is the next-generation Laravel hosting platform, built on Kubernetes (EKS) rather than AWS Lambda (Vapor's foundation). It is a fully managed platform — developers push code via Git, and Cloud handles servers, databases, caching, scaling, WebSockets, SSL, and deployments. Cloud uses a Go-based Kubernetes operator to manage deployments, Cloudflare tunnels for networking, and supports hibernation (scale to zero during idle periods) and auto-scaling based on real traffic.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
laravel-cloud/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Laravel Cloud (Next-Gen Vapor)
- **Purpose:** Laravel Cloud is the next-generation Laravel hosting platform, built on Kubernetes (EKS) rather than AWS Lambda (Vapor's foundation).
- **Difficulty:** Intermediate
- **Dependencies:** Laravel Vapor (KU-015) — predecessor, Lambda-based, Kubernetes for Laravel (KU-013) — Cloud is built on K8s, Fly.io Deployment (KU-017) — comparable Docker-based platform, Environment & Secret Management (KU-021), Observability & Monitoring (KU-022)

## Dependency Graph
**Depends on:**
- Laravel Vapor (KU-015) — predecessor, Lambda-based
- Kubernetes for Laravel (KU-013) — Cloud is built on K8s
- Fly.io Deployment (KU-017) — comparable Docker-based platform
- Environment & Secret Management (KU-021)
- Observability & Monitoring (KU-022)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Fully managed Laravel platform:** Unlike Vapor (which requires an AWS account an
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- Laravel Vapor (KU-015) — predecessor, Lambda-based, Kubernetes for Laravel (KU-013) — Cloud is built on K8s, Fly.io Deployment (KU-017) — comparable Docker-based platform, Environment & Secret Management (KU-021), Observability & Monitoring (KU-022)

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