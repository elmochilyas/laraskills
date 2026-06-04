# 5-30 Tenant Aware Caching - Decision Trees

## Cache Key Isolation: Prefix vs Tags vs Redis Database

---

## Decision Context

Choosing the mechanism for tenant cache key isolation to prevent cross-tenant cache collisions and data leaks.

---

## Decision Criteria

* performance: prefix adds minimal overhead; tags require tag storage
* architectural: prefix is simplest; Redis databases provide logical separation
* maintainability: dynamic prefix in middleware is easiest
* security: without isolation, cached data leaks between tenants

---

## Decision Tree

How to isolate cache keys?

↓

Using Redis?

YES → Dynamic cache prefix in config

    ↓
    config(['cache.prefix' => "app_{$tenantId}"]);
    Set in middleware after tenant resolution
    
    ↓
    All keys automatically prefixed:
    app_42:users:1, app_99:users:1 — isolated
    
    ↓
    Pro: Zero changes to cache calls
    Pro: Works with all cache drivers
    Pro: Prefix can be changed to flush all tenant keys

NO → Need per-tenant cache flushing?

    YES → Use cache tags
        
        ↓
        Cache::tags(['tenant:'.$tenantId])->put('key', $value, $ttl);
        Cache::tags(['tenant:'.$tenantId])->flush();
        
        ↓
        Tags enable flushing per tenant
        Requires: cache driver that supports tags (Redis, Memcached)
        
    NO → Simple file/database cache?
    
        → Include tenant_id in key name manually
        Cache::put("tenant_{$tenantId}_key", $value)
        No automatic prefix support
        Manual key management

---

## Recommended Default

**Default:** Dynamic cache prefix in middleware (`config('cache.prefix') = "app_{$tenantId}"`)
**Reason:** Zero application code changes. All cache operations automatically scoped. Works with any cache driver.

---

## Per-Tenant Cache Invalidation

---

## Decision Context

Invalidating cache entries for a specific tenant without affecting other tenants' cached data.

---

## Decision Criteria

* performance: per-tenant flush is faster than global flush
* architectural: prefix-based isolation enables targeted flushing
* maintainability: add cache invalidation to tenant lifecycle events
* security: flushing one tenant must not leak another's data

---

## Decision Tree

Need to clear tenant's cached data?

↓

Using cache tags?

YES → Flush tenant's tag

    ↓
    Cache::tags(['tenant:'.$tenantId])->flush();
    Only entries tagged with this tenant are removed
    Other tenants' cache unaffected

NO → Using cache prefix?

    YES → Delete keys by prefix pattern
        
        ↓
        Redis: eval "return redis.call('del', unpack(redis.call('keys', 'app_{$tenantId}:*')))" 0
        Memcached: must iterate keys (slower)
        
        ↓
        Warning: KEYS command is O(N) — use SCAN for production

NO → Need cache flush on tenant provisioning/removal?

    → Add event listener to tenant lifecycle
    On tenant create: warm cache
    On tenant delete: flush all cached keys
    On tenant update: flush relevant tags

---

## Recommended Default

**Default:** Cache tags with tenant-scoped flush; prefix-based deletion as fallback
**Reason:** Tags enable targeted flush without scanning all keys. Prefix pattern deletion works but is slower for large caches.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Tenant-Aware Caching
* Implement Tenant-Aware Middleware
