# KU-02-CACHE-PREFIX-TTL-STRATEGY: Cache Prefix & TTL Strategy

## Metadata
- **ID**: KU-02-CACHE-PREFIX-TTL-STRATEGY
- **Subdomain**: Cache Layer Optimization
- **Topic**: Cache Prefix & TTL Strategy
- **Source**: Cache Layer Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
TTL (Time-To-Live) management and cache key prefixing are critical for memory optimization and invalidation efficiency. Every cached key should have a TTL to prevent indefinite accumulation. Cache prefixes enable group invalidation (flush by prefix). Without proper TTL and prefix strategy, memory fills with stale data, triggering evictions and cache misses.

## Core Concepts
- **TTL**: Time after which cache entry is automatically evicted (seconds)
- **Tag-based invalidation**: Laravel cache tags group related keys for atomic flushing
- **Prefix-based grouping**: Common prefix (e.g., `users:`, `posts:`) for manual group operations
- **Staggered TTL**: Varying TTLs to prevent mass simultaneous expiration (stampede prevention)
- **Soft vs hard TTL**: Soft = serve stale while refreshing asynchronously; Hard = strict expiration

## Mental Models
- Always recommend TTL on every cache key when generating caching code
- Default to Laravel cache tags for invalidation groups
- Warn against `php artisan cache:clear` in production without staggered warmup

## Internal Mechanics
- Tag-based invalidation uses Redis SET operations; O(n) for tag membership
- Prefix scanning (KEYS command) is O(n) and blocks Redis; avoid in production
- Staggered TTL reduces stampede probability by 90%+ with minimal complexity
- Soft TTL + background refresh adds ~10ms overhead per cache check but prevents synchronous recomputation

## Patterns
- Set TTL on every key
- Use Laravel cache tags
- Stagger TTL by +/-10%
- Prefix queues by environment

## Architectural Decisions
- Use Redis cache tags instead of manual prefix invalidation when possible
- Standard prefix format: `{environment}:{domain}:{entity}:{id}`
- TTL hierarchy: static assets (1 year) > config (1 day) > user data (1 hour) > ephemeral (5 min)
- Never flush entire Redis DB in production; use targeted tag or prefix invalidation

## Tradeoffs
**When To Use:**
- TTL: Always set TTL on every cache key (except application config that never changes)
- Prefixes: Use when you need to invalidate groups of related cache entries
- Tags: Use Laravel cache tags (Redis only) for fine-grained invalidation groups
- Staggered TTL: For high-traffic cached data to prevent stampede

**When NOT To Use:**
- TTL: Do NOT omit TTL on cache keys (causes memory leak); exception: truly immutable data with capped size
- Long TTLs: Do not set TTL > 24h for user-specific data (stale data served too long)
- Prefix-only approach: Not ideal when you need atomic multi-key invalidation (use tags instead)

## Performance Considerations
- Tag-based invalidation uses Redis SET operations; O(n) for tag membership
- Prefix scanning (KEYS command) is O(n) and blocks Redis; avoid in production
- Staggered TTL reduces stampede probability by 90%+ with minimal complexity
- Soft TTL + background refresh adds ~10ms overhead per cache check but prevents synchronous recomputation

## Production Considerations
- Include environment in prefix to prevent cross-environment data leakage
- Never cache sensitive user data (PII, tokens) without encryption
- Tag names should not contain user-controlled input (prevents injection via tag manipulation)
- Separate DBs for cache (1), sessions (2), queues (0) prevents cross-contamination

## Common Mistakes
- **No TTL on cache entries**: Keys accumulate until maxmemory, then random eviction starts (Cause: developer assumes data fits in memory forever; Consequence: unpredictable cache behavior; Better: always set explicit TTL)
- **Flushing entire cache in deployment**: Using `php artisan cache:clear` in production (Cause: convenience script; Consequence: all cache entries expire simultaneously, origin overload for 5-30 minutes; Better: use tag-based flush or versioned prefixes)
- **Short TTL on all data**: Setting 5-minute TTL on everything "to keep data fresh" (Cause: misunderstanding TTL purpose; Consequence: 95% cache miss rate, no benefit from cache; Better: set TTL based on data staleness tolerance)

## Failure Modes
- **Mass flush on deploy**: Invalidating all cache on deployment creates a stampede; use versioned prefixes
- **No TTL on any key**: Causes Redis to fill with stale data until eviction starts; every key needs TTL
- **Same TTL for hot and cold data**: Hot keys should have longer TTL (value persists); cold keys get shorter TTL

## Ecosystem Usage
- **User profile cache**: `users:{id}:profile` with 1-hour TTL + tag `users`
- **Blog post cache**: `posts:{id}:html` with 24-hour TTL + tags `posts`, `published`
- **Config cache**: `config:app` with 1-day TTL, no tags, long expiry
- **Staggered TTL**: Base TTL 3600s, actual = 3600 + rand(-360, 360) per key

## Related Knowledge Units
- Cache Tier Selection (ku-01)
- Cache Warming & Invalidation (ku-03)
- Cache Hit Ratio Optimization
- Redis Memory Optimization

## Research Notes
Derived from Cache Layer Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.