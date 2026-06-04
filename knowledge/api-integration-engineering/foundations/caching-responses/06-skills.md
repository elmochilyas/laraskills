# Skill: Cache External API Responses to Reduce Latency and Costs

## Purpose
Cache external API responses with appropriate TTL, cache keys, and invalidation strategies to reduce latency, API call costs, and rate limit pressure.

## When To Use
- Frequently accessed, slowly changing external data
- API calls with per-request costs (credit-based pricing)
- Reducing rate limit pressure
- Improving response times for cached endpoints

## When NOT To Use
- Real-time data that changes frequently
- Mutating API calls (POST, PUT, DELETE)
- Authenticated/session-specific responses
- Sensitive data that should not be cached

## Prerequisites
- Laravel cache driver configured (Redis recommended)
- External API responses to cache

## Workflow
1. Identify cacheable endpoints (GET, idempotent, slowly changing)
2. Choose cache key strategy: normalize query params, include version
3. Set appropriate TTL based on data freshness requirements
4. Use `Cache::remember()` for read-through caching
5. Invalidate cache on webhook events or manual refresh
6. For SaloonPHP: use `saloon-cache-plugin` for automatic caching
7. Add cache hit/miss logging for observability
8. Implement cache stampede protection for high-traffic keys

## Validation Checklist
- [ ] Cacheable endpoints identified and configured
- [ ] Cache keys normalized (sorted params, no auth-specific keys)
- [ ] TTL set based on data freshness requirements
- [ ] Cache invalidation on relevant webhook events
- [ ] Cache hit/miss metrics logged
- [ ] Stampede protection for high-traffic cache keys
