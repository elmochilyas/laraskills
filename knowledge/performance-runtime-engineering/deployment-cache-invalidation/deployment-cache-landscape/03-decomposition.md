# Decomposition: Deployment Cache Landscape

## Topic Overview
Deploying new PHP code requires invalidating multiple caches: **OpCache** (stale opcodes), **preloading** (stale class definitions), **PHP-FPM workers** (stale process state), and **alternative runtime workers** (Octane/Swoole stale state). Each cache has a different invalidation mechanism and cost. A deployment script must coordinate all invalidations to ensure zero stale-code serving.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
deployment-cache-invalidation/deployment-cache-landscape/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Deployment Cache Landscape
- **Purpose:** Deploying new PHP code requires invalidating multiple caches: **OpCache** (stale opcodes), **preloading** (stale class definitions), **PHP-FPM workers** (stale process state), and **alternative runtime workers** (Octane/Swoole stale state). Each cache has a different invalidation mechanism and cost. A deployment script must coordinate all invalidations to ensure zero stale-code serving.
- **Difficulty:** Foundation
- **Dependencies:
  - FPM Graceful Reload Patterns | OpCache Reset Strategies
  - --

## Dependency Graph
**Depends on:**
  - FPM Graceful Reload Patterns | OpCache Reset Strategies
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - OpCache reset but no preloading reload
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