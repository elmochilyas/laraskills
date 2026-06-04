# 5-4 Tenant Resolution Strategies - Decision Trees

## Tenant Resolution Method: Subdomain vs Domain vs Header vs Auth

---

## Decision Context

Choosing how to identify the current tenant for each request — subdomain, custom domain, HTTP header, JWT claim, or authenticated user relationship.

---

## Decision Criteria

* performance: all methods are fast (DNS lookup cached, header parsed instantly)
* architectural: subdomain/domain require DNS setup; header works for APIs only
* maintainability: auth-based is simplest for single-tenant-per-user
* security: header-based resolution must validate tenant access rights

---

## Decision Tree

Which tenant resolution strategy?

↓

API-only application?

YES → Header-based (X-Tenant-ID) or JWT claim

    ↓
    Client sends X-Tenant-ID in request header
    Or JWT includes tenant_id claim
    No DNS dependency — works for all environments
    
    ↓
    Validate: user has access to the declared tenant
    Never trust the header alone — verify authorization
    Cache resolved tenant in request scope

NO → Web application with browser users?

    YES → Single tenant per user?
    
        YES → Auth-based resolution
        
            ↓
        tenant_id derived from auth()->user()->tenant_id
        Simplest — no URL parsing needed
        User is inherently scoped to one tenant
        
        NO → Subdomain-based resolution
        
            ↓
        Parse subdomain from request host: tenant1.saas.com
        Look up tenant by subdomain in tenants table
        Cache tenant lookup (Redis, app cache)
        
        ↓
        Pros: Clean URLs, DNS-driven routing
        Cons: Requires wildcard DNS, subdomain management

NO → White-label product per customer?

    → Custom domain resolution
    Customer points their domain (CNAME/acme.com → saas.com)
    Verify DNS ownership before activating
    Parse Host header to identify tenant
    Requires SSL certificate per domain

---

## Recommended Default

**Default:** Subdomain resolution for web apps; header/JWT for APIs; auth-based for single-tenant-per-user
**Reason:** Subdomain provides clean UX with DNS-driven routing. Header resolution is simpler for APIs. Auth resolution is simplest when each user belongs to exactly one tenant.

---

## Resolution Caching Strategy

---

## Decision Context

Caching tenant resolution results to avoid repeated database lookups for the same tenant within and across requests.

---

## Decision Criteria

* performance: tenant resolution is ~5-50ms DB query; caching reduces to ~1ms
* architectural: cache in request scope (in-memory) and across requests (Redis)
* maintainability: cache invalidation on tenant config changes
* security: never cache tenant resolution failures — force re-resolve

---

## Decision Tree

How to cache tenant resolution?

↓

Within a single request?

YES → Cache in request scope (in-memory)

    ↓
    Resolve tenant in middleware
    Store in app(CurrentTenant) singleton
    All subsequent code uses the cached instance
    No cache invalidation needed within request

NO → Across requests (same tenant, same data)?

    YES → Cache in Redis with TTL
        
        ↓
    Cache tenant ID by subdomain/domain key
    TTL: 300-600 seconds (adjustable)
    Invalidate on tenant config changes (webhook or event)
    
    ↓
    Cache includes: tenant_id, database config, feature flags
    Cache miss: resolve from DB, populate cache
    Cache hit: instant resolution

NO → Failed resolution?

    → NEVER cache failures
    If tenant DNS/domain lookup fails, re-resolve on next request
    Caching failures would permanently lock out tenants
    Only cache successful resolutions

---

## Recommended Default

**Default:** Request-scoped in-memory cache + Redis with 300s TTL for cross-request caching
**Reason:** Request-scoped cache eliminates duplicate lookups within the same request. Redis cache speeds up consecutive requests from the same tenant.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Tenant Resolution Strategies
* Implement Tenant-Aware Middleware
