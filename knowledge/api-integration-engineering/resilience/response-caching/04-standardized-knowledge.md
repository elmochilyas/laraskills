# ECC Standardized Knowledge — Response Caching for Read Operations

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | resilience-patterns |
| Knowledge Unit ID | ku-42 |
| Knowledge Unit | Response Caching for Read Operations |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K006, K009, K012 |

## Overview (Engineering Value)
Caching API responses reduces latency, decreases upstream load, and provides resilience when upstream is unavailable (serving stale data). Laravel's cache system with Redis provides sub-millisecond read operations. Appropriate TTLs and cache invalidation strategies ensure data freshness while maximizing cache hit rates.

## Core Concepts
- **Cache Hit**: Request served from cache (fast, ~1ms)
- **Cache Miss**: Request forwarded to upstream (slow, ~100-500ms)
- **TTL**: Time-to-live for cached response
- **Stale-While-Revalidate**: Serve stale data while fetching fresh version async
- **Cache Tagging**: Group cache entries for bulk invalidation
- **Cache Stampede**: Multiple requests all miss cache simultaneously
- **Conditional Requests**: If-Modified-Since / ETag for HTTP-level caching

## When To Use
- Read-only GET endpoints with low change frequency
- Aggregate/dashboard endpoints with composite data
- Reference data (currency rates, product catalog, static config)
- Rate-limited upstream APIs (cache to avoid hitting limits)

## When NOT To Use
- Real-time data (stock prices, live scores)
- User-specific dynamic data (use session/user cache)
- Write-heavy endpoints where invalidation overhead exceeds benefit
- Data sensitive to slight staleness

## Best Practices
- Cache with TTL proportional to data change frequency
- Use cache tags for group invalidation
- Implement cache stampede protection (lock-based or probabilistic early expiration)
- Cache at the service class level, not controller level
- Use stale-while-revalidate for high-availability requirements
- Monitor cache hit ratio (target >90%)

## Architecture Guidelines
- Cache layer in repository or service class
- Cache keys follow convention: `{service}:{endpoint}:{params_hash}`
- Cache tags for resource-based invalidation
- Separate cache pool per upstream service
- Fallback to stale cache on upstream failure

## Performance Considerations
- Redis cache hit: ~1ms, Cache miss + upstream: ~100-500ms
- Cache tagging overhead: ~0.5ms per operation
- Stampede protection lock: ~1ms additional on miss
- Memory per cache entry: body size + headers + metadata

## Common Mistakes
- No cache invalidation strategy (serving stale data forever)
- Cache stampede on popular keys (all requests hit DB/upstream)
- Over-caching user-specific data (serving wrong user's data)
- Too-long TTL for dynamic data
- Caching without serialization awareness (JSON vs PHP objects)
- No monitoring of cache hit ratio

## Related Topics
- **Prerequisites**: Laravel cache, Redis basics
- **Closely Related**: Cache stampede protection, cache tags
- **Advanced**: Stale-while-revalidate, HTTP caching, CDN caching
- **Cross-Domain**: Performance optimization, data freshness

## Verification
- [ ] TTL configured per data type
- [ ] Cache tags used for group invalidation
- [ ] Stampede protection implemented
- [ ] Cache hit ratio monitored (target >90%)
- [ ] Fallback to stale cache on upstream failure
- [ ] Cache key convention documented and consistent
