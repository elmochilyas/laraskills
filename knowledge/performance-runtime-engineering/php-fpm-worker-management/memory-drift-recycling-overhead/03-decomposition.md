# Decomposition: Memory Drift Recycling Overhead

## Topic Overview
Worker recycling via `pm.max_requests` is a deliberate tradeoff: **lower worker RSS** (good) vs **higher process spawn overhead** (bad). Each spawn costs ~10-50ms of CPU time for process fork, PHP bootstrap, and OpCache warming. The optimal `pm.max_requests` minimizes the sum of drift-related memory waste and spawn-related CPU waste.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-fpm-worker-management/memory-drift-recycling-overhead/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Memory Drift Recycling Overhead
- **Purpose:** Worker recycling via `pm.max_requests` is a deliberate tradeoff: **lower worker RSS** (good) vs **higher process spawn overhead** (bad). Each spawn costs ~10-50ms of CPU time for process fork, PHP bootstrap, and OpCache warming. The optimal `pm.max_requests` minimizes the sum of drift-related memory waste and spawn-related CPU waste.
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
  - Overhead minimization
  - Raising max_requests to "reduce overhead"
  - Restaurant kitchen model
  - Monitor-then-size

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