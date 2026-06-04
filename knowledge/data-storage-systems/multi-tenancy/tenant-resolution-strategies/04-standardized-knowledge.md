# 5-4 Tenant Resolution Strategies

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-4 |
| Knowledge Unit Title | Tenant Resolution Strategies |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 5.5 Global scopes | 5.6 Tenant-aware middleware |
| Last Updated | 2026-06-02 |

## Overview

Tenant resolution identifies which tenant the current request belongs to. Strategies: domain (acme.app.com), subdomain (acme.saas.com), header (X-Tenant-ID), token (JWT claim), or authenticated user relationship. Chosen at middleware level, resolved once per request.

---

## Core Concepts

- **Subdomain resolution**: Parse `$request->getHost()`, extract subdomain. Match against tenants table. Fast, DNS-driven routing.
- **Domain resolution**: Custom domain per tenant. Requires domain verification (DNS record). CNAME or A record pointing to platform.
- **Header/token resolution**: For API-first SaaS. `X-Tenant-ID` header or tenant embedded in JWT. No DNS dependency.
- **Auth resolution**: Tenant derived from `auth()->user()->tenant_id`. Simplest for single-tenant-per-user models.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Middleware chain**: `IdentifyTenant` middleware resolves tenant, sets `app(CurrentTenant)`, scopes all subsequent queries.
- **Caching resolution**: Resolved tenant cached in request scope. Not persisted between requests.


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
| 1 | Resolving tenant in service layer**: Tenant resolution belongs in middleware. Resolving in controllers or services leads to duplication and inconsistent scoping. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

