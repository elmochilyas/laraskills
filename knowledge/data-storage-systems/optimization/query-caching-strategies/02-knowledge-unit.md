# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.29 Query caching strategies (remember, tagged cache, materialized views)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

## Executive Summary

Caching database query results reduces database load and response latency, but introduces staleness and invalidation complexity. Laravel's `Cache::remember()` is the primary mechanism for caching query results. For more sophisticated needs, tagged cache enables group invalidation, and database materialized views provide server-side pre-computed results. The key insight: cache the rendered output, not the raw query results, to maximize cache hit value.

---

## Core Concepts

- **Cache::remember()**: Fetches from cache or executes the callback, stores the result, returns it. TTL-driven expiration.
- **Cache tags**: Group cache entries so they can be invalidated together. Requires cache driver that supports tags (Redis, Memcached).
- **Materialized views**: Database-level pre-computed query results stored as a physical table. Refreshed on schedule or on-demand. PostgreSQL supports concurrent refresh without blocking reads.
- **Cache stampede**: When a popular cache key expires and multiple concurrent requests all attempt to rebuild it simultaneously, overwhelming the database.
- **Stale-while-revalidate**: Serve stale cache while asynchronously rebuilding fresh cache. Reduces p95 latency during cache expiration.
- **Write-through vs write-behind**: Write-through updates cache on every write (strong consistency). Write-behind updates cache asynchronously (better throughput, eventual consistency).

```
Cache Latency Hierarchy (approximate):
  Memory cache (Redis/Memcached):   0.1-1ms
  Materialized view (database):     1-50ms (depends on refresh)
  Database query (with index):      1-100ms
```

---

## Mental Models

Think of query caching as a library with different shelves. `Cache::remember()` is the librarian who checks the front desk first, then goes to the stacks if needed. Tagged cache is color-coded stickers — you can clear all "reports" tags at once without touching "user profile" tags. Materialized views are reference books pre-compiled by the publisher (database) — you still go to the library, but the information is already compiled rather than assembled from scattered sources.

---

## Internal Mechanics

`Cache::remember()` checks the cache store. On miss, it executes the callback, serializes the result, and stores it with the given TTL. The cache store is decoupled from the database — the query callback is only ever executed on cache miss. Redis stores cached results as serialized PHP values (or JSON with the `array` serializer).

```php
// Basic query caching
$posts = Cache::remember('posts.active', 3600, fn() =>
    Post::with('author')->where('status', 'active')->get()
);

// The closure only runs on cache miss.
// Subsequent requests hit Redis/Memcached directly.
```

Materialized views in PostgreSQL are physical tables populated by a SELECT query. The `REFRESH MATERIALIZED VIEW` command replaces the contents atomically. With `CONCURRENTLY`, reads proceed during refresh (but it's slower and requires a unique index).

```sql
-- PostgreSQL materialized view
CREATE MATERIALIZED VIEW monthly_sales_summary AS
SELECT DATE_TRUNC('month', created_at) AS month,
       SUM(total) AS revenue,
       COUNT(*) AS order_count
FROM orders
WHERE status = 'completed'
GROUP BY 1;

-- Concurrent refresh (no lock on reads)
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales_summary;
```

---

## Patterns

**Tagged cache for model-based invalidation**: Tag cache entries by model or domain concept. When a model is saved, flush its tags.

```php
// Set with tags
$posts = Cache::tags(['posts', 'feed'])->remember('feed.active', 3600, fn() =>
    Post::with('author')->where('status', 'active')->latest()->take(20)->get()
);

// Invalidate on model change
Post::created(function (Post $post) {
    Cache::tags(['posts', 'feed'])->flush();
});

Post::updated(function (Post $post) {
    Cache::tags(['posts', 'feed'])->flush();
});
```

**Stale-while-revalidate pattern**: Serve stale data while background job refreshes cache. Prevents stampede on hot keys.

```php
// Serve stale data during refresh
public function getActivePosts(): Collection
{
    $cacheKey = 'posts.active';
    $ttl = 3600;
    $staleTtl = 7200;

    $posts = Cache::get($cacheKey);

    if ($posts === null) {
        // Cache miss — fetch fresh, cache, return
        $posts = Post::with('author')->where('status', 'active')->get();
        Cache::put($cacheKey, $posts, $ttl);
        return $posts;
    }

    // If cache is within stale window, dispatch async refresh
    if (Cache::has("{$cacheKey}.refresh_scheduled") === false) {
        Cache::put("{$cacheKey}.refresh_scheduled", true, 60);
        RefreshPostCache::dispatch($cacheKey)->delay(now()->addSeconds(2));
    }

    return $posts;
}
```

**Query result caching vs fragment caching**: Cache the rendered Blade/API output, not the Collection. A cached View response avoids both the query AND the serialization cost.

```php
// Better: cache the rendered output
$html = Cache::remember('feed.html', 3600, fn() =>
    view('feed', ['posts' => Post::with('author')->where('status', 'active')->latest()->take(20)->get()])->render()
);

// Even better for API: cache the JSON response
return Cache::remember('feed.json', 3600, fn() =>
    response()->json(PostResource::collection(
        Post::with('author')->where('status', 'active')->latest()->take(20)->get()
    ))
);
```

---

## Architectural Decisions

| Decision | When | When Not |
|----------|------|----------|
| Cache::remember() | Simple TTL-based caching, single keys | Complex invalidation patterns needed |
| Tagged cache | Group invalidation across multiple keys | Cache driver doesn't support tags (file, database) |
| Materialized view | Complex aggregations queried frequently | Real-time data required, or data changes every second |
| Stale-while-revalidate | Hot cache keys with high read concurrency | Cache stampede risk is acceptable |

---

## Tradeoffs

| Benefit | Cost |
|---------|------|
| Query cache reduces DB load by 80-95% | Stale data between cache invalidation and refresh |
| Tagged cache enables precise invalidation | Only works with Redis/Memcached, not file/db driver |
| Materialized view is fast for complex aggregates | Refresh overhead, storage cost, stale window |
| Stale-while-revalidate prevents stampede | Increased complexity, background job infrastructure |
| Fragment caching maximizes cache value | Cache varies by user/auth state — careful key design needed |

---

## Performance Considerations

- Measure cache hit ratio. A ratio below 80% indicates either too-short TTLs or an access pattern not suited to caching.
- Large cached collections consume memory. 10,000 Eloquent models at ~2KB each = ~20MB per cache key. Consider caching paginated or limited subsets instead.
- Materialized view refresh time grows with data volume. A 10M-row aggregation might take 30 seconds to refresh. Use `CONCURRENTLY` to avoid blocking reads, and schedule refreshes during low-traffic periods.
- Serialization cost: Eloquent models are expensive to serialize/deserialize. Cache arrays or DTOs instead of full model instances for better performance.

```php
// Faster: cache arrays instead of models
$posts = Cache::remember('posts.active.array', 3600, fn() =>
    Post::with('author')
        ->where('status', 'active')
        ->get()
        ->toArray() // Cache plain arrays, not models
);
```

---

## Production Considerations

- **Cache key naming convention**: `{domain}:{action}:{params}` — e.g., `posts:feed:active:limit20`. Namespace by model to avoid collisions.
- **Warm cache after deploy**: After deployment, trigger cache warming for critical endpoints via a console command or queue job. Cold cache + high traffic = database overload.
- **Monitor cache miss rate spikes**: A sudden increase in cache misses indicates either a deployment that changed cache keys, a batch invalidation, or TTL expiration alignment.
- **Cache prefix per environment**: Use `cache.prefix` config to separate dev/staging/production cache namespaces and prevent cross-environment pollution.

```php
// config/cache.php
'prefix' => env('CACHE_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_cache'),
```

---

## Common Mistakes

**Caching Eloquent models with relationships**: `Cache::remember('post', 3600, fn() => Post::with('comments')->first())` — when retrieved from cache, relationships are already loaded. If you later call `$post->comments()->where(...)`, you'll query the DB again because the relationship is already in memory. Cache the result, not the query.

**Caching paginated results incorrectly**: Caching a paginator instance serializes the entire dataset, destroying pagination. Cache only the item collection and pass it to a manually constructed paginator.

**No cache invalidation strategy**: Setting long TTLs without model event-based invalidation leads to stale data displayed for hours. Always pair TTL with explicit invalidation for mutable data.

```php
// Wrong: no invalidation — stale until TTL expires
$posts = Cache::remember('posts', 3600, fn() => Post::all());

// Right: invalidate on mutation
$posts = Cache::tags(['posts'])->remember('posts.all', 3600, fn() => Post::all());
// In Post model boot:
static::saved(fn() => Cache::tags(['posts'])->flush());
```

---

## Failure Modes

- **Cache stampede**: 100 concurrent requests all miss cache simultaneously, all execute the same expensive query. Database CPU spikes to 100%. Solution: stale-while-revalidate, lock-based rebuild (mutex), or pre-warm.
- **Cache poisoning**: A malicious or malformed query result is cached and served to all users. Use cache key validation and never cache user-specific data under a shared key.
- **Memory exhaustion**: A single large cache entry (e.g., all products as a serialized collection) consumes significant Redis memory. Monitor Redis `used_memory` and set `maxmemory-policy allkeys-lru` as a safety net.
- **Materialized view staleness**: A report displaying data from yesterday's refresh when today's data exists. Schedule refresh at appropriate intervals and display "last refreshed" timestamps.

---

## Ecosystem Usage

Laravel's cache system integrates with Redis, Memcached, DynamoDB, and the file system. Redis is the recommended driver for production query caching due to tag support, persistence, and atomic operations. Laravel Nova uses query caching for resource listings. Packages like `spatie/laravel-responsecache` cache full responses including database queries.

---

## Related Knowledge Units

2.3 Eager loading | 4.18 Keyset pagination | 4.23 When to drop to query builder | 12.27 Materialized views in PostgreSQL

---

## Research Notes

MySQL 8.0 removed the query cache feature (it was disabled by default in 5.7 and removed in 8.0). The application-level caching approach in Laravel (Cache::remember) is now the standard pattern. PostgreSQL's materialized views remain the only server-side query caching mechanism. The ecosystem trend is toward edge caching (Varnish, Cloudflare) for full-page cache and Redis/application-level cache for query-result cache, with database-side caching limited to materialized views and buffer pool tuning.
