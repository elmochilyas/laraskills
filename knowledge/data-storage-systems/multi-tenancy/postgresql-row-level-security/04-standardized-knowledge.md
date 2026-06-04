# 5-14 Postgresql Row Level Security

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-14 |
| Knowledge Unit Title | Postgresql Row Level Security |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 5.5 Global scopes | 5.11 Cross-tenant leak prevention | 12.19 RLS policies |
| Last Updated | 2026-06-02 |

## Overview

PostgreSQL Row-Level Security (RLS) enforces tenant isolation at the database level. Even if an application bug bypasses the global scope, RLS policies block access to other tenants' rows. Enabled via `CREATE POLICY ... USING (tenant_id = current_setting('app.current_tenant')::bigint)`. Defense-in-depth layer that catches scope bypasses.

---

## Core Concepts

- **RLS policy**: `CREATE POLICY tenant_isolation ON orders FOR ALL USING (tenant_id = current_setting('app.current_tenant')::bigint)`. Applied to every row access.
- **app.current_tenant**: PostgreSQL session variable set per connection. Laravel sets it after connection: `DB::statement("SET app.current_tenant = ?", [$tenantId])`.
- **RLS impact on performance**: Each row access checks the policy. Overhead is small (microseconds per row) but measurable for bulk operations.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **RLS + global scope**: Global scope catches most leaks at app level. RLS catches any leak that reaches the database. Two independent layers.
- **Bulk operation bypass**: Use `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` for bulk operations. Re-enable after.


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
| 1 | RLS without app.current_tenant**: Policy compares against a NULL value — all rows are blocked. Always set the session variable before running queries. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | RLS on all tables**: RLS has overhead. Apply to tenant-scoped tables only. Tables in the central/public schema should not have RLS. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

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

