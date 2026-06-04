# Decomposition: Validate Timestamps Tradeoff

## Topic Overview
opcache.validate_timestamps=0 is the highest-ROI production OpCache setting. It eliminates the stat() syscall per cached file per request ? thousands of syscalls saved per request. The tradeoff: **code changes only take effect after explicit cache invalidation** (PHP-FPM restart or opcache_reset()). For production deployments with controlled rollouts, this tradeoff is overwhelmingly positive.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
deployment-cache-invalidation/validate-timestamps-tradeoff/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Validate Timestamps Tradeoff
- **Purpose:** opcache.validate_timestamps=0 is the highest-ROI production OpCache setting. It eliminates the stat() syscall per cached file per request ? thousands of syscalls saved per request. The tradeoff: **code changes only take effect after explicit cache invalidation** (PHP-FPM restart or opcache_reset()). For production deployments with controlled rollouts, this tradeoff is overwhelmingly positive.
- **Difficulty:** Foundation
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Development vs production
  - validate_timestamps=0 in development
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