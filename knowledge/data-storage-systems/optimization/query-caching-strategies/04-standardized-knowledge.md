# 4-29 Query Caching Strategies

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-29 |
| Knowledge Unit Title | Query Caching Strategies |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 2.3 Eager loading | 4.18 Keyset pagination | 4.23 When to drop to query builder | 12.27 Materialized views in PostgreSQL |
| Last Updated | 2026-06-02 |

## Overview

Caching database query results reduces database load and response latency, but introduces staleness and invalidation complexity. Laravel's `Cache::remember()` is the primary mechanism for caching query results. For more sophisticated needs, tagged cache enables group invalidation, and database materialized views provide server-side pre-computed results. The key insight: cache the rendered output, not the raw query results, to maximize cache hit value.

---

## Core Concepts

- **Cache::remember()**: Fetches from cache or executes the callback, stores the result, returns it. TTL-driven expiration.
- **Cache tags**: Group cache entries so they can be invalidated together. Requires cache driver that supports tags (Redis, Memcached).
- **Materialized views**: Database-level pre-computed query results stored as a physical table. Refreshed on schedule or on-demand. PostgreSQL supports concurrent refresh without blocking reads.
- **Cache stampede**: When a popular cache key expires and multiple concurrent requests all attempt to rebuild it simultaneously, overwhelming the database.
- **Stale-while-revalidate**: Serve stale cache while asynchronously rebuilding fresh cache. Reduces p95 latency during cache expiration.
- **Write-through vs write-behind**: Write-through updates cache on every write (strong consistency). Write-behind updates cache asynchronously (better throughput, eventual consistency).
- ```
- Cache Latency Hierarchy (approximate):
- Memory cache (Redis/Memcached):   0.1-1ms
- Materialized view (database):     1-50ms (depends on refresh)
- Database query (with index):      1-100ms
- ```


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Tagged cache for model-based invalidation**: Tag cache entries by model or domain concept. When a model is saved, flush its tags.
- ```php
- // Set with tags
- $posts = Cache::tags(['posts', 'feed'])->remember('feed.active', 3600, fn() =>
- Post::with('author')->where('status', 'active')->latest()->take(20)->get()
- );
- // Invalidate on model change
- Post::created(function (Post $post) {
- Cache::tags(['posts', 'feed'])->flush();
- });
- Post::updated(function (Post $post) {
- Cache::tags(['posts', 'feed'])->flush();
- });
- ```
- **Stale-while-revalidate pattern**: Serve stale data while background job refreshes cache. Prevents stampede on hot keys.
- ```php
- // Serve stale data during refresh
- public function getActivePosts(): Collection
- {
- $cacheKey = 'posts.active';
- $ttl = 3600;
- $staleTtl = 7200;
- $posts = Cache::get($cacheKey);
- if ($posts === null) {
- // Cache miss — fetch fresh, cache, return
- $posts = Post::with('author')->where('status', 'active')->get();
- Cache::put($cacheKey, $posts, $ttl);
- return $posts;
- }
- // If cache is within stale window, dispatch async refresh
- if (Cache::has("{$cacheKey}.refresh_scheduled") === false) {
- Cache::put("{$cacheKey}.refresh_scheduled", true, 60);
- RefreshPostCache::dispatch($cacheKey)->delay(now()->addSeconds(2));
- }
- return $posts;
- }
- ```
- **Query result caching vs fragment caching**: Cache the rendered Blade/API output, not the Collection. A cached View response avoids both the query AND the serialization cost.
- ```php
- // Better: cache the rendered output
- $html = Cache::remember('feed.html', 3600, fn() =>
- view('feed', ['posts' => Post::with('author')->where('status', 'active')->latest()->take(20)->get()])->render()
- );
- // Even better for API: cache the JSON response
- return Cache::remember('feed.json', 3600, fn() =>
- response()->json(PostResource::collection(
- Post::with('author')->where('status', 'active')->latest()->take(20)->get()
- ))
- );
- ```


## Architecture Guidelines

- | Decision | When | When Not |
- |----------|------|----------|
- | Cache::remember() | Simple TTL-based caching, single keys | Complex invalidation patterns needed |
- | Tagged cache | Group invalidation across multiple keys | Cache driver doesn't support tags (file, database) |
- | Materialized view | Complex aggregations queried frequently | Real-time data required, or data changes every second |
- | Stale-while-revalidate | Hot cache keys with high read concurrency | Cache stampede risk is acceptable |


## Performance Considerations

- - Measure cache hit ratio. A ratio below 80% indicates either too-short TTLs or an access pattern not suited to caching.
- - Large cached collections consume memory. 10,000 Eloquent models at ~2KB each = ~20MB per cache key. Consider caching paginated or limited subsets instead.
- - Materialized view refresh time grows with data volume. A 10M-row aggregation might take 30 seconds to refresh. Use `CONCURRENTLY` to avoid blocking reads, and schedule refreshes during low-traffic periods.
- - Serialization cost: Eloquent models are expensive to serialize/deserialize. Cache arrays or DTOs instead of full model instances for better performance.
- ```php
- // Faster: cache arrays instead of models
- $posts = Cache::remember('posts.active.array', 3600, fn() =>
- Post::with('author')
- ->where('status', 'active')
- ->get()
- ->toArray() // Cache plain arrays, not models
- );
- ```


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Caching Eloquent models with relationships**: `Cache::remember('post', 3600, fn() => Post::with('comments')->first())` — when retrieved from cache, relationships are already loaded. If you later call `$post->comments()->where(...)`, you'll query the DB again because the relationship is already in memory. Cache the result, not the query. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Caching paginated results incorrectly**: Caching a paginator instance serializes the entire dataset, destroying pagination. Cache only the item collection and pass it to a manually constructed paginator. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | No cache invalidation strategy**: Setting long TTLs without model event-based invalidation leads to stale data displayed for hours. Always pair TTL with explicit invalidation for mutable data. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | ```php | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 5 | // Wrong: no invalidation — stale until TTL expires | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 6 | $posts = Cache::remember('posts', 3600, fn() => Post::all()); | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 7 | // Right: invalidate on mutation | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 8 | $posts = Cache::tags(['posts'])->remember('posts.all', 3600, fn() => Post::all()); | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 9 | // In Post model boot: | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 10 | static::saved(fn() => Cache::tags(['posts'])->flush()); | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 11 | ``` | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 12 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Cache stampede**: 100 concurrent requests all miss cache simultaneously, all execute the same expensive query. Database CPU spikes to 100%. Solution: stale-while-revalidate, lock-based rebuild (mutex), or pre-warm.
- - **Cache poisoning**: A malicious or malformed query result is cached and served to all users. Use cache key validation and never cache user-specific data under a shared key.
- - **Memory exhaustion**: A single large cache entry (e.g., all products as a serialized collection) consumes significant Redis memory. Monitor Redis `used_memory` and set `maxmemory-policy allkeys-lru` as a safety net.
- - **Materialized view staleness**: A report displaying data from yesterday's refresh when today's data exists. Schedule refresh at appropriate intervals and display "last refreshed" timestamps.


## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Query Optimization Profiling
- **Closely Related**: Other KUs within Query Optimization Profiling
- **Advanced**: Expert-level KUs building on this concept
- **Cross-Domain**: Related topics from other subdomains in Data andamp; Storage Systems

## AI Agent Notes

- Apply these concepts based on specific implementation requirements
- Consider tradeoffs between different approaches
- Validate assumptions with actual measurements
- Review related KUs for additional context

## Verification

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Architecture decisions are documented with rationale
- [ ] Related KUs have been consulted for cross-cutting concerns

