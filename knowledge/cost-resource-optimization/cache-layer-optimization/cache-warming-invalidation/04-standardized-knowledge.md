# Cache Warming & Invalidation

## Metadata
- **ID**: KU-03-CACHE-WARMING-INVALIDATION
- **Subdomain**: cache-layer-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Cache Warming & Invalidation
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Cache warming proactively populates the cache before traffic arrives, preventing cold-start cache misses that cause origin load spikes. Cache invalidation removes or updates stale data. Together, warming and invalidation determine effective cache hit ratio and origin load. Proper strategies reduce origin requests by 80-95%.

## Core Concepts
- **Cache warming**: Pre-populating cache entries before they are requested
- **Stampede prevention**: Techniques (atomic locks, probabilistic expiration) to prevent simultaneous recomputation
- **Tag-based invalidation**: Laravel's Cache::tags() for atomic group invalidation
- **Write-through cache**: Update cache when writing to database (ensures consistency)
- **Cache-aside (lazy loading)**: Load on miss, cache on read (most common Laravel pattern)
- **Stale-while-revalidate**: Serve stale data while asynchronously refreshing

## When To Use
- Cache warming: Before known traffic events (deploy, marketing campaign, daily peak)
- Tag invalidation: When related cache entries must be updated atomically
- Write-through: For data with high read frequency after write (e.g., user settings)
- Stale-while-revalidate: For expensive-to-compute data with high traffic (e.g., analytics dashboards)

## When NOT To Use
- Full cache warm: Don't warm entire cache on every deploy (wastes resources); warm only what's needed
- Write-through: Don't use for write-heavy workloads (increases write latency); use async invalidation instead
- Stale-while-revalidate: Don't use for data that must be perfectly fresh (financial transactions, inventory counts)

## Best Practices
- **Use Laravel cache tags for invalidation**: `Cache::tags(['posts'])->flush()` invalidates all post cache (WHY: atomic invalidation with zero race conditions compared to prefix scanning)
- **Implement stampede prevention**: Use `Cache::lock()` for expensive recomputation (WHY: prevents 100 simultaneous requests all recomputing the same expired cache entry, overloading the database)
- **Warm after deploy**: Cache key configuration, routes, and frequently accessed data post-deployment (WHY: cold cache after deploy causes 5-15 minutes of degraded performance; warming eliminates this)
- **Versioned cache keys**: Append version/timestamp to keys on deploy (WHY: old cache automatically becomes unreadable, new keys get fresh data; no explicit invalidation needed)

## Architecture Guidelines
- Invalidation > expiration: Explicit invalidation is more predictable than waiting for TTL expiry
- Event-driven invalidation: Fire events on model save/delete, listen and invalidate related cache
- For high-traffic endpoints (1000+ req/s): Use probabilistic early expiration (expire random subset before TTL)
- Avoid full-cache flush in production; use tag-based or key-prefix versioning

## Performance Considerations
- Tag invalidation is O(1) for Redis; O(n) for file/database cache
- Cache warm overhead: warming 10K keys takes 1-5 seconds on Redis; do this before traffic ramp
- Lock-based stampede prevention adds 1-5ms for uncontested locks, 50-200ms contested
- Versioned prefix approach has zero overhead (key lookup is same cost)

## Security Considerations
- Never warm cache with user-specific data (privacy violation risk)
- Cache invalidation should not be triggerable by unauthenticated users
- Lock keys should be namespaced to prevent collision with data keys
- Monitor cache invalidation rate as a signal for potential cache poisoning attempts

## Common Mistakes
1. **Full cache flush on deploy**: Using `Cache::flush()` in deployment script (Cause: convenience; Consequence: origin overload for 5-30 minutes as all cache recomputes; Better: versioned cache keys or tag-based selective flush)
2. **No stampede protection**: Allowing 100 concurrent requests to recompute same expired cache (Cause: missing distributed lock; Consequence: database overload, increased latency, potential outage; Better: wrap recomputation in `Cache::lock('key')->get(function() { ... })`)
3. **Over-warming on deploy**: Warming every possible cache entry on each deploy (Cause: "better safe than sorry" approach; Consequence: CPU/memory spike during warm, longer deploy time; Better: warm only critical paths, let lazy loading handle the rest)

## Anti-Patterns
- **Cache-everything-on-deploy**: Pre-computing all cache entries during deployment wastes compute and time
- **No invalidation strategy**: Just relying on short TTLs (10 minutes) to keep data fresh; 90%+ miss rate
- **Sync invalidation in web requests**: Invalidating cache during HTTP request-response cycle adds latency

## Examples
- **Deploy warmup script**: After deploy, warm config cache, route cache, top-100 most-accessed blog post HTML
- **Model observer invalidation**: Laravel `saved()` event -> `Cache::tags(['posts'])->flush()`
- **Versioned prefix**: `Cache::put("posts:v2:{$post->id}", $html, 86400)`; on deploy, increment version to `v3`
- **Stampede prevention**: `Cache::lock("post:{$id}")->block(5, function() { return expensiveComputation(); })`

## Related Topics
- Cache Prefix & TTL Strategy (ku-02)
- Cache Tier Selection (ku-01)
- Cache Hit Ratio Optimization

## AI Agent Notes
- Default to tag-based invalidation for Laravel Redis cache
- Always add stampede prevention when generating cache recomputation code
- Versioned prefix is the simplest safe approach for deploy-related invalidation

## Verification
- [ ] Cache stampede prevention implemented for all expensive computations
- [ ] Tag-based invalidation for all related key groups
- [ ] Deploy script includes selective cache warm (not full flush)
- [ ] Versioned prefix or similar deploy-safe invalidation in place
- [ ] Model observers handle cache invalidation on write
