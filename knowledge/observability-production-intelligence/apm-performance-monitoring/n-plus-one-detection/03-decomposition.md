# Decomposition: N+1 Query Detection

## Topic Overview
N+1 queries â€” executing one query to fetch a parent record, then N queries for each child relationship â€” are the most common performance anti-pattern in Laravel applications. Detection happens at multiple layers: during development (Laravel's `lazy loading` guard, Telescope watcher), in CI (Scout APM's N+1 analyzer), and in production (Pulse slow query recorder). Eliminating N+1 via eager loading (`with()`, `load()`) is typically the highest-ROI performance optimization available.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
application-performance-monitoring/n-plus-one-detection/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### N+1 Query Detection
- **Purpose:** N+1 queries â€” executing one query to fetch a parent record, then N queries for each child relationship â€” are the most common performance anti-pattern in Laravel applications. Detection happens at multiple layers: during development (Laravel's `lazy loading` guard, Telescope watcher), in CI (Scout APM's N+1 analyzer), and in production (Pulse slow query recorder). Eliminating N+1 via eager loading (`with()`, `load()`) is typically the highest-ROI performance optimization available.
- **Difficulty:** Intermediate
- **Dependencies:
  - APM Tool Integration & Comparison (Scout APM's N+1 detector)
  - Laravel Telescope (query count watcher)
  - Laravel Pulse (slow query recorder)

## Dependency Graph
**Depends on:**
  - APM Tool Integration & Comparison (Scout APM's N+1 detector)
  - Laravel Telescope (query count watcher)
  - Laravel Pulse (slow query recorder)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Lazy loading
  - Eager loading
  - N+1 pattern
  - Hydration
  - Query count threshold

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