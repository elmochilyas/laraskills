# Decomposition: Pool Sizing Formula Rationale

## Topic Overview
The fundamental PHP-FPM capacity formula: `pm.max_children = (total_RAM - reserved_RAM) / avg_worker_RSS`. Calculate available RAM after reserving for OS, database, Redis, and other services. Measure average worker RSS (Resident Set Size) under realistic load. Apply a safety factor of 0.7-0.8 (use P95 RSS, not average) to avoid OOM under peak variance.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-fpm-worker-management/pool-sizing-formula-rationale/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Pool Sizing Formula Rationale
- **Purpose:** The fundamental PHP-FPM capacity formula: `pm.max_children = (total_RAM - reserved_RAM) / avg_worker_RSS`. Calculate available RAM after reserving for OS, database, Redis, and other services. Measure average worker RSS (Resident Set Size) under realistic load. Apply a safety factor of 0.7-0.8 (use P95 RSS, not average) to avoid OOM under peak variance.
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
  - Sizing by average RSS
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