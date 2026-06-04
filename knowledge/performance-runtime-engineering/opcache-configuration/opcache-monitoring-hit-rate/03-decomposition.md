# Decomposition: Opcache Monitoring Hit Rate

## Topic Overview
OpCache health is determined by **hit rate** (should be >99% in production) and **cache_full events** (should be zero). Monitoring `opcache_get_status()` provides memory usage, hit/miss statistics, and eviction counters. The key indicators: `misses` growing = cache under-provisioned; `cache_full` > 0 = max_accelerated_files too low; `memory_usage[used_memory]` approaching `memory_usage[total_memory]` = need larger buffer.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
opcache-configuration/opcache-monitoring-hit-rate/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Opcache Monitoring Hit Rate
- **Purpose:** OpCache health is determined by **hit rate** (should be >99% in production) and **cache_full events** (should be zero). Monitoring `opcache_get_status()` provides memory usage, hit/miss statistics, and eviction counters. The key indicators: `misses` growing = cache under-provisioned; `cache_full` > 0 = max_accelerated_files too low; `memory_usage[used_memory]` approaching `memory_usage[total_memory]` = need larger buffer.
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
  - Ignoring cache_full
  - Library model
  - Tiered cache warming

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