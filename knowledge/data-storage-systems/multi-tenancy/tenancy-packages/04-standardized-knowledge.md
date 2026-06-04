# 5-24 Tenancy Packages

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-24 |
| Knowledge Unit Title | Tenancy Packages |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 5.1 Shared-table | 5.2 Schema-per-tenant | 5.3 DB-per-tenant |
| Last Updated | 2026-06-02 |

## Overview

stancl/tenancy is the most mature multi-tenancy package for Laravel (6K+ stars). Supports all isolation models, queue tenant-awareness, Redis tenant isolation, filesystem isolation. spatie/laravel-multitenancy is simpler, more opinionated, focused on shared-table with global scopes. Both handle tenant resolution, connection switching, and migration orchestration.

---

## Core Concepts

- **stancl/tenancy**: Full-featured. Supports single DB, schema, DB-per-tenant. Built-in tenant middleware, commands, queue awareness. Central database for tenant management. Customizable identification via domain, subdomain, path, header, or UUID.
- **spatie/laravel-multitenancy**: Lightweight. Shared-table model with global scopes. Tenant via authenticated user. Minimal configuration. Good for simple SaaS where every user belongs to a tenant.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **stancl/tenancy for complex isolation**: Needs schema-per-tenant, DB-per-tenant, custom domain support, or per-tenant Redis. The package handles migration orchestration and queue context.
- **spatie/multitenancy for simple SaaS**: Each user is in one tenant. Shared-table isolation. No custom domains. Minimal learning curve.


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
| 1 | stancl/tenancy without understanding the internals**: "The package handles everything" — but without understanding how tenant resolution, connection switching, and scope application work, debugging leaks is impossible. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

