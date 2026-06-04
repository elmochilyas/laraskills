# Decomposition: Xdebug Profiling Setup Analysis

## Topic Overview
Xdebug generates **cachegrind**-format profiling files containing per-function inclusive/exclusive time and call counts. Visualize with KCacheGrind (Linux), QCacheGrind (Windows/Mac), or PHPStorm's built-in profiler. Xdebug is a **development-only** tool — its profiling mode adds 50-200% overhead, prohibitive for production.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
profiling-observability/xdebug-profiling-setup-analysis/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Xdebug Profiling Setup Analysis
- **Purpose:** Xdebug generates **cachegrind**-format profiling files containing per-function inclusive/exclusive time and call counts. Visualize with KCacheGrind (Linux), QCacheGrind (Windows/Mac), or PHPStorm's built-in profiler. Xdebug is a **development-only** tool — its profiling mode adds 50-200% overhead, prohibitive for production.
- **Difficulty:** Intermediate
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Xdebug workflow
  - Xdebug profiler in production
  - Camera model
  - Tiered profiling workflow

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