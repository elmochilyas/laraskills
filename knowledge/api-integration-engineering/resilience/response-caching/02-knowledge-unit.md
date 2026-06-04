# Metadata
Domain: API Integration Engineering
Subdomain: Idempotency & Data Consistency
Knowledge Unit: Response Caching Strategies for API Calls (Cache Facade, Redis)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Response caching reduces latency and upstream load by storing API responses and reusing them for identical subsequent requests. In Laravel, caching is implemented via the Cache facade (with Redis, Memcached, or file backends) and encompasses GET request caching, idempotency response caching, and time-based expiration strategies. Proper cache invalidation, key design, and TTL management are critical to prevent stale data while maximizing cache hit rates.

## Core Concepts
- **GET Request Caching**: Cache responses for idempotent GET/HEAD requests with URL+params as cache key
- **Response TTL**: Duration the cached response is considered fresh; after expiry, re-fetch from upstream
- **Cache Key Design**: Deterministic key from request parameters: `api:$service:$method:$path:md5($params)`
- **Cache Tagging**: Group cache entries by service for bulk invalidation
- **Stale-While-Revalidate**: Serve stale cache while asynchronously refreshing in the background
- **Cache Stampede Prevention**: Lock-based cache regeneration to prevent concurrent rebuilds
- **Negative Caching**: Cache 4xx/5xx responses briefly to prevent retry storms on failing endpoints

## Mental Models
- **Memory Palace**: The cache is a memory palace where each response has a designated storage room (key)
- **Freshness Dating**: Each cached response has a "best by" date (TTL); after that, it's considered stale
- **Cache as Shock Absorber**: The cache absorbs request spikes by serving stored responses instead of hitting upstream

## Internal Mechanics
- Laravel `Cache::remember("api.$key", $ttl, fn() => Http::get(...))` implements cache-aside pattern
- Cache key typically includes service name, endpoint path, and parameter hash
- `Cache::tags(['api', 'stripe'])->flush()` bulk invalidates all entries for a service
- Cache stampede protection: `Cache::lock("api.$key.lock")` prevents concurrent cache misses from all hitting upstream
- Stale-while-revalidate: Serve cached data, then dispatch a queue job to refresh the cache
- Negative caching: Cache 429 responses for `Retry-After` duration, 5xx for 60s to prevent immediate retry

## Patterns
- **Cache-Aside (Lazy Loading)**: Check cache first; on miss, fetch from API, store in cache, return
- **Cache-Through (Write-Through)**: Always fetch from API and update cache in the background
- **Time-Based Expiration**: Fixed TTL (e.g., 300s); simplest and most common
- **Conditional Caching (ETag/Last-Modified)**: Use upstream ETag headers to validate cache freshness without full refetch
- **Service-Specific TTLs**: Different TTLs for different APIs based on data volatility
- **Cache Hierarchy**: In-memory (request cache) → Redis (shared cache) → API (source of truth)

## Architectural Decisions
- Use GET vs POST cache: cache GET natively in Laravel; POST caching requires idempotency key pattern
- Choose Redis over file/database cache for production (distributed, atomic, TTL)
- Set TTL based on data freshness requirements: 60s for real-time data, 3600s for reference data
- Implement cache keys with service prefix for namespace isolation
- Use cache tags for bulk invalidation when data relationships change
- Apply negative caching for critical endpoints to reduce upstream load during outages

## Tradeoffs
- Longer TTLs increase hit rate but risk serving stale data
- Shorter TTLs improve freshness but increase upstream load
- Cache tag support is Redis-specific; file/database cache doesn't support tags
- Response caching saves upstream calls but adds memory pressure on the cache store
- Conditional caching (ETag) reduces bandwidth but adds cache validation round-trips

## Performance Considerations
- Cache hit: 1-5ms for Redis, sub-millisecond for in-memory
- Cache miss: full API latency + cache write overhead (~10ms)
- Response storage size affects Redis memory; consider response size limits
- Large cached responses increase serialization/deserialization time
- Cache stampede during high traffic can temporarily amplify upstream load

## Production Considerations
- Monitor cache hit rate per service as a key performance indicator
- Set Redis `maxmemory-policy` to `allkeys-lru` for automatic eviction of least-used entries
- Implement cache warming for critical endpoints after deployment
- Log cache misses and hits for capacity planning and cache tuning
- Use different Redis databases or prefixes per environment to prevent cross-environment cache poisoning
- Implement cache invalidation on data changes (e.g., webhook events trigger cache clear for related endpoints)

## Common Mistakes
- Caching POST/PUT/DELETE responses without idempotency keys (leads to stale or incorrect behavior)
- Using overly complex cache keys that include timestamps or session-specific data (zero hit rate)
- Not implementing cache stampede protection (multiple concurrent requests all fetch from API)
- Caching large responses without size limits (causes Redis memory pressure)
- Setting uniform TTL across all services (some data changes faster than others)
- Not invalidating cache when upstream data changes (serves stale data indefinitely until TTL expiry)

## Failure Modes
- Cache poisoning: serving corrupted or malicious cached data (validate cache integrity)
- Cache avalanche: many cached entries expire simultaneously (spike in upstream load)
- Cache crash loop: application repeatedly fetches and caches data due to stampede
- Memory exhaustion: unbounded cache growth consumes all Redis memory
- Stale data serving: TTL too long; users see outdated information
- Negative cache poison: caching an error response for too long extends the outage window

## Ecosystem Usage
- Laravel Cache facade with Redis driver is the standard production caching stack
- SaloonPHP cache plugin provides connector-level response caching with configurable TTL
- Laravel `Cache::remember()` is the primary API for cache-aside pattern
- API gateways (Kong, AWS API Gateway) implement response caching at the proxy layer
- HTTP conditional caching (ETag/If-None-Match) reduces bandwidth for frequently-accessed resources

## Related Knowledge Units
- K006: Idempotency Key Pattern (caching idempotent responses)
- K010: SaloonPHP Connector/Request/Response Pattern (cache plugin context)
- K026: Cache Plugin for SaloonPHP (connector-level caching)
- K008: Rate Limiting Algorithms (negative caching interacts with rate limiting)

## Research Notes
- Laravel's Cache facade supports Redis, Memcached, DynamoDB, and file backends
- Redis Cache driver uses `predis/predis` or `phpredis` extension; `phpredis` is recommended for production
- Cache tags require Redis >= 2.1.0 or Memcached >= 3.0.0
- Saloon's cache plugin supports time-based and conditional (ETag) caching strategies
- Stale-while-revalidate is not natively supported by Laravel Cache; requires custom implementation
