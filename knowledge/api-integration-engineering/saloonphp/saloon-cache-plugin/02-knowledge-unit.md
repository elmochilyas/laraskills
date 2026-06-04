# Metadata
Domain: API Integration Engineering
Subdomain: API Client SDK Design
Knowledge Unit: Cache Plugin for SaloonPHP
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
SaloonPHP's cache plugin provides connector-level response caching for GET requests, reducing API call volume and improving response latency. It supports configurable TTL, conditional caching via ETag/Last-Modified headers, cache invalidation strategies, and customizable cache stores. The plugin operates at the Saloon middleware layer, intercepting responses before they reach the caller and caching them transparently.

## Core Concepts
- **Response Caching**: Store API responses and serve them for subsequent identical requests within TTL
- **TTL (Time-To-Live)**: Per-request or per-connector cache duration determination
- **Conditional Caching**: Use upstream ETag or Last-Modified headers for cache validation without full refetch
- **Cache Store**: PSR-16 or PSR-6 compatible cache backend (Redis, Laravel Cache, file, in-memory)
- **Cache Key Generation**: Deterministic key from connector + request class + serialized parameters
- **Request Exclusions**: Opt-out specific requests from caching via request properties or headers

## Mental Models
- **Memoization Layer**: The plugin remembers previous responses and returns them instead of re-fetching
- **Freshness Check**: Like checking expiration dates on groceries; stale entries are replaced with fresh ones
- **Conditional Refresh**: Only download new data if it changed (ETag is like a version number; same version = skip download)

## Internal Mechanics
- Plugin intercepts the response in Saloon's middleware pipeline before returning to caller
- On request: check cache for key; if fresh hit, return cached response; if miss, send request
- On response: store response (with TTL) using cache key; respect `Cache-Control` headers if configured
- Cache key: `md5(get_class($connector) . get_class($request) . serialize($request->query()->all()))`
- Conditional requests: store ETag/Last-Modified; on subsequent requests, send `If-None-Match`/`If-Modified-Since` headers
- 304 Not Modified response: return cached response (bandwidth saved, latency reduced)
- Cache invalidation: clear by key, by tag, or full flush

## Patterns
- **Connector-Level Default TTL**: Set base TTL on connector; override per request for specific endpoints
- **Cache Tagging**: Group responses by service or resource type for bulk invalidation
- **Conditional Requests**: Enable ETag-based caching for APIs that support it (reduces bandwidth)
- **Cache-Aside with Background Refresh**: Serve stale cache and refresh asynchronously via queue job
- **Selective Caching**: Cache only specific requests (list endpoints); exclude mutating requests (POST, PUT)
- **Cache Invalidation on Webhooks**: Clear related cached responses when webhook indicates data change

## Architectural Decisions
- Enable caching for read-heavy connectors (reference data, lookup APIs) to reduce costs and latency
- Set TTL based on data freshness requirements: 60s for volatile data, 3600s for reference data
- Use Redis cache store for production (distributed, TTL support, atomic operations)
- Enable conditional caching for APIs that support ETags (reduces bandwidth even for cache misses)
- Exclude POST/PUT/DELETE requests from caching (they are not idempotent)
- Invalidate cache via webhook events: when webhook confirms data change, flush related cache

## Tradeoffs
- Caching reduces API call volume and latency but serves potentially stale data
- Shorter TTLs improve freshness but reduce cache hit rate and upstream savings
- Conditional caching reduces bandwidth but adds validation round-trip latency
- Cache invalidation on webhooks keeps cache fresh but adds complexity and coupling
- Cache tags enable targeted invalidation but require tag-capable drivers (Redis, not file)

## Performance Considerations
- Cache hit: sub-millisecond (in-memory) to 5ms (Redis) — significantly faster than API call (50-5000ms)
- Cache write: 5-20ms depending on response size and store
- Cache key computation: ~0.01ms per request
- Cache storage: proportional to number of unique requests × response size
- Conditional request (304): eliminates response body transfer (bandwidth savings of 90%+ for unchanged data)

## Production Considerations
- Monitor cache hit rate per connector as a key performance metric
- Set up alerts on cache hit rate drops (indicates configuration issues or data pattern changes)
- Configure max cache entry size to prevent large responses from consuming memory
- Use Redis `maxmemory-policy: allkeys-lru` for automatic eviction of least-used entries
- Implement cache warming for critical endpoints after deployment
- Log cache misses to identify optimization opportunities

## Common Mistakes
- Caching non-idempotent endpoints (POST requests that create resources)
- Setting uniform TTL across all endpoints without considering data freshness requirements
- Not excluding authentication endpoints from cache (cached auth responses cause security issues)
- Using file cache store in production (not distributed across servers)
- Forgetting to implement cache invalidation when upstream data changes
- Caching responses with user-specific data in a shared cache (data leakage)

## Failure Modes
- Stale cache: API returns updated data but cache serves old response until TTL expires
- Cache poisoning: corrupted cached response served to all consumers
- Cache stampede: multiple concurrent cache misses when entry expires (all hit upstream simultaneously)
- Memory exhaustion: unbounded cache growth consumes all Redis memory
- Conditional request loop: ETag mismatch on every request prevents caching

## Ecosystem Usage
- SaloonPHP cache plugin is an official plugin; compatible with v3 and v4
- Uses PSR-16 (SimpleCache) or PSR-6 (Cache Pool) interfaces for store interoperability
- Laravel's Cache facade can be adapted as a PSR-16 store via `laravel/psr16-adapter`
- Redis is the recommended production store for distributed cache operations
- Community users combine cache plugin with DTO plugin: cached responses auto-cast to DTOs

## Related Knowledge Units
- K010: SaloonPHP Connector/Request/Response Pattern (plugin host)
- K015: Response Caching Strategies (conceptual foundations)
- K016: DTOs vs Resources Pattern (cached responses mapped to DTOs)
- K006: Idempotency Key Pattern (relationship between idempotency and response caching)

## Research Notes
- Saloon cache plugin supports both time-based (TTL) and conditional (ETag/Last-Modified) caching
- The plugin integrates with Saloon's middleware pipeline using `bootConnector()` trait hook
- Cache key generation is customizable via `cacheKey()` method override
- The plugin respects upstream `Cache-Control` headers when configured to do so
- Documentation: docs.saloon.dev/plugins/cache-plugin
