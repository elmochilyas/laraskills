# Skill: Implement Tenant Resolution

## Purpose

Identify the current tenant from the incoming request using subdomain, domain, header, token, or authenticated user relationship.

## When To Use

- Every multi-tenant Laravel application
- Before any tenant-scoped query or connection switching occurs
- During middleware phase of request lifecycle

## When NOT To Use

- Single-tenant application
- Request does not require tenant context (login, registration, webhooks)

## Prerequisites

- Tenant registry (database or config)
- Understanding of Laravel middleware pipeline
- Multi-tenancy isolation model selected (shared-table, schema, DB)

## Inputs

- HTTP request (hostname, headers, authentication)
- Tenant registry table
- Resolution strategy: subdomain, domain, header, token, or auth

## Workflow (numbered steps)

1. Choose resolution strategy (subdomain is most common for web, header for API)
2. For subdomain: parse `$request->getHost()`, extract subdomain, query tenants table
3. For domain: query tenants table by custom domain, verify DNS
4. For header: read `X-Tenant-ID` or `X-Organization` from request headers
5. For auth: `$request->user()->tenant_id` for single-tenant-per-user model
6. Cache resolved tenant in `app(CurrentTenant::class)` singleton for request duration
7. If tenant not found, abort with 404 or redirect to tenant selection
8. Pass resolved tenant to subsequent middleware (connection switching, scoping)

## Validation Checklist

- [ ] Tenant resolved before any database query runs
- [ ] Unresolvable requests return appropriate error (404/401)
- [ ] Resolved tenant cached and accessible throughout request
- [ ] Resolution works for all route groups (web, api, artisan)

## Common Failures

- Tenant resolution runs after middleware that queries tenant data
- Subdomain parsing fails for `www` or apex domains
- Header spoofing allows cross-tenant access

## Decision Points

- Subdomain vs domain vs header vs auth-based resolution
- Single resolution strategy vs composite (try header, fall back to auth)

## Performance Considerations

- Tenant lookup query should be cached (Redis, < 5ms)
- DNS verification for custom domains is async (queue verification job)

## Security Considerations

- Never trust `X-Tenant-ID` without verifying the user has access to that tenant
- Validate that resolved tenant matches authenticated user's tenant membership
- Use signed URLs for tenant-specific links in emails

## Related Rules

- 5-4-1: Always Validate Tenant Membership
- 5-4-2: Never Trust Unowned Tenant Identifiers

## Related Skills

- Implement Tenant-Aware Middleware
- Implement Tenant Bootstrapper Pattern
- Implement Tenant Domains

## Success Criteria

- Tenant resolved in < 10ms per request
- Zero false-positive tenant matches
- All requests have valid tenant context before business logic executes

---

# Skill: Cache Tenant Resolution Results

## Purpose

Avoid repeated tenant lookups within the same request and across requests by caching the resolved tenant context.

## When To Use

- Every multi-tenant request — caching is mandatory, not optional
- Requests that reference the current tenant multiple times
- High-traffic applications where tenant lookup latency matters

## When NOT To Use

- Tenant data changes frequently within a single request (rare)
- Memory caching is insufficient (use Redis for shared cache)

## Prerequisites

- Tenant resolution middleware
- Cache driver configured (Redis, Memcached, or array)

## Inputs

- Resolved Tenant object (id, name, connection config, plan)
- Cache key strategy

## Workflow (numbered steps)

1. After resolving tenant, store in `app()->instance(CurrentTenant::class, $tenant)`
2. Use request-scoped singleton — no serialization needed
3. For cross-request caching, cache tenant lookup query result (key: `tenant:subdomain:{value}`, TTL: 3600s)
4. Invalidate cache when tenant configuration changes (plan change, deactivation)
5. In middleware, check request-scoped cache first before querying

## Validation Checklist

- [ ] Tenant context available throughout request via singleton
- [ ] Cache hit ratio > 99% for tenant lookups
- [ ] Cache invalidation works on tenant update

## Common Failures

- Request-scoped cache persists across requests in Octane (use request lifecycle, not app lifecycle)
- Cache stampede when many requests miss simultaneously

## Decision Points

- Request-scoped singleton vs shared cache (Redis)
- Cache TTL based on tenant data volatility

## Performance Considerations

- Request-scoped cache: zero overhead (in-memory)
- Redis cache: 1-3ms round trip

## Security Considerations

- Cached tenant data must not include credentials
- Clear cache when tenant is deactivated

## Related Rules

- 5-4-1: Always Validate Tenant Membership

## Related Skills

- Implement Tenant-Aware Middleware
- Implement Tenant Connection Caching and Pooling

## Success Criteria

- Tenant lookup executed at most once per request
- Cache hit ratio > 99.9% for tenant resolution queries
