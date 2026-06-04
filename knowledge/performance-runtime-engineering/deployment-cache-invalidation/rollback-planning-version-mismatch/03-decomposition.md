# Decomposition: Rollback Planning Version Mismatch

## Topic Overview
Rollback in PHP deployments must handle **OpCache version mismatches** (OpCache format may differ between PHP minor versions) and **stateful service rollback** (Octane workers with persistent state). The rollback plan must include: code revert, OpCache invalidation, preloading refresh, and (for Octane) connection pool drain and worker restart.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
deployment-cache-invalidation/rollback-planning-version-mismatch/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Rollback Planning Version Mismatch
- **Purpose:** Rollback in PHP deployments must handle **OpCache version mismatches** (OpCache format may differ between PHP minor versions) and **stateful service rollback** (Octane workers with persistent state). The rollback plan must include: code revert, OpCache invalidation, preloading refresh, and (for Octane) connection pool drain and worker restart.
- **Difficulty:** Foundation
- **Dependencies:
  - Downtime Deployment | Blue-Green Deployment | CI/CD Cache Invalidation Steps
  - --

## Dependency Graph
**Depends on:**
  - Downtime Deployment | Blue-Green Deployment | CI/CD Cache Invalidation Steps
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Rollback button
  - Octane rollback without worker restart
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