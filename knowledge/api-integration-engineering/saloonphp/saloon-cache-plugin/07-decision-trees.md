# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 02-saloonphp
**Knowledge Unit:** saloon-cache-plugin
**Generated:** 2026-06-03

---

# Decision Inventory

1. Cache Store Selection
2. TTL Configuration Strategy
3. Cache Invalidation Strategy
4. Conditional Caching Decision

---

# Architecture-Level Decision Trees

---

## Cache Store Selection

---

## Decision Context

Choosing the appropriate cache backend for SaloonPHP response caching.

---

## Decision Criteria

* performance
* architectural
* maintainability

---

## Decision Tree

Is the application deployed across multiple servers?
↓
YES → Use Redis (distributed, atomic operations, TTL, eviction)
  ↓
  Is Redis Cluster needed for high throughput (>10000 req/s)?
  ↓
  YES → Redis Cluster with key sharding by connector namespace
  NO → Single Redis instance is sufficient
NO → Is this a local development environment?
  ↓
  YES → File or in-memory cache (zero infrastructure, simple config)
  NO → Is the application single-server in production?
    ↓
    YES → Redis is still recommended for cache stampede protection
    NO → Use file cache with caution; upgrade to Redis at first scale
  ↓
  Need cache tags for targeted invalidation?
  ↓
  YES → Redis is required (file cache does not support tags)
  NO → File cache with key-prefix invalidation is acceptable

---

## Rationale

Redis provides distributed consistency, atomic cache rebuild with locks, and tag-based invalidation. File cache is simpler but lacks coordination across servers and stampede protection.

---

## Recommended Default

**Default:** Redis for production, file cache for local development
**Reason:** Production needs distributed state and lock support; file is zero-config for dev

---

## Risks Of Wrong Choice

File cache in multi-server deployment returns stale/divergent responses per server. Redis-only in single-server adds infrastructure cost with no distributed benefit.

---

## Related Rules

Set TTL Per Endpoint, Exclude Non-GET and Auth Requests from Caching

---

## Related Skills

Cache SaloonPHP Requests with the Cache Plugin

---

## TTL Configuration Strategy

---

## Decision Context

Determining cache duration per endpoint to balance freshness and performance.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Does the endpoint data change frequently (<60s)?
↓
YES → Is latency tolerance low (<100ms)?
  ↓
  YES → Short TTL (5-30s) with conditional caching (ETag) for validation
  NO → Skip caching entirely; always fetch fresh
NO → Is the data reference/static (pricing, product catalog)?
  ↓
  YES → Long TTL (3600-86400s) with background refresh pattern
  NO → Does the endpoint have different freshness needs per environment?
    ↓
    YES → Configure TTL per environment (short in dev, long in prod)
    NO → Set TTL per endpoint class via requestTtl() configuration
  ↓
  TTL longer than upstream cache headers?
  ↓
  YES → Respect upstream Cache-Control max-age as ceiling
  NO → TTL is safe; no risk of serving stale beyond upstream intent

---

## Rationale

Per-endpoint TTL matching data volatility maximizes hit rate without serving stale data. Conditional caching with ETag allows long TTL with on-demand validation.

---

## Recommended Default

**Default:** 3600s for reference data, 60s for transactional data, conditional caching when supported
**Reason:** Reference data is stable; transactional data needs freshness; ETag eliminates body transfer

---

## Risks Of Wrong Choice

Uniform TTL over-caches volatile data or under-caches static data. No ETag support wastes bandwidth on unchanged responses. Environment-agnostic TTL causes stale data in dev.

---

## Related Rules

Set TTL Per Endpoint, Not Per Connector, Enable Conditional Caching for ETag-Supporting APIs

---

## Related Skills

Cache SaloonPHP Requests with the Cache Plugin

---

## Cache Invalidation Strategy

---

## Decision Context

Choosing how to invalidate cached responses when upstream data changes.

---

## Decision Criteria

* performance
* architectural
* maintainability

---

## Decision Tree

Does the upstream API support webhooks for data change notifications?
↓
YES → Use webhook-triggered targeted cache invalidation
  ↓
  Are cache tags supported by the store?
  ↓
  YES → Tag-by-service and resource type; flush tags on webhook
  NO → Invalidate by specific cache key prefix per resource
NO → Is the data time-sensitive with known update schedule?
  ↓
  YES → Short TTL (60-600s) is sufficient; no explicit invalidation needed
  NO → Is manual cache flush acceptable for data updates?
    ↓
    YES → Add Artisan command for cache flush per service namespace
    NO → Implement stale-while-revalidate with background refresh
  ↓
  Need to flush all cache entries related to a mutation?
  ↓
  YES → Tag-based flush (Redis only) for precision
  NO → Flush entire connector namespace (coarse but simple)

---

## Rationale

Webhook-based invalidation provides the most timely cache freshness without TTL wait. Tag-based flushing from Redis is the most precise invalidation mechanism, clearing only related entries.

---

## Recommended Default

**Default:** Short TTL + webhook-based targeted invalidation when available
**Reason:** Webhooks provide immediate freshness; short TTL is safety net when webhooks miss

---

## Risks Of Wrong Choice

Full cache flush on every mutation causes a spike of cache misses and upstream load. No webhook invalidation serves stale data until TTL expires, causing data inconsistency.

---

## Related Rules

Implement Targeted Cache Invalidation via Webhooks

---

## Related Skills

Cache SaloonPHP Requests with the Cache Plugin

---

## Conditional Caching Decision

---

## Decision Context

Choosing whether to enable conditional caching (ETag/Last-Modified) to reduce bandwidth.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Does the upstream API return ETag or Last-Modified headers?
↓
YES → Enable conditional caching on the cache plugin
  ↓
  Is bandwidth cost or API response size significant (>100KB)?
  ↓
  YES → Conditional caching provides 90%+ bandwidth savings
  NO → Conditional caching still reduces latency; enable anyway
NO → Does the API support If-None-Match or If-Modified-Since?
  ↓
  YES → Enable conditional caching even without explicit ETag
  NO → Skip conditional caching; standard TTL-only caching
  ↓
  Need to cache responses longer than upstream considers fresh?
  ↓
  YES → Conditional caching allows long TTL with freshness validation
  NO → Standard TTL is sufficient; conditional adds no benefit

---

## Rationale

Conditional caching stores the ETag/Last-Modified with the cached response. On subsequent requests, it sends the header upstream and receives a lightweight 304 response when data hasn't changed, eliminating full response body transfer.

---

## Recommended Default

**Default:** Enable conditional caching when API supports ETag headers
**Reason:** Eliminates bandwidth for unchanged responses with zero application code change

---

## Risks Of Wrong Choice

Skipping conditional caching on supported APIs wastes bandwidth (90%+ for unchanged data) and increases latency. Enabling it on ETag-unsupported APIs has no effect but adds no harm.

---

## Related Rules

Enable Conditional Caching for ETag-Supporting APIs

---

## Related Skills

Cache SaloonPHP Requests with the Cache Plugin
