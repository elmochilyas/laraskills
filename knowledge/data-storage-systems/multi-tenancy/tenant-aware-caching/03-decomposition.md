# Decomposition: 5.30 Tenant-aware caching (cache prefix isolation)

## Topic Overview
Cache keys in multi-tenant systems must be scoped per tenant to prevent cache collisions and data leaks. Use a tenant-specific cache prefix (e.g., `cache:tenant_{id}:`). All cache operations automatically prepend the prefix.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-30-tenant-aware-caching/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.30 Tenant-aware caching (cache prefix isolation)
- **Purpose:** Cache keys in multi-tenant systems must be scoped per tenant to prevent cache collisions and data leaks. Use a tenant-specific cache prefix (e.g., `cache:tenant_{id}:`).
- **Difficulty:** Advanced
- **Dependencies:** 5.4 Tenant resolution, 5.6 Tenant middleware, 5.13 Connection caching

## Dependency Graph
**Depends on:** "5.4 Tenant resolution", "5.6 Tenant middleware", "5.13 Connection caching"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Cache prefix**: `config('cache.prefix')` set dynamically: `'cache_'.$tenant->id`. Applied to all cache keys created during this request.; - **Key collision without prefix**: Two tenants cache `user_42`. Without prefix, tenant A retrieves tenant B's cached user data.; - **Tagged cache**: `Cache::tags(['orders', 'tenant:'.$tenantId])` — cache tags scoped per tenant. Flush per tenant..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization