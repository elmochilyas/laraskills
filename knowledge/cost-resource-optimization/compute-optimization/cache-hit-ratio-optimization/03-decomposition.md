# Decomposition: Cache Hit Ratio Optimization

## Topic Overview
Cache hit ratio (CHR) measures the percentage of cache requests served without hitting the origin (database or backend). A high CHR (>95%) means the cache is effectively reducing database load and response latency. In Laravel applications, optimizing CHR involves tuning TTLs, warming frequently accessed data, implementing multi-level caching (memo + Redis), and ensuring cache keys are properly structured. Each 1% improvement in CHR reduces database load proportionally.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-11-cache-hit-ratio-optimization/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Cache Hit Ratio Optimization
- **Purpose:** Cache hit ratio (CHR) measures the percentage of cache requests served without hitting the origin (database or backend). A high CHR (>95%) means the cache is effectively reducing database load and response latency. In Laravel applications, optimizing CHR involves tuning TTLs, warming frequently accessed data, implementing multi-level caching (memo + Redis), and ensuring cache keys are properly structured. Each 1% improvement in CHR reduces database load proportionally.
- **Difficulty:** Foundation
- **Dependencies:** - Cache Tier Selection (ku-01), - Cache Prefix & TTL Strategy (ku-02), - Cache Warming & Invalidation (ku-03), - Redis Memory Optimization

## Dependency Graph
**Depends on:**
- Cache Tier Selection (ku-01)
- Cache Prefix & TTL Strategy (ku-02)
- Cache Warming & Invalidation (ku-03)
- Redis Memory Optimization

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- CHR optimization: Any app with cache-enabled data (query results, HTML fragments, API responses)
- Multi-level cache: High-traffic endpoints with expensive computation (>100ms recomputation)
- TTL tuning: When CHR is consistently <90% but data staleness tolerance allows longer TTL
- Cache warming: After deploys and scheduled jobs that invalidate large portions of cache
- Working set optimization: When Redis used_memory is high but CHR is low (wrong data cached)
**Out of scope:**
- CHR optimization for uncacheable data: User-specific, real-time, or financial data that must be fresh
- Over-optimizing for <1% improvement: If CHR is already 98%, further optimization yields marginal returns
- Aggressive TTL extension: Increasing TTL to 24h for volatile data (serves stale data for hours)
- Cache-everything: Not all data benefits from caching (rarely accessed data wastes memory)
- Related topics covered in other Knowledge Units within this domain.

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

No Knowledge Unit is overloaded

No major concept is missing

Boundaries are clear

Future phases can operate on individual units

The structure can scale without reorganization