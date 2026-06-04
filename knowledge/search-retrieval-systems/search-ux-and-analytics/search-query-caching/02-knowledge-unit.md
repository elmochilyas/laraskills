# Knowledge Unit: Search Query Caching

## Metadata

- **ID:** K063
- **Subdomain:** Search UX & Analytics
- **Source:** Laravel / Redis / General
- **Maturity:** Stable
- **Laravel Relevance:** Cache search results by query hash

## Executive Summary

Search query caching stores the results of expensive search queries in Laravel's cache system (Redis, Memcached, file, database) to reduce latency and engine load. Popular searches, paginated results, and facet-heavy queries benefit most from caching. Cache invalidation must consider index updates — stale search results are a common production issue.

## Core Concepts

- **Cache Key Strategy**: Typically `search:{md5(query)}:{page}` or similar for uniqueness.
- **TTL (Time To Live)**: How long cached results are valid. 30-300 seconds is common.
- **Cache Invalidation**: When the search index changes, cached results become stale. Strategies include flushing cache on index update or using short TTIs.
- **Granularity**: Full-result caching (entire response) vs query-caching (cache search engine query, not results).

## Internal Mechanics

A caching proxy wraps the search query execution. Before calling the search engine, the cache is checked for a matching key. If found, cached results are returned immediately. If not, the query executes, results are stored in the cache (with TTL), and returned. Cache invalidation can be triggered by model events (after index update) or time-based.

## Patterns

- **Popular query cache**: Identify top 100 search terms via analytics, cache them with longer TTL.
- **Paginated result cache**: Each page of results is cached independently.
- **Facet count cache**: Facet-heavy queries benefit from caching since counts don't change frequently.
- **Prefix-based invalidation**: Use cache tags (Redis) to invalidate all search queries when index changes.

## Architectural Decisions

Search caching is a balance between freshness and performance. Zero-cache gives the most up-to-date results. Full-cache gives the best performance. The right approach depends on index update frequency and freshness requirements.

## Tradeoffs

| Strategy | Freshness | Performance | Complexity |
|---|---|---|---|
| No cache | Best | Worst | None |
| Short TTL (30s) | Good | Good | Low |
| Event-triggered invalidation | Very good | Very good | Medium |
| Pre-warm popular queries | Acceptable | Best | High |

## Performance Considerations

- Cache hit eliminates search engine call entirely — 0-5ms vs 10-200ms.
- Cache storage grows with unique query count × page count.
- Redis cache hits are typically <1ms.
- Cache invalidation on every index update may cause cache stampedes (many queries miss cache simultaneously).

## Production Considerations

- **Use Redis for search caching** — Memcached and file cache have size limitations.
- **Implement cache tags** (Redis) for efficient invalidation.
- **Set reasonable TTIs**: 30-300 seconds is the sweet spot for most applications.
- **Monitor cache hit rate**: <80% hit rate indicates cache strategy needs improvement.
- **Consider cache warming**: Pre-populate cache for top 50 search terms after deployment.

## Common Mistakes

- Caching too long — users see stale results (indexed products don't appear in search for minutes).
- Not including pagination page in cache key — same query, different pages collide.
- Caching personalized search results — user-specific results should not be cached globally.
- Cache invalidation on every save — excessive cache flushing reduces hit rate.

## Failure Modes

- **Cache stampede**: When cache expires for a popular query, many requests simultaneously hit the search engine.
- **Stale results**: Index updated but cache not invalidated — users see outdated results.
- **Cache key collision**: Different queries producing the same MD5 hash (extremely unlikely but theoretically possible).
- **Redis memory exhaustion**: Too many unique queries cached — implement LRU eviction or limit cache size.

## Ecosystem Usage

Standard practice in production Laravel search implementations. Essential for high-traffic applications where search engine query costs (latency or pricing) are significant.

## Related Knowledge Units

- K012 (Scout paginate)
- K065 (Search performance benchmarking)

## Research Notes

Sources: Laravel cache docs, community production patterns. Search caching is often overlooked in initial implementations but becomes critical at scale. Cache tags (Redis) provide the most elegant invalidation — all cached queries for a model can be invalidated together.


## Mental Models

- **Tool Analogy**: Think of this capability as a specialized tool in a toolbox. It addresses a specific problem well, but using it for the wrong job creates friction.
- **Lever Model**: The feature acts as a force multiplier — a small configuration change (effort) produces a large search quality improvement (result). Finding the right lever is key.

