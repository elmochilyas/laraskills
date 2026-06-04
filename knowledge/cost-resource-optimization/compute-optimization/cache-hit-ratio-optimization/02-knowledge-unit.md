# KU-11-CACHE-HIT-RATIO-OPTIMIZATION: Cache Hit Ratio Optimization

## Metadata
- **ID**: KU-11-CACHE-HIT-RATIO-OPTIMIZATION
- **Subdomain**: Compute Optimization
- **Topic**: Cache Hit Ratio Optimization
- **Source**: Compute Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Cache hit ratio (CHR) measures the percentage of cache requests served without hitting the origin (database or backend). A high CHR (>95%) means the cache is effectively reducing database load and response latency. In Laravel applications, optimizing CHR involves tuning TTLs, warming frequently accessed data, implementing multi-level caching (memo + Redis), and ensuring cache keys are properly structured. Each 1% improvement in CHR reduces database load proportionally.

## Core Concepts
- **Cache hit ratio**: Cache hits / (cache hits + cache misses) * 100
- **Cold cache**: After deploy or flush, CHR drops to 0% until data is re-cached
- **Warm cache**: CHR stabilizes at 90-99% after all hot data is cached
- **Working set**: The subset of data accessed frequently enough to stay in cache
- **Cache miss types**: Cold miss (never cached), invalidation miss (cache cleared), expiration miss (TTL expired)
- **Multi-level cache**: L1 (memo/in-process) + L2 (Redis) + L3 (database/API)

## Mental Models
- Default: measure CHR per data type, not aggregate
- Default: multi-level cache (memo + Redis)
- Find and fix the lowest-CHR data type first (highest impact)
- Monitor evicted_keys = 0 as target

## Internal Mechanics
- L1 cache (memo): 0ns latency (in-memory, no network)
- L2 cache (Redis): 0.5-2ms latency (network round-trip)
- L3 (database): 5-50ms latency (depends on query complexity)
- Each Redis eviction causes a cache miss and database query (adds 5-50ms to response)
- Cache miss penalty: 10-50x the latency of a cache hit (dramatic impact on p99 response times)

## Patterns
- Measure CHR per cache key pattern
- Implement multi-level caching
- Set TTL based on access pattern
- Warm cache after deploy
- Monitor cache eviction rate
- Use sticky cache key prefixes

## Architectural Decisions
- Set CHR targets: Static assets > 99%, HTML fragments > 95%, API responses > 90%, user-specific data > 80%
- Monitor CHR per endpoint using Laravel cache events or Redis `INFO commandstats`
- Use different Redis DBs for different cache types (DB0 = data cache, DB1 = fragment cache, DB2 = config)
- Right-size Redis based on working set + 20% headroom (not total available data)
- Implement cache warming in deployment pipeline (post-deploy script)
- Use Redis `maxmemory-policy allkeys-lru` for general cache (evicts least recently used when full)

## Tradeoffs
**When To Use:**
- CHR optimization: Any app with cache-enabled data (query results, HTML fragments, API responses)
- Multi-level cache: High-traffic endpoints with expensive computation (>100ms recomputation)
- TTL tuning: When CHR is consistently <90% but data staleness tolerance allows longer TTL
- Cache warming: After deploys and scheduled jobs that invalidate large portions of cache
- Working set optimization: When Redis used_memory is high but CHR is low (wrong data cached)

**When NOT To Use:**
- CHR optimization for uncacheable data: User-specific, real-time, or financial data that must be fresh
- Over-optimizing for <1% improvement: If CHR is already 98%, further optimization yields marginal returns
- Aggressive TTL extension: Increasing TTL to 24h for volatile data (serves stale data for hours)
- Cache-everything: Not all data benefits from caching (rarely accessed data wastes memory)

## Performance Considerations
- L1 cache (memo): 0ns latency (in-memory, no network)
- L2 cache (Redis): 0.5-2ms latency (network round-trip)
- L3 (database): 5-50ms latency (depends on query complexity)
- Each Redis eviction causes a cache miss and database query (adds 5-50ms to response)
- Cache miss penalty: 10-50x the latency of a cache hit (dramatic impact on p99 response times)

## Production Considerations
- Cache invalidation should be triggered only by authorized operations (data owners)
- Monitor CHR drops as potential security incident (cache flush could be attack)
- Do not cache user-specific data that other users shouldn't see (cache poisoning risk)
- Cache keys should not contain sensitive data (PII in key names)

## Common Mistakes
- **Not measuring CHR**: No metrics on cache hits vs misses (Cause: assuming cache "just works"; Consequence: blind to 50% CHR meaning half of requests hit database; Better: instrument Redis command stats or Laravel cache events)
- **Short TTL on everything**: 5-minute TTL on all data results in 90%+ miss rate (Cause: "fresh data is better"; Consequence: CHR < 10%, database serves all requests; Better: use longer TTL with explicit invalidation on data changes)
- **Working set larger than Redis memory**: Redis has 1GB but working set is 2GB (Cause: not calculating actual data footprint; Consequence: constant evictions, CHR < 50%; Better: calculate working set size, provision Redis at 1.2x working set)

## Failure Modes
- **Cache-flush-on-deploy**: Destroying all cached data for a new deployment; CHR drops to 0%
- **Random eviction reliance**: Letting Redis LRU evict without monitoring which data is evicted
- **Same TTL for all cache entries**: Ignoring access frequency differences between data types

## Ecosystem Usage
- **Blog platform**: Post HTML cached for 24h (99.9% CHR), user profile cached for 1h (85% CHR), tags cached for 1h (95% CHR)
- **E-commerce**: Product data cached 1h (95% CHR), inventory counts cached 30s (50% CHR by design), cart data uncached
- **API responses**: `/api/posts` cached 5min with ETag (90% CHR), `/api/user/me` cached 1min (80% CHR)

## Related Knowledge Units
- Cache Tier Selection (ku-01)
- Cache Prefix & TTL Strategy (ku-02)
- Cache Warming & Invalidation (ku-03)
- Redis Memory Optimization

## Research Notes
Derived from Compute Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.