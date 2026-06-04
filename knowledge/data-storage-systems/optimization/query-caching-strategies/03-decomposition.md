# Decomposition: 4.29 Query caching strategies (remember, tagged cache, materialized views)

## Topic Overview
Caching database query results reduces database load and response latency, but introduces staleness and invalidation complexity. Laravel's `Cache::remember()` is the primary mechanism for caching query results. For more sophisticated needs, tagged cache enables group invalidation, and database materialized views provide server-side pre-computed results.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-29-query-caching-strategies/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.29 Query caching strategies (remember, tagged cache, materialized views)
- **Purpose:** Caching database query results reduces database load and response latency, but introduces staleness and invalidation complexity. Laravel's `Cache::remember()` is the primary mechanism for caching query results.
- **Difficulty:** Intermediate
- **Dependencies:** 2.3 Eager loading, 4.18 Keyset pagination, 4.23 When to drop to query builder, 12.27 Materialized views in PostgreSQL

## Dependency Graph
**Depends on:** "2.3 Eager loading", "4.18 Keyset pagination", "4.23 When to drop to query builder", "12.27 Materialized views in PostgreSQL"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Cache::remember()**: Fetches from cache or executes the callback, stores the result, returns it. TTL-driven expiration.; - **Cache tags**: Group cache entries so they can be invalidated together. Requires cache driver that supports tags (Redis, Memcached).; - **Materialized views**: Database-level pre-computed query results stored as a physical table. Refreshed on schedule or on-demand. PostgreSQL supports concurrent refresh without blocking reads.; - **Cache stampede**: When a popular cache key expires and multiple concurrent requests all attempt to rebuild it simultaneously, overwhelming the database.; - **Stale-while-revalidate**: Serve stale cache while asynchronously rebuilding fresh cache. Reduces p95 latency during cache expiration..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization