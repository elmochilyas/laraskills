# ECC Standardized Knowledge — Cache Plugin for SaloonPHP

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | api-client-sdk-design |
| Knowledge Unit ID | k026 |
| Knowledge Unit | Cache Plugin for SaloonPHP |
| Difficulty | Advanced |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K010, K015, K016, K006 |

## Overview (Engineering Value)
SaloonPHP's cache plugin provides connector-level response caching for GET requests, reducing API call volume and improving response latency. It supports configurable TTL, conditional caching via ETag/Last-Modified headers, cache invalidation strategies, and customizable cache stores. The engineering value lies in transparent middleware-layer caching — the plugin intercepts responses in Saloon's pipeline before they reach the caller, caching them with zero application code changes per request. For read-heavy integrations (reference data, lookup APIs), this can reduce API costs by 60-90% and improve response times from hundreds of milliseconds to single-digit milliseconds.

## Core Concepts
- **Response Caching**: Store API responses and serve them for subsequent identical requests within TTL
- **TTL (Time-To-Live)**: Per-request or per-connector cache duration, configured in seconds
- **Cache Store**: PSR-16 or PSR-6 compatible backend (Redis, Laravel Cache, file, in-memory)
- **Cache Key Generation**: Deterministic key from connector class + request class + serialized query parameters
- **Conditional Caching**: Use upstream ETag/Last-Modified headers for cache validation without full response body fetch
- **Request Exclusions**: Opt-out specific requests from caching via request properties or headers

## When To Use
- Read-heavy connectors: reference data APIs, product catalogs, lookup services consumed frequently
- Volatile upstream APIs with rate limits: caching reduces request count, preserving budget for writes
- Data that changes infrequently: configuration APIs, static metadata, pricing tables
- Latency-sensitive features: user-facing pages that depend on external API data

## When NOT To Use
- Write-heavy endpoints (POST, PUT, DELETE, PATCH): non-idempotent requests must never be cached
- Real-time data feeds: stock prices, live scores, chat messages where staleness is unacceptable
- Authentication endpoints: cached auth responses cause security vulnerabilities (stale tokens, expired sessions)
- User-specific data in shared cache stores: response data may leak between users if cache key doesn't include user context
- APIs returning large responses (>1MB): cache storage cost and serialization overhead may outweigh benefits

## Best Practices (explain WHY)
- **Set TTL per endpoint, not per connector**: Different endpoints have different freshness requirements; charge endpoints need seconds, reference data can handle hours
- **Use Redis as cache store in production**: File cache doesn't scale across servers; Redis provides TTL, atomic operations, and eviction policies
- **Enable conditional caching for ETag-supporting APIs**: 304 responses eliminate body transfer; bandwidth savings of 90%+ for unchanged data
- **Exclude non-GET requests from caching**: POST/PUT/DELETE are non-idempotent; caching them produces incorrect application state
- **Implement cache invalidation via webhooks**: When upstream data changes, flush related cache entries to maintain freshness without waiting for TTL expiry
- **Monitor cache hit rate as a key metric**: Hit rate drops indicate configuration issues, data pattern changes, or stale configuration

## Architecture Guidelines
- Apply cache plugin at the connector level via `HasCachePlugin` trait in `bootConnector()`
- Override `cacheKey()` for non-standard key derivation (include tenant ID, API version)
- Use cache tags for targeted invalidation (Redis required): tag by service name, resource type
- Separate cache configuration per environment: short TTLs in dev for fresh data, longer in production for cost savings
- Background refresh pattern: serve stale cache + refresh asynchronously via queue job for critical endpoints

## Performance Considerations
- Cache hit: sub-millisecond (in-memory) to 5ms (Redis) — significantly faster than API call (50-5000ms)
- Cache write: 5-20ms depending on response size and store
- Cache key computation: ~0.01ms per request (MD5 hash of connector + request + serialized params)
- Conditional request (304): eliminates response body transfer — bandwidth savings of 90%+ for unchanged data
- Cache stampede protection: use lock-based cache rebuild for high-traffic endpoints to prevent concurrent cache misses

## Security Considerations
- Never cache responses containing PII, tokens, or user-specific data in shared stores
- Cache key must include user identity for user-scoped endpoints to prevent data leakage between users
- Use encrypted Redis connections (TLS) for production cache stores containing sensitive API data
- Authentication responses must never be cached; stale auth data can authorize revoked sessions
- Validate that cache exclusion list covers all endpoints handling sensitive operations

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Caching POST/PUT requests | Misunderstanding idempotency | Stale mutations served on retry; incorrect application state | Only cache GET requests; use idempotency keys for writes |
| Uniform TTL for all endpoints | Simplicity | Stale data for volatile endpoints; cache misses for static data | Set per-endpoint TTL based on data freshness SLAs |
| Caching auth endpoints | Ignoring credential lifecycle | Stale tokens authorize revoked sessions | Exclude auth endpoints in cache exclusion list |
| No cache invalidation on data changes | Assuming TTL is sufficient | Stale data served until TTL expiry | Invalidate cache via webhook or event listener on data mutation |
| User data in shared cache | Missing user context in key | User A sees User B's data | Include user ID in cache key; or use per-user cache namespace |
| File cache in production | Local dev habit | Cache not shared across servers; inconsistent responses | Use Redis or DynamoDB for distributed cache stores |

## Anti-Patterns
- **Cache-All Connector**: Enabling caching on a connector without selective exclusions (caches non-idempotent and auth requests)
- **Zero-TTL Caching**: Setting TTL=0 as a "disable" mechanism (creates cache overhead with no benefit; remove plugin instead)
- **Blind Invalidation on Every Mutation**: Flushing entire cache on any write (invalidates unrelated entries; use targeted tag-based invalidation)
- **Caching Without Monitoring**: Deploying cache without hit-rate telemetry (cannot detect configuration drift or performance regression)

## Examples (concise, architectural)
```php
class StripeConnector extends Connector
{
    use HasCachePlugin;

    public function resolveBaseUrl(): string { return 'https://api.stripe.com/v1/'; }

    public function bootConnector(): void
    {
        $this->withCache(new RedisStore($this->redis), ttl: 3600)
             ->cacheOnlyRequestsUsing(function (Request $request): bool {
                 return $request instanceof GetRequest; // Only cache GET
             });
    }

    protected function defaultCacheKey(Request $request, array $queryParams): string
    {
        return 'stripe:' . $request::class . ':' . md5(json_encode($queryParams));
    }
}

// Conditional caching with ETag
$this->withCache(new RedisStore($this->redis), ttl: 3600)
     ->enableConditionalCaching();

// Cache invalidation on webhook
Event::listen(PaymentReceived::class, function (PaymentReceived $event) {
    Cache::tags(['stripe:charges'])->flush();
});
```

## Related Topics
- **Prerequisites**: Saloon Connector/Request pattern, PSR-16/PSR-6 cache interfaces
- **Closely Related**: HTTP caching headers (Cache-Control, ETag, Last-Modified), Laravel Cache system
- **Advanced**: Cache stampede prevention, distributed cache with Redis Cluster, cache warming strategies
- **Cross-Domain**: Rate limiting (caching reduces rate limit consumption), idempotency (cache vs idempotency storage)

## AI Agent Notes
- Use `HasCachePlugin` trait with conditional caching when upstream supports ETags
- Apply per-request TTL via the request class for fine-grained control
- Exclude non-GET and auth requests from caching in the `cacheOnlyRequestsUsing` filter
- Implement cache warmup for critical endpoints after deployment
- Combine cache plugin with DTO plugin: cached responses auto-cast to typed DTOs

## Verification
- [ ] Cache hit returns response without HTTP call to upstream
- [ ] TTL expiry triggers a fresh HTTP call on next request
- [ ] Conditional caching (ETag) returns cached response on 304
- [ ] Non-GET requests bypass cache and always reach upstream
- [ ] Auth endpoints excluded from cache configuration
- [ ] Cache invalidation clears specific entries via tag/key, not full flush
- [ ] Cache hit rate telemetry reports to monitoring system
