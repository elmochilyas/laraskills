# ECC Standardized Knowledge — Caching Responses

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | http-client-api-consumption |
| Knowledge Unit ID | ku-03 |
| Knowledge Unit | Caching Responses |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K015, K026, K006 |

## Overview (Engineering Value)
Response caching reduces latency and upstream load by storing API responses and reusing them for identical subsequent requests. In Laravel, caching is implemented via the Cache facade (Redis, Memcached, file) and encompasses GET request caching, idempotency response caching, and time-based expiration. SaloonPHP's cache plugin provides connector-level caching with configurable TTL and conditional caching (ETag/Last-Modified). Proper cache invalidation, key design, and TTL management are critical to prevent stale data while maximizing hit rates.

## Core Concepts
- **Cache-Aside Pattern**: Check cache → miss → fetch API → store → return
- **Response TTL**: Duration the cached response is fresh before re-fetching
- **Cache Key Design**: Deterministic key from URL + params: `api:{service}:{path}:{param_hash}`
- **Conditional Caching**: ETag/Last-Modified headers for bandwidth-optimized cache validation
- **Cache Stampede Prevention**: Lock-based regeneration prevents concurrent cache misses
- **Negative Caching**: Temporarily caching error responses to prevent retry storms

## When To Use
- Read-heavy API integrations (reference data, lookups)
- APIs with rate limits: caching reduces call count
- Expensive API calls (slow or cost-per-call)
- Data that changes infrequently

## When NOT To Use
- Real-time data requiring fresh responses (prices, status)
- Mutating endpoints (POST/PUT/DELETE) without idempotency keys
- User-specific data that shouldn't be shared

## Best Practices
- Use Redis for production caching (distributed, TTL, atomic operations)
- Design keys with service prefix for namespace isolation: `api:stripe:charges:list`
- Set TTL based on data freshness: 60s for volatile data, 3600s for reference data
- Implement stampede protection with `Cache::lock()`
- Monitor hit rate per service as a key performance indicator

## Architecture Guidelines
- Saloon cache plugin for connector-level caching
- `Cache::remember()` in service classes for ad-hoc caching
- ETag-based validation for APIs that support it
- Cache invalidation via webhook events for timely refresh
- In-memory request cache → Redis → API hierarchy

## Performance Considerations
- Cache hit: 1-5ms (Redis) vs API call: 50-5000ms
- Stampede protection: 5-20ms overhead on cache miss
- Negative caching prevents retry storms at near-zero cost

## Common Mistakes
- Caching POST responses without idempotency
- Uniform TTL across all endpoints regardless of data volatility
- No stampede protection (multiple requests all hit upstream on cache miss)
- Overly complex cache keys with zero hit rate

## Related Topics
- **Prerequisites**: Laravel Cache facade, cache fundamentals
- **Closely Related**: Idempotency keys, conditional caching (ETag)
- **Advanced**: Stale-while-revalidate, cache warming, cache hierarchy
- **Cross-Domain**: Redis optimization, HTTP caching standards

## Verification
- [ ] Cache keys include service namespace and parameter hash
- [ ] TTL configured per endpoint based on data freshness requirements
- [ ] Cache stampede protection implemented
- [ ] Hit rate monitored per service
- [ ] Cache invalidation triggered by relevant data changes
