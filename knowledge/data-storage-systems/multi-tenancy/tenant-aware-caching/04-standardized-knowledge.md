# 5-30 Tenant Aware Caching

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-30 |
| Knowledge Unit Title | Tenant Aware Caching |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 5.4 Tenant resolution | 5.6 Tenant middleware | 5.13 Connection caching |
| Last Updated | 2026-06-02 |

## Overview

Cache keys in multi-tenant systems must be scoped per tenant to prevent cache collisions and data leaks. Use a tenant-specific cache prefix (e.g., `cache:tenant_{id}:`). All cache operations automatically prepend the prefix. Redis, DynamoDB, and file caches all need tenant-aware key namespacing.

---

## Core Concepts

- **Cache prefix**: `config('cache.prefix')` set dynamically: `'cache_'.$tenant->id`. Applied to all cache keys created during this request.
- **Key collision without prefix**: Two tenants cache `user_42`. Without prefix, tenant A retrieves tenant B's cached user data.
- **Tagged cache**: `Cache::tags(['orders', 'tenant:'.$tenantId])` — cache tags scoped per tenant. Flush per tenant.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Dynamic cache prefix in middleware**: After tenant resolution, set `config('cache.prefix')` to `"app_{$tenant->id}"`. All subsequent cache operations use this prefix.
- **Per-tenant Redis database**: `config('database.redis.options.prefix')` set per tenant. Separate Redis database per tenant (Redis has 16 logical databases).


## Architecture Guidelines

- Shared-table: Low isolation, single connection, low complexity. Schema-per-tenant: Medium isolation, single connection, medium complexity. Database-per-tenant: High isolation, N connections, high complexity.

## Performance Considerations

- Connection count equals tenant count times connections per tenant. Pooling is essential for database-per-tenant. Shared-table queries must include tenant ID filters.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | No cache key isolation**: One tenant's cached data served to another tenant. Data leak via cache. Always prefix keys with tenant ID. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Cross-tenant data leaks when global scopes are bypassed. Tenant resolution failures expose all tenant data. Connection pool exhaustion from per-tenant connections. Migration drift between tenant databases.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Multi Tenancy Architecture
- **Closely Related**: Other KUs within Multi Tenancy Architecture
- **Advanced**: Expert-level KUs building on this concept
- **Cross-Domain**: Related topics from other subdomains in Data andamp; Storage Systems

## AI Agent Notes

- Apply these concepts based on specific implementation requirements
- Consider tradeoffs between different approaches
- Validate assumptions with actual measurements
- Review related KUs for additional context

## Verification

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Architecture decisions are documented with rationale
- [ ] Related KUs have been consulted for cross-cutting concerns

