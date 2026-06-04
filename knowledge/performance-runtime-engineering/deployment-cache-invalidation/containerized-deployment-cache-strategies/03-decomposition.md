# Decomposition: Containerized Deployment Cache Strategies

## Topic Overview
Containerized PHP deployments use **immutable infrastructure** ? each deployment builds a new container image with the application code baked in. OpCache must be warmed after container start. Strategies: **OpCache file cache** on persistent volumes (pre-warm in CI, reuse across container restarts), **preloading** (compiled at container start), or **readiness probe warm-up** (delay traffic until endpoints respond). The file cache approach eliminates cold-start latency entirely.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
deployment-cache-invalidation/containerized-deployment-cache-strategies/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Containerized Deployment Cache Strategies
- **Purpose:** Containerized PHP deployments use **immutable infrastructure** ? each deployment builds a new container image with the application code baked in. OpCache must be warmed after container start. Strategies: **OpCache file cache** on persistent volumes (pre-warm in CI, reuse across container restarts), **preloading** (compiled at container start), or **readiness probe warm-up** (delay traffic until endpoints respond). The file cache approach eliminates cold-start latency entirely.
- **Difficulty:** Intermediate
- **Dependencies:
  - Green Deployment | CI/CD Cache Invalidation Steps
  - --

## Dependency Graph
**Depends on:**
  - Green Deployment | CI/CD Cache Invalidation Steps
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - CI warm-up
  - Using shared memory OpCache in containers without warming
  - Parking garage model
  - Zero-downtime deployment pipeline

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

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