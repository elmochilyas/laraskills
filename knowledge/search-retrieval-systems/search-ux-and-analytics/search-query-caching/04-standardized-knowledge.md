| Metadata | |
|---|---|
| KU ID | K063 |
| Subdomain | search-ux-and-analytics |
| Topic | Search Query Caching |
| Source | Laravel / Redis |
| Maturity | Stable |

## Overview

Search query caching stores search results by query hash to reduce backend load and improve response times. Cached results serve identical subsequent queries instantly. Caching strategies include TTL-based expiration, tag-based invalidation (clearing cache by model/index tag), and stale-while-revalidate patterns for serving stale content while refreshing in the background.

## Core Concepts

- **Query Hash Cache**: Cache key derived from query string + filters + page parameters.
- **TTL Expiration**: Results expire after a set time (e.g., 5 minutes for typical search).
- **Tag-Based Invalidation**: Cache tags per model or index — clear all search caches when data changes.
- **Stale-While-Revalidate**: Serve stale results while asynchronously refreshing cache.
- **Cache Hit Ratio**: Percentage of queries served from cache (target >50% for typical workloads).

## When To Use

- High-traffic search with many identical/repeated queries
- Search results that don't need real-time freshness
- Trending/popular searches that many users perform
- Expensive search queries (complex filters, vector search)
- API endpoints with paginated search (cache each page)

## When NOT To Use

- Real-time search results requiring immediate freshness (ticketing, inventory)
- Personalized search results (different results per user — cache key includes user ID)
- Very low-traffic search where caching adds complexity without benefit
- Search with constantly changing data (cache invalidation overhead exceeds savings)

## Best Practices

1. **Normalize cache keys**: Lowercase, trim whitespace, sort filter parameters.
2. **Set appropriate TTLs**: 1-5 minutes for most search, longer for static content.
3. **Use cache tags for invalidation**: Invalidate by model tag when records change.
4. **Cache paginated results**: Each page is a separate cache entry.
5. **Monitor cache hit ratio**: Low hit rate suggests caching strategy needs adjustment.

## Architecture Guidelines

- Use Laravel's Cache facade with Redis for distributed caching.
- Cache key: `search:{model}:{md5(query+filters+page)}`.
- Tag with model name: `Cache::tags(['search_products'])->put($key, $results, $ttl)`.
- Invalidate on model save: `Cache::tags(['search_products'])->flush()`.
- For Scout: wrap `search()` call in cache check + store.

## Performance Considerations

- Redis cache hit: <1ms vs search engine query: 20-200ms.
- Serialization overhead for large result sets (consider caching only IDs).
- Cache invalidation frequency: if data changes every second, caching is counterproductive.
- Memory usage: cache size = number of unique queries × average result size.

## Examples

```php
class SearchController
{
    public function __invoke(Request $request)
    {
        $cacheKey = 'search.products.' . md5(json_encode($request->all()));

        return Cache::tags(['search_products'])->remember($cacheKey, 300, function () use ($request) {
            return Product::search($request->q)
                ->where('status', 'published')
                ->paginate(20);
        });
    }
}
```

## Related Topics

- K012 (Scout paginate)
- K065 (Search performance benchmarking)
- K011 (Scout where clauses)

## AI Agent Notes

- Caching is the single most effective performance optimization for search.
- Use tag-based invalidation tied to model saves for cache freshness.
- For agents: implement query hash caching with Redis; use cache tags; set 1-5 min TTL; monitor hit ratio.

## Verification

- [ ] Search query caching implemented
- [ ] Cache key normalization in place
- [ ] Tag-based invalidation configured
- [ ] Appropriate TTL set for search type
- [ ] Cache hit ratio monitored
- [ ] Cache invalidation works on model saves
