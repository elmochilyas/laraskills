# Response Caching for Read Operations — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Idempotency
- **Knowledge Unit:** Response Caching for Read Operations
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Laravel cache system and Redis basics
- [ ] Familiarity with cache stampede protection patterns
- [ ] Knowledge of cache tagging and group invalidation

## Implementation Checklist
- [ ] TTL configured per data type (proportional to change frequency)
- [ ] Cache tags used for group invalidation
- [ ] Stampede protection implemented (lock-based or probabilistic early expiration)
- [ ] Cache hit ratio monitored (target >90%)
- [ ] Fallback to stale cache on upstream failure
- [ ] Cache key convention documented and consistent (`{service}:{endpoint}:{params_hash}`)
- [ ] Cache layer in repository or service class (not controller level)

## Verification Checklist
- [ ] Stale-while-revalidate implemented for high-availability requirements
- [ ] Cache invalidation strategy prevents serving stale data forever
- [ ] Separate cache pool per upstream service

## Security Checklist
- [ ] No user-specific data over-cached (serving wrong user's data)
- [ ] Conditional requests (`If-Modified-Since` / `ETag`) for HTTP-level caching
- [ ] Cache doesn't expose sensitive data across tenants

## Performance Checklist
- [ ] Redis cache hit: ~1ms; Cache miss + upstream: ~100-500ms
- [ ] Cache tagging overhead: ~0.5ms per operation
- [ ] Stampede protection lock: ~1ms additional on miss

## Production Readiness Checklist
- [ ] Read-only GET endpoints cached with low change frequency
- [ ] Aggregate/dashboard endpoints with composite data cached
- [ ] Reference data cached (currency rates, product catalog, static config)
- [ ] Rate-limited upstream APIs cached to avoid hitting limits

## Common Mistakes to Avoid
- [ ] Avoid no cache invalidation strategy (serving stale data forever)
- [ ] Avoid cache stampede on popular keys (all requests hit DB/upstream)
- [ ] Avoid over-caching user-specific data (serving wrong user's data)
- [ ] Avoid too-long TTL for dynamic data
- [ ] Avoid caching without serialization awareness (JSON vs PHP objects)
- [ ] Avoid no monitoring of cache hit ratio
