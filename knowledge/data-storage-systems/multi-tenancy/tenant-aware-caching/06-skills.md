# Skill: Implement Tenant-Aware Caching

## Purpose

Prevent cache collisions and data leaks in multi-tenant systems by scoping cache keys per tenant using prefixes or tags.

## When To Use

- Any multi-tenant application using cache
- Cache may contain tenant-scoped data (model caches, query results, views)
- Preventing tenant A from receiving tenant B's cached data

## When NOT To Use

- Cache contains only global data (no tenant-specific keys)
- Single-tenant application
- Cache is not used in the application

## Prerequisites

- Cache driver configured (Redis, Memcached, file, database)
- Tenant resolution middleware
- Understanding of cache key naming

## Inputs

- Cache configuration
- Tenant ID for prefix/tag resolution
- Cache key naming convention

## Workflow (numbered steps)

1. Choose isolation approach:
   - Prefix: set `config('cache.prefix')` dynamically: `'cache_'.$tenant->id`
   - Tags: `Cache::tags(['tenant:'.$tenantId, 'orders'])->get('report')`
   - Per-tenant Redis database: `config('database.redis.options.database')` per tenant
2. For prefix approach, configure cache prefix in middleware after tenant resolution
3. For tags approach, always include tenant tag when caching and retrieving
4. Flush cache on tenant data changes: `Cache::tags(['tenant:'.$tenantId])->flush()`
5. For global cache (shared across tenants), use a separate cache store or no prefix
6. Test cache isolation: Tenant A's cached data must not be accessible by Tenant B

## Validation Checklist

- [ ] Cache keys scoped per tenant
- [ ] Tenant A cannot retrieve Tenant B's cached data
- [ ] Cache flush works per tenant (doesn't affect other tenants)
- [ ] Global cache still accessible across tenants

## Common Failures

- Cache prefix not set before cache is accessed in request lifecycle
- Cache tags not supported by configured cache driver (file, database)
- Cache key collision when two tenants have same key without prefix
- Cache invalidation flushes all tenants' data (not scoped)

## Decision Points

- Cache prefix vs tags vs per-tenant Redis database
- Per-tenant flush strategy: prefix delete vs tag flush vs full flush
- Global cache separate from tenant cache

## Performance Considerations

- Prefix approach: no overhead (same cache operations)
- Tags approach: small overhead for tag management
- Per-tenant Redis database: Redis connection overhead per tenant

## Security Considerations

- Cached tenant data must be treated as sensitive (may contain PII)
- Cache keys must not expose tenant data structure
- Cache flush on tenant deactivation must be immediate

## Related Rules

- 5-30-1: Always Scope Cache Keys With Tenant ID
- 5-30-2: Never Cache Cross-Tenant Data In Tenant Cache

## Related Skills

- Implement Tenant-Aware Middleware
- Implement Tenant Connection Caching and Pooling
- Implement Cache Isolation Per Tenant

## Success Criteria

- Zero cache key collisions between tenants
- Tenant-specific cache flush works correctly
- Global cache accessible across all tenants
- Cache isolation verified with tests

---

# Skill: Configure Tenant-Specific Cache Prefix

## Purpose

Dynamically set the cache prefix per tenant so that all cache operations are automatically scoped to the current tenant.

## When To Use

- Cache prefix approach to tenant isolation
- Simple, automatic scoping without code changes per cache call
- Most cache drivers support prefix configuration

## When NOT To Use

- Cache tags provide better granularity (partial flush)
- Cache driver doesn't support per-connection prefix changes

## Prerequisites

- Cache configuration with prefix support
- Tenant middleware that runs before cache access

## Inputs

- Current tenant ID
- Cache store configuration
- Middleware pipeline order

## Workflow (numbered steps)

1. In tenant middleware (after tenant resolution), set cache prefix:
   `config(['cache.prefix' => 'tenant_'.$tenantId.'_'])`
2. Ensure middleware runs before any cache-accessing code
3. For multiple cache stores, set prefix per store:
   `config(['cache.stores.redis.prefix' => 'tenant_'.$tenantId.'_'])`
4. Cache keys now automatically include tenant prefix:
   `Cache::get('user_42')` → actual key: `tenant_123_user_42`
5. For global cache, use a separate store without tenant prefix
6. Flush per tenant: `Cache::store('tenant')->flush()` (flushes only tenant's keys if prefix is used)

## Validation Checklist

- [ ] Cache prefix set before any cache operation
- [ ] Tenant A and Tenant B with same key get different cached values
- [ ] Global cache works without tenant prefix
- [ ] Cache flush per tenant works correctly

## Common Failures

- Prefix set after middleware — cache operations before middleware use wrong prefix
- Prefix not reset between requests in Octane (stale tenant prefix)
- Global cache store also gets tenant prefix (keys miss)

## Decision Points

- Single cache store with dynamic prefix vs separate stores per tenant
- Global cache: same store without prefix vs separate store

## Performance Considerations

- Prefix approach adds zero overhead per cache operation
- Separate cache stores per tenant add connection overhead

## Security Considerations

- Cache prefix must include tenant ID to prevent collisions
- Cache keys must not reveal tenant-specific information

## Related Rules

- 5-30-1: Always Scope Cache Keys With Tenant ID

## Related Skills

- Implement Tenant-Aware Caching
- Implement Tenant-Aware Middleware
- Implement Tenant Cache Isolation

## Success Criteria

- All cache keys automatically scoped per tenant
- Zero cache collisions between tenants
- Global cache accessible across all tenants
- Cache isolation verified with tests
