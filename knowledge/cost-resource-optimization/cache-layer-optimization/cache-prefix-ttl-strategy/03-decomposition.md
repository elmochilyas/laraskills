# Decomposition: Cache Prefix & TTL Strategy

## Topic Overview
TTL (Time-To-Live) management and cache key prefixing are critical for memory optimization and invalidation efficiency. Every cached key should have a TTL to prevent indefinite accumulation. Cache prefixes enable group invalidation (flush by prefix). Without proper TTL and prefix strategy, memory fills with stale data, triggering evictions and cache misses.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-02-cache-prefix-ttl-strategy/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Cache Prefix & TTL Strategy
- **Purpose:** TTL (Time-To-Live) management and cache key prefixing are critical for memory optimization and invalidation efficiency. Every cached key should have a TTL to prevent indefinite accumulation. Cache prefixes enable group invalidation (flush by prefix). Without proper TTL and prefix strategy, memory fills with stale data, triggering evictions and cache misses.
- **Difficulty:** Foundation
- **Dependencies:** - Cache Tier Selection (ku-01), - Cache Warming & Invalidation (ku-03), - Cache Hit Ratio Optimization, - Redis Memory Optimization

## Dependency Graph
**Depends on:**
- Cache Tier Selection (ku-01)
- Cache Warming & Invalidation (ku-03)
- Cache Hit Ratio Optimization
- Redis Memory Optimization

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- TTL: Always set TTL on every cache key (except application config that never changes)
- Prefixes: Use when you need to invalidate groups of related cache entries
- Tags: Use Laravel cache tags (Redis only) for fine-grained invalidation groups
- Staggered TTL: For high-traffic cached data to prevent stampede
**Out of scope:**
- TTL: Do NOT omit TTL on cache keys (causes memory leak); exception: truly immutable data with capped size
- Long TTLs: Do not set TTL > 24h for user-specific data (stale data served too long)
- Prefix-only approach: Not ideal when you need atomic multi-key invalidation (use tags instead)
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