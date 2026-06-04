# Decomposition: Ci Cd Cache Invalidation Steps

## Topic Overview
A CI/CD pipeline for PHP must include explicit cache invalidation steps after code deployment. Typical pipeline: 1) Build (composer install, compile assets), 2) Deploy (copy code to servers), 3) **Invalidate OpCache** (opcache_reset or PHP-FPM reload), 4) **Warm caches** (hit critical endpoints), 5) **Health check** (verify all workers serving), 6) **Enable traffic** (remove from maintenance). Each step should have a timeout and rollback trigger.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
deployment-cache-invalidation/ci-cd-cache-invalidation-steps/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Ci Cd Cache Invalidation Steps
- **Purpose:** A CI/CD pipeline for PHP must include explicit cache invalidation steps after code deployment. Typical pipeline: 1) Build (composer install, compile assets), 2) Deploy (copy code to servers), 3) **Invalidate OpCache** (opcache_reset or PHP-FPM reload), 4) **Warm caches** (hit critical endpoints), 5) **Health check** (verify all workers serving), 6) **Enable traffic** (remove from maintenance). Each step should have a timeout and rollback trigger.
- **Difficulty:** Intermediate
- **Dependencies:
  - Instance Cache Coordination | Rollback Planning Version Mismatch
  - --

## Dependency Graph
**Depends on:**
  - Instance Cache Coordination | Rollback Planning Version Mismatch
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Deployment gate
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